# Intranet ICVC — Guía en Lenguaje Sencillo

> Instituto Cardiovascular del Cesar. Documentación pensada para **directivos, personal asistencial, administrativo y comunicaciones**. Sin tecnicismos.

## ¿Qué hay en esta carpeta?

| Documento | ¿Qué responde? |
|---|---|
| [01 Qué es la Intranet](01-QUE-ES-LA-INTRANET.md) | ¿Para qué sirve? ¿A quién le sirve? |
| [02 Cómo está construida](02-COMO-ESTA-CONSTRUIDA.md) | Las 3 piezas del sistema con gráficos |
| [03 Qué puede hacer](03-QUE-PUEDE-HACER.md) | Los 7 módulos + panel de administración |
| [04 Seguridad y roles](04-SEGURIDAD-Y-ROLES.md) | Quién puede ver y hacer qué |
| [05 Dónde vive y cómo se enciende](05-DONDE-VIVE-Y-COMO-SE-ENCIENDE.md) | Dónde está instalada, cómo prenderla/apagarla |

## La idea en 30 segundos

```mermaid
flowchart LR
    U[👥 Personas del ICVC] --> P[🌐 Portal web<br/>lo que se ve en pantalla]
    P --> C[⚙️ Cerebro<br/>procesa y cuida los datos]
    C --> B[🗄️ Archivo seguro<br/>donde se guarda todo]

    style U fill:#e3f2fd,stroke:#1976d2
    style P fill:#fff3e0,stroke:#ef6c00
    style C fill:#e8f5e9,stroke:#2e7d32
    style B fill:#f3e5f5,stroke:#7b1fa2
```

1. La persona abre el portal en su navegador.
2. El portal le pide información al cerebro.
3. El cerebro la busca en el archivo seguro y la devuelve.

> Detalle técnico completo (para TI): ver `ARQUITECTURA_Y_TOPOLOGIA.md` en esta misma carpeta.
