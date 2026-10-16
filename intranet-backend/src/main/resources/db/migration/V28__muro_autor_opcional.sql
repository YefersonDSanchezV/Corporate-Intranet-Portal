-- V28__muro_autor_opcional.sql — El muro lo escribe todo el personal,
-- con o sin sesión: el autor pasa a ser opcional y se guarda el nombre
-- a mostrar (invitados lo escriben, logueados se toma de su cuenta).
-- Idempotente para BDs nuevas y existentes.

ALTER TABLE genmuromen ALTER COLUMN genusuario DROP NOT NULL;

ALTER TABLE genmuromen ADD COLUMN IF NOT EXISTS genmuromennom character varying(60);

-- Los mensajes existentes heredan el nombre del autor como nombre a mostrar.
UPDATE genmuromen m
SET genmuromennom = u.genusunomcom
FROM genusuario u
WHERE m.genmuromennom IS NULL AND m.genusuario = u.oid;
