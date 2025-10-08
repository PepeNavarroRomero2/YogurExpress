import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient.js';

/**
 * Extrae y valida el JWT.
 * Deja en req.user: { id_usuario, email, rol }
 */
export function authenticateToken(req, res, next) {
  try {
    const auth = req.headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'No autorizado: falta token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // OJO: el proyecto usa 'rol' (no 'role')
    req.user = {
      id_usuario: payload.id_usuario,
      email: payload.email,
      rol: payload.rol
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'No autorizado: token inválido o expirado' });
  }
}

/**
 * Requiere admin. Si el token no trae rol=admin,
 * revalida contra BD por si el usuario fue promovido tras emitir el token.
 */
export async function isAdmin(req, res, next) {
  try {
    if (req.user?.rol === 'admin') return next();

    // Revalidar rol en BD por id_usuario
    const { data: u, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id_usuario', req.user?.id_usuario)
      .single();

    if (error) {
      console.error('[isAdmin] Supabase error:', error);
      return res.status(500).json({ error: 'Error verificando rol' });
    }

    if (u?.rol === 'admin') {
      req.user.rol = 'admin';
      return next();
    }

    return res.status(403).json({ error: 'Prohibido: se requiere rol admin' });
  } catch (e) {
    console.error('[isAdmin] Error general:', e);
    return res.status(500).json({ error: 'Error interno en autorización' });
  }
}
