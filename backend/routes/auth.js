// backend/routes/auth.js

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabaseClient.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// REGISTRO
router.post('/register', async (req, res) => {
  const { nombre, email, contraseña } = req.body;
  if (!nombre || !email || !contraseña) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    // Hashear la contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    // Insertar usuario nuevo
    const { data: newUser, error: userError } = await supabase
      .from('usuarios')
      .insert([{
        nombre,
        email,
        contraseña: hashedPassword,
        rol: 'user',
        puntos: 0
      }])
      .select('id_usuario, nombre, email, rol, puntos')
      .single();

    if (userError) {
      console.error('[Supabase] Error insertando usuario:', userError);
      return res.status(500).json({ error: 'Error al registrar usuario.' });
    }

    const tokenPayload = {
      id_usuario: newUser.id_usuario,
      email: newUser.email,
      role: newUser.rol
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '3h' });

    return res.status(201).json({ user: newUser, token });
  } catch (err) {
    console.error('Error en POST /api/auth/register:', err);
    return res.status(500).json({ error: 'Error interno en registro.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, contraseña } = req.body;
  if (!email || !contraseña) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  try {
    // Buscar usuario por email
    const { data: user, error: fetchError } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, rol, puntos, contraseña')
      .eq('email', email)
      .single();

    if (fetchError) {
      console.error('[Supabase] Error buscando usuario:', fetchError);
      return res.status(500).json({ error: 'Error al iniciar sesión.' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const validPassword = await bcrypt.compare(contraseña, user.contraseña);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const tokenPayload = {
      id_usuario: user.id_usuario,
      email: user.email,
      role: user.rol
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '3h' });

    // Eliminar contraseña antes de devolver el usuario
    delete user.contraseña;

    return res.json({ user, token });
  } catch (err) {
    console.error('Error en POST /api/auth/login:', err);
    return res.status(500).json({ error: 'Error interno en login.' });
  }
});

export default router;
