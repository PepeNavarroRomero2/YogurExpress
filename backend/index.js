// backend/index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);

// Ruta de verificación básica
app.get('/', (req, res) => {
  res.json({ message: 'YogurExpress Backend funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
