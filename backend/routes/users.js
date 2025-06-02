// backend/routes/users.js

import express from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { authenticateToken } from './authMiddleware.js';

const router = express.Router();

/**
 * GET /api/users/profile
 * Devuelve los datos del usuario autenticado (incluidos puntos).
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;

    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, rol, puntos')
      .eq('id_usuario', id_usuario)
      .single();

    if (userError) {
      console.error('[Supabase] Error obteniendo perfil de usuario:', userError);
      return res.status(500).json({ error: 'Error al obtener datos de usuario.' });
    }
    return res.json(user);
  } catch (err) {
    console.error('Error general en GET /api/users/profile:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
