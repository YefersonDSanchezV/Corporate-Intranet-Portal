# Handoff Document — Portal Intranet Corporativa

> **Fecha:** 9 de Junio, 2026
> **Proyecto:** Corporate-Intranet-Portal
> **Propósito:** Documentación completa del estado actual, plan de alineación de colores del panel administrativo y plan de implementación de módulos faltantes.

---

## 1. Análisis Completo del Proyecto Actual

### 1.1 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | React | 18.3.1 |
| Lenguaje | TypeScript | ESNext |
| Build | Vite | 6.3.5 |
| CSS | Tailwind CSS | 4.1.12 |
| UI Library | shadcn/ui (Radix primitives) | - |
| Iconos | Lucide React | 0.487.0 |
| Gráficos | Recharts | 2.15.2 |
| Calendario | react-day-picker + date-fns | - |
| Drag & Drop | react-dnd | 16.0.1 |
| Paneles | react-resizable-panels | 2.1.7 |
| Animaciones | motion | 12.23.24 |
| Notificaciones | sonner | 2.0.3 |
| Formularios | react-hook-form | 7.55.0 |
| MUI (Material UI) | @mui/material | 7.3.5 |

### 1.2 Estructura de Archivos (src/)

```
src/
├── main.tsx                          # Punto de entrada
├── app/
│   ├── App.tsx                       # Componente raíz con routing
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Contexto de autenticación de usuarios
│   │   ├── AdminAuthContext.tsx       # Contexto de autenticación admin
│   │   ├── AnnouncementsContext.tsx   # Contexto de anuncios
│   │   └── SystemContext.tsx          # Contexto de datos del sistema
│   ├── components/
│   │   ├── modals/                    # Modales reutilizables (14 archivos)
│   │   ├── modules/                   # Módulos de la intranet pública (11 archivos)
│   │   ├── admin/                     # Panel administrativo
│   │   │   ├── AdminPanel.tsx         # Layout principal del admin
│   │   │   ├── AdminSidebar.tsx       # Sidebar de navegación admin
│   │   │   ├── AdminLoginModal.tsx    # Modal de login admin
│   │   │   └── views/                 # Vistas del admin
│   │   │       ├── WelcomeView.tsx                    # Dashboard de bienvenida
│   │   │       ├── GeneralesUsuariosView.tsx           # Gestión de usuarios
│   │   │       ├── GeneralesModulosView.tsx            # Gestión de módulos
│   │   │       ├── GeneralesSitiosView.tsx             # Sitios de redirección
│   │   │       └── GeneralesDirectorioView.tsx         # Directorio (ext/correos)
│   │   └── ui/                        # Componentes shadcn/ui (38 archivos)
│   └── utils/
│       └── greetings.ts               # Utilidad de saludos
├── styles/
│   ├── index.css                      # Entry point styles
│   ├── tailwind.css                   # Config Tailwind
│   ├── theme.css                      # Variables CSS del tema
│   └── fonts.css                      # Fuentes
└── assets/                            # Imágenes
```

### 1.3 Sistema de Colores de la Intranet (theme.css)

```css
--primary: #CF3438           /* Rojo principal - utilizado en: navigation activo, headers, botones */
--secondary: #0778AC         /* Azul secundario - utilizado en: navigation bar, fondos, acentos */
--background: #f8f9fa        /* Fondo general gris claro */
--sidebar: #ffffff            /* Sidebar blanco por defecto */
```

**Uso actual de colores en la intranet pública:**
- Barra de navegación: `bg-[#0778AC]`
- Elemento activo en nav: `bg-[#CF3438]`
- Header: `bg-white` con borde inferior `border-[#CF3438]`
- Footer: `border-t-2 border-[#0778AC]`
- Botones primarios: `bg-[#0778AC]`
- Botones de acción: `bg-gradient-to-r from-[#CF3438] to-[#e74c3c]`
- Enlaces y acentos: `text-[#0778AC]` y `text-[#CF3438]`

### 1.4 Estado del Panel Administrativo

