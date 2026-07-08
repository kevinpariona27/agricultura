# Sistema Web Gestión Agrícola — Roadmap

> **Estado actual**: MVP completo (auth + parcelas + cultivos). 57 tareas, 111 tests, 5 specs vivas.
> **Próximo hito**: Fase 2 paralela — riegos, fertilizaciones, plagas.

---

## Arquitectura

```
gestion-agricola/              ← npm workspaces root
├── shared/                    ← @agri/shared (tipos)
├── server/                    ← Express + SQLite + Knex + JWT
└── client/                    ← Vite + React 19 + Tailwind v4 + Zustand
```

**Decisiones de arquitectura** (documentadas en `openspec/changes/archive/2026-07-08-gestion-agricola/design.md`):

| AD | Decisión |
|----|----------|
| AD-1 | npm workspaces (`server`, `client`, `shared`) |
| AD-2 | `tsx watch` para desarrollo |
| AD-3 | Knex + better-sqlite3 + migrations |
| AD-4 | Token JWT en localStorage |
| AD-5 | Zod (server) + HTML5 validation (client) |
| AD-6 | Zustand — un store por dominio |

---

## Estado actual de módulos

| Módulo | Rama | Estado | Spec |
|--------|------|--------|------|
| Auth | `main` | ✅ Archivado | `openspec/specs/authentication/` |
| Parcelas | `main` | ✅ Archivado | `openspec/specs/parcel-management/` |
| Cultivos | `main` | ✅ Archivado | `openspec/specs/crop-management/` |
| Riegos | — | 🔲 Pendiente | — |
| Fertilizaciones | — | 🔲 Pendiente | — |
| Plagas | — | 🔲 Pendiente | — |
| Cosechas | — | 🔲 Pendiente | — |
| Inventario | — | 🔲 Pendiente | — |
| Usuarios/Roles | — | 🔲 Pendiente | — |
| Dashboard | — | 🔲 Pendiente | — |
| Reportes | — | 🔲 Pendiente | — |
| Design System | — | 🔲 Pendiente | — |

---

## Dependencias entre módulos

```
                   Auth ─────────────────────────────┐
                     │                               │
                 Parcelas                             │
                     │                               │
                 Cultivos ✅                          │
                     │                               │
     ┌───────────────┼───────────────┐               │
     ▼               ▼               ▼               ▼
  Riegos      Fertilizaciones     Plagas      User Management
     │               │               │
     └───────┬───────┘               │
             ▼                       │
         Cosechas                    │
             │                       │
             ▼                       ▼
     ┌──────────────┐          Inventario
     │   Dashboard  │               │
     │   Reportes   │◄──────────────┘
     │ Design System│ (independiente de todo)
     └──────────────┘
```

---

## Plan de fases

### Fase 1 — Núcleo ✅ COMPLETO

- [x] Auth (registro, login, JWT)
- [x] Parcelas (CRUD, búsqueda, filtros)
- [x] Cultivos (CRUD, JOIN-scoped, 6 estados, filtros)

### Fase 2 — Paralela 🔲 EN CURSO

**Dependencia común**: Parcelas + Cultivos (ya existen).

Estos tres módulos pueden implementarse en paralelo en pestañas separadas de OpenCode:

| Módulo | Rama sugerida | ¿Paralelo? |
|--------|--------------|-------------|
| `irrigation-management` | `feature/irrigation-management` | ✅ Sí |
| `fertilization-management` | `feature/fertilization-management` | ✅ Sí |
| `pest-management` | `feature/pest-management` | ✅ Sí |

### Fase 3 — Dependiente 🔲

| Módulo | Depende de | ¿Paralelo? |
|--------|-----------|-------------|
| `harvest-management` | Cultivos + Riegos | ⚠️ Después de riegos |
| `inventory-management` | Parcelas | ✅ Sí (independiente) |
| `user-management` | Auth | ✅ Sí (independiente) |

### Fase 4 — Final 🔲

| Módulo | Depende de |
|--------|-----------|
| `dashboard` | Todos los módulos con datos |
| `reports` | Dashboard |
| `design-system` | Ninguno (solo UI, no lógica) |

