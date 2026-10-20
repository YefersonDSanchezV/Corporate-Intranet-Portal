-- V36__permiso_carpetas_eliminar.sql — Permisos de gestión de carpetas de almacenamiento.
-- El catálogo dinámico de carpetas (POST/PUT/PATCH/DELETE /api/carpetas-almacen) declara
-- @RequiresPermission con el módulo 'parametros-comunicaciones'. Las acciones 'eliminar'
-- y 'activar' aún no existían para ese módulo, así que el interceptor fail-closed las
-- habría bloqueado. Se conceden a los cargos que ya podían grabar/actualizar en el módulo,
-- siguiendo el mismo criterio que V34.

INSERT INTO gencargopermiso (gencargointra, permiso, tipo)
SELECT DISTINCT gencargointra, 'parametros-comunicaciones:eliminar', 'ACCION'
  FROM gencargopermiso
 WHERE permiso IN ('parametros-comunicaciones:grabar', 'parametros-comunicaciones:actualizar')
   AND tipo = 'ACCION'
ON CONFLICT (gencargointra, permiso, tipo) DO NOTHING;

INSERT INTO gencargopermiso (gencargointra, permiso, tipo)
SELECT DISTINCT gencargointra, 'parametros-comunicaciones:activar', 'ACCION'
  FROM gencargopermiso
 WHERE permiso IN ('parametros-comunicaciones:grabar', 'parametros-comunicaciones:actualizar')
   AND tipo = 'ACCION'
ON CONFLICT (gencargointra, permiso, tipo) DO NOTHING;
