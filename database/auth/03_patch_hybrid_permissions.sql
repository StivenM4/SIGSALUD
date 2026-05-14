
BEGIN;

INSERT INTO permisos (codigo, sistema_id, descripcion, activo)
SELECT 'HIS_VIEW_LIS_RESULTS', s.id, 'Permite ver en HIS los resultados de laboratorio recibidos desde LIS', TRUE
FROM sistemas s WHERE s.codigo='HIS'
ON CONFLICT (codigo) DO UPDATE SET descripcion=EXCLUDED.descripcion, activo=TRUE;

INSERT INTO permisos (codigo, sistema_id, descripcion, activo)
SELECT 'HIS_VIEW_RIS_RESULTS', s.id, 'Permite ver en HIS los informes radiológicos recibidos desde RIS', TRUE
FROM sistemas s WHERE s.codigo='HIS'
ON CONFLICT (codigo) DO UPDATE SET descripcion=EXCLUDED.descripcion, activo=TRUE;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permisos p
WHERE r.nombre='administrador'
ON CONFLICT DO NOTHING;

INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM roles r
JOIN permisos p ON p.codigo IN ('HIS_RESULTS','HIS_VIEW_LIS_RESULTS','HIS_VIEW_RIS_RESULTS')
WHERE r.nombre IN ('medico_general','paciente')
ON CONFLICT DO NOTHING;

COMMIT;
