// backend/routes/products.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken, isAdmin } from './authMiddleware.js';

const router = express.Router();

// 1) GET /api/products → público
router.get('/', async (_req, res) => {
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

// 2) GET /api/products/sabores → público
router.get('/sabores', async (_req, res) => {
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

// 3) GET /api/products/toppings → público
router.get('/toppings', async (_req, res) => {
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

// 4) GET /api/products/tamanos → público
router.get('/tamanos', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('tipo', 'tamano')
      .order('id_producto', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error('GET /products/tamanos error:', e);
    res.status(500).json({ error: 'No se pudieron cargar los tamaños.' });
  }
});

// 5) GET /api/products/:id → público
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id_producto', id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) {
    console.error(`GET /products/${id} error:`, e);
    res.status(500).json({ error: 'No se pudo cargar el producto.' });
  }
});

// 6) POST /api/products → ADMIN
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  const { nombre, tipo, precio, descripcion, alergenos, imagen_url, cantidad_disponible } = req.body;

  if (!nombre || !tipo || typeof precio !== 'number') {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const { data: prod, error } = await supabase
      .from('productos')
      .insert([{ nombre, tipo, precio, descripcion, alergenos, imagen_url }])
      .select()
      .single();
    if (error) throw error;

    // si viene cantidad_disponible, inicializamos inventario
    if (typeof cantidad_disponible === 'number') {
      const { error: invErr } = await supabase
        .from('inventario')
        .insert([{ id_producto: prod.id_producto, cantidad_disponible }]);
      if (invErr) console.error('Init inventario error:', invErr);
    }

    res.status(201).json(prod);
  } catch (e) {
    console.error('POST /products error:', e);
    res.status(500).json({ error: 'No se pudo crear el producto.' });
  }
});

// 7) PUT /api/products/:id → ADMIN
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre, tipo, precio, descripcion, alergenos, imagen_url, cantidad_disponible } = req.body;

  try {
    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (tipo !== undefined) updates.tipo = tipo;
    if (precio !== undefined) updates.precio = precio;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (alergenos !== undefined) updates.alergenos = alergenos;
    if (imagen_url !== undefined) updates.imagen_url = imagen_url;

    const { data: updatedProd, error: updateError } = await supabase
      .from('productos')
      .update(updates)
      .eq('id_producto', id)
      .select()
      .single();
    if (updateError) throw updateError;

    if (cantidad_disponible !== undefined) {
      const { error: invUpdateError } = await supabase
        .from('inventario')
        .update({ cantidad_disponible })
        .eq('id_producto', id);
      if (invUpdateError) console.error('Update inventario error:', invUpdateError);
    }

    res.json(updatedProd);
  } catch (e) {
    console.error(`PUT /products/${id} error:`, e);
    res.status(500).json({ error: 'No se pudo actualizar el producto.' });
  }
});

// 8) DELETE /api/products/:id → ADMIN
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
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
