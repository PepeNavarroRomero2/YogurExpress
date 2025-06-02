// backend/routes/orders.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken } from './authMiddleware.js';

const router = express.Router();

/**
 * POST /api/orders
 * Crea un nuevo pedido, guarda los detalles y suma puntos al usuario.
 *
 * Body esperado:
 *   {
 *     productos: [
 *       { id_producto: number, cantidad: number },
 *       ...
 *     ],
 *     hora_recogida: string    // por ejemplo "20:21:00"
 *   }
 *
 * Respuesta:
 *   {
 *     codigo_pedido: string,
 *     puntos_ganados: number
 *   }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productos, hora_recogida } = req.body;
    const id_usuario = req.user.id_usuario;

    // 1) Validaciones
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un producto.' });
    }
    if (typeof hora_recogida !== 'string' || !hora_recogida.trim()) {
      return res.status(400).json({ error: 'Debe enviar hora_recogida válida.' });
    }

    // 2) Generar un código de pedido único (aquí usamos timestamp)
    const codigoPedido = `${Date.now()}`;

    // 3) Insertar en "pedidos" (todos los campos NOT NULL)
    const fechaActual = new Date().toISOString();
    const { data: insertedPedido, error: insertError } = await supabase
      .from('pedidos')
      .insert([
        {
          id_usuario: id_usuario,
          fecha_hora: fechaActual,
          hora_recogida: hora_recogida,
          estado: 'pendiente',
          total: 0,            // se actualizará después
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

    // 4) Recorrer cada producto para poblar "detalle_pedido" y calcular subtotal
    for (const prod of productos) {
      const { id_producto, cantidad } = prod;
      if (typeof id_producto !== 'number' || typeof cantidad !== 'number' || cantidad <= 0) {
        return res.status(400).json({ error: 'Formato inválido en productos.' });
      }

      // 4.a) Obtener precio unitario de la tabla "productos"
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

      // 4.b) Insertar en "detalle_pedido" sin precio_unitario
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

    // 6) Sumar puntos al usuario: 1 punto por cada euro entero gastado

    // 6.a) Leer los puntos actuales del usuario
    const { data: userRow, error: userSelectError } = await supabase
      .from('usuarios')
      .select('puntos')
      .eq('id_usuario', id_usuario)
      .single();

    let puntosGanados = 0;
    if (!userSelectError && userRow && typeof userRow.puntos === 'number') {
      puntosGanados = Math.floor(totalFinal);
      if (puntosGanados > 0) {
        const nuevosPuntos = userRow.puntos + puntosGanados;
        const { error: userUpdateError } = await supabase
          .from('usuarios')
          .update({ puntos: nuevosPuntos })
          .eq('id_usuario', id_usuario);

        if (userUpdateError) {
          console.error(
            `[Supabase] Error actualizando puntos al usuario ${id_usuario}:`,
            userUpdateError
          );
          // No abortamos el pedido; solo registramos el error
        }
      }
    } else {
      console.error(
        `[Supabase] Error leyendo puntos actuales del usuario ${id_usuario}:`,
        userSelectError
      );
      // Incluso si falla la lectura, no abortamos el pedido; puntosGanados queda en 0
    }

    // 7) Devolver el código de pedido y puntos ganados
    return res.status(201).json({
      codigo_pedido: codigoPedido,
      puntos_ganados: puntosGanados
    });

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

    // 1) Obtener todos los pedidos de este usuario
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

    // 2) Para cada pedido, obtener un solo detalle y luego nombre de producto
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
