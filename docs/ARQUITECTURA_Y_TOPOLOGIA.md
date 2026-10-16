# 🏥 Intranet Corporativa ICVC — Arquitectura y Topología

> **Instituto Cardiovascular del Cesar (ICVC)**
> Documento explicativo del funcionamiento del sistema, pensado para público **técnico y no técnico**.

---

## 📌 ¿Qué es esta Intranet y para qué sirve?

La Intranet Corporativa es el **portal web interno** del ICVC. Es la puerta de entrada digital para todos los colaboradores: desde allí acceden a las aplicaciones del hospital, consultan el directorio telefónico, leen comunicados, revisan sus tareas y gestionan información institucional.

**Analogía simple:** imagina un **edificio corporativo digital**.

| Edificio físico | Equivalente en la Intranet |
|---|---|
| 🚪 Puerta de entrada | El portal web (lo que ves en el navegador) |
| 🧑💼 Recepcionista | El **servidor web** (Nginx) que atiende a los visitantes |
| 🗂️ Archivo y oficinas | El **servidor de aplicaciones** (Backend) que procesa la información |
| 🏦 Bóveda de documentos | La **base de datos** (PostgreSQL) donde vive la información |
| 🛡️ Guardia de seguridad | El sistema de **autenticación y permisos** (JWT + Roles) |

---

## 🧭 Vista General del Sistema (Nivel gerencial)

El sistema está compuesto por **dos grandes piezas** que trabajan juntas:

```mermaid
flowchart LR
    subgraph U["👥 Usuarios"]
        A["Colaborador ICVC"]
        B["Coordinador / Comunicaciones"]
        C["Administrador TI (Root)"]
    end

    subgraph P["🌐 Portal Web (Frontend)"]
        D["Lo que se ve<br/>en el navegador"]
    end

    subgraph S["⚙️ Cerebro del Sistema (Backend)"]
        E["Reglas de negocio<br/>Seguridad y datos"]
    end

    subgraph D2["🗄️ Base de Datos"]
        F["Información<br/>institucional"]
    end

    A --> D
    B --> D
    C --> D
    D -->|"Pide y envía<br/>información"| E
    E -->|"Lee y guarda"| F

    style U fill:#e8f4fd,stroke:#2196f3,color:#0d47a1
    style P fill:#fff3e0,stroke:#ff9800,color:#e65100
    style S fill:#e8f5e9,stroke:#4caf50,color:#1b5e20
    style D2 fill:#f3e5f5,stroke:#9c27b0,color:#4a148c
```

> 💡 **En palabras simples:** el usuario abre el navegador y ve el portal. Cuando hace clic (por ejemplo, "ver comunicados"), el navegador le pide los datos al cerebro del sistema, y este a su vez los busca y los guarda en la base de datos.

---

## 🏗️ Arquitectura de Alto Nivel (Modelo de 3 capas)

El sistema sigue un patrón clásico y robusto llamado **arquitectura de tres capas**. Cada capa tiene una responsabilidad clara y no invade la de las demás.

```mermaid
flowchart TB
    subgraph C1["1️⃣ CAPA DE PRESENTACIÓN — El escaparate"]
        direction LR
        REACT["React + TypeScript<br/>Vite · Tailwind CSS<br/>Material UI · Radix"]
    end

    subgraph C2["2️⃣ CAPA DE LÓGICA DE NEGOCIO — El cerebro"]
        direction LR
        SPRING["Spring Boot (Java 21)<br/>Controladores REST<br/>Servicios · Seguridad JWT<br/>Reglas y validaciones"]
    end

    subgraph C3["3️⃣ CAPA DE DATOS — El almacén"]
        direction LR
        PG["PostgreSQL<br/>Migraciones Flyway"]
        FILES["Archivos y<br/>uploads"]
    end

    C1 -->|"HTTP/JSON<br/>peticiones REST"| C2
    C2 -->|"JPA / SQL"| C3

    style C1 fill:#fff8e1,stroke:#f9a825,stroke-width:2px,color:#e65100
    style C2 fill:#e3f2fd,stroke:#1976d2,stroke-width:2px,color:#0d47a1
    style C3 fill:#fce4ec,stroke:#d81b60,stroke-width:2px,color:#880e4f
```

| Capa | Nombre | Responsabilidad | Si falla… |
|---|---|---|---|
| 1️⃣ | **Presentación** | Mostrar la interfaz y capturar acciones del usuario | El usuario ve una página en blanco |
| 2️⃣ | **Negocio** | Validar, decidir, aplicar reglas y seguridad | Nada se puede guardar ni consultar |
| 3️⃣ | **Datos** | Guardar y recuperar información permanente | Se pierde el acceso a la información |