**Vistas implementadas (5 de 20):**
1. ✅ **WelcomeView** - Dashboard con accesos rápidos
2. ✅ **GeneralesUsuariosView** - CRUD usuarios, solicitudes, cargos y permisos (mode: list, create, requests, cargos)
3. ✅ **GeneralesModulosView** - Gestión de módulos del portal
4. ✅ **GeneralesSitiosView** - Gestión de sitios de redirección
5. ✅ **GeneralesDirectorioView** - Directorio de extensiones y correos (type: extension, email)

**Vistas NO implementadas (15) - actualmente muestran "Vista en construcción":**

```
Categoría "Comunicaciones" (6 vistas):
├── dashboard-comunicaciones    → Dashboard de comunicaciones
├── usuarios-comunicaciones     → Usuarios del módulo comunicaciones
├── permisos                    → Permisos de comunicaciones
├── crear-anuncio               → Crear anuncio (desde admin)
├── calendario-anuncios         → Calendario de anuncios
├── anuncios-pendientes         → Anuncios pendientes de aprobación
├── anuncios-historial          → Historial de anuncios
├── calendario-cumpleaños       → Calendario de cumpleaños
├── calendario-eventos          → Calendario de eventos
├── logros-acreditaciones       → Logros y acreditaciones
├── tareas-seguimiento          → Tareas y seguimiento

Categoría "Asistencia" (2 vistas):
├── formatos-contingencia       → Formatos de contingencia
├── consulta-externa            → Consulta externa

Categoría "Innovacción Analítica" (1 vista):
├── enlace-redireccion          → Enlace de redirección

Categoría "Generales" (1 vista):
├── logs                        → Logs del sistema
```

### 1.5 Datos Persistentes (localStorage)
El sistema usa `localStorage` para persistencia con las siguientes claves:
- `intranet_users`, `intranet_access_records`, `intranet_access_requests`, `intranet_password_reset_requests`
- `intranet_sites`, `intranet_roles`, `intranet_role_permissions`, `intranet_directory`
- `intranet_eps`, `intranet_contracts`, `intranet_support`, `intranet_formats`
- `intranet_achievements`, `intranet_tasks`, `intranet_institution_emails`
- `intranet_announcements`, `intranet_notifications_count`
- `admin_portal_modules`

---

## 2. Plan de Alineación de Colores del Panel Administrativo

### 2.1 Esquema de Colores Objetivo

| Elemento | Color Actual | Color Objetivo | Justificación |
|----------|-------------|----------------|---------------|
| Sidebar background | `#0d2b5e` (azul oscuro) | `#0778AC` (azul intranet) | Consistencia con Navigation bar |
| Texto sidebar | `white/white- variants` | `white/white- variants` | Se mantiene |
| Elemento activo sidebar | `#CF3438` con fondo | `#CF3438` con fondo | Se mantiene (ya es correcto) |
| Hover sidebar | `bg-white/10` | `bg-black/10` | Mejor contraste sobre azul |
| Título WelcomeView | `#0d2b5e` | `#0778AC` | Consistencia |
| Bordes tablas | `border-gray-100` | `border-gray-200` | Más visibilidad |
| Botones primarios admin | `bg-[#0778AC]` | `bg-[#0778AC]` | Ya es correcto |
| Botones destructivos admin | `bg-[#CF3438]` | `bg-[#CF3438]` | Ya es correcto |

### 2.2 Archivos a Modificar para Colores

#### **Archivo 1: `src/app/components/admin/AdminSidebar.tsx`**

Cambios requeridos:
1. **Línea 227**: `bg-[#0d2b5e]` → `bg-[#0778AC]`
2. **Línea 188**: `text-white bg-white/10` (hover state) → ajustar contraste si es necesario
3. **Línea 188**: `hover:text-white hover:bg-white/10` → `hover:text-white hover:bg-black/10`
4. **Línea 213**: `hover:bg-white/10` → `hover:bg-black/10`

#### **Archivo 2: `src/app/components/admin/views/WelcomeView.tsx`**

