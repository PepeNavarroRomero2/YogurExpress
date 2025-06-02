// backend/routes/authMiddleware.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // cabecera “Bearer <token>”
  if (!token) {
    return res.status(401).json({ error: 'Token faltante' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    // Asumimos que el payload contiene, al menos: { id_usuario, email, role, iat, exp }
    req.user = payload;
    next();
  });
}

export function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado: solo admins' });
  }
  next();
}
