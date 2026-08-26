-- V7__seed_comunicaciones_cargo.sql — Asegura cargo "comunicaciones" para RBAC del módulo comunicaciones
INSERT INTO gencargointra (oid, gencarnom, gencaresta)
SELECT COALESCE((SELECT MAX(oid) FROM gencargointra), 0) + 1, 'comunicaciones', true
WHERE NOT EXISTS (SELECT 1 FROM gencargointra WHERE LOWER(gencarnom) = 'comunicaciones');

INSERT INTO gencargointra (oid, gencarnom, gencaresta)
SELECT COALESCE((SELECT MAX(oid) FROM gencargointra), 0) + 1, 'asistencial', true
WHERE NOT EXISTS (SELECT 1 FROM gencargointra WHERE LOWER(gencarnom) = 'asistencial');

INSERT INTO gencargointra (oid, gencarnom, gencaresta)
SELECT COALESCE((SELECT MAX(oid) FROM gencargointra), 0) + 1, 'administrativo', true
WHERE NOT EXISTS (SELECT 1 FROM gencargointra WHERE LOWER(gencarnom) = 'administrativo');
