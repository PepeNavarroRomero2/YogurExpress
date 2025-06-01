const express = require('express');
const { supabase } = require('../lib/supabaseClient');

const router = express.Router();

/**
 * GET /api/products/sabores
 * Devuelve todos los productos con tipo = 'sabor'
 */
router.get('/sabores', async (req, res) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('tipo', 'sabor');

  if (error) return res.status(500).json({ error: 'No se pudieron cargar sabores' });
  res.json(data);
});

/**
 * GET /api/products/toppings
 * Devuelve todos los productos con tipo = 'topping'
 */
router.get('/toppings', async (req, res) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('tipo', 'topping');

  if (error) return res.status(500).json({ error: 'No se pudieron cargar toppings' });
  res.json(data);
});

/**
 * GET /api/products/tamanos
 * Devuelve todos los productos con tipo = 'tamaño'
 */
router.get('/tamanos', async (req, res) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('tipo', 'tamaño');

  if (error) return res.status(500).json({ error: 'No se pudieron cargar tamaños' });
  res.json(data);
});

module.exports = router;
