# Guia de Integracion: Modulo de Predios y Medidores (Multi-Medidor)

## Resumen

Se introdujeron las entidades **predio** (inmueble) y **medidor** como tablas independientes, separandolas del contrato. Antes, direccion, GPS y numero de medidor estaban en linea dentro de `contrato`. Ahora el contrato referencia un predio y un medidor por su ID, lo que permite que un mismo predio tenga multiples medidores y que la ubicacion se gestione de forma independiente.

---

## Modelo de Datos

### Tabla `predio`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | UUID PK | Identificador unico |
| `distritoId` | UUID FK → `distrito.id` | Zona de cobertura |
| `direccion` | text | Direccion del inmueble |
| `latitud` | decimal(10,7) | Coordenada GPS |
| `longitud` | decimal(10,7) | Coordenada GPS |
| `createdAt` | timestamp | Fecha de creacion |

### Tabla `medidor`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | UUID PK | Identificador unico |
| `nroMedidor` | text UNIQUE | Numero del medidor |
| `contratoId` | UUID FK → `contrato.id` | Contrato vinculado |
| `createdAt` | timestamp | Fecha de creacion |

### Cambios en `contrato`

| Campo eliminado | Nuevo campo | Nota |
|-----------------|-------------|------|
| `distritoId` | — | Se accede via `predio.distritoId` |
| `direccion` | — | Ahora en `predio.direccion` |
| `nroMedidor` | — | Ahora en tabla `medidor` |
| `latitud` | — | Ahora en `predio.latitud` |
| `longitud` | — | Ahora en `predio.longitud` |
| — | `predioId` | FK → `predio.id` |
| — | `medidorId` | FK → `medidor.id` |

### Relaciones

```
distrito ←── predio ←── contrato ──→ medidor
                     ──→ usuario
```

- Un predio puede tener multiples contratos (edificios con multiples unidades).
- Un contrato tiene exactamente un medidor.
- Un medidor pertenece a exactamente un contrato (relacion 1:1).
- El propietario del servicio se determina por `contrato.usuarioId`.

---

## Flujo de Trabajo Completo

### 1. Crear un predio

```
POST /api/predios
Authorization: Cookie de sesion del admin
```

```json
{
  "distritoId": "uuid-del-distrito",
  "direccion": "Calle Sucre #123",
  "latitud": "-19.0461000",
  "longitud": "-65.2595000"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-predio",
    "distritoId": "uuid-del-distrito",
    "direccion": "Calle Sucre #123",
    "latitud": "-19.0461000",
    "longitud": "-65.2595000",
    "createdAt": "2026-05-06T10:00:00.000Z"
  }
}
```

### 2. Crear un contrato con medidor

```
POST /api/contratos
Authorization: Cookie de sesion del admin
```

```json
{
  "nroContrato": "CNT-001",
  "usuarioId": "uuid-del-ciudadano",
  "predioId": "uuid-del-predio",
  "medidorId": "uuid-del-medidor"
}
```

**Nota:** El medidor debe crearse despues del contrato (tiene FK `contratoId`). En la practica, el admin crea el contrato y luego el medidor, o se usa una transaccion con triggers deshabilitados (como hace el seed).

### 3. Listar predios con filtro por distrito

```
GET /api/predios?distritoId=uuid-distrito&page=1&limit=20
Authorization: Cookie de sesion del admin
```

### 4. Consultar contrato con datos del predio y medidor

```
GET /api/contratos/:id
Authorization: Cookie de sesion (admin, brigadista, ciudadano duenho)
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "contrato": {
      "id": "uuid-contrato",
      "nroContrato": "CNT-001",
      "usuarioId": "uuid-usuario",
      "predioId": "uuid-predio",
      "medidorId": "uuid-medidor",
      "estado": "activo",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "predio": {
      "id": "uuid-predio",
      "distritoId": "uuid-distrito",
      "direccion": "Calle Sucre #123",
      "latitud": "-19.0461000",
      "longitud": "-65.2595000",
      "createdAt": "..."
    },
    "medidor": {
      "id": "uuid-medidor",
      "nroMedidor": "MED-0001",
      "contratoId": "uuid-contrato",
      "createdAt": "..."
    }
  }
}
```

