const { Router } = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  crearPedido,
  misPedidos,
  listarPedidos,
  actualizarEstadoPedido
} = require('../controllers/pedidoController');
const { authRequired, hasRole } = require('../middleware/auth');

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok:false, message: errors.array().map(e => e.msg).join(' | ') });
  }
  next();
};

router.post('/',
  authRequired,
  body('items').isArray({ min:1 }).withMessage('items requeridos'),
  handleValidation,
  crearPedido
);

router.get('/mine', authRequired, misPedidos);

router.get('/mine',
  authRequired,
  misPedidos
);

router.get('/',
  authRequired, hasRole('admin'),
  listarPedidos
);

router.patch('/:id/status',
  authRequired, hasRole('admin'),
  param('id').isMongoId(),
  body('status').isIn(['pendiente','enviado','cancelado']).withMessage('status inválido'),
  handleValidation,
  actualizarEstadoPedido
);

module.exports = router;
