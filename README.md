# programacion2
# PROYECTO FINAL E‑Commerce - Rafael Vallejo


## 1) Qué hace
- **Usuarios**: registro y login. El token guarda `id`, `email` y `role`.
- **Productos**: CRUD (solo admin). El público ve **solo activos**.
- **Pedidos**: el cliente arma **carrito** (front) y hace **checkout** → se crea un pedido con total.
- **Admin**: ve todos los productos (activos e inactivos) y todos los pedidos; puede cambiar estado.

---

## 2) Estructura rápida
```
app.js                # levanta Express, middlewares y rutas
db.js                 # conecta a Mongo (mongoose)

/models/              # esquemas de Mongoose
  user.js             # nombre, email, password hash, role
  producto.js         # nombre, precio, stock, imagen, activo
  pedido.js           # user, items[{product, qty, priceAt}], total, status

/controllers/         # lógica principal
  authController.js   # regisro/login (emite JWT)
  productoController.js
  pedidoController.js

/routes/              # endpoints + validaciones
  auth.js             # /api/auth/*
  productos.js        # /api/productos/*
  pedidos.js          # /api/pedidos/*

/middleware/
  auth.js             # authRequired + hasRole('admin')
  errorHandler.js     # (opcional) manejo de errores

/public/              # front con Bootstrap
  index.html
  js/script.js
```

---

## 3) Correr el proyecto
**.env**
```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=supersecreto
JWT_EXPIRES=8h
```
**Comandos**
```bash
npm i
npm run dev   # o node app.js
```

---

## 4) Endpoints clave (resumen)
**Auth**
- `POST /api/auth/register` → crea usuario y devuelve `{ user, token }`
- `POST /api/auth/login` → devuelve `{ user, token }`

**Productos**
- `GET /api/productos` → público (solo `activo:true`)
- `GET /api/productos?all=1` **o** `/api/productos/all` → **admin** (ver todos)
- `POST /api/productos` → **admin**
- `PUT /api/productos/:id` → **admin**
- `DELETE /api/productos/:id` → **admin**

**Pedidos**
- `POST /api/pedidos` → **cliente** (desde el carrito del front)
- `GET /api/pedidos/mine` → **cliente** (mis pedidos)
- `GET /api/pedidos` → **admin**
- `PATCH /api/pedidos/:id/status` → **admin** (`pendiente|enviado|cancelado`)

---

## 5) Seguridad y middleware (simple)
- **JWT** en `Authorization: Bearer <token>`.
- `authRequired` verifica token y setea `req.user`.
- `hasRole('admin')` bloquea rutas de admin.
- Validación de datos con **express‑validator** en las rutas.
- Regla importante: el **catálogo público** trae solo `activo:true`; admin usa `?all=1`.

---

## 6) Front (qué hace)
- `script.js` llama a la API con `fetch`.
- Muestra catálogo público, permite agregar al **carrito (localStorage)**.
- **Checkout** crea pedido (pide login).
- **Admin**: pantalla que pide `/api/productos?all=1` y permite crear/editar/borrar productos.

---

## 7) Casos de uso 
1. **Registrarse** → token (rol `cliente`).  
2. **Login** → token guardado en `localStorage`.  
3. **Ver productos** → GET `/api/productos` (activados).  
4. **Admin** → CRUD y ver todos con `?all=1`.  
5. **Carrito + Checkout** → POST `/api/pedidos`.  
6. **Mis pedidos** → GET `/api/pedidos/mine`.  
7. **Admin pedidos** → GET `/api/pedidos` y `PATCH /:id/status`.

---

## 8) Patrones que usé 
- **Controllers**: concentran la lógica de cada caso (evito meter lógica en rutas).
- **Middlewares**: auth y roles encadenados antes del controller.
- **Modelos Mongoose**: como “repositorio” para no escribir consultas crudas.
- **Validación al borde**: las rutas validan, los controllers asumen datos limpios.

---

## 9) Tests 
- Con **Jest + Supertest**: probar login, `GET /api/productos`, y que admin pueda crear/editar producto. 
