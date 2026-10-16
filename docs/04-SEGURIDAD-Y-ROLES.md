# 04 — Seguridad y roles (¿quién puede ver qué?)

## La idea: carnet + llave por cargo

```mermaid
flowchart LR
    U[👤 Usuario<br/>usuario + contraseña] --> T[🎫 Carnet temporal<br/>token válido ~8 horas]
    T --> G[🛡️ Vigilante<br/>¿carnet válido?<br/>¿cargo con permiso?]
    G -->|Sí| OK[✅ Ve y hace]
    G -->|No| NO[⛔ Se le niega<br/>y se registra]

    style U fill:#e3f2fd,stroke:#1976d2
    style T fill:#fff3e0,stroke:#ef6c00
    style G fill:#e8f5e9,stroke:#2e7d32
    style NO fill:#ffebee,stroke:#c62828
```

- Al entrar, el sistema entrega un **carnet digital** que dura unas 8 horas. Al vencer, pide entrar de nuevo.
- Cada acción pregunta: **¿tu cargo tiene permiso para este módulo y esta acción?**
- Todo lo importante se anota en el **diario de auditoría**: quién entró, qué creó, qué aprobó.

## Niveles de acceso (de más a menos poder)

```mermaid
flowchart TD
    R0[🌟 Root / TI<br/>todo, incluso crear admins] --> R1[🛠️ Admin / Coordinador TI<br/>usuarios, módulos, sistema]
    R1 --> R2[📢 Comunicaciones<br/>publicar y aprobar anuncios]
    R2 --> R3[👩‍⚕️ Asistencial / 💼 Administrativo<br/>ver su área, tareas, formatos]
    R3 --> R4[👀 Lector<br/>solo consulta]

    style R0 fill:#c62828,color:#fff
    style R1 fill:#ef6c00,color:#fff
    style R2 fill:#0778AC,color:#fff
    style R3 fill:#2e7d32,color:#fff
    style R4 fill:#616161,color:#fff
```

En el sistema existen 14 cargos/roles (root, admin, ti, coordinador_ti, sistemas, comunicaciones, asistencial, administrativo, etc.). Cada cargo tiene una tabla de **módulo × acción** (ver, crear, aprobar, borrar).

## ¿Qué puede hacer cada uno?

| Acción | Lector | Asistencial / Admin. | Comunicaciones | Admin TI / Root |
|---|---|---|---|---|
| Ver portal y directorio | ✅ | ✅ | ✅ | ✅ |
| Comentar / tareas propias | — | ✅ | ✅ | ✅ |
| Crear anuncios | — | — | ✅ | ✅ |
| Aprobar / publicar | — | — | ✅ | ✅ |
| Crear usuarios y dar permisos | — | — | — | ✅ |
| Ver diario de auditoría | — | — | — | ✅ |

## ¿Qué pasa si algo sale mal?

- Contraseña olvidada → se pide restablecimiento y TI lo aprueba.
- Carnet vencido o inválido → se cierra la sesión y se pide entrar de nuevo.
- Intento sin permiso → se niega y queda registrado.
