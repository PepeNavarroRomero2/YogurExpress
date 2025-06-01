// backend/routes/users.js

import express from 'express';
import jwt from 'jsonwebtoken';
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
 * GET /api/users/me
 * Devuelve los datos del usuario autenticado (sin contraseña)
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, rol, puntos')
      .eq('id_usuario', userId)
      .single();
    if (error) throw error;
    res.json(user);
  } catch (error) {
    console.error('GET /users/me error:', error);
    res.status(500).json({ error: 'No se pudo cargar el perfil de usuario.' });
  }
});

export default router;
