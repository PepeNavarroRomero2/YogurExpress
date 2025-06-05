// backend/routes/products.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

/**
 * GET /api/products/sabores
 * Devuelve todos los productos donde tipo = 'sabor'
 */
router.get('/sabores', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'sabor')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('GET /products/sabores error:', error);
    res.status(500).json({ error: 'No se pudieron cargar los sabores.' });
  }
});

/**
 * GET /api/products/toppings
 * Devuelve todos los productos donde tipo = 'topping'
 */
router.get('/toppings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'topping')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('GET /products/toppings error:', error);
    res.status(500).json({ error: 'No se pudieron cargar los toppings.' });
  }
});

/**
 * GET /api/products/tamanos
 * Devuelve todos los productos donde tipo = 'tamaño'
 */
router.get('/tamanos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'tamanos')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('GET /products/tamanos error:', error);
    res.status(500).json({ error: 'No se pudieron cargar los tamaños.' });
  }
});

export default router;
