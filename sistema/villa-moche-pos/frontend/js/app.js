let currentUser = null;
let currentView = '';
let currentTableId = null;
let currentOrderId = null;
let notifications = [];

function showToast(msg, type) {
  const t = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast toast-' + (type || 'info');
  el.innerHTML = msg;
  t.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

function showModal(html) {
  document.getElementById('modalContent').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

function closeModalOutside(e) {
  if (e.target === e.currentTarget) closeModal();
}

function confirmAction(msg, callback) {
  showModal(`
    <h2>Confirmar</h2>
    <p>${msg}</p>
    <div class="flex gap-2 mt-4">
      <button class="btn btn-secondary flex-1" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-danger flex-1" id="confirmBtn">Confirmar</button>
    </div>
  `);
  document.getElementById('confirmBtn').onclick = () => { closeModal(); callback(); };
}

// ===== LOGIN =====

async function initApp() {
  const data = await DB.init();
  if (data) {
    populateLoginSelects();
    startClock();
    // Check for mesa param (public carta)
    const params = new URLSearchParams(window.location.search);
    if (params.get('mesa')) {
      showPublicMenu(parseInt(params.get('mesa')));
    }
  } else {
    document.getElementById('loginScreen').innerHTML = '<div class="login-box"><p class="text-center">Error de conexi&oacute;n con el servidor. Recargue la p&aacute;gina.</p></div>';
  }
}

function populateLoginSelects() {
  const users = DB.get('users') || [];
  const mozoSelect = document.getElementById('loginMozoSelect');
  const cajeraSelect = document.getElementById('loginCajeraSelect');
  mozoSelect.innerHTML = '<option value="">Seleccionar Mozo...</option>';
  cajeraSelect.innerHTML = '<option value="">Seleccionar Cajera...</option>';
  users.forEach(u => {
    if (u.role === 'mozo') {
      mozoSelect.innerHTML += `<option value="${u.id}">${u.name}</option>`;
    } else if (u.role === 'cajera') {
      cajeraSelect.innerHTML += `<option value="${u.id}">${u.name}</option>`;
    }
  });
}

function loginUser(id) {
  const user = DB.getById('users', id);
  if (!user) { showToast('Usuario no encontrado', 'error'); return; }
  setUser(user);
}

function loginSelected(role) {
  const select = role === 'mozo' ? document.getElementById('loginMozoSelect') : document.getElementById('loginCajeraSelect');
  const id = parseInt(select.value);
  if (!id) { showToast('Seleccione un ' + (role === 'mozo' ? 'mozo' : 'cajera'), 'warning'); return; }
  const user = DB.getById('users', id);
  if (!user) { showToast('Usuario no encontrado', 'error'); return; }
  setUser(user);
}

function setUser(user) {
  currentUser = user;
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';
  document.getElementById('topbarUserName').textContent = user.name;
  document.getElementById('topbarRoleName').textContent = capitalize(user.role);
  DB.login(user.id, (u) => {
    currentUser = u;
  });
  loadSidebar();
  navigateTo('dashboard');
}

function logout() {
  currentUser = null;
  currentView = '';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
}

// ===== NAVIGATION =====

function getRoleNavItems() {
  const role = currentUser ? currentUser.role : '';
  const items = {
    admin: [
      { section: 'Panel' },
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { id: 'mesas', icon: 'fa-chair', label: 'Mesas' },
      { id: 'menu', icon: 'fa-utensils', label: 'Carta/Men&uacute;' },
      { section: 'Gesti&oacute;n' },
      { id: 'inventory', icon: 'fa-warehouse', label: 'Inventario' },
      { id: 'recipes', icon: 'fa-kitchen-set', label: 'Recetas' },
      { id: 'promotions', icon: 'fa-tags', label: 'Promociones' },
      { id: 'reservations', icon: 'fa-calendar-check', label: 'Reservas' },
      { id: 'deliveries', icon: 'fa-truck', label: 'Delivery' },
      { id: 'customers', icon: 'fa-users', label: 'Clientes' },
      { id: 'cashier', icon: 'fa-cash-register', label: 'Caja' },
      { id: 'cash-closures', icon: 'fa-file-invoice-dollar', label: 'Cierres' },
      { section: 'Reportes' },
      { id: 'sales', icon: 'fa-chart-bar', label: 'Reporte Ventas' },
      { id: 'audit', icon: 'fa-history', label: 'Auditor&iacute;a' },
      { section: 'Sistema' },
      { id: 'areas', icon: 'fa-layer-group', label: 'Areas' },
      { id: 'users', icon: 'fa-user-gear', label: 'Usuarios' },
      { id: 'egresos', icon: 'fa-money-bill-transfer', label: 'Egresos' },
      { id: 'printers', icon: 'fa-print', label: 'Impresoras' },
      { id: 'settings', icon: 'fa-cog', label: 'Configuraci&oacute;n' }
    ],
    mozo: [
      { section: 'Panel' },
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { id: 'mesas', icon: 'fa-chair', label: 'Mesas' },
      { id: 'menu', icon: 'fa-utensils', label: 'Carta' },
      { section: 'Pedidos' },
      { id: 'my-orders', icon: 'fa-clipboard-list', label: 'Mis Pedidos' },
      { id: 'deliveries', icon: 'fa-truck', label: 'Delivery' },
      { id: 'customers', icon: 'fa-users', label: 'Clientes' },
      { id: 'cashier', icon: 'fa-cash-register', label: 'Caja' }
    ],
    cocina: [
      { section: 'Cocina' },
      { id: 'kitchen', icon: 'fa-fire-burner', label: 'Pedidos en Cocina' },
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { id: 'inventory', icon: 'fa-warehouse', label: 'Inventario' },
      { id: 'recipes', icon: 'fa-kitchen-set', label: 'Recetas' }
    ],
    cajera: [
      { section: 'Panel' },
      { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
      { id: 'cashier', icon: 'fa-cash-register', label: 'Caja' },
      { id: 'mesas', icon: 'fa-chair', label: 'Mesas' },
      { id: 'cash-closures', icon: 'fa-file-invoice-dollar', label: 'Cierres' },
      { id: 'egresos', icon: 'fa-money-bill-transfer', label: 'Egresos' },
      { id: 'sales', icon: 'fa-chart-bar', label: 'Ventas' }
    ]
  };
  return items[role] || items.admin;
}

function loadSidebar() {
  const navItems = getRoleNavItems();
  const menu = document.getElementById('sidebarMenu');
  menu.innerHTML = '';
  navItems.forEach(item => {
    if (item.section) {
      menu.innerHTML += `<div class="nav-section">${item.section}</div>`;
    } else {
      menu.innerHTML += `<div class="nav-item" data-view="${item.id}" onclick="navigateTo('${item.id}')">
        <i class="fas ${item.icon}"></i> ${item.label}
      </div>`;
    }
  });
}

function navigateTo(view, params) {
  if (view === currentView && !params) return;
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
  if (navEl) navEl.classList.add('active');
  const titles = { dashboard: 'Dashboard', mesas: 'Mesas', menu: 'Carta / Men&uacute;', inventory: 'Inventario', recipes: 'Recetas', promotions: 'Promociones', reservations: 'Reservas', deliveries: 'Delivery', customers: 'Clientes', cashier: 'Caja', 'cash-closures': 'Cierres de Caja', sales: 'Reporte de Ventas', audit: 'Auditor&iacute;a', areas: 'Areas', users: 'Usuarios', egresos: 'Egresos', printers: 'Impresoras', settings: 'Configuraci&oacute;n', 'my-orders': 'Mis Pedidos', kitchen: 'Cocina Central' };
  document.getElementById('pageTitle').innerHTML = titles[view] || view;
  const content = document.getElementById('contentArea');
  if (view === 'dashboard') renderDashboard(content);
  else if (view === 'mesas') renderMesas(content);
  else if (view === 'menu') renderMenu(content);
  else if (view === 'inventory') renderInventory(content);
  else if (view === 'recipes') renderRecipes(content);
  else if (view === 'promotions') renderPromotions(content);
  else if (view === 'reservations') renderReservations(content);
  else if (view === 'deliveries') renderDeliveries(content);
  else if (view === 'customers') renderCustomers(content);
  else if (view === 'cashier') renderCashier(content);
  else if (view === 'cash-closures') renderCashClosures(content);
  else if (view === 'sales') renderSales(content);
  else if (view === 'audit') renderAudit(content);
  else if (view === 'areas') renderAreas(content);
  else if (view === 'users') renderUsers(content);
  else if (view === 'egresos') renderEgresos(content);
  else if (view === 'printers') renderPrinters(content);
  else if (view === 'settings') renderSettings(content);
  else if (view === 'my-orders') renderMyOrders(content);
  else if (view === 'kitchen') renderKitchen(content);
  else content.innerHTML = '<div class="empty-state"><i class="fas fa-code"></i><p>Vista en construcci&oacute;n</p></div>';
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ===== NOTIFICATIONS =====

function addNotification(msg, type) {
  notifications.unshift({ msg, type, time: new Date().toLocaleTimeString() });
  if (notifications.length > 50) notifications.pop();
  updateNotifBell();
  if (type === 'new-order' || type === 'order-ready') {
    playAlertSound();
  }
}

function updateNotifBell() {
  const count = notifications.filter(n => !n.read).length;
  const bell = document.getElementById('notifBell');
  const badge = document.getElementById('notifCount');
  if (count > 0) {
    bell.style.display = 'block';
    badge.style.display = 'flex';
    badge.textContent = count;
  } else {
    bell.style.display = 'none';
    badge.style.display = 'none';
  }
}

function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('show');
  if (panel.classList.contains('show')) {
    let html = '';
    notifications.slice(0, 20).forEach((n, i) => {
      html += `<div class="notif-item" onclick="dismissNotif(${i})">${n.msg} <div class="notif-time">${n.time}</div></div>`;
    });
    panel.innerHTML = html || '<div class="notif-item">Sin notificaciones</div>';
  }
}

function dismissNotif(idx) {
  notifications[idx].read = true;
  updateNotifBell();
  toggleNotifications();
  toggleNotifications();
}

// ===== CLOCK =====

function startClock() {
  function tick() {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  tick();
  setInterval(tick, 1000);
}

// ===== PUBLIC CARTA DIGITAL =====

let publicCart = [];
let currentMesa = null;

function showPublicMenu(mesaId) {
  currentMesa = mesaId;
  const mesa = DB.getById('tables', mesaId);
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('publicMenuScreen').style.display = 'block';
  document.getElementById('publicMesaBadge').textContent = mesa ? mesa.name : 'Mesa ' + mesaId;
  renderPublicMenuItems();
}

function renderPublicMenuItems() {
  const body = document.getElementById('publicMenuBody');
  const items = DB.get('menu') || [];
  const categories = ['comida', 'bebidas', 'postres', 'chicha', 'helados', 'golosinas'];
  let html = '';
  categories.forEach(cat => {
    const catItems = items.filter(i => i.category === cat && i.available !== false);
    if (!catItems.length) return;
    html += `<h3 class="text-accent mb-2 mt-4">${getMenuCategoryName(cat)}</h3><div class="grid-2">`;
    catItems.forEach(i => {
      html += `<div class="menu-item" onclick="addToPublicCart(${i.id})">
        <div class="flex-between"><h4>${i.name}</h4><span class="menu-price">${formatCurrency(i.price)}</span></div>
        ${i.description ? `<div class="menu-desc">${i.description}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  });
  body.innerHTML = html || '<div class="empty-state"><p>Carta no disponible</p></div>';
  updatePublicCartFab();
}

function addToPublicCart(itemId) {
  const item = DB.getById('menu', itemId);
  if (!item) return;
  const existing = publicCart.find(i => i.id === itemId);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    publicCart.push({ ...item, qty: 1 });
  }
  showToast(`${item.name} agregado`, 'success');
  playBeep(600, 0.1);
  updatePublicCartFab();
}

function updatePublicCartFab() {
  const count = publicCart.reduce((s, i) => s + (i.qty || 1), 0);
  const fab = document.getElementById('publicCartFab');
  fab.style.display = count > 0 ? 'block' : 'none';
  document.getElementById('publicCartCount').textContent = count;
}

function showPublicCartModal() {
  let html = `<h2>Mi Pedido - ${document.getElementById('publicMesaBadge').textContent}</h2>`;
  if (!publicCart.length) {
    html += '<p class="text-muted">Carrito vac&iacute;o</p>';
  } else {
    html += '<div style="max-height:300px;overflow-y:auto">';
    publicCart.forEach((item, idx) => {
      html += `<div class="flex-between mb-2" style="padding:8px 0;border-bottom:1px solid var(--border-color)">
        <span>${item.name} x${item.qty}</span>
        <span class="flex gap-2">
          <span>${formatCurrency(item.price * item.qty)}</span>
          <button class="btn btn-danger btn-xs" onclick="removeFromPublicCart(${idx})"><i class="fas fa-times"></i></button>
        </span>
      </div>`;
    });
    const total = publicCart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    html += `<div class="flex-between mt-2" style="font-weight:700"><span>TOTAL</span><span class="text-accent">${formatCurrency(total)}</span></div>`;
    html += '</div>';
    html += `<div class="flex gap-2 mt-4">
      <button class="btn btn-secondary flex-1" onclick="clearPublicCart()"><i class="fas fa-trash"></i> Vaciar</button>
      <button class="btn btn-primary flex-1" onclick="sendPublicOrder()"><i class="fas fa-paper-plane"></i> Enviar Pedido</button>
    </div>`;
  }
  showModal(html);
}

function removeFromPublicCart(idx) {
  publicCart.splice(idx, 1);
  updatePublicCartFab();
  closeModal();
  showPublicCartModal();
}

function clearPublicCart() {
  publicCart = [];
  updatePublicCartFab();
  closeModal();
  showToast('Carrito vaciado', 'info');
}

function sendPublicOrder() {
  if (!publicCart.length) { showToast('Carrito vac&iacute;o', 'warning'); return; }
  const orderItems = publicCart.map(i => ({
    menuItemId: i.id, name: i.name, price: i.price, qty: i.qty,
    notes: '', comanda: 1, status: i.category === 'comida' ? 'pendiente' : 'entregado'
  }));
  const order = {
    id: generateId(),
    mesaId: currentMesa,
    mozoId: currentUser ? currentUser.id : 0,
    items: orderItems,
    total: publicCart.reduce((s, i) => s + i.price * (i.qty || 1), 0),
    status: 'pendiente',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    source: 'public',
    customerName: ''
  };
  DB.add('orders', order, currentUser ? currentUser.id : 0);
  showToast('Pedido enviado a la cocina', 'success');
  playSuccessSound();
  publicCart = [];
  updatePublicCartFab();
  closeModal();
}

// ===== INIT =====

document.addEventListener('DOMContentLoaded', initApp);
