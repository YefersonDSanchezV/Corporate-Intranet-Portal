-- V13__add_cargo_to_correo.sql
-- Persiste el Cargo del correo institucional como texto libre (campo independiente de Área)
-- Fase 2: corrige bug #4 donde cargo se duplicaba con área (mapper copiaba areaNombre)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gendircorreo' AND column_name='gendircorcargo'
  ) THEN
    ALTER TABLE gendircorreo ADD COLUMN gendircorcargo varchar(255);
  END IF;
END $$;

-- Retro-compatibilidad: si hay correos existentes sin cargo, copiar área como cargo inicial
UPDATE gendircorreo SET gendircorcargo = genarea.genareanom
FROM genarea WHERE gendircorreo.gendircorare = genarea.oid AND gendircorreo.gendircorcargo IS NULL;

CREATE INDEX IF NOT EXISTS idx_dir_cor_cargo ON gendircorreo (gendircorcargo);
