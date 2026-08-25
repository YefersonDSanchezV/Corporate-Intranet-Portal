# Backend — Implementación de la API REST de la Intranet

> **Proyecto:** Intranet Institucional (ICVC)
> **Fecha:** 2026-08-19
> **Base:** `docs/DATABASE.md` (esquema real de 28 tablas de negocio + `flyway_schema_history`) y `docs/PLAN_IMPLEMENTACION.md` (arquitectura y API por dominio).

## 1. Qué se implementó

Se implementó la capa completa de backend sobre el esqueleto Spring Boot 3.5 / Java 21 existente:

- **Paquetes por dominio (DDD-lite)** con entidades JPA, repositorios, servicios, controladores REST y DTOs (request/response con mappers manuales) para los dominios `user`, `communication`, `directory`, `portal`, `assistance` e `innovation`.
- **Infraestructura común**: `ErrorResponse` + `@RestControllerAdvice` global (errores `404/400/409/500`), excepciones de dominio, utilidades de mapeo (`common/mapper/Mappers`) y utilidad de IP (`common/web/HttpUtils`).
- **Enums de BD** alineados con los tipos `USER-DEFINED` (mapeados con `@Enumerated(EnumType.STRING)` + `@JdbcTypeCode(SqlTypes.NAMED_ENUM)`).
- **Auditoría central** (`AuditService`) que escribe en `genlogs` (usuario, acción, tabla, valores antes/después, IP, fecha), inyectada en los servicios clave (ej. gestión de usuarios).
- **Seguridad**: se mantuvo `permitAll`; se agregó `AdminApiPlaceholderFilter` que reserva el área administrativa (`/api/admin/**`) para la futura autenticación JWT + roles.
- **Migración Flyway V1 reescrita** con el esquema completo (ver `docs/DB_CHANGES.md`).
- **Subida/descarga de archivos** centralizada en `genarchivo` + tablas puente (`comanuncioarchivo`, `comtareaarchivo`, `comlogroarchivo`, `asiforconarchivo`).

## 2. Arquitectura y paquetes

```
co.com.icvc.intranet_backend
├── config/          → CorsConfig (localhost:5173/3000 para /api/**)
├── security/        → SecurityConfig (permitAll), PasswordConfig (BCrypt), AdminApiPlaceholderFilter
├── common/
│   ├── api/         → ErrorResponse
│   ├── exception/   → NotFoundException, ValidationException, ConflictException
│   ├── mapper/      → Mappers (trimToNull, enumValue, now)
│   └── web/         → GlobalExceptionHandler, HttpUtils
├── user/            → genusuario, gencargointra, gensolusuario, genlogs
│   ├── entity/ repository/ service/ controller/ dto/ enums/
├── communication/   → comanuncio, comtipoanuncio, comtarsegui, comtarcome,
│                      comlogroacredi, comrol, compermisos, comrolpermiso,
│                      comusuario + puentes de archivos
├── directory/       → genarea, genpiso, gendircextenciones, gendircorreo
├── portal/          → genmodulo, gensitredireccion, genarchivo, genequipodominio
├── assistance/      → asiconextern, asiforcontin, asiforconarchivo
└── innovation/      → innovanalitica
```

Capas por dominio: `controller` (REST + validación Jakarta), `service` (`@Transactional`, lógica de negocio, auditoría), `repository` (Spring Data JPA), `entity` (mapeo 1:1 con las tablas), `dto` (records de request/response con mappers estáticos `from(entity)`).

## 3. Endpoints finales

### Autenticación y usuarios
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login contra `genusuario` (BCrypt sobre `genusuclahash`) |
| POST | `/api/auth/logout` | Cierra sesión (no-op: sin JWT aún) |
| GET | `/api/me?username=` | Usuario autenticado (temporalmente por username; en el futuro desde el principal JWT) |
| GET/POST | `/api/users` | Listar / crear usuario (hash BCrypt) |
| PUT | `/api/users/{username}` | Actualizar usuario |
| PATCH | `/api/users/{username}/status` | Activar/desactivar |
| PATCH | `/api/users/{id}/password` | Reset contraseña (por defecto a identificación) |
| GET/POST | `/api/access-requests` | Listar / crear solicitudes de acceso |
| POST | `/api/access-requests/{id}/approve` | Aprobar (estado APROBADA) |
| POST | `/api/access-requests/{id}/reject` | Rechazar (estado RECHAZADA) |
| GET/POST | `/api/password-reset-requests` | Listar / crear solicitudes de reset (modeladas en `gensolusuario` con marcador `RESET_PASSWORD`) |
| POST | `/api/password-reset-requests/{id}/complete` | Completa el reset (setea la contraseña a la identificación) |
| GET | `/api/cargos` | Cargos (`gencargointra`) |
| GET | `/api/areas` | Áreas (`genarea`) |
| GET/POST | `/api/logs` | Listar auditoría (`genlogs`, filtro `?tabla=`) / registrar acción manual |

