-- V29__create_parametros.sql — Tabla de parámetros generales (genparametro).

CREATE TABLE IF NOT EXISTS genparametro (
    clave character varying(100) PRIMARY KEY,
    valor TEXT,
    descripcion character varying(255),
    fecha_actualizacion timestamp
);

INSERT INTO genparametro (clave, valor, descripcion, fecha_actualizacion) VALUES
    ('FOTOS_CUMPLE_BUCKET', 'fotos-cumpleanos', 'Bucket S3 para fotos de cumpleaños', NOW()),
    ('FOTOS_CUMPLE_MAX_MB', '2', 'Tamaño máximo en MB para fotos de cumpleaños', NOW()),
    ('FOTOS_CUMPLE_MIME', 'image/jpeg,image/png,image/jpg', 'MIME types permitidos para fotos de cumpleaños', NOW()),
    ('S3_ENDPOINT', 'http://minio:9000', 'Endpoint S3/MinIO', NOW()),
    ('VIDEO_BUCKET', 'videos', 'Bucket S3 para videos', NOW()),
    ('DOCS_BUCKET', 'documentos', 'Bucket S3 para documentos', NOW())
ON CONFLICT (clave) DO NOTHING;
