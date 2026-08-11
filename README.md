# PoE Museum

PoE Museum es una aplicación web comunitaria para consultar, publicar y gestionar builds de **Path of Exile**. El proyecto usa una API Node.js/Express con MongoDB y una SPA Angular.

## Contenido

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Inicio local](#inicio-local)
- [Configuración](#configuración)
- [Scripts](#scripts)
- [Funcionalidades](#funcionalidades)
- [API](#api)
- [Modelo de datos](#modelo-de-datos)
- [Imágenes](#imágenes)
- [Frontend y caché](#frontend-y-caché)
- [Despliegue](#despliegue)
- [Limitaciones de seguridad](#limitaciones-de-seguridad)
- [Estructura](#estructura)

## Arquitectura

```text
Cloudflare Pages
  Angular 21 SPA
        |
        | HTTPS / JSON
        v
Render Web Service
  Node.js + Express + Multer
        |
        v
MongoDB Atlas
  poe_museum: builds, users
```

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Frontend | Angular 21, CSS, Font Awesome | Galería, detalle, autenticación y formularios de builds |
| Backend | Node.js, Express 5, Mongoose 9 | API REST, conexión a MongoDB, carga de imágenes y proxy de PoE Wiki |
| Base de datos | MongoDB Atlas | Colecciones `builds` y `users` |
| Hosting frontend | Cloudflare Pages | Distribución de la SPA estática |
| Hosting backend | Render | Servicio Node.js y API pública |

## Requisitos

- Node.js 20 o superior.
- npm 11 o superior.
- Una base de datos MongoDB Atlas accesible.
- Una cuenta de Cloudflare Pages y Render para el despliegue descrito.

## Inicio local

Instala las dependencias del backend desde la raíz:

```bash
npm install
```

Instala las dependencias del frontend:

```bash
cd frontend
npm install
```

Crea el archivo `.env` en la raíz del repositorio. No copies credenciales reales al repositorio:

```dotenv
MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>/poe_museum?retryWrites=true&w=majority
PORT=3000
CORS_ORIGIN=http://localhost:4200,http://localhost:8080
```

En dos terminales distintas, inicia ambos servicios:

```bash
# Raíz del repositorio: API en http://localhost:3000
npm start
```

```bash
# Directorio frontend: SPA en http://localhost:4200
npm start
```

Comprueba la API:

```bash
curl http://localhost:3000/
curl http://localhost:3000/poem/all
```

## Configuración

### Backend

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `MONGODB_URI` | Sí | URI de conexión a MongoDB Atlas. |
| `PORT` | No | Puerto de Express. El valor por defecto es `3000`. |
| `CORS_ORIGIN` | No | Orígenes separados por comas autorizados para CORS. Por defecto permite `http://localhost:4200,http://localhost:8080`. |

### Frontend

Los endpoints se definen en los archivos de entorno:

| Archivo | Entorno | `apiBaseUrl` |
| --- | --- | --- |
| `frontend/src/environments/environment.ts` | Desarrollo | `http://localhost:3000` |
| `frontend/src/environments/environment.prod.ts` | Producción | `https://poe-museum-api.onrender.com` |

Para cambiar el backend productivo, actualiza `environment.prod.ts` y vuelve a generar el build Angular.

## Scripts

### Backend

Ejecutar desde la raíz:

```bash
npm start
```

Este comando ejecuta `node index.js`.

### Frontend

Ejecutar desde `frontend/`:

```bash
npm start       # Servidor de desarrollo Angular
npm run build   # Build de producción en dist/frontend/browser
npm test        # Pruebas Angular
```

## Funcionalidades

- Galería responsive de builds con métricas de daño, mapeo y supervivencia.
- Detalle de build con valoraciones, versiones de Path of Building, pros, contras e items obligatorios.
- Búsqueda por nombre, autor, clase, ascendencia, descripción, ventajas y desventajas.
- Búsqueda representada en la URL como `/home?q=<texto>` para que sea navegable y compartible.
- Registro, inicio de sesión, perfil, Mis Builds y permisos de edición/eliminación por autor.
- Creación, edición y eliminación de builds.
- Carga de imágenes PNG, JPEG o WebP con un límite de 5 MB.
- Consulta de iconos de items mediante el proxy de PoE Wiki.
- Caché de builds en memoria del navegador durante cinco minutos, actualizada tras operaciones CRUD.
- Indicadores de carga para el arranque en frío de Render y reintento ante un error de conexión.

## API

La API se monta en el host configurado. En desarrollo su base es `http://localhost:3000`.

### Estado e imágenes

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/` | Comprueba que la API esté activa. |
| `GET` | `/test` | Endpoint de diagnóstico. |
| `POST` | `/upload` | Sube una imagen multipart bajo el campo `image`. |
| `GET` | `/images/:filename` | Sirve una imagen almacenada por el backend. |
| `GET` | `/api/poe-wiki/image?title=<nombre>` | Obtiene la URL de icono de un item desde PoE Wiki. |

### Builds

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/poem/all` | Devuelve todas las builds. |
| `GET` | `/poem/:id` | Devuelve una build por su `_id`. |
| `GET` | `/poem/name/:name` | Busca builds por nombre, sin distinguir mayúsculas. |
| `GET` | `/poem/user/:userId` | Devuelve builds asociadas a un usuario. |
| `POST` | `/poem` | Crea una build y asigna `fecha_creacion` en el servidor. |
| `PUT` | `/poem/:id` | Actualiza una build existente. |
| `DELETE` | `/poem/:id` | Elimina una build. |

Ejemplo mínimo para crear una build:

```json
{
  "nombre": "Righteous Fire Juggernaut",
  "autor": "Nombre de usuario",
  "usuario_id": "<id-del-usuario>",
  "clase": "Marauder",
  "ascendencia": "Juggernaut",
  "descripcion": "Build centrada en Righteous Fire.",
  "ventajas": "- Muy resistente\n- Fácil de jugar",
  "desventajas": "- Daño de jefe medio",
  "imagen": "build-rf.png",
  "imagen_mime": "image/png",
  "valoraciones": {
    "boss_dmg": 3.5,
    "comfort": 5,
    "difficulty": 2,
    "fun": 4,
    "map_speed_clear": 4,
    "survivality": 5
  },
  "versiones": [
    {
      "name": "3.26",
      "pobb": "https://pobb.in/<codigo>"
    }
  ],
  "items_mandatory": []
}
```

### Autenticación

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/auth/register` | Registra un usuario. |
| `POST` | `/auth/login` | Inicia sesión con email y contraseña. |
| `GET` | `/auth/:id` | Devuelve un usuario sin el campo `password`. |

## Modelo de datos

### `builds`

| Campo | Tipo | Obligatorio | Descripción |
| --- | --- | --- | --- |
| `nombre` | String | Sí | Nombre de la build. |
| `autor` | String | Sí | Nombre visible del autor. |
| `usuario_id` | String | Sí | Identificador del autor. |
| `clase` | String | Sí | Clase base de Path of Exile. |
| `ascendencia` | String | Sí | Ascendencia de la build. |
| `descripcion` | String | Sí | Descripción de la build. |
| `ventajas` | String | Sí | Lista de ventajas, una por línea. |
| `desventajas` | String | Sí | Lista de desventajas, una por línea. |
| `imagen` | String | No | Nombre de archivo o URL según `imagen_mime`. |
| `imagen_mime` | String | No | MIME de la imagen; `image/uri` indica que `imagen` es una URL completa. |
| `valoraciones` | Objeto | Sí | Seis puntuaciones numéricas. |
| `versiones` | Array | No | Enlaces a versiones de Path of Building. |
| `items_mandatory` | Array | No | Items con `description` e `img`. |
| `fecha_creacion` | Date | No | Fecha asignada por el backend al crear. |

`valoraciones` contiene `boss_dmg`, `comfort`, `difficulty`, `fun`, `map_speed_clear` y `survivality`.

### `users`

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `nombre` | String | Nombre público. |
| `email` | String único | Email de acceso. |
| `password` | String | Contraseña. Ver las limitaciones de seguridad. |
| `cuenta_poe` | String | Cuenta opcional de Path of Exile. |
| `rol` | String | `User`, `Pro` o `Admin`; por defecto `User`. |
| `fecha_creacion` | Date | Fecha de registro. |

## Imágenes

Las imágenes de builds se gestionan así:

1. `POST /upload` guarda el archivo en `frontend/src/assets/images/` durante el desarrollo local.
2. El backend expone esa carpeta mediante `/images`.
3. El frontend genera URLs con `<apiBaseUrl>/images/<nombre-de-archivo>`.
4. Si `imagen_mime` es `image/uri`, el frontend usa directamente la URL guardada en `imagen`.

Los fondos por clase están en `frontend/src/assets/images/bg/` y las imágenes estáticas se publican por Angular bajo `/assets`.

## Frontend y caché

`BuildService` mantiene una caché en memoria de la sesión actual:

- TTL de cinco minutos para `GET /poem/all`.
- La caché se usa inmediatamente al volver a Galería o Mis Builds.
- Una caché caducada se muestra mientras se solicita una actualización en segundo plano.
- Si la actualización falla, se conserva la última versión disponible y la interfaz informa de ello.
- Crear, editar o borrar una build actualiza la caché local cuando el backend confirma la operación.

La caché no se persiste al recargar completamente la página, abrir una pestaña nueva o cerrar el navegador. En esos casos se realiza una nueva solicitud y, si Render está dormido, la galería muestra feedback progresivo al usuario.

## Despliegue

### Backend en Render

1. Crea un **Web Service** conectado a este repositorio.
2. Usa la raíz del repositorio como directorio base.
3. Configura el comando de build como `npm install`.
4. Configura el comando de inicio como `npm start`.
5. Añade `MONGODB_URI` como variable de entorno secreta.
6. Añade `CORS_ORIGIN` con la URL final de Cloudflare Pages, por ejemplo `https://poe-museum.pages.dev`.
7. No definas `PORT`: Render lo proporciona al proceso.

En el plan gratuito Render puede detener el servicio por inactividad. La primera petición posterior puede tardar varios segundos; la SPA ya muestra mensajes de conexión y de activación del servidor para este caso.

### Frontend en Cloudflare Pages

1. Crea un proyecto de **Cloudflare Pages** conectado al repositorio.
2. Define `frontend` como directorio raíz de build.
3. Usa `npm install && npm run build` como comando de build.
4. Publica `dist/frontend/browser`.
5. Comprueba que `frontend/src/environments/environment.prod.ts` contiene la URL HTTPS pública de Render.
6. Configura una regla de SPA para que rutas como `/build/:id`, `/login` o `/profile` devuelvan `index.html` en lugar de un 404.

Después de cambiar la URL de Cloudflare, actualiza `CORS_ORIGIN` en Render. Después de cambiar la URL de Render, actualiza `environment.prod.ts` y vuelve a desplegar Cloudflare Pages.

## Limitaciones de seguridad

El proyecto funciona como prototipo, pero estos puntos deben resolverse antes de manejar cuentas reales o datos sensibles:

- Las contraseñas se almacenan y comparan en texto plano en `routes/auth.js`. Deben hashearse con `bcrypt` o `argon2` antes de cualquier uso público.
- No existe emisión ni validación de tokens de sesión (JWT o cookie segura). La autorización actual del frontend no sustituye la autorización del backend.
- Las rutas `POST`, `PUT` y `DELETE /poem` no comprueban en el backend que quien las invoca sea el autor de la build.
- La carpeta de archivos de Render es efímera en el plan gratuito. Las imágenes subidas mediante `/upload` pueden desaparecer al reiniciar o redesplegar. Para producción se debe usar almacenamiento persistente de objetos, como Cloudflare R2, Cloudinary o S3.
- El proxy de PoE Wiki debería incorporar caché, validación de parámetros y límites de uso antes de recibir tráfico elevado.

## Estructura

```text
poe_museum/
├── config/
│   └── db.js                 # Conexión a MongoDB
├── models/
│   ├── Build.js              # Schema de builds
│   └── User.js               # Schema de usuarios
├── routes/
│   ├── auth.js               # Registro, login y usuarios
│   └── poem.js               # CRUD de builds y PoE Wiki
├── frontend/
│   ├── src/app/              # Componentes, rutas y servicios Angular
│   ├── src/assets/           # Logo, imágenes y fondos por clase
│   ├── src/environments/     # Endpoints para desarrollo/producción
│   └── angular.json          # Configuración de build Angular
├── index.js                  # Servidor Express y middleware global
├── package.json              # Dependencias y scripts del backend
└── README.md                 # Esta documentación
```

## Licencia y créditos

Path of Exile es propiedad de Grinding Gear Games. PoE Museum es un proyecto comunitario no oficial.
