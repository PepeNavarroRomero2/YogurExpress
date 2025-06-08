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

// ─── CORS ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS policy: origen ${origin} no permitido.`));
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── JSON parser ────────────────────────────────────────────────────────
app.use(express.json());

// ─── Rutas ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/promotions', promotionsRouter);

// ─── Sanity check ────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ message: 'YogurExpress Backend funcionando' });
});

// ─── Levantamos servidor ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
