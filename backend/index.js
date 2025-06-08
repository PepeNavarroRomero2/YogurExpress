// backend/index.js

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';
import inventoryRouter from './routes/inventory.js';
import promotionsRouter from './routes/promotions.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Origen permitido para CORS (por defecto http://localhost:4200 en desarrollo)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/promotions', promotionsRouter);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ message: 'YogurExpress Backend funcionando' });
});

// Arranque del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
