// backend/routes/inventory.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();

// Público: listado
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('inventario')
      .select('id_producto, cantidad_disponible, productos(nombre)')
      .order('id_producto', { ascending: true });
    if (error) {
      console.error('Error inventario:', error);
      return res.status(500).json({ error: 'Error al obtener inventario.' });
    }

    const inventory = (data || []).map(item => ({
      id_producto: item.id_producto,
      cantidad_disponible: item.cantidad_disponible,
      productName: item.productos?.nombre || '—'
    }));

    return res.json(inventory);
  } catch (err) {
    console.error('Error en GET /api/inventory:', err);
    return res.status(500).json({ error: 'Error interno al listar inventario.' });
  }
});

// Admin: actualizar stock
router.put('/:id_producto', authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id_producto, 10);
  const { cantidad_disponible } = req.body;

  if (typeof cantidad_disponible !== 'number' || cantidad_disponible < 0) {
    return res.status(400).json({ error: 'cantidad_disponible inválida.' });
  }

  try {
    const { data, error } = await supabase
      .from('inventario')
      .update({ cantidad_disponible })
      .eq('id_producto', id)
      .select()
      .single();

    if (error) {
      console.error(`Error actualizando inventario ${id}:`, error);
      return res.status(500).json({ error: 'Error al actualizar inventario.' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error en PUT /api/inventory/:id_producto:', err);
    return res.status(500).json({ error: 'Error interno al actualizar inventario.' });
  }
});

export default router;
