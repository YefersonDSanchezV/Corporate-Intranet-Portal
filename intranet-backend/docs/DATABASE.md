# Documentación de la Base de Datos — Intranet Institucional

> **Motor:** PostgreSQL
> **Fuente del catálogo:** exportación de esquema (`database.csv`, 29 tablas)
> **Última actualización:** 2026-08-19

## 1. Visión general

La base de datos de la intranet almacena la información de los módulos del Portal Institucional:
anuncios y comunicaciones, tareas de seguimiento, logros y acreditaciones, directorio
institucional (extensiones y correos), usuarios y accesos, solicitudes de acceso, formatos
asistenciales, sitios de redirección e innovación/analítica.

El esquema se organiza en **4 dominios** identificados por un prefijo en los nombres de las tablas:

| Prefijo | Dominio | Tablas |
|---|---|---|
| `asi-` | Asistencial (consulta externa, formatos de contingencia) | 3 |
| `com-` | Comunicaciones (anuncios, tareas, logros, roles/permisos) | 12 |
| `gen-` | Generales (usuarios, archivos, directorio, módulos, logs) | 12 |
| `innov-` | Innovación y Analítica | 1 |

Además existe la tabla de control `flyway_schema_history`, estándar de Flyway, que registra las
migraciones aplicadas sobre la base real.

### Convenciones generales

- La **llave primaria** de todas las tablas es la columna `oid` de tipo `integer` (NOT NULL).
- Las **llaves foráneas** se nombran con el nombre de la tabla padre (ej. `comanuncio`,
  `genarchivo`, `genarea`), con una excepción: `gensitredireccion.modulo` (apunta a `genmodulo`).
- Los nombres de columna usan **snake_case** con prefijo de tabla y sin guiones
  (ej. `comanutit`, `genarchruta`, `comtarprior`).
- Las fechas son `timestamp without time zone`, salvo `genusufecnam` (tipo `date`).
- Los `bigint` se usan solo en: `genusuide`, `gensolusuiden` y `genarchsize`.

---

## 2. Inventario de tablas por dominio

### 2.1 Dominio ASI — Asistencial (3 tablas)

#### `asiconextern` — Sitios externos / EPS de consulta externa
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `asiconextnomsi` | character varying | NO | Nombre del sitio/EPS |
| `asiconexturlsi` | character varying | NO | URL del sitio |

#### `asiforcontin` — Formatos de contingencia
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `asiforconnomfor` | character varying | NO | Nombre del formato |
| `asiforconobserv` | character varying | YES | Observaciones |
| `asiforconcodigo` | character varying | YES | Código del formato |

#### `asiforconarchivo` — Archivos adjuntos de formatos de contingencia (puente)
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `asiforcontin` | integer | NO | FK → `asiforcontin.oid` |
| `genarchivo` | integer | NO | FK → `genarchivo.oid` |

---

### 2.2 Dominio COM — Comunicaciones (12 tablas)

#### `comanuncio` — Anuncios y comunicados
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comanutit` | character varying | NO | Título del anuncio |
| `comanudes` | text | NO | Descripción |
| `comanutipo` | integer | NO | FK (inferida) → `comtipoanuncio.oid` |
| `comanufechini` | timestamp | YES | Fecha de inicio de vigencia |
| `comanufechfin` | timestamp | YES | Fecha de fin de vigencia |
| `comusuario` | integer | YES | FK → `comusuario.oid` (creador) |
| `comanuestado` | USER-DEFINED (enum) | NO | Estado del anuncio |
| `comanufechcre` | timestamp | NO | Fecha de creación |
| `comanuvigenci` | timestamp | YES | Fecha de vencimiento |
| `comanueliminado` | boolean | NO | Marca de borrado lógico |

#### `comanuncioarchivo` — Archivos adjuntos de anuncios (puente)
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comanuncio` | integer | NO | FK → `comanuncio.oid` |
| `genarchivo` | integer | NO | FK → `genarchivo.oid` |