Cambios requeridos:
1. **Línea 28**: `text-[#0d2b5e]` → `text-[#0778AC]`

#### **Archivo 3: `src/app/components/admin/views/GeneralesUsuariosView.tsx`**

Cambios requeridos:
1. **Línea 185**: `text-[#0d2b5e]` → `text-[#0778AC]`
2. **Línea 341**: `text-[#0d2b5e]` → `text-[#0778AC]`
3. **Línea 374**: `text-[#0d2b5e]` → `text-[#0778AC]`
4. **Línea 420**: `text-[#0d2b5e]` → `text-[#0778AC]`

#### **Archivo 4: `src/app/components/admin/views/GeneralesModulosView.tsx`**

Cambios requeridos:
1. **Línea 80**: `text-[#0d2b5e]` → `text-[#0778AC]`
2. **Línea 167**: `text-[#0d2b5e]` → `text-[#0778AC]`

#### **Archivo 5: `src/app/components/admin/views/GeneralesSitiosView.tsx`**

Cambios requeridos:
1. **Línea 81**: `text-[#0d2b5e]` → `text-[#0778AC]`
2. **Línea 167**: `text-[#0d2b5e]` → `text-[#0778AC]`

#### **Archivo 6: `src/app/components/admin/views/GeneralesDirectorioView.tsx`**

Cambios requeridos:
1. **Línea 103**: `text-[#0d2b5e]` → `text-[#0778AC]`
2. **Línea 149**: `text-[#0d2b5e]` → `text-[#0778AC]`

---

## 3. Plan de Implementación de Módulos Faltantes del Admin

### 3.1 Arquitectura Propuesta

Cada vista faltante se implementará como un componente independiente dentro de `src/app/components/admin/views/`, siguiendo el patrón de las vistas existentes.

**Patrón de implementación por vista:**
```
Componente Vista → Consume contexto (useSystem, useAuth, useAnnouncements) → UI con Tailwind
```

### 3.2 Vista: Dashboard de Comunicaciones (`DashboardComunicacionesView`)

**Archivo:** `src/app/components/admin/views/DashboardComunicacionesView.tsx`

**Funcionalidad:**
- Resumen de anuncios (totales, publicados, pendientes, programados)
- Resumen de tareas (pendientes, completadas, por usuario)
- Calendario con eventos próximos
- Tarjetas de KPIs (anuncios activos, tareas pendientes, cumpleaños del mes)

**Contextos necesarios:** `useAnnouncements`, `useSystem`, `useAuth`

**Datos mock:** No necesarios - usar datos reales de los contextos existentes.

### 3.3 Vista: Usuarios de Comunicaciones (`UsuariosComunicacionesView`)

**Archivo:** `src/app/components/admin/views/UsuariosComunicacionesView.tsx`

**Funcionalidad:**
- Lista de usuarios con acceso al módulo de Comunicaciones
- Filtro por roles (comunicaciones, coordinadores, admin)
- Capacidad de asignar/remover acceso al módulo

**Contextos necesarios:** `useAuth`, `useSystem`

### 3.4 Vista: Permisos de Comunicaciones (`PermisosComunicacionesView`)

**Archivo:** `src/app/components/admin/views/PermisosComunicacionesView.tsx`

**Funcionalidad:**
- Matriz de permisos específicos del módulo Comunicaciones
- Checkboxes para: "Publicar anuncios", "Aprobar anuncios", "Editar anuncios", "Eliminar anuncios", "Gestionar tareas"

**Contextos necesarios:** `useSystem` (rolePermissions)

### 3.5 Vista: Crear Anuncio (Admin) (`CrearAnuncioView`)

**Archivo:** `src/app/components/admin/views/CrearAnuncioView.tsx`

**Funcionalidad:**
- Formulario completo para crear anuncios (título, descripción, fecha inicio, fecha fin, imagen opcional)
- Vista previa del anuncio
- Publicación directa (sin necesidad de aprobación)

