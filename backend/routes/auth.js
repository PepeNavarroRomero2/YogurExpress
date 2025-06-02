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

  // Aquí podrías comprobar si el email ya existe, hashear la contraseña, etc.
  // Por simplicidad, hacemos insert directo en supabase

  try {
    // 1) Insertar usuario en tabla "usuarios"
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const { data: newUser, error: userError } = await supabase
      .from('usuarios')
      .insert([
        {
          nombre: nombre,
          email: email,
          contraseña: hashedPassword,
          rol: 'user',
          puntos: 0
        }
      ])
      .select('id_usuario, nombre, email, rol, puntos')
      .single();

    if (userError) {
      console.error('[Supabase] Error insertando usuario:', userError);
      return res.status(500).json({ error: 'Error al registrar usuario.' });
    }

    // 2) Generar token JWT
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
    // 1) Buscar usuario por email
    const { data: users, error: fetchError } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, rol, puntos, contraseña')
      .eq('email', email);

    if (fetchError) {
      console.error('[Supabase] Error buscando usuario:', fetchError);
      return res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
    if (!users || users.length === 0) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    const user = users[0];
    // 2) Verificar contraseña
    const validPassword = await bcrypt.compare(contraseña, user.contraseña);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas.' });
    }

    // 3) Generar token 
    const tokenPayload = {
      id_usuario: user.id_usuario,
      email: user.email,
      role: user.rol
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '3h' });

    // Eliminar el campo "contraseña" del objeto que devolvemos
    delete user.contraseña;

    return res.json({ user: user, token });
  } catch (err) {
    console.error('Error en POST /api/auth/login:', err);
    return res.status(500).json({ error: 'Error interno en login.' });
  }
});

export default router;
