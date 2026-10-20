-- V33__parametros_minio_credenciales.sql — Credenciales MinIO parametrizables.
-- Hasta ahora el endpoint y las credenciales de MinIO solo se podían definir por variables
-- de entorno (MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY) y no tenían efecto los
-- valores guardados en genparametro. A partir de V33 el cliente MinIO se construye leyendo
-- estos parámetros, por lo que la pantalla de Parámetros sí controla la conexión.
-- Se siembran vacíos: si están vacíos, el sistema usa las variables de entorno existentes.

INSERT INTO genparametro (clave, valor, descripcion, fecha_actualizacion) VALUES
    ('S3_ACCESS_KEY', '', 'Usuario (access key) de MinIO/S3. Vacío = usar variable de entorno', NOW()),
    ('S3_SECRET_KEY', '', 'Contraseña (secret key) de MinIO/S3. Vacío = usar variable de entorno', NOW())
ON CONFLICT (clave) DO NOTHING;

-- Alinea el endpoint con el valor real usado por el entorno (192.168.1.62) cuando el
-- registro sembrado quedó apuntando al contenedor local ya retirado (http://minio:9000).
UPDATE genparametro
   SET valor = 'http://192.168.1.62:9000', fecha_actualizacion = NOW()
 WHERE clave = 'S3_ENDPOINT'
   AND valor = 'http://minio:9000';
