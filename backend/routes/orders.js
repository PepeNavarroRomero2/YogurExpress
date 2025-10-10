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
function genOrderCode() {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PED-${ts}-${rnd}`;
}

// ───────────────────────────────────────────────────────────
// POST /api/orders  → crear pedido con puntos
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
    const codigo = genOrderCode();
    const { data: inserted, error: insErr } = await supabase
      .from('pedidos')
      .insert({
        id_usuario: userId,
        fecha_hora: new Date().toISOString(),
        hora_recogida,
        estado: 'pendiente',
        total,
        codigo_unico: codigo
      })
      .select()
      .single();
    if (insErr) {
      console.error('[orders] insert pedido error:', insErr);
      return res.status(500).json({ error: 'Error creando el pedido.' });
    }

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
      // No revertimos pedido; devolvemos OK con datos consistentes.
    }

    return res.json({
      codigo_pedido: codigo,
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
// PATCH /api/orders/:id/status → admin cambia estado
// ───────────────────────────────────────────────────────────
router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const allowed = new Set(['pendiente', 'listo', 'completado', 'rechazado']);
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
