
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;

ALTER TABLE informes_radiologia ADD COLUMN IF NOT EXISTS pregunta_clinica TEXT;
ALTER TABLE informes_radiologia ADD COLUMN IF NOT EXISTS tecnica_usada TEXT;
ALTER TABLE informes_radiologia ADD COLUMN IF NOT EXISTS estudio_relacionado_id UUID;

INSERT INTO estados_estudio_radiologia (codigo, nombre, activo) VALUES
('ADMITIDO','Admitido',TRUE),
('IMAGENES_DISPONIBLES','Imágenes disponibles',TRUE),
('EJECUTADO_TECNICO','Ejecutado por tecnólogo',TRUE),
('INFORME_GUARDADO','Informe guardado',TRUE),
('DEFINITIVO','Definitivo firmado',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre=EXCLUDED.nombre, activo=TRUE;

INSERT INTO ris_menus (texto, ruta, icono_bootstrap, permiso_requerido, orden, activo)
VALUES
('Dashboard','/','bi-speedometer2','RIS_ACCESS',1,TRUE),
('Órdenes','/ordenes','bi-clipboard2-pulse','RIS_ACCESS',2,TRUE),
('Agenda','/agenda','bi-calendar2-week','RIS_AGENDA',3,TRUE),
('Ejecución tecnológica','/ejecucion','bi-person-gear','RIS_EXECUTION',4,TRUE),
('Estudios','/estudios','bi-activity','RIS_ACCESS',5,TRUE),
('PACS / Orthanc','/orthanc/find','bi-images','RIS_PACS',6,TRUE),
('Informes médicos','/informes','bi-file-earmark-medical','RIS_REPORTS',7,TRUE),
('Pacientes','/pacientes','bi-person-vcard','RIS_ACCESS',8,TRUE),
('Auditoría','/auditoria','bi-shield-check','RIS_AUDIT',9,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO auditoria_ris (usuario_email, accion, entidad, detalle, ip, user_agent)
SELECT 'medico.radiologia@sigsalud.com','REVISION_AUDITORIA','sistema','Registro demo de auditoría RIS generado por parche','127.0.0.1','SQL Patch'
WHERE NOT EXISTS (SELECT 1 FROM auditoria_ris LIMIT 1);

COMMIT;
