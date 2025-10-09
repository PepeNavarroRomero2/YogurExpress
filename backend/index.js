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
import settingsRouter from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/settings', settingsRouter);

app.get('/', (_req, res) => {
  res.json({ message: 'YogurExpress Backend funcionando' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
