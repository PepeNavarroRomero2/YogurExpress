const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../lib/supabaseClient');
const { authenticateToken } = require('./authMiddleware');

const router = express.Router();

/**
 * POST /api/orders
 * Crea un nuevo pedido:
 * Body: { productos: [{ id_producto, cantidad }], hora_recogida: 'HH:MM', puntos_usados: number }
 * Autenticación requerida (header Authorization: Bearer <token>)
 */
router.post('/', authenticateToken, async (req, res) => {
  const { productos, hora_recogida, puntos_usados } = req.body;
  const id_usuario = req.user.id_usuario;

  if (!productos || !hora_recogida) {
    return res.status(400).json({ error: 'Faltan datos de pedido' });
  }

  // 1) Calcular subtotal y revisar inventario
  let subtotal = 0;
  for (const item of productos) {
    const { data: prod, error: errProd } = await supabase
      .from('productos')
      .select('precio')
      .eq('id_producto', item.id_producto)
      .single();
    if (errProd || !prod) {
      return res.status(400).json({ error: `Producto inválido: ${item.id_producto}` });
    }
    subtotal += parseFloat(prod.precio) * item.cantidad;

    // Revisar inventario
    const { data: inv, error: errInv } = await supabase
      .from('inventario')
      .select('cantidad_disponible')
      .eq('id_producto', item.id_producto)
      .single();
    if (errInv || !inv || inv.cantidad_disponible < item.cantidad) {
      return res.status(400).json({ error: `Inventario insuficiente para el producto ${item.id_producto}` });
    }
  }

  // 2) Calcular descuento (€) por puntos usados
  const discount = puntos_usados / 10; // 10 pts = 1€
  const total = Math.max(0, subtotal - discount);

  // 3) Restar puntos al usuario
  if (puntos_usados > 0) {
    const { data: user, error: errUser } = await supabase
      .from('usuarios')
      .select('puntos')
      .eq('id_usuario', id_usuario)
      .single();
    if (errUser || !user || user.puntos < puntos_usados) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }
    await supabase
      .from('usuarios')
      .update({ puntos: user.puntos - puntos_usados })
      .eq('id_usuario', id_usuario);
  }

  // 4) Insertar pedido en tabla pedidos
  const codigo_pedido = uuidv4().slice(0, 8); // 8 caracteres alfanuméricos
  const fecha_hora = new Date().toISOString();

  const { data: newOrder, error: errInsert } = await supabase
    .from('pedidos')
    .insert([{
      id_usuario,
      fecha_hora,
      hora_recogida,
      estado: 'pendiente',
      total,
      codigo_pedido
    }])
    .select('id_pedido, total')
    .single();

  if (errInsert || !newOrder) {
    return res.status(500).json({ error: 'No se pudo crear pedido' });
  }

  const id_pedido = newOrder.id_pedido;

  // 5) Insertar cada detalle_pedido y descontar inventario
  for (const item of productos) {
    await supabase
      .from('detalle_pedido')
      .insert([{ id_pedido, id_producto: item.id_producto, cantidad: item.cantidad }]);
    // Descontar inventario
    await supabase
      .from('inventario')
      .update({
        cantidad_disponible: supabase.raw(
          'cantidad_disponible - ?',
          item.cantidad
        )
      })
      .eq('id_producto', item.id_producto);
  }

  // 6) Recompensar puntos nuevos (1 pt por cada € pagado)
  const earned = Math.floor(total);
  if (earned > 0) {
    const { data: user2 } = await supabase
      .from('usuarios')
      .select('puntos')
      .eq('id_usuario', id_usuario)
      .single();
    await supabase
      .from('usuarios')
      .update({ puntos: (user2.puntos || 0) + earned })
      .eq('id_usuario', id_usuario);
  }

  res.status(201).json({ id_pedido, codigo_pedido, total, earned });
});

/**
 * GET /api/orders/history
 * Devuelve el historial de pedidos del usuario autenticado
 */
router.get('/history', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { data: pedidos, error } = await supabase
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
          nombre, precio, tipo
        )
      )
    `)
    .eq('id_usuario', id_usuario)
    .order('fecha_hora', { ascending: false });

  if (error) return res.status(500).json({ error: 'No se pudo obtener historial' });
  res.json(pedidos);
});

module.exports = router;
