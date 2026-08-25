# Implementación Frontend — Capa API + Contexts con Fallback + Limpieza

> **Proyecto:** Intranet Institucional (ICVC) — Corporate-Intranet-Portal
> **Fecha:** 2026-08-19
> **Relacionado con:** `intranet-backend/docs/PLAN_IMPLEMENTACION.md` (fases 1, 2, 3, 4, 8)

---

## 1. Qué se implementó

### 1.1 Capa API (`src/app/api/`)
Wrapper central de `fetch` sobre la base `/api` con:
- Manejo de errores tipado (`ApiError` con `status`).
- Parseo JSON automático, headers `Content-Type: application/json`.
- Timeout configurable por request (8s por defecto, 2.5s para sondeos).
- Helper `apiAvailable()` que comprueba si el backend responde con un timeout corto para no degradar la UX.

Módulos tipados por dominio (alineados a los endpoints de la sección 4 del plan):
| Módulo | Endpoints |
|---|---|
| `client.ts` | infraestructura (`apiFetch`, `getJSON`, `apiAvailable`) |
| `auth.ts` | `/auth/login`, `/auth/logout`, `/me`, `/cargos`, `/areas` |
| `users.ts` | `/users*`, `/access-requests*`, `/password-reset-requests*` |
| `announcements.ts` | `/announcements*`, `/announcement-types` |
| `tasks.ts` | `/tasks*` (+ comentarios) |
| `achievements.ts` | `/achievements*` |
| `directory.ts` | `/directory/extensions*`, `/directory/emails*`, `/directory/floors`, `/directory/areas` |
| `sites.ts` | `/modules`, `/sites*` |
| `files.ts` | `/files*` (upload/download/delete) |
| `logs.ts` | `/logs*` |

Los tipos TS se reutilizan de los contexts existentes (`User`, `Announcement`, `Task`, `Achievement`, `Role`, `RedirectSite`, `DirectoryEntry`, `InstitutionEmail`, `EpsPlatform`, `ContingencyFormat`).

### 1.2 Contexts conectados con fallback seguro
La UI sigue funcionando 100 % con mock/localStorage cuando el backend no está corriendo:

- **AuthContext**: al montar intenta `GET /api/me` con timeout corto; si responde usa el usuario real, si falla mantiene el login mock (solo en dev, con credenciales centralizadas).
- **AnnouncementsContext**: al montar comprueba `apiAvailable()` y luego `GET /api/announcements`; si falla, usa `localStorage`.
- **SystemContext**: al montar carga `GET /api/sites` + `GET /api/directory/extensions` + `GET /api/directory/emails` (vía `Promise.all`); si falla, usa `localStorage`/mock.

Ningún context reemplaza aún las mutaciones (los CRUD siguen siendo locales); solo la **carga inicial** de datos cambia de origen cuando la API responde. El home sigue siendo **público** (no se reintrodujo ningún gate de Login en `App.tsx`).

### 1.3 Limpieza de código muerto y duplicación
- Eliminados módulos, modales y vistas admin sin importaciones (verificado con grep antes de borrar).
- Eliminados ~44 componentes shadcn/ui sin uso; se mantienen `calendar`, `dialog`, `button`, `utils`.
- Eliminados imports y variables sin uso en archivos vivos (solo los confirmados en el código actual).
- Eliminado el hack roto `import("react").then(...)` de `RegisterAnnouncementModal` (reemplazado por un `useEffect` normal).
- Eliminada la duplicación D3: nuevo util compartido `src/app/utils/roles.ts` con `hasRole(user, roles[])` + listas de roles (`ADMIN_PANEL_ROLES`, `ASISTENCIAL_PANEL_ROLES`, `TI_SUPPORT_ROLES`), usado en `HomeModule`, `DirectoryModule` e `ITSupportContactsModal`.
- Credenciales de prueba centralizadas en `src/app/utils/dev-credentials.ts` (`DEV_CREDENTIALS`), importadas desde `AuthContext`, `AdminAuthContext`, `Login` y `AdminLoginModal`.
- Removido el dropdown inalcanzable de `Navigation` (ningún ítem del menú tiene hijos).

---

## 2. Archivos creados

```
Corporate-Intranet-Portal/
├── docs/
│   └── FRONTEND_IMPLEMENTACION.md        (este documento)
└── src/app/
    ├── api/
    │   ├── client.ts
    │   ├── auth.ts
    │   ├── users.ts
    │   ├── announcements.ts
    │   ├── tasks.ts
    │   ├── achievements.ts
    │   ├── directory.ts
    │   ├── sites.ts
    │   ├── files.ts
    │   └── logs.ts
    └── utils/
        ├── dev-credentials.ts
        └── roles.ts
```

## 3. Archivos eliminados

**Módulos (ya no existían):** `CommunicationsModule`, `IntranetAdminModule`, `LogsModule`, `UserManagementModule`.

