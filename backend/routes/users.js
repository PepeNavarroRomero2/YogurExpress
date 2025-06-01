const express = require('express');
const { supabase } = require('../lib/supabaseClient');
const { authenticateToken } = require('./authMiddleware');

const router = express.Router();

/**
 * GET /api/users/me
 * Devuelve la información del usuario autenticado (sin contraseña)
 */
router.get('/me', authenticateToken, async (req, res) => {
  const id_usuario = req.user.id_usuario;
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, email, rol, puntos')
    .eq('id_usuario', id_usuario)
    .single();

  if (error) return res.status(500).json({ error: 'No se pudo cargar usuario' });
  res.json(user);
});

module.exports = router;