---

## 🗺️ Topología de Despliegue (Cómo está montado el sistema)

Todo el sistema corre dentro de **contenedores Docker** que viven en una red privada interna. Nada queda directamente expuesto salvo el portal.

```mermaid
flowchart TB
    INTERNET(("👤<br/>Usuario en la red<br/>corporativa"))

    subgraph HOST["🖥️ Servidor / Máquina Anfitriona (Docker)"]
        direction TB

        subgraph NET["🔗 Red interna aislada: intranet-network"]
            direction LR

            subgraph FE["📦 Contenedor Frontend"]
                NGINX["Nginx<br/>(sirve el portal)<br/>Puerto 80"]
            end

            subgraph BE["📦 Contenedor Backend"]
                API["Spring Boot API<br/>(lógica y seguridad)<br/>Puerto 8080"]
            end
        end

        subgraph VOL["💾 Volúmenes persistentes"]
            UP["backend-uploads<br/>(archivos subidos)"]
            LOG["backend-logs<br/>(registros)"]
        end

        subgraph DBX["🗄️ Base de Datos"]
            PGSQL[("PostgreSQL")]
        end
    end

    INTERNET -->|"HTTP :80"| NGINX
    NGINX -->|"/api → proxy interno"| API
    API -->|"JDBC"| PGSQL
    API --- UP
    API --- LOG

    style INTERNET fill:#eceff1,stroke:#607d8b,color:#263238
    style HOST fill:#f5f5f5,stroke:#9e9e9e,color:#212121
    style NET fill:#e8f5e9,stroke:#43a047,color:#1b5e20
    style FE fill:#fff3e0,stroke:#fb8c00,color:#e65100
    style BE fill:#e3f2fd,stroke:#1e88e5,color:#0d47a1
    style DBX fill:#f3e5f5,stroke:#8e24aa,color:#4a148c
    style VOL fill:#fffde7,stroke:#fdd835,color:#f57f17
```

### 🔒 Detalles de la topología

- **Solo el Frontend (puerto 80) está abierto** al usuario. El Backend (8080) queda detrás del proxy interno.
- El Backend **no se comunica directamente** con el navegador: Nginx reenvía las peticiones que empiezan con `/api`.
- Ambos contenedores se comunican por **nombre de servicio** (`backend`, `frontend`) dentro de la red `intranet-network`, sin necesidad de IPs fijas.
- Los **uploads** y **logs** se guardan en volúmenes, así no se pierden al reiniciar el contenedor.

---

## 🔄 Flujo de una Petición (Ciclo de vida paso a paso)

Este es el recorrido que hace cualquier acción del usuario, por ejemplo **"ver los comunicados"**.

```mermaid
sequenceDiagram
    autonumber
    actor U as 👤 Usuario
    participant N as 🌐 Nginx (Frontend)
    participant B as ⚙️ Spring Boot (Backend)
    participant DB as 🗄️ PostgreSQL

    U->>N: Abre el portal y navega
    N-->>U: Entrega la página web (React)
    U->>N: Clic en "Comunicados" → /api/announcements
    N->>B: Reenvía la petición al API
    B->>B: 🔐 Verifica el token (JWT) y permisos
    B->>DB: SELECT comunicados vigentes
    DB-->>B: Devuelve los datos
    B-->>N: Responde en formato JSON
    N-->>U: Muestra los comunicados en pantalla
```

> ⏱️ Todo este recorrido ocurre en **milisegundos** y de forma transparente para el usuario.

---

## 🧩 Descomposición de Componentes

### 🎨 Frontend — "El Portal" (`Corporate-Intranet-Portal/`)

La parte que el usuario **ve y toca**. Construida como una *Single Page Application* (SPA) moderna.

```mermaid
mindmap
  root(("🎨 Portal<br/>Frontend"))
    🧱 Tecnologías
      React 18
      TypeScript
      Vite
      Tailwind CSS
      Material UI + Radix
    🖼️ Módulos visibles
      Inicio / Dashboard
      Directorio Institucional
      Área Asistencial
      Área Administrativa
      Gestión Institucional
      Innovación y Analítica
      Soporte Técnico
    🧠 Estado Global
      AuthContext (sesión)
      AnnouncementsContext
      SystemContext
      AdminAuthContext
    🔌 Comunicación
      Cliente API central
      Token JWT
```

### ⚙️ Backend — "El Cerebro" (`intranet-backend/`)

La parte que **procesa, valida, protege y almacena**. Organizado por dominios funcionales.

