-- V21__seed_tipo_anuncio.sql
-- Catálogo mínimo de tipos de anuncio (referenciado por comanuncio.comanutipo).
-- Sin este seed, POST /api/announcements responde 404 porque el frontend envía tipoOid=1.
-- Usa oid explícito para compatibilidad con BDs existentes donde oid es integer sin IDENTITY
-- (baseline-on-migrate=true). Con la tabla vacía, MAX(oid) es NULL y se genera oid=1.

INSERT INTO comtipoanuncio (oid, comtipnom)
SELECT COALESCE((SELECT MAX(oid) FROM comtipoanuncio), 0) + 1, 'Comunicado'
WHERE NOT EXISTS (SELECT 1 FROM comtipoanuncio WHERE LOWER(comtipnom) = LOWER('Comunicado'));
