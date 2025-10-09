import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const sp = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const DEFAULT_SCHEDULE = Object.freeze({ openHour: 10, closeHour: 22, minLeadMinutes: 30 });

async function readSchedule() {
  const { data } = await sp.from('app_settings').select('value').eq('key', 'schedule').single();
  const v = data?.value || DEFAULT_SCHEDULE;
  return sanitize(v);
}
function sanitize(input) {
  let open = Number.isFinite(input.openHour) ? Number(input.openHour) : 10;
  let close = Number.isFinite(input.closeHour) ? Number(input.closeHour) : 22;
  let lead = Number.isFinite(input.minLeadMinutes) ? Math.floor(Number(input.minLeadMinutes)) : 30;
  open = Math.max(0, Math.min(23, open));
  close = Math.max(1, Math.min(24, close));
  lead = Math.max(0, Math.min(240, lead));
  if (open >= close) close = Math.min(24, open + 1);
  return { openHour: open, closeHour: close, minLeadMinutes: lead };
}
function isOpenAt(date, schedule) {
  const d = new Date(date);
  const open = new Date(d); open.setHours(schedule.openHour, 0, 0, 0);
  const close = new Date(d); close.setHours(schedule.closeHour, 0, 0, 0);
  return d >= open && d <= close;
}
function todayAt(hhmm) {
  const [hh, mm] = String(hhmm).split(':').map(Number);
  const d = new Date();
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
}

router.post('/', authenticateToken, async (req, res) => {
  try {
    const schedule = await readSchedule();
    if (!isOpenAt(new Date(), schedule)) {
      return res.status(400).json({ code: 'store_closed_now', message: `Estamos cerrados actualmente. Horario ${String(schedule.openHour).padStart(2,'0')}:00–${String(schedule.closeHour).padStart(2,'0')}:00.` });
    }
    let pickupAt;
    if (req.body && req.body.pickupAt) {
      const d = new Date(req.body.pickupAt);
      if (isNaN(d.getTime())) return res.status(400).json({ code: 'bad_pickup', message: 'pickupAt inválido' });
      pickupAt = d;
    } else if (req.body && req.body.pickupTime) {
      pickupAt = todayAt(req.body.pickupTime);
    } else if (req.body && req.body.hora_recogida) {
      pickupAt = todayAt(req.body.hora_recogida);
    } else {
      return res.status(400).json({ code: 'missing_pickup', message: 'Falta hora de recogida' });
    }
    const minAllowed = new Date(Date.now() + schedule.minLeadMinutes * 60000);
    if (pickupAt < minAllowed) {
      return res.status(400).json({ code: 'pickup_too_soon', message: `La recogida debe ser al menos dentro de ${schedule.minLeadMinutes} minutos.` });
    }
    if (!isOpenAt(pickupAt, schedule)) {
      return res.status(400).json({ code: 'pickup_out_of_schedule', message: `Fuera de horario. Apertura ${String(schedule.openHour).padStart(2,'0')}:00 a ${String(schedule.closeHour).padStart(2,'0')}:00.` });
    }

    const { productos, hora_recogida, codigo_promocional } = req.body;
    const id_usuario = req.user.id_usuario;

    return res.status(501).json({ error: 'Crear pedido no implementado en este archivo. Inserta aquí tu lógica existente y utiliza pickupAt.toISOString() para persistir la hora.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno al crear pedido.' });
  }
});

router.patch('/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
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
