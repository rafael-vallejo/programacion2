// routes/productos.js
const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto
} = require('../controllers/productoController');

// ⬇️ Importá LAS FUNCIONES nombradas del auth que vos mostraste
const { authRequired, hasRole } = require('../middleware/auth');

const router = Router();

/* ====== Validaciones ====== */
const validarProducto = [
  body('nombre').notEmpty().withMessage('nombre requerido'),
  body('precio').isFloat({ min: 0 }).withMessage('precio inválido'),
  body('stock').isInt({ min: 0 }).withMessage('stock inválido'),
  body('imagen').optional().isString(),
  body('activo').optional().isBoolean()
];

const validarId = [
  param('id').isMongoId().withMessage('id inválido')
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ ok: false, message: errors.array().map(e => e.msg).join(' | ') });
  }
  next();
};

/* ====== Rutas ====== */

// Público: lista solo activos (el controller aplica filtro salvo ?all=1)
router.get('/', listarProductos);

// Admin: lista TODOS (activos e inactivos) – forzamos all=1
const setAllFlag = (req, _res, next) => { req.query.all = '1'; next(); };
router.get('/all', authRequired, hasRole('admin'), setAllFlag, listarProductos);

// Detalle (público; el controller devuelve 404 si está inactivo salvo ?all=1)
router.get('/:id', validarId, handleValidation, obtenerProducto);

// Crear (solo admin)
router.post(
  '/',
  authRequired, hasRole('admin'),
  validarProducto, handleValidation,
  crearProducto
);

// Actualizar (solo admin)
router.put(
  '/:id',
  authRequired, hasRole('admin'),
  [...validarId, ...validarProducto], handleValidation,
  actualizarProducto
);

// Eliminar (solo admin)
router.delete(
  '/:id',
  authRequired, hasRole('admin'),
  validarId, handleValidation,
  eliminarProducto
);

module.exports = router;
