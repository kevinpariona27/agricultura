# AgroExec — Sistema de Gestión Agrícola

Plataforma integral para la gestión de explotaciones agrícolas. Registro de parcelas, cultivos, riegos, fertilizaciones, plagas, cosechas e inventario con soporte de imágenes y dashboard analítico.

## Stack Tecnológico

| Capa        | Tecnología                                                     |
|-------------|----------------------------------------------------------------|
| Frontend    | React 19, TypeScript, Tailwind CSS v4, Zustand, Framer Motion, Recharts |
| Backend     | Express 4, TypeScript, better-sqlite3, Knex, Multer           |
| Testing     | Vitest, React Testing Library, Supertest                       |
| DevOps      | Docker, Docker Compose, Nginx                                  |
| Tooling     | npm workspaces, tsx, Vite                                      |

## Arquitectura

```
Browser :80
    │
    ▼
┌──────────────────────────────────────┐
│              Nginx :80               │
│                                      │
│  /api/*     → server:3001  (Express) │
│  /uploads/* → server:3001  (Static)  │
│  /*         → client:80    (SPA)     │
└──────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│  Server :3001   │  │   Client :80     │
│  Express +      │  │   React SPA      │
│  better-sqlite3 │  │   Nginx static   │
│                 │  │                  │
│  Vol: /app/data │  └──────────────────┘
└─────────────────┘
```

## Metodología SDD (Spec-Driven Development)

El proyecto sigue la metodología SDD — cada feature pasa por proposal → specs → design → tasks → apply → verify → archive.

| Cambio | Fase | Artefactos |
|--------|------|------------|
| `gestion-agricola` | Bootstrap del proyecto | [Proposal](openspec/changes/archive/2026-07-08-gestion-agricola/proposal.md) · [Specs](openspec/changes/archive/2026-07-08-gestion-agricola/specs/) · [Archive](openspec/changes/archive/2026-07-08-gestion-agricola/archive-report.md) |
| `crop-management` | Gestión de cultivos | [Design](openspec/changes/archive/2026-07-08-crop-management/design.md) · [Archive](openspec/changes/archive/2026-07-08-crop-management/archive-report.md) |
| `irrigation-management` | Gestión de riegos | [Archive](openspec/changes/archive/2026-07-08-irrigation-management/archive-report.md) |
| `fertilization-management` | Gestión de fertilizaciones | [Design](openspec/changes/archive/2026-07-08-fertilization-management/design.md) · [Archive](openspec/changes/archive/2026-07-08-fertilization-management/archive-report.md) |
| `image-support` | Soporte de imágenes y subida de archivos | [Explore](openspec/changes/archive/2026-07-09-image-support/explore.md) · [Specs](openspec/changes/archive/2026-07-09-image-support/specs/) · [Archive](openspec/changes/archive/2026-07-09-image-support/archive-report.md) |
| `enterprise-ui-polish-v2` | Refactor UI enterprise | [Design](openspec/changes/archive/2026-07-09-enterprise-ui-polish-v2/design.md) · [Archive](openspec/changes/archive/2026-07-09-enterprise-ui-polish-v2/archive-report.md) |
| `delivery-readiness` | Docker, README, entrega | [Design](openspec/changes/delivery-readiness/design.md) · [Tasks](openspec/changes/delivery-readiness/tasks.md) |

## Tests

| Tipo                    | Framework            | Archivos | Tests  |
|-------------------------|----------------------|----------|--------|
| Unitarios (Frontend)    | Vitest + RTL + jsdom | 19       | 104    |
| Integración (Backend)   | Vitest + Supertest   | 10       | 227    |
| **Total**               |                      | **29**   | **331** |

```bash
# Ejecutar todos los tests
npm test -w client   # 104 tests unitarios
npm test -w server   # 227 tests de integración (SQLite en memoria)
```

## Inicio Rápido

### Con Docker (recomendado)

```bash
# Construir y levantar todos los servicios
docker compose up --build

# Abrir en el navegador
# http://localhost

# Detener y limpiar (incluye datos)
docker compose down -v
```

El comando levanta:
- **server**: Express en puerto 3001 con SQLite en volumen persistente
- **client**: React SPA servido por Nginx en puerto 80 interno
- **nginx**: Proxy reverso en puerto 80 expuesto al host

El seed de datos demo se ejecuta automáticamente al primer arranque.

### Configuración Manual (desarrollo)

```bash
# Instalar dependencias (npm workspaces)
npm install

# Backend
cd server
cp ../.env.example .env    # Configurar variables de entorno
npm run dev                # http://localhost:3001

# Frontend (otra terminal)
cd client
npm run dev                # http://localhost:5173
```

### Variables de Entorno (server/.env)

| Variable      | Default                         | Descripción                     |
|---------------|---------------------------------|---------------------------------|
| `CORS_ORIGIN` | `http://localhost:5173`         | Origen permitido para CORS      |
| `JWT_SECRET`  | `agroexec-dev-secret-change-me` | Secreto para firma de tokens    |
| `PORT`        | `3001`                          | Puerto del servidor Express     |
| `DB_PATH`     | `./data.db`                     | Ruta del archivo SQLite         |

## API Endpoints

### Autenticación
| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| POST   | `/api/auth/register`| Registro de usuario      |
| POST   | `/api/auth/login`   | Inicio de sesión (JWT)   |

### Parcelas
| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| GET    | `/api/parcels`      | Listar parcelas          |
| POST   | `/api/parcels`      | Crear parcela            |
| GET    | `/api/parcels/:id`  | Detalle de parcela       |
| PUT    | `/api/parcels/:id`  | Actualizar parcela       |
| DELETE | `/api/parcels/:id`  | Eliminar parcela         |

