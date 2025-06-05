// backend/routes/products.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// 1) GET /api/products → Todos los productos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET /products error:', e);
    res.status(500).json({ error: 'No se pudieron cargar los productos.' });
  }
});

// 2) GET /api/products/sabores → Solo tipo = 'sabor'
router.get('/sabores', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'sabor')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET /products/sabores error:', e);
    res.status(500).json({ error: 'No se pudieron cargar los sabores.' });
  }
});

// 3) GET /api/products/toppings → Solo tipo = 'topping'
router.get('/toppings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'topping')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET /products/toppings error:', e);
    res.status(500).json({ error: 'No se pudieron cargar los toppings.' });
  }
});

// 4) GET /api/products/tamanos → Solo tipo = 'tamanos'
router.get('/tamanos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'tamanos')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET /products/tamanos error:', e);
    res.status(500).json({ error: 'No se pudieron cargar los tamaños.' });
  }
});

// 5) GET /api/products/:id → Producto por ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id_producto', id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Producto no encontrado.' });
    res.json(data);
  } catch (e) {
    console.error(`GET /products/${id} error:`, e);
    res.status(500).json({ error: 'No se pudo cargar el producto.' });
  }
});

// 6) POST /api/products → Crea cualquier producto
router.post('/', async (req, res) => {
  try {
    const { nombre, tipo, precio, descripcion = '', alergenos = '', imagen_url = '' } = req.body;
    if (!nombre || !tipo || precio == null) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    const { data, error } = await supabase
      .from('productos')
      .insert([{ nombre, tipo, precio, descripcion, alergenos, imagen_url }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    console.error('POST /products error:', e);
    res.status(500).json({ error: 'No se pudo crear el producto.' });
  }
});

// 7) POST /api/products/toppings → Atajo: crea con tipo = 'topping'
router.post('/toppings', async (req, res) => {
  try {
    const { nombre, precio, descripcion = '', alergenos = '', imagen_url = '' } = req.body;
    if (!nombre || precio == null) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el topping.' });
    }
    const { data, error } = await supabase
      .from('productos')
      .insert([{ nombre, tipo: 'topping', precio, descripcion, alergenos, imagen_url }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) {
    console.error('POST /products/toppings error:', e);
    res.status(500).json({ error: 'No se pudo crear el topping.' });
  }
});

// 8) PUT /api/products/:id → Actualiza un producto existente
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { nombre, tipo, precio, descripcion, alergenos, imagen_url } = req.body;
    const { data: existing, error: getError } = await supabase
      .from('productos')
      .select('*')
      .eq('id_producto', id)
      .single();
    if (getError) throw getError;
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado.' });

    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (tipo !== undefined) updates.tipo = tipo;
    if (precio !== undefined) updates.precio = precio;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (alergenos !== undefined) updates.alergenos = alergenos;
    if (imagen_url !== undefined) updates.imagen_url = imagen_url;

    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id_producto', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(`PUT /products/${id} error:`, e);
    res.status(500).json({ error: 'No se pudo actualizar el producto.' });
  }
});

// 9) DELETE /api/products/:id → Elimina un producto
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', id);
    if (error) throw error;
    res.json({ message: 'Producto eliminado correctamente.' });
  } catch (e) {
    console.error(`DELETE /products/${id} error:`, e);
    res.status(500).json({ error: 'No se pudo eliminar el producto.' });
  }
});

export default router;
