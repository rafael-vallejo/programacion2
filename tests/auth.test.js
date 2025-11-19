const request = require('supertest');
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');


const app = require('express')();
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const connectDB = require('../config/db');
const authRouter = require('../routes/auth');

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/auth', authRouter);

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/ecommerce_test';
  await connectDB(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

let token;

test('Registro', async () => {
  const res = await request(app).post('/api/auth/register').send({
  nombre: 'Rafa', email: 'rafa@mail.com', password: 'secret123'
});
  expect(res.status).toBe(201);
  token = res.body.data.token;
  expect(token).toBeTruthy();
});

test('Login', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'rafa@mail.com', password: 'secret123'
  });
  expect(res.status).toBe(200);
  expect(res.body.data.user.email).toBe('rafa@mail.com');
});
