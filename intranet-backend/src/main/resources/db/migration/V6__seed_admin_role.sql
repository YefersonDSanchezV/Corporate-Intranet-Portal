-- V6__seed_admin_role.sql — Rol ADMIN para RBAC del panel de control
-- Inserción idempotente: no falla si el rol ya existe (creado por AdminSeeder o manualmente)

INSERT INTO comrol (oid, comrolnom, comroldes)
SELECT COALESCE((SELECT MAX(oid) FROM comrol), 0) + 1, 'ADMIN', 'Administrador del panel de control'
WHERE NOT EXISTS (SELECT 1 FROM comrol WHERE comrolnom = 'ADMIN');
