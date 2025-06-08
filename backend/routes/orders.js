// backend/routes/orders.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken } from './authMiddleware.js';

const router = express.Router();

/**
 * POST /api/orders
 * Crea un nuevo pedido, verifica stock, aplica promoción, guarda detalles y suma puntos.
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { productos, hora_recogida, codigo_promocional } = req.body;
    const id_usuario = req.user.id_usuario;

    // 1) Validaciones básicas
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'Debe enviar al menos un producto.' });
    }
    if (typeof hora_recogida !== 'string' || !hora_recogida.trim()) {
      return res.status(400).json({ error: 'Debe enviar hora_recogida válida.' });
    }
    for (const { id_producto, cantidad } of productos) {
      if (typeof id_producto !== 'number' || typeof cantidad !== 'number' || cantidad <= 0) {
        return res.status(400).json({ error: 'Formato inválido en productos.' });
      }
    }

    // 2) Cálculo de descuento
    let descuento = 0;
    if (codigo_promocional) {
      const { data: promo, error: promoError } = await supabase
        .from('promociones')
        .select('descuento')
        .eq('codigo', codigo_promocional.trim())
        .maybeSingle();
      if (promoError) {
        console.error('Error al validar promoción:', promoError);
        return res.status(500).json({ error: 'Error al validar promoción.' });
      }
      if (promo) descuento = Number(promo.descuento) || 0;
    }

    // 3) Verificar stock
    const invMap = new Map();
    for (const { id_producto, cantidad } of productos) {
      const { data: invRow, error: invError } = await supabase
        .from('inventario')
        .select('cantidad_disponible')
        .eq('id_producto', id_producto)
        .single();
      if (invError) {
        console.error(`Error leyendo inventario ${id_producto}:`, invError);
        return res.status(500).json({ error: 'Error interno verificando stock.' });
      }
      if (!invRow || invRow.cantidad_disponible < cantidad) {
        return res
          .status(400)
          .json({ error: `No hay stock suficiente para el producto ${id_producto}.` });
      }
      invMap.set(id_producto, invRow.cantidad_disponible);
    }

    // 4) Insertar pedido con total = 0
    const codigoPedido = Date.now().toString();
    const fechaActual  = new Date().toISOString();
    const { data: ins, error: insErr } = await supabase
      .from('pedidos')
      .insert([
        {
          id_usuario,
          fecha_hora:    fechaActual,
          hora_recogida,
          estado:        'pendiente',
          total:         0,
          codigo_pedido: codigoPedido
        }
      ])
      .select('id_pedido')
      .single();
    if (insErr || !ins?.id_pedido) {
      console.error('Error insertando pedido:', insErr);
      return res.status(500).json({ error: 'Error al crear el pedido.' });
    }
    const idPedido = ins.id_pedido;
    let montoAcumulado = 0;

    // 5) Recorrer productos: insertar detalle y actualizar stock
    for (const { id_producto, cantidad } of productos) {
      // 5.a) Obtener precio
      const { data: prod, error: prodErr } = await supabase
        .from('productos')
        .select('precio')
        .eq('id_producto', id_producto)
        .single();
      if (prodErr) {
        console.error(`Error precio producto ${id_producto}:`, prodErr);
        return res.status(500).json({ error: 'Error al verificar precio de producto.' });
      }
      const precioUnitario = Number(prod.precio) || 0;
      montoAcumulado += precioUnitario * cantidad;

      // 5.b) Insertar detalle_pedido (sin precio_unitario)
      const { error: detErr } = await supabase
        .from('detalle_pedido')
        .insert([
          {
            id_pedido:   idPedido,
            id_producto,
            cantidad
          }
        ]);
      if (detErr) {
        console.error(`Error insertando detalle para pedido ${idPedido}:`, detErr);
        return res.status(500).json({ error: 'Error al registrar detalle de pedido.' });
      }

      // 5.c) Actualizar inventario
      const nuevaCant = invMap.get(id_producto) - cantidad;
      const { error: updErr } = await supabase
        .from('inventario')
        .update({ cantidad_disponible: nuevaCant })
        .eq('id_producto', id_producto);
      if (updErr) {
        console.error(`Error actualizando stock ${id_producto}:`, updErr);
        return res.status(500).json({ error: 'Error al actualizar stock.' });
      }
      invMap.set(id_producto, nuevaCant);
    }

    // 6) Aplicar descuento
    if (descuento > 0) {
      montoAcumulado = Number((montoAcumulado * (1 - descuento)).toFixed(2));
    }

    // 7) Actualizar total
    const { error: totErr } = await supabase
      .from('pedidos')
      .update({ total: montoAcumulado })
      .eq('id_pedido', idPedido);
    if (totErr) {
      console.error(`Error actualizando total pedido ${idPedido}:`, totErr);
      return res.status(500).json({ error: 'Error al actualizar total del pedido.' });
    }

    // 8) Sumar puntos al usuario
    const puntosGanados = Math.floor(montoAcumulado);
    if (puntosGanados > 0) {
      const { data: usr, error: usrErr } = await supabase
        .from('usuarios')
        .select('puntos')
        .eq('id_usuario', id_usuario)
        .single();
      if (!usrErr && usr) {
        const { error: addErr } = await supabase
          .from('usuarios')
          .update({ puntos: usr.puntos + puntosGanados })
          .eq('id_usuario', id_usuario);
        if (addErr) console.error('Error actualizando puntos:', addErr);
      }
    }

    // 9) Responder
    return res.status(201).json({
      id_pedido:      idPedido,
      codigo_pedido:  codigoPedido,
      total:          montoAcumulado,
      puntos_ganados: puntosGanados
    });

  } catch (err) {
    console.error('Error en POST /api/orders:', err);
    return res.status(500).json({ error: err.message || 'Error interno al crear pedido.' });
  }
});

/**
 * GET /api/orders/history
 * Historial de pedidos con detalles para el usuario.
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { data: pedidos, error: pedErr } = await supabase
      .from('pedidos')
      .select('id_pedido, fecha_hora, hora_recogida, total, codigo_pedido, estado')
      .eq('id_usuario', id_usuario)
      .order('fecha_hora', { ascending: false });
    if (pedErr) throw pedErr;

    const history = await Promise.all(pedidos.map(async ped => {
      const { data: detalles, error: detErr } = await supabase
        .from('detalle_pedido')
        .select('id_producto, cantidad')
        .eq('id_pedido', ped.id_pedido);
      if (detErr) throw detErr;

      const productos = await Promise.all(detalles.map(async d => {
        const { data: prod, error: prodErr } = await supabase
          .from('productos')
          .select('nombre, precio')
          .eq('id_producto', d.id_producto)
          .single();
        return {
          id_producto:     d.id_producto,
          nombre:          prodErr ? null : prod.nombre,
          cantidad:        d.cantidad,
          precio_unitario: prodErr ? null : Number(prod.precio)
        };
      }));

      return { ...ped, productos };
    }));

    return res.json({ history });
  } catch (err) {
    console.error('Error en GET /api/orders/history:', err);
    return res.status(500).json({ error: 'Error interno al obtener historial.' });
  }
});

/**
 * GET /api/orders
 * Lista todos los pedidos (uso interno/admin).
 */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha_hora', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    console.error('Error en GET /api/orders:', err);
    return res.status(500).json({ error: 'Error interno al listar pedidos.' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Actualiza el estado de un pedido.
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStates = ['pendiente', 'en preparación', 'entregado'];
  if (!validStates.includes(status)) {
    return res.status(400).json({ error: 'Estado no válido.' });
  }
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: status })
      .eq('id_pedido', id)
      .select()
      .single();
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Error en PATCH /api/orders/:id/status:', err);
    return res.status(500).json({ error: 'Error interno al actualizar estado.' });
  }
});

export default router;
