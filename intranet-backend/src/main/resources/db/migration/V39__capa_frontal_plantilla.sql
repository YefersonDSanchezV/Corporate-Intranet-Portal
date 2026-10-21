-- V39__capa_frontal_plantilla.sql — Capa frontal opcional de la plantilla de cumpleaños.
--
-- Hay artes que dibujan adornos ENCIMA del círculo donde va la foto: por ejemplo el
-- gorro de Papá Noel de la plantilla navideña. Como la foto se superpone al arte, esos
-- adornos quedarían tapados por la cara del funcionario.
--
-- Esta capa permite cargar un PNG con transparencia que se dibuja por encima de la
-- foto y por debajo del nombre, el cargo y la fecha. Es opcional: si la plantilla no
-- la tiene, se dibuja como hasta ahora (arte + foto + textos).
--
-- El orden final de capas queda: arte base → foto → capa frontal → textos.
--
-- Idempotente: puede ejecutarse sobre una BD con V31..V38 aplicadas.

ALTER TABLE genplantillacumple
    ADD COLUMN IF NOT EXISTS genplanfrente integer;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_genplantillacumple_frente') THEN
    -- ON DELETE SET NULL y no CASCADE: borrar el adorno nunca debe borrar la plantilla.
    ALTER TABLE genplantillacumple
        ADD CONSTRAINT fk_genplantillacumple_frente
        FOREIGN KEY (genplanfrente) REFERENCES genarchivo (oid) ON DELETE SET NULL;
  END IF;
END $$;

COMMENT ON COLUMN genplantillacumple.genplanfrente IS
    'PNG (preferible con transparencia) que se dibuja por encima de la foto del funcionario y por debajo de los textos; opcional.';
