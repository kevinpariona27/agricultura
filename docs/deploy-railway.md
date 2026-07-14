# Deploy en Railway

## Arquitectura

La app se deploya como **monolito** en Railway. Un solo container Docker ejecuta:

- **Express server** (API REST) en el puerto 3001
- **React SPA** (client) servido como archivos estáticos por Express

```
Railway Container
┌──────────────────────────────┐
│  Express (API)               │
│  /api/*          → Backend   │
│  /*              → React SPA │
│  /uploads/*      → Imágenes  │
└──────────────────────────────┘
```

La imagen Docker se construye en 2 etapas (ver `Dockerfile` raíz):

1. **client-build**: instala dependencias del client y ejecuta `npm run build` (Vite)
2. **stage-1**: instala dependencias del server, copia el build del client, y ejecuta el server

## Ambientes

Tenemos **dos servicios** separados en Railway:

| Servicio | URL | Ambiente | Rama |
|---|---|---|---|
| `agroex` | `https://agroex-production.up.railway.app` | Producción | `master` |
| `agricultura-dev` | `https://agricultura-dev-production.up.railway.app` | Desarrollo | `master` |

### ¿Por qué dos servicios?

- **Base de datos separada** — no rompés prod si probás algo en dev
- **Variables de entorno independientes** —JWT_SECRET diferente, NODE_ENV diferente
- **Deploy aislado** — si algo falla en dev, prod sigue funcionando
- **Testing seguro** — podés probar cambios sin afectar usuarios

## Prerrequisitos

- [Railway CLI](https://docs.railway.com/guides/cli) instalada
- Cuenta en [Railway](https://railway.app)
- Git y Node.js instalados

## Primer deploy

```bash
# 1. Instalar la CLI (si no la tenés)
npm install -g @railway/cli

# 2. Login (abre el browser para autorizar)
railway login

# 3. Crear el proyecto y linkear al repo
railway init

# 4. Configurar variables de entorno (producción)
railway variables set "CORS_ORIGIN=*"
railway variables set "JWT_SECRET=tu-secret-seguro"
railway variables set "NODE_ENV=production"
railway variables set "SERVE_CLIENT=true"
railway variables set "PORT=3001"

# 5. Deploy
railway up

# 6. Ver la URL de la app
railway open
```

### Volumes (persistencia de datos)

Railway necesita volumes para que la base de datos y las imágenes no se pierdan en cada deploy.

**Desde la dashboard de Railway** (no funciona con la CLI todavía):

1. Andá a tu servicio → **Volumes**
2. Agregá dos mounts:
   - **Mount Path:** `/app/server/data.db` → para SQLite
   - **Mount Path:** `/app/server/uploads` → para imágenes subidas

> **Importante:** después de agregar los volumes, hacé un redeploy para que se monten correctamente.

## Comandos de deploy

### Deploy a Producción

```bash
# Opción 1: push a Git (Railway redeploya automáticamente)
git push

# Opción 2: deploy manual desde la raíz del proyecto
railway up
```

### Deploy a Desarrollo

```bash
# Deploy manual al servicio de dev
railway up --service agricultura-dev
```

### Deploy a ambos ambientes

```bash
# Deploy a prod
railway up

# Deploy a dev
railway up --service agricultura-dev
```

### Verificar estado de los servicios

```bash
# Ver todos los servicios
railway service list

# Ver logs de un servicio específico
railway logs --service agroex
railway logs --service agricultura-dev

# Ver URL de un servicio
railway domain --service agroex
railway domain --service agricultura-dev
```

## Variables de entorno

### Producción (`agroex`)

| Variable | Valor | Descripción |
|---|---|---|
| `CORS_ORIGIN` | `*` | Dominios permitidos para CORS |
| `JWT_SECRET` | string seguro | Secreto para firmar tokens JWT |
| `NODE_ENV` | `production` | Modo de producción |
| `SERVE_CLIENT` | `true` | Sirve el SPA desde Express |
| `PORT` | `3001` | Puerto del server (Railway inyecta el suyo) |

### Desarrollo (`agricultura-dev`)

| Variable | Valor | Descripción |
|---|---|---|
| `CORS_ORIGIN` | `*` | Dominios permitidos para CORS |
| `JWT_SECRET` | `dev-secret-change-in-production` | Secreto para dev |
| `NODE_ENV` | `development` | Modo de desarrollo |
| `SERVE_CLIENT` | `true` | Sirve el SPA desde Express |
| `PORT` | `3001` | Puerto del server |

## Configuración de servicios

Ambos servicios necesitan la misma configuración en **Settings → Source**:

| Campo | Valor |
|---|---|
| **Root Directory** | `.` (raíz del repo) |
| **Dockerfile Path** | `server/Dockerfile` |

## Comandos útiles de la CLI

```bash
# Ver logs del server en tiempo real
railway logs

# Ver logs de un servicio específico
railway logs --service agroex
railway logs --service agricultura-dev

# Abrir la dashboard en el browser
railway open

# Ver la URL del deploy
railway domain

# Ver variables seteadas
railway variables

# Setear una variable
railway variables set "VARIABLE=valor"

# Setear una variable en un servicio específico
railway variables set "VARIABLE=valor" --service agricultura-dev

# Redeploy manual
railway up

# Redeploy un servicio específico
railway up --service agricultura-dev

# Ver el estado del proyecto
railway service list

# Ver métricas de un servicio
railway metrics --service agroex
```

## Solución de problemas

### "CORS_ORIGIN environment variable is required"
Seteá la variable: `railway variables set "CORS_ORIGIN=*"`

### "Project has no services"
Primero hacé `railway up` para crear el servicio, después seteá variables.

### Build falla con "not found" en archivos del client
Verificá que el **Root Directory** en Railway Settings → Source esté en `.` (la raíz del repo).

### La app carga pero la API no responde
- Revisá los logs: `railway logs`
- Verificá que `SERVE_CLIENT=true` esté seteado
- Confirmá que el client se buildó correctamente (debería haber un `dist/` en el container)

### La base de datos se pierde después de cada deploy
Agregá un **volume** en la dashboard de Railway con mount path `/app/server/data.db`.

### Quiero deployar solo un servicio
Usá el flag `--service`:
```bash
railway up --service agroex          # solo prod
railway up --service agricultura-dev # solo dev
```

## Flujo de trabajo recomendado

1. **Desarrollá** localmente con `npm run dev`
2. **Commiteá** los cambios
3. **Deployá a dev** para probar: `railway up --service agricultura-dev`
4. **Verificá** en la URL de dev que todo funcione
5. **Deployá a prod** cuando esté listo: `railway up` (o `git push`)

## Archivos relevantes

- `Dockerfile` (raíz) — build multi-etapa del monolito
- `server/Dockerfile` — build solo del server (no usado en deploy normal)
- `server/entrypoint.sh` — script de inicio (seed + server)
- `server/src/app.ts` — configuración de Express, CORS, y servicio del SPA
- `.dockerignore` — archivos excluidos del build de Docker
