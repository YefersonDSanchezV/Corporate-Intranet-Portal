-- V8__seed_base_catalogs.sql
-- Catálogos mínimos para persistencia de Sitios, Extensiones y Correos

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Inicio', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Inicio'));

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Area Asistencial', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Area Asistencial'));

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Area Administrativa', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Area Administrativa'));

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Gestion Institucional', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Gestion Institucional'));

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Soporte', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Soporte'));

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Directorio', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Directorio'));

INSERT INTO genmodulo (genmodnom, genmodest)
SELECT 'Innovacion Analitica', true
WHERE NOT EXISTS (SELECT 1 FROM genmodulo WHERE LOWER(genmodnom) = LOWER('Innovacion Analitica'));

INSERT INTO genarea (genareanom)
SELECT 'General'
WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom) = LOWER('General'));

INSERT INTO genpiso (genpisnom)
SELECT 'Principal'
WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom) = LOWER('Principal'));

