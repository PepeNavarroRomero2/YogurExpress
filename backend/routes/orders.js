// backend/routes/orders.js

import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

/**
 * Middleware para extraer userId desde el JWT
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token no proporcionado.' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // contiene { id_usuario, email, rol }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

/**
 * GET /api/orders/history
 * Devuelve el historial de pedidos del usuario autenticado
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    // Traer pedidos con detalle y producto asociado
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        id_pedido,
        fecha_hora,
        hora_recogida,
        estado,
        total,
        codigo_pedido,
        detalle_pedido (
          id_producto,
          cantidad,
          productos (
            nombre,
            precio,
            tipo
          )
        )
      `)
      .eq('id_usuario', userId)
      .order('fecha_hora', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('GET /orders/history error:', error);
    res.status(500).json({ error: 'No se pudo cargar el historial de pedidos.' });
  }
});

/**
 * POST /api/orders
 * Crea un pedido nuevo, comprueba inventario, descuenta stock, actualiza puntos
 * Body: { productos: [{ id_producto, cantidad }], hora_recogida, puntos_usados }
 */
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id_usuario;
  const { productos, hora_recogida, puntos_usados } = req.body;

  if (!Array.isArray(productos) || !hora_recogida) {
    return res.status(400).json({ error: 'Datos de pedido incompletos.' });
  }

  try {
    // 1) Calcular subtotal y comprobar inventario
    let subtotal = 0;
    for (const item of productos) {
      const { id_producto, cantidad } = item;
      // Obtener precio y stock
      const { data: prod, error: errProd } = await supabase
        .from('productos')
        .select('precio')
        .eq('id_producto', id_producto)
        .single();
      if (errProd) throw errProd;
      subtotal += prod.precio * cantidad;

      const { data: inv, error: errInv } = await supabase
        .from('inventario')
        .select('cantidad_disponible')
        .eq('id_producto', id_producto)
        .single();
      if (errInv) throw errInv;
      if (inv.cantidad_disponible < cantidad) {
        return res.status(400).json({ error: `Inventario insuficiente para el producto ${id_producto}` });
      }
    }

    // 2) Aplicar descuento de puntos
    const descuento = (puntos_usados || 0) / 10;
    const total = subtotal - descuento;

    // 3) Generar código de pedido (UUID corto)
    const codigo_pedido = uuid().slice(0, 8);

    // 4) Insertar en pedidos
    const fecha_hora = new Date().toISOString();
    const { data: newOrder, error: errInsertOrder } = await supabase
      .from('pedidos')
      .insert({
        id_usuario: userId,
        fecha_hora,
        hora_recogida,
        estado: 'pendiente',
        total,
        codigo_pedido
      })
      .select('id_pedido, total')
      .single();
    if (errInsertOrder) throw errInsertOrder;

    const orderId = newOrder.id_pedido;

    // 5) Insertar detalle_pedido y actualizar inventario
    for (const item of productos) {
      const { id_producto, cantidad } = item;
      await supabase
        .from('detalle_pedido')
        .insert({ id_pedido: orderId, id_producto, cantidad });
      // Descontar stock
      await supabase
        .from('inventario')
        .update({ cantidad_disponible: supabase.raw('cantidad_disponible - ?', [cantidad]) })
        .eq('id_producto', id_producto);
    }

    // 6) Restar puntos usados al usuario y añadir puntos ganados (= floor(total))
    const puntosGanados = Math.floor(total);
    await supabase
      .from('usuarios')
      .update({
        puntos: supabase.raw('puntos - ? + ?', [puntos_usados || 0, puntosGanados])
      })
      .eq('id_usuario', userId);

    res.status(201).json({
      id_pedido: orderId,
      codigo_pedido,
      total,
      earned: puntosGanados
    });
  } catch (error) {
    console.error('POST /orders error:', error);
    res.status(500).json({ error: 'Error al crear el pedido.' });
  }
});

export default router;