### Anuncios
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST | `/api/announcements` | Listar (`?estado=`) / crear (estado PENDIENTE) |
| PUT/DELETE | `/api/announcements/{id}` | Actualizar / borrado lógico (`comanueliminado`) |
| POST | `/api/announcements/{id}/publish` | Publicar (PENDIENTE→PUBLICADO) |
| POST | `/api/announcements/{id}/files` | Adjuntar archivo (`comanuncioarchivo` + `genarchivo`) |
| GET | `/api/announcement-types` | Tipos de anuncio (`comtipoanuncio`) |

### Tareas
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST | `/api/tasks` | Listar / crear (estado PENDIENTE) |
| PUT | `/api/tasks/{id}` | Actualizar |
| POST | `/api/tasks/{id}/complete` | Completar (→ COMPLETADA) |
| POST/GET | `/api/tasks/{id}/comments` | Comentarios (`comtarcome`) |
| POST | `/api/tasks/{id}/files` | Archivo adjunto (`comtareaarchivo`) |

### Logros y acreditaciones
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST | `/api/achievements` | Listar / crear |
| PUT/DELETE | `/api/achievements/{id}` | Actualizar / eliminar |
| POST | `/api/achievements/{id}/files` | Adjuntar imagen/archivo (`comlogroarchivo`) |

### Directorio
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/directory/extensions` | Extensiones (`gendircextenciones`) |
| GET/POST/PUT/DELETE | `/api/directory/emails` | Correos (`gendircorreo`) |
| GET | `/api/directory/floors` | Pisos (`genpiso`) |
| GET | `/api/directory/areas` | Áreas (`genarea`) |

### Roles y permisos de comunicaciones
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/communication/roles` | Roles (`comrol`) con permisos asociados (`comrolpermiso`) |
| GET/POST/PUT/DELETE | `/api/communication/permissions` | Permisos (`compermisos`) |
| GET | `/api/communication/users` | Usuarios de comunicación (`comusuario`) |
| POST/PUT | `/api/communication/users/{id}/roles` | Asignar / actualizar rol y estado |

### Apps, sitios y archivos (centro unificado)
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST | `/api/modules` | Módulos (`genmodulo`) / crear |
| PATCH | `/api/modules/{id}/active` | Activar/desactivar módulo |
| GET | `/api/sites?moduleId=` | Apps/sitios por módulo (`gensitredireccion`) |
| POST/PUT/DELETE | `/api/sites[/{id}]` | CRUD de sitios |
| PATCH | `/api/sites/{id}/active` | Activar/desactivar (ver limitación abajo) |
| POST | `/api/files` | Subida multipart → `genarchivo` |
| GET | `/api/files/{id}` | Descarga/streaming |
| DELETE | `/api/files/{id}` | Eliminación física |