**Contextos necesarios:** `useAnnouncements`, `useAuth`

### 3.6 Vista: Calendario de Anuncios (`CalendarioAnunciosView`)

**Archivo:** `src/app/components/admin/views/CalendarioAnunciosView.tsx`

**Funcionalidad:**
- Calendario visual con eventos programados
- Lista de anuncios por día
- Navegación entre meses

**Contextos necesarios:** `useAnnouncements`

**Dependencias UI:** Componente `Calendar` de shadcn/ui (ya existe en `src/app/components/ui/calendar.tsx`)

### 3.7 Vista: Anuncios Pendientes (`AnunciosPendientesView`)

**Archivo:** `src/app/components/admin/views/AnunciosPendientesView.tsx`

**Funcionalidad:**
- Lista de anuncios no publicados
- Botones "Aprobar", "Rechazar", "Editar"
- Modal de vista detalle
- Filtros por fecha, creador

**Contextos necesarios:** `useAnnouncements`, `useAuth`

### 3.8 Vista: Historial de Anuncios (`HistorialAnunciosView`)

**Archivo:** `src/app/components/admin/views/HistorialAnunciosView.tsx`

**Funcionalidad:**
- Lista completa de anuncios (publicados y no publicados)
- Tabla con columnas: título, estado, fechas, creado por
- Filtros avanzados (fecha, estado, creador)
- Exportación de datos

**Contextos necesarios:** `useAnnouncements`

### 3.9 Vista: Calendario de Cumpleaños (`CalendarioCumpleaniosView`)

**Archivo:** `src/app/components/admin/views/CalendarioCumpleaniosView.tsx`

**Funcionalidad:**
- Calendario con indicadores de cumpleaños del mes
- Lista de cumpleañeros
- Gestión de registros (CRUD)

**Contextos necesarios:** `useSystem`, `useAuth`

**Nota:** Se necesitará extender `SystemContext` para incluir datos de cumpleaños.

### 3.10 Vista: Calendario de Eventos (`CalendarioEventosView`)

**Archivo:** `src/app/components/admin/views/CalendarioEventosView.tsx`

**Funcionalidad:**
- CRUD de eventos institucionales
- Calendario visual
- Categorización de eventos

**Contextos necesarios:** `useSystem`

**Nota:** Se necesitará extender `SystemContext` para incluir datos de eventos.

### 3.11 Vista: Logros y Acreditaciones (`LogrosAcreditacionesView`)

**Archivo:** `src/app/components/admin/views/LogrosAcreditacionesView.tsx`

**Funcionalidad:**
- CRUD de logros y acreditaciones
- Subida de imágenes (URL)
- Vista de galería
- Activación/desactivación

**Contextos necesarios:** `useSystem` (achievements)

**Datos ya disponibles:** El `SystemContext` ya tiene `achievements`, `addAchievement`, `removeAchievement`

### 3.12 Vista: Tareas y Seguimiento (Admin) (`TareasSeguimientoView`)

**Archivo:** `src/app/components/admin/views/TareasSeguimientoView.tsx`

**Funcionalidad:**
- Tablero Kanban de tareas (Pendiente, En Progreso, Completada)
- Asignación a usuarios
- Observaciones por tarea
- Filtros por estado, asignado, fecha

**Contextos necesarios:** `useSystem` (tasks), `useAuth`

**Datos ya disponibles:** `SystemContext` tiene `tasks`, `addTask`, `updateTask`, `addObservationToTask`, `completeTask`

### 3.13 Vista: Formatos de Contingencia (Admin) (`FormatosContingenciaView`)

**Archivo:** `src/app/components/admin/views/FormatosContingenciaView.tsx`

**Funcionalidad:**
- CRUD de formatos de contingencia
- Subida de enlaces
- Vista de lista con categorías

**Contextos necesarios:** `useSystem` (contingencyFormats)

**Datos ya disponibles:** `SystemContext` tiene `contingencyFormats`, `addFormat`, `removeFormat`

### 3.14 Vista: Consulta Externa (Admin) (`ConsultaExternaView`)

