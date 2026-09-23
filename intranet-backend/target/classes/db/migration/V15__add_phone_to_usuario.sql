-- V15__add_phone_to_usuario.sql
-- Añade columna para teléfono del usuario (requerido desde frontend, antes solo localStorage)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='genusuario' AND column_name='genusutel') THEN
    ALTER TABLE genusuario ADD COLUMN genusutel varchar(50);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usuario_telefono ON genusuario (genusutel);
