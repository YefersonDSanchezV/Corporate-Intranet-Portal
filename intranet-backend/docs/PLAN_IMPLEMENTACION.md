# Plan de Implementación — Backend y Conexión con el Frontend

> **Proyecto:** Intranet Institucional (ICVC)
> **Fecha:** 2026-08-19
> **Base de datos:** PostgreSQL — ver `docs/DATABASE.md` (29 tablas, dominios `asi-`, `com-`, `gen-`, `innov-`)

---

## 1. Resumen del estado actual

| Área | Estado |
|---|---|
| **Frontend** | React 100 % mock. Todos los datos viven en `localStorage`/`sessionStorage`. Sin llamadas HTTP ni cliente API. Login y Panel de Control usan clave de prueba `icvc2024**` (no real). |
| **Backend** | Esqueleto Spring Boot 3.5 / Java 21. Solo `SecurityConfig` (permitAll). Sin entidades JPA, repositorios, servicios ni controladores. |
| **Base de datos** | Esquema real de 29 tablas (documentado en `docs/DATABASE.md`). Migraciones Flyway del repo están **vacías** (`V1` solo comentarios, `V2`–`V5` de 0 bytes). |
| **Dominios de esquema** | `asi-` (asistencial), `com-` (comunicaciones), `gen-` (generales), `innov-` (innovación). |

### Reglas de negocio a respetar

1. **El portal es público**: el home y los módulos (Inicio, Área Asistencial, Área Administrativa, Gestión Institucional, Soporte, Directorio, Innovación Analítica) son de acceso libre.
2. **Solo el botón "Panel Administrativo"** (escudo en el Header) es restringido a administrativos. El backend debe preparar esto para restringirlo por rol cuando se integre la autenticación real.
3. **Las credenciales del frontend son solo de prueba** (`root`/`admin` / `icvc2024**`) para visualizar la interfaz. El login real debe validar contra `genusuario` (hash en `genusuclahash`). **No** deben persistirse en el backend como credenciales válidas.
4. **La intranet es el centro unificado de software y sistemas** de la empresa: la lógica de "apps/sitios de redirección" (`gensitredireccion` + `genmodulo`) debe mantenerse como eje, alimentando el grid de aplicaciones de todos los módulos. Nuevas funcionalidades se irán agregando como nuevos recursos.

---

## 2. Análisis del frontend: código muerto y duplicación

### 2.1 Código muerto (~55 archivos / ~12.000 líneas)

#### Módulos completos sin renderizar (nadie los importa)
| Archivo | Nota |
|---|---|
| `src/app/components/modules/CommunicationsModule.tsx` (569 líneas) | Módulo viejo de calendarios/tareas |
| `src/app/components/modules/IntranetAdminModule.tsx` (683 líneas) | Panel admin duplicado |
| `src/app/components/modules/LogsModule.tsx` (270 líneas) | Módulo de logs |
| `src/app/components/modules/UserManagementModule.tsx` (802 líneas) | Gestión de usuarios duplicada (el panel admin ya tiene sus vistas) |

#### Modales sin importar (13)
`BiometricModal`, `ContractManagementCompleteModal` (1033), `ContractManagementModal`, `ContractManagementNewModal` (558), `ContractMatrixModal` (958), `EpsManagementModal`, `EventReportModal`, `ExtensionsModal`, `InstitutionalManualsModal`, `InternalAnnouncementsModal`, `InternalDocumentationModal`, `ManagementIndicatorsModal`, `QualityEventReportModal`.

#### Vistas admin sin importar
`AsistencialEpsView`, `AsistencialFormatsView`, `ComunicacionesTareasView`, `InnovacionAnaliticaView`.

#### Otros
- `src/app/components/RecentAccessSection.tsx` — sin import.
- `src/app/components/logos/ICVCLogo.tsx` y `ICVCLogoHorizontal.tsx` — el Header usa el PNG `figma:asset/...` en su lugar.

#### Componentes shadcn/ui sin uso (~40)
Solo están vivos: `ui/calendar`, `ui/dialog`, `ui/button`, `ui/utils` (calendar→button→utils). Muertos: `accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, card, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, use-mobile`.

