# Intranet Corporativa Institucional - ICVC

Este proyecto es el portal de Intranet Corporativa para el **Instituto Cardiovascular del Cesar (ICVC)**. Ha sido diseñado como una solución integral para la gestión de comunicación interna, accesos directos a aplicativos hospitalarios, directorio institucional y administración de personal.

## 🚀 Tecnologías Utilizadas

*   **Frontend:** React 18 con Vite.
*   **Lenguaje:** TypeScript.
*   **Estilos:** Tailwind CSS (Arquitectura de componentes modernos y responsivos).
*   **Iconografía:** Lucide React.
*   **Context API:** Gestión de estados globales para Autenticación, Anuncios y Configuración del Sistema.

## ✨ Características Principales

### 1. Panel de Inicio (Dashboard)
*   **Accesos Rápidos:** Enlaces dinámicos a aplicativos como DGH, Enterprise, ActualPac, entre otros.
*   **Comunicados:** Sistema de visualización de anuncios y comunicados institucionales.
*   **Secciones por Áreas:** Paneles específicos para el Área Asistencial, Administrativa y de Gestión.

### 2. Módulos de Gestión
*   **Directorio Institucional:** Directorio completo de extensiones telefónicas con filtros por piso y tipo de área.
*   **Comunicaciones:** Módulo para que coordinadores y el área de comunicaciones gestionen los anuncios vigentes.
*   **Soporte Técnico:** Central de ayuda TI con contactos de técnicos y acceso a mesa de ayuda GLPI.
*   **Gestión Institucional:** Registro de logros y acreditaciones del instituto.

### 3. Administración del Sistema (Acceso Root/TI)
*   **Gestión de Usuarios:** Creación, edición y visualización de perfiles de usuario con roles granulares.
*   **Administrador de Intranet:** Panel para gestionar de forma dinámica los sitios de redirección (URLs e íconos) que aparecen en los módulos.
*   **Logs del Sistema:** Bitácora detallada de accesos y acciones realizadas por los usuarios.
*   **Matriz de Permisos:** Control de acceso detallado por módulos y acciones específicas por usuario.

## 🔐 Seguridad y Acceso

*   **Cuenta Root:** Existe un usuario maestro para configuración inicial (`root` / `icvc2024**`).
*   **Persistencia Volátil:** Por requerimiento de seguridad, la sesión se cierra automáticamente al refrescar la página.
*   **RBAC (Control de Acceso Basado en Roles):** Los menús y funciones se ocultan o muestran dinámicamente según el rol asignado (Asistencial, Administrativo, TI, Comunicaciones, etc.).

## 🛠️ Instalación y Desarrollo

1.  Clonar el repositorio.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Ejecutar en modo desarrollo:
    ```bash
    npm run dev
    ```
4.  Construir para producción:
    ```bash
    npm run build
    ```

## 📂 Estructura del Proyecto

*   `src/app/components`: Componentes reutilizables, modales y estructuras comunes.
*   `src/app/components/modules`: Módulos de página completa para cada sección funcional.
*   `src/app/contexts`: Proveedores de estado global (Auth, System, Announcements).
*   `src/styles`: Archivos de configuración de estilos y Tailwind.

---
**Instituto Cardiovascular del Cesar - Innovando en Salud.**