import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Client with service role for settings reads (app_settings)
const sp = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_SCHEDULE = Object.freeze({ openHour: 10, closeHour: 22, minLeadMinutes: 30 });
const DEFAULT_LOYALTY  = Object.freeze({ earnRate: 1, pointsPerEuro: 10 });

// ───────────────────────────────────────────────────────────
// Helpers: read settings
// ───────────────────────────────────────────────────────────
async function readSchedule() {
  const { data } = await sp.from('app_settings').select('value').eq('key', 'schedule').single();
  const v = data?.value || DEFAULT_SCHEDULE;
  return sanitizeSchedule(v);
}
async function readLoyalty() {
  const { data } = await sp.from('app_settings').select('value').eq('key', 'loyalty').single();
  const v = data?.value || DEFAULT_LOYALTY;
  return sanitizeLoyalty(v);
}
function sanitizeSchedule(input) {
  let open = Number.isFinite(input.openHour) ? Number(input.openHour) : DEFAULT_SCHEDULE.openHour;
  let close = Number.isFinite(input.closeHour) ? Number(input.closeHour) : DEFAULT_SCHEDULE.closeHour;
  let lead = Number.isFinite(input.minLeadMinutes) ? Math.floor(Number(input.minLeadMinutes)) : DEFAULT_SCHEDULE.minLeadMinutes;
  open = Math.max(0, Math.min(23, open));
  close = Math.max(1, Math.min(24, close));
  lead = Math.max(0, Math.min(240, lead));
  if (open >= close) close = Math.min(24, open + 1);
  return { openHour: open, closeHour: close, minLeadMinutes: lead };
}
function sanitizeLoyalty(input) {
  let earn = Number.isFinite(input.earnRate) ? Number(input.earnRate) : DEFAULT_LOYALTY.earnRate;
  let ppe  = Number.isFinite(input.pointsPerEuro) ? Math.floor(Number(input.pointsPerEuro)) : DEFAULT_LOYALTY.pointsPerEuro;
  earn = Math.max(0, Math.min(100, earn));
  ppe  = Math.max(1, Math.min(10000, ppe));
  return { earnRate: earn, pointsPerEuro: ppe };
}