#### Transitivamente muertos (solo los importan archivos muertos)
`modals/TaskModal.tsx`, `modals/NewTaskModal.tsx`, `ui/badge.tsx`, `ui/select.tsx`, `ui/input.tsx`.

### 2.2 Código duplicado

| # | Dónde | Qué se repite | Cómo corregir |
|---|---|---|---|
| D1 | `modules/ClinicalAreaModule`, `AdministrativeAreaModule`, `InstitutionalManagementModule`, `SupportModule` | Esqueleto completo: estado `redirectModalOpen/redirectPortal/redirectUrl` + `handleAppClick` + hero de saludo + grid de `AppCard` + `<RedirectModal/>` | Extraer un layout/hook común `useModulePage(moduleId)` y un componente `ModuleAppGrid` |
| D2 | `ClinicalAreaPanel`, `AdministrativeAreaPanel`, `InstitutionalManagementPanel`, `SupportPanel` | Misma versión mini del punto anterior (9 archivos en total con el patrón AppCard+RedirectModal) | Reusar el mismo hook/componente de D1 |
| D3 | `HomeModule.tsx:31-62`, `DirectoryModule.tsx:48-54`, `ITSupportContactsModal.tsx:27-33` | Listas de roles repetidas (`canSeeAdministrativePanel` ≡ `canSeeInstitutionalPanel`; set TI `[admin, root, ti, coordinador_ti, ingeniero_sistemas, sistemas]`) | Util compartido `hasRole(user, roles[])` en `src/app/utils/roles.ts` |
| D4 | `SystemContext.tsx:173-178` + `ClinicalAreaModule`, `ClinicalAreaPanel`, `AdministrativeAreaModule`, `AdministrativeAreaPanel`, `InstitutionalManagementModule`, `InstitutionalManagementPanel`, `SupportModule` | Catálogo de apps mock ("DGH…", "Enterprise…", "ActualPac…", "biometric…", "almera…", "GLPI…") hardcodeado 2-3 veces | **Mover a BD**: cargar desde `GET /api/modules` + `GET /api/sites` (ver fase 4) |
| D5 | `ContractManagementCompleteModal.tsx` vs `ContractManagementNewModal.tsx` | 1033 vs 558 líneas casi idénticas (difieren en props `current/currentJob`, `profile/profiles`) | Unificar en un solo modal parametrizado |
| D6 | `AccessRequestModal` y `PasswordResetModal` | Overlay/header/success-check idénticos | Componente `ModalShell` común |
| D7 | `DirectoryModule.tsx:312-323` | Filtro de correos calculado 2 veces | Calcular una sola vez (useMemo) |

### 2.3 Imports sin uso (corregir al tocar cada archivo)
- `admin/views/AnunciosPendientesView.tsx:1` → `CheckCircle`, `XCircle`
- `admin/views/CalendarioCumpleaniosView.tsx:1` → `X`
- `admin/views/CalendarioEventosView.tsx:1` → `X`
- `admin/views/ConsultaExternaView.tsx:1` → `X`, `Stethoscope`
- `admin/views/CrearAnuncioView.tsx:1` → `CalendarIcon`
- `admin/views/DashboardComunicacionesView.tsx:1` → `Calendar`, `FileText`, `Users`
- `admin/views/FormatosContingenciaView.tsx:1` → `X`, `FileLock`
- `admin/views/LogrosAcreditacionesView.tsx:1` → `Pencil`
- `admin/views/TareasSeguimientoView.tsx:1` → `Eye`
- `admin/views/UsuariosComunicacionesView.tsx:1` → `Users`, `Shield`
- `modals/AccreditationAchievementsModal.tsx:1-2` → `DialogHeader/DialogTitle/DialogDescription`, `Pencil/EyeOff/Eye`
- `modals/ContingencyFormatsModal.tsx:1` → `FileDown`
- `modals/ExternalConsultationModal.tsx:1-2` → `Settings`, `useState`
- `modals/ITSupportContactsModal.tsx:1` → `Wrench`
- `modals/RedirectModal.tsx:1` → `DialogHeader/DialogTitle/DialogDescription`
- `modules/AdministrativeAreaModule.tsx:1` → `FileText`, `Plus`, `CheckCircle`
- `modules/ClinicalAreaModule.tsx:1` → `ClipboardList`
- `modules/DirectoryModule.tsx:1` → `FileUp`
- `modules/InnovacionAnaliticaModule.tsx:1-2` → `Plus`, `useState`
- `modules/SupportModule.tsx:1` → `Stethoscope`, `Globe`
- `ui/dialog.tsx:5` → `XIcon`

