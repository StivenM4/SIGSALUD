const http = require('http');

const data = JSON.stringify({
  order_code: 'TEST-RAD-001',
  his_order_id: 999,
  patient_id: 1,
  patient_name: 'TEST PATIENT',
  doctor_name: 'TEST DOCTOR',
  study_type: 'RX TORAX',
  body_region: 'TORAX',
  priority: 'URGENTE',
  notes: 'Prueba de integración manual'
});

const options = {
  hostname: '127.0.0.1',
  port: 3002,
  path: '/api/orders/receive',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-service-key': 'sigsalud-internal'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
