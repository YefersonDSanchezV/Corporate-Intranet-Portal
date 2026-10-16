# 03 — ¿Qué puede hacer? (módulos)

## Mapa de las 7 secciones

```mermaid
flowchart TD
    H[🏠 Inicio<br/>puerta principal]
    H --> A1[🩺 Área Asistencial]
    H --> A2[💼 Área Administrativa]
    H --> A3[🏛️ Gestión Institucional]
    H --> A4[🛠️ Soporte]
    H --> A5[📇 Directorio]
    H --> A6[📊 Innovación y Analítica]

    A1 --> F1[Formatos de contingencia<br/>Sitios externos]
    A2 --> F2[Comunicados<br/>Tareas y seguimiento]
    A3 --> F3[Anuncios oficiales<br/>Logros y acreditaciones<br/>Cumpleaños y eventos]
    A4 --> F4[Ayuda y accesos rápidos]
    A5 --> F5[Extensiones<br/>Correos por área y piso]
    A6 --> F6[Enlaces de innovación<br/>Tableros y muro]

    style H fill:#CF3438,color:#fff,stroke:#8e0000
    style A1 fill:#e3f2fd,stroke:#1976d2
    style A2 fill:#e8f5e9,stroke:#2e7d32
    style A3 fill:#fff3e0,stroke:#ef6c00
    style A4 fill:#f3e5f5,stroke:#7b1fa2
    style A5 fill:#e0f7fa,stroke:#00838f
    style A6 fill:#fce4ec,stroke:#c2185b
```

| Sección | ¿Qué encuentra el usuario? | Ejemplo de uso |
|---|---|---|
| 🏠 Inicio | Resumen, anuncios destacados, cumpleaños | "¿Qué hay nuevo hoy?" |
| 🩺 Área Asistencial | Formatos de contingencia, sitios clínicos | "Se cayó el sistema, uso el formato papel" |
| 💼 Área Administrativa | Comunicados, tareas con seguimiento y comentarios | "Reviso mi tarea pendiente y subo evidencia" |
| 🏛️ Gestión Institucional | Anuncios oficiales, logros, calendario | "Publican el logro de acreditación" |
| 🛠️ Soporte | Ayuda, accesos rápidos, redirecciones | "Entro al sistema de historia clínica" |
| 📇 Directorio | Extensiones, correos, áreas, pisos | "Busco la extensión de farmacia" |
| 📊 Innovación y Analítica | Enlaces de innovación + muro de mensajes | "Dejo un mensaje en el muro" |

## El panel de administración (solo autorizados)

Es una ventana aparte con ~20 pantallas:

```mermaid
flowchart LR
    L[🔐 Acceso con usuario<br/>y contraseña] --> P[🛠️ Panel]
    P --> G1[👥 Generales<br/>Usuarios, Módulos<br/>Sitios, Directorio]
    P --> G2[📢 Comunicaciones<br/>Crear, aprobar<br/>calendario, historial]
    P --> G3[📅 Personas<br/>Cumpleaños, Logros<br/>Tareas]
    P --> G4[⚙️ Sistema<br/>Formatos, Enlaces<br/>Logs, Accesos]

    style L fill:#37474f,color:#fff
    style P fill:#0778AC,color:#fff
```

- **Generales:** crear usuarios, abrir/cerrar módulos, registrar sitios y extensiones.
- **Comunicaciones:** redactar anuncio → queda pendiente → se aprueba → se publica. Todo queda en historial.
- **Personas:** cumpleaños manuales, logros con fotos, tareas con responsables.
- **Sistema:** formatos de contingencia, enlaces, accesos rápidos y diario de auditoría (quién hizo qué).

## Ciclo de vida de un anuncio

```mermaid
stateDiagram-v2
    [*] --> Borrador: Comunicaciones redacta
    Borrador --> Pendiente: Envía a revisión
    Pendiente --> Publicado: Aprueban
    Pendiente --> Rechazado: Devuelven con motivo
    Rechazado --> Borrador: Corrige y reenvía
    Publicado --> [*]: Expira / se archiva
```
