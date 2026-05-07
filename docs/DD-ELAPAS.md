# Documento de Diseño (DD) — Sistema ELAPAS

**Proyecto:** Sistema de Gestión de Servicios Públicos de Agua — ELAPAS Sucre
**Versión:** 1.0
**Fecha:** 17 de abril de 2026
**Contexto:** Proyecto académico — Gestión de Proyectos de Software (7mo Semestre)
**Duración estimada:** 4 semanas
**Equipo:** 3-4 personas
**Stack tecnológico:** JavaScript (React / React Native / Node.js / PostgreSQL)
**Despliegue:** Local / Demo

---

## Tabla de Contenidos

1. [Problem Statement](#1-problem-statement)
2. [Goals](#2-goals)
3. [Non-Goals](#3-non-goals)
4. [Arquitectura General](#4-arquitectura-general)
5. [User Stories](#5-user-stories)
6. [Requisitos por Módulo](#6-requisitos-por-módulo)
7. [Modelo de Datos](#7-modelo-de-datos)
8. [API Design](#8-api-design)
9. [Diseño de Interfaces](#9-diseño-de-interfaces)
10. [Success Metrics](#10-success-metrics)
11. [Open Questions](#11-open-questions)
12. [Timeline y Fases](#12-timeline-y-fases)
13. [Riesgos y Mitigaciones](#13-riesgos-y-mitigaciones)

---

## 1. Problem Statement

La Empresa Local de Agua Potable y Alcantarillado de Sucre (ELAPAS) gestiona el servicio de agua potable para la ciudad de Sucre, atendiendo a miles de usuarios distribuidos en múltiples distritos. Actualmente, los procesos de lectura de medidores, facturación, cobro y control de cortes de servicio se realizan de forma manual o con herramientas fragmentadas, lo que genera errores en el cálculo de tarifas, retrasos en la recaudación y falta de trazabilidad sobre las acciones de campo.

Los brigadistas no cuentan con una herramienta digital unificada para registrar lecturas y evidencias fotográficas; los ciudadanos no tienen un canal de autoservicio para consultar su consumo y pagar sus facturas; y la administración carece de un dashboard que consolide en tiempo real la información operativa de la empresa.

**Costo de no resolverlo:** Incertidumbre en la recaudación, lentitud en la detección de morosidad, quejas de usuarios por falta de transparencia y dificultad para tomar decisiones operativas basadas en datos.

---

## 2. Goals

| # | Objetivo | Tipo | Métrica de éxito |
|---|----------|------|------------------|
| G1 | Digitalizar el registro de lecturas de medidores con geolocalización | Usuario | 100% de lecturas registradas con GPS y fotografía |
| G2 | Automatizar el cálculo de facturación según el pliego tarifario vigente de Sucre | Negocio | 0 errores de cálculo tarifario frente al proceso manual |
| G3 | Permitir que los ciudadanos consulten su consumo y descarguen facturas en línea | Usuario | Portal accesible desde cualquier navegador |
| G4 | Integrar pagos con QR Simple para facilitar la recaudación | Negocio | Flujo completo de generación y validación de QR |
| G5 | Proveer un dashboard administrativo con métricas operativas en tiempo real | Negocio | Visualización de cortes y recaudación por distrito |

---

## 3. Non-Goals

| # | No-objetivo | Razón |
|---|-------------|-------|
| NG1 | Integración con sistemas contables gubernamentales (SIGMA) | Fuera del alcance de un prototipo de 4 semanas |
| NG2 | Módulo de atención al ciudadano / quejas online | Funcionalidad importante pero independiente; se deja para una segunda fase |
| NG3 | Sistema de notificaciones push o SMS automáticas | Requiere infraestructura de terceros que complejiza el prototipo |
| NG4 | Publicación en app stores (Google Play / App Store) | Para demo basta con la app en modo desarrollo |
| NG5 | Soporte offline completo en la app móvil | Agrega complejidad significativa; se manejará con caché básico |

---

## 4. Arquitectura General

### 4.1 Vista de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTES                                 │
│                                                                 │
│  ┌───────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  App      │    │  Portal Web  │    │  Dashboard           │  │
│  │  Móvil    │    │  (Ciudadano) │    │  (Administrativo)    │  │
│  │(React     │    │  (React +    │    │  (React +            │  │
│  │ Native)   │    │   Vite)      │    │   Recharts)          │  │
│  └─────┬─────┘    └──────┬───────┘    └──────────┬───────────┘  │
│        │                 │                       │              │
└────────┼─────────────────┼───────────────────────┼──────────────┘
         │                 │                       │
         ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API GATEWAY / REST API                      │
│                     (Node.js + Express)                         │
│                                                                 │
│  ┌─────────────┐ ┌───────────────┐ ┌────────────┐ ┌───────────┐ │
│  │  Auth &     │ │  Facturación  │ │  Lecturas  │ │  Reportes │ │
│  │  Usuarios   │ │  y Catastro   │ │  y Cortes  │ │  y Pagos  │ │
│  └─────┬───────┘ └──────┬────────┘ └─────┬──────┘ └─────┬─────┘ │
│        │                │                │              │       │
└────────┼────────────────┼────────────────┼──────────────┼───────┘
         │                │                │              │
         ▼                ▼                ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BASE DE DATOS                               │
│                     PostgreSQL                                  │
│                                                                 │
│  usuarios │ contratos │ lecturas │ facturas │ pagos │ cortes    │
│  tarifas  │ distritos │ predios  │ medidores│ roles │ logs      │
│  asignaciones                                                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ALMACENAMIENTO DE ARCHIVOS                                     │
│  Local (uploads/) — fotografías de lecturas y cortes            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack Detallado

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| API Backend | NestJS 11 (Express) | 11 | Framework modular con decoradores, inyección de dependencias, Swagger integrado |
| Base de datos | PostgreSQL | 15+ | Relacional, robusta, soporte GIS con PostGIS opcional |
| ORM | Drizzle ORM | — | ORM type-safe con inferencia de tipos TypeScript, migraciones con drizzle-kit |
| Portal Web (Frontend) | React + Vite | React 18 | SPA rápida, ecosistema amplio |
| Dashboard Admin | React + Recharts | — | Componentes de gráficos listos para usar |
| App Móvil | React Native + Expo | SDK 50+ | Multiplataforma (Android/iOS) con un solo código |
| Autenticación | Better Auth (sesiones con cookies) | — | Autenticación con sesiones HTTP-only cookies, roles y gestión de usuarios |
| Almacenamiento archivos | Multer + FileInterceptor (NestJS) | — | Subida de fotos con validación de tipo y tamaño |
| Estilos (Web) | Tailwind CSS | 3.x | Utilidades rápidas, prototipado veloz |
| Pasarela de pago | QR Simple (simulación) | — | Demo con generación de QR estático |

### 4.3 Principios de Diseño

1. **API-First:** Toda la lógica de negocio reside en la API REST. Los clientes (web, móvil, dashboard) son consumidores puros.
2. **Separación de responsabilidades:** Cada módulo tiene sus propias rutas, controladores, servicios y modelos.
3. **Stateful sessions:** La autenticación se gestiona con sesiones HTTP-only cookies a través de Better Auth. Las cookies se envían automáticamente con cada petición.
4. **Convención sobre configuración:** Estructura de proyecto estandarizada para que el equipo trabaje en paralelo.

### 4.4 Estructura de Directorios del Backend

```
src/
├── main.ts                # Entry point NestJS
├── app.module.ts          # Root module
├── auth/                  # Better Auth + guards + decorators
│   ├── auth.ts
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.guard.ts
│   ├── roles.guard.ts
│   └── dto/
├── common/                # Shared utilities
│   ├── filters/           # Exception filters
│   ├── pdf/               # PDF generation service
│   └── uploads/           # Multer upload config
├── db/                    # Drizzle ORM connection + schema
│   ├── connection.ts
│   └── schema.ts
├── usuarios/              # Admin CRUD users
├── distritos/             # Admin CRUD districts
├── predios/               # Admin CRUD properties
├── medidores/             # Admin CRUD meters
├── contratos/             # Service contracts
├── tarifas/               # Tariff management
├── asignaciones/          # Route assignments
├── lecturas/              # Meter readings + mi-ruta
├── facturas/              # Invoices + massive generation + PDF
├── pagos/                 # Payments with QR
├── cortes/                # Service cuts
└── reportes/              # Dashboard reports
```

### 4.5 Estructura de Directorios del Frontend (Portal + Dashboard)

```
client/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Páginas por módulo
│   │   ├── portal/       # Portal del ciudadano
│   │   └── dashboard/    # Dashboard administrativo
│   ├── services/         # Llamadas a API (axios)
│   ├── hooks/            # Custom hooks
│   ├── context/          # Context API (auth, tema)
│   └── App.jsx           # Router principal
├── public/
└── package.json
```

### 4.6 Estructura de Directorios de la App Móvil

```
mobile/
├── src/
│   ├── screens/          # Pantallas (Login, Lecturas, Cortes)
│   ├── components/       # Componentes nativos
│   ├── services/         # API client
│   ├── navigation/       # Stack navigator
│   ├── hooks/            # GPS, cámara
│   └── utils/            # Helpers
├── app.json              # Configuración Expo
└── package.json
```

---

## 5. User Stories

### Persona 1: Brigadista / Técnico de Campo

| ID | User Story |
|----|-----------|
| US-T1 | Como brigadista, quiero iniciar sesión en la app móvil con mis credenciales para acceder a mis funciones de campo. |
| US-T2 | Como brigadista, quiero ver la lista de medidores asignados a mi ruta del día (con estado pendiente/leído) para planificar mi recorrido. |
| US-T3 | Como brigadista, quiero registrar la lectura de un medidor ingresando el valor numérico para que el sistema calcule el consumo. |
| US-T4 | Como brigadista, quiero que se registre automáticamente mi ubicación GPS al tomar una lectura para que quede constancia de mi presencia en el lugar. |
| US-T5 | Como brigadista, quiero tomar una fotografía del medidor como evidencia del estado y la lectura registrada. |
| US-T6 | Como brigadista, quiero registrar un corte de servicio indicando el motivo y adjuntando fotografía como evidencia. |
| US-T7 | Como brigadista, quiero ver un resumen de mis lecturas y cortes del día para verificar que completé mi ruta. |

### Persona 2: Ciudadano / Usuario del Servicio

| ID | User Story |
|----|-----------|
| US-C1 | Como ciudadano, quiero registrarme en el portal con mi número de contrato para vincular mi cuenta al servicio de agua. |
| US-C2 | Como ciudadano, quiero consultar mi historial de consumo mensual para entender mis patrones de uso. |
| US-C3 | Como ciudadano, quiero ver mi factura actual con el detalle del consumo, tarifa aplicada y monto total. |
| US-C4 | Como ciudadano, quiero descargar mi factura en formato PDF para llevar un registro personal. |
| US-C5 | Como ciudadano, quiero generar un código QR de pago para cancelar mi factura a través de QR Simple. |
| US-C6 | Como ciudadano, quiero ver el estado de mis pagos (pendientes, pagados, vencidos) para estar al día con mis obligaciones. |

### Persona 3: Administrador / Gerente ELAPAS

| ID | User Story |
|----|-----------|
| US-A1 | Como administrador, quiero ver un dashboard con el total de lecturas registradas por día y por brigadista para monitorear el avance operativo. |
| US-A2 | Como administrador, quiero visualizar en un mapa o tabla los cortes de servicio efectuados por distrito para identificar zonas con mayor morosidad. |
| US-A3 | Como administrador, quiero ver la recaudación diaria desglosada por zona (Distritos 1-5) para evaluar el desempeño financiero. |
| US-A4 | Como administrador, quiero gestionar (CRUD) los usuarios del sistema (brigadistas, administradores) para mantener el control de accesos. |
| US-A5 | Como administrador, quiero configurar el pliego tarifario (rangos de consumo y precios) para que la facturación se calcule automáticamente. |
| US-A6 | Como administrador, quiero generar facturas masivamente para todos los contratos activos al cierre del período de facturación. |

---

## 6. Requisitos por Módulo

### 6.1 Módulo 1 — Núcleo de Facturación y Catastro (Backend API)

#### Must-Have (P0)

| ID | Requisito | Criterios de Aceptación |
|----|-----------|------------------------|
| BF-P0-01 | Autenticación JWT con roles (admin, brigadista, ciudadano) | **Given** un usuario con credenciales válidas, **When** envía POST /api/auth/login, **Then** recibe un JWT con su rol y datos básicos |
| BF-P0-02 | CRUD de usuarios y contratos | Se puede crear, leer, actualizar y eliminar usuarios vinculados a contratos de servicio con dirección, distrito y número de medidor |
| BF-P0-03 | Registro de lecturas con metadatos (GPS, foto, timestamp) | **Given** un brigadista autenticado, **When** envía POST /api/lecturas con valor + foto + GPS, **Then** se almacena con el contrato asociado |
| BF-P0-04 | Cálculo automático de consumo y facturación según pliego tarifario | **Given** dos lecturas consecutivas de un medidor, **When** se genera la factura, **Then** el consumo se calcula como (lectura_actual - lectura_anterior) y el monto según tramos tarifarios configurados |
| BF-P0-05 | Gestión del pliego tarifario (tramos de consumo y precios) | El administrador puede definir tramos (0-10m³, 11-20m³, etc.) con precio por m³ y cargo fijo |
| BF-P0-06 | Generación masiva de facturas | **Given** el cierre de período, **When** el admin ejecuta la facturación, **Then** se generan facturas para todos los contratos con lectura del período |
| BF-P0-07 | Gestión de cortes de servicio | Registro de corte con contrato, fecha, motivo, brigadista responsable y fotografía de evidencia |
| BF-P0-08 | Seeders con datos de prueba (distritos, tarifas, usuarios demo) | Al correr `npm run seed` se pobla la BD con datos coherentes para demo |

#### Nice-to-Have (P1)

| ID | Requisito | Notas |
|----|-----------|-------|
| BF-P1-01 | Exportación de facturas a PDF | Generar PDF descargable con datos de la factura |
| BF-P1-02 | Auditoría de acciones (log de operaciones críticas) | Tabla de logs con usuario, acción, timestamp, entidad afectada |
| BF-P1-03 | API de reportes básicos (recaudación por distrito, lecturas por brigadista) | Endpoints agregados para alimentar el dashboard |

### 6.2 Módulo 2 — App Móvil de Campo (Técnicos)

#### Must-Have (P0)

| ID | Requisito | Criterios de Aceptación |
|----|-----------|------------------------|
| AM-P0-01 | Login con credenciales de brigadista | Pantalla de login que valida contra la API y almacena el JWT localmente |
| AM-P0-02 | Lista de medidores/ruta asignada | **Given** un brigadista logueado, **When** abre la app, **Then** ve los contratos asignados con dirección y estado (pendiente/leído). Las asignaciones son gestionadas por el administrador a través del módulo de Asignaciones. |
| AM-P0-03 | Formulario de registro de lectura | Input numérico para valor del medidor + captura de foto + GPS automático. Validación: lectura >= lectura anterior |
| AM-P0-04 | Captura de fotografía con cámara del dispositivo | Usar cámara nativa vía Expo ImagePicker. La foto se sube a /api/lecturas/:id/foto |
| AM-P0-05 | Registro de geolocalización automática | Al registrar lectura/corte, obtener coordenadas GPS y enviarlas a la API |
| AM-P0-06 | Registro de corte de servicio con evidencia fotográfica | Formulario con selección de contrato, motivo (descripción), foto obligatoria y GPS automático |
| AM-P0-07 | Resumen de actividades del día | Vista con contador de lecturas y cortes realizados en la sesión actual |

#### Nice-to-Have (P1)

| ID | Requisito | Notas |
|----|-----------|-------|
| AM-P1-01 | Caché local de rutas para funcionar con conectividad intermitente | AsyncStorage para persistir datos de ruta offline |
| AM-P1-02 | Notificación de nueva ruta asignada | Push notification básica |

### 6.3 Módulo 3 — Portal de Usuarios y Pagos (Frontend Web)

#### Must-Have (P0)

| ID | Requisito | Criterios de Aceptación |
|----|-----------|------------------------|
| PU-P0-01 | Registro y login de ciudadanos | Registro con N° de contrato + datos personales; login con email/contraseña |
| PU-P0-02 | Dashboard del ciudadano con resumen de cuenta | **Given** un ciudadano logueado, **When** accede al portal, **Then** ve su última factura, consumo actual y estado de pagos |
| PU-P0-03 | Historial de consumo mensual (tabla y gráfico) | Gráfico de líneas mostrando consumo de los últimos 6-12 meses |
| PU-P0-04 | Visualización de factura actual con detalle | Consumo (m³), tramo tarifario, cargo fijo, total, fecha de vencimiento |
| PU-P0-05 | Descarga de factura en PDF | Botón que descarga un PDF con el formato de la factura |
| PU-P0-06 | Generación de QR de pago (QR Simple) | **Given** una factura pendiente, **When** el usuario presiona "Pagar", **Then** se genera un QR con los datos del pago (monto, N° factura, entidad) |
| PU-P0-07 | Registro de pago (simulado) | El sistema permite marcar una factura como pagada para efectos de demo |

#### Nice-to-Have (P1)

| ID | Requisito | Notas |
|----|-----------|-------|
| PU-P1-01 | Perfil de usuario editable | Cambio de email, teléfono, contraseña |
| PU-P1-02 | Soporte para múltiples contratos por ciudadano | Para usuarios con más de una propiedad |

### 6.4 Módulo 4 — Dashboard de Control y Monitoreo (Administrativo)

#### Must-Have (P0)

| ID | Requisito | Criterios de Aceptación |
|----|-----------|------------------------|
| DA-P0-01 | Login de administrador | Autenticación con rol admin, redirección al dashboard |
| DA-P0-02 | Panel de lecturas: total del día, por brigadista | **Given** el admin en el dashboard, **When** selecciona la fecha, **Then** ve cantidad de lecturas totales y desglose por brigadista |
| DA-P0-03 | Panel de cortes: cantidad por distrito y por fecha | Tabla y/o gráfico con cortes efectuados filtrable por rango de fechas y distrito |
| DA-P0-04 | Panel de recaudación: monto total y por distrito | Gráfico de barras con recaudación diaria por Distritos 1-5 de Sucre |
| DA-P0-05 | Gestión de usuarios (CRUD brigadistas y admins) | Tabla con alta, baja y edición de usuarios del sistema |
| DA-P0-06 | Configuración de pliego tarifario | Interfaz para definir/editar tramos de consumo y precios |

#### Nice-to-Have (P1)

| ID | Requisito | Notas |
|----|-----------|-------|
| DA-P1-01 | Mapa de cortes por zona | Visualización geográfica con marcadores de cortes |
| DA-P1-02 | Exportar reportes a Excel/CSV | Descarga de datos tabulares |
| DA-P1-03 | Filtros avanzados por rango de fechas y múltiples criterios | Combinación de filtros en los paneles |

---

## 7. Modelo de Datos

### 7.1 Diagrama Entidad-Relación

```
┌──────────────┐      ┌──────────────────┐   ┌─────────────┐
│   usuarios   │      │    contratos     │   │  distritos  │
├──────────────┤      ├──────────────────┤   ├─────────────┤
│ id (PK)      │◄─┐   │ id (PK)          │   │ id (PK)     │
│ nombre       │  │   │ nro_contrato     │   │ nombre      │
│ email        │  │   │ usuario_id (FK)  │──┘│ codigo      │
│ password     │  │   │ predio_id (FK)   │──►│             │
│ rol          │  │   │ medidor_id (FK)  │──┐│             │
│ estado       │  │   │ estado           │  │└──────┬──────┘
│ created_at   │  │   │ created_at       │  │       │
│ updated_at   │  │   └────────┬─────────┘  │       │
└──────────────┘  │            │             │       │
                  │            │             │       │
         ┌─────────┘            │             │       │
         │                      │             │       │
         │    ┌─────────────────┘             │       │
         │    │                               │       │
         ▼    ▼                               ▼       ▼
┌───────────────┐                     ┌──────────────┐
│  lecturas     │                     │   predios    │
├───────────────┤                     ├──────────────┤
│ id (PK)       │                     │ id (PK)      │
│ contrato_id   │──► contratos.id     │ distrito_id  │──► distritos.id
│ brigadista_id │──► usuarios.id      │ direccion    │
│ valor_lectura │                     │ latitud      │
│ foto_url      │                     │ longitud     │
│ latitud       │                     │ created_at   │
│ longitud      │                     └──────────────┘
│ fecha_lectura │
│ created_at    │                     ┌──────────────┐
└───────────────┘                     │  medidores   │
                                      ├──────────────┤
┌───────────────┐                     │ id (PK)      │
│   cortes      │                     │ nro_medidor  │
├───────────────┤                     │ contrato_id  │──► contratos.id
│ id (PK)       │                     │ created_at   │
│ contrato_id   │──► contratos.id     └──────────────┘
│ brigadista_id │──► usuarios.id
│ motivo        │                     ┌─────────────┐
│ foto_url      │                     │  tarifas    │
│ latitud       │                     ├─────────────┤
│ longitud      │                     │ id (PK)     │
│ fecha_corte   │                     │ nombre      │
│ estado        │                     │ tramo_min   │
│ created_at    │                     │ tramo_max   │
└───────────────┘                     │ precio_m3   │
                                      │ cargo_fijo  │
┌────────────────┐                    │ estado      │
│  asignaciones  │                    └──────┬──────┘
├────────────────┤                           │
│ id (PK)        │                           │
│ brigadista_id  │──► usuarios.id            │
│ contrato_id    │──► contratos.id           │
│ created_at     │                           │
└────────────────┘                           │
  UNIQUE(brigadista_id, contrato_id)         │
                                    ┌────────┴─────────┐
                                    │    facturas      │
                                    ├──────────────────┤
                                    │ id (PK)          │
                                    │ contrato_id (FK) │──► contratos.id
                                    │ lectura_id (FK)  │──► lecturas.id
                                    │ periodo          │
                                    │ consumo_m3       │
                                    │ tarifa_id (FK)   │──► tarifas.id
                                    │ cargo_fijo       │
                                    │ subtotal         │
                                    │ total            │
                                    │ estado           │
                                    │ fecha_vencimiento│
                                    │ created_at       │
                                    └────────┬─────────┘
                                             │
                                    ┌────────┴─────────┐
                                    │     pagos        │
                                    ├──────────────────┤
                                    │ id (PK)          │
                                    │ factura_id (FK)  │──► facturas.id
                                    │ monto            │
                                    │ metodo_pago      │
                                    │ referencia       │
                                    │ qr_data          │
                                    │ fecha_pago       │
                                    │ created_at       │
                                    └──────────────────┘
```

### 7.2 Definición de Entidades

#### `usuarios`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | text | PK | Identificador único |
| name | text | NOT NULL | Nombre completo |
| email | text | UNIQUE, NOT NULL | Email para login |
| role | ENUM('admin', 'brigadista', 'ciudadano') | DEFAULT 'ciudadano' | Rol del usuario |
| emailVerified | boolean | DEFAULT false | Email verificado |
| image | text | | Foto de perfil |
| estado | boolean | DEFAULT true | Activo/inactivo |
| createdAt | timestamp | DEFAULT NOW() | Fecha de creación |
| updatedAt | timestamp | DEFAULT NOW() | Última actualización |

#### `account` (Better Auth)
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | text | PK | Identificador |
| accountId | text | NOT NULL | Email del usuario |
| providerId | text | NOT NULL | Proveedor ('credential') |
| userId | text | FK → user | Usuario dueño |
| password | text | | Hash bcrypt |
| createdAt | timestamp | DEFAULT NOW() | |
| updatedAt | timestamp | | |

#### `distritos`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| nombre | VARCHAR(100) | NOT NULL | Ej. "Distrito 1 - Central" |
| codigo | VARCHAR(10) | UNIQUE, NOT NULL | Ej. "D1" |

#### `contratos`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| nro_contrato | VARCHAR(20) | UNIQUE, NOT NULL | N° visible del contrato |
| usuario_id | UUID | FK → usuarios | Ciudadano titular |
| predio_id | UUID | FK → predios | Predio (inmueble) del servicio |
| medidor_id | UUID | FK → medidores | Medidor instalado |
| estado | ENUM('activo', 'suspendido', 'cortado') | DEFAULT 'activo' | Estado del servicio |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

#### `predios`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| distrito_id | UUID | FK → distritos, NOT NULL | Zona de cobertura |
| direccion | VARCHAR(255) | NOT NULL | Dirección del inmueble |
| latitud | DECIMAL(10,7) | | Coordenada GPS |
| longitud | DECIMAL(10,7) | | Coordenada GPS |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `medidores`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| nro_medidor | VARCHAR(30) | UNIQUE, NOT NULL | N° del medidor |
| contrato_id | UUID | FK → contratos, NOT NULL | Contrato vinculado |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `tarifas`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| nombre | VARCHAR(100) | NOT NULL | Ej. "Tarifa Residencial 2026" |
| tramo_min | INTEGER | NOT NULL | Límite inferior de consumo (m³) |
| tramo_max | INTEGER | NOT NULL | Límite superior de consumo (m³) |
| precio_m3 | DECIMAL(10,2) | NOT NULL | Precio por metro cúbico en Bs |
| cargo_fijo | DECIMAL(10,2) | DEFAULT 0 | Cargo fijo mensual en Bs |
| estado | BOOLEAN | DEFAULT true | Tarifa vigente |

#### `lecturas`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| contrato_id | UUID | FK → contratos, NOT NULL | Contrato leído |
| brigadista_id | UUID | FK → usuarios, NOT NULL | Quien tomó la lectura |
| valor_lectura | INTEGER | NOT NULL, CHECK >= 0 | Valor del medidor en m³ |
| foto_url | VARCHAR(500) | | Path a la foto del medidor |
| latitud | DECIMAL(10,7) | | GPS del brigadista |
| longitud | DECIMAL(10,7) | | GPS del brigadista |
| fecha_lectura | TIMESTAMP | DEFAULT NOW() | Momento de la lectura |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `facturas`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| contrato_id | UUID | FK → contratos | Contrato facturado |
| lectura_id | UUID | FK → lecturas | Lectura del período |
| periodo | VARCHAR(7) | NOT NULL | Ej. "2026-04" |
| consumo_m3 | INTEGER | NOT NULL | m³ consumidos |
| tarifa_id | UUID | FK → tarifas | Tarifa aplicada |
| cargo_fijo | DECIMAL(10,2) | | Cargo fijo aplicado |
| subtotal | DECIMAL(10,2) | | Subtotal por consumo |
| total | DECIMAL(10,2) | NOT NULL | Total a pagar |
| estado | ENUM('pendiente', 'pagada', 'vencida') | DEFAULT 'pendiente' | Estado de la factura |
| fecha_vencimiento | DATE | NOT NULL | Fecha límite de pago |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `pagos`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| factura_id | UUID | FK → facturas | Factura pagada |
| monto | DECIMAL(10,2) | NOT NULL | Monto cancelado en Bs |
| metodo_pago | ENUM('qr_simple', 'efectivo', 'transferencia') | DEFAULT 'qr_simple' | Método utilizado |
| referencia | VARCHAR(100) | | N° de referencia/transacción |
| qr_data | TEXT | | Datos del QR generado |
| fecha_pago | TIMESTAMP | DEFAULT NOW() | Momento del pago |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `cortes`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| contrato_id | UUID | FK → contratos | Contrato con corte |
| brigadista_id | UUID | FK → usuarios | Brigadista que ejecutó |
| motivo | TEXT | NOT NULL | Razón del corte (morosidad, fraude, etc.) |
| foto_url | VARCHAR(500) | | Foto de evidencia |
| latitud | DECIMAL(10,7) | | GPS |
| longitud | DECIMAL(10,7) | | GPS |
| fecha_corte | TIMESTAMP | DEFAULT NOW() | Momento del corte |
| estado | ENUM('efectuado', 'reconectado') | DEFAULT 'efectuado' | Estado del corte |
| created_at | TIMESTAMP | DEFAULT NOW() | |

#### `asignaciones`
| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| id | UUID | PK, auto | Identificador |
| brigadista_id | UUID | FK → usuarios, NOT NULL | Brigadista asignado |
| contrato_id | UUID | FK → contratos, NOT NULL | Contrato asignado |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de asignación |
| | | UNIQUE(brigadista_id, contrato_id) | No se permite duplicar asignaciones |

---

## 8. API Design

### 8.1 Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/sign-up/email` | Registro de ciudadano | Pública |
| POST | `/api/auth/sign-in/email` | Login (email + password) → cookie de sesión | Pública |
| POST | `/api/auth/sign-out` | Cerrar sesión | Cookie de sesión |
| GET | `/api/auth/get-session` | Datos de la sesión actual | Cookie de sesión |

> **Nota:** La autenticación usa cookies HTTP-only gestionadas por Better Auth. No se usa JWT.

### 8.2 Usuarios (Admin)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/usuarios` | Listar usuarios (filtrable por rol) | Admin |
| GET | `/api/usuarios/:id` | Detalle de usuario | Admin |
| POST | `/api/usuarios` | Crear usuario (brigadista/admin) | Admin |
| PUT | `/api/usuarios/:id` | Actualizar usuario | Admin |
| DELETE | `/api/usuarios/:id` | Desactivar usuario | Admin |

### 8.3 Predios (Admin)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/predios` | Listar predios (filtrable por distrito, paginado) | Admin |
| GET | `/api/predios/:id` | Detalle de predio | Admin |
| POST | `/api/predios` | Crear predio | Admin |
| PUT | `/api/predios/:id` | Actualizar predio | Admin |
| DELETE | `/api/predios/:id` | Eliminar predio (solo si no tiene contratos) | Admin |

### 8.4 Medidores (Admin)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/medidores` | Listar medidores (paginado) | Admin |
| GET | `/api/medidores/:id` | Detalle de medidor | Admin |
| POST | `/api/medidores` | Crear medidor | Admin |
| PUT | `/api/medidores/:id` | Actualizar medidor | Admin |
| DELETE | `/api/medidores/:id` | Eliminar medidor (solo si no está en un contrato) | Admin |

### 8.5 Contratos / Catastro

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/contratos` | Listar contratos (filtrable por distrito, estado) | Admin, Brigadista |
| GET | `/api/contratos/:id` | Detalle de contrato | Admin, Brigadista, Dueño |
| GET | `/api/contratos/mis-contratos` | Contratos del ciudadano autenticado | Ciudadano |
| POST | `/api/contratos` | Crear contrato | Admin |
| PUT | `/api/contratos/:id` | Actualizar contrato | Admin |

### 8.6 Lecturas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/lecturas` | Listar lecturas (filtrable por fecha, brigadista) | Admin |
| GET | `/api/lecturas/:id` | Detalle de lectura | Admin, Brigadista |
| POST | `/api/lecturas` | Registrar lectura + foto (multipart/form-data) + GPS | Brigadista (solo contratos asignados) |
| GET | `/api/lecturas/mi-ruta` | Ruta del día: contratos asignados con estado pendiente/leído | Brigadista |
| GET | `/api/lecturas/ruta/:brigadista_id` | ~~Ruta/contratos asignados al brigadista~~ (DEPRECATED) | Brigadista |

> **Subida de fotos:** El endpoint `POST /api/lecturas` acepta `multipart/form-data` con un campo `foto` (archivo JPEG/PNG/WebP, máx 5MB). La imagen se almacena en `uploads/lecturas/` y el campo `fotoUrl` de la lectura se establece con la ruta relativa `/uploads/lecturas/<filename>`. Las imágenes son accesibles vía `GET /uploads/lecturas/<filename>`.

### 8.7 Tarifas

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/tarifas` | Listar tarifas vigentes | Admin, Sistema |
| POST | `/api/tarifas` | Crear tarifa | Admin |
| PUT | `/api/tarifas/:id` | Actualizar tarifa | Admin |

### 8.8 Facturación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/facturas` | Listar facturas (filtrable por estado, período) | Admin |
| GET | `/api/facturas/:id` | Detalle de factura | Admin, Dueño |
| GET | `/api/facturas/mis-facturas` | Facturas del ciudadano | Ciudadano |
| GET | `/api/facturas/:id/pdf` | Descargar factura en PDF | Admin, Dueño |
| POST | `/api/facturas/generar` | Generar facturas masivas para un período | Admin |

### 8.9 Pagos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/pagos/qr/:factura_id` | Generar QR de pago para una factura | Ciudadano |
| POST | `/api/pagos/confirmar` | Confirmar/simular pago | Ciudadano, Admin |
| GET | `/api/pagos` | Historial de pagos | Admin |
| GET | `/api/pagos/mis-pagos` | Pagos del ciudadano | Ciudadano |

### 8.10 Cortes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/cortes` | Registrar corte + foto (multipart/form-data) | Brigadista |
| GET | `/api/cortes` | Listar cortes (filtrable por distrito, fecha) | Admin |
| GET | `/api/cortes/:id` | Detalle de corte | Admin |

> **Subida de fotos:** El endpoint `POST /api/cortes` acepta `multipart/form-data` con un campo `foto` (archivo JPEG/PNG/WebP, máx 5MB). La imagen se almacena en `uploads/cortes/` y el campo `fotoUrl` se establece con `/uploads/cortes/<filename>`.

### 8.11 Asignaciones de Ruta

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/asignaciones` | Listar todas las asignaciones (filtrable por brigadistaId, paginado) | Admin |
| GET | `/api/asignaciones/brigadista/:brigadistaId` | Obtener contratos asignados a un brigadista | Admin |
| POST | `/api/asignaciones` | Asignar contratos a un brigadista (array de contratoIds) | Admin |
| PUT | `/api/asignaciones/:brigadistaId` | Reemplazar todas las asignaciones de un brigadista | Admin |
| DELETE | `/api/asignaciones/:id` | Eliminar una asignación individual | Admin |

> **Regla de autorización:** Los brigadistas solo pueden registrar lecturas y cortes en contratos que les hayan sido asignados. Intentar operar en un contrato no asignado devuelve 403 Forbidden.

### 8.12 Reportes / Dashboard

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/reportes/resumen-diario` | Lecturas y cortes del día | Admin |
| GET | `/api/reportes/recaudacion-por-distrito` | Recaudación agrupada por distrito | Admin |
| GET | `/api/reportes/cortes-por-distrito` | Cortes agrupados por distrito | Admin |
| GET | `/api/reportes/lecturas-por-brigadista` | Lecturas por brigadista en rango de fechas | Admin |

### 8.13 Formato de Respuesta Estándar

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### 8.14 Códigos de Error

| Código | Significado | Uso |
|--------|------------|-----|
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | Cookie de sesión ausente o inválida |
| 403 | Forbidden | Sin permisos para el recurso |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Dato duplicado (email, contrato) |
| 500 | Internal Server Error | Error inesperado del servidor |

---

## 9. Diseño de Interfaces

### 9.1 App Móvil — Pantallas

| # | Pantalla | Elementos principales |
|---|----------|----------------------|
| 1 | Login | Logo ELAPAS, campos email/password, botón "Ingresar" |
| 2 | Home (Ruta del día) | Lista de contratos asignados (desde módulo de Asignaciones), badge de estado (pendiente/leído), contador superior, última lectura de referencia |
| 3 | Registrar Lectura | Header con datos del contrato, input numérico, botón "Tomar foto", mapa con GPS, botón "Guardar lectura" |
| 4 | Registrar Corte | Selector de contrato, campo motivo, botón "Tomar foto", GPS automático, botón "Registrar corte" |
| 5 | Resumen del Día | Cards: lecturas realizadas, cortes realizados, botón "Cerrar jornada" |

### 9.2 Portal Web — Páginas

| # | Página | Elementos principales |
|---|--------|----------------------|
| 1 | Login / Registro | Tabs Login/Registro, formularios, vinculación con N° contrato |
| 2 | Dashboard Ciudadano | Card de última factura, mini gráfico de consumo, badges de estado de pagos |
| 3 | Historial de Consumo | Gráfico de líneas (últimos 12 meses), tabla detallada |
| 4 | Mis Facturas | Lista de facturas con estado (pendiente/pagada/vencida), botones "Ver PDF" y "Pagar" |
| 5 | Pagar Factura | Detalle de la factura, QR generado, botón "Confirmar pago" (demo) |

### 9.3 Dashboard Admin — Paneles

| # | Panel | Elementos principales |
|---|-------|----------------------|
| 1 | Overview | KPIs: lecturas hoy, cortes hoy, recaudación hoy, contratos activos |
| 2 | Lecturas | Gráfico de barras por brigadista, tabla detallada, filtro por fecha |
| 3 | Cortes | Mapa/tabla por distrito, filtro por fecha, lista de cortes recientes |
| 4 | Recaudación | Gráfico de barras por distrito, línea temporal diaria, totales |
| 5 | Gestión Usuarios | Tabla CRUD de brigadistas y administradores |
| 6 | Tarifas | Tabla editable de tramos tarifarios |

### 9.4 Flujo de Navegación

```
CIUDADANO:
Login → Dashboard → Historial | Facturas → Pagar (QR)

BRIGADISTA (App):
Login → Ruta del Día (GET /api/lecturas/mi-ruta) → Registrar Lectura | Registrar Corte → Resumen

ADMIN:
Login → Overview → Lecturas | Cortes | Recaudación | Usuarios | Tarifas
```

---

## 10. Success Metrics

### 10.1 Indicadores Líderes (verificables en la demo)

| Métrica | Objetivo | Método de verificación |
|---------|----------|----------------------|
| Login funcional en los 3 roles | 100% | Login exitoso como admin, brigadista y ciudadano |
| Registro de lectura con GPS y foto | 100% | Crear lectura desde la app con coordenadas y fotografía |
| Generación de factura con cálculo tarifario correcto | 100% | Generar facturas masivas y verificar montos contra cálculo manual |
| Pago simulado con QR | 100% | Generar QR y completar el flujo de pago simulado |
| Dashboard con datos en tiempo real | 100% | Registrar una lectura/corte y verla reflejada en el dashboard |

### 10.2 Indicadores de Calidad

| Métrica | Objetivo |
|---------|----------|
| Cobertura de módulos implementados | 4/4 módulos con funcionalidad P0 |
| Tasa de errores críticos | 0 errores que impidan el flujo principal de cada módulo |
| Tiempo de carga del dashboard | < 3 segundos con datos de prueba |
| Responsive del portal web | Funcional en desktop y mobile (viewport) |

---

## 11. Open Questions

| # | Pregunta | Responsable | Bloqueante? |
|---|---------|-------------|-------------|
| Q1 | ¿Cuál es el pliego tarifario vigente de ELAPAS (tramos y precios en Bs)? | Negocio / Datos de ejemplo | Sí — afecta seeders y lógica de facturación |
| Q2 | ¿Qué campos del contrato son obligatorios para ELAPAS (¿se requiere CI, NIT, teléfono)? | Negocio | No — se puede usar schema mínimo |
| Q3 | ¿Cuántos distritos tiene la cobertura de ELAPAS en Sucre? ¿Son exactamente 5? | Negocio | No — se asumen 5 para la demo |
| Q4 | ¿La integración con QR Simple requiere una API key real o se simula completamente? | Técnico / Negocio | No — se simula para la demo |
| Q5 | ¿Se requiere un flujo de reconexión de servicio después de un corte? | Negocio | No — se puede marcar estado "reconectado" sin flujo completo |

---

## 12. Timeline y Fases

### Duración total: 4 semanas (equipo de 3-4 personas)

```
Semana 1          Semana 2          Semana 3          Semana 4
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│ SETUP & │      │ BACKEND │      │ FRONTEND│      │ TESTING │
│ CORE    │      │ FEATURES│      │ & MOBILE│      │ & DEMO  │
├─────────┤      ├─────────┤      ├─────────┤      ├─────────┤
│ • Repo  │      │ • Auth  │      │ • Portal│      │ • E2E   │
│   setup │      │   JWT   │      │   web   │      │   tests │
│ • DB    │      │ • CRUD  │      │ • Dash- │      │ • Bug   │
│   schema│      │   usuar.│      │   board │      │   fixes │
│ • Seed  │      │ • Lectu-│      │ • App   │      │ • Seed  │
│   data  │      │   ras   │      │   móvil │      │   data  │
│ • API   │      │ • Factu-│      │   pant- │      │ • Prepar│
│   base  │      │   ración│      │   allas │      │   demo  │
│ • Auth  │      │ • Cortes│      │ • QR    │      │ • Docu- │
│   JWT   │      │ • Tarif.│      │   pago  │      │   mentac│
└─────────┘      └─────────┘      └─────────┘      └─────────┘
```

### Desglose por Semana

#### Semana 1: Setup y Core
- Configuración del repositorio (monorepo o repos separados)
- Diseño e implementación del schema de BD (migraciones)
- Seeders con datos de prueba
- API base con Express, estructura de carpetas
- Autenticación JWT (login, register, middleware de roles)

#### Semana 2: Backend Features
- CRUD de usuarios, contratos y distritos
- Endpoint de lecturas (registro con foto y GPS)
- Cálculo de consumo y facturación automática
- Gestión de tarifas (pliego tarifario)
- Registro de cortes de servicio
- Endpoints de reportes para el dashboard

#### Semana 3: Frontend y Mobile
- Portal web del ciudadano (login, dashboard, historial, facturas, pago QR)
- Dashboard administrativo (paneles de lecturas, cortes, recaudación)
- App móvil (login, ruta del día, registro de lectura, registro de corte)
- Integración frontend ↔ API

#### Semana 4: Testing y Demo
- Pruebas funcionales de los flujos principales
- Corrección de bugs
- Generación de datos de demo realistas
- Preparación de la presentación / demo en vivo
- Documentación de uso (README)

### Asignación sugerida del equipo (4 personas)

| Persona | Semana 1 | Semana 2 | Semana 3 | Semana 4 |
|---------|----------|----------|----------|----------|
| Dev 1 (Backend) | Setup + Auth | Facturación + Tarifas | Reportes API + PDF | Testing backend |
| Dev 2 (Backend) | Schema + Seeds | Lecturas + Cortes | Pagos + QR | Integración |
| Dev 3 (Frontend) | Diseño UI | Portal web | Dashboard admin | E2E testing |
| Dev 4 (Mobile) | Setup Expo | App screens | App features + GPS | Demo prep |

---

## 13. Riesgos y Mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|-----------|
| R1 | No completar los 4 módulos en 4 semanas | Alta | Alto | Priorizar P0 estrictamente; reducir a 3 módulos si es necesario (portal + backend son imprescindibles) |
| R2 | Problemas con GPS/cámara en React Native | Media | Medio | Tener fallback manual de coordenadas; usar Expo go para testing rápido |
| R3 | Complejidad del cálculo tarifario por tramos | Baja | Medio | Implementar pruebas unitarias del cálculo antes de integrar |
| R4 | Integración QR Simple no documentada | Media | Bajo | Diseñar la integración como simulación desde el inicio; generar QR estático con datos embebidos |
| R5 | Coordinación del equipo en paralelo | Media | Alto | Definir contratos de API temprano (Semana 1); usar ramas por feature |

---

## Anexo A: Pliego Tarifario de Referencia (Datos de Ejemplo)

> **Nota:** Estos valores son ilustrativos para la demo. Reemplazar con datos reales de ELAPAS cuando estén disponibles.

| Tramo (m³) | Precio por m³ (Bs) | Cargo Fijo (Bs) | Categoría |
|-------------|-------------------|-----------------|-----------|
| 0 - 10 | 3.50 | 10.00 | Residencial Básico |
| 11 - 20 | 5.00 | 10.00 | Residencial Medio |
| 21 - 30 | 7.50 | 10.00 | Residencial Alto |
| 31+ | 10.00 | 10.00 | Residencial Excedente |

**Ejemplo de cálculo:**
- Lectura anterior: 1245 m³
- Lectura actual: 1268 m³
- Consumo: 23 m³
- Cálculo: (10 × 3.50) + (10 × 5.00) + (3 × 7.50) + 10.00 = 35.00 + 50.00 + 22.50 + 10.00 = **117.50 Bs**

---

## Anexo B: Glosario

| Término | Definición |
|---------|-----------|
| **ELAPAS** | Empresa Local de Agua Potable y Alcantarillado de Sucre |
| **Brigadista** | Técnico de campo encargado de la lectura de medidores y ejecución de cortes |
| **Pliego Tarifario** | Documento que establece los precios por consumo de agua según tramos |
| **Catastro** | Registro de todos los contratos/usuarios del servicio con sus datos de ubicación |
| **QR Simple** | Pasarela de pago boliviana basada en códigos QR |
| **Corte de servicio** | Suspensión del suministro de agua por morosidad u otra causa |
| **Distrito** | Zona geográfica de cobertura (Distritos 1-5 de Sucre) |

---

*Documento generado para fines académicos — Gestión de Proyectos de Software, 7mo Semestre.*