#### `comtipoanuncio` — Tipos de anuncio
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comtipnom` | character varying | NO | Nombre del tipo |

#### `comlogroacredi` — Logros y acreditaciones
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comlogacretitu` | character varying | NO | Título del logro |
| `comlogacredesc` | character varying | YES | Descripción |
| `comlogacreurlima` | character varying | YES | URL de la imagen |
| `comlogacrefechacre` | timestamp | NO | Fecha de creación |

#### `comlogroarchivo` — Archivos de logros/acreditaciones (puente)
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comlogroacredi` | integer | NO | FK → `comlogroacredi.oid` |
| `genarchivo` | integer | NO | FK → `genarchivo.oid` |

#### `comrol` — Roles de comunicación
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comrolnom` | character varying | NO | Nombre del rol |
| `comroldes` | text | YES | Descripción |

#### `compermisos` — Permisos
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `compernom` | character varying | NO | Nombre del permiso |
| `comperdes` | character varying | YES | Descripción |

#### `comrolpermiso` — Relación roles ↔ permisos (M:N, puente)
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comrol` | integer | NO | FK → `comrol.oid` |
| `compermisos` | integer | NO | FK → `compermisos.oid` |

#### `comusuario` — Usuarios de comunicaciones (relación usuario ↔ rol, puente)
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genusuario` | integer | NO | FK → `genusuario.oid` |
| `comrol` | integer | NO | FK → `comrol.oid` |
| `comusuestado` | boolean | NO | Estado activo/inactivo |

#### `comtarsegui` — Tareas de seguimiento
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comtarsetit` | character varying | NO | Título de la tarea |
| `comtarsedes` | character varying | YES | Descripción |
| `comusuarioasig` | integer | NO | FK → `comusuario.oid` (asignada a) |
| `comusuarioqasig` | integer | NO | FK → `comusuario.oid` (asignada por) |
| `comtarestad` | USER-DEFINED (enum) | NO | Estado de la tarea |
| `comtarfechin` | timestamp | YES | Fecha de inicio |
| `comtarfechli` | timestamp | YES | Fecha límite |
| `comtarprior` | USER-DEFINED (enum) | NO | Prioridad |

#### `comtarcome` — Comentarios de tareas
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comtarsegui` | integer | NO | FK → `comtarsegui.oid` |
| `comtarcomdes` | character varying | YES | Descripción del comentario |
| `comtarcomfec` | timestamp | NO | Fecha del comentario |
| `genusuario` | integer | NO | FK → `genusuario.oid` (autor) |

#### `comtareaarchivo` — Archivos adjuntos de tareas (puente)
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `comtarsegui` | integer | NO | FK → `comtarsegui.oid` |
| `genarchivo` | integer | NO | FK → `genarchivo.oid` |

---

### 2.3 Dominio GEN — Generales (12 tablas)

#### `genarchivo` — Repositorio central de archivos
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genarchnom` | character varying | NO | Nombre interno del archivo |
| `genarchnomori` | character varying | NO | Nombre original del archivo |
| `genarchruta` | character varying | NO | Ruta de almacenamiento |
| `genarchtipo` | character varying | YES | Tipo/MIME del archivo |
| `genarchsize` | bigint | YES | Tamaño en bytes |
| `genarchfechcre` | timestamp | NO | Fecha de creación |
| `genusuario` | integer | NO | FK → `genusuario.oid` (cargó el archivo) |

#### `genarea` — Áreas institucionales
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genareanom` | character varying | NO | Nombre del área |

#### `gencargointra` — Cargos intra-institucionales
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `gencarnom` | character varying | NO | Nombre del cargo |
| `gencaresta` | boolean | NO | Estado activo/inactivo |

#### `gendircextenciones` — Directorio de extensiones telefónicas
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `gendirextnom` | character varying | NO | Nombre de la persona/servicio |
| `gendirext` | integer | NO | Número de extensión |
| `gendirextare` | integer | NO | FK → `genarea.oid` |
| `gendirextpis` | integer | NO | FK → `genpiso.oid` |
| `gendirextsop` | boolean | NO | Es contacto de soporte |

