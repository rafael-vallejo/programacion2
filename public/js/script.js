// === Config ===
const API_BASE = 'http://localhost:4000';
const $ = (sel, root = document) => root.querySelector(sel);

// Estado global simple
const state = {
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  cart: []
};

// ---- Auth helpers ----
function setAuth(u, t) {
  state.user = u;
  state.token = t || state.token;
  if (t) localStorage.setItem('token', t);
  if (u) localStorage.setItem('user', JSON.stringify(u));
  renderUser();
}

function logout() {
  state.user = null;
  state.token = '';
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  renderUser();
}

// ---- Render usuario / botones ----
function renderUser() {
  console.log('renderUser state.user:', state.user);

  const esAdmin = state.user && state.user.role === 'admin';
  console.log('esAdmin:', esAdmin);

  const userInfo = $('#userInfo');
  if (userInfo) {
    userInfo.textContent = state.user
      ? `${state.user.nombre} (${state.user.role})`
      : 'Desconectado';
  }

  $('#btnOpenAuth')?.classList.toggle('d-none', !!state.user);
  $('#btnLogout')?.classList.toggle('d-none', !state.user);
  $('#btnOpenCart')?.classList.toggle('d-none', !state.user);

  // 👉 ahora usamos el <li> contenedor
  const adminWrap = $('#linkAdminWrap');
  if (adminWrap) {
    adminWrap.classList.toggle('d-none', !esAdmin);
  }
}


// ---- API helper ----
async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && state.token) headers['Authorization'] = 'Bearer ' + state.token;
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

// ---- Carrito (persistencia/local) ----
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
}
function loadCart() {
  state.cart = JSON.parse(localStorage.getItem('cart') || '[]');
}
function cartCount() {
  return state.cart.reduce((a, b) => a + b.qty, 0);
}

function renderCart() {
  const body = $('#cartBody');
  if (!body) return;

  if (state.cart.length === 0) {
    body.innerHTML = '<div class="text-secondary">Tu carrito está vacío.</div>';
    $('#cartTotal') && ($('#cartTotal').textContent = '0');
    return;
  }
  body.innerHTML = state.cart
    .map(
      (i, idx) => `
    <div class="card mb-2">
      <div class="card-body d-flex align-items-center gap-3">
        <div class="flex-grow-1">
          <div class="fw-semibold">${i.nombre}</div>
          <div class="text-secondary small">Precio: $ ${Number(i.precio).toLocaleString()}</div>
        </div>
        <div class="input-group" style="max-width: 180px">
          <button class="btn btn-outline-secondary" data-act="dec" data-idx="${idx}">-</button>
          <input class="form-control text-center" data-idx="${idx}" value="${i.qty}" type="number" min="1">
          <button class="btn btn-outline-secondary" data-act="inc" data-idx="${idx}">+</button>
        </div>
        <button class="btn btn-outline-danger" data-act="del" data-idx="${idx}">Quitar</button>
      </div>
    </div>
  `
    )
    .join('');

  body.querySelectorAll('button[data-act]').forEach(btn => {
    const idx = Number(btn.dataset.idx);
    const act = btn.dataset.act;
    btn.addEventListener('click', () => {
      if (act === 'inc') state.cart[idx].qty++;
      if (act === 'dec') state.cart[idx].qty = Math.max(1, state.cart[idx].qty - 1);
      if (act === 'del') state.cart.splice(idx, 1);
      afterCartChange();
    });
  });

  body.querySelectorAll('input[type="number"]').forEach(inp => {
    const idx = Number(inp.dataset.idx);
    inp.addEventListener('change', () => {
      const v = Math.max(1, Number(inp.value || 1));
      state.cart[idx].qty = v;
      afterCartChange();
    });
  });

  const total = state.cart.reduce((s, i) => s + i.precio * i.qty, 0);
  $('#cartTotal') && ($('#cartTotal').textContent = Number(total).toLocaleString());
}

function afterCartChange() {
  $('#cartCount') && ($('#cartCount').textContent = cartCount());
  saveCart();
  renderCart();
}

function addToCart(p, qty) {
  if (!qty || qty < 1) return;
  const existing = state.cart.find(i => i.product === p._id);
  if (existing) existing.qty += qty;
  else state.cart.push({ product: p._id, nombre: p.nombre, precio: p.precio, qty });
  afterCartChange();
}

