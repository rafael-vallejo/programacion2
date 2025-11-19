require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const productosRouter = require('./routes/productos');
const authRouter = require('./routes/auth');
const pedidosRouter = require('./routes/pedidos');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares base
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conectar DB
connectDB(process.env.MONGO_URI);

// Rutas
app.get('/', (_req, res) => res.json({ ok: true, nombre: 'E-Commerce API' }));
app.use('/api/auth', authRouter);
app.use('/api/productos', productosRouter);
app.use('/api/pedidos', pedidosRouter);

// 404 y errores
app.use((_req, _res, next) => next({ status: 404, message: 'Ruta no encontrada' }));
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ ok: false, message: err.message || 'Error interno' });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
