// backend/routes/auth.js

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Crea un usuario (email único), hashea la contraseña y devuelve token + user.
 */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, contraseña } = req.body;
    if (!nombre || !email || !contraseña) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    // 1) Comprobar si el email ya existe
    const { data: existing, error: errExisting } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    if (errExisting && errExisting.code !== 'PGRST116') {
      // PGRST116: no rows found, es OK
      throw errExisting;
    }
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }

    // 2) Hashear contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

    // 3) Insertar usuario en la tabla
    const { data: newUser, error: errInsert } = await supabase
      .from('usuarios')
      .insert({
        nombre,
        email,
        contraseña: hashedPassword,
        rol: 'cliente', // por defecto
        puntos: 0
      })
      .select('id_usuario, nombre, email, rol, puntos')
      .single();
    if (errInsert) {
      throw errInsert;
    }

    // 4) Generar JWT
    const token = jwt.sign(
      { id_usuario: newUser.id_usuario, email: newUser.email, rol: newUser.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario.' });
  }
});

/**
 * POST /api/auth/login
 * Valida credenciales y devuelve token + user.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, contraseña } = req.body;
    if (!email || !contraseña) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    // 1) Obtener usuario por email
    const { data: user, error: errUser } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, contraseña, rol, puntos')
      .eq('email', email)
      .single();
    if (errUser) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 2) Comparar contraseñas
    const match = await bcrypt.compare(contraseña, user.contraseña);
    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // 3) Generar JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4) Devolver user sin contraseña + token
    delete user.contraseña;
    res.status(200).json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión.' });
  }
});

export default router;
