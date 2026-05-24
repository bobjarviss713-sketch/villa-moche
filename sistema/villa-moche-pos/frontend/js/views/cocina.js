// ===================== KITCHEN (COCINA) =====================

function renderKitchen(el) {
  const orders = DB.get('orders') || [];
  const pending = orders.filter(o => o.status === 'pendiente' || o.status === 'en-cocina');
  const likes = DB.get('likes') || [];

  // Group by status
  const newOrders = pending.filter(o => o.status === 'pendiente');
  const cooking = pending.filter(o => o.status === 'en-cocina');

  let html = `<div class="flex-between mb-4">
    <h3>Cocina Central</h3>
    <div class="flex gap-2">
      <span class="badge badge-cyan"><i class="fas fa-clock"></i> Nuevos: ${newOrders.length}</span>
      <span class="badge"><i class="fas fa-fire"></i> En cocina: ${cooking.length}</span>
    </div>
  </div>`;

  if (newOrders.length) {
    html += `<h4 class="mb-2"><i class="fas fa-clock text-amber"></i> Nuevos Pedidos</h4>`;
    html += `<div id="newOrdersGrid" class="grid-2 mb-4">`;
    newOrders.forEach(o => html += renderKitchenCard(o, likes));
    html += `</div>`;
  }

  if (cooking.length) {
    html += `<h4 class="mb-2"><i class="fas fa-fire text-blue"></i> En Preparaci&oacute;n</h4>`;
    html += `<div id="cookingGrid" class="grid-2">`;
    cooking.forEach(o => html += renderKitchenCard(o, likes));
    html += `</div>`;
  }

  if (!pending.length) {
    html += `<div class="empty-state"><i class="fas fa-check-circle text-green"></i><p>Todos los pedidos est&aacute;n al d&iacute;a</p></div>`;
  }

  // Timer updates
  html += `<script>setInterval(updateKitchenTimers, 1000)</script>`;
  el.innerHTML = html;
  updateKitchenTimers();
}

function renderKitchenCard(order, likes) {
  const mesa = DB.getById('tables', order.mesaId);
  const elapsed = Date.now() - order.createdAt;
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  const isUrgent = mins >= 15;
  const likesForOrder = (likes || []).filter(l => l.orderId === order.id);
  const totalLikes = likesForOrder.reduce((s, l) => s + (l.count || 0), 0);

  let html = `<div class="order-card" style="${isUrgent ? 'border-left:4px solid var(--red)' : ''}">
    <div class="order-header">
      <span class="order-mesa">${mesa ? mesa.name : 'Mesa ' + order.mesaId}</span>
      <span class="order-status ${order.status}">${order.status === 'pendiente' ? 'Nuevo' : 'En cocina'}</span>
    </div>
    <div class="timer" data-created="${order.createdAt}" style="font-size:24px;font-weight:800;font-family:monospace;color:${isUrgent ? 'var(--red)' : 'var(--accent)'}">
      ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}
    </div>
    <ul class="order-items mt-2">`;
  const comidaItems = (order.items || []).filter(i => i.status === 'pendiente' || i.status === 'en-cocina');
  comidaItems.forEach(i => {
    let itemStatus = '';
    if (i.status === 'listo') itemStatus = ' <i class="fas fa-check-circle text-green"></i>';
    else if (i.status === 'en-cocina') itemStatus = ' <i class="fas fa-fire text-amber"></i>';
    html += `<li>${itemStatus} ${i.name} x${i.qty} ${i.notes ? '<small class="text-muted">(' + i.notes + ')</small>' : ''}
      <button class="btn btn-xs ${i.status === 'listo' ? 'btn-success' : 'btn-secondary'}" style="margin-left:8px" onclick="toggleItemStatus(${order.id}, '${i.name}', '${i.status}')">
        ${i.status === 'listo' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-fire"></i>'}
      </button>
    </li>`;
  });
  html += `</ul>
    <div class="order-actions mt-2">
      ${order.status === 'pendiente' ? `<button class="btn btn-primary" onclick="acceptOrder(${order.id})"><i class="fas fa-check"></i> Aceptar Pedido</button>` : ''}
      ${order.status === 'en-cocina' ? `<button class="btn btn-success" onclick="markOrderReady(${order.id})"><i class="fas fa-utensils"></i> Marcar Listo</button>` : ''}
      <button class="btn btn-secondary btn-sm" onclick="showOrderNotes(${order.id})"><i class="fas fa-sticky-note"></i> Notas</button>
    </div>
    <div class="flex-between mt-2" style="font-size:11px;color:var(--text-muted)">
      <span>${getUserName(order.mozoId)}</span>
      <span><i class="fas fa-heart" style="color:var(--red)"></i> ${totalLikes}</span>
    </div>
  </div>`;
  return html;
}

function updateKitchenTimers() {
  document.querySelectorAll('.timer').forEach(el => {
    const created = parseInt(el.dataset.created);
    if (!created) return;
    const elapsed = Date.now() - created;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    el.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    if (mins >= 15) el.style.color = 'var(--red)';
  });
}

function toggleItemStatus(orderId, itemName, currentStatus) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const items = order.items.map(i => {
    if (i.name === itemName && (i.status === 'pendiente' || i.status === 'en-cocina' || i.status === 'listo')) {
      const newStatus = i.status === 'listo' ? 'pendiente' : 'listo';
      return { ...i, status: newStatus };
    }
    return i;
  });
  // If all comida items are listo, mark order as listo
  const comidaItems = items.filter(i => {
    const menuItem = DB.getById('menu', i.menuItemId);
    return menuItem && menuItem.category === 'comida';
  });
  const allReady = comidaItems.length > 0 && comidaItems.every(i => i.status === 'listo' || i.status === 'entregado');
  DB.update('orders', orderId, { items, status: allReady ? 'listo' : 'en-cocina', updatedAt: Date.now() }, currentUser.id);
  if (allReady) {
    playSuccessSound();
    showToast('Pedido listo para entregar', 'success');
  }
}

function markOrderReady(orderId) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  const items = order.items.map(i => i.status === 'pendiente' || i.status === 'en-cocina' ? { ...i, status: 'listo' } : i);
  DB.update('orders', orderId, { items, status: 'listo', updatedAt: Date.now() }, currentUser.id);
  playSuccessSound();
  showToast('Pedido listo!', 'success');
  DB.audit(currentUser.id, currentUser.name, 'order-ready', `Pedido #${orderId} listo para entregar`);
}

function showOrderNotes(orderId) {
  const order = DB.getById('orders', orderId);
  if (!order) return;
  showModal(`
    <h2>Notas del Pedido</h2>
    <p><strong>Mesa:</strong> ${(getById(DB.get('tables'), order.mesaId) || {}).name || 'Mesa ' + order.mesaId}</p>
    <p><strong>Items:</strong></p>
    <ul style="margin:12px 0">${order.items.map(i => `<li>${i.name} x${i.qty} ${i.notes ? '- ' + i.notes : ''}</li>`).join('')}</ul>
    ${order.notes ? `<p><strong>Notas generales:</strong> ${order.notes}</p>` : ''}
    <p class="text-muted">Pedido por: ${getUserName(order.mozoId)}</p>
  `);
}
