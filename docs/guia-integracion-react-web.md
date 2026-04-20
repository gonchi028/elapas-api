# Guía de Integración — React Web

> Guía para conectar una aplicación web construida con **React** (o Next.js) a la API de ELAPAS.

---

## 1. Configuración Base

### 1.1 URL de la API

La API está disponible en:

```
Desarrollo: http://localhost:3000/api
Producción: https://<tu-dominio>/api
```

Todos los endpoints tienen el prefijo `/api/`. La documentación Swagger está en `/docs`.

### 1.2 Variables de Entorno

Crear un archivo `.env` en el proyecto React:

```env
VITE_API_URL=http://localhost:3000/api
```

> Si usas Next.js, el prefijo es `NEXT_PUBLIC_API_URL`.

### 1.3 Cliente HTTP

Instalar `axios`:

```bash
npm install axios
```

Crear el cliente en `src/lib/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

> **Importante:** La API usa autenticación basada en sesiones (cookies). Es obligatorio usar `withCredentials: true` para que las cookies de sesión se envíen con cada request.

---

## 2. Autenticación

### 2.1 Registro

```typescript
import api from '@/lib/api';

async function registrar(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await api.post('/auth/sign-up/email', data);
  return response.data;
}
```

**Request:**

```json
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "12345678"
}
```

**Response:**

```json
{
  "token": "abc123...",
  "user": {
    "id": "uuid",
    "name": "Juan Pérez",
    "email": "juan@email.com"
  }
}
```

### 2.2 Inicio de Sesión

```typescript
async function login(email: string, password: string) {
  const response = await api.post('/auth/sign-in/email', {
    email,
    password,
  });
  return response.data;
}
```

### 2.3 Cerrar Sesión

```typescript
async function logout() {
  await api.post('/auth/sign-out');
}
```

> El endpoint `sign-out` requiere el header `Origin`. Axios lo envía automáticamente en peticiones desde el navegador.

### 2.4 Obtener Sesión Actual

```typescript
async function getSession() {
  const response = await api.get('/auth/get-session');
  return response.data;
}
```

### 2.5 Hook de Autenticación

```tsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'brigadista' | 'ciudadano';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/get-session')
      .then((res) => setUser(res.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const loginFn = async (email: string, password: string) => {
    const res = await api.post('/auth/sign-in/email', { email, password });
    setUser(res.data.user);
  };

  const logoutFn = async () => {
    await api.post('/auth/sign-out');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginFn, logout: logoutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 2.6 Rutas Protegidas

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
}

// Uso:
<Route
  path="/admin/usuarios"
  element={
    <ProtectedRoute roles={['admin']}>
      <UsuariosPage />
    </ProtectedRoute>
  }
/>;
```

---

## 3. Consumo de Endpoints

### 3.1 Formato de Respuesta

Todas las respuestas exitosas siguen este formato:

```json
{
  "success": true,
  "data": {}
}
```

Las respuestas paginadas incluyen:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

Los errores:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Descripción del error"
  }
}
```

### 3.2 Helper para Paginación

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

async function getPaginated<T>(
  url: string,
  page: number = 1,
  limit: number = 20,
) {
  const response = await api.get<PaginatedResponse<T>>(url, {
    params: { page, limit },
  });
  return response.data;
}
```

### 3.3 Ejemplos por Módulo

#### Usuarios (solo admin)

```typescript
const listarUsuarios = (page = 1) =>
  api.get('/usuarios', { params: { page, limit: 20 } });

const obtenerUsuario = (id: string) => api.get(`/usuarios/${id}`);

const crearUsuario = (data: {
  nombre: string;
  email: string;
  password: string;
  role: string;
}) => api.post('/usuarios', data);

const actualizarUsuario = (
  id: string,
  data: { nombre?: string; email?: string; role?: string; estado?: boolean },
) => api.put(`/usuarios/${id}`, data);

const eliminarUsuario = (id: string) => api.delete(`/usuarios/${id}`);
```

#### Distritos (solo admin)

```typescript
const listarDistritos = () => api.get('/distritos');

const crearDistrito = (data: { nombre: string; codigo: string }) =>
  api.post('/distritos', data);
```

#### Contratos

```typescript
// Admin / Brigadista — listar con filtros
const listarContratos = (filtros?: {
  distritoId?: string;
  estado?: string;
  page?: number;
}) => api.get('/contratos', { params: filtros });

// Ciudadano — mis contratos
const misContratos = () => api.get('/contratos/mis-contratos');

// Todos los roles — detalle
const obtenerContrato = (id: string) => api.get(`/contratos/${id}`);
```

#### Tarifas

```typescript
// Admin / Brigadista
const listarTarifas = () => api.get('/tarifas');

// Admin
const crearTarifa = (data: {
  nombre: string;
  tramoMin: number;
  tramoMax: number;
  precioM3: string;
  cargoFijo: string;
}) => api.post('/tarifas', data);
```

#### Lecturas

```typescript
// Admin — listar con filtros
const listarLecturas = (filtros?: {
  fechaInicio?: string;
  fechaFin?: string;
  brigadistaId?: string;
  page?: number;
}) => api.get('/lecturas', { params: filtros });

// Brigadista — su ruta
const lecturasRuta = (brigadistaId: string) =>
  api.get(`/lecturas/ruta/${brigadistaId}`);

// Brigadista — registrar lectura
const registrarLectura = (data: {
  contratoId: string;
  valorLectura: number;
  fotoUrl?: string;
  latitud?: string;
  longitud?: string;
}) => api.post('/lecturas', data);
```

#### Facturas

```typescript
// Admin — listar con filtros
const listarFacturas = (filtros?: {
  estado?: string;
  periodo?: string;
  page?: number;
}) => api.get('/facturas', { params: filtros });

// Ciudadano — mis facturas
const misFacturas = () => api.get('/facturas/mis-facturas');

// Admin — generar facturas masivamente
const generarFacturas = (data: {
  periodo: string;
  fechaVencimiento: string;
}) => api.post('/facturas/generar', data);
```

#### Pagos

```typescript
// Ciudadano — generar QR
const generarQR = (facturaId: string) =>
  api.post(`/pagos/qr/${facturaId}`);

// Ciudadano / Admin — confirmar pago
const confirmarPago = (data: {
  facturaId: string;
  monto: string;
  metodoPago?: string;
  referencia?: string;
}) => api.post('/pagos/confirmar', data);

// Ciudadano — mis pagos
const misPagos = () => api.get('/pagos/mis-pagos');

// Admin — listar todos
const listarPagos = (page = 1) =>
  api.get('/pagos', { params: { page, limit: 10 } });
```

#### Cortes

```typescript
// Brigadista — registrar corte
const registrarCorte = (data: {
  contratoId: string;
  motivo: string;
  fotoUrl?: string;
  latitud?: string;
  longitud?: string;
}) => api.post('/cortes', data);

// Admin — listar con filtros
const listarCortes = (filtros?: {
  distritoId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
}) => api.get('/cortes', { params: filtros });
```

#### Reportes (solo admin)

```typescript
const resumenDiario = () => api.get('/reportes/resumen-diario');

const recaudacionPorDistrito = () =>
  api.get('/reportes/recaudacion-por-distrito');

const cortesPorDistrito = () => api.get('/reportes/cortes-por-distrito');

const lecturasPorBrigadista = (fechaInicio?: string, fechaFin?: string) =>
  api.get('/reportes/lecturas-por-brigadista', {
    params: { fechaInicio, fechaFin },
  });
```

---

## 4. Manejo de Errores

### 4.1 Interceptor Global

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ?? 'Error de conexión';
    const status = error.response?.status;

    switch (status) {
      case 401:
        // Sesión expirada
        window.location.href = '/login';
        break;
      case 403:
        console.error('Sin permisos suficientes');
        break;
      case 404:
        console.error('Recurso no encontrado');
        break;
      default:
        console.error(message);
    }

    return Promise.reject(error);
  },
);
```

### 4.2 Manejo en Componentes

```tsx
async function handleSubmit() {
  try {
    const res = await api.post('/contratos', formData);
    toast.success('Contrato creado exitosamente');
  } catch (error: any) {
    const msg = error.response?.data?.error?.message ?? 'Error inesperado';
    toast.error(msg);
  }
}
```

---

## 5. CORS

La API tiene CORS habilitado (`app.enableCors()`). En desarrollo, el origen `http://localhost:5173` (Vite) o `http://localhost:3001` (Next.js) es aceptado automáticamente.

Si se requiere restringir orígenes en producción, configurar el servidor:

```typescript
app.enableCors({
  origin: ['https://tudominio.com'],
  credentials: true,
});
```

---

## 6. Resumen de Roles y Vistas

| Rol | Vistas principales |
|---|---|
| **admin** | Dashboard, usuarios, distritos, contratos, tarifas, facturas, pagos, cortes, reportes |
| **brigadista** | Ruta de lecturas, registrar lecturas, registrar cortes |
| **ciudadano** | Mis contratos, mis facturas, pagar (QR), mis pagos |

---

## 7. Notas Importantes

1. **Sesiones por cookies** — La autenticación no usa tokens JWT en headers. Better Auth gestiona la sesión mediante cookies que se envían automáticamente con `withCredentials: true`.
2. **Validación** — La API usa `ValidationPipe` con `whitelist: true`. Cualquier campo extra en el body será rechazado con error 400.
3. **Prefijo global** — Todas las rutas (excepto `/` health check) empiezan con `/api/`.
4. **Fechas** — Los campos de fecha usan formato ISO 8601 (`2026-04-19T00:00:00.000Z`).
5. **Paginación** — Los endpoints de listado aceptan `page` y `limit` como query params.
