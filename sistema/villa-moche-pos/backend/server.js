require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'villa2025';
const DATA_DIR = path.resolve(__dirname, process.env.DATA_DIR || '../data');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== PERSISTENCIA JSON =====
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getDefaultDB() {
  return {
    sysconfig: { kitchenSounds: { volume: 0.7, alertTimes: [{ label: 'Advertencia', minutes: 5 }, { label: 'Urgente', minutes: 0 }], customSounds: [], voiceEnabled: false, lastSoundIndex: -1 } },
    users: [
      { id: 1, name: 'Administrador', role: 'admin' },
      { id: 2, name: 'Cocina Central', role: 'cocina' },
      { id: 3, name: 'Carlos Ramirez', role: 'mozo' },
      { id: 4, name: 'Maria Garcia', role: 'cajera' },
      { id: 5, name: 'Lucia Huaman', role: 'mozo' },
      { id: 6, name: 'Pedro Castillo', role: 'mozo' },
      { id: 7, name: 'Ana Torres', role: 'cajera' }
    ],
    cashDesks: [
      { id: 1, name: 'Caja Principal', cajeraId: 4 },
      { id: 2, name: 'Caja Secundaria', cajeraId: 7 }
    ],
    areas: [
      { id: 1, name: 'Salon Principal' },
      { id: 2, name: 'Terraza' },
      { id: 3, name: 'VIP' },
      { id: 4, name: 'Piscina' },
      { id: 5, name: 'Eventos' }
    ],
    tables: [
      { id: 1, name: 'Mesa 01', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t1', capacity: 4 },
      { id: 2, name: 'Mesa 02', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t2', capacity: 4 },
      { id: 3, name: 'Mesa 03', areaId: 1, status: 'ocupada', mozoId: 3, orderId: 101, qrToken: 'vm-t3', capacity: 6 },
      { id: 4, name: 'Mesa 04', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t4', capacity: 4 },
      { id: 5, name: 'Mesa 05', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t5', capacity: 2 },
      { id: 6, name: 'Mesa 06', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t6', capacity: 4 },
      { id: 7, name: 'Mesa 07', areaId: 2, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t7', capacity: 6 },
      { id: 8, name: 'Mesa 08', areaId: 2, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t8', capacity: 4 },
      { id: 9, name: 'Mesa 09', areaId: 2, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t9', capacity: 2 },
      { id: 10, name: 'Mesa 10', areaId: 2, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t10', capacity: 4 },
      { id: 11, name: 'Mesa 11', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t11', capacity: 8 },
      { id: 12, name: 'Mesa 12', areaId: 1, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t12', capacity: 6 },
      { id: 13, name: 'Mesa VIP 01', areaId: 3, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t13', capacity: 10 },
      { id: 14, name: 'Zona Terraza', areaId: 2, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t14', capacity: 20 },
      { id: 15, name: 'Zona Piscina', areaId: 4, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t15', capacity: 30 },
      { id: 16, name: 'Salon Eventos', areaId: 5, status: 'libre', mozoId: null, orderId: null, qrToken: 'vm-t16', capacity: 50 }
    ],
    menu: [
      { id: 1, name: 'Arroz con Pollo', price: 20, prepTime: 15, stock: 50, category: 'comida' },
      { id: 2, name: 'Lomo Saltado', price: 28, prepTime: 10, stock: 50, category: 'comida' },
      { id: 3, name: 'Gaseosa Coca Cola 500ml', price: 5, prepTime: 1, stock: 50, category: 'bebidas' },
      { id: 4, name: 'Agua Mineral 500ml', price: 3, prepTime: 1, stock: 50, category: 'bebidas' },
      { id: 5, name: 'Tallarin Saltado', price: 25, prepTime: 12, stock: 50, category: 'comida' },
      { id: 6, name: 'Pescado Frito', price: 30, prepTime: 18, stock: 50, category: 'comida' },
      { id: 7, name: 'Ceviche Mixto', price: 35, prepTime: 12, stock: 50, category: 'comida' },
      { id: 8, name: 'Jarra Chicha Morada', price: 12, prepTime: 3, stock: 50, category: 'chicha' },
      { id: 9, name: 'Chicha Individual', price: 4, prepTime: 1, stock: 50, category: 'chicha' },
      { id: 10, name: 'Helado de Lucuma', price: 6, prepTime: 1, stock: 50, category: 'helados' },
      { id: 11, name: 'Helado de Mango', price: 6, prepTime: 1, stock: 50, category: 'helados' },
      { id: 12, name: 'Suspiro a la Limena', price: 8, prepTime: 5, stock: 50, category: 'postres' },
      { id: 13, name: 'Picarones x4', price: 10, prepTime: 8, stock: 50, category: 'postres' },
      { id: 14, name: 'Inca Kola 500ml', price: 5, prepTime: 1, stock: 50, category: 'bebidas' },
      { id: 15, name: 'Cerveza Cusquena 620ml', price: 10, prepTime: 1, stock: 50, category: 'bebidas' },
      { id: 16, name: 'Papas Lays 120g', price: 4, prepTime: 1, stock: 50, category: 'golosinas' },
      { id: 17, name: 'Chocolate Sublime', price: 3, prepTime: 1, stock: 50, category: 'golosinas' },
      { id: 18, name: 'Galletas Oreo', price: 2.5, prepTime: 1, stock: 50, category: 'golosinas' },
      { id: 20, name: 'Snack Mix', price: 5, prepTime: 1, stock: 50, category: 'golosinas' },
      { id: 21, name: 'Pollo a la brasa', price: 65, prepTime: 25, stock: 50, category: 'comida' },
      { id: 22, name: '1/2 Pollo a la brasa', price: 35, prepTime: 20, stock: 50, category: 'comida' },
      { id: 23, name: '1/4 de Pollo a la brasa', price: 20, prepTime: 15, stock: 50, category: 'comida' },
      { id: 24, name: 'Arroz con Pato', price: 30, prepTime: 20, stock: 50, category: 'comida' },
      { id: 25, name: 'Ceviche Familiar', price: 65, prepTime: 15, stock: 50, category: 'comida' },
      { id: 26, name: 'Ceviche Personal', price: 35, prepTime: 12, stock: 50, category: 'comida' },
      { id: 27, name: 'Chancho al Cilindro', price: 30, prepTime: 30, stock: 50, category: 'comida' },
      { id: 28, name: 'Chaufa de pollo', price: 25, prepTime: 15, stock: 50, category: 'comida' },
      { id: 30, name: 'Chicharron de pescado personal', price: 35, prepTime: 15, stock: 50, category: 'comida' },
      { id: 31, name: 'Chicharron de Pollo', price: 30, prepTime: 15, stock: 50, category: 'comida' },
      { id: 32, name: 'Cuy Con papas', price: 70, prepTime: 35, stock: 50, category: 'comida' },
      { id: 33, name: 'Lomo Saltado', price: 30, prepTime: 15, stock: 50, category: 'comida' },
      { id: 34, name: 'Medio cuy', price: 35, prepTime: 25, stock: 50, category: 'comida' },
      { id: 37, name: 'Pescado a lo macho', price: 35, prepTime: 20, stock: 50, category: 'comida' },
      { id: 38, name: 'Seco de Cabrito Con frejoles', price: 30, prepTime: 25, stock: 50, category: 'comida' }
    ],
    inventory: [
      { id: 1, name: 'Arroz', stock: 5000, alertMin: 500, unit: 'g' },
      { id: 2, name: 'Pollo entero', stock: 3000, alertMin: 500, unit: 'g' },
      { id: 3, name: 'Cebolla', stock: 2000, alertMin: 300, unit: 'g' },
      { id: 4, name: 'Tomate', stock: 1500, alertMin: 200, unit: 'g' },
      { id: 5, name: 'Lomo de res', stock: 2000, alertMin: 300, unit: 'g' },
      { id: 6, name: 'Papa', stock: 3000, alertMin: 500, unit: 'g' },
      { id: 7, name: 'Aceite vegetal', stock: 2000, alertMin: 300, unit: 'ml' },
      { id: 8, name: 'Gaseosa 500ml', stock: 24, alertMin: 5, unit: 'ud' },
      { id: 9, name: 'Agua 500ml', stock: 48, alertMin: 10, unit: 'ud' },
      { id: 10, name: 'Aji amarillo', stock: 500, alertMin: 100, unit: 'g' },
      { id: 11, name: 'Ajo', stock: 300, alertMin: 50, unit: 'g' },
      { id: 12, name: 'Sal', stock: 1000, alertMin: 100, unit: 'g' },
      { id: 13, name: 'Salsa de soya', stock: 500, alertMin: 100, unit: 'ml' },
      { id: 14, name: 'Vinagre', stock: 500, alertMin: 100, unit: 'ml' },
      { id: 15, name: 'Tallarin', stock: 2000, alertMin: 300, unit: 'g' },
      { id: 16, name: 'Pescado fresco', stock: 1500, alertMin: 300, unit: 'g' },
      { id: 17, name: 'Limon', stock: 200, alertMin: 50, unit: 'ud' },
      { id: 18, name: 'Harina', stock: 1000, alertMin: 200, unit: 'g' },
      { id: 19, name: 'Azucar', stock: 2000, alertMin: 300, unit: 'g' },
      { id: 20, name: 'Huevos', stock: 60, alertMin: 12, unit: 'ud' },
      { id: 21, name: 'Leche evaporada', stock: 24, alertMin: 6, unit: 'ud' },
      { id: 22, name: 'Maiz morado', stock: 800, alertMin: 200, unit: 'g' },
      { id: 23, name: 'Lucuma', stock: 500, alertMin: 100, unit: 'g' },
      { id: 24, name: 'Mango', stock: 600, alertMin: 100, unit: 'g' },
      { id: 26, name: 'Pato', stock: 5000, alertMin: 500, unit: 'g' },
      { id: 27, name: 'Cabrito', stock: 3000, alertMin: 500, unit: 'g' },
      { id: 28, name: 'Chancho', stock: 3000, alertMin: 500, unit: 'g' },
      { id: 29, name: 'Cuy', stock: 5000, alertMin: 500, unit: 'g' },
      { id: 30, name: 'Camote', stock: 5000, alertMin: 500, unit: 'g' },
      { id: 31, name: 'Choclo', stock: 50, alertMin: 10, unit: 'ud' },
      { id: 32, name: 'Culantro', stock: 500, alertMin: 100, unit: 'g' },
      { id: 34, name: 'Frejoles', stock: 3000, alertMin: 500, unit: 'g' },
      { id: 36, name: 'Aji panca', stock: 500, alertMin: 100, unit: 'g' },
      { id: 37, name: 'Cerveza negra', stock: 5000, alertMin: 500, unit: 'ml' },
      { id: 38, name: 'Pisco', stock: 3000, alertMin: 300, unit: 'ml' },
      { id: 44, name: 'Comino', stock: 300, alertMin: 50, unit: 'g' },
      { id: 45, name: 'Pimienta', stock: 300, alertMin: 50, unit: 'g' }
    ],
    recipes: [
      { id: 1, menuItemId: 1, ingredients: [{ inventoryId: 1, qty: 200 }, { inventoryId: 2, qty: 150 }, { inventoryId: 3, qty: 30 }, { inventoryId: 4, qty: 30 }, { inventoryId: 7, qty: 20 }, { inventoryId: 10, qty: 10 }, { inventoryId: 11, qty: 5 }, { inventoryId: 12, qty: 3 }] },
      { id: 2, menuItemId: 2, ingredients: [{ inventoryId: 5, qty: 200 }, { inventoryId: 3, qty: 40 }, { inventoryId: 4, qty: 40 }, { inventoryId: 6, qty: 100 }, { inventoryId: 7, qty: 20 }, { inventoryId: 11, qty: 5 }, { inventoryId: 13, qty: 10 }, { inventoryId: 14, qty: 5 }] },
      { id: 3, menuItemId: 3, ingredients: [{ inventoryId: 8, qty: 1 }] },
      { id: 4, menuItemId: 4, ingredients: [{ inventoryId: 9, qty: 1 }] },
      { id: 5, menuItemId: 14, ingredients: [{ inventoryId: 8, qty: 1 }] }
    ],
    orders: [],
    salesHistory: [],
    customers: [],
    reservations: [],
    promotions: [],
    deliveries: [],
    auditLogs: [],
    cashClosures: [],
    printers: [],
    printJobs: [],
    egresos: [],
    deletedLogs: [],
    counters: { order: 100, user: 10, area: 10, table: 20, cash: 10, reservation: 50, customer: 50, promotion: 10, delivery: 30, closure: 20, printer: 5, printJob: 1000 }
  };
}

let DB = getDefaultDB();

function loadDB() {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      DB = { ...getDefaultDB(), ...parsed };
      console.log('Base de datos cargada desde', DB_FILE);
    } catch (e) {
      console.error('Error cargando DB, usando datos por defecto:', e.message);
      DB = getDefaultDB();
    }
  } else {
    DB = getDefaultDB();
    saveDB();
  }
}

function saveDB() {
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando DB:', e.message);
  }
}

loadDB();

// ===== SOCKET.IO =====
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('get-initial-data', (callback) => {
    callback(DB);
  });

  socket.on('login', (data) => {
    const user = DB.users.find(u => u.id === data.userId);
    if (user) {
      socket.data.user = user;
      socket.join(`user-${user.id}`);
      socket.join(`role-${user.role}`);
      socket.emit('login-success', { user });
    }
  });

  socket.on('db-update', (data) => {
    const { collection, id, changes, userId } = data;
    if (!DB[collection]) return;
    let item;
    if (id) {
      item = DB[collection].find(x => x.id === id);
      if (item) Object.assign(item, changes);
    } else {
      DB[collection] = changes;
    }
    saveDB();
    io.emit('db-changed', { collection, id, data: id ? item : changes, userId });
    socket.broadcast.emit('sync-' + collection, DB[collection]);
  });

  socket.on('db-add', (data) => {
    const { collection, item, userId } = data;
    if (!DB[collection]) return;
    DB[collection].push(item);
    saveDB();
    io.emit('db-changed', { collection, id: item.id, data: item, userId, action: 'add' });
    socket.broadcast.emit('sync-' + collection, DB[collection]);
  });

  socket.on('db-delete', (data) => {
    const { collection, id, userId, userName, reason } = data;
    if (!DB[collection]) return;
    const index = DB[collection].findIndex(x => x.id === id);
    if (index === -1) return;
    const deletedItem = DB[collection].splice(index, 1)[0];
    const logEntry = {
      id: Date.now(),
      type: collection,
      objectId: id,
      content: JSON.stringify(deletedItem),
      deletedAt: Date.now(),
      deletedBy: userId || 0,
      deletedByName: userName || 'Desconocido',
      reason: reason || ''
    };
    DB.deletedLogs.push(logEntry);
    saveDB();
    io.emit('db-changed', { collection, id, action: 'delete', data: deletedItem, userId });
    socket.broadcast.emit('sync-' + collection, DB[collection]);
  });

  socket.on('audit-log', (data) => {
    DB.auditLogs.push({
      id: DB.auditLogs.length + 1,
      userId: data.userId,
      userName: data.userName,
      action: data.action,
      detail: data.detail,
      timestamp: Date.now(),
      ip: socket.handshake.address
    });
    saveDB();
    socket.broadcast.emit('sync-auditLogs', DB.auditLogs);
  });

  socket.on('reset-db', (data) => {
    DB = getDefaultDB();
    saveDB();
    io.emit('db-reset');
    io.emit('sync-all', DB);
  });

  socket.on('get-collection', (collection, callback) => {
    if (callback && DB[collection]) callback(DB[collection]);
  });

  socket.on('get-deleted-logs', (callback) => {
    if (callback) callback(DB.deletedLogs || []);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// ===== API REST =====
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  if (userId === 1) {
    if (password !== MASTER_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const user = DB.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ user });
});

app.get('/api/public-menu', (req, res) => {
  res.json({
    menu: DB.menu,
    categories: [...new Set(DB.menu.map(m => m.category))]
  });
});

app.get('/api/public-tables', (req, res) => {
  res.json(DB.tables.map(t => ({ id: t.id, name: t.name, capacity: t.capacity })));
});

app.get('/api/mesa-qr', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const qrs = DB.tables.map(t => ({
    id: t.id,
    name: t.name,
    url: `${baseUrl}/?mesa=${t.id}`
  }));
  res.json(qrs);
});

app.get('/api/reset-db', (req, res) => {
  DB = getDefaultDB();
  saveDB();
  res.json({ ok: true, message: 'Base de datos reiniciada' });
});

// ===== INICIO =====
server.listen(PORT, () => {
  console.log(`Villa Moche POS corriendo en http://localhost:${PORT}`);
  console.log(`Servidor Socket.IO listo en puerto ${PORT}`);
});