// ---- Productos (público y admin) ----
async function loadProducts() {
  const cont = $('#products');
  if (!cont) return;

  cont.innerHTML = '<div class="text-secondary">Cargando...</div>';
  try {
    const json = await api('/api/productos');
    const items = json.data || [];
    const term = ($('#search')?.value || '').toLowerCase();

    cont.innerHTML = '';
    items
      .filter(p => p.nombre.toLowerCase().includes(term))
      .forEach(p => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
        col.innerHTML = `
        <div class="card h-100">
          ${p.imagen ? `<img src="${p.imagen}" class="card-img-top" alt="${p.nombre}">` : ''}
          <div class="card-body d-flex flex-column">
            <div class="small text-secondary mb-1">#${p._id}</div>
            <h5 class="card-title">${p.nombre}</h5>
            <p class="card-text flex-grow-1">${p.descripcion || ''}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="fw-bold">$ ${Number(p.precio).toLocaleString()}</span>
              <span class="badge text-bg-dark border">${p.stock} u</span>
            </div>
            <div class="input-group mt-2">
              <input type="number" class="form-control" min="1" max="${p.stock}" value="1">
              <button class="btn btn-info text-dark">Agregar</button>
            </div>
          </div>
        </div>`;
        const qtyInput = col.querySelector('input');
        col.querySelector('button').addEventListener('click', () =>
          addToCart(p, Number(qtyInput.value || 1))
        );
        cont.appendChild(col);
      });
  } catch (e) {
    cont.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
}