### 2.4 Variables/estados sin uso
- `Header.tsx:10` → `adminLogout` (desestructurado y nunca usado)
- `QuickAccessSection.tsx:36` → `user` (de `useAuth`, nunca leído)
- `ExternalConsultationModal.tsx:12` → `user` (nunca leído)
- `RegisterAnnouncementModal.tsx:19` → `publishAnnouncement`, `announcements` (sin usar)
- `AdministrativeAreaModule.tsx:16` → `contractMatrixOpen` (se setea pero nunca se lee)
- `AccreditationAchievementsModal.tsx:78,87` → `handleToggleActive` y `handleStartEdit` definidas y nunca invocadas (edición inalcanzable)
- `RegisterAnnouncementModal.tsx:66-70` → hack roto `import("react").then(React => React.useEffect(...))` (eliminar)
- `Navigation.tsx:26,34` → `activeDropdown`/`toggleDropdown` (dropdown inalcanzable, ningún item del menú tiene `children`)

### 2.5 Datos mock / credenciales duplicadas
- **Credenciales `root`/`icvc2024**` en 4 sitios:** `AuthContext.tsx:131` + `INITIAL_USERS` (:83-96), `AdminAuthContext.tsx:22`, `Login.tsx:103-104`, `AdminLoginModal.tsx:126-129` → centralizar en una constante `src/app/utils/dev-credentials.ts` (o quitar al conectar el login real).
- **Lista de roles duplicada:** `UserRole` (AuthContext) vs `COM_ROLES` (UsuariosComunicacionesView) vs `<option>` de UserManagementModule (muerto) vs `COM_ACTIONS` (PermisosComunicacionesView).
- **localStorage keys compartidas:** `admin_birthdays` (BirthdayWall, CalendarioCumpleaniosView, CommunicationsModule) y `admin_events` (CalendarioEventosView, CommunicationsModule).

### 2.6 Recomendación de limpieza
Hacer la limpieza **al final de cada fase de conexión** (no antes): primero se reemplaza el origen de datos por el backend y luego se eliminan los archivos/lógica que quedan sin uso. Esto evita romper la UI en desarrollo. La limpieza estructural grande (D1, D2, D5, módulos muertos, ~40 shadcn) se hace en la **Fase 8**.

---

## 3. Arquitectura del backend

### 3.1 Stack
- Spring Boot **3.5.x** / Java **21**
- Spring Data JPA + PostgreSQL
- Flyway para migraciones (hoy vacías → se crean DDL reales)
- Spring Security (se mantiene; actualmente `permitAll`)
- Lombok, Spring Validation, Spring Actuator

### 3.2 Capas y paquetes
```
co.com.icvc.intranet_backend
├── config/          → SecurityConfig (ya existe), CORS, Multipart, Jackson
├── security/        → (futuro) JWT / autenticación por rol para el Panel de Control
├── common/          → Response wrapper, manejo de excepciones (ExceptionHandler), mapeo de enums
├── user/            → dominio genusuario, gensolusuario, genlogs, gencargointra
│   ├── controller/  → UserController, AccessRequestController, AuthController
│   ├── service/     → UserService, AccessRequestService, AuthService
│   ├── repository/  → UserRepository, AccessRequestRepository, LogRepository, CargoRepository
│   ├── entity/      → Usuario, SolicitudUsuario, LogAuditoria, CargoIntra
│   └── dto/         → request/response DTOs + mappers
├── communication/   → comanuncio, comtarsegui, comlogroacredi, comrol/compermisos
├── directory/       → gendircextenciones, gendircorreo, genarea, genpiso
├── portal/          → genmodulo, gensitredireccion, genarchivo (apps + archivos)
├── assistance/      → asiconextern, asiforcontin, asiforconarchivo
└── innovation/      → innovanalitica
```

