import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id_usuario: user.id_usuario, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getPassword(body = {}) {
  return body.password ?? body.contrasena ?? body.contraseña ?? '';
}

/**
 * POST /api/auth/register
 * Body: { nombre, email, contraseña | contrasena | password }
 * Crea usuario con contraseña hasheada en la columna "contraseña_hash".
 */
router.post('/register', async (req, res) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    const email = String(req.body?.email || '').toLowerCase().trim();

    // Aceptamos varias claves por comodidad:
    const plain = getPassword(req.body);

    if (!nombre || !email || !plain) {
      return res.status(400).json({ error: 'nombre, email y contraseña son obligatorios' });
    }

    // ¿Existe ya ese email?
    {
      const { data: existing, error: exErr } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('email', email)
        .maybeSingle();
      if (exErr) {
        console.error('[Supabase] Error comprobando email:', exErr);
        return res.status(500).json({ error: 'Error interno comprobando email' });
      }
      if (existing) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
    }

    const passwordHash = await bcrypt.hash(String(plain), 10);

    // IMPORTANTE: guardamos en "contraseña_hash" (con eñe)
    const insertPayload = {
      nombre,
      email,
      rol: 'cliente',
      puntos: 0,
      // clave con eñe => hay que usar notación de string/brackets
      ['contraseña_hash']: passwordHash
    };

    const { data: created, error: insErr } = await supabase
      .from('usuarios')
      .insert([insertPayload])
      .select('id_usuario, nombre, email, rol, puntos')
      .single();

    if (insErr) {
      console.error('[Supabase] Error insertando usuario:', insErr);
      return res.status(500).json({ error: 'No se pudo crear el usuario' });
    }

    const token = signToken(created);
    return res.status(201).json({ user: created, token });
  } catch (e) {
    console.error('[Auth] Error general en register:', e);
    return res.status(500).json({ error: 'Error interno en registro' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, contraseña | contrasena | password }
 * Valida contra "contraseña_hash".
 */
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const plain = getPassword(req.body);

    if (!email || !plain) {
      return res.status(400).json({ error: 'email y contraseña son obligatorios' });
    }

    // Necesitamos leer también la columna de hash (con eñe)
    const { data: user, error: selErr } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, email, rol, puntos, "contraseña_hash"')
      .eq('email', email)
      .single();

    if (selErr || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(String(plain), user['contraseña_hash']);
    if (!ok) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // No devolvemos la columna del hash
    const safeUser = {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      puntos: user.puntos
    };

    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (e) {
    console.error('[Auth] Error general en login:', e);
    return res.status(500).json({ error: 'Error interno en login' });
  }
});

export default router;
