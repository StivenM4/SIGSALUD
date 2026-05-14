
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;

INSERT INTO lis_menus (texto, ruta, icono_bootstrap, permiso_requerido, orden, activo)
VALUES
('Dashboard','/','bi-speedometer2','LIS_ACCESS',1,TRUE),
('Órdenes','/ordenes','bi-clipboard2-pulse','LIS_ORDERS',2,TRUE),
('Muestras','/muestras','bi-upc-scan','LIS_SAMPLES',3,TRUE),
('Resultados','/resultados','bi-vial','LIS_RESULTS',4,TRUE),
('Validación','/validacion','bi-check2-circle','LIS_VALIDATE',5,TRUE),
('Reportes','/reportes','bi-file-earmark-pdf','LIS_RESULTS',6,TRUE),
('Pacientes','/pacientes','bi-person-vcard','LIS_RESULTS',7,TRUE),
('Auditoría','/auditoria','bi-shield-check','LIS_AUDIT',8,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO auditoria_lis (usuario_email, accion, entidad, detalle, ip, user_agent)
SELECT 'bacteriologo@sigsalud.com','REVISION_AUDITORIA','sistema','Registro demo de auditoría LIS generado por parche','127.0.0.1','SQL Patch'
WHERE NOT EXISTS (SELECT 1 FROM auditoria_lis LIMIT 1);

COMMIT;