#### `gendircorreo` — Directorio de correos
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `gendircornom` | character varying | NO | Nombre de la persona/servicio |
| `gendircor` | character varying | NO | Dirección de correo |
| `gendircorare` | integer | NO | FK → `genarea.oid` |
| `gendircorpis` | integer | NO | FK → `genpiso.oid` |
| `gendircorsop` | boolean | NO | Es contacto de soporte |

#### `genequipodominio` — Equipos del dominio / OU
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `geneqnombre` | character varying | NO | Nombre del equipo |
| `genequiou` | character varying | YES | Unidad organizativa (OU) |
| `geneqactivo` | boolean | NO | Estado activo/inactivo |
| `genequltsyn` | timestamp | YES | Última sincronización |

#### `genlogs` — Auditoría de cambios
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genusuario` | integer | NO | FK → `genusuario.oid` |
| `genlogacci` | character varying | YES | Acción realizada |
| `genlogvalant` | text | YES | Valor anterior |
| `genlogvalnue` | text | YES | Valor nuevo |
| `genlogfechac` | timestamp | NO | Fecha del cambio |
| `genlogip` | character varying | YES | IP del usuario |
| `genlogtabla` | character varying | YES | Tabla afectada |
| `genlogregist` | text | YES | Registro afectado |

#### `genmodulo` — Módulos del portal
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genmodnom` | character varying | NO | Nombre del módulo |
| `genmodest` | boolean | NO | Estado activo/inactivo |

