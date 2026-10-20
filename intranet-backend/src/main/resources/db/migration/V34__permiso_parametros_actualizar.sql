-- V34__permiso_parametros_actualizar.sql — Permiso de actualización de parámetros.
-- Antes, PUT /api/parametros/{clave} no declaraba @RequiresPermission y el interceptor
-- fail-closed lo bloqueaba con 403 para cualquier usuario sin bypass ROLE_ADMIN. Ahora
-- exige 'parametros-comunicaciones:actualizar'; se concede a los cargos que ya podían
-- grabar en ese módulo para no dejarlos sin acceso tras el cambio.

INSERT INTO gencargopermiso (gencargointra, permiso, tipo)
SELECT DISTINCT gencargointra, 'parametros-comunicaciones:actualizar', 'ACCION'
  FROM gencargopermiso
 WHERE permiso = 'parametros-comunicaciones:grabar' AND tipo = 'ACCION'
ON CONFLICT (gencargointra, permiso, tipo) DO NOTHING;