### Cultivos
| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| GET    | `/api/crops`        | Listar cultivos          |
| POST   | `/api/crops`        | Crear cultivo            |
| GET    | `/api/crops/:id`    | Detalle de cultivo       |
| PUT    | `/api/crops/:id`    | Actualizar cultivo       |
| DELETE | `/api/crops/:id`    | Eliminar cultivo         |

### Riegos
| Método | Ruta                    | Descripción          |
|--------|-------------------------|----------------------|
| GET    | `/api/irrigations`      | Listar riegos        |
| POST   | `/api/irrigations`      | Crear riego          |
| GET    | `/api/irrigations/:id`  | Detalle de riego     |
| PUT    | `/api/irrigations/:id`  | Actualizar riego     |
| DELETE | `/api/irrigations/:id`  | Eliminar riego       |

### Fertilizaciones
| Método | Ruta                       | Descripción             |
|--------|----------------------------|-------------------------|
| GET    | `/api/fertilizations`      | Listar fertilizaciones  |
| POST   | `/api/fertilizations`      | Crear fertilización     |
| GET    | `/api/fertilizations/:id`  | Detalle                 |
| PUT    | `/api/fertilizations/:id`  | Actualizar              |
| DELETE | `/api/fertilizations/:id`  | Eliminar                |

### Plagas
| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| GET    | `/api/pests`        | Listar plagas            |
| POST   | `/api/pests`        | Crear plaga              |
| GET    | `/api/pests/:id`    | Detalle de plaga         |
| PUT    | `/api/pests/:id`    | Actualizar plaga         |
| DELETE | `/api/pests/:id`    | Eliminar plaga           |

### Cosechas
| Método | Ruta                  | Descripción            |
|--------|-----------------------|------------------------|
| GET    | `/api/harvests`       | Listar cosechas        |
| POST   | `/api/harvests`       | Crear cosecha          |
| GET    | `/api/harvests/:id`   | Detalle de cosecha     |
| PUT    | `/api/harvests/:id`   | Actualizar cosecha     |
| DELETE | `/api/harvests/:id`   | Eliminar cosecha       |

### Inventario
| Método | Ruta                  | Descripción            |
|--------|-----------------------|------------------------|
| GET    | `/api/inventory`      | Listar inventario      |
| POST   | `/api/inventory`      | Crear ítem             |
| GET    | `/api/inventory/:id`  | Detalle de ítem        |
| PUT    | `/api/inventory/:id`  | Actualizar ítem        |
| DELETE | `/api/inventory/:id`  | Eliminar ítem          |

### Usuarios
| Método | Ruta                | Descripción              |
|--------|---------------------|--------------------------|
| GET    | `/api/users`        | Listar usuarios          |
| GET    | `/api/users/:id`    | Detalle de usuario       |
| PUT    | `/api/users/:id`    | Actualizar perfil        |

### Uploads
| Método | Ruta                        | Descripción              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/upload/:entity/:id`   | Subir imagen             |
| DELETE | `/api/upload/:entity/:id`   | Eliminar imagen          |

### Sistema
| Método | Ruta            | Descripción     |
|--------|-----------------|-----------------|
| GET    | `/api/health`   | Health check    |

## Checklist del Profesor

| Requisito              | Evidencia                                                                               |
|------------------------|------------------------------------------------------------------------------------------|
| SDD (Spec-Driven Dev)  | [Archivo de cambios](openspec/changes/archive/) — 6 features con proposal, specs, design, tasks, verify, archive |
| Ciclo de vida completo | Planning → Design → Implementation → Testing → Deploy — documentado en cada archive      |
| Pruebas unitarias      | 104 tests — Vitest + React Testing Library + jsdom                                       |
| Pruebas de integración | 227 tests — Supertest con SQLite en memoria (:memory:)                                   |
| Despliegue             | Docker Compose — `docker compose up` levanta toda la app en un comando                   |
| GitHub                 | [github.com/maik/apliacacio-agricultura](https://github.com/maik/apliacacio-agricultura)  |

## Estructura del Proyecto

```
apliacacio-agricultura/
├── client/                     # Frontend React SPA
│   ├── src/
│   │   ├── api/               # Cliente HTTP (/api)
│   │   ├── features/          # Páginas por dominio
│   │   │   ├── auth/          # Login, registro
│   │   │   ├── parcels/       # CRUD parcelas
│   │   │   ├── crops/         # CRUD cultivos
│   │   │   ├── irrigations/   # CRUD riegos
│   │   │   ├── fertilizations/# CRUD fertilizaciones
│   │   │   ├── pests/         # CRUD plagas
│   │   │   ├── harvests/      # CRUD cosechas
│   │   │   ├── inventory/     # CRUD inventario
│   │   │   ├── dashboard/     # Dashboard con gráficos
│   │   │   └── users/         # Perfil de usuario
│   │   ├── shared/            # Componentes compartidos
│   │   └── stores/            # Estado global (Zustand)
│   ├── Dockerfile
│   └── nginx.conf
├── server/                     # Backend Express
│   ├── src/
│   │   ├── db/                # Knex config, migrations
│   │   ├── middleware/         # Auth, error handling
│   │   └── routes/            # Endpoints REST
│   ├── seed.ts                # Datos demo (7 parcelas, 16 cultivos, etc.)
│   ├── Dockerfile
│   └── entrypoint.sh
├── shared/                     # Tipos compartidos
├── openspec/                   # Artefactos SDD
├── nginx.conf                  # Proxy reverso (raíz)
├── docker-compose.yml
└── README.md
```