**Archivo:** `src/app/components/admin/views/ConsultaExternaView.tsx`

**Funcionalidad:**
- CRUD de plataformas EPS para consulta externa
- Lista de URLs de plataformas
- Activación/desactivación

**Contextos necesarios:** `useSystem` (epsList)

**Datos ya disponibles:** `SystemContext` tiene `epsList`, `setEpsList`, `addEps`, `removeEps`

### 3.15 Vista: Enlace de Redirección (Innovación) (`EnlaceRedireccionView`)

**Archivo:** `src/app/components/admin/views/EnlaceRedireccionView.tsx`

**Funcionalidad:**
- Gestión de enlace de redirección para el módulo Innovacción Analítica
- Similar a `GeneralesSitiosView` pero específico para este módulo

**Contextos necesarios:** `useSystem` (sites)

### 3.16 Vista: Logs del Sistema (Admin) (`LogsView`)

**Archivo:** `src/app/components/admin/views/LogsView.tsx`

**Funcionalidad:**
- Visualización de logs del sistema
- Filtros por usuario, acción, módulo, fecha
- Vista JSON detallada
- Paginación

**Contextos necesarios:** `useAuth` (accessRecords)

**Datos ya disponibles:** `AuthContext` tiene `accessRecords`

### 3.17 Registro de Vistas en AdminPanel.tsx

**Archivo a modificar:** `src/app/components/admin/AdminPanel.tsx`

Se deben agregar los imports y cases en el switch para todas las nuevas vistas:

```tsx
import { DashboardComunicacionesView } from "./views/DashboardComunicacionesView";
import { UsuariosComunicacionesView } from "./views/UsuariosComunicacionesView";
// ... etc.

case "dashboard-comunicaciones":
  return <DashboardComunicacionesView />;
case "usuarios-comunicaciones":
  return <UsuariosComunicacionesView />;
// ... etc.
```

### 3.18 Orden de Implementación Sugerido

| Fase | Prioridad | Vistas | Dependencias | Esfuerzo Estimado |
|------|-----------|--------|-------------|-------------------|
| **1** | Alta | LogrosAcreditacionesView, FormatosContingenciaView, ConsultaExternaView, LogsView | Datos ya existen en contextos | 4 horas |
| **2** | Alta | DashboardComunicacionesView, AnunciosPendientesView, CrearAnuncioView | useAnnouncements existente | 4 horas |
| **3** | Media | CalendarioAnunciosView, HistorialAnunciosView, CalendarioEventosView | Componentes UI existentes | 5 horas |
| **4** | Media | TareasSeguimientoView, EnlaceRedireccionView | useSystem existente | 3 horas |
| **5** | Baja | UsuariosComunicacionesView, PermisosComunicacionesView | useAuth + useSystem | 3 horas |
| **6** | Baja | CalendarioCumpleaniosView | Requiere extender context | 3 horas |

---

## 4. Resumen de Archivos a Crear/Modificar

### Archivos NUEVOS (15 vistas + posibles extensiones de contexto):

```
src/app/components/admin/views/
├── DashboardComunicacionesView.tsx
├── UsuariosComunicacionesView.tsx
├── PermisosComunicacionesView.tsx
├── CrearAnuncioView.tsx
├── CalendarioAnunciosView.tsx
├── AnunciosPendientesView.tsx
├── HistorialAnunciosView.tsx
├── CalendarioCumpleaniosView.tsx
├── CalendarioEventosView.tsx
├── LogrosAcreditacionesView.tsx
├── TareasSeguimientoView.tsx
├── FormatosContingenciaView.tsx
├── ConsultaExternaView.tsx
├── EnlaceRedireccionView.tsx
└── LogsView.tsx
```

### Archivos a MODIFICAR (7 archivos):