```mermaid
mindmap
  root(("⚙️ Backend<br/>Spring Boot"))
    👤 Usuarios
      Autenticación
      Usuarios y cargos
      Solicitudes de acceso
      Recuperación de contraseña
    📢 Comunicación
      Anuncios y comunicados
      Logros y acreditaciones
      Tareas de seguimiento
      Roles y permisos
    📇 Directorio
      Extensiones telefónicas
      Correos
      Pisos y áreas
    🧰 Portal
      Módulos
      Sitios de redirección
      Archivos
    🆘 Asistencia
      Formatos de contingencia
      Sitios externos
    🚀 Innovación
      Enlaces de innovación
    🔐 Seguridad
      JWT
      Interceptor de permisos
    🗄️ Configuración
      CORS · Caché · OpenAPI
      Sembrado de admin
```

### 🗄️ Base de Datos — "La Bóveda" (`PostgreSQL`)

La información se guarda de forma **estructurada y versionada**. Los cambios al esquema se aplican con **migraciones Flyway** (V1 → V24), lo que garantiza que la estructura evolucione de forma controlada y auditable.

```mermaid
erDiagram
    USUARIO ||--o{ LOG_AUDITORIA : "genera"
    USUARIO }o--|| CARGO : "tiene"
    CARGO ||--o{ CARGO_PERMISO : "posee"
    USUARIO ||--o{ SOLICITUD_USUARIO : "solicita"
    ANUNCIO ||--o{ ARCHIVO_ANUNCIO : "adjunta"
    ANUNCIO }o--|| TIPO_ANUNCIO : "clasifica"
    LOGRO_ACREDITACION ||--o{ ARCHIVO_LOGRO : "adjunta"
    TAREA_SEGUIMIENTO ||--o{ COMENTARIO_TAREA : "contiene"
    PISO ||--o{ AREA : "contiene"
    AREA ||--o{ EXTENSION_DIRECTORIO : "agrupa"
    MODULO ||--o{ SITIO_REDIRECCION : "contiene"
    ROL ||--o{ ROL_PERMISO : "define"
    PERMISO ||--o{ ROL_PERMISO : "asignado a"
```

---

## 👥 Modelo de Acceso y Seguridad (RBAC)

El sistema usa **Control de Acceso Basado en Roles (RBAC)**. Dicho de forma sencilla: *cada persona ve y hace únicamente lo que su rol le permite*.

```mermaid
flowchart LR
    LOGIN["🔑 Inicio de sesión<br/>(usuario + contraseña)"] --> JWT["🎫 Se emite un token<br/>(JWT válido)"]
    JWT --> ROL{"🧩 ¿Qué rol<br/>tiene?"}

    ROL -->|Asistencial| M1["Ve: Inicio, Directorio,<br/>Soporte"]
    ROL -->|Administrativo| M2["Ve: Inicio, Directorio,<br/>Gestión Institucional"]
    ROL -->|Comunicaciones| M3["Ve: Anuncios, Tareas,<br/>Comunicados"]
    ROL -->|TI / Root| M4["Ve TODO:<br/>Administración total"]

    style LOGIN fill:#e8f5e9,stroke:#43a047,color:#1b5e20
    style JWT fill:#fff3e0,stroke:#fb8c00,color:#e65100
    style ROL fill:#e3f2fd,stroke:#1e88e5,color:#0d47a1
    style M4 fill:#fce4ec,stroke:#d81b60,color:#880e4f
```

**Medidas de seguridad incluidas:**

| Medida | Descripción |
|---|---|
| 🔐 **JWT** | Cada sesión viaja con un "pase" firmado y con caducidad. |
| 👮 **Interceptor de permisos** | El backend valida cada acción contra los permisos del rol/cargo. |
| 🧾 **Auditoría (Logs)** | Se registra quién hizo qué y cuándo. |
| 🔄 **Sesión volátil** | La sesión se cierra al refrescar la página (requisito de seguridad). |
| 🛡️ **Cabeceras de seguridad** | Nginx agrega protección contra ataques comunes (XSS, clickjacking). |

---

## 🧰 Stack Tecnológico Completo

