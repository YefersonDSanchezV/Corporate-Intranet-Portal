# 02 — ¿Cómo está construida? (las 3 piezas)

Todo el sistema tiene **3 piezas**. No necesitas saber programar para entenderlas.

```mermaid
flowchart TB
    subgraph N[Navegador del usuario]
        P[🌐 PIEZA 1 — Lo que se ve<br/>Portal web<br/>React + diseño institucional<br/>rojo #CF3438 / azul #0778AC]
    end
    subgraph S[Servidores internos]
        R[🧑‍💼 PIEZA 1.5 — Recepcionista<br/>Nginx<br/>recibe visitas y las dirige]
        C[⚙️ PIEZA 2 — El cerebro<br/>Java Spring Boot<br/>reglas, permisos, archivos]
    end
    A[🗄️ PIEZA 3 — El archivo<br/>PostgreSQL + carpetas<br/>datos y documentos guardados]

    P -->|pide /api/...| R
    R -->|reenvía| C
    C -->|lee y guarda| A

    style P fill:#fff3e0,stroke:#ef6c00
    style R fill:#e0f7fa,stroke:#00838f
    style C fill:#e8f5e9,stroke:#2e7d32
    style A fill:#f3e5f5,stroke:#7b1fa2
```

## Pieza 1 — Lo que se ve (Portal)

- Página moderna que funciona en computador de oficina.
- 7 secciones (ver documento 03).
- Colores institucionales, menú superior + panel lateral de anuncios.
- Cuando falla internet o el cerebro está apagado, muestra los últimos datos guardados.

## Pieza 2 — El cerebro (Backend)

- Programa en Java que **decide**: ¿quién eres? ¿qué puedes ver? ¿dónde guardo esto?
- Organizado por temas: usuarios, comunicados, directorio, tareas, muro, formatos, enlaces.
- Guarda documentos (hasta 20 MB por archivo) en una carpeta `uploads`.
- Se vigila solo: expone su "estado de salud" para saber si está vivo.

## Pieza 3 — El archivo (Datos)

- Base de datos PostgreSQL **externa** (no se borra aunque se apaguen los servidores).
- Los cambios de estructura se aplican con versiones numeradas (Flyway V1→V28): como capítulos de un libro, en orden y sin saltos.
- Dos discos de respaldo lógico:
  - `uploads` → documentos y fotos.
  - `logs` → diario de lo que pasó.

## ¿Cómo viaja un clic? Ejemplo: "ver comunicados"

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant P as 🌐 Portal
    participant R as 🧑‍💼 Recepcionista
    participant C as ⚙️ Cerebro
    participant B as 🗄️ Archivo
    U->>P: Clic en Comunicados
    P->>R: Pide /api/announcements
    R->>C: Reenvía la petición
    C->>C: ¿Tiene permiso? ¿Sesión válida?
    C->>B: Busca los anuncios
    B-->>C: Devuelve la lista
    C-->>P: Envía la lista
    P-->>U: Muestra las tarjetas en pantalla
```
