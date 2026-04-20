# Guía de Integración — React Native

> Guía para conectar una aplicación móvil construida con **React Native** (Expo o CLI) a la API de ELAPAS.

---

## 1. Configuración Base

### 1.1 URL de la API

```
Desarrollo: http://localhost:3000/api
Producción: https://<tu-dominio>/api
```

> **Nota en desarrollo:** Si usas un dispositivo físico, reemplaza `localhost` por la IP local de tu computadora (ej: `http://192.168.1.100:3000/api`). Si usas un emulador Android, usa `http://10.0.2.2:3000/api`. En iOS Simulator, `localhost` funciona directamente.

### 1.2 Variables de Entorno

Con Expo, crear un archivo `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
```

> Con React Native CLI (react-native-dotenv o react-native-config):

```env
API_URL=http://192.168.1.100:3000/api
```

### 1.3 Cliente HTTP

Instalar `axios`:

```bash
npm install axios
```

Crear el cliente en `src/lib/api.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('session_token');
  if (token) {
    config.headers.Cookie = `better-auth.session_token=${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem('session_token');
    }
    return Promise.reject(error);
  },
);

export default api;
```

> **Importante:** React Native no maneja cookies automáticamente como el navegador. Es necesario guardar el token de sesión manualmente usando `AsyncStorage` y enviarlo en cada request mediante el header `Cookie`.

---

## 2. Autenticación

### 2.1 Flujo de Sesión en React Native

A diferencia de una web app, en React Native:

1. Al registrarse o iniciar sesión, la API devuelve un objeto `{ token, user }`.
2. El `token` debe guardarse en `AsyncStorage`.
3. En cada petición posterior, se envía el token mediante el header `Cookie`.
4. Para cerrar sesión, se elimina el token de `AsyncStorage`.

### 2.2 Registro

```typescript
import api from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function registrar(data: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await api.post('/auth/sign-up/email', data);
  const { token, user } = response.data;

  await AsyncStorage.setItem('session_token', token);
  await AsyncStorage.setItem('user_data', JSON.stringify(user));

  return user;
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
    "email": "juan@email.com",
    "role": "ciudadano"
  }
}
```

### 2.3 Inicio de Sesión

```typescript
async function login(email: string, password: string) {
  const response = await api.post('/auth/sign-in/email', {
    email,
    password,
  });
  const { token, user } = response.data;

  await AsyncStorage.setItem('session_token', token);
  await AsyncStorage.setItem('user_data', JSON.stringify(user));

  return user;
}
```

### 2.4 Cerrar Sesión

```typescript
async function logout() {
  try {
    await api.post('/auth/sign-out');
  } finally {
    await AsyncStorage.multiRemove(['session_token', 'user_data']);
  }
}
```

### 2.5 Verificar Sesión al Abrir la App

```typescript
async function checkSession() {
  const token = await AsyncStorage.getItem('session_token');
  if (!token) return null;

  try {
    const response = await api.get('/auth/get-session');
    return response.data?.user ?? null;
  } catch {
    await AsyncStorage.multiRemove(['session_token', 'user_data']);
    return null;
  }
}
```

### 2.6 Contexto de Autenticación

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    (async () => {
      const stored = await AsyncStorage.getItem('user_data');
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setLoading(false);
    })();
  }, []);

  const loginFn = async (email: string, password: string) => {
    const res = await api.post('/auth/sign-in/email', { email, password });
    const { token, user: userData } = res.data;
    await AsyncStorage.setItem('session_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logoutFn = async () => {
    await api.post('/auth/sign-out');
    await AsyncStorage.multiRemove(['session_token', 'user_data']);
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

---

## 3. Consumo de Endpoints

### 3.1 Formato de Respuesta

Todas las respuestas exitosas:

```json
{
  "success": true,
  "data": {}
}
```

Respuestas paginadas:

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

Errores:

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

#### Contratos (Ciudadano — App Móvil)

```typescript
// Obtener mis contratos
const misContratos = () => api.get('/contratos/mis-contratos');

// Detalle de un contrato
const obtenerContrato = (id: string) => api.get(`/contratos/${id}`);
```

#### Lecturas (Brigadista — App Móvil)

```typescript
// Obtener lecturas de mi ruta
const lecturasRuta = (brigadistaId: string) =>
  api.get(`/lecturas/ruta/${brigadistaId}`);

// Registrar una nueva lectura
const registrarLectura = (data: {
  contratoId: string;
  valorLectura: number;
  fotoUrl?: string;
  latitud?: string;
  longitud?: string;
}) => api.post('/lecturas', data);
```

#### Facturas (Ciudadano — App Móvil)

```typescript
// Obtener mis facturas
const misFacturas = () => api.get('/facturas/mis-facturas');

// Detalle de una factura
const obtenerFactura = (id: string) => api.get(`/facturas/${id}`);
```

#### Pagos (Ciudadano — App Móvil)

```typescript
// Generar código QR para pago
const generarQR = (facturaId: string) =>
  api.post(`/pagos/qr/${facturaId}`);

// Confirmar un pago
const confirmarPago = (data: {
  facturaId: string;
  monto: string;
  metodoPago?: string;
  referencia?: string;
}) => api.post('/pagos/confirmar', data);

