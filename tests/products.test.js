const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('../config/db');
const productosRouter = require('../routes/productos');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/productos', productosRouter);

let adminToken;

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/ecommerce_test';
  await connectDB(process.env.MONGO_URI);
 const admin = await User.create({ nombre:'Admin', email:'admin@mail.com', password:'admin123', role:'admin' });
  adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'S3cr3t@');
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

test('Crear producto (admin)', async () => {
  const res = await request(app)
    .post('/api/productos')
    .set('Authorization', `Bearer ${adminToken}`) // aunque productos no exige auth por simplicidad del test, lo dejamos
    .send({ nombre:'Mouse', precio:4999.99, stock:10 });
  expect(res.status).toBe(201);
  expect(res.body.data.nombre).toBe('Mouse');
});

test('Listar productos', async () => {
  const res = await request(app).get('/api/productos');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
});
