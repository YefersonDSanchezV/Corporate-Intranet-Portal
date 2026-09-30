-- V18__add_acceso_rapido_to_sitio.sql — Flag para marcar sitios como Acceso Rápido
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensitredireccion' AND column_name='gensitaccesorapido') THEN
    ALTER TABLE gensitredireccion ADD COLUMN gensitaccesorapido boolean NOT NULL DEFAULT false;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_sitio_accesorapido ON gensitredireccion(gensitaccesorapido);
