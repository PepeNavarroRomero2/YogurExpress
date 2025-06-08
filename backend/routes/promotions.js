// backend/routes/promotions.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// GET /api/promotions → lista todas las promociones
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('promociones').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/promotions/check?code=XXXX → valida un código promocional
router.get('/check', async (req, res) => {
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

// POST /api/promotions → crear nueva promoción SIN autorización
router.post('/', async (req, res) => {
  const { codigo, descuento, descripcion } = req.body;
  if (!codigo || descuento == null) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const { data, error } = await supabase
    .from('promociones')
    .insert([{ codigo, descuento, descripcion }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// PUT /api/promotions/:id → actualizar promoción SIN autorización
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { codigo, descuento, descripcion } = req.body;
  if (!codigo || descuento == null) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const { data, error } = await supabase
    .from('promociones')
    .update({ codigo, descuento, descripcion })
    .eq('id_promocion', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Promoción no encontrada' });
  res.json(data[0]);
});

// DELETE /api/promotions/:id → elimina una promoción SIN autorización
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('promociones')
    .delete()
    .eq('id_promocion', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
