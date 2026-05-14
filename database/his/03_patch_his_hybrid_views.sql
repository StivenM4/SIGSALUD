
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;

INSERT INTO his_menus (texto, ruta, icono_bootstrap, permiso_requerido, orden, activo)
VALUES
('Historias','/historias','bi-journal-medical','HIS_MEDICAL_RECORDS',4,TRUE),
('Resultados','/resultados','bi-file-earmark-medical','HIS_RESULTS',6,TRUE),
('Resultados LIS','/resultados/lis','bi-vial','HIS_VIEW_LIS_RESULTS',7,TRUE),
('Informes RIS','/resultados/ris','bi-file-earmark-medical','HIS_VIEW_RIS_RESULTS',8,TRUE),
('Notificaciones','/notificaciones','bi-bell','HIS_RESULTS',9,TRUE),
('Auditoría','/auditoria','bi-shield-check','HIS_AUDIT',10,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO auditoria_his (usuario_email, accion, entidad, detalle, ip, user_agent)
SELECT 'admin@sigsalud.com','REVISION_AUDITORIA','sistema','Registro demo de auditoría HIS generado por parche','127.0.0.1','SQL Patch'
WHERE NOT EXISTS (SELECT 1 FROM auditoria_his LIMIT 1);

COMMIT;
