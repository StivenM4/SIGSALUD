INSERT INTO sistemas (codigo, nombre, descripcion, url_callback, icono_bootstrap, color) VALUES
('HIS', 'Hospital Information System', 'Historia clínica, pacientes, citas y órdenes', 'http://localhost:8001/auth/callback', 'bi-hospital', 'primary'),
('LIS', 'Laboratory Information System', 'Laboratorio, muestras y resultados', 'http://localhost:8002/auth/callback', 'bi-flask', 'success'),
('RIS', 'Radiology Information System', 'Radiología, PACS Orthanc e informes', 'http://localhost:8003/auth/callback', 'bi-badge-3d', 'purple')
ON CONFLICT (codigo) DO UPDATE SET
nombre = EXCLUDED.nombre,
descripcion = EXCLUDED.descripcion,
url_callback = EXCLUDED.url_callback,
icono_bootstrap = EXCLUDED.icono_bootstrap,
color = EXCLUDED.color,
activo = TRUE;

INSERT INTO roles (nombre, descripcion) VALUES
('administrador', 'Acceso completo a SIGSALUD'),
('medico_general', 'Médico con acceso HIS'),
('recepcionista', 'Registro administrativo de pacientes y citas'),
('medico_laboratorio', 'Médico del área de laboratorio'),
('bacteriologo', 'Validación profesional de resultados LIS'),
('tecnico_laboratorio', 'Toma de muestra y procesamiento LIS'),
('medico_radiologo', 'Médico/radiólogo con acceso PACS, informes y validación RIS'),
('tecnico_radiologia', 'Agenda y ejecución técnica RIS'),
('paciente', 'Consulta limitada de resultados')
ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion, activo = TRUE;

INSERT INTO permisos (codigo, sistema_id, descripcion)
SELECT x.codigo, s.id, x.descripcion
FROM (VALUES
('HIS_ACCESS','HIS','Acceso al HIS'),
('HIS_PATIENTS','HIS','Gestión de pacientes'),
('HIS_APPOINTMENTS','HIS','Gestión de citas'),
('HIS_MEDICAL_RECORDS','HIS','Historia clínica'),
('HIS_ORDERS','HIS','Órdenes diagnósticas'),
('HIS_RESULTS','HIS','Resultados e informes'),
('HIS_VIEW_LIS_RESULTS','HIS','Ver resultados LIS anexados en HIS'),
('HIS_VIEW_RIS_RESULTS','HIS','Ver informes RIS anexados en HIS'),
('HIS_AUDIT','HIS','Auditoría HIS'),
('LIS_ACCESS','LIS','Acceso al LIS'),
('LIS_ORDERS','LIS','Órdenes de laboratorio'),
('LIS_SAMPLES','LIS','Toma y trazabilidad de muestras'),
('LIS_RESULTS','LIS','Resultados de laboratorio'),
('LIS_VALIDATE','LIS','Validación de resultados'),
('LIS_SEND_HIS','LIS','Envío de resultados al HIS'),
('LIS_AUDIT','LIS','Auditoría LIS'),
('RIS_ACCESS','RIS','Acceso al RIS'),
('RIS_AGENDA','RIS','Agenda radiológica'),
('RIS_EXECUTION','RIS','Ejecución técnica de estudios'),
('RIS_PACS','RIS','Consulta PACS/Orthanc'),
('RIS_REPORTS','RIS','Informes radiológicos'),
('RIS_VALIDATE','RIS','Validación de informes'),
('RIS_SEND_HIS','RIS','Envío de informes al HIS'),
('RIS_AUDIT','RIS','Auditoría RIS')
) AS x(codigo, sistema, descripcion)
JOIN sistemas s ON s.codigo = x.sistema
ON CONFLICT (codigo) DO UPDATE SET descripcion = EXCLUDED.descripcion, activo = TRUE;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p WHERE r.nombre = 'administrador'
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'medico_general' AND p.codigo IN ('HIS_ACCESS','HIS_MEDICAL_RECORDS','HIS_ORDERS','HIS_RESULTS','HIS_VIEW_LIS_RESULTS','HIS_VIEW_RIS_RESULTS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'recepcionista' AND p.codigo IN ('HIS_ACCESS','HIS_PATIENTS','HIS_APPOINTMENTS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'medico_laboratorio' AND p.codigo IN ('LIS_ACCESS','LIS_ORDERS','LIS_RESULTS','LIS_VALIDATE','LIS_SEND_HIS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'bacteriologo' AND p.codigo IN ('LIS_ACCESS','LIS_ORDERS','LIS_SAMPLES','LIS_RESULTS','LIS_VALIDATE','LIS_SEND_HIS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'tecnico_laboratorio' AND p.codigo IN ('LIS_ACCESS','LIS_ORDERS','LIS_SAMPLES','LIS_RESULTS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'medico_radiologo' AND p.codigo IN ('RIS_ACCESS','RIS_PACS','RIS_REPORTS','RIS_VALIDATE','RIS_SEND_HIS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'tecnico_radiologia' AND p.codigo IN ('RIS_ACCESS','RIS_AGENDA','RIS_EXECUTION','RIS_PACS')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r, permisos p WHERE r.nombre = 'paciente' AND p.codigo IN ('HIS_ACCESS','HIS_RESULTS','HIS_VIEW_LIS_RESULTS','HIS_VIEW_RIS_RESULTS')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (nombre, email, password_hash) VALUES
('Administrador SIGSALUD', 'admin@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Dr. Médico General', 'medico@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Recepción Principal', 'recepcion@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Dr. Médico Laboratorio', 'medico.laboratorio@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Bacteriólogo Demo', 'bacteriologo@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Técnico Laboratorio Demo', 'laboratorio@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Dr. Médico Radiólogo', 'medico.radiologia@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Técnico Radiología Demo', 'radiologia@sigsalud.com', crypt('Admin123*', gen_salt('bf'))),
('Paciente Demo', 'paciente@sigsalud.com', crypt('Admin123*', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuario_rol (usuario_id, rol_id)
SELECT u.id, r.id FROM usuarios u, roles r WHERE
(u.email = 'admin@sigsalud.com' AND r.nombre = 'administrador') OR
(u.email = 'medico@sigsalud.com' AND r.nombre = 'medico_general') OR
(u.email = 'recepcion@sigsalud.com' AND r.nombre = 'recepcionista') OR
(u.email = 'medico.laboratorio@sigsalud.com' AND r.nombre = 'medico_laboratorio') OR
(u.email = 'bacteriologo@sigsalud.com' AND r.nombre = 'bacteriologo') OR
(u.email = 'laboratorio@sigsalud.com' AND r.nombre = 'tecnico_laboratorio') OR
(u.email = 'medico.radiologia@sigsalud.com' AND r.nombre = 'medico_radiologo') OR
(u.email = 'radiologia@sigsalud.com' AND r.nombre = 'tecnico_radiologia') OR
(u.email = 'paciente@sigsalud.com' AND r.nombre = 'paciente')
ON CONFLICT DO NOTHING;
