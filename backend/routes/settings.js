import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_SCHEDULE = Object.freeze({ openHour: 10, closeHour: 22, minLeadMinutes: 30 });

router.get('/schedule', authenticateToken, isAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'schedule')
      .single();
    if (error && error.code !== 'PGRST116') return res.status(500).json({ message: 'No se pudo obtener el horario' });
    const v = data?.value || DEFAULT_SCHEDULE;
    const cfg = sanitize(v, true);
    res.json(cfg);
  } catch {
    res.status(500).json({ message: 'No se pudo obtener el horario' });
  }
});

router.put('/schedule', authenticateToken, isAdmin, async (req, res) => {
  try {
    const candidate = sanitize(req.body || {}, true);
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'schedule', value: candidate, updated_at: new Date().toISOString() });
    if (error) return res.status(500).json({ message: 'No se pudo guardar el horario' });
    res.json(candidate);
  } catch {
    res.status(500).json({ message: 'No se pudo guardar el horario' });
  }
});

function sanitize(input, fillDefaults = false) {
  const base = fillDefaults ? DEFAULT_SCHEDULE : DEFAULT_SCHEDULE;
  let open = Number.isFinite(input.openHour) ? Number(input.openHour) : base.openHour;
  let close = Number.isFinite(input.closeHour) ? Number(input.closeHour) : base.closeHour;
  let lead = Number.isFinite(input.minLeadMinutes) ? Math.floor(Number(input.minLeadMinutes)) : base.minLeadMinutes;
  open = Math.max(0, Math.min(23, open));
  close = Math.max(1, Math.min(24, close));
  lead = Math.max(0, Math.min(240, lead));
  if (open >= close) close = Math.min(24, open + 1);
  return { openHour: open, closeHour: close, minLeadMinutes: lead };
}

export default router;
