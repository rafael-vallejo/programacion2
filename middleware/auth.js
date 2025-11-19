const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ ok:false, message:'Token requerido' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'S3cr3t@');
    req.user = payload; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ ok:false, message:'Token inválido o expirado' });
  }
}

function hasRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ ok:false, message:'No autenticado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ ok:false, message:'Rol insuficiente' });
    next();
  };
}

module.exports = { authRequired, hasRole };
