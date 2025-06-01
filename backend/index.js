require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routers
const authRouter     = require('./routes/auth');
const productsRouter = require('./routes/products');
const ordersRouter   = require('./routes/orders');
const usersRouter    = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Montar rutas
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
