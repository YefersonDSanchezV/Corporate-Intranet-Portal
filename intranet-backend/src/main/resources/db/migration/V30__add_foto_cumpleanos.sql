-- V30__add_foto_cumpleanos.sql — Foto obligatoria en cumpleaños manuales.

ALTER TABLE gencumpleanos ADD COLUMN IF NOT EXISTS gencumfoto_archivo_oid INT NULL REFERENCES genarchivo(oid) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cumple_foto ON gencumpleanos(gencumfoto_archivo_oid);
