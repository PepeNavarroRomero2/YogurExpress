import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();
const sp = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_SCHEDULE = Object.freeze({ openHour: 10, closeHour: 22, minLeadMinutes: 30 });
const DEFAULT_LOYALTY  = Object.freeze({ earnRate: 1, pointsPerEuro: 10 });

/* ─────────── SCHEDULE ─────────── */
// GET: CUALQUIER usuario autenticado puede leer el horario
router.get('/schedule', authenticateToken, async (_req, res) => {
  try {
    const { data, error } = await sp
      .from('app_settings')
      .select('value')
      .eq('key', 'schedule')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[settings] read schedule error:', error);
      return res.status(500).json({ error: 'Error al leer configuración de horario.' });
    }

    const value = sanitizeSchedule(data?.value ?? DEFAULT_SCHEDULE, true);
    return res.json(value);
  } catch (err) {
    console.error('[settings] GET /schedule error:', err);
    return res.status(500).json({ error: 'Error interno al leer horario.' });
  }
});

// PUT: SOLO admin puede guardar
router.put('/schedule', authenticateToken, isAdmin, async (req, res) => {
  try {
    const next = sanitizeSchedule(req.body || {}, false);
    const { error } = await sp
      .from('app_settings')
      .upsert({ key: 'schedule', value: next }, { onConflict: 'key' });

    if (error) {
      console.error('[settings] write schedule error:', error);
      return res.status(500).json({ error: 'Error al guardar horario.' });
    }
    return res.json(next);
  } catch (err) {
    console.error('[settings] PUT /schedule error:', err);
    return res.status(500).json({ error: 'Error interno al guardar horario.' });
  }
});

/* ─────────── LOYALTY (Puntos) ─────────── */
// GET: cualquiera autenticado (el cliente necesita ver la regla)
router.get('/loyalty', authenticateToken, async (_req, res) => {
  try {
    const { data, error } = await sp
      .from('app_settings')
      .select('value')
      .eq('key', 'loyalty')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[settings] read loyalty error:', error);
      return res.status(500).json({ error: 'Error al leer configuración de puntos.' });
    }

    const value = sanitizeLoyalty(data?.value ?? DEFAULT_LOYALTY, true);
    return res.json(value);
  } catch (err) {
    console.error('[settings] GET /loyalty error:', err);
    return res.status(500).json({ error: 'Error interno al leer puntos.' });
  }
});

// PUT: solo admin
router.put('/loyalty', authenticateToken, isAdmin, async (req, res) => {
  try {
    const next = sanitizeLoyalty(req.body || {}, false);
    const { error } = await sp
      .from('app_settings')
      .upsert({ key: 'loyalty', value: next }, { onConflict: 'key' });

    if (error) {
      console.error('[settings] write loyalty error:', error);
      return res.status(500).json({ error: 'Error al guardar configuración de puntos.' });
    }
    return res.json(next);
  } catch (err) {
    console.error('[settings] PUT /loyalty error:', err);
    return res.status(500).json({ error: 'Error interno al guardar puntos.' });
  }
});

/* ─────────── Helpers ─────────── */
function sanitizeSchedule(input, fillDefaults = false) {
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

function sanitizeLoyalty(input, fillDefaults = false) {
  const base = fillDefaults ? DEFAULT_LOYALTY : DEFAULT_LOYALTY;
  let earn = Number.isFinite(input.earnRate) ? Number(input.earnRate) : base.earnRate;
  let ppe  = Number.isFinite(input.pointsPerEuro) ? Math.floor(Number(input.pointsPerEuro)) : base.pointsPerEuro;

  earn = Math.max(0, Math.min(100, earn));
  ppe  = Math.max(1, Math.min(10000, ppe));

  return { earnRate: earn, pointsPerEuro: ppe };
}

export default router;