### 5. Eliminar predio (con proteccion)

```
DELETE /api/predios/:id
Authorization: Cookie de sesion del admin
```

- Si el predio tiene contratos asociados, retorna **400 Bad Request**:
  ```json
  {
    "success": false,
    "error": {
      "statusCode": 400,
      "message": "No se puede eliminar el predio porque tiene contratos asociados"
    }
  }
  ```

### 6. Eliminar medidor (con proteccion)

```
DELETE /api/medidores/:id
Authorization: Cookie de sesion del admin
```

- Si el medidor esta referenciado por un contrato, retorna **400 Bad Request**:
  ```json
  {
    "success": false,
    "error": {
      "statusCode": 400,
      "message": "No se puede eliminar el medidor porque tiene un contrato asociado"
    }
  }
  ```

---

## Endpoints del Modulo

### Predios (Admin)

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/predios` | Listar predios (filtrable por `distritoId`, paginado) |
| `GET` | `/api/predios/:id` | Detalle de un predio |
| `POST` | `/api/predios` | Crear predio |
| `PUT` | `/api/predios/:id` | Actualizar predio |
| `DELETE` | `/api/predios/:id` | Eliminar predio (solo sin contratos) |

### Medidores (Admin)

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/medidores` | Listar medidores (paginado) |
| `GET` | `/api/medidores/:id` | Detalle de un medidor |
| `POST` | `/api/medidores` | Crear medidor |
| `PUT` | `/api/medidores/:id` | Actualizar medidor (nroMedidor) |
| `DELETE` | `/api/medidores/:id` | Eliminar medidor (solo sin contrato) |

### Contratos (afectados)

| Metodo | Endpoint | Cambio |
|--------|----------|--------|
| `GET` | `/api/contratos` | Ahora incluye `predio` y `medidor` en la respuesta |
| `GET` | `/api/contratos/:id` | Ahora incluye `predio` y `medidor` en la respuesta |
| `GET` | `/api/contratos/mis-contratos` | Ahora incluye `predio` y `medidor` en la respuesta |
| `POST` | `/api/contratos` | Recibe `predioId` + `medidorId` en lugar de campos inline |

### Otros endpoints afectados

| Metodo | Endpoint | Cambio |
|--------|----------|--------|
| `GET` | `/api/lecturas/mi-ruta` | Incluye `predio` y `medidor` ademas de `distrito` |
| `GET` | `/api/cortes` | Filtra por distrito via `contrato → predio → distrito` |
| `GET` | `/api/reportes/recaudacion-por-distrito` | Join via `contrato → predio → distrito` |
| `GET` | `/api/reportes/cortes-por-distrito` | Join via `contrato → predio → distrito` |

---

## Reglas de Autorizacion

| Rol | Predios | Medidores | Contratos |
|-----|---------|-----------|-----------|
| `admin` | CRUD completo | CRUD completo | CRUD completo |
| `brigadista` | — | — | Listar, ver detalle |
| `ciudadano` | — | — | Solo `mis-contratos` |

---

## Ejemplo de Integracion en Frontend (React / React Native)

### Paso 1: Login como admin

```typescript
const response = await fetch('http://localhost:3000/api/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'admin@elapas.com', password: 'password123' }),
});
```

### Paso 2: Crear un predio

```typescript
const predioRes = await fetch('http://localhost:3000/api/predios', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    distritoId: 'uuid-distrito',
    direccion: 'Av. Grau #456',
    latitud: '-19.0350000',
    longitud: '-65.2480000',
  }),
});
const { data: predio } = await predioRes.json();
```

