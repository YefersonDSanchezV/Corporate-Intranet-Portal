-- V12__add_tipo_to_extension.sql
-- Persiste el Rol de la extensión (asistencial / administrativo) que antes se hardcodeaba en mappers
-- Fase 2: corrige bug #3 donde el área/rol se restablecía a administrativo tras reload

-- Añadir columna tipo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='gendircextenciones' AND column_name='gendirexttipo'
  ) THEN
    ALTER TABLE gendircextenciones ADD COLUMN gendirexttipo varchar(20) NOT NULL DEFAULT 'administrativo';
  END IF;
END $$;

-- Constraint de valores permitidos (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='chk_gendir_ext_tipo'
  ) THEN
    ALTER TABLE gendircextenciones ADD CONSTRAINT chk_gendir_ext_tipo CHECK (gendirexttipo IN ('asistencial','administrativo'));
  END IF;
END $$;

-- Índice para filtro por tipo
CREATE INDEX IF NOT EXISTS idx_dir_ext_tipo ON gendircextenciones (gendirexttipo);
