
// backend/routes/promotions.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();

// GET /api/promotions → lista todas las promociones
router.get('/', async (req, res) => {

  const { data, error } = await supabase.from('promociones').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/promotions/check?code=XXXX → valida un código promocional
router.get('/check', authenticateToken, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Código faltante' });

  const { data, error } = await supabase
    .from('promociones')
    .select('*')
    .ilike('codigo', code.trim())
    .maybeSingle();

  if (error || !data) return res.status(404).json({ error: 'Código no válido' });

  res.json(data);
});

// POST /api/promotions → solo admin, crear nueva promoción
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { codigo, descuento, descripcion } = req.body;
  if (!codigo || !descuento) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const { data, error } = await supabase
    .from('promociones')
    .insert([{ codigo, descuento, descripcion }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// DELETE /api/promotions/:id → elimina una promoción
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('promociones')
    .delete()
    .eq('id_promocion', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