### 3.3 Estándares por dominio
- **Controller:** REST, DTOs de entrada con validación `jakarta.validation` (`@NotBlank`, `@Size`, `@Email`…), DTOs de salida sin entidades.
- **Service:** lógica de negocio, transacciones `@Transactional`, mapeo DTO↔entidad (manual o MapStruct).
- **Repository:** Spring Data JPA (`JpaRepository`), consultas derivadas y `@Query` según necesidad.
- **Entity:** `@Entity` + `@Table`, mapeo de enums de BD (`@Enumerated(EnumType.STRING)`), columnas `oid` como PK.
- **Errores:** `@RestControllerAdvice` con `ProblemDetail`/`ErrorResponse` uniforme.
- **Enums de BD (USER-DEFINED):** definir valores estándar en Java y en la migración (ver §5).
- **Auditoría:** registrar en `genlogs` (usuario, acción, tabla, valores antes/después, IP) vía servicio central `AuditService`.

### 3.4 Seguridad
- **Ahora:** mantener `SecurityFilterChain` con `permitAll` (el portal es público). El `SecurityConfig` ya está preparado en `src/main/java/.../security/SecurityConfig.java`.
- **Siguiente fase (fuera de este plan):** autenticación con JWT + roles para proteger únicamente el **Panel de Control** (endpoints `/api/admin/**`). Las credenciales se validarán contra `genusuario` (hash en `genusuclahash`) y el rol administrativo contra `comrol`/`comusuario`.

### 3.5 Configuración de aplicación
- `application-dev/prod/test.yml` ya limpios de LDAP/Kerberos (hecho).
- Añadir: `spring.servlet.multipart.max-file-size`, CORS para `localhost:5173` en dev, y `management.endpoints` (ya presente).

---

## 4. API REST por dominio (mapeo frontend ↔ tablas)

> Base URL: `/api`. El frontend consumirá estos endpoints reemplazando los contexts mock.
> Referencia de entidades TS del frontend en §5.

### 4.1 Autenticación y usuarios (`genusuario`, `gensolusuario`, `genlogs`, `gencargointra`, `genarea`)
| Método | Endpoint | Descripción | Operación frontend que reemplaza |
|---|---|---|---|
| POST | `/api/auth/login` | Login real contra `genusuario` (verifica hash). Devuelve usuario + token (futuro). | `AuthContext.login` (la clave de prueba NO es real) |
| POST | `/api/auth/logout` | Cerrar sesión | `AuthContext.logout` |
| GET | `/api/me` | Usuario autenticado actual | (nuevo; sustituye al viejo `/api/session/me` ya eliminado) |
| GET | `/api/users` | Listar usuarios | `useAuth.users` / `GeneralesUsuariosView` |
| POST | `/api/users` | Crear usuario | `addUser` |
| PUT | `/api/users/{username}` | Actualizar usuario | `updateUser` |
| PATCH | `/api/users/{username}/status` | Activar/desactivar | `toggleUserStatus` |
| PATCH | `/api/users/{id}/password` | Reset de contraseña (a identificación) | `resetPassword` |
| GET | `/api/access-requests` | Listar solicitudes de acceso | `useAuth.accessRequests` |
| POST | `/api/access-requests` | Crear solicitud | `addAccessRequest` |
| POST | `/api/access-requests/{id}/approve` | Aprobar | `approveAccessRequest` |
| POST | `/api/access-requests/{id}/reject` | Rechazar | `rejectAccessRequest` |
| GET/POST | `/api/password-reset-requests` | Listar/crear solicitudes de reset | `passwordResetRequests` / `addPasswordResetRequest` |
| POST | `/api/password-reset-requests/{id}/complete` | Completar reset | `resetPassword` |
| GET | `/api/cargos` | Listar cargos (`gencargointra`) | `GeneralesUsuariosView` (modo cargos) |
| GET | `/api/areas` | Listar áreas (`genarea`) | Directorio / filtros |