### Asistencial
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/external-sites` | EPS/sitios externos (`asiconextern`) |
| GET/POST/PUT/DELETE | `/api/contingency-formats` | Formatos de contingencia (`asiforcontin`) |
| POST | `/api/contingency-formats/{id}/files` | Archivos (`asiforconarchivo`) |

### Innovación
| Método | Endpoint | Descripción |
|---|---|---|
| GET/POST/PUT/DELETE | `/api/innovation-links` | Enlaces (`innovanalitica`) |

## 4. Decisiones de diseño y patrones

- **DTOs como records** agrupados por dominio (`UsuarioDtos`, `AnuncioDtos`, etc.) con validación Jakarta en los request y mappers estáticos `from(entity)` en los response. Sin exponer entidades JPA.
- **Mappers manuales** en el paquete `dto` de cada dominio; `common/mapper/Mappers` centraliza utilidades reutilizables (`trimToNull`, `enumValue`, `now`).
- **Errores uniformes**: `ErrorResponse` (timestamp, status, error, message, path, fieldErrors) producido por `GlobalExceptionHandler`.
- **Enums**: valores estándar Java (`EstadoAnuncio`, `EstadoTarea`, `PrioridadTarea`, `EstadoSolicitud`) mapeados a los tipos `USER-DEFINED` de PostgreSQL vía `NAMED_ENUM`. La migración V1 crea esos tipos con el mismo nombre (entre comillas) para entornos nuevos.
- **Auditoría**: `AuditService` inyectado en los servicios que generan cambios de interés (usuarios); registra en `genlogs`. Es un enfoque simple por inyección, no AOP.
- **PK `oid`**: todas las tablas usan `@GeneratedValue(IDENTITY)` sobre `oid`; la migración V1 define `oid integer GENERATED BY DEFAULT AS IDENTITY`.
- **Borrado lógico de anuncios** (`comanueliminado`) en lugar de DELETE físico; logros y otros catálogos usan DELETE físico.
- **Archivos**: `FileService` centraliza el almacenamiento en disco (`./uploads`, configurable con `app.upload.dir`) y registra en `genarchivo`; cada dominio crea su registro puente. La descarga devuelve `Resource` con `Content-Disposition`.

## 5. Compilar, ejecutar y probar

Compilar/empaquetar (sin tests):

```bash
./mvnw clean package -DskipTests
```

Tests unitarios (no requieren base de datos):

```bash
./mvnw test
```

> 15 pruebas: 14 unitarias (mapeo DTO↔entidad, lógica de estados publicar/completar/aprobar/rechazar, utilidades de mapeo) + 1 de contexto `@SpringBootTest` **deshabilitada** (`@Disabled`) porque levantar el contexto completo requiere PostgreSQL. Para ejecutarla, correr con una BD alcanzable configurada en `dev.properties`/`application-test.yml`:
> `./mvnw test -Dtest=IntranetBackendApplicationTests`

Ejecutar:

```bash
./mvnw spring-boot:run
```

El backend arranca en `http://localhost:8080` (puerto configurable con `SERVER_PORT`). Usa `flyway.baseline-on-migrate: true` (la BD real ya tiene el esquema). El directorio de subida de archivos se crea en `./uploads`.

## 6. Estado (implementado / pendiente)

### Implementado
- Capa completa (entity/repository/service/controller/DTO) para los 6 dominios del alcance.
- Enums, errores uniformes, auditoría en `genlogs`, CORS, subida/descarga de archivos.
- Migración `V1__baseline.sql` con el esquema completo.
- Tests unitarios y ajuste del test de contexto.

### Pendiente / limitaciones documentadas
- **`/api/admin/**`**: no protegido aún (portal público). `AdminApiPlaceholderFilter` reserva el punto de extensión; se protegerá con JWT + roles (`comrol`/`comusuario`) en la siguiente fase. Las credenciales de prueba del frontend (`root`/`icvc2024**`) NO son válidas en el backend.
- **`/api/me`**: recibe `?username=` temporalmente; será reemplazado por el principal de JWT.
- **`PATCH /api/sites/{id}/active`**: `gensitredireccion` no tiene columna de estado activo; el endpoint responde el sitio sin persistir cambios. Requiere un cambio evolutivo de esquema (V6) si se quiere persistir la activación.
- **Solicitudes de reset de contraseña**: no hay tabla dedicada; se modelan en `gensolusuario` con el marcador `RESET_PASSWORD` en observaciones.
- **Enums de la BD real**: los nombres de los tipos `USER-DEFINED` existentes en la BD real pueden diferir de los Java; si `ddl-auto: validate` falla al arrancar contra la BD real, alinear el `CREATE TYPE`/tipo real (ver `docs/DB_CHANGES.md`).
- **`genequipodominio`**: entidad creada (plan §5.2) pero sin endpoints (sin consumo en el frontend).
- **Login con usuarios existentes**: el hash se espera BCrypt; los usuarios creados vía API se guardan así. Registros preexistentes con otro formato de hash no podrán autenticarse hasta re-hashearlos.