#### `genpiso` — Pisos de la institución
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genpisnom` | character varying | NO | Nombre del piso |

#### `gensitredireccion` — Sitios de redirección
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `gensitrednom` | character varying | NO | Nombre del sitio |
| `gensitredurl` | character varying | NO | URL de destino |
| `modulo` | integer | NO | FK → `genmodulo.oid` (excepción de convención) |
| `gensitredicon` | character varying | NO | Icono del sitio |

#### `gensolusuario` — Solicitudes de acceso de usuarios
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `gensolusuiden` | bigint | NO | Identificación del solicitante |
| `gensolusunomb` | character varying | NO | Nombre completo |
| `gensolusucarg` | character varying | NO | Cargo |
| `gensolusumail` | character varying | NO | Correo |
| `gensolusuesta` | USER-DEFINED (enum) | NO | Estado de la solicitud |
| `gensolfechsol` | timestamp | NO | Fecha de solicitud |
| `gensolfechapr` | timestamp | YES | Fecha de aprobación |
| `gensolfechrech` | timestamp | YES | Fecha de rechazo |
| `gensolusuobse` | text | NO | Observaciones |

#### `genusuario` — Usuarios base del sistema
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `genusunom` | character varying | NO | Nombre de usuario |
| `genusuclahash` | character varying | NO | Hash de la contraseña |
| `genususta` | boolean | NO | Estado activo/inactivo |
| `genusuide` | bigint | NO | Identificación |
| `genusunomcom` | character varying | NO | Nombre completo |
| `genusufecnam` | date | NO | Fecha de nacimiento |
| `genusuemacor` | character varying | NO | Correo institucional |
| `gencargointra` | integer | NO | FK → `gencargointra.oid` |
| `genusufechcrea` | timestamp | NO | Fecha de creación |

---

### 2.4 Dominio INNOV — Innovación y Analítica (1 tabla)

#### `innovanalitica` — Enlaces de innovación/analítica
| Columna | Tipo | Nulos | Notas |
|---|---|---|---|
| `oid` | integer | NO | PK |
| `innovanalinom` | character varying | NO | Nombre del enlace |
| `innovanaliurl` | character varying | NO | URL |
| `genusuario` | integer | NO | FK → `genusuario.oid` (creador) |
| `innovanalifechcrea` | timestamp | NO | Fecha de creación |

---

### 2.5 Tabla de control Flyway

#### `flyway_schema_history`
Tabla estándar de Flyway que registra las migraciones aplicadas:
`installed_rank`, `version`, `description`, `type`, `script`, `checksum`,
`installed_by`, `installed_on`, `execution_time`, `success`.
Su presencia en la base real indica que Flyway ejecutó al menos una vez.

---

## 3. Relaciones entre tablas (FK)

### Cadena central de archivos → `genarchivo.oid`
Todas las tablas de archivos adjuntos apuntan al repositorio central de archivos:

```
asiforconarchivo.genarchivo ─┐
comanuncioarchivo.genarchivo ├──► genarchivo.oid
comlogroarchivo.genarchivo   ├
comtareaarchivo.genarchivo   ┘
```

### `genusuario` como tabla central de identidad
Es referenciada por: `genarchivo`, `genlogs`, `comtarcome`, `comusuario` e `innovanalitica`.

### Tablas puente (M:N)
- `comrolpermiso`: roles ↔ permisos (`comrol`, `compermisos`)
- `comusuario`: usuario base ↔ rol de comunicaciones (`genusuario`, `comrol`)
- `asiforconarchivo`, `comanuncioarchivo`, `comlogroarchivo`, `comtareaarchivo`: entidad ↔ `genarchivo`

### Tareas de seguimiento
- `comtarsegui` → `comusuario` dos veces: `comusuarioasig` (asignada a) y `comusuarioqasig` (asignada por)
- `comtarcome` → `comtarsegui` y `genusuario` (autor del comentario)
- `comtareaarchivo` → `comtarsegui` y `genarchivo`

### Directorio
- `gendircextenciones` y `gendircorreo` → `genarea` y `genpiso`

### Sitios y anuncios
- `gensitredireccion.modulo` → `genmodulo`
- `comanuncio.comusuario` → `comusuario` y `comanuncio.comanutipo` → `comtipoanuncio` (FK inferidas por convención)

### Usuarios
- `genusuario.gencargointra` → `gencargointra`

---

## 4. Catálogo de enums (tipos USER-DEFINED)

Los valores exactos no están definidos en el repositorio (no hay DDL). Valores esperados según su uso en el frontend:

| Enum | Tabla/Columna | Valores esperados |
|---|---|---|
| `comanuestado` | `comanuncio.comanuestado` | publicado, pendiente, rechazado, vencido (o similar) |
| `comtarestad` | `comtarsegui.comtarestad` | pendiente, en_progreso, completada (o similar) |
| `comtarprior` | `comtarsegui.comtarprior` | alta, media, baja (o similar) |
| `gensolusuesta` | `gensolusuario.gensolusuesta` | pendiente, aprobada, rechazada |

---

## 5. Mapa funcional: frontend ↔ tablas

> El frontend es una implementación 100 % mock (datos en localStorage). Este mapeo indica qué
> componente/contexto modela cada tabla y qué vista la consumirá cuando se conecte al backend.

| Tabla | Consumo en el frontend |
|---|---|
| `asiconextern` | `EpsPlatform` (SystemContext), `ExternalConsultationModal`, `AsistencialEpsView`, `ConsultaExternaView`, `EpsManagementModal` |
| `asiforcontin` / `asiforconarchivo` | `ContingencyFormat` (SystemContext), `ContingencyFormatsModal`, `FormatosContingenciaView`, `AsistencialFormatsView` |
| `comanuncio` / `comanuncioarchivo` | `Announcement` (AnnouncementsContext, localStorage `intranet_announcements`), `AnnouncementPanel`, `CrearAnuncioView`, `AnunciosPendientesView`, `HistorialAnunciosView`, `CalendarioAnunciosView`, `RegisterAnnouncementModal`, `HomeModule` |
| `comtipoanuncio` | Campo "tipo" en `CrearAnuncioView` / `RegisterAnnouncementModal` |
| `comlogroacredi` / `comlogroarchivo` | `Achievement` (SystemContext), `AccreditationAchievementsModal`, `LogrosAcreditacionesView` |
| `compermisos`, `comrol`, `comrolpermiso` | `Role`, `RolePermission` (SystemContext), `PermisosComunicacionesView`, `UserManagementModule` |
| `comtarsegui` / `comtarcome` / `comtareaarchivo` | `Task` (SystemContext), `NewTaskModal`, `TaskModal`, `TareasSeguimientoView`, `ComunicacionesTareasView` |
| `comusuario` | `UsuariosComunicacionesView` |
| `genarea`, `genpiso` | Filtros de piso/área en `DirectoryModule` y formularios de directorio |
| `gencargointra` | Cargos en `GeneralesUsuariosView` (modo cargos) |
| `gendircextenciones`, `gendircorreo` | `DirectoryModule` (pestañas extensiones/correos), `GeneralesDirectorioView`, `ITSupportContactsModal`, `ExtensionsModal` |
| `genmodulo` | Módulos del portal: `GeneralesModulosView`, localStorage `admin_portal_modules` |
| `gensitredireccion` | `RedirectSite` (SystemContext), `GeneralesSitiosView`, `RedirectModal`, `EnlaceRedireccionView` |
| `gensolusuario` | `AccessRequestModal`, `GeneralesUsuariosView` (modo solicitudes), `PasswordResetModal` |
| `genusuario` | `User` / `UserRole` (AuthContext), `GeneralesUsuariosView` (modos list/create), `UserManagementModule` |
| `genlogs` | **Sin consumo real** — `LogsModule`/`LogsView` usan `AccessRecord` mock del AuthContext |
| `genequipodominio` | **Sin mapeo** — no hay componente que la use |
| `genarchivo` | **Sin componente directo** — consumido indirectamente vía las 4 tablas puente de archivos |
| `innovanalitica` | `InnovacionAnaliticaModule`, `InnovacionAnaliticaView`, `EnlaceRedireccionView` |

---

## 6. Convenciones de naming

- Prefijos de dominio: `asi-`, `com-`, `gen-`, `innov-`.
- PK siempre `oid` (integer, NOT NULL).
- FK = nombre de la tabla padre (ej. `comanuncio`), con excepción `gensitredireccion.modulo`.
- Columnas en snake_case con prefijo de tabla y sin guiones.

---

## 7. Hallazgos e inconsistencias

1. **Migraciones Flyway vacías en el repositorio**: `V1__baseline.sql` solo contiene comentarios
   y `V2`–`V5` están en 0 bytes. No existe DDL real (`CREATE TABLE/TYPE/INDEX`) versionado.
   El esquema real vive únicamente en la base de datos.
2. **Backend sin capa de datos**: sin entidades JPA, repositorios ni controladores.
   Configura `ddl-auto: validate` y Flyway `baseline-on-migrate: true`, por lo que la aplicación
   depende de que la base ya tenga el esquema creado.
3. **Frontend 100 % mock**: no hay llamadas HTTP ni referencias a nombres de tabla; los datos se
   guardan en localStorage. Solo existe el proxy `/api → localhost:8080` en `vite.config.ts`
   (sin uso real).
4. **Credenciales hardcodeadas** en el frontend: `root`/`admin` con contraseña `icvc2024**`
   (no validan contra `genusuario`).
5. **Tablas sin consumo actual**: `genlogs` (se usa un `AccessRecord` en memoria) y
   `genequipodominio` (sin componente asociado).
6. **Excepción de convención**: la columna `modulo` en `gensitredireccion` es la única FK sin
   prefijo de tabla.
7. **Enums sin valores documentados**: los 4 tipos `USER-DEFINED` no tienen definición de valores
   ni en el DDL ni en el código. Para obtener los valores exactos y los constraints reales
   (PK/FK/índices/secuencias) se requiere acceso de lectura a PostgreSQL `intraicvc`
   (192.168.3.121:5432).

---

*Documento generado a partir del catálogo `database.csv` y del análisis del repositorio de la intranet.*