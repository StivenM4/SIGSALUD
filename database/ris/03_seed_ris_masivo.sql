
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO modalidades (codigo, nombre, activo) VALUES
('CR','Radiografía computarizada',TRUE),
('DX','Radiografía digital',TRUE),
('CT','Tomografía computarizada',TRUE),
('US','Ultrasonido',TRUE),
('MR','Resonancia magnética',TRUE),
('MG','Mamografía',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO estados_estudio_radiologia (codigo, nombre, activo) VALUES
('ADMITIDO','Admitido',TRUE),
('PROGRAMADO','Programado',TRUE),
('EJECUTADO_TECNICO','Ejecutado técnico',TRUE),
('IMAGENES_DISPONIBLES','Imágenes disponibles',TRUE),
('INFORMADO','Informado',TRUE),
('DEFINITIVO','Definitivo',TRUE),
('CANCELADO','Cancelado',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

WITH equipos_data(nombre, modalidad_codigo, activo) AS (
  VALUES
  ('RX Sala 1 Demo','CR',TRUE),
  ('RX Portátil Demo','DX',TRUE),
  ('Tomógrafo 64 cortes Demo','CT',TRUE),
  ('Ecógrafo General Demo','US',TRUE),
  ('Resonador 1.5T Demo','MR',TRUE)
)
INSERT INTO equipos_radiologia (nombre, modalidad_id, activo)
SELECT d.nombre, m.id, d.activo
FROM equipos_data d
INNER JOIN modalidades m ON m.codigo = d.modalidad_codigo
WHERE NOT EXISTS (
  SELECT 1 FROM equipos_radiologia e WHERE e.nombre = d.nombre
);

WITH salas_data(nombre, equipo_nombre, activo) AS (
  VALUES
  ('Sala RX 1','RX Sala 1 Demo',TRUE),
  ('Sala RX Portátil','RX Portátil Demo',TRUE),
  ('Sala TAC','Tomógrafo 64 cortes Demo',TRUE),
  ('Sala Ecografía','Ecógrafo General Demo',TRUE),
  ('Sala Resonancia','Resonador 1.5T Demo',TRUE)
)
INSERT INTO salas_radiologia (nombre, equipo_id, activo)
SELECT d.nombre, e.id, d.activo
FROM salas_data d
INNER JOIN equipos_radiologia e ON e.nombre = d.equipo_nombre
WHERE NOT EXISTS (
  SELECT 1 FROM salas_radiologia s WHERE s.nombre = d.nombre
);

WITH menu_data(texto, ruta, icono_bootstrap, permiso_requerido, orden, activo) AS (
  VALUES
  ('Dashboard','/','bi-speedometer2','RIS_ACCESS',1,TRUE),
  ('Órdenes','/ordenes','bi-clipboard2-pulse','RIS_ACCESS',2,TRUE),
  ('Agenda','/agenda','bi-calendar2-week','RIS_AGENDA',3,TRUE),
  ('Estudios','/estudios','bi-activity','RIS_EXECUTION',4,TRUE),
  ('PACS / Orthanc','/pacs','bi-images','RIS_PACS',5,TRUE),
  ('Informes','/informes','bi-file-earmark-medical','RIS_REPORTS',6,TRUE),
  ('Auditoría','/auditoria','bi-shield-check','RIS_AUDIT',7,TRUE)
)
INSERT INTO ris_menus (texto, ruta, icono_bootstrap, permiso_requerido, orden, activo)
SELECT d.texto, d.ruta, d.icono_bootstrap, d.permiso_requerido, d.orden, d.activo
FROM menu_data d
WHERE NOT EXISTS (
  SELECT 1 FROM ris_menus m WHERE m.texto = d.texto AND m.ruta = d.ruta
);

-- =========================
-- Datos masivos RIS
-- 120 órdenes RIS coherentes con HIS: órdenes impares 1..239
-- =========================

DO $$
DECLARE
  i INTEGER;
  k INTEGER;
  paciente_idx INTEGER;
  paciente_ris_id UUID;
  his_patient_id UUID;
  his_order_id UUID;
  ris_order_id UUID;
  estudio_id UUID;
  agenda_id UUID;
  pacs_id UUID;
  serie_id UUID;
  informe_id UUID;
  historial_id UUID;
  integracion_id UUID;
  modalidad_id INTEGER;
  estado_id INTEGER;
  sala_id INTEGER;
  nombres TEXT[] := ARRAY['Carlos','María','Andrés','Laura','Sofía','Juan','Camila','Mateo','Valentina','Sebastián','Natalia','Daniel','Paula','Felipe','Isabella','Julián','Gabriela','Miguel','Lucía','Santiago'];
  segundos TEXT[] := ARRAY['Alejandro','Andrea','José','Patricia','Fernando','Marcela','David','Carolina','Esteban','Fernanda','Ricardo','Daniela','Mauricio','Juliana','Nicolás','Adriana','Simón','Catalina','Tomás','Elena'];
  apellidos TEXT[] := ARRAY['Gómez','Rodríguez','Martínez','López','García','Pérez','Sánchez','Ramírez','Torres','Díaz','Moreno','Castro','Vargas','Rojas','Herrera','Jiménez','Mendoza','Suárez','Ortiz','Cruz'];
  rad_codes TEXT[] := ARRAY['879111','879420','883101','879301','879410','879402','883201'];
  rad_names TEXT[] := ARRAY['Radiografía de tórax','Tomografía de cráneo simple','Ecografía abdominal total','Radiografía de columna lumbosacra','Tomografía de tórax','Tomografía de abdomen','Ecografía pélvica'];
  mod_codes TEXT[] := ARRAY['CR','CT','US','DX','CT','CT','US'];
BEGIN
  FOR i IN 1..239 BY 2 LOOP
    paciente_idx := ((i - 1) % 150) + 1;
    paciente_ris_id := ('50000000-0000-4000-8000-' || lpad(paciente_idx::text, 12, '0'))::uuid;
    his_patient_id := ('10000000-0000-4000-8000-' || lpad(paciente_idx::text, 12, '0'))::uuid;
    his_order_id := ('30000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    ris_order_id := ('51000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    estudio_id := ('52000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;

    INSERT INTO pacientes_ris (
      id, his_patient_id, tipo_documento, numero_documento, primer_nombre, segundo_nombre,
      primer_apellido, segundo_apellido, fecha_nacimiento, genero, created_at
    ) VALUES (
      paciente_ris_id,
      his_patient_id,
      CASE WHEN paciente_idx % 5 = 0 THEN 'CE' ELSE 'CC' END,
      (1000000000 + paciente_idx)::text,
      nombres[((paciente_idx - 1) % array_length(nombres, 1)) + 1],
      segundos[((paciente_idx - 1) % array_length(segundos, 1)) + 1],
      apellidos[((paciente_idx - 1) % array_length(apellidos, 1)) + 1],
      apellidos[((paciente_idx + 6) % array_length(apellidos, 1)) + 1],
      DATE '1945-01-01' + ((paciente_idx * 137) % 25000),
      CASE WHEN paciente_idx % 3 = 0 THEN 'O' WHEN paciente_idx % 2 = 0 THEN 'F' ELSE 'M' END,
      NOW() - ((i % 30) || ' days')::interval
    ) ON CONFLICT (id) DO UPDATE SET
      numero_documento = EXCLUDED.numero_documento,
      primer_nombre = EXCLUDED.primer_nombre,
      primer_apellido = EXCLUDED.primer_apellido;

    INSERT INTO ordenes_radiologia (
      id, his_order_id, numero_orden_his, paciente_id, prioridad, observaciones, payload_his, created_at
    ) VALUES (
      ris_order_id,
      his_order_id,
      'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0'),
      paciente_ris_id,
      CASE WHEN i % 3 = 0 THEN 'URGENTE' WHEN i % 3 = 1 THEN 'PRIORITARIA' ELSE 'RUTINA' END,
      'Orden radiológica recibida desde HIS para agenda, ejecución técnica, PACS e informe.',
      jsonb_build_object('his_order_id', his_order_id, 'numero_orden', 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0'), 'sistema_destino', 'RIS'),
      NOW() - ((i % 25) || ' days')::interval
    ) ON CONFLICT (id) DO UPDATE SET payload_his = EXCLUDED.payload_his;

    SELECT id INTO modalidad_id FROM modalidades WHERE codigo = mod_codes[((i - 1) % array_length(mod_codes,1)) + 1] LIMIT 1;
    SELECT id INTO estado_id FROM estados_estudio_radiologia
    WHERE codigo = CASE WHEN i % 10 = 0 THEN 'DEFINITIVO' WHEN i % 7 = 0 THEN 'INFORMADO' WHEN i % 5 = 0 THEN 'IMAGENES_DISPONIBLES' WHEN i % 3 = 0 THEN 'EJECUTADO_TECNICO' ELSE 'ADMITIDO' END
    LIMIT 1;

    INSERT INTO estudios_radiologicos (
      id, orden_id, paciente_id, modalidad_id, estado_id, descripcion, codigo_cups, created_at, updated_at
    ) VALUES (
      estudio_id,
      ris_order_id,
      paciente_ris_id,
      modalidad_id,
      estado_id,
      rad_names[((i - 1) % array_length(rad_names,1)) + 1],
      rad_codes[((i - 1) % array_length(rad_codes,1)) + 1],
      NOW() - ((i % 25) || ' days')::interval,
      NOW()
    ) ON CONFLICT (id) DO UPDATE SET estado_id = EXCLUDED.estado_id, updated_at = NOW();

    SELECT id INTO sala_id FROM salas_radiologia ORDER BY id OFFSET ((i - 1) % 5) LIMIT 1;
    agenda_id := ('53000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO agenda_radiologia (id, estudio_id, sala_id, fecha_hora, estado)
    VALUES (
      agenda_id,
      estudio_id,
      sala_id,
      (CURRENT_DATE - INTERVAL '20 days') + ((i % 45) || ' days')::interval + (((7 + (i % 10)) || ' hours')::interval),
      CASE WHEN i % 8 = 0 THEN 'CANCELADA' WHEN i % 5 = 0 THEN 'REALIZADA' ELSE 'PROGRAMADA' END
    ) ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, fecha_hora = EXCLUDED.fecha_hora;

    historial_id := ('54000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO historial_estado_estudio (id, estudio_id, estado_id, observacion, created_at)
    VALUES (historial_id, estudio_id, estado_id, 'Cambio de estado demo para trazabilidad RIS.', NOW() - ((i % 18) || ' days')::interval)
    ON CONFLICT (id) DO NOTHING;

    IF i % 5 = 0 OR i % 7 = 0 OR i % 10 = 0 THEN
      pacs_id := ('55000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
      INSERT INTO estudios_pacs (id, estudio_id, orthanc_study_id, orthanc_series_id, orthanc_instance_id, url_visualizacion, created_at)
      VALUES (
        pacs_id,
        estudio_id,
        'ORTHANC-STUDY-' || lpad(i::text, 5, '0'),
        'ORTHANC-SERIES-' || lpad(i::text, 5, '0') || '-01',
        'ORTHANC-INSTANCE-' || lpad(i::text, 5, '0') || '-001',
        'http://localhost:8043/app/explorer.html#study?uuid=ORTHANC-STUDY-' || lpad(i::text, 5, '0'),
        NOW() - ((i % 12) || ' days')::interval
      ) ON CONFLICT (id) DO UPDATE SET orthanc_study_id = EXCLUDED.orthanc_study_id, url_visualizacion = EXCLUDED.url_visualizacion;

      FOR k IN 1..3 LOOP
        serie_id := ('56000000-0000-4000-8000-' || lpad((i * 10 + k)::text, 12, '0'))::uuid;
        INSERT INTO series_dicom (id, estudio_pacs_id, orthanc_series_id, descripcion)
        VALUES (serie_id, pacs_id, 'ORTHANC-SERIES-' || lpad(i::text, 5, '0') || '-' || lpad(k::text, 2, '0'), 'Serie DICOM demo ' || k)
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    IF i % 7 = 0 OR i % 10 = 0 THEN
      informe_id := ('57000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
      INSERT INTO informes_radiologia (
        id, estudio_id, hallazgos, conclusion, estado, validado_por, validado_at, enviado_his, enviado_his_at, created_at
      ) VALUES (
        informe_id,
        estudio_id,
        'Hallazgos demo: se revisan estructuras evaluadas sin alteraciones significativas, salvo correlación clínica según caso.',
        CASE WHEN i % 14 = 0 THEN 'Hallazgos compatibles con cambios inflamatorios leves. Correlacionar con clínica.' ELSE 'Estudio dentro de límites esperados para la indicación clínica.' END,
        CASE WHEN i % 10 = 0 THEN 'DEFINITIVO' ELSE 'VALIDADO' END,
        'Dr. Médico Radiólogo',
        NOW() - ((i % 9) || ' days')::interval,
        CASE WHEN i % 10 = 0 THEN TRUE ELSE FALSE END,
        CASE WHEN i % 10 = 0 THEN NOW() - ((i % 8) || ' days')::interval ELSE NULL END,
        NOW() - ((i % 15) || ' days')::interval
      ) ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado, enviado_his = EXCLUDED.enviado_his, enviado_his_at = EXCLUDED.enviado_his_at;
    END IF;

    integracion_id := ('58000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO integracion_his_ris (id, his_order_id, ris_order_id, evento, estado, payload_json, response_json, created_at)
    VALUES (
      integracion_id,
      his_order_id,
      ris_order_id,
      CASE WHEN i % 10 = 0 THEN 'ENVIAR_INFORME_HIS' ELSE 'RECIBIR_ORDEN' END,
      CASE WHEN i % 10 = 0 THEN 'ENVIADO_HIS' ELSE 'RECIBIDA' END,
      jsonb_build_object('his_order_id', his_order_id, 'numero_orden_his', 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0')),
      jsonb_build_object('ok', true, 'ris_order_id', ris_order_id, 'estudio_ris_id', estudio_id),
      NOW() - ((i % 25) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR i IN 1..180 LOOP
    INSERT INTO auditoria_ris (id, usuario_id, usuario_email, accion, entidad, entidad_id, ip, user_agent, detalle, created_at)
    VALUES (
      i,
      NULL,
      CASE WHEN i % 2 = 0 THEN 'medico.radiologia@sigsalud.com' ELSE 'radiologia@sigsalud.com' END,
      CASE WHEN i % 7 = 0 THEN 'VALIDAR_INFORME' WHEN i % 7 = 1 THEN 'RECIBIR_ORDEN_HIS' WHEN i % 7 = 2 THEN 'PROGRAMAR_ESTUDIO' WHEN i % 7 = 3 THEN 'EJECUTAR_ESTUDIO' WHEN i % 7 = 4 THEN 'CONSULTAR_PACS' WHEN i % 7 = 5 THEN 'CREAR_INFORME' ELSE 'ENVIAR_INFORME_HIS' END,
      CASE WHEN i % 3 = 0 THEN 'estudios_radiologicos' WHEN i % 3 = 1 THEN 'informes_radiologia' ELSE 'estudios_pacs' END,
      NULL,
      '127.0.0.1',
      'Seed masivo SIGSALUD RIS',
      'Registro de auditoría RIS demo número ' || i,
      NOW() - ((i % 45) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

SELECT setval(pg_get_serial_sequence('auditoria_ris','id'), (SELECT COALESCE(MAX(id), 1) FROM auditoria_ris));

COMMIT;
