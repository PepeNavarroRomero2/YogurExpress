const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../lib/supabaseClient');

require('dotenv').config();
const router = express.Router();

// REGISTRO DE USUARIO
router.post('/register', async (req, res) => {
  const { nombre, email, contraseña } = req.body;
  if (!nombre || !email || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  // Comprobar si ya existe usuario con ese email
  const { data: existing, error: errCheck } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();

  // PGRST116 significa “no rows returned” (ningún usuario), lo que está bien
  if (errCheck && errCheck.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Error al comprobar usuario' });
  }
  if (existing) {
    return res.status(400).json({ error: 'Email ya registrado' });
  }

  // Hashear contraseña
  const hash = await bcrypt.hash(contraseña, 10);

  // Insertar usuario en Supabase (rol 'cliente', puntos inicial 0)
  const { data: user, error } = await supabase
    .from('usuarios')
    .insert([
      { nombre, email, contraseña: hash, rol: 'cliente', puntos: 0 }
    ])
    .select('id_usuario, nombre, email, rol, puntos')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }

  // Generar JWT
  const token = jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, role: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.status(201).json({ user, token });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  // Buscar usuario por email
  const { data: user, error: errFetch } = await supabase
    .from('usuarios')
    .select('id_usuario, nombre, email, contraseña, rol, puntos')
    .eq('email', email)
    .single();

  if (errFetch || !user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Verificar contraseña
  const match = await bcrypt.compare(contraseña, user.contraseña);
  if (!match) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Generar JWT
  const token = jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, role: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  delete user.contraseña;

  res.json({ user, token });
});

module.exports = router;