### 4.2 Anuncios (`comanuncio`, `comanuncioarchivo`, `comtipoanuncio`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/announcements` | Listar (filtros: `?estado=&publicado=&desde=&hasta=`) |
| POST | `/api/announcements` | Crear anuncio |
| PUT | `/api/announcements/{id}` | Actualizar |
| DELETE | `/api/announcements/{id}` | Borrado lógico (`comanueliminado`) |
| POST | `/api/announcements/{id}/publish` | Publicar (`comanuestado`) |
| POST | `/api/announcements/{id}/files` | Adjuntar archivo (→ `comanuncioarchivo` + `genarchivo`) |
| GET | `/api/announcement-types` | Tipos (`comtipoanuncio`) → campo "tipo" del frontend |

### 4.3 Tareas de seguimiento (`comtarsegui`, `comtarcome`, `comtareaarchivo`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/tasks` | Listar (filtros por asignado/estado/prioridad) |
| POST | `/api/tasks` | Crear (`comusuarioasig`, `comusuarioqasig`) |
| PUT | `/api/tasks/{id}` | Actualizar |
| POST | `/api/tasks/{id}/complete` | Completar (`comtarestad`) |
| POST | `/api/tasks/{id}/comments` | Comentario (`comtarcome`) |
| POST | `/api/tasks/{id}/files` | Archivo adjunto (`comtareaarchivo`) |

### 4.4 Logros y acreditaciones (`comlogroacredi`, `comlogroarchivo`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/achievements` | Listar |
| POST | `/api/achievements` | Crear |
| PUT | `/api/achievements/{id}` | Actualizar |
| DELETE | `/api/achievements/{id}` | Eliminar |
| POST | `/api/achievements/{id}/files` | Adjuntar imagen/archivo |

### 4.5 Directorio (`gendircextenciones`, `gendircorreo`, `genarea`, `genpiso`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/directory/extensions` | Extensiones (`DirectoryEntry`, `ExtensionsModal`) |
| GET/POST/PUT/DELETE | `/api/directory/emails` | Correos (`InstitutionEmail`, `ITSupportContactsModal`) |
| GET | `/api/directory/floors` | Pisos (`genpiso`) |
| GET | `/api/directory/areas` | Áreas (`genarea`) |

### 4.6 Roles y permisos de comunicaciones (`comrol`, `compermisos`, `comrolpermiso`, `comusuario`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/communication/roles` | Roles (`Role`, `PermisosComunicacionesView`) |
| GET/POST/PUT/DELETE | `/api/communication/permissions` | Permisos (`RolePermission`) |
| GET | `/api/communication/users` | Usuarios de comunicaciones (`UsuariosComunicacionesView`) |
| POST | `/api/communication/users/{id}/roles` | Asignar rol a usuario (`comusuario`) |
| PUT | `/api/communication/users/{id}/roles` | Cambiar rol / estado |

### 4.7 Apps y sitios — CENTRO UNIFICADO (`genmodulo`, `gensitredireccion`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/modules` | Módulos del portal (`genmodulo`) |
| GET | `/api/sites?moduleId=` | Apps/sitios por módulo (`gensitredireccion`) |
| POST | `/api/sites` | Crear sitio (admin) |
| PUT/DELETE | `/api/sites/{id}` | Actualizar/eliminar (admin) |
| PATCH | `/api/sites/{id}/active` | Activar/desactivar |

> **Impacto:** los grid de `AppCard` de todos los módulos (D4) cargarán desde `/api/sites`; el catálogo mock de `SystemContext` y los módulos se elimina.

### 4.8 Asistencial (`asiconextern`, `asiforcontin`, `asiforconarchivo`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/external-sites` | EPS / sitios externos (`EpsPlatform`) |
| GET/POST/PUT/DELETE | `/api/contingency-formats` | Formatos de contingencia (`ContingencyFormat`) |
| POST | `/api/contingency-formats/{id}/files` | Archivos (`asiforconarchivo`) |