```
Para colores:
├── src/app/components/admin/AdminSidebar.tsx           → bg-[#0d2b5e] → bg-[#0778AC], hovers
├── src/app/components/admin/views/WelcomeView.tsx      → text-[#0d2b5e] → text-[#0778AC]
├── src/app/components/admin/views/GeneralesUsuariosView.tsx  → text-[#0d2b5e] → text-[#0778AC]
├── src/app/components/admin/views/GeneralesModulosView.tsx   → text-[#0d2b5e] → text-[#0778AC]
├── src/app/components/admin/views/GeneralesSitiosView.tsx    → text-[#0d2b5e] → text-[#0778AC]
├── src/app/components/admin/views/GeneralesDirectorioView.tsx → text-[#0d2b5e] → text-[#0778AC]

Para registro de vistas:
├── src/app/components/admin/AdminPanel.tsx              → Agregar imports + cases
```

### Posibles extensiones de contexto (si es necesario):

```
src/app/contexts/SystemContext.tsx   → Agregar: eventos, cumpleaños (si no existen)
```

---

## 5. Notas Técnicas Adicionales

### 5.1 Patrón de UI Consistente
Todas las vistas deben seguir el patrón de UI existente:
- Header con título `text-2xl font-bold text-[#0778AC]` y descripción
- Línea decorativa: `h-1 bg-gradient-to-r from-[#CF3438] to-transparent`
- Tablas con header `bg-gray-50 border-b-2 border-gray-100`
- Botones primarios: `bg-[#0778AC] hover:bg-[#065a87] text-white`
- Botones de acción: `bg-gradient-to-r from-[#CF3438] to-[#e74c3c]`
- Modales con header de color y botón X
- Cards con `bg-white rounded-lg shadow-sm border border-gray-100`

### 5.2 Manejo de Estado
- Usar `useState` + `useEffect` con `localStorage` para persistencia (como en vistas existentes)
- Datos compartidos deben ir en contextos (`AuthContext`, `SystemContext`, `AnnouncementsContext`)

### 5.3 Responsive Design
- Usar grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Tablas con overflow-x-auto para mobile
- Padding responsive: `p-4 md:p-6`

### 5.4 Convenciones de Nomenclatura
- Archivos: PascalCase con sufijo `View.tsx`
- Componentes: PascalCase
- Funciones: camelCase
- Handlers: `handle[NombreAcción]`

---

## 6. Estado Final del Sistema (Post-Implementación)

### 6.1 Resumen de Cambios Realizados

| Categoría | Archivos | Estado |
|-----------|----------|--------|
| Alineación de colores (sidebar) | AdminSidebar.tsx | ✅ Completado |
| Alineación de colores (títulos) | 5 views existentes | ✅ Completado |
| Vistas nuevas creadas | 15 archivos | ✅ Completado |
| Integración en AdminPanel.tsx | 1 archivo | ✅ Completado |
| Build/Compilación | - | ✅ Exitosa (0 errores) |

### 6.2 Vistas del Panel Administrativo (20/20 implementadas)

