
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SEQUENCE IF NOT EXISTS lis_codigo_muestra_seq START 1;

INSERT INTO estados_orden_laboratorio (codigo, nombre, activo) VALUES
('PENDIENTE','Pendiente',TRUE),
('MUESTRA_TOMADA','Muestra tomada',TRUE),
('EN_PROCESO','En proceso',TRUE),
('RESULTADO_REGISTRADO','Resultado registrado',TRUE),
('VALIDADO','Validado',TRUE),
('ENVIADO_HIS','Enviado al HIS',TRUE),
('RECHAZADO','Rechazado',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO secciones_laboratorio (codigo, nombre, activo) VALUES
('HEM','Hematología',TRUE),
('QUI','Química clínica',TRUE),
('INM','Inmunología',TRUE),
('URI','Uroanálisis',TRUE),
('MIC','Microbiología',TRUE),
('COA','Coagulación',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

INSERT INTO tipos_muestra (codigo, nombre, activo) VALUES
('SANGRE_TOTAL','Sangre total',TRUE),
('SUERO','Suero',TRUE),
('PLASMA','Plasma',TRUE),
('ORINA','Orina',TRUE),
('HISOPADO','Hisopado',TRUE)
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, activo = TRUE;

WITH analizadores_data(nombre, activo) AS (
  VALUES
  ('Sysmex XN-1000 Demo',TRUE),
  ('Cobas C111 Demo',TRUE),
  ('Architect i1000 Demo',TRUE),
  ('Urisys 1100 Demo',TRUE),
  ('ACL TOP Demo',TRUE)
)
INSERT INTO analizadores_laboratorio (nombre, activo)
SELECT d.nombre, d.activo
FROM analizadores_data d
WHERE NOT EXISTS (
  SELECT 1 FROM analizadores_laboratorio a WHERE a.nombre = d.nombre
);

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '902210','Hemograma IV', s.id, tm.id, '', 'Según edad y sexo', NULL, NULL, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='HEM' AND tm.codigo='SANGRE_TOTAL'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '903895','Creatinina en suero u otros fluidos', s.id, tm.id, 'mg/dL', '0.70 - 1.30', 0.30, 3.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='QUI' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_min=EXCLUDED.valor_critico_min, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '906625','Troponina I cuantitativa', s.id, tm.id, 'ng/L', '< 34', NULL, 100.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='INM' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '903841','Glucosa en suero u otros fluidos', s.id, tm.id, 'mg/dL', '70 - 110', 40.00, 400.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='QUI' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_min=EXCLUDED.valor_critico_min, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '903859','Urea en suero', s.id, tm.id, 'mg/dL', '15 - 45', NULL, 120.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='QUI' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '903866','Perfil lipídico', s.id, tm.id, 'mg/dL', 'Según fracción lipídica', NULL, NULL, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='QUI' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '907106','Parcial de orina', s.id, tm.id, '', 'Negativo / normal', NULL, NULL, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='URI' AND tm.codigo='ORINA'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '904902','Proteína C reactiva', s.id, tm.id, 'mg/L', '< 5', NULL, 100.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='INM' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '903818','Alanino aminotransferasa ALT', s.id, tm.id, 'U/L', '7 - 56', NULL, 500.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='QUI' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

INSERT INTO pruebas_laboratorio (codigo_cups, nombre, seccion_id, tipo_muestra_id, unidad, valor_referencia, valor_critico_min, valor_critico_max, activo)
SELECT '903815','Aspartato aminotransferasa AST', s.id, tm.id, 'U/L', '10 - 40', NULL, 500.00, TRUE
FROM secciones_laboratorio s, tipos_muestra tm WHERE s.codigo='QUI' AND tm.codigo='SUERO'
ON CONFLICT (codigo_cups) DO UPDATE SET nombre=EXCLUDED.nombre, seccion_id=EXCLUDED.seccion_id, tipo_muestra_id=EXCLUDED.tipo_muestra_id, unidad=EXCLUDED.unidad, valor_referencia=EXCLUDED.valor_referencia, valor_critico_max=EXCLUDED.valor_critico_max, activo=TRUE;

WITH menu_data(texto, ruta, icono_bootstrap, permiso_requerido, orden, activo) AS (
  VALUES
  ('Dashboard','/','bi-speedometer2','LIS_ACCESS',1,TRUE),
  ('Órdenes','/ordenes','bi-clipboard2-pulse','LIS_ORDERS',2,TRUE),
  ('Muestras','/muestras','bi-upc-scan','LIS_SAMPLES',3,TRUE),
  ('Resultados','/resultados','bi-vial','LIS_RESULTS',4,TRUE),
  ('Validación','/validacion','bi-check2-circle','LIS_VALIDATE',5,TRUE),
  ('Reportes','/reportes','bi-file-earmark-pdf','LIS_RESULTS',6,TRUE),
  ('Auditoría','/auditoria','bi-shield-check','LIS_AUDIT',7,TRUE)
)
INSERT INTO lis_menus (texto, ruta, icono_bootstrap, permiso_requerido, orden, activo)
SELECT d.texto, d.ruta, d.icono_bootstrap, d.permiso_requerido, d.orden, d.activo
FROM menu_data d
WHERE NOT EXISTS (
  SELECT 1 FROM lis_menus m WHERE m.texto = d.texto AND m.ruta = d.ruta
);

-- =========================
-- Datos masivos LIS
-- 120 órdenes LIS coherentes con HIS: órdenes pares 2..240
-- =========================

DO $$
DECLARE
  i INTEGER;
  k INTEGER;
  paciente_idx INTEGER;
  paciente_lis_id UUID;
  his_patient_id UUID;
  his_order_id UUID;
  lis_order_id UUID;
  detalle_id UUID;
  muestra_id UUID;
  procesamiento_id UUID;
  resultado_id UUID;
  validacion_id UUID;
  reporte_id UUID;
  integracion_id UUID;
  notificacion_id UUID;
  estado_id INTEGER;
  v_prueba_id UUID;
  v_tipo_muestra_id INTEGER;
  analizador_id INTEGER;
  prueba_codigo TEXT;
  resultado_val TEXT;
  valor_num NUMERIC;
  nombres TEXT[] := ARRAY['Carlos','María','Andrés','Laura','Sofía','Juan','Camila','Mateo','Valentina','Sebastián','Natalia','Daniel','Paula','Felipe','Isabella','Julián','Gabriela','Miguel','Lucía','Santiago'];
  segundos TEXT[] := ARRAY['Alejandro','Andrea','José','Patricia','Fernando','Marcela','David','Carolina','Esteban','Fernanda','Ricardo','Daniela','Mauricio','Juliana','Nicolás','Adriana','Simón','Catalina','Tomás','Elena'];
  apellidos TEXT[] := ARRAY['Gómez','Rodríguez','Martínez','López','García','Pérez','Sánchez','Ramírez','Torres','Díaz','Moreno','Castro','Vargas','Rojas','Herrera','Jiménez','Mendoza','Suárez','Ortiz','Cruz'];
  lab_codes TEXT[] := ARRAY['902210','903895','906625','903841','903859','903866','907106','904902','903818','903815'];
BEGIN
  FOR i IN 2..240 BY 2 LOOP
    paciente_idx := ((i - 1) % 150) + 1;
    paciente_lis_id := ('40000000-0000-4000-8000-' || lpad(paciente_idx::text, 12, '0'))::uuid;
    his_patient_id := ('10000000-0000-4000-8000-' || lpad(paciente_idx::text, 12, '0'))::uuid;
    his_order_id := ('30000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    lis_order_id := ('41000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;

    INSERT INTO pacientes_lis (
      id, his_patient_id, tipo_documento, numero_documento, primer_nombre, segundo_nombre,
      primer_apellido, segundo_apellido, fecha_nacimiento, genero, created_at
    ) VALUES (
      paciente_lis_id,
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

    SELECT id INTO estado_id FROM estados_orden_laboratorio
    WHERE codigo = CASE WHEN i % 10 = 0 THEN 'ENVIADO_HIS' WHEN i % 6 = 0 THEN 'VALIDADO' WHEN i % 4 = 0 THEN 'RESULTADO_REGISTRADO' WHEN i % 3 = 0 THEN 'EN_PROCESO' ELSE 'PENDIENTE' END
    LIMIT 1;

    INSERT INTO ordenes_laboratorio (
      id, his_order_id, numero_orden_his, paciente_id, prioridad, estado_id,
      observaciones, payload_his, enviado_his, enviado_his_at, created_at
    ) VALUES (
      lis_order_id,
      his_order_id,
      'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0'),
      paciente_lis_id,
      CASE WHEN i % 3 = 0 THEN 'URGENTE' WHEN i % 3 = 1 THEN 'PRIORITARIA' ELSE 'RUTINA' END,
      estado_id,
      'Orden recibida desde HIS para procesamiento LIS. Incluye toma de muestra y validación.',
      jsonb_build_object('his_order_id', his_order_id, 'numero_orden', 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0'), 'sistema_destino', 'LIS'),
      CASE WHEN i % 10 = 0 THEN TRUE ELSE FALSE END,
      CASE WHEN i % 10 = 0 THEN NOW() - ((i % 9) || ' days')::interval ELSE NULL END,
      NOW() - ((i % 25) || ' days')::interval
    ) ON CONFLICT (id) DO UPDATE SET estado_id = EXCLUDED.estado_id, payload_his = EXCLUDED.payload_his;

    FOR k IN 1..3 LOOP
      prueba_codigo := lab_codes[((i + k - 2) % array_length(lab_codes,1)) + 1];
      SELECT pl.id, pl.tipo_muestra_id INTO v_prueba_id, v_tipo_muestra_id FROM pruebas_laboratorio pl WHERE pl.codigo_cups = prueba_codigo LIMIT 1;
      detalle_id := ('42000000-0000-4000-8000-' || lpad((i * 10 + k)::text, 12, '0'))::uuid;

      INSERT INTO detalle_orden_laboratorio (id, orden_id, prueba_id, cantidad)
      VALUES (detalle_id, lis_order_id, v_prueba_id, 1)
      ON CONFLICT (orden_id, prueba_id) DO NOTHING;
    END LOOP;

    SELECT tm.id INTO v_tipo_muestra_id
    FROM tipos_muestra tm
    ORDER BY tm.id OFFSET ((i / 2) % 5) LIMIT 1;

    muestra_id := ('43000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO muestras_laboratorio (id, orden_id, tipo_muestra_id, codigo_muestra, tomada_por, estado, created_at)
    VALUES (
      muestra_id,
      lis_order_id,
      v_tipo_muestra_id,
      'M-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0'),
      NULL,
      CASE WHEN i % 3 = 0 THEN 'EN_PROCESO' WHEN i % 4 = 0 THEN 'PROCESADA' ELSE 'TOMADA' END,
      NOW() - ((i % 20) || ' days')::interval
    ) ON CONFLICT (id) DO UPDATE SET estado = EXCLUDED.estado;

    SELECT id INTO analizador_id FROM analizadores_laboratorio ORDER BY id OFFSET ((i - 1) % 5) LIMIT 1;
    procesamiento_id := ('43500000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO procesamiento_muestras (id, muestra_id, analizador_id, estado, created_at)
    VALUES (
      procesamiento_id,
      muestra_id,
      analizador_id,
      CASE WHEN i % 4 = 0 THEN 'FINALIZADO' ELSE 'EN_PROCESO' END,
      NOW() - ((i % 15) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;

    IF i % 3 <> 0 THEN
      FOR k IN 1..3 LOOP
        prueba_codigo := lab_codes[((i + k - 2) % array_length(lab_codes,1)) + 1];
        SELECT pl.id INTO v_prueba_id FROM pruebas_laboratorio pl WHERE pl.codigo_cups = prueba_codigo LIMIT 1;

        valor_num := ROUND((0.70 + (((i + k) % 18) * 0.12))::numeric, 2);
        resultado_val := CASE
          WHEN prueba_codigo = '902210' THEN CASE WHEN i % 8 = 0 THEN 'Leucocitosis leve' ELSE 'Normal' END
          WHEN prueba_codigo = '906625' THEN (10 + ((i + k) % 150))::text
          WHEN prueba_codigo = '903841' THEN (70 + ((i + k) % 420))::text
          WHEN prueba_codigo = '907106' THEN CASE WHEN i % 6 = 0 THEN 'Leucocitos positivos' ELSE 'Normal' END
          ELSE valor_num::text
        END;

        resultado_id := ('44000000-0000-4000-8000-' || lpad((i * 10 + k)::text, 12, '0'))::uuid;

        INSERT INTO resultados_laboratorio (
          id, orden_id, prueba_id, resultado, unidad, valor_referencia, es_critico,
          registrado_por, validado, created_at
        )
        SELECT
          resultado_id,
          lis_order_id,
          p.id,
          resultado_val,
          p.unidad,
          p.valor_referencia,
          CASE
            WHEN p.codigo_cups = '903841' AND resultado_val ~ '^[0-9]+(\.[0-9]+)?$' AND resultado_val::numeric > 400 THEN TRUE
            WHEN p.codigo_cups = '906625' AND resultado_val ~ '^[0-9]+(\.[0-9]+)?$' AND resultado_val::numeric > 100 THEN TRUE
            WHEN p.valor_critico_max IS NOT NULL AND resultado_val ~ '^[0-9]+(\.[0-9]+)?$' AND resultado_val::numeric > p.valor_critico_max THEN TRUE
            ELSE FALSE
          END,
          NULL,
          CASE WHEN i % 5 = 0 OR i % 6 = 0 OR i % 10 = 0 THEN TRUE ELSE FALSE END,
          NOW() - ((i % 12) || ' days')::interval
        FROM pruebas_laboratorio p WHERE p.id = v_prueba_id
        ON CONFLICT (orden_id, prueba_id) DO UPDATE SET resultado = EXCLUDED.resultado, es_critico = EXCLUDED.es_critico, validado = EXCLUDED.validado;
      END LOOP;
    END IF;

    IF i % 5 = 0 OR i % 6 = 0 OR i % 10 = 0 THEN
      validacion_id := ('45000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
      reporte_id := ('46000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
      notificacion_id := ('48000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;

      INSERT INTO validaciones_resultado (id, orden_id, validado_por, observacion, created_at)
      VALUES (validacion_id, lis_order_id, NULL, 'Validación demo por bacteriólogo. Resultados aptos para envío a HIS.', NOW() - ((i % 8) || ' days')::interval)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO reportes_laboratorio (id, orden_id, url_documento, created_at)
      VALUES (reporte_id, lis_order_id, 'http://localhost:8002/reportes/' || lis_order_id::text, NOW())
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO notificaciones_lis (id, titulo, mensaje, leida, created_at)
      VALUES (notificacion_id, 'Resultado validado', 'La orden de laboratorio ' || 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0') || ' fue validada correctamente.', CASE WHEN i % 4 = 0 THEN TRUE ELSE FALSE END, NOW())
      ON CONFLICT (id) DO NOTHING;
    END IF;

    integracion_id := ('47000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    INSERT INTO integracion_his_lis (id, his_order_id, lis_order_id, evento, estado, payload_json, response_json, created_at)
    VALUES (
      integracion_id,
      his_order_id,
      lis_order_id,
      CASE WHEN i % 10 = 0 THEN 'ENVIAR_RESULTADO_HIS' ELSE 'RECIBIR_ORDEN' END,
      CASE WHEN i % 10 = 0 THEN 'ENVIADO_HIS' ELSE 'RECIBIDA' END,
      jsonb_build_object('his_order_id', his_order_id, 'numero_orden_his', 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad(i::text, 5, '0')),
      jsonb_build_object('ok', true, 'lis_order_id', lis_order_id),
      NOW() - ((i % 25) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;

  FOR i IN 1..180 LOOP
    INSERT INTO auditoria_lis (id, usuario_id, usuario_email, accion, entidad, entidad_id, ip, user_agent, detalle, created_at)
    VALUES (
      i,
      NULL,
      CASE WHEN i % 2 = 0 THEN 'bacteriologo@sigsalud.com' ELSE 'laboratorio@sigsalud.com' END,
      CASE WHEN i % 6 = 0 THEN 'VALIDAR_RESULTADOS' WHEN i % 6 = 1 THEN 'RECIBIR_ORDEN_HIS' WHEN i % 6 = 2 THEN 'TOMAR_MUESTRA' WHEN i % 6 = 3 THEN 'REGISTRAR_RESULTADO' WHEN i % 6 = 4 THEN 'ENVIAR_RESULTADO_HIS' ELSE 'CONSULTAR_ORDEN' END,
      CASE WHEN i % 3 = 0 THEN 'ordenes_laboratorio' WHEN i % 3 = 1 THEN 'muestras_laboratorio' ELSE 'resultados_laboratorio' END,
      NULL,
      '127.0.0.1',
      'Seed masivo SIGSALUD LIS',
      'Registro de auditoría LIS demo número ' || i,
      NOW() - ((i % 45) || ' days')::interval
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

SELECT setval(pg_get_serial_sequence('auditoria_lis','id'), (SELECT COALESCE(MAX(id), 1) FROM auditoria_lis));

COMMIT;