```mermaid
flowchart TB
    subgraph FRONT["🎨 Frontend"]
        F1["React 18.3"]
        F2["TypeScript"]
        F3["Vite 6.3"]
        F4["Tailwind CSS 4.1"]
        F5["MUI 7.3 + Radix UI"]
        F6["Recharts · Lucide · Framer Motion"]
    end

    subgraph BACK["⚙️ Backend"]
        B1["Java 21"]
        B2["Spring Boot 3.5"]
        B3["Spring Web (REST)"]
        B4["Spring Data JPA"]
        B5["Spring Security + JWT"]
        B6["Flyway · OpenAPI (Swagger)"]
    end

    subgraph DATA["🗄️ Datos e Infra"]
        D1["PostgreSQL"]
        D2["Docker + Docker Compose"]
        D3["Nginx (proxy inverso)"]
    end

    style FRONT fill:#fff8e1,stroke:#f9a825,color:#e65100
    style BACK fill:#e3f2fd,stroke:#1976d2,color:#0d47a1
    style DATA fill:#fce4ec,stroke:#d81b60,color:#880e4f
```

| Componente | Tecnología | Para qué sirve |
|---|---|---|
| Interfaz visual | React + Tailwind + MUI | Construir la experiencia de usuario |
| Cerebro | Spring Boot (Java 21) | Procesar la lógica y las reglas |
| Seguridad | Spring Security + JWT | Autenticar y autorizar |
| Base de datos | PostgreSQL | Guardar la información |
| Versionado de BD | Flyway | Evolucionar la base sin perder datos |
| Documentación API | OpenAPI / Swagger | Documentar los servicios automáticamente |
| Monitoreo | Spring Actuator | Verificar que el sistema esté "saludable" (`/actuator/health`) |
| Contenedores | Docker / Compose | Empaquetar y desplegar el sistema |
| Puerta de entrada | Nginx | Servir el portal y enrutar al backend |

---

## 🌍 Ambientes de Despliegue

Existen **tres configuraciones** para distintos propósitos. Todas usan la misma arquitectura, solo cambian puertos y parámetros.

```mermaid
flowchart LR
    subgraph DEV["🧪 Desarrollo / Pruebas"]
        D1["Frontend :3000"]
        D2["Backend :8080"]
        D3["Perfil: dev"]
    end

    subgraph PROD["🚀 Producción"]
        P1["Frontend :80"]
        P2["Backend :8080"]
        P3["Perfil: prod"]
    end

    style DEV fill:#e8f5e9,stroke:#43a047,color:#1b5e20
    style PROD fill:#fce4ec,stroke:#d81b60,color:#880e4f
```

| Ambiente | Archivo | Puerto Frontend | Puerto Backend | Perfil Spring |
|---|---|---|---|---|
| 🧪 Desarrollo | `docker-compose.dev.yml` | `3000` | `8080` | `dev` |
| ✅ Producción | `docker-compose.prod.yml` | `80` | `8080` | `prod` |
| 🔀 Unificado | `docker-compose.yml` | variable | variable | variable |

**Comandos de arranque:**

```bash
# Desarrollo / pruebas
docker compose --env-file intranet-backend/.env_pruebas up --build

# Producción
docker compose --env-file intranet-backend/.env up --build
```

---

## 🧠 Módulos Funcionales (Qué puede hacer el usuario)

```mermaid
flowchart TB
    HOME["🏠 INICIO<br/>Dashboard con accesos rápidos<br/>y comunicados vigentes"]

    HOME --> DIR["📇 DIRECTORIO<br/>Extensiones y correos<br/>por piso y área"]
    HOME --> ASIS["🩺 ÁREA ASISTENCIAL<br/>Aplicaciones clínicas<br/>y consulta externa"]
    HOME --> ADM["🗂️ ÁREA ADMINISTRATIVA<br/>Formatos, enlaces<br/>y trámites"]
    HOME --> GES["🏆 GESTIÓN INSTITUCIONAL<br/>Logros y acreditaciones"]
    HOME --> INN["📊 INNOVACIÓN Y ANALÍTICA<br/>Enlaces de innovación"]
    HOME --> SOP["🛠️ SOPORTE TÉCNICO<br/>Mesa de ayuda y contactos TI"]

    HOME --> ADMIN["🔐 PANEL DE ADMINISTRACIÓN<br/>Solo rol TI / Root"]
    ADMIN --> A1["Usuarios y roles"]
    ADMIN --> A2["Anuncios y tareas"]
    ADMIN --> A3["Sitios y módulos"]
    ADMIN --> A4["Logs de auditoría"]

    style HOME fill:#e8f5e9,stroke:#43a047,stroke-width:2px,color:#1b5e20
    style ADMIN fill:#fce4ec,stroke:#d81b60,stroke-width:2px,color:#880e4f
```

---

## 🆘 Alta Disponibilidad y Resiliencia

El sistema incorpora mecanismos para "cuidarse a sí mismo":