---

## Guía para agentes (nuevo módulo)

Cada agente que arranque en una pestaña nueva debe seguir este patrón. Copiá esta sección en el prompt inicial.

### 1. Contexto técnico

```
Proyecto: Sistema Web Gestión Agrícola
Stack: npm workspaces → Express + SQLite/Knex + JWT → React 19 + Tailwind v4 + Zustand + React Router v7
Auth: JWT en localStorage, middleware auth.ts → req.userId
User scoping: cada query tiene WHERE user_id (directo o vía JOIN)
UI: Español. Desktop-only. Tailwind utility classes.
Tests: Vitest + Supertest (server) / Vitest + RTL + jsdom (client)
```

### 2. Patrones a seguir (leer antes de escribir)

| Archivo de referencia | Para qué |
|----------------------|----------|
| `shared/src/types.ts` | Cómo agregar tipos |
| `server/src/services/parcels.ts` | Patrón de servicio CRUD + user-scoping |
| `server/src/routes/parcels.ts` | Patrón de rutas + Zod + error handling |
| `server/src/__tests__/parcels.test.ts` | Patrón de tests de integración |
| `client/src/stores/parcels.ts` | Patrón de store Zustand |
| `client/src/features/parcels/ParcelListPage.tsx` | Patrón de página lista + filtros |
| `client/src/features/parcels/ParcelDetailPage.tsx` | Patrón de página detalle |
| `client/src/features/parcels/ParcelFormPage.tsx` | Patrón de formulario create/edit |
| `client/src/App.tsx` | Dónde agregar rutas |
| `client/src/shared/layout/Sidebar.tsx` | Dónde agregar nav links |
| `client/src/shared/components/DeleteDialog.tsx` | Componente reutilizable |

### 3. Checklist de implementación

```markdown
## Backend
- [ ] Agregar tipo a shared/src/types.ts
- [ ] Crear migración 00X_nombre.ts (Knex, FK a tabla padre)
- [ ] Crear server/src/services/nombre.ts (CRUD + user-scoping)
- [ ] Crear server/src/routes/nombre.ts (5 endpoints + Zod)
- [ ] Wire routes en server/src/app.ts
- [ ] Tests: server/src/__tests__/nombre.test.ts (≥20 casos)

## Frontend
- [ ] Crear client/src/stores/nombre.ts (Zustand, patrón parcels)
- [ ] Crear componentes: Table + Form
- [ ] Crear páginas: ListPage, DetailPage, FormPage
- [ ] Agregar rutas en App.tsx
- [ ] Agregar NavLink en Sidebar.tsx
- [ ] Tests: store + list page (RTL)

## Verificación
- [ ] tsc --noEmit limpio (server + client)
- [ ] npx vitest run pasa (server + client)
- [ ] npm run build exitoso (client)
- [ ] Sin regresiones (tests existentes intactos)
```

### 4. Restricciones

- **No modificar** otros módulos salvo para agregar navegación (Sidebar, App.tsx) y relaciones FK estrictamente necesarias
- **No introducir** nuevas dependencias de npm sin consultar
- **Seguir** los mismos patrones de nomenclatura, estructura de archivos y mensajes de error
- **UI en español** para todos los labels, errores y botones
- **Mantener** los tests existentes verdes

---

## Cómo abrir una pestaña nueva para un módulo

1. Abrí una nueva ventana/pestaña de OpenCode en `C:\Users\maik\apliacacio-agricultura`
2. Copiá la sección "Guía para agentes" de este documento como prompt inicial
3. Reemplazá `{módulo}` por el nombre concreto (ej: `irrigation-management`)
4. El agente usará SDD para planificar e implementar siguiendo el pipeline estándar

---

## Repositorio

- **Local**: `C:\Users\maik\apliacacio-agricultura`
- **Rama principal**: `main`
- **Remote**: No configurado aún
- **Specs vivas**: `openspec/specs/`
- **Archivo**: `openspec/changes/archive/`
