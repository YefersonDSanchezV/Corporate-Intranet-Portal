-- V8__seed_base_catalogs.sql
-- Catálogos mínimos para persistencia de Sitios, Extensiones y Correos
-- Usa oid explícito para compatibilidad con BDs existentes donde oid es integer sin IDENTITY (baseline-on-migrate=true)

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Inicio', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Inicio'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Area Asistencial', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Area Asistencial'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Area Administrativa', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Area Administrativa'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Gestion Institucional', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Gestion Institucional'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Soporte', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Soporte'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Directorio', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Directorio'));

INSERT INTO genmodulo (oid, genmodnom, genmodest)
SELECT COALESCE((SELECT MAX(oid) FROM genmodulo), 0) + 1, 'Innovacion Analitica', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Innovacion Analitica'));

INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea), 0) + 1, 'General'
WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom) = LOWER('General'));

INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso), 0) + 1, 'Principal'
WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom) = LOWER('Principal'));

