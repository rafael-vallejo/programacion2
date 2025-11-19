const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/userController');
const { authRequired } = require('../middleware/auth');
const { validationResult } = require('express-validator');

const router = Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ ok:false, message: errors.array().map(e=>`${e.path}: ${e.msg}`).join(' | ') });
  }
  next();
};

router.post('/register',
  body('nombre').notEmpty().withMessage('nombre requerido'),
  body('email').isEmail().withMessage('email inválido'),
  body('password').isLength({ min: 6 }).withMessage('password min 6'),
  handleValidation,
  register
);

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  handleValidation,
  login
);

router.get('/me', authRequired, me);

module.exports = router;
