const DB = {
  _data: null,
  _socket: null,
  _connected: false,
  _listeners: {},
  _syncReady: false,

  async init() {
    return new Promise((resolve) => {
      this._socket = io(window.location.origin, {
        transports: ['websocket', 'polling']
      });

      this._socket.on('connect', async () => {
        this._connected = true;
        console.log('Socket.IO conectado');
        this._socket.emit('get-initial-data', (data) => {
          this._data = data;
          this._syncReady = true;
          this._setupListeners();
          resolve(data);
        });
      });

      this._socket.on('connect_error', (err) => {
        console.error('Socket.IO error:', err.message);
        setTimeout(() => resolve(null), 3000);
      });

      setTimeout(() => {
        if (!this._syncReady) resolve(null);
      }, 5000);
    });
  },

  _setupListeners() {
    const collections = [
      'users', 'tables', 'menu', 'inventory', 'recipes', 'orders',
      'salesHistory', 'customers', 'reservations', 'promotions',
      'deliveries', 'auditLogs', 'cashClosures', 'printers', 'printJobs',
      'egresos', 'areas', 'cashDesks', 'deletedLogs'
    ];

    collections.forEach(col => {
      this._socket.on('sync-' + col, (data) => {
        this._data[col] = data;
        this._notify(col, data);
      });
    });

    this._socket.on('db-changed', (change) => {
      this._notify('change', change);
      if (change.collection) {
        this._notify('change:' + change.collection, change);
      }
    });

    this._socket.on('db-reset', () => {
      this._socket.emit('get-initial-data', (data) => {
        this._data = data;
        this._notify('reset', data);
      });
    });

    this._socket.on('sync-all', (data) => {
      this._data = data;
      collections.forEach(col => this._notify(col, data[col]));
    });

    this._socket.on('error-msg', (msg) => {
      console.error('Server error:', msg);
    });
  },

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
  },

  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  },

  _notify(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(cb => cb(data));
    }
  },

  get(collection) {
    return this._data ? this._data[collection] : null;
  },

  getById(collection, id) {
    if (!this._data || !this._data[collection]) return null;
    return this._data[collection].find(x => x.id === id);
  },

  add(collection, item, userId) {
    this._socket.emit('db-add', { collection, item, userId });
  },

  update(collection, id, changes, userId) {
    this._socket.emit('db-update', { collection, id, changes, userId });
  },

  delete(collection, id, userId, userName, reason) {
    this._socket.emit('db-delete', { collection, id, userId, userName, reason });
    return true;
  },

  audit(userId, userName, action, detail) {
    this._socket.emit('audit-log', { userId, userName, action, detail });
  },

  login(userId, callback) {
    this._socket.emit('login', { userId });
    this._socket.once('login-success', (data) => {
      if (callback) callback(data.user);
    });
  },

  getDeletedLogs(callback) {
    this._socket.emit('get-deleted-logs', callback);
  },

  getCounters() {
    return this._data ? this._data.counters : null;
  },

  getNextId(collection) {
    if (!this._data || !this._data.counters || !this._data[collection]) return Date.now();
    this._data.counters[collection] = (this._data.counters[collection] || 0) + 1;
    return this._data.counters[collection];
  },

  get data() {
    return this._data;
  },

  get connected() {
    return this._connected;
  },

  get ready() {
    return this._syncReady;
  }
};
