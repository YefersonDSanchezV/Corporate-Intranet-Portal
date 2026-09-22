-- V10__clear_default_sites_and_extensions.sql
-- Limpieza total por requerimiento "Mejoras y cambios.docx":
-- 1. Eliminar todos los sitios de redirección por defecto (Inicio y demás) para creación manual desde cero
-- 2. Limpiar extensiones/correos si tuvieran datos y cualquier rastro de Area Asistencial custom
-- Idempotente: DELETE no falla si ya está vacío. Se ejecuta después de V9.

-- 1. Sitios de redirección: borra todo lo existente (el usuario los recreará manualmente vía Admin > GeneralesSitiosView)
DELETE FROM gensitredireccion;

-- 2. Directorio: extensiones y correos (si hubiera datos seed o pruebas) - limpia para empezar desde cero
DELETE FROM gendircorreo;
DELETE FROM gendircextenciones;

-- 3. Innovación analítica / enlaces externos (si tuvieran datos por defecto)
DELETE FROM innovanalitica;
DELETE FROM asiconextern;

-- 4. Formatos de contingencia (asociados a Area Asistencial - DGH/Enterprise etc. ya eliminados del frontend)
DELETE FROM asiforconarchivo;
DELETE FROM asiforcontin;

-- 5. Logros de acreditación (se mantienen vacíos para que Logros obtenidos quede limpio; si quieres preservar, comenta este bloque)
-- DELETE FROM comlogroarchivo;
-- DELETE FROM comlogroacredi;

-- 6. Reinicia secuencias de identidad para que próximos inserts empiecen en 1
SELECT setval(pg_get_serial_sequence('gensitredireccion','oid'), 1, false);
SELECT setval(pg_get_serial_sequence('gendircextenciones','oid'), 1, false);
SELECT setval(pg_get_serial_sequence('gendircorreo','oid'), 1, false);
SELECT setval(pg_get_serial_sequence('innovanalitica','oid'), 1, false);
SELECT setval(pg_get_serial_sequence('asiconextern','oid'), 1, false);
SELECT setval(pg_get_serial_sequence('asiforcontin','oid'), 1, false);
