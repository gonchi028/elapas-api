# Guia de Integracion: Modulo de Asignaciones de Ruta

## Resumen

El modulo de Asignaciones permite a los administradores asignar contratos especificos a brigadistas. Los brigadistas pueden ver su "ruta del dia" con el estado de lectura de cada contrato (`pendiente`/`leido`) y solo pueden registrar lecturas y cortes en los contratos que tienen asignados.

---

## Modelo de Datos

### Tabla `asignacion`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | UUID PK | Identificador unico |
| `brigadistaId` | UUID FK → `user.id` | Brigadista asignado |
| `contratoId` | UUID FK → `contrato.id` | Contrato asignado |
| `createdAt` | timestamp | Fecha de asignacion |

**Restriccion unica:** `UNIQUE(brigadistaId, contratoId)` — un contrato no puede estar asignado dos veces al mismo brigadista.

---

## Flujo de Trabajo Completo

### 1. El administrador asigna contratos a brigadistas

```
POST /api/asignaciones
```

```json
{
  "brigadistaId": "uuid-del-brigadista",
  "contratoIds": ["uuid-contrato-1", "uuid-contrato-2", "uuid-contrato-3"]
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-asignacion",
      "brigadistaId": "uuid-del-brigadista",
      "contratoId": "uuid-contrato-1",
      "createdAt": "2026-05-06T10:00:00.000Z"
    },
    ...
  ]
}
```

- Se omiten automaticamente los duplicados (asignaciones que ya existen).
- Se omiten los contratos que no existen en la base de datos.
- Se valida que el `brigadistaId` corresponda a un usuario con rol `brigadista`.

### 2. El brigadista consulta su ruta del dia

```
GET /api/lecturas/mi-ruta
Authorization: Cookie de sesion del brigadista
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "contrato": {
        "id": "uuid-contrato",
        "nroContrato": "CNT-001",
        "direccion": "Calle Sucre #123",
        "nroMedidor": "MED-0001",
        "latitud": "-19.0461000",
        "longitud": "-65.2595000",
        "estado": "activo"
      },
      "distrito": {
        "id": "uuid-distrito",
        "nombre": "Distrito 1 - Central",
        "codigo": "D1"
      },
      "estadoLectura": "pendiente",
      "ultimaLectura": 1213
    },
    ...
  ]
}
```

**Campos clave:**
- `estadoLectura`: `"pendiente"` o `"leido"` — indica si ya existe una lectura para el periodo actual (mes en curso).
- `ultimaLectura`: el valor de la ultima lectura registrada en ese contrato (util como referencia para el brigadista). Puede ser `null` si nunca se ha leido.

### 3. El brigadista registra una lectura

```
POST /api/lecturas
Authorization: Cookie de sesion del brigadista
```

```json
{
  "contratoId": "uuid-contrato-asignado",
  "valorLectura": 1250,
  "fotoUrl": "https://...",
  "latitud": "-19.0462000",
  "longitud": "-65.2596000"
}
```

- El `brigadistaId` se toma automaticamente de la sesion (`req.user.id`).
- **Si el contrato NO esta asignado al brigadista**, retorna **403 Forbidden**:
  ```json
  {
    "success": false,
    "error": {
      "statusCode": 403,
      "message": "No tienes permiso para registrar lecturas en este contrato. El contrato no esta asignado a tu ruta."
    }
  }
  ```

### 4. El brigadista registra un corte de servicio

```
POST /api/cortes
Authorization: Cookie de sesion del brigadista
```

```json
{
  "contratoId": "uuid-contrato-asignado",
  "motivo": "Morosidad - 3 meses sin pago",
  "fotoUrl": "https://...",
  "latitud": "-19.0462000",
  "longitud": "-65.2596000"
}
```

- Misma validacion de asignacion que las lecturas. Solo se pueden registrar cortes en contratos asignados.
- Al registrar un corte, el estado del contrato cambia automaticamente a `"cortado"`.

### 5. El administrador puede reasignar rutas

