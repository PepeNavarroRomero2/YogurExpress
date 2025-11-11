import express from 'express';
import { supabase } from '../lib/supabaseClient.js'; // ← FIX: import nombrado

import { createOrder, captureOrder } from '../lib/paypal.js';

const router = express.Router();
const CURRENCY = process.env.CURRENCY || 'EUR';

/** Total desde pedido (pedido_items * precio_unit) */
async function totalDesdePedido(pedidoId) {
  if (!pedidoId) throw new Error('pedidoId requerido');

  const { data: items, error } = await supabase
    .from('pedido_items')
    .select('cantidad, precio_unit')
    .eq('id_pedido', pedidoId);

  if (error) throw new Error('DB error pedido_items: ' + error.message);
  if (!items || items.length === 0) throw new Error('Pedido sin líneas');

  let amount = 0;
  for (const it of items) {
    amount += Number(it.cantidad || 0) * Number(it.precio_unit || 0);
  }
  return Number(amount.toFixed(2));
}

/** Total desde items del carrito (precio actual en productos) */
async function totalDesdeItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items vacío');

  const ids = [...new Set(items.map(i => i.productId))];
  const { data: products, error } = await supabase
    .from('productos')
    .select('id_producto, precio')
    .in('id_producto', ids);

  if (error) throw new Error('DB error productos: ' + error.message);

  const map = new Map((products || []).map(p => [p.id_producto, Number(p.precio || 0)]));

  let amount = 0;
  for (const it of items) {
    const price = map.get(it.productId);
    if (price == null) throw new Error(`Producto ${it.productId} no encontrado`);
    amount += Number(it.qty || 0) * price;
  }
  return Number(amount.toFixed(2));
}

/** Aplica descuento por puntos de forma segura */
function aplicarDescuentoPorPuntos(amount, puntos_usados, pointsPerEuro) {
  const ppe = Number(pointsPerEuro || 10);
  const usados = Math.max(0, Math.floor(Number(puntos_usados || 0)));
  const descuento = usados / (ppe || 10);
  const final = Math.max(0, Number((amount - descuento).toFixed(2)));
  return { final, descuento };
}

/** Config para cargar el SDK desde el front */
router.get('/config', (_req, res) => {
  res.json({
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    currency: CURRENCY,
    env: (process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox')
  });
});

/** Crea orden en PayPal y registra CREATED en pagos_paypal
 * body: { pedidoId?: number, items?: [{productId, qty}], description?: string, puntos_usados?: number, pointsPerEuro?: number }
 */
router.post('/orders', async (req, res) => {
  try {
    const { pedidoId, items, description, puntos_usados, pointsPerEuro } = req.body ?? {};

    // 1) Base: total desde pedido o items
    const bruto = pedidoId
      ? await totalDesdePedido(pedidoId)
      : await totalDesdeItems(items);

    // 2) Descuento por puntos (coherente con tu pantalla)
    const { final: amount /*, descuento*/ } = aplicarDescuentoPorPuntos(bruto, puntos_usados, pointsPerEuro);

    // 3) Crear orden en PayPal
    const customId = pedidoId ? String(pedidoId) : `guest-${Date.now()}`;
    const order = await createOrder({
      amount,
      currency: CURRENCY,
      customId,
      description
    });

    // 4) Persistir CREATED
    const { error: insErr } = await supabase.from('pagos_paypal').insert({
      id_pedido: pedidoId ?? null,
      paypal_order_id: order.id,
      status: 'CREATED',
      amount,
      currency: CURRENCY,
      raw: order
    });
    if (insErr) console.warn('[paypal] insert CREATED error:', insErr.message);

    res.json({ id: order.id });
  } catch (e) {
    console.error('[paypal/orders]', e);
    res.status(400).json({ message: e?.message || 'No se pudo crear la orden' });
  }
});

/** Captura la orden y, si sabemos el pedido, lo marca como pagado */
router.post('/orders/:id/capture', async (req, res) => {
  try {
    const orderId = req.params.id;
    const result = await captureOrder(orderId);

    const status = result?.status;         // p.ej. COMPLETED
    const pu = result?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    const captureId = cap?.id ?? null;
    const amountStr = cap?.amount?.value ?? pu?.amount?.value ?? '0.00';
    const currency = cap?.amount?.currency_code ?? pu?.amount?.currency_code ?? CURRENCY;
    const payerEmail = result?.payer?.email_address ?? null;
    const payerId = result?.payer?.payer_id ?? null;
    const amount = Number.parseFloat(amountStr || '0');

    // ¿Tenemos ya el pedido enlazado a esta orden?
    const { data: existing, error: selErr } = await supabase
      .from('pagos_paypal')
      .select('id_pedido')
      .eq('paypal_order_id', orderId)
      .maybeSingle();

    if (selErr) console.warn('[paypal] select pagos_paypal error:', selErr.message);
    const id_pedido = existing?.id_pedido ?? null;

    // Upsert del pago
    const { error: upErr } = await supabase.from('pagos_paypal').upsert({
      id_pedido,
      paypal_order_id: orderId,
      paypal_capture_id: captureId,
      status, amount, currency,
      payer_email: payerEmail,
      payer_id: payerId,
      raw: result
    }, { onConflict: 'paypal_order_id' });
    if (upErr) console.warn('[paypal] upsert pagos_paypal error:', upErr.message);

    // Si conocemos el pedido y está COMPLETED → marcar como pagado
    if (id_pedido && status === 'COMPLETED') {
      const { error: updErr } = await supabase
        .from('pedidos')
        .update({ estado_pago: 'pagado' })
        .eq('id_pedido', id_pedido);
      if (updErr) console.warn('[paypal] update pedidos.estado_pago error:', updErr.message);
    }

    res.json({ status, captureId, orderId });
  } catch (e) {
    console.error('[paypal/capture]', e);
    res.status(400).json({ message: e?.message || 'No se pudo capturar la orden' });
  }
});

/** Enlaza un pago a un pedido si creas el pedido después de pagar (opcional) */
router.post('/link-order', async (req, res) => {
  try {
    const { paypalOrderId, pedidoId } = req.body ?? {};
    if (!paypalOrderId || !pedidoId) throw new Error('paypalOrderId y pedidoId son obligatorios');

    const { data: pago, error: selErr } = await supabase
      .from('pagos_paypal')
      .select('status')
      .eq('paypal_order_id', paypalOrderId)
      .maybeSingle();

    if (selErr) throw new Error('No se pudo leer pago PayPal: ' + selErr.message);
    if (!pago) throw new Error('Pago PayPal no encontrado');

    const { error: updPay } = await supabase
      .from('pagos_paypal')
      .update({ id_pedido: pedidoId })
      .eq('paypal_order_id', paypalOrderId);
    if (updPay) throw new Error('No se pudo enlazar pago con pedido: ' + updPay.message);

    if (pago.status === 'COMPLETED') {
      const { error: updPed } = await supabase
        .from('pedidos')
        .update({ estado_pago: 'pagado' })
        .eq('id_pedido', pedidoId);
      if (updPed) throw new Error('No se pudo actualizar estado del pedido: ' + updPed.message);
    }

    res.json({ linked: true });
  } catch (e) {
    console.error('[paypal/link-order]', e);
    res.status(400).json({ message: e?.message || 'No se pudo enlazar el pago' });
  }
});

export default router;