### 4.9 Innovación (`innovanalitica`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/innovation-links` | Enlaces de innovación/analítica (`InnovacionAnaliticaModule`) |

### 4.10 Archivos (`genarchivo`)
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/files` | Subida multipart (crea `genarchivo` + registro en tabla puente según contexto) |
| GET | `/api/files/{id}` | Descarga/streaming |
| DELETE | `/api/files/{id}` | Eliminación física/lógica |

### 4.11 Auditoría y logs (`genlogs`)
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/logs` | Listar auditoría (filtros por usuario/tabla/fecha) |
| POST | `/api/logs` | Registro manual de acción (usado por el servicio central `AuditService`) |

---

## 5. Modelo de datos — entidades JPA y migraciones Flyway

### 5.1 Migraciones a crear
Las migraciones actuales están vacías. Se reescriben/crean en orden (convención Flyway):

| Migración | Contenido |
|---|---|
| `V1__baseline.sql` | Reescribir con el esquema base completo (todas las tablas, enums, PK, FK, índices) según `docs/DATABASE.md` |
| `V2__...` en adelante | Cambios evolutivos por dominio a medida que se implemente |

> **Nota:** la BD real ya tiene el esquema (hay `flyway_schema_history`). Usar `baseline-on-migrate: true` (ya configurado) para no reintentar `V1`. Para entornos nuevos, `V1` creará el esquema desde cero.

### 5.2 Entidades JPA por dominio (mapeo 1:1 con las tablas)
| Dominio | Entidad | Tabla |
|---|---|---|
| user | `Usuario` | `genusuario` |
| user | `CargoIntra` | `gencargointra` |
| user | `SolicitudUsuario` | `gensolusuario` |
| user | `LogAuditoria` | `genlogs` |
| communication | `Anuncio` | `comanuncio` |
| communication | `TipoAnuncio` | `comtipoanuncio` |
| communication | `ArchivoAnuncio` | `comanuncioarchivo` |
| communication | `TareaSeguimiento` | `comtarsegui` |
| communication | `ComentarioTarea` | `comtarcome` |
| communication | `ArchivoTarea` | `comtareaarchivo` |
| communication | `LogroAcreditacion` | `comlogroacredi` |
| communication | `ArchivoLogro` | `comlogroarchivo` |
| communication | `Rol` | `comrol` |
| communication | `Permiso` | `compermisos` |
| communication | `RolPermiso` | `comrolpermiso` |
| communication | `UsuarioComunicacion` | `comusuario` |
| directory | `Area` | `genarea` |
| directory | `Piso` | `genpiso` |
| directory | `ExtensionDirectorio` | `gendircextenciones` |
| directory | `CorreoDirectorio` | `gendircorreo` |
| portal | `Modulo` | `genmodulo` |
| portal | `SitioRedireccion` | `gensitredireccion` |
| portal | `Archivo` | `genarchivo` |
| portal | `EquipoDominio` | `genequipodominio` |
| assistance | `SitioExterno` | `asiconextern` |
| assistance | `FormatoContingencia` | `asiforcontin` |
| assistance | `ArchivoFormato` | `asiforconarchivo` |
| innovation | `EnlaceInnovacion` | `innovanalitica` |

### 5.3 Enums Java (valores estándar propuestos)
> Coincidir con los estados que ya usa la UI.

| Enum Java | Columna BD | Valores |
|---|---|---|
| `EstadoAnuncio` | `comanuncio.comanuestado` | `PENDIENTE, PUBLICADO, RECHAZADO, VENCIDO` |
| `EstadoTarea` | `comtarsegui.comtarestad` | `PENDIENTE, EN_PROGRESO, COMPLETADA` |
| `PrioridadTarea` | `comtarsegui.comtarprior` | `ALTA, MEDIA, BAJA` |
| `EstadoSolicitud` | `gensolusuario.gensolusuesta` | `PENDIENTE, APROBADA, RECHAZADA` |