**Reemplazar todas las asignaciones de un brigadista:**
```
PUT /api/asignaciones/:brigadistaId
Authorization: Cookie de sesion del admin
```

```json
{
  "contratoIds": ["uuid-nuevo-1", "uuid-nuevo-2"]
}
```

Esto elimina todas las asignaciones previas del brigadista y crea las nuevas en una sola transaccion.

**Eliminar una asignacion individual:**
```
DELETE /api/asignaciones/:id
Authorization: Cookie de sesion del admin
```

---

## Endpoints del Modulo

### Asignaciones (Admin)

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/asignaciones` | Listar todas las asignaciones (paginado, filtrable por `brigadistaId`) |
| `GET` | `/api/asignaciones/brigadista/:brigadistaId` | Contratos asignados a un brigadista especifico |
| `POST` | `/api/asignaciones` | Asignar contratos a un brigadista (array de IDs, omite duplicados) |
| `PUT` | `/api/asignaciones/:brigadistaId` | Reemplazar todas las asignaciones de un brigadista |
| `DELETE` | `/api/asignaciones/:id` | Eliminar una asignacion individual |

### Ruta del dia (Brigadista)

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/lecturas/mi-ruta` | Contratos asignados con estado pendiente/leido y ultima lectura |

### Lecturas y Cortes (Brigadista, con scoping)

| Metodo | Endpoint | Scoping |
|--------|----------|---------|
| `POST` | `/api/lecturas` | Solo contratos asignados (403 si no asignado) |
| `POST` | `/api/cortes` | Solo contratos asignados (403 si no asignado) |

---

## Reglas de Autorizacion

| Rol | Asignaciones | Ruta del dia | Lecturas | Cortes |
|-----|-------------|-------------|----------|--------|
| `admin` | CRUD completo | — | Listar todas | Listar todos |
| `brigadista` | — | Ver su ruta | Crear (solo asignados), ver detalle | Crear (solo asignados) |
| `ciudadano` | — | — | — | — |

---

## Ejemplo de Integracion en Frontend (React / React Native)

### Paso 1: Login

```typescript
const response = await fetch('http://localhost:3000/api/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'brigadista1@elapas.com', password: 'password123' }),
});
```

### Paso 2: Obtener ruta del dia

```typescript
const response = await fetch('http://localhost:3000/api/lecturas/mi-ruta', {
  credentials: 'include',
});
const { data } = await response.json();

// data es un array de objetos con:
// - contrato (datos del contrato)
// - distrito (datos del distrito)
// - estadoLectura ("pendiente" | "leido")
// - ultimaLectura (numero | null)
```

### Paso 3: Registrar lectura

```typescript
const response = await fetch('http://localhost:3000/api/lecturas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    contratoId: contrato.id,
    valorLectura: 1250,
    latitud: '-19.0462000',
    longitud: '-65.2596000',
  }),
});

if (!response.ok) {
  // Si es 403, el contrato no esta asignado
  const error = await response.json();
  console.error(error.error.message);
}
```

### Paso 4: Administrador asigna contratos

```typescript
const response = await fetch('http://localhost:3000/api/asignaciones', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    brigadistaId: 'uuid-brigadista',
    contratoIds: ['uuid-contrato-1', 'uuid-contrato-2'],
  }),
});
```

---

## Notas para el Desarrollador

1. **Todas las peticiones** (excepto auth) requieren la cookie de sesion (`credentials: 'include'` en fetch, o `withCredentials: true` en axios).

2. **El campo `estadoLectura`** en la ruta del dia se calcula comparando si existe una lectura en el mes actual (formato `YYYY-MM`). Cambia automaticamente al iniciar un nuevo mes.

3. **Las asignaciones son estaticas** — persisten hasta que el admin las modifique. No hay expiracion ni rotacion automatica.

4. **El endpoint `GET /api/lecturas/ruta/:brigadistaId`** esta deprecado. Usar `GET /api/lecturas/mi-ruta` en su lugar.

5. **Swagger docs** disponibles en `GET /docs` con la documentacion completa de todos los endpoints.