| # | Vista | Categoría | Archivo | Estado |
|---|-------|-----------|---------|--------|
| 1 | WelcomeView | Dashboard | WelcomeView.tsx | ✅ Existente |
| 2 | GeneralesUsuariosView | Generales | GeneralesUsuariosView.tsx | ✅ Existente |
| 3 | GeneralesModulosView | Generales | GeneralesModulosView.tsx | ✅ Existente |
| 4 | GeneralesSitiosView | Generales | GeneralesSitiosView.tsx | ✅ Existente |
| 5 | GeneralesDirectorioView | Generales | GeneralesDirectorioView.tsx | ✅ Existente |
| 6 | **DashboardComunicacionesView** | Comunicaciones | DashboardComunicacionesView.tsx | ✅ **NUEVA** |
| 7 | **UsuariosComunicacionesView** | Comunicaciones | UsuariosComunicacionesView.tsx | ✅ **NUEVA** |
| 8 | **PermisosComunicacionesView** | Comunicaciones | PermisosComunicacionesView.tsx | ✅ **NUEVA** |
| 9 | **CrearAnuncioView** | Comunicaciones | CrearAnuncioView.tsx | ✅ **NUEVA** |
| 10 | **CalendarioAnunciosView** | Comunicaciones | CalendarioAnunciosView.tsx | ✅ **NUEVA** |
| 11 | **AnunciosPendientesView** | Comunicaciones | AnunciosPendientesView.tsx | ✅ **NUEVA** |
| 12 | **HistorialAnunciosView** | Comunicaciones | HistorialAnunciosView.tsx | ✅ **NUEVA** |
| 13 | **CalendarioCumpleaniosView** | Comunicaciones | CalendarioCumpleaniosView.tsx | ✅ **NUEVA** |
| 14 | **CalendarioEventosView** | Comunicaciones | CalendarioEventosView.tsx | ✅ **NUEVA** |
| 15 | **LogrosAcreditacionesView** | Comunicaciones | LogrosAcreditacionesView.tsx | ✅ **NUEVA** |
| 16 | **TareasSeguimientoView** | Comunicaciones | TareasSeguimientoView.tsx | ✅ **NUEVA** |
| 17 | **FormatosContingenciaView** | Asistencia | FormatosContingenciaView.tsx | ✅ **NUEVA** |
| 18 | **ConsultaExternaView** | Asistencia | ConsultaExternaView.tsx | ✅ **NUEVA** |
| 19 | **EnlaceRedireccionView** | Innovación | EnlaceRedireccionView.tsx | ✅ **NUEVA** |
| 20 | **LogsView** | Generales | LogsView.tsx | ✅ **NUEVA** |

### 6.3 Conexiones Admin ↔ Portal Verificadas

| Dato | Admin (origen) | Portal (destino) | Estado |
|------|---------------|------------------|--------|
| Anuncios | AdminPanel → CrearAnuncioView | AnnouncementPanel, CommunicationsModule | ✅ **Conectado** (mismo contexto) |
| Cumpleaños | CalendarioCumpleaniosView (`admin_birthdays`) | BirthdayWall (automático por fecha) | ✅ **Conectado** (misma clave localStorage) |
| Eventos | CalendarioEventosView (`admin_events`) | CommunicationsModule (calendario tipo Google) | ✅ **Conectado** (misma clave localStorage) |
| Logros | LogrosAcreditacionesView | AccreditationAchievementsModal (Gestión Institucional) | ✅ **Conectado** (mismo contexto SystemContext) |
| Formatos Contingencia | FormatosContingenciaView | ContingencyFormatsModal (Área Asistencial) | ✅ **Conectado** (mismo contexto SystemContext) |
| EPS/Consulta Externa | ConsultaExternaView | ExternalConsultationModal (Área Asistencial) | ✅ **Conectado** (mismo contexto SystemContext) |
| Tareas | TareasSeguimientoView | CommunicationsModule | ✅ **Conectado** (mismo contexto SystemContext) |
| Sitios Redirección | GeneralesSitiosView | Todos los módulos públicos | ✅ **Conectado** (mismo contexto SystemContext) |
| Usuarios | GeneralesUsuariosView | Login, módulos públicos | ✅ **Conectado** (mismo contexto AuthContext) |

### 6.4 Almacenamiento Local (localStorage) Compartido

| Clave | Propósito |
|-------|-----------|
| `admin_events` | Eventos del calendario de eventos |
| `admin_birthdays` | Registros de cumpleaños del personal |

### 6.4 Documentación Generada

El archivo `handoff-documentation.md` en la raíz del proyecto contiene:
- ✅ Análisis completo del proyecto (stack, estructura, colores, estado)
- ✅ Plan de alineación de colores del panel administrativo
- ✅ Plan de implementación de 15 módulos faltantes
- ✅ Checklist de implementación (completado 100%)
- ✅ Documentación del estado final del sistema

---

## 7. Checklist de Implementación (Historial)

