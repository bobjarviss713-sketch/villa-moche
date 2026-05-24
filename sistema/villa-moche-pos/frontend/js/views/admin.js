// ===================== DASHBOARD =====================

function renderDashboard(el) {
  const orders = DB.get('orders') || [];
  const menu = DB.get('menu') || [];
  const tables = DB.get('tables') || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => o.createdAt >= today.getTime());
  const todaySales = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'en-cocina').length;
  const freeTables = tables.filter(t => t.status === 'libre').length;
  const ocupTables = tables.filter(t => t.status === 'ocupada' || t.status === 'cocina').length;
  const topItems = {};
  orders.forEach(o => (o.items || []).forEach(i => { const n = i.name || i.menuItemId; topItems[n] = (topItems[n] || 0) + (i.qty || 1); }));
  const sortedItems = Object.entries(topItems).sort((a, b) => b[1] - a[1]).slice(0, 8);

  let html = `<div class="grid-2 mb-4">
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><h4>${formatCurrency(todaySales)}</h4><p>Ventas Hoy</p></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-clipboard-list"></i></div><div class="stat-info"><h4>${todayOrders.length}</h4><p>Pedidos Hoy</p></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="fas fa-hourglass-half"></i></div><div class="stat-info"><h4>${pendingOrders}</h4><p>Pendientes</p></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-chair"></i></div><div class="stat-info"><h4>${ocupTables}/${tables.length}</h4><p>Mesas Ocupadas</p></div></div>
  </div>`;

  if (sortedItems.length) {
    html += `<div class="card mb-4"><div class="card-header"><h3>Productos M&aacute;s Vendidos Hoy</h3></div>`;
    html += `<div class="grid-2">`;
    sortedItems.forEach(([name, qty]) => {
      html += `<div class="flex-between" style="padding:6px 0;border-bottom:1px solid var(--border-color)"><span>${name}</span><span class="text-accent fw-700">${qty}</span></div>`;
    });
    html += `</div></div>`;
  }

  html += `<div class="card"><div class="card-header"><h3>Mesas</h3></div><div class="grid-4 mt-2">`;
  tables.forEach(t => {
    const order = orders.find(o => o.mesaId === t.id && (o.status === 'pendiente' || o.status === 'en-cocina' || o.status === 'listo'));
    const itemCount = order ? (order.items || []).reduce((s, i) => s + (i.qty || 1), 0) : 0;
    html += `<div class="mesa-card ${getTableStatusClass(t.status)}" onclick="navigateTo('mesas')">
      <div class="mesa-icon">${getTableIcon(t.name)}</div>
      <div class="mesa-name">${t.name}</div>
      <div class="mesa-status">${capitalize(t.status)}</div>
      ${itemCount ? `<span class="mesa-badge-count">${itemCount}</span>` : ''}
    </div>`;
  });
  html += `</div></div>`;

  // Recent orders
  html += `<div class="card mt-4"><div class="card-header"><h3>&Uacute;ltimos Pedidos</h3></div>`;
  const recent = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  if (recent.length) {
    html += `<div class="data-table-wrap">`;
    recent.forEach(o => {
      const mesa = getById(DB.get('tables'), o.mesaId);
      html += `<div class="order-card">
        <div class="order-header"><span class="order-mesa">${mesa ? mesa.name : 'Mesa ' + o.mesaId}</span>
          <span class="order-status ${o.status}">${capitalize(o.status)}</span></div>
        <div class="order-items">${(o.items || []).slice(0, 3).map(i => `${i.name || 'Item'} x${i.qty || 1}`).join(', ')}${(o.items || []).length > 3 ? '...' : ''}</div>
        <div class="text-muted" style="font-size:11px">${formatDate(o.createdAt)} - ${getUserName(o.mozoId)}</div>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="empty-state"><p>No hay pedidos recientes</p></div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
}

// ===================== MESAS =====================

function renderMesas(el) {
  const tables = DB.get('tables') || [];
  const orders = DB.get('orders') || [];
  const role = currentUser.role;
  const canEdit = role === 'admin';

  let html = `<div class="flex-between mb-4">`;
  html += `<div class="tabs">
    ${['todas', 'libre', 'ocupada', 'reservada'].map(s => `<button class="tab ${s === 'todas' ? 'active' : ''}" onclick="this.parentElement.querySelector('.active').classList.remove('active');this.classList.add('active');filterMesas('${s}')">${capitalize(s)}</button>`).join('')}
  </div>`;
  if (canEdit) {
    html += `<button class="btn btn-primary" onclick="showAddMesaModal()"><i class="fas fa-plus"></i> Mesa</button>`;
  }
  html += `</div>`;

  html += `<div id="mesasGrid" class="grid-4">`;
  tables.forEach(t => {
    const order = orders.find(o => o.mesaId === t.id && (o.status === 'pendiente' || o.status === 'en-cocina' || o.status === 'listo'));
    const itemCount = order ? (order.items || []).reduce((s, i) => s + (i.qty || 1), 0) : 0;
    const ocupada = t.status === 'ocupada' || t.status === 'cocina' || t.status === 'listo';
    html += `<div class="mesa-card ${getTableStatusClass(t.status)}" data-filter="${t.status}" onclick="onMesaClick(${t.id})">
      <div class="mesa-icon">${getTableIcon(t.name)}</div>
      <div class="mesa-name">${t.name}</div>
      <div class="mesa-status">${capitalize(t.status)}</div>
      ${itemCount ? `<span class="mesa-badge-count">${itemCount}</span>` : ''}
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function filterMesas(filter) {
  const cards = document.querySelectorAll('#mesasGrid .mesa-card');
  cards.forEach(c => {
    if (filter === 'todas') { c.style.display = ''; return; }
    c.style.display = c.dataset.filter === filter ? '' : 'none';
  });
}

function onMesaClick(mesaId) {
  const mesa = DB.getById('tables', mesaId);
  if (!mesa) return;
  if (mesa.status === 'mantenimiento') { showToast('Mesa en mantenimiento', 'warning'); return; }
  const orders = DB.get('orders') || [];
  const activeOrder = orders.find(o => o.mesaId === mesaId && (o.status === 'pendiente' || o.status === 'en-cocina' || o.status === 'listo'));

  let html = `<h2>${getTableIcon(mesa.name)} ${mesa.name}</h2>`;
  html += `<p class="text-muted mb-4">${mesa.description || ''} &bull; ${capitalize(mesa.status)}</p>`;

  const role = currentUser.role;
  if ((role === 'admin' || role === 'mozo') && mesa.status !== 'ocupada') {
    html += `<button class="btn btn-primary mb-4" onclick="startOrder(${mesaId})"><i class="fas fa-plus"></i> Nuevo Pedido</button>`;
  }
  if (role === 'admin') {
    html += `<button class="btn btn-secondary" onclick="showEditMesaModal(${mesaId})" style="margin-left:8px"><i class="fas fa-edit"></i> Editar Mesa</button>`;
  }
  if (activeOrder) {
    html += `<h3 class="mt-4 mb-2">Pedido Activo</h3>`;
    html += renderOrderCard(activeOrder);
  }
  const mesaOrders = orders.filter(o => o.mesaId === mesaId && o.status === 'entregado').slice(-5).reverse();
  if (mesaOrders.length) {
    html += `<h3 class="mt-4 mb-2">Pedidos Anteriores</h3>`;
    mesaOrders.forEach(o => html += renderOrderCard(o));
  }
  if (!activeOrder && !mesaOrders.length) {
    html += `<div class="empty-state mt-4"><p>No hay pedidos para esta mesa</p></div>`;
  }

  showModal(html);
}

function showAddMesaModal() {
  showModal(`
    <h2>Nueva Mesa</h2>
    <div class="input-group"><label>Nombre</label><input id="addMesaName" placeholder="Ej: Mesa 1"></div>
    <div class="input-group"><label>Descripci&oacute;n</label><input id="addMesaDesc" placeholder="Opcional"></div>
    <div class="input-group"><label>Capacidad</label><input id="addMesaCap" type="number" value="4"></div>
    <div class="input-group"><label>Estado</label><select id="addMesaStatus"><option value="libre">Libre</option><option value="mantenimiento">Mantenimiento</option></select></div>
    <button class="btn btn-primary mt-2" onclick="saveNewMesa()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewMesa() {
  const name = document.getElementById('addMesaName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  const mesa = {
    id: DB.getNextId('tables'),
    name,
    description: document.getElementById('addMesaDesc').value.trim(),
    capacity: parseInt(document.getElementById('addMesaCap').value) || 4,
    status: document.getElementById('addMesaStatus').value
  };
  DB.add('tables', mesa, currentUser.id);
  closeModal();
  showToast('Mesa creada', 'success');
  navigateTo('mesas');
}

function showEditMesaModal(mesaId) {
  const m = DB.getById('tables', mesaId);
  if (!m) return;
  showModal(`
    <h2>Editar Mesa</h2>
    <div class="input-group"><label>Nombre</label><input id="editMesaName" value="${m.name}"></div>
    <div class="input-group"><label>Descripci&oacute;n</label><input id="editMesaDesc" value="${m.description || ''}"></div>
    <div class="input-group"><label>Capacidad</label><input id="editMesaCap" type="number" value="${m.capacity || 4}"></div>
    <div class="input-group"><label>Estado</label><select id="editMesaStatus">
      ${['libre','ocupada','cocina','listo','reservada','mantenimiento'].map(s => `<option value="${s}" ${m.status === s ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
    </select></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditMesa(${mesaId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deleteMesa(${mesaId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditMesa(mesaId) {
  const name = document.getElementById('editMesaName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.update('tables', mesaId, {
    name,
    description: document.getElementById('editMesaDesc').value.trim(),
    capacity: parseInt(document.getElementById('editMesaCap').value) || 4,
    status: document.getElementById('editMesaStatus').value
  }, currentUser.id);
  closeModal();
  showToast('Mesa actualizada', 'success');
  navigateTo('mesas');
}

function deleteMesa(mesaId) {
  confirmAction('Eliminar esta mesa?', () => {
    DB.delete('tables', mesaId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    showToast('Mesa eliminada', 'info');
    navigateTo('mesas');
  });
}

// ===================== ORDERS =====================

function startOrder(mesaId) {
  DB.update('tables', mesaId, { status: 'ocupada' }, currentUser.id);
  showOrderModal(mesaId, null);
}

function showOrderModal(mesaId, existingOrder) {
  const mesa = DB.getById('tables', mesaId);
  const menu = DB.get('menu') || [];
  const categories = ['comida', 'bebidas', 'postres', 'chicha', 'helados', 'golosinas'];

  let html = `<h2>${mesa ? mesa.name : 'Mesa ' + mesaId} - Pedido</h2>`;

  if (existingOrder) {
    html += `<div style="max-height:200px;overflow-y:auto;margin-bottom:12px">`;
    html += `<table class="data-table"><tr><th>Item</th><th>Cant</th><th>Precio</th><th>Notas</th><th></th></tr>`;
    existingOrder.items.forEach((item, idx) => {
      html += `<tr>
        <td>${item.name}</td>
        <td>${item.qty}</td>
        <td>${formatCurrency(item.price * item.qty)}</td>
        <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis">${item.notes || ''}</td>
        <td><button class="btn btn-danger btn-xs" onclick="removeOrderItem(${existingOrder.id}, ${idx})"><i class="fas fa-times"></i></button></td>
      </tr>`;
    });
    html += `</table>`;
    html += `<div class="flex-between mt-2" style="font-weight:700;font-size:16px"><span>TOTAL</span><span class="text-accent">${formatCurrency(existingOrder.total)}</span></div>`;
    html += `</div>`;
  }

  // Menu selector
  html += `<div style="max-height:300px;overflow-y:auto">`;
  categories.forEach(cat => {
    const catItems = menu.filter(i => i.category === cat && i.available !== false);
    if (!catItems.length) return;
    html += `<div class="nav-section">${getMenuCategoryName(cat)}</div><div class="flex flex-wrap gap-2 mb-2">`;
    catItems.forEach(i => {
      html += `<button class="btn btn-secondary btn-sm" onclick="addItemToOrder(${mesaId}, ${i.id})">${i.name} ${formatCurrency(i.price)}</button>`;
    });
    html += `</div>`;
  });
  html += `</div>`;

  const orderId = existingOrder ? existingOrder.id : 'new';
  html += `<div class="input-group mt-2"><label>Notas generales</label><input id="orderNotes" placeholder="Notas..." value="${existingOrder ? (existingOrder.notes || '') : ''}"></div>`;

  if (currentUser.role === 'mozo' || currentUser.role === 'admin') {
    if (existingOrder) {
      html += `<div class="flex gap-2 mt-2"><button class="btn btn-primary flex-1" onclick="updateOrderItems(${mesaId}, ${existingOrder.id})"><i class="fas fa-save"></i> Actualizar Pedido</button>
        <button class="btn btn-danger" onclick="cancelOrder(${existingOrder.id})"><i class="fas fa-ban"></i> Cancelar</button></div>`;
    } else {
      html += `<button class="btn btn-primary mt-2" onclick="saveOrder(${mesaId})"><i class="fas fa-paper-plane"></i> Enviar a Cocina</button>`;
    }
  }

  showModal(html);
  if (existingOrder) window._currentEditOrder = existingOrder;
}

function addItemToOrder(mesaId, menuItemId) {
  const item = DB.getById('menu', menuItemId);
  if (!item) return;
  const orders = DB.get('orders') || [];
  let order = orders.find(o => o.mesaId === mesaId && (o.status === 'pendiente' || o.status === 'en-cocina' || o.status === 'listo'));

  if (!order) {
    order = {
      id: generateId(),
      mesaId,
      mozoId: currentUser.id,
      items: [],
      total: 0,
      status: 'pendiente',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      source: 'pos',
      customerName: ''
    };
    DB.add('orders', order, currentUser.id);
    // We need to wait for the order to be created, but for now let's just create it locally
    const onSync = (data) => {
      const newOrder = data.find(o => o.id === order.id);
      if (newOrder) {
        DB.off('orders', onSync);
        continueAdd(newOrder.id);
      }
    };
    DB.on('orders', onSync);
    setTimeout(() => continueAdd(order.id), 500);
  } else {
    continueAdd(order.id);
  }

  function continueAdd(orderId) {
    const existing = DB.getById('orders', orderId);
    if (!existing) return;
    const items = [...(existing.items || [])];
    const existingItem = items.find(i => i.menuItemId === menuItemId && i.status === 'pendiente');
    if (existingItem) {
      existingItem.qty = (existingItem.qty || 1) + 1;
    } else {
      items.push({ menuItemId: item.id, name: item.name, price: item.price, qty: 1, notes: '', comanda: getLastComanda(items) + 1, status: item.category === 'comida' ? 'pendiente' : 'entregado' });
    }
    const total = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    DB.update('orders', orderId, { items, total, updatedAt: Date.now() }, currentUser.id);
    DB.update('tables', mesaId, { status: 'ocupada' }, currentUser.id);
    showToast(`${item.name} agregado`, 'success');
    playBeep(600, 0.1);
    closeModal();
    if (existing) showOrderModal(mesaId, { ...existing, items, total });
  }
}

function saveOrder(mesaId) {
  const orders = DB.get('orders') || [];
  const order = orders.find(o => o.mesaId === mesaId && o.status === 'pendiente');
  if (!order || !order.items.length) { showToast('Agregue items al pedido', 'warning'); closeModal(); return; }
  const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';
  if (notes) DB.update('orders', order.id, { notes, updatedAt: Date.now() }, currentUser.id);
  // Mark comida items as 'pendiente', others as 'entregado'
  const items = order.items.map(i => {
    const menuItem = DB.getById('menu', i.menuItemId);
    return { ...i, status: menuItem && menuItem.category === 'comida' ? 'pendiente' : 'entregado' };
  });
  DB.update('orders', order.id, { items, status: 'pendiente', updatedAt: Date.now() }, currentUser.id);
  showToast('Pedido enviado a cocina', 'success');
  playSuccessSound();
  closeModal();
}

function updateOrderItems(mesaId, orderId) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const notes = document.getElementById('orderNotes') ? document.getElementById('orderNotes').value.trim() : '';
  DB.update('orders', orderId, { notes, updatedAt: Date.now() }, currentUser.id);
  showToast('Pedido actualizado', 'success');
  closeModal();
}

function removeOrderItem(orderId, itemIdx) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const items = [...order.items];
  items.splice(itemIdx, 1);
  const total = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);
  DB.update('orders', orderId, { items, total, updatedAt: Date.now() }, currentUser.id);
  closeModal();
  showOrderModal(order.mesaId, { ...order, items, total });
}

function cancelOrder(orderId) {
  confirmAction('Cancelar este pedido?', () => {
    const order = DB.getById('orders', orderId);
    if (!order) return;
    DB.update('orders', orderId, { status: 'cancelado', updatedAt: Date.now() }, currentUser.id);
    // Free table if no other active order
    const orders = DB.get('orders') || [];
    const hasOther = orders.some(o => o.mesaId === order.mesaId && o.id !== orderId && (o.status === 'pendiente' || o.status === 'en-cocina' || o.status === 'listo'));
    if (!hasOther) DB.update('tables', order.mesaId, { status: 'libre' }, currentUser.id);
    closeModal();
    showToast('Pedido cancelado', 'info');
  });
}

function renderOrderCard(order) {
  const mesa = DB.getById('tables', order.mesaId);
  const isCocina = currentUser.role === 'cocina';
  let html = `<div class="order-card">
    <div class="order-header">
      <span class="order-mesa">${mesa ? mesa.name : 'Mesa ' + order.mesaId}</span>
      <span class="order-status ${order.status}">${capitalize(order.status)}</span>
    </div>
    <ul class="order-items">`;
  order.items.forEach(i => {
    const statusDot = i.status === 'listo' ? '<i class="fas fa-check-circle text-green"></i>' : i.status === 'en-cocina' ? '<i class="fas fa-fire text-amber"></i>' : '<i class="fas fa-clock text-muted"></i>';
    html += `<li>${statusDot} ${i.name} x${i.qty} ${i.notes ? '<small class="text-muted">(' + i.notes + ')</small>' : ''}</li>`;
  });
  html += `</ul>
    <div class="order-actions">`;
  if (order.status === 'pendiente' && isCocina) {
    html += `<button class="btn btn-primary btn-sm" onclick="acceptOrder(${order.id})"><i class="fas fa-check"></i> Aceptar</button>`;
  }
  if (order.status === 'en-cocina' && isCocina) {
    html += `<button class="btn btn-success btn-sm" onclick="markItemsReady(${order.id})"><i class="fas fa-utensils"></i> Marcar Listo</button>`;
  }
  if (order.status === 'listo' && (currentUser.role === 'mozo' || currentUser.role === 'admin')) {
    html += `<button class="btn btn-success btn-sm" onclick="deliverOrder(${order.id})"><i class="fas fa-check-double"></i> Entregar</button>`;
  }
  if (currentUser.role === 'admin' || currentUser.role === 'mozo') {
    html += `<button class="btn btn-secondary btn-sm" onclick="showOrderModal(${order.mesaId}, ${JSON.stringify(order).replace(/"/g, '&quot;')})"><i class="fas fa-edit"></i> Editar</button>`;
    html += `<button class="btn btn-danger btn-sm" onclick="cancelOrder(${order.id})"><i class="fas fa-ban"></i></button>`;
  }
  html += `</div>
    <div class="text-muted" style="font-size:11px;margin-top:6px">${getUserName(order.mozoId)} &bull; ${formatDate(order.createdAt)} &bull; ${formatCurrency(order.total)}</div>
  </div>`;
  return html;
}

function acceptOrder(orderId) {
  DB.update('orders', orderId, { status: 'en-cocina', updatedAt: Date.now() }, currentUser.id);
  showToast('Pedido en cocina', 'success');
}

function markItemsReady(orderId) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const items = order.items.map(i => i.status === 'pendiente' || i.status === 'en-cocina' ? { ...i, status: 'listo' } : i);
  const allReady = items.every(i => i.status === 'listo' || i.status === 'entregado');
  DB.update('orders', orderId, { items, status: allReady ? 'listo' : order.status, updatedAt: Date.now() }, currentUser.id);
  if (allReady) {
    DB.audit(currentUser.id, currentUser.name, 'order-ready', `Pedido #${orderId} listo para entregar`);
  }
  showToast('Items marcados como listos', 'success');
}

function deliverOrder(orderId) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const items = order.items.map(i => ({ ...i, status: 'entregado' }));
  DB.update('orders', orderId, { items, status: 'entregado', updatedAt: Date.now() }, currentUser.id);
  // Free table
  const orders = DB.get('orders') || [];
  const hasOther = orders.some(o => o.mesaId === order.mesaId && o.id !== orderId && (o.status === 'pendiente' || o.status === 'en-cocina' || o.status === 'listo'));
  if (!hasOther) {
    DB.update('tables', order.mesaId, { status: 'libre' }, currentUser.id);
  }
  showToast('Pedido entregado', 'success');
  playSuccessSound();
}

