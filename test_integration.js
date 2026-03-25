/**
 * @file test_integration.js
 * @description Script de prueba E2E (End-to-End) para verificar la interoperabilidad
 * de los 3 subsistemas: HIS (3001) <-> LIS (3003) y HIS (3001) <-> RIS (3002).
 */
const http = require('http');

const delay = ms => new Promise(res => setTimeout(res, ms));

const req = (port, path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        ...(token   && { 'Authorization': `Bearer ${token}` }),
      },
    };
    const request = http.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
};

async function runTest() {
  console.log('=== INICIANDO PRUEBA DE INTEGRACIÓN SIGSALUD ===\n');

  try {
    // 1. HIS: Login como ADMIN para crear el PACIENTE y el MÉDICO
    console.log('[1] HIS - Login Admin...');
    let res = await req(3001, '/api/auth/login', 'POST', { username: 'admin', password: 'Admin1234!' });
    if (res.status !== 200) throw new Error(`Login admin falló: ${JSON.stringify(res.body)}`);
    const adminToken = res.body.token;

    console.log('[1.1] HIS - Creando Paciente de Prueba...');
    res = await req(3001, '/api/patients', 'POST', {
      document_type: 'CC', document_num: `12345${Date.now()}`, full_name: 'Juan Perez Test', birth_date: '1990-01-01', gender: 'M'
    }, adminToken);
    const patient_id = res.body.patient.id;

    console.log('[1.2] HIS - Creando Médico de Prueba...');
    let medicoRes = await req(3001, '/api/users', 'POST', {
      username: `medico${Date.now()}`, password: 'Password123!', full_name: 'Dr. House', email: `drhouse${Date.now()}@test.com`, role_name: 'MEDICO'
    }, adminToken);
    
    if(medicoRes.status !== 201) {
      throw new Error(`Crear médico falló: ${JSON.stringify(medicoRes.body)}`);
    }
    
    // 2. HIS: Login del Médico
    console.log('[2] HIS - Login Médico...');
    res = await req(3001, '/api/auth/login', 'POST', { username: medicoRes.body.user.username, password: 'Password123!' });
    const doctorToken = res.body.token;

    // 3. HIS: Médico crea Historial y Órdenes
    console.log('[3.1] HIS - Médico crea registro clínico (Visita)...');
    res = await req(3001, '/api/clinical/records', 'POST', {
      patient_id, motive: 'Dolor abdominal crónico', diagnosis: 'Posible apendicitis o cólico', treatment: 'Observación y exámenes'
    }, doctorToken);
    const record_id = res.body.record.id;

    console.log('[3.2] HIS - Médico solicita orden de Laboratorio (Cuadro hemático y creatinina)...');
    let labReqRes = await req(3001, '/api/clinical/orders/lab', 'POST', {
      patient_id, record_id, priority: 'URGENTE', notes: 'Paciente con dolor agudo',
      tests_requested: ['Hemoglobina', 'Leucocitos', 'Creatinina']
    }, doctorToken);
    if(labReqRes.status!== 201) throw new Error("Fallo orden LAB");
    const his_lab_order = labReqRes.body.order;

    console.log('[3.3] HIS - Médico solicita orden de Radiología (Ecografía abdominal)...');
    let radReqRes = await req(3001, '/api/clinical/orders/radiology', 'POST', {
      patient_id, record_id, priority: 'URGENTE',
      study_type: 'Ecografía', body_region: 'Abdomen bajo'
    }, doctorToken);
    if(radReqRes.status!== 201) throw new Error("Fallo orden RAD");
    const his_rad_order = radReqRes.body.order;

    // --- Esperar a que HIS envíe por HTTP a LIS y RIS (setImmediate simulado)
    await delay(3000);

    // 4. LIS: Procesar orden de laboratorio
    console.log('\n[4.1] LIS - Ver bandeja de entrada...');
    let lisOrders = await req(3003, '/api/orders?status=RECIBIDA', 'GET');
    console.log(`      LIS recibió ${lisOrders.body.orders.length} órdenes.`);
    const lis_order = lisOrders.body.orders.find(o => o.order_code === his_lab_order.order_code);
    if (!lis_order) throw new Error("Orden LIS no llegó.");

    console.log('[4.2] LIS - Toma de Muestra...');
    res = await req(3003, `/api/orders/${lis_order.id}/sample`, 'POST', {
      technician: 'Tec. Mariana', sample_type: 'Sangre Venosa', observations: 'Muestra OK'
    });

    console.log('[4.3] LIS - Analizador reporta resultados (Generando valor CRÍTICO de Leucocitos)...');
    let lisResultRes = await req(3003, `/api/orders/${lis_order.id}/results`, 'POST', {
      technician: 'AutoAnalyzer-XP',
      results: [
        { test_name: 'Hemoglobina', value: 14.2 },
        { test_name: 'Leucocitos', value: 31.5 }, // ALERTA: límite 30 según base de datos initDb
        { test_name: 'Creatinina', value: 0.9 }
      ]
    });
    const result_id = lisResultRes.body.result_id;
    console.log(`      ${lisResultRes.body.message}`);

    console.log('[4.4] LIS - Bacteriólogo valida resultados (Se envía a HIS y genera PDF)...');
    let lisValRes = await req(3003, `/api/results/${result_id}/validate`, 'POST', {
      bacteriologist: 'Bact. Laura G.', lab_order_id: lis_order.id
    });
    console.log(`      ${lisValRes.body.message}`);

    // 5. RIS: Procesar orden de radiología
    console.log('\n[5.1] RIS - Ver bandeja de entrada...');
    let risOrders = await req(3002, '/api/orders?status=CONFIRMADA', 'GET'); // RIS ya la confirmó a HIS
    let ris_order = risOrders.body.orders.find(o => o.order_code === his_rad_order.order_code);
    if (!ris_order) {
      risOrders = await req(3002, '/api/orders?status=RECIBIDA', 'GET');
      ris_order = risOrders.body.orders.find(o => o.order_code === his_rad_order.order_code);
    }
    if (!ris_order) throw new Error("Orden RIS no llegó.");

    console.log('[5.2] RIS - Agendar estudio para hoy...');
    res = await req(3002, `/api/orders/${ris_order.id}/schedule`, 'POST', {
      room: 'Sala Ecografía 1', technician: 'Tec. Carlos', scheduled_at: new Date().toISOString(), duration_minutes: 30
    });

    console.log('[5.3] RIS - Realizar estudio (Simulando Orthanc)...');
    res = await req(3002, `/api/orders/${ris_order.id}/perform`, 'POST', {
      technician: 'Tec. Carlos', observations: 'Paciente colaborativo'
    });

    console.log('[5.4] RIS - Radiólogo redacta informe...');
    let risRepRes = await req(3002, `/api/orders/${ris_order.id}/report`, 'POST', {
      radiologist: 'Dr. Rayos X', findings: 'Apendice engrosado, > 8mm de diámetro con líquido periapendicular.', conclusion: 'Apendicitis aguda no perforada.'
    });
    const report_id = risRepRes.body.report.id;

    console.log('[5.5] RIS - Validar informe (Se envía a HIS)...');
    let risValRes = await req(3002, `/api/reports/${report_id}/validate`, 'POST', {
      radiologist: 'Dr. Rayos X'
    });
    console.log(`      ${risValRes.body.message}`);

    // --- Esperar a que LIS y RIS notifiquen por webhook al HIS
    await delay(3000);

    // 6. HIS: Médico revisa notificaciones e historial final
    console.log('\n[6.1] HIS - Médico revisa sus notificaciones...');
    res = await req(3001, '/api/clinical/notifications?unread_only=true', 'GET', null, doctorToken);
    console.log(`      Notificaciones no leídas: ${res.body.unread_count}`);
    res.body.notifications.forEach((n, i) => console.log(`      ${i+1}. [${n.type}] ${n.message}`));

    console.log('\n[6.2] HIS - Revisar Historial Clínico completo del paciente...');
    res = await req(3001, `/api/clinical/records/patient/${patient_id}`, 'GET', null, doctorToken);
    console.log(`      Órdenes LAB completadas: ${res.body.labOrders.filter(o=>o.status==='COMPLETADA').length}`);
    console.log(`      Órdenes RAD completadas: ${res.body.radiologyOrders.filter(o=>o.status==='COMPLETADA').length}`);
    console.log(`      Resultados LAB recibidos: ${res.body.labResults.length}`);
    console.log(`      Informes RAD recibidos: ${res.body.radiologyReports.length}`);
    
    console.log('\n✅✅✅ FLUJO E2E COMPLETADO CON ÉXITO ✅✅✅');

  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:', error);
  }
}

runTest();