### 5.4 Mapeo con tipos TS del frontend
| TS (frontend) | Entidad/API |
|---|---|
| `User` / `UserRole` (14 roles) | `genusuario` + `comrol`/`comusuario` (mapear roles TS ↔ `comrol`) |
| `AccessRequest` | `gensolusuario` (estados `pending/approved/rejected` ↔ enum `EstadoSolicitud`) |
| `PasswordResetRequest` | `gensolusuario`/`genusuario` + tabla de solicitudes de reset |
| `Announcement` | `comanuncio` (campo `published` TS ↔ `EstadoAnuncio` PUBLICADO) |
| `Task` | `comtarsegui` (+ `comtarcome`, `comtareaarchivo`) |
| `Achievement` | `comlogroacredi` (+ `comlogroarchivo`) |
| `Role` / `RolePermission` | `comrol` / `comrolpermiso` / `compermisos` |
| `RedirectSite` | `gensitredireccion` (`type image/icon` ↔ `gensitredicon`) |
| `DirectoryEntry` / `InstitutionEmail` | `gendircextenciones` / `gendircorreo` |
| `EpsPlatform` | `asiconextern` |
| `ContingencyFormat` | `asiforcontin` |
| `SupportContact` | `gendircorreo`/`gendircextenciones` con `isSupport` |
| `AccessRecord` / `LogEntry` | `genlogs` |

---

## 6. Conexión del frontend — fases de implementación

### Fase 1 — Infraestructura de consumo
- Crear cliente API: `src/app/api/client.ts` (wrapper `fetch` con base `/api`, manejo de errores, `JSON` parse, timeout).
- Crear helpers tipados por dominio (`src/app/api/*.ts`) o `react-query`/`SWR` (opcional) para carga de datos.
- Configurar en `vite.config.ts` el proxy `/api → http://localhost:8080` (ya existe) y CORS en backend.
- **Aceptación:** `curl` a un endpoint del backend funciona desde el frontend en dev.

### Fase 2 — Autenticación y usuarios
- Backend: `AuthController` (`/api/auth/login`, `/api/me`), `UserController`, `AccessRequestController`, `PasswordResetController`, `CargoController`, `AreaController`.
- Frontend: reemplazar `AuthContext` (login contra API, carga de usuarios, solicitudes de acceso, reset). Eliminar credenciales de prueba de `AuthContext`/`AdminAuthContext` (mover a constante dev si se conserva).
- **Aceptación:** login real valida contra `genusuario`; `useAuth.user` viene del backend; alta/activación/solicitudes persisten en BD.

### Fase 3 — Anuncios, tareas y logros
- Backend: controllers de anuncios (+tipos+archivos), tareas (+comentarios+archivos), logros.
- Frontend: reemplazar `AnnouncementsContext` y las vistas `CrearAnuncio`, `AnunciosPendientes`, `HistorialAnuncios`, `CalendarioAnuncios`, `DashboardComunicaciones`, `TareasSeguimiento`, `ComunicacionesTareas`, `LogrosAcreditaciones`, `AccreditationAchievementsModal`.
- **Aceptación:** publicar/editar/eliminar anuncio, completar tarea, agregar comentario, CRUD de logros — todo persiste en BD.

### Fase 4 — Apps y directorio (centro unificado)
- Backend: `ModuleController` + `SiteController` (`/api/modules`, `/api/sites`), `DirectoryController` (extensiones, correos, pisos, áreas).
- Frontend: reemplazar `SystemContext` en lo relativo a sitios/módulos y directorio. **Eliminar el catálogo de apps mock (D4)** de `SystemContext` y los 6 módulos; los `AppCard` cargan desde `/api/sites?moduleId=`.
- **Aceptación:** el grid de apps de todos los módulos refleja lo configurado en el Panel (Generales → Sitio de Redirección); directorio con extensiones/correos reales.

### Fase 5 — Roles y permisos de comunicaciones
- Backend: `CommunicationRoleController` (`/api/communication/roles|permissions|users`).
- Frontend: reemplazar `UsuariosComunicacionesView` y `PermisosComunicacionesView`; mapear `UserRole` del TS con los `comrol` de BD.
- **Aceptación:** asignar rol a usuario y ver los permisos reflejados en la UI.

