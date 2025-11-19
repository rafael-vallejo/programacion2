module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'no autenticado' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'requiere rol admin' });
  }
  next();
};
