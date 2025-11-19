const Order = require('../models/pedido');
const Producto = require('../models/producto');

const crearPedido  = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ ok:false, message:'Items requeridos' });
    }

    const ids = items.map(i => i.product);
    const products = await Producto.find({ _id: { $in: ids } });
    const map = new Map(products.map(p => [String(p._id), p]));

    let total = 0;
    for (const it of items) {
      const p = map.get(String(it.product));
      if (!p) return res.status(404).json({ ok:false, message:'Producto no existe' });
      if (p.stock < it.qty) return res.status(400).json({ ok:false, message:`Stock insuficiente para ${p.nombre}` });
      total += p.precio * it.qty;
    }
    // descontar stock y congelar precio de compra
    for (const it of items) {
      const p = map.get(String(it.product));
      p.stock -= it.qty;
      await p.save();
      it.priceAtPurchase = p.precio;
    }

    const pedido  = await Order.create({ user: req.user.id, items, total });
    return res.status(201).json({ ok:true, data: pedido  });
  } catch (e) { next(e); }
};

const misPedidos  = async (req, res, next) => {
  try {
    const pedidos  = await Order.find({ user: req.user.id }).populate('items.product', 'nombre');
    return res.json({ ok:true, data: pedidos  });
  } catch (e) { next(e); }
};

const listarPedidos  = async (_req, res, next) => {
  try {
    const pedidos  = await Order.find({}).populate('user', 'email').populate('items.product', 'nombre');
    return res.json({ ok:true, data: pedidos  });
  } catch (e) { next(e); }
};

const actualizarEstadoPedido  = async (req, res, next) => {
  try {
    const { status } = req.body;
    const pedido  = await Order.findById(req.params.id);
    if (!pedido ) return res.status(404).json({ ok:false, message:'Pedido no encontrado' });

    if (pedido .status === 'cancelado' && status !== 'cancelado') {
      return res.status(400).json({ ok:false, message:'No se puede reactivar un pedido cancelado' });
    }
    if (status === 'cancelado' && pedido .status !== 'cancelado') {
      for (const it of order.items) {
        await Producto.findByIdAndUpdate(it.product, { $inc: { stock: it.qty } });
      }
    }
    pedido .status = status;
    await pedido .save();
    return res.json({ ok:true, data: pedido  });
  } catch (e) { next(e); }
};

module.exports = { crearPedido, misPedidos, listarPedidos, actualizarEstadoPedido };
