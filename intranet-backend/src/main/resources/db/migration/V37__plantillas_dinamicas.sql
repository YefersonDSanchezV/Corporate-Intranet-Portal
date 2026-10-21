-- V37__plantillas_dinamicas.sql — Plantillas de cumpleaños dinámicas.
--
-- Hasta ahora la plantilla solo permitía posicionar la FOTO; el nombre, el cargo y
-- la fecha se dibujaban en una franja oscura fija al pie. A partir de esta versión
-- cada plantilla guarda la posición y el estilo de sus campos dinámicos en un JSON
-- (genplanconfig), de modo que el resto del arte queda fijo y solo cambian los
-- datos de la persona.
--
-- Además se marca para qué meses aplica la plantilla (por ejemplo, una plantilla
-- navideña solo para diciembre) y el formato original del archivo cargado (PDF o
-- imagen), porque los PDF se rasterizan a imagen para poder superponer el texto.
--
-- Idempotente: puede ejecutarse sobre una BD con V31..V36 aplicadas.

ALTER TABLE genplantillacumple
    ADD COLUMN IF NOT EXISTS genplanconfig TEXT;

ALTER TABLE genplantillacumple
    ADD COLUMN IF NOT EXISTS genplanmeses character varying(30);

ALTER TABLE genplantillacumple
    ADD COLUMN IF NOT EXISTS genplanorigen character varying(20);

COMMENT ON COLUMN genplantillacumple.genplanconfig IS
    'JSON con posición/estilo de los campos dinámicos (nombre, cargo, fecha) en porcentaje';
COMMENT ON COLUMN genplantillacumple.genplanmeses IS
    'Meses en que aplica la plantilla, separados por coma (1..12). NULL o vacío = todo el año';
COMMENT ON COLUMN genplantillacumple.genplanorigen IS
    'Formato original cargado: PDF o IMAGEN (los PDF se rasterizan a PNG)';

-- Las plantillas existentes quedan como "todo el año" y sin configuración de texto:
-- la aplicación aplica los valores por defecto cuando genplanconfig es NULL.
UPDATE genplantillacumple
   SET genplanorigen = 'IMAGEN'
 WHERE genplanorigen IS NULL;
