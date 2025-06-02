// backend/routes/orders.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken } from './authMiddleware.js';

const router = express.Router();

/**
 * POST /api/orders
 * Crea un nuevo pedido basado en tu esquema actual:
 *   - Inserta en pedidos: { id_usuario, fecha_hora, hora_recogida, estado, total, codigo_pedido }
 *   - Luego inserta en detalle_pedido solo { id_pedido, id_producto, cantidad }
 *   - Calcula el total en memoria (sumando precio* cantidad de cada producto)
 *   - Actualiza el campo total en pedidos
 *
 * Body esperado:
 *   {
 *     productos: [
 *       { id_producto: number, cantidad: number },
 *       ...
 *     ],
 *     hora_recogida: string    // p.ej. "20:21:00"
 *   }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productos, hora_recogida } = req.body;
    const id_usuario = req.user.id_usuario;

    // 1) Validaciones básicas
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un producto.' });
    }
    if (typeof hora_recogida !== 'string' || !hora_recogida.trim()) {
      return res.status(400).json({ error: 'Debe enviar hora_recogida válida.' });
    }

    // 2) Generar un código de pedido único (aquí uso timestamp sencillo)
    const codigoPedido = `${Date.now()}`;

    // Fecha actual en ISO
    const fechaActual = new Date().toISOString();

    // 3) Insertar en "pedidos" (sin incluir precio_unitario porque no existe) 
    const { data: insertedPedido, error: insertError } = await supabase
      .from('pedidos')
      .insert([
        {
          id_usuario: id_usuario,
          fecha_hora: fechaActual,
          hora_recogida: hora_recogida,
          estado: 'pendiente',
          total: 0,            // lo actualizaremos tras insertar los productos
          codigo_pedido: codigoPedido
        }
      ])
      .select('id_pedido')
      .single();

    if (insertError) {
      console.error('[Supabase] Error insertando en pedidos:', insertError);
      return res.status(500).json({ error: 'Error al crear el pedido.' });
    }

    const idPedido = insertedPedido.id_pedido;
    let montoAcumulado = 0;

    // 4) Recorrer cada producto para poblar "detalle_pedido" y acumular total
    for (const prod of productos) {
      const { id_producto, cantidad } = prod;
      if (
        typeof id_producto !== 'number' ||
        typeof cantidad !== 'number' ||
        cantidad <= 0
      ) {
        return res.status(400).json({ error: 'Formato inválido en productos.' });
      }

      // 4.a) Obtener precio unitario desde la tabla "productos"
      const { data: prodInfo, error: prodInfoError } = await supabase
        .from('productos')
        .select('precio')
        .eq('id_producto', id_producto)
        .single();

      if (prodInfoError) {
        console.error(
          `[Supabase] Error obteniendo precio de producto ${id_producto}:`,
          prodInfoError
        );
        return res.status(500).json({ error: 'Error al verificar precio de producto.' });
      }
      const precioUnitario = Number(prodInfo.precio) || 0;
      montoAcumulado += precioUnitario * cantidad;

      // 4.b) Insertar en "detalle_pedido" solo los campos existentes
      const { error: detalleError } = await supabase
        .from('detalle_pedido')
        .insert([
          {
            id_pedido: idPedido,
            id_producto: id_producto,
            cantidad: cantidad
          }
        ]);

      if (detalleError) {
        console.error(
          `[Supabase] Error insertando en detalle_pedido para pedido ${idPedido}:`,
          detalleError
        );
        return res.status(500).json({ error: 'Error al registrar detalle de pedido.' });
      }
    }

    // 5) Actualizar el campo "total" en la tabla "pedidos"
    const totalFinal = montoAcumulado;
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({ total: totalFinal })
      .eq('id_pedido', idPedido);

    if (updateError) {
      console.error(
        `[Supabase] Error actualizando total en pedido ${idPedido}:`,
        updateError
      );
      return res.status(500).json({ error: 'Error al actualizar total del pedido.' });
    }

    // 6) Devolver el código de pedido al frontend
    return res.status(201).json({ codigo_pedido: codigoPedido });
  } catch (err) {
    console.error('Error general en POST /api/orders:', err);
    return res.status(500).json({ error: 'Error interno al crear pedido.' });
  }
});

/**
 * GET /api/orders/history
 * Devuelve el historial de pedidos del usuario autenticado.
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    // 1) Obtener todos los pedidos de este usuario, ordenados por fecha_hora desc
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id_pedido, fecha_hora, hora_recogida, total, codigo_pedido')
      .eq('id_usuario', id_usuario)
      .order('fecha_hora', { ascending: false });

    if (pedidosError) {
      console.error('[Supabase] Error obteniendo pedidos:', pedidosError);
      return res.status(500).json({ error: 'No se pudo obtener historial.' });
    }

    const historyResult = [];

    // 2) Para cada pedido, obtener un solo detalle (id_producto) y luego obtener nombre de producto
    for (const ped of pedidos) {
      const { data: dets, error: detError } = await supabase
        .from('detalle_pedido')
        .select('id_producto')
        .eq('id_pedido', ped.id_pedido)
        .limit(1);

      if (detError) {
        console.error(
          `[Supabase] Error obteniendo detalle_pedido para pedido ${ped.id_pedido}:`,
          detError
        );
        return res.status(500).json({ error: 'Error al leer detalle de pedido.' });
      }

      let nombreProducto = '—';
      if (dets && dets.length > 0) {
        const idProd = dets[0].id_producto;
        const { data: prod, error: prodError } = await supabase
          .from('productos')
          .select('nombre')
          .eq('id_producto', idProd)
          .single();

        if (prodError) {
          console.error(
            `[Supabase] Error obteniendo producto ${idProd}:`,
            prodError
          );
          return res.status(500).json({ error: 'Error al leer nombre de producto.' });
        }
        nombreProducto = prod.nombre;
      }

      historyResult.push({
        id_pedido:     ped.id_pedido,
        fecha_hora:    ped.fecha_hora,
        hora_recogida: ped.hora_recogida,
        total:         Number(ped.total),
        producto:      nombreProducto,
        codigo_pedido: ped.codigo_pedido
      });
    }

    return res.json({ history: historyResult });
  } catch (err) {
    console.error('Error general en GET /api/orders/history:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
