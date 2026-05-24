# Villa Moche - ERP/POS para Restaurante Campestre

Sistema de gestión empresarial completo para el Recreo Campestre **Villa Moche** con módulos de:

- **POS** (Punto de Venta) con mesas, pedidos y carta digital
- **Cocina** con temporizadores y gestión de comandas
- **Caja** con cierres y control de egresos
- **Administración** con inventario, recetas, promociones, reservas, delivery y más
- **Carta Digital Pública** accesible por código QR en cada mesa
- **Sincronización en tiempo real** multi-dispositivo vía Socket.IO
- **Auditoría** completa con registro de cambios y borrados

## Tecnologías

- **Backend:** Node.js + Express + Socket.IO
- **Frontend:** JavaScript vanilla + Socket.IO client
- **Persistencia:** Archivos JSON en carpeta `data/`
- **Estilos:** CSS custom (tema oscuro dorado)

## Requisitos

- Node.js 18+ 
- npm

## Instalación

```bash
cd villa-moche-pos
npm install
```

## Configuración

Crear archivo `.env` en `backend/`:

```
PORT=3000
MASTER_PASSWORD=villa2025
```

## Ejecución

```bash
npm start
# o: node backend/server.js
```

El sistema corre en `http://localhost:3000`

## Usuarios por defecto

| ID | Nombre | Rol | Acceso |
|----|--------|-----|--------|
| 1 | Admin | Administrador | Dashboard completo |
| 2 | Cocina Central | Cocina | Pedidos de cocina |
| 3 | Mario | Mozo | Mesas y pedidos |
| 4 | Lucia | Cajera | Caja y ventas |
| 5 | Pedro | Mozo | Mesas y pedidos |
| 6 | Juan | Mozo | Mesas y pedidos |
| 7 | Sofia | Cajera | Caja y ventas |

## Carta Digital Pública

Cada mesa tiene una URL pública: `http://localhost:3000/?mesa=ID`

Se puede generar un código QR desde el panel de administración (mesas) para que los clientes escaneen y pidan desde su celular.

## Licencia

MIT