// ===================== MENU =====================

function renderMenu(el) {
  const menu = DB.get('menu') || [];
  const categories = ['comida', 'bebidas', 'postres', 'chicha', 'helados', 'golosinas'];
  const isAdmin = currentUser.role === 'admin';

  let html = `<div class="flex-between mb-4">`;
  html += `<div class="tabs">
    ${categories.map((c, i) => `<button class="tab ${i === 0 ? 'active' : ''}" onclick="switchMenuTab('${c}', this)">${getMenuCategoryName(c)}</button>`).join('')}
    ${isAdmin ? `<button class="tab" onclick="switchMenuTab('all', this)">Todos</button>` : ''}
  </div>`;
  if (isAdmin) {
    html += `<button class="btn btn-primary" onclick="showAddMenuItemModal()"><i class="fas fa-plus"></i> Item</button>`;
  }
  html += `</div><div id="menuGrid" class="grid-2">`;

  const displayItems = isAdmin ? menu : menu.filter(i => i.available !== false);
  displayItems.forEach(i => {
    html += `<div class="menu-item" data-category="${i.category}" ${isAdmin ? `onclick="showEditMenuItemModal(${i.id})"` : ''}>
      <div class="flex-between">
        <h4>${i.name} ${i.available === false ? '<small class="text-red">(inactivo)</small>' : ''}</h4>
        <span class="menu-price">${formatCurrency(i.price)}</span>
      </div>
      ${i.description ? `<div class="menu-desc">${i.description}</div>` : ''}
      <span class="menu-badge">${getMenuCategoryName(i.category)}</span>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function switchMenuTab(cat, btn) {
  document.querySelectorAll('#menuGrid .menu-item').forEach(el => {
    if (cat === 'all') { el.style.display = ''; return; }
    el.style.display = el.dataset.category === cat ? '' : 'none';
  });
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

function showAddMenuItemModal() {
  showModal(`
    <h2>Nuevo Item de Men&uacute;</h2>
    <div class="input-group"><label>Nombre</label><input id="addMenuName"></div>
    <div class="input-group"><label>Descripci&oacute;n</label><textarea id="addMenuDesc"></textarea></div>
    <div class="input-group"><label>Precio (S/)</label><input id="addMenuPrice" type="number" step="0.5" value="0"></div>
    <div class="input-group"><label>Categor&iacute;a</label><select id="addMenuCategory">${['comida','bebidas','postres','chicha','helados','golosinas'].map(c => `<option value="${c}">${getMenuCategoryName(c)}</option>`).join('')}</select></div>
    <div class="input-group"><label><input id="addMenuAvailable" type="checkbox" checked> Disponible</label></div>
    <button class="btn btn-primary mt-2" onclick="saveNewMenuItem()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewMenuItem() {
  const name = document.getElementById('addMenuName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  const item = {
    id: DB.getNextId('menu'),
    name,
    description: document.getElementById('addMenuDesc').value.trim(),
    price: parseFloat(document.getElementById('addMenuPrice').value) || 0,
    category: document.getElementById('addMenuCategory').value,
    available: document.getElementById('addMenuAvailable').checked
  };
  DB.add('menu', item, currentUser.id);
  closeModal();
  showToast('Item creado', 'success');
  navigateTo('menu');
}

function showEditMenuItemModal(itemId) {
  const item = DB.getById('menu', itemId);
  if (!item) return;
  showModal(`
    <h2>Editar Item</h2>
    <div class="input-group"><label>Nombre</label><input id="editMenuName" value="${item.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Descripci&oacute;n</label><textarea id="editMenuDesc">${(item.description || '').replace(/"/g, '&quot;')}</textarea></div>
    <div class="input-group"><label>Precio (S/)</label><input id="editMenuPrice" type="number" step="0.5" value="${item.price}"></div>
    <div class="input-group"><label>Categor&iacute;a</label><select id="editMenuCategory">${['comida','bebidas','postres','chicha','helados','golosinas'].map(c => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${getMenuCategoryName(c)}</option>`).join('')}</select></div>
    <div class="input-group"><label><input id="editMenuAvailable" type="checkbox" ${item.available !== false ? 'checked' : ''}> Disponible</label></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditMenuItem(${itemId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deleteMenuItem(${itemId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditMenuItem(itemId) {
  const name = document.getElementById('editMenuName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.update('menu', itemId, {
    name,
    description: document.getElementById('editMenuDesc').value.trim(),
    price: parseFloat(document.getElementById('editMenuPrice').value) || 0,
    category: document.getElementById('editMenuCategory').value,
    available: document.getElementById('editMenuAvailable').checked
  }, currentUser.id);
  closeModal();
  showToast('Item actualizado', 'success');
  navigateTo('menu');
}

function deleteMenuItem(itemId) {
  confirmAction('Eliminar este item del men&uacute;?', () => {
    DB.delete('menu', itemId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    showToast('Item eliminado', 'info');
    navigateTo('menu');
  });
}

// ===================== INVENTORY =====================

function renderInventory(el) {
  const inv = DB.get('inventory') || [];
  const isAdmin = currentUser.role === 'admin';

  let html = `<div class="flex-between mb-4">
    <h3>Inventario</h3>
    ${isAdmin ? `<button class="btn btn-primary" onclick="showAddInvModal()"><i class="fas fa-plus"></i> Item</button>` : ''}
  </div>`;
  html += `<input class="mb-4" style="width:100%;padding:10px 12px;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--bg-input);color:var(--text-primary);font-size:14px;outline:none" placeholder="Buscar..." oninput="filterInv(this.value)">`;
  html += `<div class="grid-2" id="invGrid">`;
  (inv || []).forEach(i => {
    const lowStock = i.stock <= (i.minStock || 5);
    html += `<div class="card" data-search="${i.name.toLowerCase()} ${(i.unit || '').toLowerCase()}" ${isAdmin ? `onclick="showEditInvModal(${i.id})"` : ''}>
      <div class="flex-between"><h4>${i.name}</h4><span class="${lowStock ? 'text-red' : 'text-green'}" style="font-weight:600">${i.stock} ${i.unit || ''}</span></div>
      <div class="text-muted" style="font-size:12px">M&iacute;n: ${i.minStock || 5} ${i.unit || ''}</div>
      ${lowStock ? '<div style="margin-top:6px;height:4px;background:var(--bg-input);border-radius:2px"><div style="width:' + Math.min(100, (i.stock / (i.minStock || 5)) * 100) + '%;height:100%;background:var(--red);border-radius:2px"></div></div>' : ''}
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function filterInv(val) {
  const q = val.toLowerCase();
  document.querySelectorAll('#invGrid .card').forEach(el => {
    el.style.display = el.dataset.search.includes(q) ? '' : 'none';
  });
}

function showAddInvModal() {
  showModal(`
    <h2>Nuevo Item Inventario</h2>
    <div class="input-group"><label>Nombre</label><input id="addInvName"></div>
    <div class="input-group"><label>Stock Actual</label><input id="addInvStock" type="number" value="0"></div>
    <div class="input-group"><label>Stock M&iacute;nimo</label><input id="addInvMin" type="number" value="5"></div>
    <div class="input-group"><label>Unidad</label><select id="addInvUnit"><option value="unidades">Unidades</option><option value="kg">Kg</option><option value="litros">Litros</option><option value="porciones">Porciones</option><option value="bolsas">Bolsas</option><option value="cajas">Cajas</option></select></div>
    <button class="btn btn-primary mt-2" onclick="saveNewInv()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewInv() {
  const name = document.getElementById('addInvName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('inventory', {
    id: DB.getNextId('inventory'),
    name,
    stock: parseFloat(document.getElementById('addInvStock').value) || 0,
    minStock: parseFloat(document.getElementById('addInvMin').value) || 5,
    unit: document.getElementById('addInvUnit').value
  }, currentUser.id);
  closeModal();
  showToast('Item creado', 'success');
  navigateTo('inventory');
}

function showEditInvModal(itemId) {
  const item = DB.getById('inventory', itemId);
  if (!item) return;
  showModal(`
    <h2>Editar Inventario</h2>
    <div class="input-group"><label>Nombre</label><input id="editInvName" value="${item.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Stock Actual</label><input id="editInvStock" type="number" value="${item.stock}"></div>
    <div class="input-group"><label>Stock M&iacute;nimo</label><input id="editInvMin" type="number" value="${item.minStock || 5}"></div>
    <div class="input-group"><label>Ajuste (+/-)</label><input id="editInvAdjust" type="number" value="0" step="0.5" placeholder="Cantidad a sumar/restar"></div>
    <div class="input-group"><label>Unidad</label><select id="editInvUnit"><option value="unidades" ${item.unit === 'unidades' ? 'selected' : ''}>Unidades</option><option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>Kg</option><option value="litros" ${item.unit === 'litros' ? 'selected' : ''}>Litros</option><option value="porciones" ${item.unit === 'porciones' ? 'selected' : ''}>Porciones</option><option value="bolsas" ${item.unit === 'bolsas' ? 'selected' : ''}>Bolsas</option><option value="cajas" ${item.unit === 'cajas' ? 'selected' : ''}>Cajas</option></select></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditInv(${itemId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deleteInvItem(${itemId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditInv(itemId) {
  const name = document.getElementById('editInvName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  const adjust = parseFloat(document.getElementById('editInvAdjust').value) || 0;
  const item = DB.getById('inventory', itemId);
  const newStock = Math.max(0, (item ? item.stock : 0) + adjust);
  DB.update('inventory', itemId, {
    name,
    stock: newStock,
    minStock: parseFloat(document.getElementById('editInvMin').value) || 5,
    unit: document.getElementById('editInvUnit').value
  }, currentUser.id);
  if (adjust !== 0) {
    DB.audit(currentUser.id, currentUser.name, 'inventory-adjust', `Inventario: ${name} ajustado en ${adjust > 0 ? '+' : ''}${adjust} (${newStock})`);
  }
  closeModal();
  showToast('Inventario actualizado', 'success');
  navigateTo('inventory');
}

function deleteInvItem(itemId) {
  confirmAction('Eliminar este item del inventario?', () => {
    DB.delete('inventory', itemId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    navigateTo('inventory');
  });
}

// ===================== RECIPES =====================

function renderRecipes(el) {
  const recipes = DB.get('recipes') || [];
  const menu = DB.get('menu') || [];
  const inv = DB.get('inventory') || [];

  let html = `<div class="flex-between mb-4">
    <h3>Recetas</h3>
    <button class="btn btn-primary" onclick="showAddRecipeModal()"><i class="fas fa-plus"></i> Receta</button>
  </div><div class="grid-2">`;

  (recipes || []).forEach(r => {
    const menuItem = menu.find(m => m.id === r.menuItemId);
    html += `<div class="card" onclick="showEditRecipeModal(${r.id})">
      <h4>${menuItem ? menuItem.name : 'Item #' + r.menuItemId}</h4>
      <div style="font-size:12px;color:var(--text-secondary)">${r.ingredients.map(ing => {
        const invItem = inv.find(i => i.id === ing.inventoryId);
        return `${invItem ? invItem.name : 'Ing #' + ing.inventoryId}: ${ing.quantity} ${invItem ? invItem.unit : ''}`;
      }).join(', ')}</div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddRecipeModal() {
  const menu = DB.get('menu') || [];
  const inv = DB.get('inventory') || [];
  showModal(`
    <h2>Nueva Receta</h2>
    <div class="input-group"><label>Item del Men&uacute;</label><select id="addRecipeMenuItem">${menu.filter(i => i.category === 'comida').map(i => `<option value="${i.id}">${i.name}</option>`).join('')}</select></div>
    <h4 class="mb-2">Ingredientes</h4>
    <div id="recipeIngredients">${inv.map((i, idx) => `<div class="flex gap-2 mb-2"><select style="flex:2;padding:8px;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--bg-input);color:var(--text-primary)" disabled><option>${i.name}</option></select><input type="number" step="0.1" value="0" style="flex:1;padding:8px;border:1px solid var(--border-color);border-radius:var(--radius-sm);background:var(--bg-input);color:var(--text-primary)" data-inv-id="${i.id}" placeholder="Cant"></div>`).join('')}</div>
    <button class="btn btn-primary mt-2" onclick="saveNewRecipe()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewRecipe() {
  const menuItemId = parseInt(document.getElementById('addRecipeMenuItem').value);
  if (!menuItemId) { showToast('Seleccione un item', 'warning'); return; }
  const ingredients = [];
  document.querySelectorAll('#recipeIngredients input[data-inv-id]').forEach(input => {
    const qty = parseFloat(input.value);
    if (qty > 0) ingredients.push({ inventoryId: parseInt(input.dataset.invId), quantity: qty });
  });
  if (!ingredients.length) { showToast('Agregue al menos un ingrediente', 'warning'); return; }
  DB.add('recipes', { id: DB.getNextId('recipes'), menuItemId, ingredients }, currentUser.id);
  closeModal();
  showToast('Receta creada', 'success');
  navigateTo('recipes');
}

function showEditRecipeModal(recipeId) {
  const r = DB.getById('recipes', recipeId);
  if (!r) return;
  const menu = DB.get('menu') || [];
  const inv = DB.get('inventory') || [];
  const menuItem = menu.find(m => m.id === r.menuItemId);
  showModal(`
    <h2>Receta: ${menuItem ? menuItem.name : 'Item #' + r.menuItemId}</h2>
    <p class="text-muted">Ingredientes:</p>
    <ul style="margin:12px 0">${r.ingredients.map(ing => {
      const invItem = inv.find(i => i.id === ing.inventoryId);
      return `<li>${invItem ? invItem.name : 'ID ' + ing.inventoryId}: ${ing.quantity} ${invItem ? invItem.unit : ''}</li>`;
    }).join('')}</ul>
    <button class="btn btn-danger" onclick="deleteRecipe(${recipeId})"><i class="fas fa-trash"></i> Eliminar Receta</button>
  `);
}

function deleteRecipe(recipeId) {
  confirmAction('Eliminar esta receta?', () => {
    DB.delete('recipes', recipeId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    navigateTo('recipes');
  });
}

// ===================== PROMOTIONS =====================

function renderPromotions(el) {
  const promos = DB.get('promotions') || [];
  const menu = DB.get('menu') || [];
  let html = `<div class="flex-between mb-4"><h3>Promociones</h3>
    <button class="btn btn-primary" onclick="showAddPromoModal()"><i class="fas fa-plus"></i> Promoci&oacute;n</button>
  </div><div class="grid-2">`;
  (promos || []).forEach(p => {
    const menuItem = menu.find(m => m.id === p.menuItemId);
    html += `<div class="card" onclick="showEditPromoModal(${p.id})">
      <h4>${p.name}</h4>
      <div style="font-size:13px">${menuItem ? menuItem.name : ''} - ${formatCurrency(p.price)} <span class="text-red" style="text-decoration:line-through">${formatCurrency(p.originalPrice)}</span></div>
      <div class="text-muted" style="font-size:11px">${p.active !== false ? 'Activa' : 'Inactiva'} ${p.expires ? ' - Hasta ' + formatDateShort(p.expires) : ''}</div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddPromoModal() {
  const menu = DB.get('menu') || [];
  showModal(`
    <h2>Nueva Promoci&oacute;n</h2>
    <div class="input-group"><label>Nombre</label><input id="addPromoName"></div>
    <div class="input-group"><label>Item del Men&uacute;</label><select id="addPromoItem">${menu.map(i => `<option value="${i.id}">${i.name} - ${formatCurrency(i.price)}</option>`).join('')}</select></div>
    <div class="input-group"><label>Precio Promocional (S/)</label><input id="addPromoPrice" type="number" step="0.5"></div>
    <div class="input-group"><label>Precio Original (S/)</label><input id="addPromoOrig" type="number" step="0.5"></div>
    <div class="input-group"><label>Vence</label><input id="addPromoExpires" type="date"></div>
    <button class="btn btn-primary mt-2" onclick="saveNewPromo()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewPromo() {
  const name = document.getElementById('addPromoName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('promotions', {
    id: DB.getNextId('promotions'),
    name,
    menuItemId: parseInt(document.getElementById('addPromoItem').value),
    price: parseFloat(document.getElementById('addPromoPrice').value) || 0,
    originalPrice: parseFloat(document.getElementById('addPromoOrig').value) || 0,
    expires: document.getElementById('addPromoExpires').value ? new Date(document.getElementById('addPromoExpires').value).getTime() : null,
    active: true
  }, currentUser.id);
  closeModal();
  showToast('Promoci&oacute;n creada', 'success');
  navigateTo('promotions');
}

function showEditPromoModal(promoId) {
  const p = DB.getById('promotions', promoId);
  if (!p) return;
  showModal(`
    <h2>Editar Promoci&oacute;n</h2>
    <div class="input-group"><label>Nombre</label><input id="editPromoName" value="${p.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Precio Promocional</label><input id="editPromoPrice" type="number" step="0.5" value="${p.price}"></div>
    <div class="input-group"><label><input id="editPromoActive" type="checkbox" ${p.active !== false ? 'checked' : ''}> Activa</label></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditPromo(${promoId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deletePromo(${promoId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditPromo(promoId) {
  DB.update('promotions', promoId, {
    name: document.getElementById('editPromoName').value.trim(),
    price: parseFloat(document.getElementById('editPromoPrice').value) || 0,
    active: document.getElementById('editPromoActive').checked
  }, currentUser.id);
  closeModal();
  showToast('Promoci&oacute;n actualizada', 'success');
  navigateTo('promotions');
}

function deletePromo(promoId) {
  confirmAction('Eliminar promoci&oacute;n?', () => {
    DB.delete('promotions', promoId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    navigateTo('promotions');
  });
}

// ===================== RESERVATIONS =====================

function renderReservations(el) {
  const res = DB.get('reservations') || [];
  const tables = DB.get('tables') || [];
  let html = `<div class="flex-between mb-4"><h3>Reservas</h3>
    <button class="btn btn-primary" onclick="showAddResModal()"><i class="fas fa-plus"></i> Reserva</button>
  </div><div class="grid-2">`;
  (res || []).forEach(r => {
    const table = tables.find(t => t.id === r.mesaId);
    html += `<div class="card">
      <div class="flex-between"><h4>${r.customerName}</h4><span class="badge">${r.people} pers</span></div>
      <div class="text-muted" style="font-size:12px">${table ? table.name : 'Mesa ' + r.mesaId} &bull; ${formatDate(r.date)}</div>
      ${r.notes ? `<div style="font-size:12px;color:var(--text-secondary)">${r.notes}</div>` : ''}
      <div class="flex gap-2 mt-2">
        <button class="btn btn-success btn-xs" onclick="confirmRes(${r.id})"><i class="fas fa-check"></i> Confirmar</button>
        <button class="btn btn-danger btn-xs" onclick="deleteRes(${r.id})"><i class="fas fa-times"></i></button>
      </div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddResModal() {
  const tables = DB.get('tables') || [];
  showModal(`
    <h2>Nueva Reserva</h2>
    <div class="input-group"><label>Cliente</label><input id="addResName"></div>
    <div class="input-group"><label>Mesa</label><select id="addResMesa">${tables.filter(t => t.status === 'libre' || t.status === 'reservada').map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>
    <div class="input-group"><label>Personas</label><input id="addResPeople" type="number" value="2"></div>
    <div class="input-group"><label>Fecha y Hora</label><input id="addResDate" type="datetime-local"></div>
    <div class="input-group"><label>Notas</label><textarea id="addResNotes"></textarea></div>
    <button class="btn btn-primary mt-2" onclick="saveNewRes()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewRes() {
  const name = document.getElementById('addResName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  const mesaId = parseInt(document.getElementById('addResMesa').value);
  DB.add('reservations', {
    id: DB.getNextId('reservations'),
    mesaId,
    customerName: name,
    people: parseInt(document.getElementById('addResPeople').value) || 2,
    date: document.getElementById('addResDate').value ? new Date(document.getElementById('addResDate').value).getTime() : Date.now(),
    notes: document.getElementById('addResNotes').value.trim(),
    status: 'pendiente',
    createdAt: Date.now()
  }, currentUser.id);
  DB.update('tables', mesaId, { status: 'reservada' }, currentUser.id);
  closeModal();
  showToast('Reserva creada', 'success');
  navigateTo('reservations');
}

function confirmRes(resId) {
  DB.update('reservations', resId, { status: 'confirmada' }, currentUser.id);
  showToast('Reserva confirmada', 'success');
  navigateTo('reservations');
}

function deleteRes(resId) {
  const r = DB.getById('reservations', resId);
  confirmAction('Eliminar reserva?', () => {
    DB.delete('reservations', resId, currentUser.id, currentUser.name, 'Eliminado');
    if (r) DB.update('tables', r.mesaId, { status: 'libre' }, currentUser.id);
    navigateTo('reservations');
  });
}

// ===================== DELIVERIES =====================

function renderDeliveries(el) {
  const dels = DB.get('deliveries') || [];
  let html = `<div class="flex-between mb-4"><h3>Delivery</h3>
    <button class="btn btn-primary" onclick="showAddDelModal()"><i class="fas fa-plus"></i> Delivery</button>
  </div><div class="grid-2">`;
  (dels || []).forEach(d => {
    html += `<div class="order-card">
      <div class="order-header"><span class="order-mesa">${d.customerName}</span><span class="order-status ${d.status}">${capitalize(d.status)}</span></div>
      <div class="text-muted" style="font-size:12px">${d.address || ''} ${d.phone ? '- ' + d.phone : ''}</div>
      <div>${(d.items || []).map(i => `${i.name} x${i.qty}`).join(', ')} - ${formatCurrency(d.total)}</div>
      <div class="order-actions mt-2">
        ${d.status === 'pendiente' ? `<button class="btn btn-primary btn-sm" onclick="updateDelStatus(${d.id}, 'en-camino')"><i class="fas fa-truck"></i> En Camino</button>` : ''}
        ${d.status === 'en-camino' ? `<button class="btn btn-success btn-sm" onclick="updateDelStatus(${d.id}, 'entregado')"><i class="fas fa-check"></i> Entregado</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteDel(${d.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddDelModal() {
  const menu = DB.get('menu') || [];
  showModal(`
    <h2>Nuevo Delivery</h2>
    <div class="input-group"><label>Cliente</label><input id="addDelName"></div>
    <div class="input-group"><label>Direcci&oacute;n</label><input id="addDelAddr"></div>
    <div class="input-group"><label>Tel&eacute;fono</label><input id="addDelPhone"></div>
    <div class="input-group"><label>Items</label><textarea id="addDelItems" placeholder="Ej: 2x Arroz con pollo, 1x Chicha"></textarea></div>
    <div class="input-group"><label>Total (S/)</label><input id="addDelTotal" type="number" step="0.5"></div>
    <button class="btn btn-primary mt-2" onclick="saveNewDel()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewDel() {
  const name = document.getElementById('addDelName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('deliveries', {
    id: DB.getNextId('deliveries'),
    customerName: name,
    address: document.getElementById('addDelAddr').value.trim(),
    phone: document.getElementById('addDelPhone').value.trim(),
    items: [{ name: document.getElementById('addDelItems').value.trim(), qty: 1 }],
    total: parseFloat(document.getElementById('addDelTotal').value) || 0,
    status: 'pendiente',
    mozoId: currentUser.id,
    createdAt: Date.now()
  }, currentUser.id);
  closeModal();
  showToast('Delivery creado', 'success');
  navigateTo('deliveries');
}

function updateDelStatus(delId, status) {
  DB.update('deliveries', delId, { status, updatedAt: Date.now() }, currentUser.id);
  showToast('Delivery actualizado', 'success');
  navigateTo('deliveries');
}

function deleteDel(delId) {
  confirmAction('Eliminar delivery?', () => {
    DB.delete('deliveries', delId, currentUser.id, currentUser.name, 'Eliminado');
    navigateTo('deliveries');
  });
}

// ===================== CUSTOMERS =====================

function renderCustomers(el) {
  const customers = DB.get('customers') || [];
  let html = `<div class="flex-between mb-4"><h3>Clientes</h3>
    <button class="btn btn-primary" onclick="showAddCustomerModal()"><i class="fas fa-plus"></i> Cliente</button>
  </div><div class="grid-2">`;
  (customers || []).forEach(c => {
    html += `<div class="card" onclick="showEditCustomerModal(${c.id})">
      <h4>${c.name}</h4>
      <div class="text-muted" style="font-size:12px">${c.phone || ''} ${c.email ? '- ' + c.email : ''}</div>
      ${c.notes ? `<div style="font-size:12px">${c.notes}</div>` : ''}
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddCustomerModal() {
  showModal(`
    <h2>Nuevo Cliente</h2>
    <div class="input-group"><label>Nombre</label><input id="addCustName"></div>
    <div class="input-group"><label>Tel&eacute;fono</label><input id="addCustPhone"></div>
    <div class="input-group"><label>Email</label><input id="addCustEmail" type="email"></div>
    <div class="input-group"><label>Notas</label><textarea id="addCustNotes"></textarea></div>
    <button class="btn btn-primary mt-2" onclick="saveNewCustomer()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewCustomer() {
  const name = document.getElementById('addCustName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('customers', {
    id: DB.getNextId('customers'),
    name,
    phone: document.getElementById('addCustPhone').value.trim(),
    email: document.getElementById('addCustEmail').value.trim(),
    notes: document.getElementById('addCustNotes').value.trim(),
    createdAt: Date.now()
  }, currentUser.id);
  closeModal();
  showToast('Cliente creado', 'success');
  navigateTo('customers');
}

function showEditCustomerModal(custId) {
  const c = DB.getById('customers', custId);
  if (!c) return;
  showModal(`
    <h2>Editar Cliente</h2>
    <div class="input-group"><label>Nombre</label><input id="editCustName" value="${c.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Tel&eacute;fono</label><input id="editCustPhone" value="${(c.phone || '').replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Email</label><input id="editCustEmail" value="${(c.email || '').replace(/"/g, '&quot;')}"></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditCustomer(${custId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deleteCustomer(${custId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditCustomer(custId) {
  DB.update('customers', custId, {
    name: document.getElementById('editCustName').value.trim(),
    phone: document.getElementById('editCustPhone').value.trim(),
    email: document.getElementById('editCustEmail').value.trim()
  }, currentUser.id);
  closeModal();
  showToast('Cliente actualizado', 'success');
  navigateTo('customers');
}

function deleteCustomer(custId) {
  confirmAction('Eliminar cliente?', () => {
    DB.delete('customers', custId, currentUser.id, currentUser.name, 'Eliminado');
    closeModal();
    navigateTo('customers');
  });
}

// ===================== SALES =====================

function renderSales(el) {
  const orders = DB.get('orders') || [];
  const menu = DB.get('menu') || [];
  const delivered = orders.filter(o => o.status === 'entregado');
  const totalSales = delivered.reduce((s, o) => s + (o.total || 0), 0);
  const totalOrders = delivered.length;

  // By category
  const catSales = {};
  delivered.forEach(o => (o.items || []).forEach(i => {
    const mi = menu.find(m => m.id === i.menuItemId);
    const cat = mi ? mi.category : 'otro';
    catSales[cat] = (catSales[cat] || 0) + (i.price * (i.qty || 1));
  }));

  let html = `<div class="grid-3 mb-4">
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><h4>${formatCurrency(totalSales)}</h4><p>Ventas Totales</p></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-receipt"></i></div><div class="stat-info"><h4>${totalOrders}</h4><p>Pedidos</p></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="fas fa-chart-line"></i></div><div class="stat-info"><h4>${totalOrders ? formatCurrency(totalSales / totalOrders) : formatCurrency(0)}</h4><p>Ticket Promedio</p></div></div>
  </div>`;

  if (Object.keys(catSales).length) {
    html += `<div class="card mb-4"><div class="card-header"><h3>Ventas por Categor&iacute;a</h3></div>`;
    Object.entries(catSales).forEach(([cat, val]) => {
      html += `<div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--border-color)"><span>${getMenuCategoryName(cat)}</span><span class="text-accent">${formatCurrency(val)}</span></div>`;
    });
    html += `</div>`;
  }

  html += `<div class="card"><div class="card-header"><h3>&Uacute;ltimos Pedidos</h3></div>`;
  html += `<table class="data-table"><tr><th>Mesa</th><th>Items</th><th>Total</th><th>Mozo</th><th>Hora</th></tr>`;
  const recent = [...delivered].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
  recent.forEach(o => {
    const mesa = getById(DB.get('tables'), o.mesaId);
    html += `<tr><td>${mesa ? mesa.name : 'Mesa ' + o.mesaId}</td>
      <td>${(o.items || []).slice(0, 3).map(i => i.name).join(', ')}</td>
      <td class="text-accent">${formatCurrency(o.total)}</td>
      <td>${getUserName(o.mozoId)}</td>
      <td class="text-muted">${formatDate(o.updatedAt)}</td></tr>`;
  });
  html += `</table></div>`;
  html += `<button class="btn btn-secondary mt-4" onclick="exportSalesCSV()"><i class="fas fa-download"></i> Exportar CSV</button>`;

  el.innerHTML = html;
}

function exportSalesCSV() {
  const orders = DB.get('orders') || [];
  const delivered = orders.filter(o => o.status === 'entregado');
  exportToCSV(delivered.map(o => ({
    id: o.id, mesa: (getById(DB.get('tables'), o.mesaId) || {}).name || o.mesaId,
    mozo: getUserName(o.mozoId), total: o.total,
    items: (o.items || []).map(i => `${i.name} x${i.qty}`).join('; '),
    fecha: formatDate(o.createdAt), status: o.status
  })), 'ventas_villa_moche', ['id', 'mesa', 'mozo', 'total', 'items', 'fecha', 'status']);
}

// ===================== AUDIT =====================

function renderAudit(el) {
  const logs = DB.get('auditLogs') || [];
  let html = `<h3 class="mb-4">Registro de Auditor&iacute;a</h3>`;
  html += `<table class="data-table"><tr><th>Fecha</th><th>Usuario</th><th>Acci&oacute;n</th><th>Detalle</th></tr>`;
  const recent = [...logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
  recent.forEach(l => {
    html += `<tr><td class="text-muted" style="font-size:11px">${formatDate(l.timestamp)}</td>
      <td>${l.userName || getUserName(l.userId)}</td>
      <td>${l.action}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${l.detail || ''}</td></tr>`;
  });
  html += `</table>`;
  html += `<div class="mt-4 flex gap-2">
    <button class="btn btn-secondary btn-sm" onclick="showDeletedLogs()"><i class="fas fa-trash-alt"></i> Registro de Borrados</button>
    <button class="btn btn-secondary btn-sm" onclick="exportAuditCSV()"><i class="fas fa-download"></i> Exportar</button>
  </div>`;
  el.innerHTML = html;
}

function showDeletedLogs() {
  DB.getDeletedLogs((logs) => {
    let html = `<h2>Registro de Borrados</h2>`;
    if (!logs || !logs.length) {
      html += `<p class="text-muted">No hay registros de borrados</p>`;
    } else {
      html += `<table class="data-table"><tr><th>Fecha</th><th>Usuario</th><th>Colecci&oacute;n</th><th>ID</th><th>Raz&oacute;n</th></tr>`;
      logs.forEach(l => {
        html += `<tr><td class="text-muted">${formatDate(l.timestamp)}</td><td>${l.userName || 'N/A'}</td><td>${l.collection}</td><td>${l.itemId}</td><td>${l.reason || ''}</td></tr>`;
      });
      html += `</table>`;
    }
    showModal(html);
  });
}

function exportAuditCSV() {
  const logs = DB.get('auditLogs') || [];
  exportToCSV(logs.sort((a, b) => b.timestamp - a.timestamp).map(l => ({
    fecha: formatDate(l.timestamp), usuario: l.userName || getUserName(l.userId),
    accion: l.action, detalle: l.detail
  })), 'auditoria_villa_moche', ['fecha', 'usuario', 'accion', 'detalle']);
}

// ===================== AREAS =====================

function renderAreas(el) {
  const areas = DB.get('areas') || [];
  let html = `<div class="flex-between mb-4"><h3>Areas</h3>
    <button class="btn btn-primary" onclick="showAddAreaModal()"><i class="fas fa-plus"></i> Area</button>
  </div><div class="grid-2">`;
  (areas || []).forEach(a => {
    html += `<div class="card" onclick="showEditAreaModal(${a.id})">
      <h4>${a.name}</h4>
      <div class="text-muted" style="font-size:12px">${a.description || ''}</div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddAreaModal() {
  showModal(`<h2>Nueva Area</h2>
    <div class="input-group"><label>Nombre</label><input id="addAreaName"></div>
    <div class="input-group"><label>Descripci&oacute;n</label><input id="addAreaDesc"></div>
    <button class="btn btn-primary mt-2" onclick="saveNewArea()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewArea() {
  const name = document.getElementById('addAreaName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('areas', { id: DB.getNextId('areas'), name, description: document.getElementById('addAreaDesc').value.trim() }, currentUser.id);
  closeModal();
  showToast('Area creada', 'success');
  navigateTo('areas');
}

function showEditAreaModal(areaId) {
  const a = DB.getById('areas', areaId);
  if (!a) return;
  showModal(`<h2>Editar Area</h2>
    <div class="input-group"><label>Nombre</label><input id="editAreaName" value="${a.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Descripci&oacute;n</label><input id="editAreaDesc" value="${(a.description || '').replace(/"/g, '&quot;')}"></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditArea(${areaId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deleteArea(${areaId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditArea(areaId) {
  DB.update('areas', areaId, {
    name: document.getElementById('editAreaName').value.trim(),
    description: document.getElementById('editAreaDesc').value.trim()
  }, currentUser.id);
  closeModal();
  showToast('Area actualizada', 'success');
  navigateTo('areas');
}

function deleteArea(areaId) {
  confirmAction('Eliminar area?', () => {
    DB.delete('areas', areaId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    navigateTo('areas');
  });
}

// ===================== USERS =====================

function renderUsers(el) {
  const users = DB.get('users') || [];
  let html = `<div class="flex-between mb-4"><h3>Usuarios</h3>
    <button class="btn btn-primary" onclick="showAddUserModal()"><i class="fas fa-plus"></i> Usuario</button>
  </div><div class="grid-2">`;
  (users || []).forEach(u => {
    const roleColors = { admin: 'text-red', mozo: 'text-blue', cocina: 'text-amber', cajera: 'text-green' };
    html += `<div class="card" onclick="showEditUserModal(${u.id})">
      <div class="flex-between"><h4>${u.name}</h4><span class="${roleColors[u.role] || ''}" style="font-size:12px;font-weight:600">${capitalize(u.role)}</span></div>
      <div class="text-muted" style="font-size:12px">${u.email || ''}</div>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddUserModal() {
  showModal(`<h2>Nuevo Usuario</h2>
    <div class="input-group"><label>Nombre</label><input id="addUserName"></div>
    <div class="input-group"><label>Email</label><input id="addUserEmail" type="email"></div>
    <div class="input-group"><label>Rol</label><select id="addUserRole"><option value="mozo">Mozo</option><option value="cajera">Cajera</option><option value="cocina">Cocina</option><option value="admin">Admin</option></select></div>
    <button class="btn btn-primary mt-2" onclick="saveNewUser()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewUser() {
  const name = document.getElementById('addUserName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('users', {
    id: DB.getNextId('users'),
    name,
    email: document.getElementById('addUserEmail').value.trim(),
    role: document.getElementById('addUserRole').value
  }, currentUser.id);
  closeModal();
  showToast('Usuario creado', 'success');
  navigateTo('users');
}

function showEditUserModal(userId) {
  const u = DB.getById('users', userId);
  if (!u) return;
  const isSelf = userId === currentUser.id;
  showModal(`<h2>Editar Usuario</h2>
    <div class="input-group"><label>Nombre</label><input id="editUserName" value="${u.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Email</label><input id="editUserEmail" value="${(u.email || '').replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>Rol</label><select id="editUserRole">
      ${['admin','mozo','cocina','cajera'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${capitalize(r)}</option>`).join('')}
    </select></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditUser(${userId})"><i class="fas fa-save"></i> Guardar</button>
      ${!isSelf ? `<button class="btn btn-danger" onclick="deleteUser(${userId})"><i class="fas fa-trash"></i></button>` : ''}
    </div>
  `);
}

function saveEditUser(userId) {
  DB.update('users', userId, {
    name: document.getElementById('editUserName').value.trim(),
    email: document.getElementById('editUserEmail').value.trim(),
    role: document.getElementById('editUserRole').value
  }, currentUser.id);
  closeModal();
  showToast('Usuario actualizado', 'success');
  navigateTo('users');
}

function deleteUser(userId) {
  if (userId === currentUser.id) { showToast('No puede eliminarse a si mismo', 'error'); return; }
  confirmAction('Eliminar usuario?', () => {
    DB.delete('users', userId, currentUser.id, currentUser.name, 'Eliminado por admin');
    closeModal();
    navigateTo('users');
  });
}

// ===================== EGRESOS =====================

function renderEgresos(el) {
  const egresos = DB.get('egresos') || [];
  let html = `<div class="flex-between mb-4"><h3>Egresos</h3>
    <button class="btn btn-primary" onclick="showAddEgresoModal()"><i class="fas fa-plus"></i> Egreso</button>
  </div>`;
  const total = egresos.reduce((s, e) => s + (e.amount || 0), 0);
  html += `<div class="stat-card mb-4"><div class="stat-icon red"><i class="fas fa-money-bill-wave"></i></div>
    <div class="stat-info"><h4 class="text-red">${formatCurrency(total)}</h4><p>Total Egresos</p></div></div>`;
  html += `<table class="data-table"><tr><th>Fecha</th><th>Concepto</th><th>Categor&iacute;a</th><th>Monto</th><th>Registrado por</th><th></th></tr>`;
  const sorted = [...egresos].sort((a, b) => b.createdAt - a.createdAt);
  sorted.forEach(e => {
    html += `<tr><td class="text-muted">${formatDate(e.createdAt)}</td>
      <td>${e.concept || e.description || ''}</td>
      <td>${e.category || ''}</td>
      <td class="text-red">${formatCurrency(e.amount)}</td>
      <td>${getUserName(e.registeredBy || e.userId)}</td>
      <td><button class="btn btn-danger btn-xs" onclick="deleteEgreso(${e.id})"><i class="fas fa-trash"></i></button></td></tr>`;
  });
  html += `</table>`;
  el.innerHTML = html;
}

function showAddEgresoModal() {
  showModal(`<h2>Nuevo Egreso</h2>
    <div class="input-group"><label>Concepto</label><input id="addEgrConcept"></div>
    <div class="input-group"><label>Categor&iacute;a</label><select id="addEgrCat"><option>Insumos</option><option>Servicios</option><option>Mantenimiento</option><option>Personal</option><option>Otros</option></select></div>
    <div class="input-group"><label>Monto (S/)</label><input id="addEgrAmount" type="number" step="0.5"></div>
    <button class="btn btn-primary mt-2" onclick="saveNewEgreso()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewEgreso() {
  const concept = document.getElementById('addEgrConcept').value.trim();
  if (!concept) { showToast('Concepto requerido', 'warning'); return; }
  DB.add('egresos', {
    id: DB.getNextId('egresos'),
    concept,
    category: document.getElementById('addEgrCat').value,
    amount: parseFloat(document.getElementById('addEgrAmount').value) || 0,
    registeredBy: currentUser.id,
    createdAt: Date.now()
  }, currentUser.id);
  closeModal();
  showToast('Egreso registrado', 'success');
  navigateTo('egresos');
}

function deleteEgreso(egresoId) {
  confirmAction('Eliminar este egreso?', () => {
    DB.delete('egresos', egresoId, currentUser.id, currentUser.name, 'Eliminado por admin');
    navigateTo('egresos');
  });
}

// ===================== PRINTERS =====================

function renderPrinters(el) {
  const printers = DB.get('printers') || [];
  let html = `<div class="flex-between mb-4"><h3>Impresoras</h3>
    <button class="btn btn-primary" onclick="showAddPrinterModal()"><i class="fas fa-plus"></i> Impresora</button>
  </div><div class="grid-2">`;
  (printers || []).forEach(p => {
    html += `<div class="card" onclick="showEditPrinterModal(${p.id})">
      <h4>${p.name}</h4>
      <div class="text-muted" style="font-size:12px">${p.type || ''} ${p.ip || p.path || ''}</div>
      <span class="badge" style="${p.active !== false ? 'color:var(--green)' : 'color:var(--red)'}">${p.active !== false ? 'Activa' : 'Inactiva'}</span>
    </div>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}

function showAddPrinterModal() {
  showModal(`<h2>Nueva Impresora</h2>
    <div class="input-group"><label>Nombre</label><input id="addPrinterName"></div>
    <div class="input-group"><label>Tipo</label><select id="addPrinterType"><option value="thermal">T&eacute;rmica</option><option value="laser">Laser</option><option value="inkjet">Inyecci&oacute;n</option></select></div>
    <div class="input-group"><label>IP / Ruta</label><input id="addPrinterPath" placeholder="Ej: 192.168.1.100"></div>
    <button class="btn btn-primary mt-2" onclick="saveNewPrinter()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewPrinter() {
  const name = document.getElementById('addPrinterName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('printers', {
    id: DB.getNextId('printers'), name,
    type: document.getElementById('addPrinterType').value,
    path: document.getElementById('addPrinterPath').value.trim(),
    active: true
  }, currentUser.id);
  closeModal();
  showToast('Impresora creada', 'success');
  navigateTo('printers');
}

function showEditPrinterModal(printerId) {
  const p = DB.getById('printers', printerId);
  if (!p) return;
  showModal(`<h2>Editar Impresora</h2>
    <div class="input-group"><label>Nombre</label><input id="editPrinterName" value="${p.name.replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label>IP / Ruta</label><input id="editPrinterPath" value="${(p.path || '').replace(/"/g, '&quot;')}"></div>
    <div class="input-group"><label><input id="editPrinterActive" type="checkbox" ${p.active !== false ? 'checked' : ''}> Activa</label></div>
    <div class="flex gap-2 mt-2">
      <button class="btn btn-primary flex-1" onclick="saveEditPrinter(${printerId})"><i class="fas fa-save"></i> Guardar</button>
      <button class="btn btn-danger" onclick="deletePrinter(${printerId})"><i class="fas fa-trash"></i></button>
    </div>
  `);
}

function saveEditPrinter(printerId) {
  DB.update('printers', printerId, {
    name: document.getElementById('editPrinterName').value.trim(),
    path: document.getElementById('editPrinterPath').value.trim(),
    active: document.getElementById('editPrinterActive').checked
  }, currentUser.id);
  closeModal();
  showToast('Impresora actualizada', 'success');
  navigateTo('printers');
}

function deletePrinter(printerId) {
  confirmAction('Eliminar impresora?', () => {
    DB.delete('printers', printerId, currentUser.id, currentUser.name, 'Eliminado');
    closeModal();
    navigateTo('printers');
  });
}

// ===================== SETTINGS =====================

function renderSettings(el) {
  el.innerHTML = `
    <h3 class="mb-4">Configuraci&oacute;n</h3>
    <div class="card">
      <h4>Informaci&oacute;n del Sistema</h4>
      <div class="mt-2"><strong>Nombre:</strong> Villa Moche - ERP/POS</div>
      <div><strong>Versi&oacute;n:</strong> 2.0.0</div>
      <div><strong>Servidor:</strong> Node.js + Socket.IO</div>
      <div><strong>Persistencia:</strong> Archivos JSON</div>
    </div>
    <div class="card mt-4">
      <h4>Acciones del Sistema</h4>
      <div class="flex gap-2 mt-2 flex-wrap">
        <button class="btn btn-secondary" onclick="reloadData()"><i class="fas fa-sync"></i> Recargar Datos</button>
        <button class="btn btn-danger" onclick="confirmResetDB()"><i class="fas fa-trash"></i> Reiniciar Base de Datos</button>
      </div>
    </div>
  `;
}

function reloadData() {
  window.location.reload();
}

function confirmResetDB() {
  confirmAction('REINICIAR toda la base de datos? Esta acci&oacute;n no se puede deshacer.', () => {
    DB._socket.emit('reset-db', { userId: currentUser.id, userName: currentUser.name });
    showToast('Base de datos reiniciada', 'info');
    setTimeout(() => window.location.reload(), 1000);
  });
}

// ===================== CASH CLOSURES =====================

function renderCashClosures(el) {
  const closures = DB.get('cashClosures') || [];
  const cashDesks = DB.get('cashDesks') || [];
  let html = `<h3 class="mb-4">Cierres de Caja</h3>`;
  if (!closures.length) {
    html += `<div class="empty-state"><p>No hay cierres registrados</p></div>`;
  } else {
    html += `<table class="data-table"><tr><th>Fecha</th><th>Caja</th><th>Cajera</th><th>Total</th><th>Estado</th></tr>`;
    [...closures].sort((a, b) => b.createdAt - a.createdAt).forEach(c => {
      const cd = cashDesks.find(d => d.id === c.cashDeskId);
      html += `<tr><td>${formatDate(c.createdAt)}</td><td>${cd ? cd.name : 'Caja #' + c.cashDeskId}</td>
        <td>${getUserName(c.cajeraId)}</td><td>${formatCurrency(c.total)}</td>
        <td>${c.status || 'cerrado'}</td></tr>`;
    });
    html += `</table>`;
  }
  el.innerHTML = html;
}

// ===================== MY ORDERS (MOZO) =====================

function renderMyOrders(el) {
  const orders = DB.get('orders') || [];
  const myOrders = orders.filter(o => o.mozoId === currentUser.id && o.status !== 'cancelado');
  el.innerHTML = `<h3 class="mb-4">Mis Pedidos</h3>`;
  const active = myOrders.filter(o => ['pendiente', 'en-cocina', 'listo'].includes(o.status));
  if (active.length) {
    active.forEach(o => el.innerHTML += renderOrderCard(o));
  } else {
    el.innerHTML += `<div class="empty-state"><p>No tienes pedidos activos</p></div>`;
  }
  const past = myOrders.filter(o => o.status === 'entregado').slice(-10).reverse();
  if (past.length) {
    el.innerHTML += `<h4 class="mt-4 mb-2">Entregados</h4>`;
    past.forEach(o => el.innerHTML += renderOrderCard(o));
  }
}

// ===================== CASHIER =====================

function renderCashier(el) {
  const orders = DB.get('orders') || [];
  const cashDesks = DB.get('cashDesks') || [];
  const activeOrders = orders.filter(o => ['pendiente', 'en-cocina', 'listo'].includes(o.status));
  const deliveredToday = orders.filter(o => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return o.status === 'entregado' && o.updatedAt >= today.getTime();
  });
  const todayTotal = deliveredToday.reduce((s, o) => s + (o.total || 0), 0);

  let html = `<div class="grid-3 mb-4">
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><h4>${formatCurrency(todayTotal)}</h4><p>Ventas Hoy</p></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="fas fa-hourglass-half"></i></div><div class="stat-info"><h4>${activeOrders.length}</h4><p>Pedidos Activos</p></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-receipt"></i></div><div class="stat-info"><h4>${deliveredToday.length}</h4><p>Entregados Hoy</p></div></div>
  </div>`;

  // Cash desk selection for cashier role
  if (currentUser.role === 'cajera' || currentUser.role === 'admin') {
    const myDesk = cashDesks.find(d => d.cajeraId === currentUser.id);
    html += `<div class="card mb-4"><h4>Mi Caja</h4>`;
    if (myDesk) {
      html += `<p class="text-muted">${myDesk.name}</p>`;
      const deskOrders = deliveredToday.filter(o => o.mozoId === currentUser.id || true);
      const deskTotal = deskOrders.reduce((s, o) => s + (o.total || 0), 0);
      html += `<div class="mt-2"><strong>Total en caja hoy:</strong> <span class="text-accent">${formatCurrency(deskTotal)}</span></div>`;
      html += `<button class="btn btn-primary mt-2" onclick="closeCashDesk(${myDesk.id})"><i class="fas fa-file-invoice"></i> Cerrar Caja</button>`;
    } else {
      html += `<p class="text-muted">No tienes caja asignada</p>`;
      if (currentUser.role === 'admin') {
        html += `<button class="btn btn-primary mt-2" onclick="assignCashDesk()"><i class="fas fa-plus"></i> Asignar Caja</button>`;
      }
    }
    html += `</div>`;
  }

  html += `<div class="card"><h4 class="mb-2">&Uacute;ltimas Ventas</h4>`;
  html += `<table class="data-table"><tr><th>Mesa</th><th>Items</th><th>Total</th><th>Mozo</th><th>Hora</th></tr>`;
  const recent = [...deliveredToday].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 15);
  recent.forEach(o => {
    const mesa = getById(DB.get('tables'), o.mesaId);
    html += `<tr><td>${mesa ? mesa.name : 'Mesa ' + o.mesaId}</td>
      <td>${(o.items || []).slice(0, 2).map(i => i.name).join(', ')}</td>
      <td class="text-accent">${formatCurrency(o.total)}</td>
      <td>${getUserName(o.mozoId)}</td>
      <td class="text-muted">${formatDate(o.updatedAt)}</td></tr>`;
  });
  html += `</table></div>`;

  el.innerHTML = html;
}

function closeCashDesk(deskId) {
  const orders = DB.get('orders') || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayTotal = orders.filter(o => o.status === 'entregado' && o.updatedAt >= today.getTime()).reduce((s, o) => s + (o.total || 0), 0);
  showModal(`
    <h2>Cerrar Caja</h2>
    <p>Total de ventas hoy: <strong class="text-accent">${formatCurrency(todayTotal)}</strong></p>
    <div class="input-group"><label>Observaciones</label><textarea id="closureNotes"></textarea></div>
    <button class="btn btn-primary mt-2" onclick="saveCashClosure(${deskId}, ${todayTotal})"><i class="fas fa-save"></i> Cerrar</button>
  `);
}

function saveCashClosure(deskId, total) {
  DB.add('cashClosures', {
    id: DB.getNextId('cashClosures'),
    cashDeskId: deskId,
    cajeraId: currentUser.id,
    total,
    status: 'cerrado',
    notes: document.getElementById('closureNotes').value.trim(),
    createdAt: Date.now()
  }, currentUser.id);
  closeModal();
  showToast('Caja cerrada', 'success');
  navigateTo('cashier');
}

function assignCashDesk() {
  const users = (DB.get('users') || []).filter(u => u.role === 'cajera');
  showModal(`
    <h2>Asignar Caja</h2>
    <div class="input-group"><label>Nombre de la Caja</label><input id="addDeskName" placeholder="Ej: Caja Principal"></div>
    <div class="input-group"><label>Cajera</label><select id="addDeskCajera">${users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}</select></div>
    <button class="btn btn-primary mt-2" onclick="saveNewCashDesk()"><i class="fas fa-save"></i> Guardar</button>
  `);
}

function saveNewCashDesk() {
  const name = document.getElementById('addDeskName').value.trim();
  if (!name) { showToast('Nombre requerido', 'warning'); return; }
  DB.add('cashDesks', {
    id: DB.getNextId('cashDesks'),
    name,
    cajeraId: parseInt(document.getElementById('addDeskCajera').value)
  }, currentUser.id);
  closeModal();
  showToast('Caja asignada', 'success');
  navigateTo('cashier');
}
