// backend/routes/promotions.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();

// Público
router.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('promociones').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Público: validar código
router.get('/check', async (req, res) => {
  const code = String(req.query.code || '').trim();
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  const { data, error } = await supabase
    .from('promociones')
    .select('*')
    .eq('codigo', code)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Código no válido' });

  res.json(data);
});

// Admin only
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { codigo, descuento, descripcion } = req.body;
  if (!codigo || descuento == null) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const { data, error } = await supabase
    .from('promociones')
    .insert([{ codigo, descuento, descripcion }])
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json(data);
});

router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { codigo, descuento, descripcion } = req.body;

  const { data, error } = await supabase
    .from('promociones')
    .update({ codigo, descuento, descripcion })
    .eq('id_promocion', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { error } = await supabase
    .from('promociones')
    .delete()
    .eq('id_promocion', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Promoción eliminada' });
});

export default router;
