-- V14__expand_solicitud_usuario.sql
-- Amplía gensolusuario para Solicitudes con nombres separados, celular y fecha nacimiento
-- Requerido por Mejoras y cambios.docx: Primer Nombre, Segundo Nombre, Primer Apellido, Segundo Apellido, Celular, Cargo, Fecha Nacimiento

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensolusuario' AND column_name='gensolusuprinom') THEN
    ALTER TABLE gensolusuario ADD COLUMN gensolusuprinom varchar(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensolusuario' AND column_name='gensolusegnom') THEN
    ALTER TABLE gensolusuario ADD COLUMN gensolusegnom varchar(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensolusuario' AND column_name='gensoluspriapell') THEN
    ALTER TABLE gensolusuario ADD COLUMN gensoluspriapell varchar(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensolusuario' AND column_name='gensolusegapell') THEN
    ALTER TABLE gensolusuario ADD COLUMN gensolusegapell varchar(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensolusuario' AND column_name='gensoluscel') THEN
    ALTER TABLE gensolusuario ADD COLUMN gensoluscel varchar(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='gensolusuario' AND column_name='gensolusfecnac') THEN
    ALTER TABLE gensolusuario ADD COLUMN gensolusfecnac date;
  END IF;
END $$;

-- Backfill: si hay solicitudes antiguas con gensolusunomb, intentar separar no necesario, dejar null en nuevos campos

-- Índice por identificación para validación rápida
CREATE INDEX IF NOT EXISTS idx_solicitud_identificacion ON gensolusuario (gensolusuiden);
