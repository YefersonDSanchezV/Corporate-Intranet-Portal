-- V23__resync_identity_sequences.sql
-- Re-sincroniza TODAS las columnas IDENTITY al MAX(oid) actual de cada tabla.
-- Corrige la colisión "duplicate key value violates unique constraint" en tablas legacy
-- cuyas secuencias de identity quedaron desincronizadas (V9 solo resincronizó un subconjunto:
-- genlogs, gensolusuario, comrol, compermisos, comusuario, comtarcome, asiforcontin, etc. no).
-- Idempotente: resincronizar una secuencia ya alineada es inocuo.
DO $$
DECLARE
    col        RECORD;
    seq        TEXT;
    max_oid    BIGINT;
BEGIN
    FOR col IN
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        JOIN pg_class t ON t.relname = c.table_name AND t.relkind = 'r'
        WHERE c.table_schema = 'public'
          AND c.is_identity = 'YES'
    LOOP
        BEGIN
            seq := pg_get_serial_sequence('public.' || col.table_name, col.column_name);
            IF seq IS NULL THEN
                CONTINUE;
            END IF;
            EXECUTE format('SELECT GREATEST(1, COALESCE(MAX(%I),1)) FROM public.%I',
                           col.column_name, col.table_name) INTO max_oid;
            PERFORM setval(seq::regclass, max_oid, true);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No se pudo resincronizar secuencia de % (%)', col.table_name, col.column_name;
        END;
    END LOOP;
END $$;