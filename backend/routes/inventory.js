// backend/routes/inventory.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

/**
 * GET /api/inventory
 * Devuelve la lista completa de inventario, uniendo productos con su cantidad.
 *
 * Cada objeto será:
 *   {
 *     id_producto: number,
 *     cantidad_disponible: number,
 *     nombre: string
 *   }
 */
router.get('/', async (req, res) => {
  try {
    // 1) Leemos todas las filas de inventario
    const { data: invRows, error: invError } = await supabase
      .from('inventario')
      .select('*')
      .order('id_producto', { ascending: true });

    if (invError) {
      console.error('[Supabase] Error leyendo inventario:', invError);
      return res.status(500).json({ error: 'No se pudo cargar inventario.' });
    }

    // 2) Cada fila, le agregamos el nombre del producto (JOIN manual)
    const enriched = await Promise.all(
      (invRows || []).map(async (inv) => {
        const { data: prodData, error: prodError } = await supabase
          .from('productos')
          .select('nombre')
          .eq('id_producto', inv.id_producto)
          .single();

        if (prodError) {
          console.error(
            `[Supabase] No se pudo encontrar producto ${inv.id_producto}:`,
            prodError
          );
          return {
            id_producto: inv.id_producto,
            cantidad_disponible: inv.cantidad_disponible,
            nombre: '—'
          };
        }

        return {
          id_producto: inv.id_producto,
          cantidad_disponible: inv.cantidad_disponible,
          nombre: prodData.nombre
        };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error('Error general en GET /api/inventory:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

/**
 * PUT /api/inventory/:id
 * Si ya existe inventario.id_producto = :id, lo actualiza.
 * Si NO existe, lo crea (INSERT).
 *
 * Body esperado:
 * {
 *   cantidad_disponible: number
 * }
 */
router.put('/:id', async (req, res) => {
  const idProducto = parseInt(req.params.id, 10);
  const { cantidad_disponible } = req.body;

  // Validación básica de parámetros
  if (isNaN(idProducto) || cantidad_disponible == null) {
    return res.status(400).json({ error: 'Parámetros inválidos.' });
  }

  try {
    // Usamos UPSERT para que inserte o actualice en un solo paso
    const { data: upsertData, error: upsertError } = await supabase
      .from('inventario')
      .upsert(
        { id_producto: idProducto, cantidad_disponible },
        { onConflict: 'id_producto' }
      );

    if (upsertError) {
      console.error(`[Supabase] Error en upsert inventario ${idProducto}:`, upsertError);
      return res.status(500).json({ error: 'No se pudo actualizar/crear el registro de inventario.' });
    }

    return res.json({ message: 'Inventario actualizado o creado correctamente.' });
  } catch (err) {
    console.error('Error general en PUT /api/inventory/:id:', err);
    return res.status(500).json({ error: 'Error interno al actualizar inventario.' });
  }
});

export default router;