// ───────────────────────────────────────────────────────────
// Utils
// ───────────────────────────────────────────────────────────
function nowInHours() {
  const d = new Date();
  return d.getHours() + d.getMinutes()/60;
}
function isStoreOpenNow(schedule) {
  const h = nowInHours();
  return h >= schedule.openHour && h < schedule.closeHour;
}
function ensurePickupValid(schedule, pickupIso) {
  if (!pickupIso) return 'Falta hora de recogida';
  const pick = new Date(pickupIso);
  if (isNaN(pick.getTime())) return 'Formato de hora de recogida inválido';
  const now = new Date();
  const diffMin = Math.floor((pick.getTime() - now.getTime())/60000);
  if (diffMin < schedule.minLeadMinutes) return 'La hora de recogida debe ser al menos dentro de ' + schedule.minLeadMinutes + ' minutos';
  const h = pick.getHours() + pick.getMinutes()/60;
  if (h < schedule.openHour || h >= schedule.closeHour) return 'La hora de recogida está fuera del horario de apertura';
  return null;
}
function buildOrderCode(row) {
  if (!row) return '';
  if (row.codigo_pedido) return row.codigo_pedido;
  if (row.id_pedido) return `PED-${String(row.id_pedido).padStart(6, '0')}`;
  if (row.codigo_unico) return `PED-${row.codigo_unico.toString().slice(0, 8).toUpperCase()}`;
  return '';
}
function fallbackOrderCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PED-${ts}-${rnd}`;
}

// ───────────────────────────────────────────────────────────
// GET /api/orders/history → historial del usuario autenticado
// ───────────────────────────────────────────────────────────
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { data, error } = await supabase
      .from('pedidos')
      .select('id_pedido, codigo_unico, fecha_hora, hora_recogida, estado, total')
      .eq('id_usuario', userId)
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('[orders] history error:', error);
      return res.status(500).json({ error: 'Error obteniendo historial de pedidos.' });
    }
    const mapped = (data || []).map(row => ({
      ...row,
      codigo_pedido: buildOrderCode(row)
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('[orders] GET /history error:', err);
    return res.status(500).json({ error: 'Error interno al obtener historial.' });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/orders/pending → pedidos para panel admin/cocina
// ───────────────────────────────────────────────────────────
router.get('/pending', authenticateToken, isAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id_pedido, codigo_unico, fecha_hora, hora_recogida, estado, total')
      .in('estado', ['pendiente', 'listo'])
      .order('fecha_hora', { ascending: true });

    if (error) {
      console.error('[orders] pending error:', error);
      return res.status(500).json({ error: 'Error obteniendo pedidos pendientes.' });
    }

    const mapped = (data || []).map(row => ({
      ...row,
      codigo_pedido: buildOrderCode(row)
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('[orders] GET /pending error:', err);
    return res.status(500).json({ error: 'Error interno al listar pedidos pendientes.' });
  }
});

// ───────────────────────────────────────────────────────────
// POST /api/orders  → crear pedido con puntos (flujo original)
// ───────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { productos, hora_recogida, puntos_usados } = req.body || {};

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío.' });
    }
    const schedule = await readSchedule();
    if (!isStoreOpenNow(schedule)) {
      return res.status(400).json({ error: 'La tienda está cerrada en este momento.' });
    }
    const pickupErr = ensurePickupValid(schedule, hora_recogida);
    if (pickupErr) return res.status(400).json({ error: pickupErr });

    // Leer reglas de puntos
    const loyalty = await readLoyalty();

    // 1) Cargar productos reales y calcular subtotal
    const ids = [...new Set(productos.map(p => p.id_producto))];
    const { data: prodRows, error: prodErr } = await supabase
      .from('productos')
      .select('id_producto, precio, nombre')
      .in('id_producto', ids);
    if (prodErr) {
      console.error('[orders] productos error:', prodErr);
      return res.status(500).json({ error: 'Error obteniendo productos.' });
    }
    // Map id->precio
    const priceMap = new Map(prodRows.map(r => [r.id_producto, Number(r.precio)]));
    let subtotal = 0;
    for (const item of productos) {
      const price = priceMap.get(item.id_producto);
      const qty = Math.max(1, Math.floor(Number(item.cantidad || 1)));
      if (!Number.isFinite(price)) {
        return res.status(400).json({ error: `Producto ${item.id_producto} no válido.` });
      }
      subtotal += price * qty;
    }
    subtotal = Math.round(subtotal * 100) / 100;

    // 2) Validar inventario
    const { data: invRows, error: invErr } = await supabase
      .from('inventario')
      .select('id_producto, cantidad_disponible')
      .in('id_producto', ids);
    if (invErr) {
      console.error('[orders] inventario error:', invErr);
      return res.status(500).json({ error: 'Error verificando inventario.' });
    }
    const invMap = new Map(invRows.map(r => [r.id_producto, Number(r.cantidad_disponible)]));
    for (const item of productos) {
      const have = invMap.get(item.id_producto) ?? 0;
      const qty = Math.max(1, Math.floor(Number(item.cantidad || 1)));
      if (have < qty) {
        return res.status(400).json({ error: `Sin stock suficiente para el producto ${item.id_producto}.` });
      }
    }

    // 3) Puntos: leer saldo y validar canje
    const { data: userRow, error: userErr } = await supabase
      .from('usuarios')
      .select('puntos')
      .eq('id_usuario', userId)
      .single();
    if (userErr) {
      console.error('[orders] usuario error:', userErr);
      return res.status(500).json({ error: 'Error obteniendo usuario.' });
    }
    const saldo = Number(userRow?.puntos || 0);
    const requested = Math.max(0, Math.floor(Number(puntos_usados || 0)));
    const maxBySaldo = saldo;
    const maxByTotal = Math.floor(subtotal * loyalty.pointsPerEuro);
    const puntosCanjeados = Math.min(requested, maxBySaldo, maxByTotal);
    const descuento = puntosCanjeados / loyalty.pointsPerEuro;

    // 4) Total y puntos ganados
    let total = Math.max(0, subtotal - descuento);
    total = Math.round(total * 100) / 100;
    const puntosGanados = Math.floor(total * loyalty.earnRate);

    // 5) Persistir pedido
    const { data: inserted, error: insErr } = await supabase
      .from('pedidos')
      .insert({
        id_usuario: userId,
        fecha_hora: new Date().toISOString(),
        hora_recogida,
        estado: 'pendiente',
        total
        // ❌ NO guardar "codigo" en codigo_unico (es UUID en tu BD)
        // codigo_unico: codigo
      })
      .select()
      .single();
    if (insErr) {
      console.error('[orders] insert pedido error:', insErr);
      return res.status(500).json({ error: 'Error creando el pedido.' });
    }

    const codigo = buildOrderCode(inserted) || fallbackOrderCode();

    // 6) Descontar inventario
    for (const item of productos) {
      const qty = Math.max(1, Math.floor(Number(item.cantidad || 1)));
      const { error: upErr } = await supabase.rpc('decrementar_inventario', {
        p_id_producto: item.id_producto,
        p_cantidad: qty
      });
      if (upErr) {
        // Si no hay función RPC, hacemos update clásico
        const { data: invData, error: invSelErr } = await supabase
          .from('inventario')
          .select('cantidad_disponible')
          .eq('id_producto', item.id_producto)
          .single();
        if (invSelErr) {
          console.error('[orders] inventario select err:', invSelErr);
          return res.status(500).json({ error: 'Error de inventario.' });
        }
        const next = Math.max(0, Number(invData.cantidad_disponible) - qty);
        const { error: invUpdErr } = await supabase
          .from('inventario')
          .update({ cantidad_disponible: next })
          .eq('id_producto', item.id_producto);
        if (invUpdErr) {
          console.error('[orders] inventario update err:', invUpdErr);
          return res.status(500).json({ error: 'Error actualizando inventario.' });
        }
      }
    }

    // 7) Actualizar puntos del usuario
    const nuevoSaldo = saldo - puntosCanjeados + puntosGanados;
    const { error: upUserErr } = await supabase
      .from('usuarios')
      .update({ puntos: nuevoSaldo })
      .eq('id_usuario', userId);
    if (upUserErr) {
      console.error('[orders] actualizar puntos error:', upUserErr);
    }

    return res.json({
      codigo_pedido: codigo,          // devolvemos el código humano generado
      puntos_ganados: puntosGanados,
      puntos_totales: nuevoSaldo,
      total
    });
  } catch (err) {
    console.error('[orders] POST / error:', err);
    return res.status(500).json({ error: 'Error interno al crear pedido.' });
  }
});

// ───────────────────────────────────────────────────────────
// POST /api/orders/after-paypal → crear pedido tras pago PayPal
// ───────────────────────────────────────────────────────────
router.post('/after-paypal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { productos, hora_recogida, puntos_usados = 0, paypalOrderId } = req.body || {};

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío.' });
    }
    if (!paypalOrderId) {
      return res.status(400).json({ error: 'Falta paypalOrderId.' });
    }

    const schedule = await readSchedule();
    if (!isStoreOpenNow(schedule)) {
      return res.status(400).json({ error: 'La tienda está cerrada en este momento.' });
    }
    const pickupErr = ensurePickupValid(schedule, hora_recogida);
    if (pickupErr) return res.status(400).json({ error: pickupErr });

    // Reglas de puntos
    const loyalty = await readLoyalty();

    // 1) Cargar productos reales y calcular subtotal
    const ids = [...new Set(productos.map(p => p.id_producto))];
    const { data: prodRows, error: prodErr } = await supabase
      .from('productos')
      .select('id_producto, precio, nombre')
      .in('id_producto', ids);
    if (prodErr) {
      console.error('[orders/after-paypal] productos error:', prodErr);
      return res.status(500).json({ error: 'Error obteniendo productos.' });
    }
    const priceMap = new Map(prodRows.map(r => [r.id_producto, Number(r.precio)]));
    let subtotal = 0;
    for (const item of productos) {
      const price = priceMap.get(item.id_producto);
      const qty = Math.max(1, Math.floor(Number(item.cantidad || 1)));
      if (!Number.isFinite(price)) {
        return res.status(400).json({ error: `Producto ${item.id_producto} no válido.` });
      }
      subtotal += price * qty;
    }
    subtotal = Math.round(subtotal * 100) / 100;

    // 2) Validar inventario
    const { data: invRows, error: invErr } = await supabase
      .from('inventario')
      .select('id_producto, cantidad_disponible')
      .in('id_producto', ids);
    if (invErr) {
      console.error('[orders/after-paypal] inventario error:', invErr);
      return res.status(500).json({ error: 'Error verificando inventario.' });
    }
    const invMap = new Map(invRows.map(r => [r.id_producto, Number(r.cantidad_disponible)]));
    for (const item of productos) {
      const have = invMap.get(item.id_producto) ?? 0;
      const qty = Math.max(1, Math.floor(Number(item.cantidad || 1)));
      if (have < qty) {
        return res.status(400).json({ error: `Sin stock suficiente para el producto ${item.id_producto}.` });
      }
    }

    // 3) Puntos
    const { data: userRow, error: userErr } = await supabase
      .from('usuarios')
      .select('puntos')
      .eq('id_usuario', userId)
      .single();
    if (userErr) {
      console.error('[orders/after-paypal] usuario error:', userErr);
      return res.status(500).json({ error: 'Error obteniendo usuario.' });
    }
    const saldo = Number(userRow?.puntos || 0);
    const requested = Math.max(0, Math.floor(Number(puntos_usados || 0)));
    const maxBySaldo = saldo;
    const maxByTotal = Math.floor(subtotal * loyalty.pointsPerEuro);
    const puntosCanjeados = Math.min(requested, maxBySaldo, maxByTotal);
    const descuento = puntosCanjeados / loyalty.pointsPerEuro;

    // 4) Total y puntos ganados
    let total = Math.max(0, subtotal - descuento);
    total = Math.round(total * 100) / 100;
    const puntosGanados = Math.floor(total * loyalty.earnRate);

    // 5) Crear pedido (pagado ya en PayPal)
    const { data: inserted, error: insErr } = await supabase
      .from('pedidos')
      .insert({
        id_usuario: userId,
        fecha_hora: new Date().toISOString(),
        hora_recogida,
        estado: 'pendiente',
        total
        // ❌ NO guardar "codigo" en codigo_unico (es UUID en tu BD)
        // codigo_unico: codigo
        // // si tuvieras columna estado_pago y quisieras marcarla: estado_pago: 'pagado'
      })
      .select()
      .single();
    if (insErr) {
      console.error('[orders/after-paypal] insert pedido error:', insErr);
      return res.status(500).json({ error: 'Error creando el pedido.' });
    }
    const idPedido = inserted.id_pedido;
    const codigo = buildOrderCode(inserted) || fallbackOrderCode();

    // 6) Insertar líneas (opcional pero recomendable)
    const lineas = productos.map(item => ({
      id_pedido: idPedido,
      id_producto: item.id_producto,
      cantidad: Math.max(1, Math.floor(Number(item.cantidad || 1))),
      precio_unit: priceMap.get(item.id_producto) ?? 0
    }));
    const { error: itemsErr } = await supabase.from('pedido_items').insert(lineas);
    if (itemsErr) {
      console.warn('[orders/after-paypal] insert pedido_items warning:', itemsErr.message);
    }

    // 7) Descontar inventario
    for (const item of productos) {
      const qty = Math.max(1, Math.floor(Number(item.cantidad || 1)));
      const { error: upErr } = await supabase.rpc('decrementar_inventario', {
        p_id_producto: item.id_producto,
        p_cantidad: qty
      });
      if (upErr) {
        // Fallback: update clásico
        const { data: invData, error: invSelErr } = await supabase
          .from('inventario')
          .select('cantidad_disponible')
          .eq('id_producto', item.id_producto)
          .single();
        if (invSelErr) {
          console.error('[orders/after-paypal] inventario select err:', invSelErr);
          return res.status(500).json({ error: 'Error de inventario.' });
        }
        const next = Math.max(0, Number(invData.cantidad_disponible) - qty);
        const { error: invUpdErr } = await supabase
          .from('inventario')
          .update({ cantidad_disponible: next })
          .eq('id_producto', item.id_producto);
        if (invUpdErr) {
          console.error('[orders/after-paypal] inventario update err:', invUpdErr);
          return res.status(500).json({ error: 'Error actualizando inventario.' });
        }
      }
    }

    // 8) Actualizar puntos del usuario
    const nuevoSaldo = saldo - puntosCanjeados + puntosGanados;
    const { error: upUserErr } = await supabase
      .from('usuarios')
      .update({ puntos: nuevoSaldo })
      .eq('id_usuario', userId);
    if (upUserErr) {
      console.error('[orders/after-paypal] actualizar puntos error:', upUserErr);
    }

    // 9) Enlazar pago con el pedido
    const { error: linkErr } = await supabase
      .from('pagos_paypal')
      .update({ id_pedido: idPedido })
      .eq('paypal_order_id', paypalOrderId);
    if (linkErr) {
      console.warn('[orders/after-paypal] link pago-pedido warning:', linkErr.message);
    }

    return res.json({
      codigo_pedido: codigo,  // devolvemos el código humano generado
      puntos_ganados: puntosGanados,
      puntos_totales: nuevoSaldo,
      total
    });
  } catch (err) {
    console.error('[orders] POST /after-paypal error:', err);
    return res.status(500).json({ error: 'No se pudo crear el pedido después del pago.' });
  }
});

// ───────────────────────────────────────────────────────────
// PATCH /api/orders/:id/status → admin cambia estado
// ───────────────────────────────────────────────────────────
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const allowed = new Set(['pendiente', 'completado', 'rechazado']);
    if (!allowed.has(status)) return res.status(400).json({ error: 'Estado no válido' });

    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: status })
      .eq('id_pedido', id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Error interno al actualizar estado.' });
  }
});

export default router;