**Modales sin importar (13):** `BiometricModal`, `ContractManagementCompleteModal`, `ContractManagementModal`, `ContractManagementNewModal`, `ContractMatrixModal`, `EpsManagementModal`, `EventReportModal`, `ExtensionsModal`, `InstitutionalManualsModal`, `InternalAnnouncementsModal`, `InternalDocumentationModal`, `ManagementIndicatorsModal`, `QualityEventReportModal`.

**Transitivos:** `TaskModal`, `NewTaskModal`.

**Vistas admin sin importar (4):** `AsistencialEpsView`, `AsistencialFormatsView`, `ComunicacionesTareasView`, `InnovacionAnaliticaView`.

**Otros:** `RecentAccessSection`, `logos/ICVCLogo`, `logos/ICVCLogoHorizontal`.

**shadcn/ui sin uso (~44):** `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `drawer`, `dropdown-menu`, `form`, `hover-card`, `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`, `use-mobile`.

## 4. Archivos modificados

- `src/app/contexts/AuthContext.tsx` — probe `/api/me` al montar + `DEV_CREDENTIALS`.
- `src/app/contexts/AnnouncementsContext.tsx` — carga desde `/api/announcements` con fallback.
- `src/app/contexts/SystemContext.tsx` — carga desde `/api/sites` y `/api/directory/*` con fallback.
- `src/app/contexts/AdminAuthContext.tsx` — `DEV_CREDENTIALS`.
- `src/app/components/Login.tsx`, `admin/AdminLoginModal.tsx` — hint de credenciales desde `DEV_CREDENTIALS`.
- `src/app/components/modules/HomeModule.tsx`, `DirectoryModule.tsx` — uso de `hasRole`.
- `src/app/components/modals/ITSupportContactsModal.tsx` — uso de `hasRole`.
- `src/app/components/modals/RegisterAnnouncementModal.tsx` — quitado `publishAnnouncement`/`announcements` sin uso y el hack de `import("react")`.
- `src/app/components/modals/ExternalConsultationModal.tsx` — quitado `user` sin uso.
- `src/app/components/modals/AccreditationAchievementsModal.tsx` — quitados handlers nunca invocados.
- `src/app/components/modules/AdministrativeAreaModule.tsx` — quitado `contractMatrixOpen` sin uso y rama muerta.
- `src/app/components/QuickAccessSection.tsx` — quitado `user` sin uso.
- `src/app/components/Navigation.tsx` — quitado dropdown inalcanzable.
- `src/app/components/admin/views/GeneralesUsuariosView.tsx` — quitado import `Users` sin uso.

## 5. Cómo se activa el modo API real

El frontend detecta el backend automáticamente:

1. Levantar el backend Spring Boot en `http://localhost:8080` (el proxy de vite `/api → localhost:8080` ya existe en `vite.config.ts`).
2. Con `npm run dev` el frontend hace los sondeos (`GET /api/me`) al montar cada context:
   - Si el backend responde → los contexts cargan datos reales desde la API.
   - Si no responde (timeout 2.5s o error) → se mantiene el modo mock/localStorage.
3. No hay bandera manual: el modo API se activa/desactiva solo según disponibilidad del backend.

> Las credenciales de prueba `root` / `icvc2024**` son SOLO para visualización en dev y están centralizadas en `src/app/utils/dev-credentials.ts`. No se siembran en el backend como credenciales válidas.

## 6. Cómo ejecutar

```bash
cd Corporate-Intranet-Portal
npm run dev      # desarrollo (Vite, proxy /api → localhost:8080)
npm run build    # build de producción (vite build)
```

No hay script de lint definido en `package.json` (`npm run lint` no existe).

## 7. Pendiente / riesgos

- **Pendiente (plan sección 2):** refactorización grande D1/D2 (hook `useModulePage` + `ModuleAppGrid`) y D5 (unificar modales de contratos) se documentan como pendientes: alto riesgo de romper la UI con bajo beneficio inmediato. D6 (`ModalShell`) y D7 (`useMemo` en `DirectoryModule`) también quedan pendientes por el mismo criterio de riesgo/beneficio.
- **Pendiente:** reemplazar las mutaciones de los contexts (CRUD) por llamadas API en las fases 2–7 del plan (hoy solo la carga inicial viene de la API).
- **Riesgo:** el catálogo de apps mock (D4) en `SystemContext` sigue como fallback mientras el backend no exponga `/api/sites`; se eliminará cuando la Fase 4 del plan esté completa.

## 8. Endpoints consumidos por cada context

| Context | Endpoints consumidos (al montar) |
|---|---|
| `AuthContext` | `GET /api/me` |
| `AnnouncementsContext` | `GET /api/announcements` |
| `SystemContext` | `GET /api/sites`, `GET /api/directory/extensions`, `GET /api/directory/emails` |
| `AdminAuthContext` | ninguno aún (login mock en dev) |

Los demás módulos API (`auth`, `users`, `tasks`, `achievements`, `files`, `logs`, `sites` CRUD) quedan disponibles para las fases siguientes del plan (2–7).