### Paso 3: Crear contrato y medidor

```typescript
// Crear contrato (el medidorId se genera previamente)
const medidorId = crypto.randomUUID();

const contratoRes = await fetch('http://localhost:3000/api/contratos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    nroContrato: 'CNT-011',
    usuarioId: 'uuid-ciudadano',
    predioId: predio.id,
    medidorId: medidorId,
  }),
});
const { data: contrato } = await contratoRes.json();

// Crear medidor vinculado al contrato
const medidorRes = await fetch('http://localhost:3000/api/medidores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    nroMedidor: 'MED-0011',
    contratoId: contrato.id,
  }),
});
```

### Paso 4: Ciudadano consulta sus contratos

```typescript
const res = await fetch('http://localhost:3000/api/contratos/mis-contratos', {
  credentials: 'include',
});
const { data } = await res.json();

// Cada item tiene:
// - contrato (con predioId y medidorId)
// - predio (direccion, latitud, longitud, distritoId)
// - medidor (nroMedidor)
```

### Paso 5: Brigadista ve su ruta con predio y medidor

```typescript
const res = await fetch('http://localhost:3000/api/lecturas/mi-ruta', {
  credentials: 'include',
});
const { data } = await res.json();

// Cada item tiene:
// - contrato
// - distrito
// - predio (direccion, GPS)
// - medidor (nroMedidor)
// - estadoLectura ("pendiente" | "leido")
// - ultimaLectura (numero | null)
```

---

## Cambios para Desarrolladores Existentes

### Si consumias `GET /api/contratos` antes

Antes:
```json
{
  "nroContrato": "CNT-001",
  "direccion": "Calle Sucre #123",
  "nroMedidor": "MED-0001",
  "distritoId": "uuid-distrito"
}
```

Ahora:
```json
{
  "contrato": {
    "nroContrato": "CNT-001",
    "predioId": "uuid-predio",
    "medidorId": "uuid-medidor"
  },
  "predio": {
    "direccion": "Calle Sucre #123",
    "distritoId": "uuid-distrito",
    "latitud": "-19.0461000",
    "longitud": "-65.2595000"
  },
  "medidor": {
    "nroMedidor": "MED-0001"
  }
}
```

**Breaking changes:**
- La respuesta de contratos ahora es un objeto anidado (`contrato`, `predio`, `medidor`) en lugar de campos planos.
- `POST /api/contratos` ya no acepta `direccion`, `nroMedidor`, `latitud`, `longitud`, `distritoId`. Ahora requiere `predioId` y `medidorId`.
- `PUT /api/contratos/:id` permite cambiar `predioId` y `medidorId` pero no campos inline.

### Migracion de datos existentes

Si tienes datos en produccion, necesitas:
1. Crear predios a partir de los campos `distritoId`, `direccion`, `latitud`, `longitud` de cada contrato.
2. Crear medidores a partir del campo `nroMedidor` de cada contrato.
3. Actualizar cada contrato con los nuevos `predioId` y `medidorId`.
4. Eliminar las columnas obsoletas de la tabla contrato.

El seed ya refleja el nuevo modelo (`pnpm seed`).

---

## Notas para el Desarrollador

1. **Todas las peticiones** (excepto auth) requieren la cookie de sesion (`credentials: 'include'` en fetch, o `withCredentials: true` en axios).

2. **El predio no tiene duenho** — la propiedad se determina a traves del contrato (`contrato.usuarioId`). Un mismo predio puede tener multiples contratos con diferentes usuarios (ej. edificio con multiples departamentos).

3. **Referencia circular FK:** `contrato.medidorId` → `medidor.id` y `medidor.contratoId` → `contrato.id`. El seed usa `DISABLE TRIGGER ALL` para resolver la insercion circular.

4. **Swagger docs** disponibles en `GET /docs` con la documentacion completa de todos los endpoints.
