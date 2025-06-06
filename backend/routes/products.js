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

// 6) POST /api/products → Crea cualquier producto y registra en inventario
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      tipo,
      precio,
      descripcion = '',
      alergenos = '',
      imagen_url = '',
      cantidad_disponible = 0
    } = req.body;

    // Validaciones mínimas
    if (!nombre || !tipo || precio == null) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    // 1) Insertar en tabla "productos"
    const { data: prodData, error: prodError } = await supabase
      .from('productos')
      .insert([{ nombre, tipo, precio, descripcion, alergenos, imagen_url }])
      .select()
      .single();

    if (prodError) {
      console.error('[Supabase] Error insertando producto:', prodError);
      return res.status(500).json({ error: 'No se pudo crear el producto.' });
    }

    const nuevoId = prodData.id_producto;

    // 2) Insertar en tabla "inventario" con la cantidad dada (o 0)
    const { error: invError } = await supabase
      .from('inventario')
      .insert([{ id_producto: nuevoId, cantidad_disponible }]);

    if (invError) {
      console.error(
        `[Supabase] Error creando inventario para producto ${nuevoId}:`,
        invError
      );
      // Si falla inventario, devolvemos 500. El producto ya está creado en "productos".
      return res
        .status(500)
        .json({ error: 'Producto creado, pero falló la creación del inventario.' });
    }

    // 3) Devolver el producto recién creado
    return res.status(201).json(prodData);
  } catch (e) {
    console.error('POST /products error:', e);
    res.status(500).json({ error: 'No se pudo crear el producto.' });
  }
});

// 7) POST /api/products/toppings → Atajo: crea con tipo = 'topping' y registra en inventario
router.post('/toppings', async (req, res) => {
  try {
    const {
      nombre,
      precio,
      descripcion = '',
      alergenos = '',
      imagen_url = '',
      cantidad_disponible = 0
    } = req.body;

    if (!nombre || precio == null) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el topping.' });
    }

    // 1) Insertar en tabla "productos" con tipo 'topping'
    const { data: prodData, error: prodError } = await supabase
      .from('productos')
      .insert([{ nombre, tipo: 'topping', precio, descripcion, alergenos, imagen_url }])
      .select()
      .single();

    if (prodError) {
      console.error('[Supabase] Error insertando topping:', prodError);
      return res.status(500).json({ error: 'No se pudo crear el topping.' });
    }

    const nuevoId = prodData.id_producto;

    // 2) Insertar en tabla "inventario"
    const { error: invError } = await supabase
      .from('inventario')
      .insert([{ id_producto: nuevoId, cantidad_disponible }]);

    if (invError) {
      console.error(
        `[Supabase] Error creando inventario para topping ${nuevoId}:`,
        invError
      );
      return res
        .status(500)
        .json({ error: 'Topping creado, pero falló la creación del inventario.' });
    }

    return res.status(201).json(prodData);
  } catch (e) {
    console.error('POST /products/toppings error:', e);
    res.status(500).json({ error: 'No se pudo crear el topping.' });
  }
});

// 8) PUT /api/products/:id → Actualiza un producto existente
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const { data: existing, error: getError } = await supabase
      .from('productos')
      .select('*')
      .eq('id_producto', id)
      .single();

    if (getError) throw getError;
    if (!existing) return res.status(404).json({ error: 'Producto no encontrado.' });

    const {
      nombre,
      tipo,
      precio,
      descripcion,
      alergenos,
      imagen_url,
      cantidad_disponible
    } = req.body;

    // 1) Actualizar campos de "productos"
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

    // 2) Si envían cantidad_disponible, actualizamos en "inventario"
    if (cantidad_disponible !== undefined) {
      const { error: invUpdateError } = await supabase
        .from('inventario')
        .update({ cantidad_disponible })
        .eq('id_producto', id);

      if (invUpdateError) {
        console.error(
          `[Supabase] Error actualizando inventario para producto ${id}:`,
          invUpdateError
        );
        // No abortamos la respuesta; solo informamos
        return res
          .status(500)
          .json({ error: 'Producto actualizado, pero falló la actualización del inventario.' });
      }
    }

    return res.json(updatedProd);
  } catch (e) {
    console.error(`PUT /products/${id} error:`, e);
    res.status(500).json({ error: 'No se pudo actualizar el producto.' });
  }
});

// 9) DELETE /api/products/:id → Elimina un producto (y en cascada su inventario)
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