- [ ] **Fase 0: Colores** - Actualizar colores del panel admin (6 archivos)
  - [ ] AdminSidebar.tsx - cambiar bg a #0778AC y hovers a bg-black/10
  - [ ] WelcomeView.tsx - cambiar título de #0d2b5e a #0778AC
  - [ ] GeneralesUsuariosView.tsx - cambiar títulos
  - [ ] GeneralesModulosView.tsx - cambiar títulos
  - [ ] GeneralesSitiosView.tsx - cambiar títulos
  - [ ] GeneralesDirectorioView.tsx - cambiar títulos
- [ ] **Fase 1: Vistas con datos existentes** (4 vistas)
  - [ ] LogrosAcreditacionesView.tsx
  - [ ] FormatosContingenciaView.tsx
  - [ ] ConsultaExternaView.tsx
  - [ ] LogsView.tsx
- [ ] **Fase 2: Vistas de Comunicaciones** (3 vistas)
  - [ ] DashboardComunicacionesView.tsx
  - [ ] AnunciosPendientesView.tsx
  - [ ] CrearAnuncioView.tsx
- [ ] **Fase 3: Vistas de Calendario** (3 vistas)
  - [ ] CalendarioAnunciosView.tsx
  - [ ] HistorialAnunciosView.tsx
  - [ ] CalendarioEventosView.tsx
- [ ] **Fase 4: Vistas de Seguimiento** (2 vistas)
  - [ ] TareasSeguimientoView.tsx
  - [ ] EnlaceRedireccionView.tsx
- [ ] **Fase 5: Vistas de Usuarios/Permisos** (2 vistas)
  - [ ] UsuariosComunicacionesView.tsx
  - [ ] PermisosComunicacionesView.tsx
- [ ] **Fase 6: Vista restante** (1 vista)
  - [ ] CalendarioCumpleaniosView.tsx
- [ ] **Integración final**
  - [ ] Registrar todas las vistas en AdminPanel.tsx
  - [ ] Verificar que no haya conflictos de nombres
  - [ ] Probar navegación entre todas las vistas

---

## 8. Despliegue Docker

### 8.1 Archivos Docker

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Multi-stage build (Node 20 + Nginx Alpine) |
| `nginx.conf` | Configuración SPA, gzip, cache, seguridad |
| `docker-compose.test.yml` | Desarrollo local en puerto 3000 |
| `docker-compose.prod.yml` | Producción en puerto 80 con healthcheck |
| `.dockerignore` | Excluye node_modules, .git, dist del build |
| `scripts/deploy-build-push.sh` | Script Linux para build y push al Hub |
| `scripts/deploy-build-push.ps1` | Script Windows para build y push al Hub |
| `scripts/deploy-pull-run.sh` | Script del servidor para pull y deploy |

### 8.2 Flujo de Despliegue

```
LOCAL: ./scripts/deploy-build-push.sh [tag]
   ↓ Build + Push a Docker Hub
SERVIDOR: ./scripts/deploy-pull-run.sh [tag]
   ↓ Pull + Up (docker compose prod)
   ↓
PORTAL EN PRODUCCIÓN (puerto 80)
```

### 8.3 Comandos Rápidos

**Desarrollo local con Docker:**
```bash
docker compose -f docker-compose.test.yml up --build
# → Acceso en http://localhost:3000
```

**Build y push a Docker Hub:**
```bash
# Linux
./scripts/deploy-build-push.sh v1.0.0
# Windows
.\scripts\deploy-build-push.ps1 -Tag v1.0.0
```

**Despliegue en servidor:**
```bash
# Copiar docker-compose.prod.yml al servidor
scp docker-compose.prod.yml root@server:/opt/intranet/
scp scripts/deploy-pull-run.sh root@server:/opt/intranet/

# En el servidor
cd /opt/intranet
chmod +x deploy-pull-run.sh
./deploy-pull-run.sh v1.0.0
```

### 8.4 Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DOCKER_REGISTRY` | `icvc` | Registro de Docker Hub (usuario/account) |
| `TAG` | `latest` | Tag de la imagen |

---

*Documento generado el 9 de Junio de 2026 para el proyecto Corporate-Intranet-Portal del Instituto Cardiovascular del Cesar.*