// Ver mi historial de pagos
const misPagos = () => api.get('/pagos/mis-pagos');
```

#### Cortes (Brigadista — App Móvil)

```typescript
// Registrar un corte de servicio
const registrarCorte = (data: {
  contratoId: string;
  motivo: string;
  fotoUrl?: string;
  latitud?: string;
  longitud?: string;
}) => api.post('/cortes', data);
```

---

## 4. Manejo de Errores

### 4.1 Interceptor Global

```typescript
import { Alert } from 'react-native';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ?? 'Error de conexión con el servidor';
    const status = error.response?.status;

    if (status === 401) {
      AsyncStorage.multiRemove(['session_token', 'user_data']);
      Alert.alert('Sesión expirada', 'Por favor inicia sesión nuevamente.');
    } else if (status === 403) {
      Alert.alert('Acceso denegado', 'No tienes permisos para esta acción.');
    } else if (status === 404) {
      Alert.alert('No encontrado', 'El recurso solicitado no existe.');
    } else if (!status) {
      Alert.alert('Sin conexión', 'Verifica tu conexión a internet.');
    }

    return Promise.reject(error);
  },
);
```

### 4.2 Manejo en Pantallas

```tsx
import { Alert } from 'react-native';

async function handlePagar(facturaId: string) {
  try {
    const qrRes = await api.post(`/pagos/qr/${facturaId}`);
    // Mostrar QR al usuario...
    // Luego de escanear:
    await api.post('/pagos/confirmar', {
      facturaId,
      monto: '25.50',
      metodoPago: 'qr_simple',
    });
    Alert.alert('Éxito', 'Pago registrado correctamente');
  } catch (error: any) {
    const msg =
      error.response?.data?.error?.message ?? 'Error al procesar el pago';
    Alert.alert('Error', msg);
  }
}
```

---

## 5. Geolocalización

Los endpoints de lecturas y cortes aceptan coordenadas GPS. Para obtener la ubicación:

```bash
npx expo install expo-location
```

```typescript
import * as Location from 'expo-location';

async function getCoords() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await Location.getCurrentPositionAsync({});
  return {
    latitud: location.coords.latitude.toString(),
    longitud: location.coords.longitude.toString(),
  };
}

// Uso al registrar una lectura:
const coords = await getCoords();
await api.post('/lecturas', {
  contratoId: '123',
  valorLectura: 150,
  ...coords,
});
```

---

## 6. Subida de Fotos (Preparación)

Los endpoints de lecturas y cortes tienen un campo `fotoUrl`. Actualmente la API recibe la URL como string. Cuando se implemente la subida de archivos:

```typescript
import * as ImagePicker from 'expo-image-picker';

async function seleccionarFoto() {
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
    base64: false,
  });

  if (!result.canceled) {
    const formData = new FormData();
    formData.append('foto', {
      uri: result.assets[0].uri,
      type: 'image/jpeg',
      name: 'foto.jpg',
    } as any);

    // Subir a la API (cuando esté implementado)
    const uploadRes = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return uploadRes.data.url;
  }
}
```

---

## 7. Dependencias Necesarias

```bash
# Cliente HTTP
npm install axios

# Almacenamiento local
npm install @react-native-async-storage/async-storage

# Navegación
npm install @react-navigation/native @react-navigation/native-stack

# Geolocalización (para lecturas y cortes)
npx expo install expo-location

# Cámara/fotos (para lecturas y cortes)
npx expo install expo-image-picker
```

---

## 8. Resumen de Endpoints por Rol

### App del Brigadista

| Pantalla | Endpoint | Método |
|---|---|---|
| Login | `/auth/sign-in/email` | POST |
| Mi ruta de lecturas | `/lecturas/ruta/:brigadistaId` | GET |
| Registrar lectura | `/lecturas` | POST |
| Registrar corte | `/cortes` | POST |
| Ver sesión | `/auth/get-session` | GET |
| Cerrar sesión | `/auth/sign-out` | POST |

### App del Ciudadano

| Pantalla | Endpoint | Método |
|---|---|---|
| Login | `/auth/sign-in/email` | POST |
| Registro | `/auth/sign-up/email` | POST |
| Mis contratos | `/contratos/mis-contratos` | GET |
| Mis facturas | `/facturas/mis-facturas` | GET |
| Detalle factura | `/facturas/:id` | GET |
| Generar QR | `/pagos/qr/:facturaId` | POST |
| Confirmar pago | `/pagos/confirmar` | POST |
| Mis pagos | `/pagos/mis-pagos` | GET |
| Ver sesión | `/auth/get-session` | GET |
| Cerrar sesión | `/auth/sign-out` | POST |

---

## 9. Notas Importantes

1. **Sin cookies automáticas** — A diferencia del navegador, React Native no gestiona cookies automáticamente. Debes guardar el `token` de la respuesta de login en `AsyncStorage` y enviarlo manualmente en cada request vía el header `Cookie`.
2. **Formato del header Cookie** — El valor debe ser: `better-auth.session_token=<token>`.
3. **Validación** — La API usa `ValidationPipe` con `whitelist: true`. Cualquier campo extra en el body será rechazado con error 400.
4. **Prefijo global** — Todas las rutas (excepto `/` health check) empiezan con `/api/`.
5. **Fechas** — Los campos de fecha usan formato ISO 8601 (`2026-04-19T00:00:00.000Z`).
6. **Paginación** — Los endpoints de listado aceptan `page` y `limit` como query params.
7. **Red en emuladores** — Android Emulator usa `10.0.2.2` para acceder al host. iOS Simulator usa `localhost`. Dispositivos físicos necesitan la IP real del equipo.
