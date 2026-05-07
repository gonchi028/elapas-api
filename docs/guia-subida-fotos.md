# Guia de Integracion: Subida de Fotos en Lecturas y Cortes

## Resumen

Los endpoints de creacion de lecturas (`POST /api/lecturas`) y cortes (`POST /api/cortes`) ahora aceptan `multipart/form-data` para subir fotografias directamente desde la app movil o el frontend web. Las imagenes se almacenan en el servidor local (`uploads/`) y se sirven como archivos estaticos.

---

## Configuracion de Almacenamiento

| Parametro | Valor |
|-----------|-------|
| Ubicacion | `uploads/lecturas/` y `uploads/cortes/` |
| Tipos permitidos | `image/jpeg`, `image/png`, `image/webp` |
| Tamano maximo | 5 MB |
| Nombre de archivo | `{timestamp}-{random}.{ext}` |
| Campo del formulario | `foto` |
| URL almacenada en BD | `/uploads/lecturas/<filename>` o `/uploads/cortes/<filename>` |
| Acceso a la imagen | `GET http://localhost:3000/uploads/lecturas/<filename>` |

---

## Flujo de Trabajo

### 1. Registrar lectura con foto

```
POST /api/lecturas
Content-Type: multipart/form-data
Authorization: Cookie de sesion del brigadista
```

```bash
curl -X POST http://localhost:3000/api/lecturas \
  -b cookies.txt \
  -F "contratoId=uuid-del-contrato" \
  -F "valorLectura=1250" \
  -F "latitud=-19.0462000" \
  -F "longitud=-65.2596000" \
  -F "foto=@/path/to/foto.jpg"
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-lectura",
    "contratoId": "uuid-contrato",
    "brigadistaId": "uuid-brigadista",
    "valorLectura": 1250,
    "fotoUrl": "/uploads/lecturas/1778113754044-qx2t06.jpg",
    "latitud": "-19.0462000",
    "longitud": "-65.2596000",
    "fechaLectura": "2026-05-06T20:29:14.049Z",
    "createdAt": "2026-05-06T20:29:14.049Z"
  }
}
```

### 2. Registrar corte con foto

```
POST /api/cortes
Content-Type: multipart/form-data
Authorization: Cookie de sesion del brigadista
```

```bash
curl -X POST http://localhost:3000/api/cortes \
  -b cookies.txt \
  -F "contratoId=uuid-del-contrato" \
  -F "motivo=Morosidad - 3 meses sin pago" \
  -F "latitud=-19.0400000" \
  -F "longitud=-65.2600000" \
  -F "foto=@/path/to/foto.jpg"
```

### 3. Acceder a la imagen

La URL almacenada en `fotoUrl` es relativa al servidor. Para acceder:

```
GET http://localhost:3000{fotoUrl}
```

Ejemplo: `GET http://localhost:3000/uploads/lecturas/1778113754044-qx2t06.jpg`

No requiere autenticacion (archivos estaticos).

### 4. Subida sin foto (opcional)

El campo `foto` es opcional. Si no se envia, `fotoUrl` sera `null`:

```bash
curl -X POST http://localhost:3000/api/lecturas \
  -b cookies.txt \
  -F "contratoId=uuid-del-contrato" \
  -F "valorLectura=1250"
```

---

## Validaciones

| Caso | Respuesta |
|------|-----------|
| Tipo de archivo no permitido (ej. `.txt`, `.pdf`) | 500 - "Tipo de archivo no permitido. Solo: image/jpeg, image/png, image/webp" |
| Archivo demasiado grande (> 5MB) | 413 - Payload too large |
| Sin foto | 201 - `fotoUrl: null` |

---

## Ejemplo de Integracion en React Native (Expo)

```typescript
import * as ImagePicker from 'expo-image-picker';

async function registrarLectura(contratoId: string, valor: number) {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    base64: false,
  });

  if (result.canceled) return;

  const formData = new FormData();
  formData.append('contratoId', contratoId);
  formData.append('valorLectura', String(valor));
  formData.append('latitud', '-19.0462000');
  formData.append('longitud', '-65.2596000');

  const uri = result.assets[0].uri;
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename!);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('foto', {
    uri,
    name: filename,
    type,
  } as any);

  const response = await fetch('http://localhost:3000/api/lecturas', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.json();
}
```

## Ejemplo de Integracion en React Web (Axios)

```typescript
async function registrarLectura(contratoId: string, valor: number, file: File) {
  const formData = new FormData();
  formData.append('contratoId', contratoId);
  formData.append('valorLectura', String(valor));
  formData.append('foto', file);

  const response = await axios.post('/api/lecturas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });

  return response.data;
}
```

---

## Notas para el Desarrollador

1. **Las imagenes no requieren autenticacion** para ser accedidas. Cualquiera con la URL puede ver la foto.

2. **El campo `fotoUrl`** siempre contiene una ruta relativa (`/uploads/...`). En el frontend, anteponer la URL base del servidor (`http://localhost:3000`).

3. **No hay limpieza automatica** de imagenes. Si se elimina una lectura, la foto permanece en disco. Implementar limpieza si es necesario.

4. **En produccion**, considerar migrar a almacenamiento en la nube (Supabase Storage, Cloudflare R2, AWS S3) cambiando la configuracion de multer.

5. **Swagger docs** disponibles en `GET /docs`. Los endpoints de lecturas y cortes documentan el formato `multipart/form-data`.
