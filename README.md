# 🌾 AgroExec — Sistema de Gestión Agrícola

Plataforma integral profesional para la gestión de explotaciones agrícolas. Registro de parcelas, cultivos, riegos, fertilizaciones, plagas, cosechas e inventario con dashboard analítico, mapa interactivo, calendario, roles de usuario, y exportación a Excel/PDF.

**📍 Región:** Ayacucho, Perú

---

## 🚀 Demo en Vivo

| Ambiente | URL |
|---|---|
| **Producción** | [agroex-production.up.railway.app](https://agroex-production.up.railway.app) |
| **Desarrollo** | [agricultura-dev-production.up.railway.app](https://agricultura-dev-production.up.railway.app) |

### Credenciales de prueba

| Rol | Email | Contraseña | Permisos |
|---|---|---|---|
| 👑 Admin | `admin@agroexec.com` | `admin123456` | Todo |
| 📋 Manager | `manager@agroexec.com` | `manager123` | Crear, editar, eliminar |
| 👷 Operador | `operario@agroexec.com` | `operario12` | Solo lectura + crear |

---

## ✨ Funcionalidades

### 📊 Dashboard & Analítica
- Dashboard con 3 tabs: **General**, **Financiero**, **Operativo**
- 6 KPIs en tiempo real con navegación a secciones
- Gráficos interactivos: distribución de cultivos, evolución riegos/cosechas, top rendimiento
- Widget de clima para Ayacucho
- Timeline de actividad reciente
- Alertas de stock bajo, cosechas próximas y plagas activas

### 🌱 Gestión Agrícola
- **Parcelas**: CRUD completo con geolocalización en mapa
- **Cultivos**: Siembra, estado, densidad, fechas estimadas
- **Riegos**: Método, cantidad, duración, fechas
- **Fertilizaciones**: Producto, dosis, costo, fechas
- **Plagas**: Tipo, severidad, tratamiento, estado
- **Cosechas**: Cantidad, rendimiento (kg/ha), pérdidas
- **Inventario**: Stock, categoría, vencimiento, costo unitario

### 💰 Finanzas
- Página de **Costos** con margen por cultivo
- Cálculo de **€/kg** (ingreso estimado - costo ÷ cantidad)
- Resumen: total invertido, margen promedio, mejor cultivo
- Exportación de reportes financieros

### 🗺️ Visualización
- **Mapa interactivo** con Leaflet centrado en Ayacucho
- **Dibujo de polígonos** para delimitar parcelas sobre el mapa
- Cálculo automático de área en hectáreas
- **Calendario** de siembras, riegos, cosechas y fertilizaciones
- **Vista de calendario** con eventos color-coded

### 📄 Reportes & Exportación
- **Reportes** con 5 secciones de gráficos (rendimiento, costos, plagas, comparativas)
- **Exportar a Excel** (.xlsx) en todas las tablas
- **Exportar a PDF** con formato profesional
- **Cuaderno de Campo** — exportación legal con hojas de aplicaciones, cosechas y riegos
- **Importar CSV** — carga masiva de parcelas, cultivos e inventario

### 🔐 Seguridad & Control
- **Roles de usuario**: admin, manager, operator
- **Auditoría**: created_by y updated_by en todos los registros
- **Autenticación JWT** con tokens de 7 días
- **Middleware de roles** en backend (protección de rutas)
- Componente **ProtectedAction** — oculta botones según rol

### 📱 Experiencia de Usuario
- **Diseño profesional** con sidebar claro + breadcrumbs
- **Modo oscuro/claro** automático (por hora) + toggle manual
- **PWA** — instalable como app nativa
- **Soporte offline** — cola de cambios en localStorage
- **Skeleton loaders** en todas las páginas
- **Tooltips** en botones de acción
- **Atajos de teclado** (Ctrl+N, Ctrl+D, Ctrl+R)
- **Landing page** pública con CTA
- **Página 404** personalizada
- **Splash screen** al cargar
- **Favicon** personalizado
- **Footer** con versión y ubicación

### 📡 IoT & Automatización
- **API de telemetría** (`/api/telemetry`) para sensores IoT
- Soporte para: humedad del suelo, temperatura, lluvia, evapotranspiración
- **Fotos con GPS** — captura coordenadas al subir imágenes
- **Notificaciones** en tiempo real de stock bajo, cosechas y plagas

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Zustand, Framer Motion, Recharts, Leaflet, react-big-calendar |
| **Backend** | Express 4, TypeScript, better-sqlite3, Knex, Multer, JWT, bcrypt, Zod |
| **Testing** | Vitest, React Testing Library, Supertest — **353 tests** (122 client + 231 server) |
| **DevOps** | Railway (deploy), Docker, Docker Compose, Nginx |
| **Tooling** | npm workspaces, tsx, Vite, PWA, xlsx, jsPDF, PapaParse |

---

## 🏗 Arquitectura

```
┌──────────────────────────────────────────────┐
│                 Railway Cloud                 │
│                                              │
│  ┌─────────────┐     ┌──────────────────────┐│
│  │   Nginx     │────▶│  Express Server :3001 ││
│  │   SPA :80   │     │  /api/*     REST API  ││
│  │   Static    │     │  /uploads/* Imágenes  ││
│  └─────────────┘     │  /*         React SPA ││
│                      └──────────────────────┘│
│                              │               │
│                      ┌───────▼──────────┐    │
│                      │  SQLite + Volume  │    │
│                      │  (datos persisten)│    │
│                      └──────────────────┘    │
└──────────────────────────────────────────────┘
```

---

## 📊 Tests

| Tipo | Framework | Archivos | Tests |
|---|---|---|---|
| Unitarios (Frontend) | Vitest + RTL + jsdom | 22 | 122 |
| Integración (Backend) | Vitest + Supertest | 11 | 231 |
| **Total** | | **33** | **353** |

```bash
npm test -w client   # 122 tests
npm test -w server   # 231 tests
```

---

## 🚀 Inicio Rápido

### Desarrollo local

```bash
npm install

# Terminal 1 — Backend
cd server && npm run dev    # http://localhost:3001

# Terminal 2 — Frontend
cd client && npm run dev    # http://localhost:5173
```

### Docker

```bash
docker compose up --build   # http://localhost
```

### Deploy en Railway

```bash
railway up                  # Producción
railway up --service agricultura-dev  # Desarrollo
```

Ver [`docs/deploy-railway.md`](docs/deploy-railway.md) para guía completa de deploy.

---

## 📋 Variables de Entorno

| Variable | Descripción |
|---|---|
| `CORS_ORIGIN` | Origen permitido para CORS |
| `JWT_SECRET` | Secreto para firma de tokens JWT |
| `NODE_ENV` | `production` / `development` / `test` |
| `PORT` | Puerto del servidor Express |
| `SERVE_CLIENT` | `true` para servir SPA desde Express |
| `FORCE_RESEED` | `true` para regenerar datos demo al deployar |
| `IOT_API_KEY` | API key para endpoint de telemetría IoT |

---

## 🔌 API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registro (acepta `role`) |
| POST | `/api/auth/login` | Login (devuelve JWT + user con role) |

### Módulos CRUD — Parcelas, Cultivos, Riegos, Fertilizaciones, Plagas, Cosechas, Inventario
| Método | Ruta | Auth |
|---|---|---|
| GET | `/api/{entity}` | Token |
| POST | `/api/{entity}` | Token + admin/manager |
| GET | `/api/{entity}/:id` | Token |
| PUT | `/api/{entity}/:id` | Token + admin/manager |
| DELETE | `/api/{entity}/:id` | Token + admin/manager |

### Uploads
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/upload/:entity/:id` | Subir imagen (parcelas, plagas) |
| DELETE | `/api/upload/:entity/:id` | Eliminar imagen |

### IoT & Alertas
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/telemetry` | Recibir datos de sensores (X-API-KEY) |
| GET | `/api/telemetry/:parcelId` | Última telemetría de parcela |
| POST | `/api/alerts/subscribe` | Suscribirse a alertas email |
| GET | `/api/alerts/check` | Verificar alertas pendientes (admin) |

### Sistema
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/users/me` | Perfil del usuario autenticado |

---

## 📂 Estructura del Proyecto

```
├── client/                        # Frontend React SPA
│   ├── src/
│   │   ├── api/                   # Cliente HTTP
│   │   ├── features/
│   │   │   ├── alerts/            # Suscripción a alertas
│   │   │   ├── auth/              # Login, registro
│   │   │   ├── calendar/          # Vista de calendario
│   │   │   ├── costs/             # Costos y márgenes
│   │   │   ├── crops/             # CRUD cultivos
│   │   │   ├── dashboard/         # Dashboard con tabs + charts
│   │   │   ├── errors/            # Página 404
│   │   │   ├── fertilizations/    # CRUD fertilizaciones
│   │   │   ├── harvests/          # CRUD cosechas
│   │   │   ├── import/            # Importar CSV
│   │   │   ├── inventory/         # CRUD inventario
│   │   │   ├── irrigations/       # CRUD riegos
│   │   │   ├── landing/           # Landing page pública
│   │   │   ├── legal/             # Cuaderno de Campo
│   │   │   ├── map/               # Mapa con dibujo de polígonos
│   │   │   ├── parcels/           # CRUD parcelas
│   │   │   ├── pests/             # CRUD plagas
│   │   │   └── reports/           # Reportes con gráficos
│   │   ├── shared/
│   │   │   ├── components/        # Badge, StatCard, Skeleton, Tooltip, Pagination, etc.
│   │   │   ├── hooks/             # useKeyboardShortcuts, useUnsavedChanges
│   │   │   ├── layout/            # AppLayout, Sidebar, Header
│   │   │   └── utils/             # exportExcel, exportPDF, geocode, offlineQueue
│   │   └── stores/                # Zustand: auth, crops, weather, theme, notification, etc.
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── server/                        # Backend Express
│   ├── src/
│   │   ├── db/                    # Knex config + 14 migrations
│   │   ├── middleware/            # auth, roles, audit, upload, error
│   │   ├── routes/                # auth, parcels, crops, irrigations, fertilizer, pests, harvests, inventory, upload, users, telemetry, alerts
│   │   └── services/              # Lógica de negocio por entidad
│   ├── seed.ts                    # Datos demo (14 parcelas, 30 cultivos, 30 riegos, etc.)
│   ├── entrypoint.sh              # Migrations → seed → server
│   └── Dockerfile
├── shared/                        # Tipos TypeScript compartidos
├── openspec/                      # Artefactos SDD (8 cambios, 13 specs)
├── docs/                          # Documentación
│   ├── deploy-railway.md          # Guía de deploy
│   └── er-diagram.md              # Diagrama entidad-relación
├── design-system/                 # Design system Organic Biophilic
├── docker-compose.yml
└── README.md
```

---

## 📝 Datos Demo

El seed incluye **154 registros** con datos realistas de la región Ayacucho:

| Entidad | Registros |
|---|---|
| Parcelas | 14 |
| Cultivos | 30 |
| Riegos | 30 |
| Fertilizaciones | 25 |
| Plagas | 15 |
| Cosechas | 20 |
| Inventario | 20 |

---

## 🎨 Design System

- **Organic Biophilic + Earth palette** — tonos verde tierra con acentos dorados
- **Sidebar profesional claro** con breadcrumbs
- **Soporte dark/light mode** automático
- **Diseño responsive** — mobile, tablet, desktop
- **Framer Motion** para animaciones fluidas

---

## 👤 Para el Profesor

| Requisito | Evidencia |
|---|---|
| **SDD** | [8 cambios documentados](openspec/changes/) con proposal → specs → design → tasks → verify → archive |
| **Ciclo de vida** | Planning → Design → Implementation → Testing → Deploy — en cada archive |
| **Tests unitarios** | 122 tests — Vitest + RTL + jsdom |
| **Tests integración** | 231 tests — Supertest + SQLite en memoria |
| **GitHub** | [github.com/kevinpariona27/agricultura](https://github.com/kevinpariona27/agricultura) |
| **Deploy** | [Railway](https://agroex-production.up.railway.app) + Docker Compose |
| **Roles** | Admin, Manager, Operator con middleware de autorización |
| **Auditoría** | created_by / updated_by en todos los registros |
| **IoT** | API de telemetría para sensores agrícolas |
| **Offline** | Cola de cambios en localStorage + sincronización |
| **Exportación** | Excel, PDF, Cuaderno de Campo legal |
| **Mapa** | Leaflet con dibujo de polígonos + geolocalización Ayacucho |
| **PWA** | Instalable como app nativa con service worker |