```mermaid
flowchart LR
    HC["❤️ Health Check<br/>cada 15 segundos"] --> Q{"¿El backend<br/>responde?"}
    Q -->|Sí| OK["✅ Servicio activo"]
    Q -->|No| RESTART["🔄 Reinicio automático<br/>(restart: unless-stopped)"]
    RESTART --> HC

    style HC fill:#e3f2fd,stroke:#1e88e5,color:#0d47a1
    style OK fill:#e8f5e9,stroke:#43a047,color:#1b5e20
    style RESTART fill:#fff3e0,stroke:#fb8c00,color:#e65100
```

- **Dependencias ordenadas:** el Frontend no arranca hasta que el Backend esté *saludable*.
- **Reinicio automático:** si un contenedor falla, Docker lo levanta de nuevo.
- **Volúmenes persistentes:** archivos y logs sobreviven a los reinicios.

---

## 📚 Glosario para No Técnicos

| Término | Significado sencillo |
|---|---|
| **Frontend** | Lo que ves y usas en el navegador |
| **Backend** | El motor invisible que procesa todo |
| **Base de datos** | El archivador donde se guarda la información |
| **API** | El "mensajero" que comunica el portal con el motor |
| **Contenedor** | Una "caja" aislada donde corre una parte del sistema |
| **Docker** | La herramienta que crea y administra esas cajas |
| **Nginx** | El portero que recibe a los usuarios y los dirige |
| **JWT** | Un pase digital firmado que demuestra quién eres |
| **RBAC** | Regla que da permisos según el rol de cada persona |
| **SPA** | Página que funciona sin recargar en cada clic |
| **Migración** | Cambio controlado a la estructura de la base de datos |
| **Health Check** | Chequeo automático de que el sistema está vivo |

---

## 🗂️ Mapa del Repositorio

```text
Corporate-Intranet-Portal/
│
├── 🎨 Corporate-Intranet-Portal/     ← El Portal (Frontend)
│   ├── src/app/components/            ← Componentes y módulos visuales
│   ├── src/app/api/                   ← Comunicación con el Backend
│   ├── src/app/contexts/              ← Estado global (sesión, anuncios)
│   ├── nginx.conf                     ← Configuración del portero
│   └── Dockerfile                     ← Receta del contenedor Frontend
│
├── ⚙️ intranet-backend/               ← El Cerebro (Backend)
│   ├── src/main/java/.../             ← Código por dominios funcionales
│   │   ├── user/ · communication/     ← Usuarios y comunicaciones
│   │   ├── directory/ · portal/       ← Directorio y portal
│   │   ├── assistance/ · innovation/  ← Asistencia e innovación
│   │   ├── permisos/ · security/      ← Seguridad y permisos
│   │   └── config/ · common/          ← Configuración y utilidades
│   ├── src/main/resources/db/migration/ ← Migraciones de la base de datos
│   └── Dockerfile                     ← Receta del contenedor Backend
│
├── 🐳 docker-compose.yml              ← Orquestación unificada
├── 🐳 docker-compose.dev.yml          ← Configuración de desarrollo
├── 🐳 docker-compose.prod.yml         ← Configuración de producción
└── 📄 docs/                           ← Documentación (este archivo)
```

---

## ✅ Resumen Ejecutivo (Una sola mirada)

```mermaid
flowchart LR
    U["👤 Usuarios<br/>ICVC"] -->|Navegador| PORTAL["🌐 Portal<br/>React"]
    PORTAL -->|"API REST"| API["⚙️ Backend<br/>Spring Boot + JWT"]
    API -->|"SQL"| DB[("🗄️ PostgreSQL")]
    API -->|"Archivos"| STORE["📁 Volumen<br/>uploads/logs"]

    style U fill:#eceff1,stroke:#607d8b,color:#263238
    style PORTAL fill:#fff3e0,stroke:#fb8c00,color:#e65100
    style API fill:#e3f2fd,stroke:#1e88e5,color:#0d47a1
    style DB fill:#f3e5f5,stroke:#8e24aa,color:#4a148c
    style STORE fill:#fffde7,stroke:#fdd835,color:#f57f17
```

**La Intranet ICVC es un portal web moderno, seguro y centralizado** que unifica la comunicación interna, el directorio, los accesos a aplicaciones y la administración de usuarios, todo dentro de una arquitectura en capas empaquetada con Docker, con una puerta de entrada única (Nginx) y un modelo de permisos por roles.

---

*Documento generado para el Instituto Cardiovascular del Cesar (ICVC).*
*Los diagramas utilizan Mermaid y se visualizan correctamente en GitHub, GitLab y editores compatibles.*