### Fase 6 — Asistencial e innovación
- Backend: `ExternalSiteController` (`asiconextern`), `ContingencyFormatController` (`asiforcontin`+archivos), `InnovationLinkController`.
- Frontend: conectar `ConsultaExternaView`, `AsistencialEpsView`, `FormatosContingenciaView`, `AsistencialFormatsView`, `InnovacionAnaliticaView`, `InnovacionAnaliticaModule`.
- **Aceptación:** EPS, formatos y enlaces de innovación persistidos y mostrados desde API.

### Fase 7 — Archivos y auditoría
- Backend: `FileController` (`/api/files`) con almacenamiento (disco/S3 según entorno) + `genarchivo`; `AuditService` + `LogController`.
- Frontend: uploads de anuncios/tareas/logros/formatos por API; `LogsView` y `LogsModule` consumen `/api/logs` (reemplazar `AccessRecord` mock).
- **Aceptación:** subir/descargar archivos; las acciones de los administradores quedan registradas en `genlogs`.

### Fase 8 — Limpieza de código muerto y duplicación
- Eliminar módulos muertos: `CommunicationsModule`, `IntranetAdminModule`, `LogsModule`, `UserManagementModule`.
- Eliminar modales muertos (13) y sus imports transitivos (`TaskModal`, `NewTaskModal`, `badge`, `select`, `input`).
- Eliminar componentes shadcn sin uso (~40).
- Aplicar D1/D2 (hook `useModulePage` + `ModuleAppGrid`), D3 (util `roles.ts`), D5 (unificar modales de contratos), D6 (`ModalShell`), D7 (`useMemo`).
- Limpiar imports y variables sin uso (§2.3–2.4) en los archivos que permanecen.
- **Aceptación:** `npm run build` sin warnings de TS; el bundle baja notablemente de tamaño.

---

## 7. Prioridades, verificación y riesgos

### 7.1 Orden recomendado de implementación
| Prioridad | Dominio | Fase |
|---|---|---|
| Alta | Autenticación + usuarios | Fase 2 |
| Alta | Anuncios | Fase 3 |
| Alta | Apps/sitios + directorio (centro unificado) | Fase 4 |
| Media | Tareas y logros | Fase 3 |
| Media | Roles/permisos comunicaciones | Fase 5 |
| Baja | Asistencial + innovación | Fase 6 |
| Baja | Archivos + auditoría | Fase 7 |
| Mantenimiento | Limpieza código muerto/duplicado | Fase 8 |

### 7.2 Pruebas por fase
- **Backend:** `./mvnw test` (tests de servicio/controller con H2 o Testcontainers), pruebas de migración Flyway, y verificación manual con `curl`:
  ```bash
  curl -s http://localhost:8080/api/announcements
  curl -s -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"username":"...","password":"..."}'
  ```
- **Frontend:** `npm run build` (typecheck) y `npm run dev` contra el proxy `/api`.
- **Integración:** crear/escribir datos desde el Panel de Control y verificar que el portal público los muestra.

### 7.3 Riesgos y consideraciones
| Riesgo | Mitigación |
|---|---|
| Credenciales mock no reales | El login real valida contra `genusuario` (hash); las claves de prueba NO se siembran como válidas. |
| Migraciones Flyway vacías | Crear `V1` real con `baseline-on-migrate: true` para no romper la BD existente. |
| Enums sin valores definidos | Definir valores estándar en la migración y en Java (§5.3), alineados con los estados de la UI. |
| Seguridad abierta (`permitAll`) | Aceptable para el portal público; proteger `/api/admin/**` con JWT+roles en la siguiente fase. |
| Frontend 100% mock → API | Migrar por fases: cada fase reemplaza un context; no se rompe la UI si una fase queda a medias. |
| 12.000 líneas de código muerto | Limpiar al final (Fase 8) para no entorpecer el desarrollo; usar el inventario de §2. |
| Tablas sin consumo (`genlogs` parcial, `genequipodominio`) | `genlogs` se integra en Fase 7; `genequipodominio` queda disponible para sincronización de equipos de dominio (futuro). |

---

*Documento generado a partir del análisis del backend, la BD (`docs/DATABASE.md`) y el inventario del frontend.*