
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO tipos_documento (codigo, nombre, activo) VALUES
('CC','Cédula de ciudadanía',TRUE),
('TI','Tarjeta de identidad',TRUE),
('CE','Cédula de extranjería',TRUE),
('PA','Pasaporte',TRUE),
('RC','Registro civil',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO generos (codigo, nombre, activo) VALUES
('M','Masculino',TRUE),
('F','Femenino',TRUE),
('O','Otro',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO estados_cita (codigo, nombre, activo) VALUES
('PROGRAMADA','Programada',TRUE),
('CONFIRMADA','Confirmada',TRUE),
('ATENDIDA','Atendida',TRUE),
('CANCELADA','Cancelada',TRUE),
('NO_ASISTE','No asiste',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO prioridades_orden (codigo, nombre, activo) VALUES
('RUTINA','Rutina',TRUE),
('PRIORITARIA','Prioritaria',TRUE),
('URGENTE','Urgente',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO estados_orden (codigo, nombre, activo) VALUES
('CREADA','Creada',TRUE),
('ENVIADA','Enviada',TRUE),
('RECIBIDA','Recibida',TRUE),
('EN_PROCESO','En proceso',TRUE),
('RESULTADO_DISPONIBLE','Resultado disponible',TRUE),
('FINALIZADA','Finalizada',TRUE),
('CANCELADA','Cancelada',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO tipos_orden_diagnostica (codigo, nombre, sistema_destino, activo) VALUES
('LAB','Orden de laboratorio','LIS',TRUE),
('RAD','Orden de radiología','RIS',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, sistema_destino = EXCLUDED.sistema_destino, activo = TRUE;

INSERT INTO sistemas_integracion (codigo, nombre, endpoint_base, activo) VALUES
('LIS','Laboratory Information System','http://localhost:8002/api',TRUE),
('RIS','Radiology Information System','http://localhost:8003/api',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, endpoint_base = EXCLUDED.endpoint_base, activo = TRUE;

INSERT INTO aseguradoras (id, nombre, nit, activo) VALUES
('aaaa0000-0000-4000-8000-000000000001','EPS Demo Salud','900000001',TRUE),
('aaaa0000-0000-4000-8000-000000000002','Nueva EPS Demo','900000002',TRUE),
('aaaa0000-0000-4000-8000-000000000003','Sanitas Demo','900000003',TRUE),
('aaaa0000-0000-4000-8000-000000000004','Compensar Demo','900000004',TRUE),
('aaaa0000-0000-4000-8000-000000000005','Particular','000000000',TRUE)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, nit = EXCLUDED.nit, activo = TRUE;

INSERT INTO especialidades (id, nombre, activo) VALUES
('bbbb0000-0000-4000-8000-000000000001','Medicina general',TRUE),
('bbbb0000-0000-4000-8000-000000000002','Urgencias',TRUE),
('bbbb0000-0000-4000-8000-000000000003','Medicina interna',TRUE),
('bbbb0000-0000-4000-8000-000000000004','Radiología',TRUE),
('bbbb0000-0000-4000-8000-000000000005','Laboratorio clínico',TRUE),
('bbbb0000-0000-4000-8000-000000000006','Pediatría',TRUE),
('bbbb0000-0000-4000-8000-000000000007','Ginecología',TRUE)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO medicos_referentes (id, nombre, email, especialidad_id, activo) VALUES
('cccc0000-0000-4000-8000-000000000001','Dr. Andrés Rojas','andres.rojas@sigsalud.test','bbbb0000-0000-4000-8000-000000000001',TRUE),
('cccc0000-0000-4000-8000-000000000002','Dra. Camila Torres','camila.torres@sigsalud.test','bbbb0000-0000-4000-8000-000000000002',TRUE),
('cccc0000-0000-4000-8000-000000000003','Dr. Julián Pérez','julian.perez@sigsalud.test','bbbb0000-0000-4000-8000-000000000003',TRUE),
('cccc0000-0000-4000-8000-000000000004','Dra. Laura Méndez','laura.mendez@sigsalud.test','bbbb0000-0000-4000-8000-000000000004',TRUE),
('cccc0000-0000-4000-8000-000000000005','Dr. Mateo Gómez','mateo.gomez@sigsalud.test','bbbb0000-0000-4000-8000-000000000005',TRUE),
('cccc0000-0000-4000-8000-000000000006','Dra. Natalia Castro','natalia.castro@sigsalud.test','bbbb0000-0000-4000-8000-000000000006',TRUE)
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, email = EXCLUDED.email, especialidad_id = EXCLUDED.especialidad_id, activo = TRUE;

INSERT INTO diagnosticos_cie10 (codigo, nombre, activo) VALUES
('R51','Cefalea',TRUE),
('R50','Fiebre de otro origen y de origen desconocido',TRUE),
('J189','Neumonía no especificada',TRUE),
('Z000','Examen médico general',TRUE),
('R104','Otros dolores abdominales y los no especificados',TRUE),
('I10X','Hipertensión esencial primaria',TRUE),
('E119','Diabetes mellitus no insulinodependiente sin complicaciones',TRUE),
('N390','Infección de vías urinarias, sitio no especificado',TRUE),
('M545','Lumbago no especificado',TRUE),
('R074','Dolor torácico no especificado',TRUE),
('K529','Gastroenteritis y colitis no infecciosas, no especificadas',TRUE),
('D649','Anemia no especificada',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO procedimientos_cups (codigo, nombre, tipo, activo) VALUES
('902210','Hemograma IV','LAB',TRUE),
('903895','Creatinina en suero u otros fluidos','LAB',TRUE),
('906625','Troponina I cuantitativa','LAB',TRUE),
('903841','Glucosa en suero u otros fluidos','LAB',TRUE),
('903859','Urea en suero','LAB',TRUE),
('903866','Perfil lipídico','LAB',TRUE),
('907106','Parcial de orina','LAB',TRUE),
('904902','Proteína C reactiva','LAB',TRUE),
('903818','Alanino aminotransferasa ALT','LAB',TRUE),
('903815','Aspartato aminotransferasa AST','LAB',TRUE),
('879111','Radiografía de tórax','RAD',TRUE),
('879420','Tomografía de cráneo simple','RAD',TRUE),
('883101','Ecografía abdominal total','RAD',TRUE),
('879301','Radiografía de columna lumbosacra','RAD',TRUE),
('879410','Tomografía de tórax','RAD',TRUE),
('879402','Tomografía de abdomen','RAD',TRUE),
('883201','Ecografía pélvica','RAD',TRUE),
('890201','Consulta médica general','CLINICO',TRUE),
('890301','Consulta de control','CLINICO',TRUE),
('891401','Toma de presión arterial','CLINICO',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo, activo = TRUE;

WITH menu_data(texto, ruta, icono_bootstrap, permiso_requerido, orden, activo) AS (
  VALUES
  ('Dashboard','/','bi-speedometer2','HIS_ACCESS',1,TRUE),
  ('Pacientes','/pacientes','bi-people','HIS_PATIENTS',2,TRUE),
  ('Citas','/citas','bi-calendar2-week','HIS_APPOINTMENTS',3,TRUE),
  ('Historias','/historias','bi-journal-medical','HIS_MEDICAL_RECORDS',4,TRUE),
  ('Órdenes','/ordenes','bi-clipboard2-pulse','HIS_ORDERS',5,TRUE),
  ('Resultados','/resultados','bi-file-earmark-medical','HIS_RESULTS',6,TRUE),
  ('Notificaciones','/notificaciones','bi-bell','HIS_RESULTS',7,TRUE),
  ('Auditoría','/auditoria','bi-shield-check','HIS_AUDIT',8,TRUE)
)
INSERT INTO his_menus (texto, ruta, icono_bootstrap, permiso_requerido, orden, activo)
SELECT d.texto, d.ruta, d.icono_bootstrap, d.permiso_requerido, d.orden, d.activo
FROM menu_data d
WHERE NOT EXISTS (
  SELECT 1 FROM his_menus m WHERE m.texto = d.texto AND m.ruta = d.ruta
);

-- =========================
-- Datos clínicos masivos
-- 150 pacientes, 240 citas, 120 atenciones, 240 órdenes
-- =========================

DO $$
DECLARE
  i INTEGER;
  j INTEGER;
  k INTEGER;
  paciente_id UUID;
  historia_id UUID;
  contacto_id UUID;
  pa_id UUID;
  consentimiento_id UUID;
  antecedente_id UUID;
  cita_id UUID;
  atencion_id UUID;
  evolucion_id UUID;
  nota_id UUID;
  diag_atencion_id UUID;
  proc_atencion_id UUID;
  orden_id UUID;
  detalle_id UUID;
  integracion_id UUID;
  resultado_id UUID;
  notificacion_id UUID;
  tipo_doc_id INTEGER;
  genero_id INTEGER;
  estado_cita_id INTEGER;
  estado_orden_id INTEGER;
  tipo_orden_id INTEGER;
  prioridad_id INTEGER;
  aseguradora_id UUID;
  especialidad_id UUID;
  medico_id UUID;
  diagnostico_id UUID;
  procedimiento_id UUID;
  sistema_destino_val VARCHAR(10);
  tipo_proc VARCHAR(10);
  nombres TEXT[] := ARRAY['Carlos','María','Andrés','Laura','Sofía','Juan','Camila','Mateo','Valentina','Sebastián','Natalia','Daniel','Paula','Felipe','Isabella','Julián','Gabriela','Miguel','Lucía','Santiago'];
  segundos TEXT[] := ARRAY['Alejandro','Andrea','José','Patricia','Fernando','Marcela','David','Carolina','Esteban','Fernanda','Ricardo','Daniela','Mauricio','Juliana','Nicolás','Adriana','Simón','Catalina','Tomás','Elena'];
  apellidos TEXT[] := ARRAY['Gómez','Rodríguez','Martínez','López','García','Pérez','Sánchez','Ramírez','Torres','Díaz','Moreno','Castro','Vargas','Rojas','Herrera','Jiménez','Mendoza','Suárez','Ortiz','Cruz'];
  lab_codes TEXT[] := ARRAY['902210','903895','906625','903841','903859','903866','907106','904902','903818','903815'];
  rad_codes TEXT[] := ARRAY['879111','879420','883101','879301','879410','879402','883201'];
  cie_codes TEXT[] := ARRAY['R51','R50','J189','Z000','R104','I10X','E119','N390','M545','R074','K529','D649'];
BEGIN
  FOR i IN 1..150 LOOP
    paciente_id := ('10000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    historia_id := ('11000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    contacto_id := ('12000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    pa_id := ('13000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    consentimiento_id := ('14000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;

    SELECT id INTO tipo_doc_id FROM tipos_documento ORDER BY id OFFSET ((i - 1) % 5) LIMIT 1;
    SELECT id INTO genero_id FROM generos ORDER BY id OFFSET ((i - 1) % 3) LIMIT 1;
    SELECT id INTO aseguradora_id FROM aseguradoras ORDER BY nombre OFFSET ((i - 1) % 5) LIMIT 1;

    INSERT INTO pacientes (
      id, tipo_documento_id, numero_documento, primer_nombre, segundo_nombre,
      primer_apellido, segundo_apellido, fecha_nacimiento, genero_id, telefono,
      email, direccion, activo, created_at, updated_at
    ) VALUES (
      paciente_id,
      tipo_doc_id,
      (1000000000 + i)::text,
      nombres[((i - 1) % array_length(nombres, 1)) + 1],
      segundos[((i - 1) % array_length(segundos, 1)) + 1],
      apellidos[((i - 1) % array_length(apellidos, 1)) + 1],
      apellidos[((i + 6) % array_length(apellidos, 1)) + 1],
      DATE '1945-01-01' + ((i * 137) % 25000),
      genero_id,
      '300' || lpad(i::text, 7, '0'),
      'paciente' || lpad(i::text, 3, '0') || '@sigsalud.test',
      'Calle ' || ((i % 120) + 1) || ' # ' || ((i % 80) + 1) || '-' || ((i % 90) + 10),
      TRUE,
      NOW() - ((i % 90) || ' days')::interval,
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET
      telefono = EXCLUDED.telefono,
      email = EXCLUDED.email,
      direccion = EXCLUDED.direccion,
      updated_at = NOW();

    INSERT INTO historias_clinicas (id, paciente_id, numero_historia, estado, created_at)
    VALUES (historia_id, paciente_id, 'HC-' || (1000000000 + i)::text, 'ACTIVA', NOW() - ((i % 90) || ' days')::interval)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO paciente_aseguradora (id, paciente_id, aseguradora_id, numero_afiliacion, activo, created_at)
    VALUES (pa_id, paciente_id, aseguradora_id, 'AFI-' || lpad(i::text, 6, '0'), TRUE, NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO contactos_emergencia (id, paciente_id, nombre, parentesco, telefono, created_at)
    VALUES (contacto_id, paciente_id, 'Contacto ' || i, CASE WHEN i % 3 = 0 THEN 'Padre/Madre' WHEN i % 3 = 1 THEN 'Cónyuge' ELSE 'Hermano(a)' END, '310' || lpad(i::text, 7, '0'), NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO consentimientos_medicos (id, paciente_id, tipo, descripcion, aceptado, firmado_at)
    VALUES (consentimiento_id, paciente_id, 'Tratamiento de datos y atención clínica', 'Consentimiento informado demo para pruebas SIGSALUD', TRUE, NOW() - ((i % 30) || ' days')::interval)
    ON CONFLICT (id) DO NOTHING;

    FOR j IN 1..2 LOOP
      antecedente_id := ('15000000-0000-4000-8000-' || lpad((i * 10 + j)::text, 12, '0'))::uuid;
      INSERT INTO antecedentes (id, historia_id, tipo, descripcion, registrado_por, created_at)
      VALUES (
        antecedente_id,
        historia_id,
        CASE WHEN j = 1 THEN 'Personal' ELSE 'Familiar' END,
        CASE WHEN j = 1 THEN 'Antecedente personal demo: hipertensión, alergias o cirugías según revisión clínica.' ELSE 'Antecedente familiar demo: enfermedad cardiovascular o metabólica.' END,
        NULL,
        NOW() - ((i % 40) || ' days')::interval
      ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END LOOP;

  FOR i IN 1..240 LOOP
    cita_id := ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    paciente_id := ('10000000-0000-4000-8000-' || lpad((((i - 1) % 150) + 1)::text, 12, '0'))::uuid;

    SELECT id INTO estado_cita_id FROM estados_cita ORDER BY id OFFSET ((i - 1) % 5) LIMIT 1;
    SELECT id INTO especialidad_id FROM especialidades ORDER BY nombre OFFSET ((i - 1) % 7) LIMIT 1;
    SELECT id INTO medico_id FROM medicos_referentes ORDER BY nombre OFFSET ((i - 1) % 6) LIMIT 1;

    INSERT INTO citas (id, paciente_id, medico_id, especialidad_id, estado_id, fecha_hora, motivo, created_at, updated_at)
    VALUES (
      cita_id,
      paciente_id,
      medico_id,
      especialidad_id,
      estado_cita_id,
      (CURRENT_DATE - INTERVAL '25 days') + ((i % 60) || ' days')::interval + (((7 + (i % 10)) || ' hours')::interval),
      CASE WHEN i % 4 = 0 THEN 'Control médico general' WHEN i % 4 = 1 THEN 'Dolor o malestar general' WHEN i % 4 = 2 THEN 'Revisión de resultados' ELSE 'Solicitud de apoyo diagnóstico' END,
      NOW() - ((i % 40) || ' days')::interval,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR i IN 1..120 LOOP
    atencion_id := ('21000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    evolucion_id := ('22000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    nota_id := ('23000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    historia_id := ('11000000-0000-4000-8000-' || lpad((((i - 1) % 150) + 1)::text, 12, '0'))::uuid;
    cita_id := ('20000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;

    INSERT INTO atenciones (id, historia_id, cita_id, medico_usuario_id, motivo_consulta, enfermedad_actual, analisis, plan_manejo, created_at)
    VALUES (
      atencion_id,
      historia_id,
      cita_id,
      NULL,
      CASE WHEN i % 3 = 0 THEN 'Dolor torácico' WHEN i % 3 = 1 THEN 'Fiebre y malestar general' ELSE 'Control y revisión de antecedentes' END,
      'Paciente consulta con síntomas de evolución variable. Se realiza valoración clínica completa.',
      'Se solicitan ayudas diagnósticas según criterio médico y antecedentes.',
      'Manejo sintomático, recomendaciones generales y seguimiento con resultados.',
      NOW() - ((i % 30) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO evoluciones_medicas (id, atencion_id, descripcion, usuario_id, created_at)
    VALUES (evolucion_id, atencion_id, 'Evolución médica demo: paciente estable, pendiente revisión de ayudas diagnósticas.', NULL, NOW())
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO notas_alta (id, atencion_id, resumen, recomendaciones, created_at)
    VALUES (nota_id, atencion_id, 'Alta médica demo o cierre de atención ambulatoria.', 'Consultar nuevamente si presenta signos de alarma.', NOW())
    ON CONFLICT (id) DO NOTHING;

    SELECT id INTO diagnostico_id FROM diagnosticos_cie10 WHERE codigo = cie_codes[((i - 1) % array_length(cie_codes,1)) + 1];
    diag_atencion_id := ('24000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO diagnosticos_atencion (id, atencion_id, diagnostico_id, tipo)
    VALUES (diag_atencion_id, atencion_id, diagnostico_id, CASE WHEN i % 5 = 0 THEN 'RELACIONADO' ELSE 'PRINCIPAL' END)
    ON CONFLICT (id) DO NOTHING;

    SELECT id INTO procedimiento_id FROM procedimientos_cups WHERE codigo = '890201';
    proc_atencion_id := ('25000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO procedimientos_atencion (id, atencion_id, procedimiento_id)
    VALUES (proc_atencion_id, atencion_id, procedimiento_id)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR i IN 1..240 LOOP
    orden_id := ('30000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    integracion_id := ('31000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    paciente_id := ('10000000-0000-4000-8000-' || lpad((((i - 1) % 150) + 1)::text, 12, '0'))::uuid;
    historia_id := ('11000000-0000-4000-8000-' || lpad((((i - 1) % 150) + 1)::text, 12, '0'))::uuid;
    atencion_id := CASE WHEN i <= 120 THEN ('21000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid ELSE NULL END;
    sistema_destino_val := CASE WHEN i % 2 = 0 THEN 'LIS' ELSE 'RIS' END;
    tipo_proc := CASE WHEN sistema_destino_val = 'LIS' THEN 'LAB' ELSE 'RAD' END;

    SELECT id INTO tipo_orden_id FROM tipos_orden_diagnostica WHERE sistema_destino = sistema_destino_val LIMIT 1;
    SELECT id INTO prioridad_id FROM prioridades_orden ORDER BY id OFFSET ((i - 1) % 3) LIMIT 1;
    SELECT id INTO estado_orden_id FROM estados_orden WHERE codigo = CASE WHEN i % 7 = 0 THEN 'FINALIZADA' WHEN i % 5 = 0 THEN 'RESULTADO_DISPONIBLE' WHEN i % 3 = 0 THEN 'EN_PROCESO' ELSE 'RECIBIDA' END;

    INSERT INTO ordenes_diagnosticas (
      id, numero_orden, paciente_id, historia_id, atencion_id, tipo_orden_id,
      prioridad_id, estado_id, sistema_destino, observaciones, creado_por, created_at, updated_at
    ) VALUES (
      orden_id,
      'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0'),
      paciente_id,
      historia_id,
      atencion_id,
      tipo_orden_id,
      prioridad_id,
      estado_orden_id,
      sistema_destino_val,
      CASE WHEN sistema_destino_val = 'LIS' THEN 'Orden de laboratorio generada desde HIS para pruebas de integración.' ELSE 'Orden de radiología generada desde HIS para agenda RIS y PACS.' END,
      NULL,
      NOW() - ((i % 25) || ' days')::interval,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    FOR k IN 1..3 LOOP
      IF sistema_destino_val = 'LIS' THEN
        SELECT id INTO procedimiento_id FROM procedimientos_cups WHERE codigo = lab_codes[((i + k - 2) % array_length(lab_codes,1)) + 1];
      ELSE
        SELECT id INTO procedimiento_id FROM procedimientos_cups WHERE codigo = rad_codes[((i + k - 2) % array_length(rad_codes,1)) + 1];
      END IF;

      detalle_id := ('32000000-0000-4000-8000-' || lpad((i * 10 + k)::text, 12, '0'))::uuid;
      INSERT INTO detalle_orden (id, orden_id, procedimiento_id, cantidad, observacion)
      VALUES (detalle_id, orden_id, procedimiento_id, 1, 'Detalle demo de orden ' || sistema_destino_val)
      ON CONFLICT (id) DO NOTHING;
    END LOOP;

    INSERT INTO integraciones (
      id, orden_id, sistema_destino, endpoint, estado, external_order_id, payload_json, response_json,
      intentos, ultimo_error, enviado_at, confirmado_at, created_at
    ) VALUES (
      integracion_id,
      orden_id,
      sistema_destino_val,
      CASE WHEN sistema_destino_val = 'LIS' THEN 'http://localhost:8002/api/integracion/ordenes' ELSE 'http://localhost:8003/api/integracion/ordenes' END,
      CASE WHEN i % 11 = 0 THEN 'ERROR' ELSE 'ENVIADA' END,
      CASE WHEN sistema_destino_val = 'LIS' THEN ('41000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid ELSE ('51000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid END,
      jsonb_build_object('his_order_id', orden_id, 'sistema_destino', sistema_destino_val, 'numero_orden', 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0')),
      jsonb_build_object('ok', CASE WHEN i % 11 = 0 THEN false ELSE true END, 'estado', CASE WHEN i % 11 = 0 THEN 'ERROR' ELSE 'RECIBIDA' END),
      CASE WHEN i % 11 = 0 THEN 2 ELSE 1 END,
      CASE WHEN i % 11 = 0 THEN 'Error demo de integración para pruebas de reintento' ELSE NULL END,
      CASE WHEN i % 11 = 0 THEN NULL ELSE NOW() - ((i % 20) || ' days')::interval END,
      CASE WHEN i % 11 = 0 THEN NULL ELSE NOW() - ((i % 20) || ' days')::interval END,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    IF i % 5 = 0 OR i % 7 = 0 THEN
      resultado_id := ('33000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
      notificacion_id := ('34000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
      INSERT INTO resultados_diagnosticos (
        id, orden_id, sistema_origen, tipo_resultado, resumen, url_documento, referencia_externa,
        resultado_json, validado_por, fecha_validacion, recibido_at
      ) VALUES (
        resultado_id,
        orden_id,
        sistema_destino_val,
        CASE WHEN sistema_destino_val = 'LIS' THEN 'LABORATORIO' ELSE 'INFORME_RADIOLOGICO' END,
        CASE WHEN sistema_destino_val = 'LIS' THEN 'Resultados de laboratorio validados y anexados a historia clínica.' ELSE 'Informe radiológico definitivo disponible con referencia PACS.' END,
        CASE WHEN sistema_destino_val = 'LIS' THEN 'http://localhost:8002/reportes/' || orden_id::text ELSE 'http://localhost:8003/informes/' || orden_id::text END,
        CASE WHEN sistema_destino_val = 'LIS' THEN 'LIS-' || i ELSE 'RIS-' || i END,
        jsonb_build_object('origen', sistema_destino_val, 'estado', 'VALIDADO', 'demo', true),
        CASE WHEN sistema_destino_val = 'LIS' THEN 'Bacteriólogo Demo' ELSE 'Dr. Médico Radiólogo' END,
        NOW() - ((i % 10) || ' days')::interval,
        NOW() - ((i % 10) || ' days')::interval
      ) ON CONFLICT (id) DO NOTHING;

      INSERT INTO notificaciones (id, usuario_id, paciente_id, orden_id, titulo, mensaje, leida, created_at)
      VALUES (
        notificacion_id,
        NULL,
        paciente_id,
        orden_id,
        'Resultado disponible - ' || sistema_destino_val,
        'La orden ' || 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0') || ' ya cuenta con resultado disponible en historia clínica.',
        CASE WHEN i % 4 = 0 THEN TRUE ELSE FALSE END,
        NOW() - ((i % 10) || ' days')::interval
      ) ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;

  FOR i IN 1..200 LOOP
    INSERT INTO auditoria_his (id, usuario_id, usuario_email, accion, entidad, entidad_id, ip, user_agent, detalle, created_at)
    VALUES (
      i,
      NULL,
      CASE WHEN i % 2 = 0 THEN 'medico@sigsalud.com' ELSE 'admin@sigsalud.com' END,
      CASE WHEN i % 5 = 0 THEN 'CREAR_ORDEN_DIAGNOSTICA' WHEN i % 5 = 1 THEN 'CONSULTAR_HISTORIA_CLINICA' WHEN i % 5 = 2 THEN 'CREAR_PACIENTE' WHEN i % 5 = 3 THEN 'RECIBIR_RESULTADO_INTEGRACION' ELSE 'CONSULTAR_RESULTADO' END,
      CASE WHEN i % 3 = 0 THEN 'ordenes_diagnosticas' WHEN i % 3 = 1 THEN 'historias_clinicas' ELSE 'pacientes' END,
      NULL,
      '127.0.0.1',
      'Seed masivo SIGSALUD',
      'Registro de auditoría demo número ' || i,
      NOW() - ((i % 60) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

SELECT setval(pg_get_serial_sequence('auditoria_his','id'), (SELECT COALESCE(MAX(id), 1) FROM auditoria_his));

COMMIT;
