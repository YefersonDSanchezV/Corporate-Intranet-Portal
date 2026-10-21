-- V38__reencuadre_foto_cumpleanos.sql - Reencuadre de la foto dentro del marco.
--
-- La plantilla define el marco (circulo o recuadro) donde va la foto del funcionario.
-- Al asignar la plantilla, la foto se inserta automaticamente centrada y recortada
-- dentro de ese marco. Para poder ajustarla sin salirse de el se guardan, por cada
-- cumpleanos, el zoom y el desplazamiento de la foto respecto al marco.
--
--   fotozoom     factor de acercamiento (1 = ajuste automatico, sin zoom)
--   fotooffsetx  desplazamiento horizontal, % del ancho del marco
--   fotooffsety  desplazamiento vertical, % del alto del marco
--
-- Cumpleanos automaticos: genusucumple (prefijo genucum*)
-- Cumpleanos manuales:    gencumpleanos (prefijo gencum*)
--
-- Idempotente: puede ejecutarse sobre una BD con V37 aplicada.

ALTER TABLE genusucumple
    ADD COLUMN IF NOT EXISTS genucumfotozoom numeric(6, 3) NOT NULL DEFAULT 1;

ALTER TABLE genusucumple
    ADD COLUMN IF NOT EXISTS genucumfotooffsetx numeric(6, 3) NOT NULL DEFAULT 0;

ALTER TABLE genusucumple
    ADD COLUMN IF NOT EXISTS genucumfotooffsety numeric(6, 3) NOT NULL DEFAULT 0;

ALTER TABLE gencumpleanos
    ADD COLUMN IF NOT EXISTS gencumfotozoom numeric(6, 3) NOT NULL DEFAULT 1;

ALTER TABLE gencumpleanos
    ADD COLUMN IF NOT EXISTS gencumfotooffsetx numeric(6, 3) NOT NULL DEFAULT 0;

ALTER TABLE gencumpleanos
    ADD COLUMN IF NOT EXISTS gencumfotooffsety numeric(6, 3) NOT NULL DEFAULT 0;

COMMENT ON COLUMN genusucumple.genucumfotozoom IS
    'Zoom de la foto dentro del marco (1 = ajuste automatico)';
COMMENT ON COLUMN genusucumple.genucumfotooffsetx IS
    'Desplazamiento horizontal de la foto dentro del marco, en % del ancho';
COMMENT ON COLUMN genusucumple.genucumfotooffsety IS
    'Desplazamiento vertical de la foto dentro del marco, en % del alto';
COMMENT ON COLUMN gencumpleanos.gencumfotozoom IS
    'Zoom de la foto dentro del marco (1 = ajuste automatico)';
COMMENT ON COLUMN gencumpleanos.gencumfotooffsetx IS
    'Desplazamiento horizontal de la foto dentro del marco, en % del ancho';
COMMENT ON COLUMN gencumpleanos.gencumfotooffsety IS
    'Desplazamiento vertical de la foto dentro del marco, en % del alto';
