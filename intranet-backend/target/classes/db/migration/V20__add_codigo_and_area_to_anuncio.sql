-- V20__add_codigo_and_area_to_anuncio.sql — Código SOLANU-AAAA-MM-#### y área que informa
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comanuncio' AND column_name='comanucodigo') THEN
    ALTER TABLE comanuncio ADD COLUMN comanucodigo character varying(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comanuncio' AND column_name='comanuarea') THEN
    ALTER TABLE comanuncio ADD COLUMN comanuarea character varying(255);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_anuncio_codigo_unique ON comanuncio(comanucodigo) WHERE comanucodigo IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anuncio_area ON comanuncio(comanuarea);
