function getById(arr, id) {
  return arr ? arr.find(x => x.id === id) : null;
}

function getUserName(id) {
  const u = DB.getById('users', id);
  return u ? u.name : 'N/A';
}

function getAreaName(id) {
  const a = DB.getById('areas', id);
  return a ? a.name : 'Sin Area';
}

function getCashDeskName(cajeraId) {
  const d = (DB.get('cashDesks') || []).find(x => x.cajeraId === cajeraId);
  return d ? d.name : 'Sin Caja';
}

function getMenuCategoryName(cat) {
  const names = { comida: 'Comida', bebidas: 'Bebidas', postres: 'Postres', chicha: 'Chicha', helados: 'Helados', golosinas: 'Golosinas' };
  return names[cat] || cat;
}

function requiresCocina(cat) {
  return cat === 'comida';
}

function getComandaNumbers(items) {
  const s = {};
  (items || []).forEach(i => { s[i.comanda || 1] = true; });
  return Object.keys(s).map(Number).sort((a, b) => a - b);
}

function getLastComanda(items) {
  const nums = getComandaNumbers(items);
  return nums.length ? nums[nums.length - 1] : 1;
}

function smartRound(val) {
  if (val >= 100) return Math.round(val);
  if (val >= 10) return Math.round(val * 10) / 10;
  if (val >= 1) return Math.round(val * 100) / 100;
  return Math.round(val * 1000) / 1000;
}

function formatCurrency(val) {
  return 'S/ ' + (val || 0).toFixed(2);
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('es-PE', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
  });
}

function formatDateShort(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('es-PE');
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function playBeep(freq, dur) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = freq || 800;
    o.type = 'sine';
    g.gain.value = 0.15;
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur || 0.15));
    o.stop(ctx.currentTime + (dur || 0.15));
  } catch (e) { }
}

function playSuccessSound() {
  playBeep(523, 0.15);
  setTimeout(() => playBeep(659, 0.15), 120);
  setTimeout(() => playBeep(784, 0.2), 240);
}

function playAlertSound() {
  playBeep(440, 0.2);
  setTimeout(() => playBeep(330, 0.3), 200);
}

function getTableStatusColor(status) {
  const colors = { libre: 'var(--green)', ocupada: 'var(--amber)', cocina: 'var(--blue)', listo: 'var(--purple)', reservada: 'var(--cyan)', mantenimiento: 'var(--text-muted)' };
  return colors[status] || 'var(--text-muted)';
}

function getTableStatusClass(status) {
  const classes = { libre: 'disponible', ocupada: 'ocupada', cocina: 'ocupada', listo: 'listo', reservada: 'reservada', mantenimiento: 'mantenimiento' };
  return classes[status] || 'disponible';
}

function getTableIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('vip')) return '<i class="fas fa-crown"></i>';
  if (n.includes('terraza')) return '<i class="fas fa-umbrella-beach"></i>';
  if (n.includes('piscina')) return '<i class="fas fa-person-swimming"></i>';
  if (n.includes('eventos')) return '<i class="fas fa-glass-cheers"></i>';
  return '<i class="fas fa-chair"></i>';
}

function exportToCSV(data, filename, headers) {
  if (!data || !data.length) { showToast('No hay datos para exportar', 'warning'); return; }
  const csvRows = [];
  csvRows.push(headers.map(h => '"' + String(h).replace(/"/g, '""') + '"').join(','));
  data.forEach(row => {
    const vals = headers.map(h => {
      const v = row[h] !== undefined ? row[h] : '';
      return '"' + String(v).replace(/"/g, '""') + '"';
    });
    csvRows.push(vals.join(','));
  });
  const csv = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  showToast('CSV descargado', 'success');
}
