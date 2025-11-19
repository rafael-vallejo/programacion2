const jwt = require('jsonwebtoken');
const User = require('../models/user');

const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'S3cr3t@';
  const expiresIn = process.env.JWT_EXPIRES || '2h';
  return jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn });
};

const register = async (req, res, next) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).json({ ok:false, message:'Email ya registrado' });
    const user = await User.create(req.body);
    const token = signToken(user);
    return res.status(201).json({
      ok: true,
     data: { user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role }, token }
    });
  } catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ ok:false, message:'Usuario no encontrado' });
    const ok = await user.comparePassword(req.body.password);
    if (!ok) return res.status(400).json({ ok:false, message:'Credenciales inválidas' });
    const token = signToken(user);
    return res.json({ ok: true, data: { user: { id: user._id, nombre: user.nombre, email: user.email, role: user.role }, token } });
  } catch (e) { next(e); }
};

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    return res.json({ ok:true, data:user });
  } catch (e) { next(e); }
};

module.exports = { register, login, me };
