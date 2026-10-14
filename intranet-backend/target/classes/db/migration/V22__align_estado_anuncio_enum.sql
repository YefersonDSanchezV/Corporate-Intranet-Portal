-- V22__align_estado_anuncio_enum.sql
--
-- PROBLEMA: el enum de la base de datos no coincide con el enum de Java.
-- Esta base hereda su esquema del ddl-auto de Hibernate, por eso el tipo real se llama
-- `enum_estado_anuncio` (convención de Hibernate) y sus etiquetas están en CamelCase:
--     Pendiente, Aprobado, Publicado
-- V1__baseline.sql declara `CREATE TYPE "EstadoAnuncio"` pero NUNCA se ejecutó en esta
-- base (flyway_schema_history muestra `1 | << Flyway Baseline >>`), así que el tipo
-- "EstadoAnuncio" del baseline no existe.
--
-- El backend (EstadoAnuncio) y el frontend (filtros ?estado=PENDIENTE / PUBLICADO) usan
-- 4 etiquetas en mayúsculas. Toda escritura fallaba con:
--     SQLState 22P02 - invalid input value for enum enum_estado_anuncio: "PENDIENTE"
--
-- Esta migración normaliza el tipo a `enum_estado_anuncio` con las 4 etiquetas mayúsculas
-- que espera el backend, preservando los datos existentes y funcionando también sobre
-- bases nuevas donde sí se ejecutó V1__baseline.sql (tipo "EstadoAnuncio").

DO $$
DECLARE
    col_type    text;
    had_default boolean;
BEGIN
    SELECT udt_name INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'comanuncio'
      AND column_name = 'comanuestado';

    IF col_type IS NULL THEN
        RAISE NOTICE 'comanuncio.comanuestado no existe; nada que hacer.';
        RETURN;
    END IF;

    -- Ya está alineado: exactamente 4 etiquetas y todas en mayúsculas.
    IF col_type = 'enum_estado_anuncio'
       AND (SELECT count(*) FROM pg_enum e
             JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'enum_estado_anuncio') = 4
       AND (SELECT count(*) FROM pg_enum e
             JOIN pg_type t ON t.oid = e.enumtypid
             WHERE t.typname = 'enum_estado_anuncio'
               AND e.enumlabel NOT IN ('PENDIENTE','PUBLICADO','RECHAZADO','VENCIDO')) = 0 THEN
        RAISE NOTICE 'enum_estado_anuncio ya está alineado; nada que hacer.';
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_attrdef d
        JOIN pg_class     c ON c.oid = d.adrelid
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.adnum
        WHERE c.relname = 'comanuncio' AND a.attname = 'comanuestado'
    ) INTO had_default;

    -- El DEFAULT referencia al tipo viejo ('Pendiente'::enum_estado_anuncio) y PostgreSQL
    -- no puede castearlo automáticamente al tipo nuevo, así que hay que quitarlo primero.
    IF had_default THEN
        ALTER TABLE comanuncio ALTER COLUMN comanuestado DROP DEFAULT;
    END IF;

    CREATE TYPE enum_estado_anuncio_new AS ENUM ('PENDIENTE','PUBLICADO','RECHAZADO','VENCIDO');

    ALTER TABLE comanuncio
        ALTER COLUMN comanuestado TYPE enum_estado_anuncio_new
        USING (
            CASE upper(comanuestado::text)
                WHEN 'PENDIENTE' THEN 'PENDIENTE'
                WHEN 'PUBLICADO' THEN 'PUBLICADO'
                WHEN 'RECHAZADO' THEN 'RECHAZADO'
                WHEN 'VENCIDO'   THEN 'VENCIDO'
                -- Etiquetas heredadas en CamelCase
                WHEN 'APROBADO'  THEN 'PUBLICADO'
                ELSE 'PENDIENTE'
            END
        )::enum_estado_anuncio_new;

    -- Restaurar el DEFAULT con su equivalente en la nueva nomenclatura.
    IF had_default THEN
        ALTER TABLE comanuncio
            ALTER COLUMN comanuestado SET DEFAULT 'PENDIENTE'::enum_estado_anuncio_new;
    END IF;

    -- Liberar el nombre del tipo antiguo antes de renombrar el nuevo.
    IF col_type = 'enum_estado_anuncio' THEN
        DROP TYPE enum_estado_anuncio;
    END IF;

    ALTER TYPE enum_estado_anuncio_new RENAME TO enum_estado_anuncio;

    -- Si la base venía del baseline con "EstadoAnuncio", ya quedó sin referencias.
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EstadoAnuncio') THEN
        EXECUTE 'DROP TYPE "EstadoAnuncio"';
    END IF;
END $$;
