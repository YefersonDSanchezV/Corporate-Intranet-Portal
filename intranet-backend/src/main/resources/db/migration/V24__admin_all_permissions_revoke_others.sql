-- V24__admin_all_permissions_revoke_others.sql
-- Otorga TODOS los permisos al/los cargo(s) administrador y revoca todas las filas de
-- permisos (gencargopermiso) de los demás cargos.
-- Administrador = cargo llamado 'Administrador' o cargos de usuarios con rol comrol ADMIN.
-- Los módulos/acciones declarados se extraen de las anotaciones @RequiresPermission de la app.

-- 1) Identifica el/los cargo(s) administrador.
CREATE TEMP TABLE admin_cargos AS
SELECT DISTINCT c.oid
FROM gencargointra c
WHERE c.gencarnom = 'Administrador'
UNION
SELECT DISTINCT u.gencargointra
FROM comusuario cu
JOIN comrol r ON r.oid = cu.comrol AND lower(r.comrolnom) = 'admin'
JOIN genusuario u ON u.oid = cu.genusuario;

-- 2) Instantánea de todos los módulos del menú conocidos (antes de revocar).
CREATE TEMP TABLE all_module_keys AS
SELECT DISTINCT permiso FROM gencargopermiso WHERE tipo = 'MODULO';

-- 3) Revoca TODOS los permisos de los cargos que no son administrador.
DELETE FROM gencargopermiso WHERE gencargointra NOT IN (SELECT oid FROM admin_cargos);

-- 4) Garantiza módulos: los conocidos del menú + los declarados en los endpoints.
WITH modulos AS (
    SELECT permiso FROM all_module_keys
    UNION
    SELECT m FROM (VALUES
        ('accesos-rapidos'),
        ('anuncios-pendientes'),
        ('cargos'),
        ('consulta-externa'),
        ('crear-anuncio'),
        ('crear-usuario'),
        ('directorio-correos'),
        ('directorio-extensiones'),
        ('enlace-redireccion'),
        ('formatos-contingencia'),
        ('logros-acreditaciones'),
        ('logs'),
        ('permisos'),
        ('sitios'),
        ('solicitudes'),
        ('tareas-seguimiento'),
        ('usuarios')
    ) v(m)
)
INSERT INTO gencargopermiso (gencargointra, permiso, tipo)
SELECT a.oid, m.permiso, 'MODULO'
FROM admin_cargos a CROSS JOIN modulos m
ON CONFLICT (gencargointra, permiso, tipo) DO NOTHING;

-- 5) Acciones declaradas module:accion.
INSERT INTO gencargopermiso (gencargointra, permiso, tipo)
SELECT a.oid, act.accion, 'ACCION'
FROM admin_cargos a CROSS JOIN (VALUES
        ('accesos-rapidos:actualizar'),
        ('anuncios-pendientes:actualizar'),
        ('anuncios-pendientes:eliminar'),
        ('cargos:activar'),
        ('cargos:actualizar'),
        ('cargos:grabar'),
        ('consulta-externa:actualizar'),
        ('consulta-externa:eliminar'),
        ('consulta-externa:grabar'),
        ('crear-anuncio:grabar'),
        ('crear-usuario:grabar'),
        ('directorio-correos:actualizar'),
        ('directorio-correos:eliminar'),
        ('directorio-correos:grabar'),
        ('directorio-extensiones:actualizar'),
        ('directorio-extensiones:eliminar'),
        ('directorio-extensiones:grabar'),
        ('enlace-redireccion:actualizar'),
        ('enlace-redireccion:eliminar'),
        ('enlace-redireccion:grabar'),
        ('formatos-contingencia:actualizar'),
        ('formatos-contingencia:eliminar'),
        ('formatos-contingencia:grabar'),
        ('logros-acreditaciones:actualizar'),
        ('logros-acreditaciones:eliminar'),
        ('logros-acreditaciones:grabar'),
        ('logs:grabar'),
        ('permisos:actualizar'),
        ('permisos:eliminar'),
        ('permisos:grabar'),
        ('sitios:activar'),
        ('sitios:actualizar'),
        ('sitios:eliminar'),
        ('sitios:grabar'),
        ('solicitudes:actualizar'),
        ('tareas-seguimiento:actualizar'),
        ('tareas-seguimiento:grabar'),
        ('usuarios:activar'),
        ('usuarios:actualizar')
    ) act(accion)
ON CONFLICT (gencargointra, permiso, tipo) DO NOTHING;