// Admin — productos
async function loadAdminProducts() {
  const cont = $('#adminProducts');
  if (!cont) return;

  cont.innerHTML = '<div class="text-secondary">Cargando...</div>';
  try {
    const json = await api('/api/productos?all=1', { auth: true });
    const items = json.data || [];
    cont.innerHTML = items
      .map(
        p => `
      <div class="col-12">
        <div class="card">
          <div class="card-body d-flex align-items-center gap-3">
            <div style="width:80px;height:60px;overflow:hidden;border-radius:.25rem;border:1px solid rgba(255,255,255,.1);">
              ${
                p.imagen
                  ? `<img src="${p.imagen}" alt="" style="width:100%;height:100%;object-fit:cover">`
                  : ''
              }
            </div>
            <div class="me-auto">
              <div class="fw-semibold">${p.nombre}</div>
              <div class="text-secondary small">
                Precio: $ ${Number(p.precio).toLocaleString()} · Stock: ${p.stock}
                ${
                  p.activo
                    ? '<span class="badge text-bg-success ms-2">Activo</span>'
                    : '<span class="badge text-bg-secondary ms-2">Inactivo</span>'
                }
              </div>
            </div>
            <button class="btn btn-sm btn-outline-warning" data-edit="${p._id}">Editar</button>
            <button class="btn btn-sm btn-outline-danger" data-del="${p._id}">Eliminar</button>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    cont.querySelectorAll('button[data-edit]').forEach(btn => {
      btn.addEventListener('click', () =>
        openProductModal(items.find(x => x._id === btn.dataset.edit))
      );
    });

    cont.querySelectorAll('button[data-del]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar producto?')) return;
        try {
          await api(`/api/productos/${btn.dataset.del}`, {
            method: 'DELETE',
            auth: true
          });
          alert('Eliminado');
          loadAdminProducts();
          loadProducts();
        } catch (e) {
          alert('Error: ' + e.message);
        }
      });
    });
  } catch (e) {
    cont.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
}

function openProductModal(p) {
  if (!state.user || state.user.role !== 'admin') {
    alert('Necesitás estar logueado como admin.');
    return;
  }
  $('#productModalTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';
  $('#prodId').value = p?._id || '';
  $('#prodNombre').value = p?.nombre || '';
  $('#prodDesc').value = p?.descripcion || '';
  $('#prodPrecio').value = p?.precio ?? '';
  $('#prodStock').value = p?.stock ?? '';
  $('#prodActivo').value = String(p?.activo ?? true);
  $('#prodImagen').value = p?.imagen || '';

  const modalEl = $('#productModal');
  if (!modalEl) return;

  if (window.bootstrap?.Modal) {
    new bootstrap.Modal(modalEl).show();
  } else {
    modalEl.style.display = 'block';
    modalEl.classList.add('show');
    modalEl.removeAttribute('aria-hidden');
  }
}

// Guardar producto (crear/editar)
$('#productForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const dto = {
    nombre: $('#prodNombre').value.trim(),
    descripcion: $('#prodDesc').value.trim(),
    precio: Number($('#prodPrecio').value),
    stock: Number($('#prodStock').value),
    activo: $('#prodActivo').value === 'true',
    imagen: $('#prodImagen').value.trim()
  };
  const id = $('#prodId').value;
  try {
    if (id)
      await api(`/api/productos/${id}`, {
        method: 'PUT',
        auth: true,
        body: dto
      });
    else await api('/api/productos', { method: 'POST', auth: true, body: dto });
    bootstrap.Modal.getInstance($('#productModal')).hide();
    loadAdminProducts();
    loadProducts();
  } catch (e2) {
    alert('Error: ' + e2.message);
  }
});

// ---- Pedidos ----
async function checkout() {
  if (!state.user || !state.token) return alert('Iniciá sesión para comprar.');
  if (state.cart.length === 0) return alert('Carrito vacío.');
  try {
    const payload = { items: state.cart.map(i => ({ product: i.product, qty: i.qty })) };
    const json = await api('/api/pedidos', {
      method: 'POST',
      body: payload,
      auth: true
    });
    alert('Pedido creado: ' + json.data._id);
    state.cart = [];
    afterCartChange();
  } catch (e) {
    alert('Error al crear pedido: ' + e.message);
  }
}

async function loadMine() {
  try {
    const json = await api('/api/pedidos/mine', { auth: true });
    const rows = (json.data || [])
      .map(
        o => `
      <tr>
        <td>${o._id}</td>
        <td>${new Date(o.createdAt).toLocaleString()}</td>
        <td><span class="badge text-bg-secondary">${o.status}</span></td>
        <td>$ ${Number(o.total).toLocaleString()}</td>
      </tr>`
      )
      .join('');
    const body = $('#mineBody');
    if (body) {
      body.innerHTML =
        rows || '<tr><td colspan="4" class="text-secondary">Sin pedidos</td></tr>';
    }
  } catch (e) {
    const body = $('#mineBody');
    if (body) {
      body.innerHTML = `<tr><td colspan="4"><div class="alert alert-danger m-0">Error: ${e.message}</div></td></tr>`;
    }
  }
}

async function loadAllOrders() {
  try {
    const json = await api('/api/pedidos', { auth: true });
    const cont = $('#allOrders');
    if (!cont) return;
    cont.innerHTML = '';
    (json.data || []).forEach(o => {
      const col = document.createElement('div');
      col.className = 'col-12';
      const options = ['pendiente', 'enviado', 'cancelado']
        .map(
          s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`
        )
        .join('');
      col.innerHTML = `
        <div class="card">
          <div class="card-body d-flex flex-wrap gap-2 align-items-center">
            <div class="me-auto">
              <div class="small text-secondary">#${o._id}</div>
              <div><strong>Total: $ ${Number(o.total).toLocaleString()}</strong></div>
              <div class="text-secondary">Cliente: ${o.user?.email || '—'}</div>
            </div>
            <select class="form-select w-auto">${options}</select>
            <button class="btn btn-outline-info">Actualizar</button>
          </div>
        </div>`;
      const sel = col.querySelector('select');
      col.querySelector('button').addEventListener('click', async () => {
        try {
          await api(`/api/pedidos/${o._id}/status`, {
            method: 'PATCH',
            auth: true,
            body: { status: sel.value }
          });
          alert('Estado actualizado');
        } catch (e) {
          alert('Error: ' + e.message);
        }
      });
      cont.appendChild(col);
    });
  } catch (e) {
    const cont = $('#allOrders');
    if (cont) cont.innerHTML = `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
}

// ---- Auth (login/registro) ----
async function doLogin() {
  const email = $('#loginEmail')?.value.trim();
  const password = $('#loginPass')?.value;
  try {
    const json = await api('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setAuth(json.data.user, json.data.token);
    bootstrap.Modal.getInstance($('#authModal')).hide();
  } catch (e) {
    alert('Login error: ' + e.message);
  }
}

async function doRegister() {
  const nombre = $('#regName')?.value.trim();
  const email = $('#regEmail')?.value.trim();
  const password = $('#regPass')?.value;
  try {
    const json = await api('/api/auth/register', {
      method: 'POST',
      body: { nombre, email, password }
    });
    setAuth(json.data.user, json.data.token);
    bootstrap.Modal.getInstance($('#authModal')).hide();
  } catch (e) {
    alert('Registro error: ' + e.message);
  }
}

// ---- Navegación ----
function showSection(id) {
  ['#secProductos', '#secPedidos', '#secAdmin'].forEach(s => {
    const el = document.querySelector(s);
    el && el.classList.add('d-none');
  });
  const sec = document.querySelector(id);
  sec && sec.classList.remove('d-none');
}

// ---- Eventos UI ----
document.addEventListener('DOMContentLoaded', () => {
  // init carrito
  loadCart();
  $('#cartCount') && ($('#cartCount').textContent = cartCount());

  // click deleg
  document.addEventListener('click', e => {
    const t = e.target;
    if (t && t.id === 'btnNewProduct') {
      e.preventDefault();
      openProductModal(null);
    }
  });

  // render inicial
  renderUser();
  loadProducts();

  // navegación
  const linkProductos = $('#linkProductos');
  if (linkProductos) {
    linkProductos.addEventListener('click', () => {
      showSection('#secProductos');
    });
  }

  const linkPedidos = $('#linkPedidos');
  if (linkPedidos) {
    linkPedidos.addEventListener('click', () => {
      showSection('#secPedidos');
      loadMine();
    });
  }

  const linkAdmin = $('#linkAdmin'); // mismo id que usamos arriba
  if (linkAdmin) {
    linkAdmin.addEventListener('click', () => {
      showSection('#secAdmin');
      loadAdminProducts();
      loadAllOrders();
    });
  }

  // productos
  $('#btnReload')?.addEventListener('click', loadProducts);
  $('#search')?.addEventListener('input', loadProducts);

  // carrito
  $('#btnOpenCart')?.addEventListener('click', renderCart);
  $('#btnCheckout2')?.addEventListener('click', checkout);

  // auth
  $('#btnLogin')?.addEventListener('click', doLogin);
  $('#btnRegister')?.addEventListener('click', doRegister);

  const btnLogout = $('#btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      logout();
      alert('Sesión cerrada');
    });
  }
});
