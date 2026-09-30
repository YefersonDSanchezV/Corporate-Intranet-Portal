-- V17__seed_modulo_and_acceso_rapido.sql
-- Soporte para cambios docx: módulo "Módulo" (contenedor de Sitio de Redirección) y "Acceso Rápido"

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Módulo', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Módulo'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Acceso Rápido', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Acceso Rápido'));

-- Alias sin acento para compatibilidad con normalize() frontend (AccesoRapido)
INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'AccesoRapido', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(REPLACE(genmodnom,' ','')) = LOWER('accesorapido'));
