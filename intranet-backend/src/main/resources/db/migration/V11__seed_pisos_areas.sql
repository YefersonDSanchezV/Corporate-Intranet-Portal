-- V11__seed_pisos_areas.sql
-- Corrige catálogo de pisos y áreas para Directorio (req 2.1, 3.1)
-- Pisos deben ser: Piso 1..6 + Betania (eliminar Urgencia, Línea de frente, etc. si existen datos de prueba, se normaliza)
-- Áreas informativas: Sistemas, Comunicaciones, Cartera, Facturación, General, etc.

-- Insertar pisos faltantes (idempotente)
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Piso 1' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Piso 1'));
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Piso 2' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Piso 2'));
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Piso 3' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Piso 3'));
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Piso 4' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Piso 4'));
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Piso 5' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Piso 5'));
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Piso 6' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Piso 6'));
INSERT INTO genpiso (oid, genpisnom)
SELECT COALESCE((SELECT MAX(oid) FROM genpiso),0)+1, 'Betania' WHERE NOT EXISTS (SELECT 1 FROM genpiso WHERE LOWER(genpisnom)=LOWER('Betania'));

-- Sincronizar secuencia piso
SELECT setval(pg_get_serial_sequence('genpiso','oid'), GREATEST(1, COALESCE((SELECT MAX(oid) FROM genpiso),1)), true);

-- Insertar áreas informativas comunes (si no existen)
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Sistemas' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Sistemas'));
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Comunicaciones' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Comunicaciones'));
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Cartera' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Cartera'));
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Facturación' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Facturación'));
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Talento Humano' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Talento Humano'));
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Administrativa' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Administrativa'));
INSERT INTO genarea (oid, genareanom)
SELECT COALESCE((SELECT MAX(oid) FROM genarea),0)+1, 'Asistencial' WHERE NOT EXISTS (SELECT 1 FROM genarea WHERE LOWER(genareanom)=LOWER('Asistencial'));

SELECT setval(pg_get_serial_sequence('genarea','oid'), GREATEST(1, COALESCE((SELECT MAX(oid) FROM genarea),1)), true);
