
const Producto = require('../models/producto');

const crearProducto = async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, stock, imagen, activo } = req.body;

    const data = await Producto.create({
      nombre,
      descripcion: descripcion || '',
      precio,
      stock,
      imagen: imagen || '',
      activo: typeof activo === 'boolean' ? activo : true,
    });

    return res.status(201).json({ ok: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/productos
 * Público: lista solo activos.
 * Admin: si viene ?all=1, lista todos (activos e inactivos).
 */

const listarProductos = async (req, res, next) => {
  try {
    const filtro = (req.query.all === '1') ? {} : { activo: true };
    const data = await Producto.find(filtro).sort('-createdAt');
    return res.json({ ok: true, data });
  } catch (e) { next(e); }
};


/**
 * GET /api/productos/:id
 * Público: solo ve productos activos.
 * Admin: con ?all=1 puede ver inactivos también.
 */
const obtenerProducto = async (req, res, next) => {
  try {
    const prod = await Producto.findById(req.params.id);
    if (!prod) {
      return res.status(404).json({ ok: false, message: 'producto no encontrado' });
    }

    const mostrarInactivo = (req.query.all === '1');
    if (!prod.activo && !mostrarInactivo) {
      return res.status(404).json({ ok: false, message: 'producto no disponible' });
    }

    return res.json({ ok: true, data: prod });
  } catch (e) {
    next(e);
  }
};

/**
 * PUT /api/productos/:id
 * Admin: actualiza producto
 */
const actualizarProducto = async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, stock, imagen, activo } = req.body;

    // Solo se actualiza campos permitidos
    const update = {};
    if (typeof nombre !== 'undefined') update.nombre = nombre;
    if (typeof descripcion !== 'undefined') update.descripcion = descripcion;
    if (typeof precio !== 'undefined') update.precio = precio;
    if (typeof stock !== 'undefined') update.stock = stock;
    if (typeof imagen !== 'undefined') update.imagen = imagen;
    if (typeof activo !== 'undefined') update.activo = activo;

    const data = await Producto.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({ ok: false, message: 'producto no encontrado' });
    }
    return res.json({ ok: true, data });
  } catch (e) {
    next(e);
  }
};

/**
 * DELETE /api/productos/:id
 * Admin: elimina producto .
 */
const eliminarProducto = async (req, res, next) => {
  try {
    const data = await Producto.findByIdAndDelete(req.params.id);

    if (!data) {
      return res.status(404).json({ ok: false, message: 'producto no encontrado' });
    }
    return res.json({ ok: true, data: { deleted: true } });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
};
