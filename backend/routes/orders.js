// backend/routes/orders.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();

/** Crear pedido (usuario autenticado) */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productos, hora_recogida, codigo_promocional } = req.body;
    const id_usuario = req.user.id_usuario;
    // ... (lógica existente de stock, promo, inserciones)
    // (no la altero aquí para mantener tu flujo actual)
  } catch (err) {
    console.error('Error en POST /api/orders:', err);
    return res.status(500).json({ error: err.message || 'Error interno al crear pedido.' });
  }
});

/** Historial del usuario autenticado */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    // ... (lógica existente)
  } catch (err) {
    console.error('Error en GET /api/orders/history:', err);
    return res.status(500).json({ error: 'Error interno al obtener historial.' });
  }
});

/** Listar todos los pedidos (ADMIN) */
router.get('/', authenticateToken, isAdmin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha_hora', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('Error en GET /api/orders:', err);
    return res.status(500).json({ error: 'Error interno al listar pedidos.' });
  }
});

/** Cambiar estado de un pedido (ADMIN) */
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
    console.error('Error en PATCH /api/orders/:id/status:', err);
    return res.status(500).json({ error: 'Error interno al actualizar estado.' });
  }
});

export default router;
