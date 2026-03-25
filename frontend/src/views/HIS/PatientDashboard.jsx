import React, { useState, useEffect } from 'react';
import { hisApi } from '../../api/apiConfig';
import { User, FileText, ClipboardList, Activity } from 'lucide-react';

export default function PatientDashboard() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const { data } = await hisApi.get('/patients');
      setPatients(data.patients || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchPatientRecords = async (patientId) => {
    try {
      const { data } = await hisApi.get(`/clinical/records/patient/${patientId}`);
      setRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    fetchPatientRecords(p.id);
  };

  const handleRegisterPatient = async () => {
    const full_name = prompt('Nombre completo del paciente:');
    if (!full_name) return;
    const document_num = prompt('Número de documento (C.C.):');
    if (!document_num) return;
    
    try {
      await hisApi.post('/patients', {
        document_type: 'CC',
        document_num,
        full_name,
        birth_date: '1990-01-01',
        gender: 'M'
      });
      alert('✅ Paciente registrado con éxito.');
      fetchPatients(); // Recargar la lista
    } catch (err) {
      alert(err.response?.data?.error || 'Error registrando paciente');
      console.error(err);
    }
  };

  const handleNewConsulta = async () => {
    try {
      if(!selectedPatient) return;
      await hisApi.post('/clinical/records', {
        patient_id: selectedPatient.id,
        motive: 'Consulta de control general',
        diagnosis: 'En evaluación médica',
        treatment: 'Pendiente a resultado de órdenes médicas'
      });
      fetchPatientRecords(selectedPatient.id);
      alert('✅ Nueva consulta clínica registrada con éxito.');
    } catch(err) { console.error(err); alert(err.response?.data?.error || 'Error registrando visita'); }
  };

  const handleCreateLabOrder = async () => {
    try {
      if(!selectedPatient || records.length === 0) return alert('Debe registrar una Consulta Clínica primero en el historial.');
      await hisApi.post('/clinical/orders/lab', {
        patient_id: selectedPatient.id,
        record_id: records[0].id,
        priority: 'NORMAL',
        tests_requested: ['Hemoglobina', 'Cuadro Hemático'],
        notes: 'Enviado desde el entorno gráfico HIS'
      });
      alert('🔬 ¡Orden de Laboratorio enviada vía Webhook al LIS exitosamente!');
    } catch(err) { console.error(err); alert(err.response?.data?.error || 'Error al crear orden de laboratorio'); }
  };

  const handleCreateRadOrder = async () => {
    try {
      if(!selectedPatient || records.length === 0) return alert('Debe registrar una Consulta Clínica primero en el historial.');
      await hisApi.post('/clinical/orders/radiology', {
        patient_id: selectedPatient.id,
        record_id: records[0].id,
        priority: 'NORMAL',
        study_type: 'Rayos X de Tórax',
        body_region: 'Tórax',
        notes: 'Enviado desde el entorno gráfico HIS'
      });
      alert('☢️ ¡Orden de Radiología enviada vía Webhook al RIS exitosamente!');
    } catch(err) { console.error(err); alert(err.response?.data?.error || 'Error al crear orden de radiología'); }
  };

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="h2 flex items-center gap-2 text-primary-color">
          <Activity size={28}/> Dashboard HIS (Médico)
        </h1>
        <button className="btn btn-primary" onClick={handleRegisterPatient}>Registrar Paciente</button>
      </div>

      <div className="flex gap-4">
        {/* Panel Izquierdo: Lista de Pacientes */}
        <div className="card" style={{ width: '300px', flexShrink: 0 }}>
          <h2 className="h3 mb-4 flex items-center gap-2"><User size={20}/> Pacientes</h2>
          
          {loading ? (
             <p className="text-muted text-center py-4">Cargando...</p>
          ) : (
            <ul className="flex-col gap-2">
              {patients.map(p => (
                <li 
                  key={p.id} 
                  className="glass-panel" 
                  style={{ padding: '0.75rem', cursor: 'pointer', borderColor: selectedPatient?.id === p.id ? 'var(--primary-color)' : 'transparent' }}
                  onClick={() => handleSelectPatient(p)}
                >
                  <p className="font-medium text-primary">{p.full_name}</p>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>CC: {p.document_num}</p>
                </li>
              ))}
              {patients.length === 0 && <p className="text-muted">No hay pacientes registrados.</p>}
            </ul>
          )}
        </div>

        {/* Panel Derecho: Historial y Órdenes */}
        <div className="flex-col gap-4" style={{ flexGrow: 1 }}>
          {selectedPatient ? (
            <>
              <div className="card glass-panel flex-col gap-2">
                <h3 className="h3 flex items-center gap-2 text-primary-color"><FileText size={20}/> Detalle del Paciente</h3>
                <div className="flex gap-4 mb-2">
                  <p><strong>Nombre:</strong> {selectedPatient.full_name}</p>
                  <p><strong>Documento:</strong> {selectedPatient.document_num}</p>
                  <p><strong>Nacimiento:</strong> {selectedPatient.birth_date}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-secondary" onClick={handleNewConsulta}>Nueva Consulta</button>
                  <button className="btn btn-primary" onClick={handleCreateLabOrder}>+ Orden Lab</button>
                  <button className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)'}} onClick={handleCreateRadOrder}>+ Orden Rad</button>
                </div>
              </div>

              <div className="card">
                <h3 className="h3 mb-4 flex items-center gap-2"><ClipboardList size={20}/> Historial de Atenciones</h3>
                {records.length > 0 ? (
                  <div className="flex-col gap-4">
                    {records.map(r => (
                      <div key={r.id} style={{ borderLeft: '4px solid var(--primary-color)', paddingLeft: '1rem', marginBottom: '1rem' }}>
                        <p className="text-muted" style={{ fontSize: '0.85rem'}}>{new Date(r.created_at).toLocaleString()}</p>
                        <p><strong>Motivo:</strong> {r.motive}</p>
                        <p><strong>Diagnóstico:</strong> {r.diagnosis}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted">El paciente no tiene consultas previas registradas.</p>
                )}
              </div>
            </>
          ) : (
            <div className="card flex items-center justify-center text-muted" style={{ height: '300px' }}>
              <p>Selecciona un paciente de la lista para visualizar su historia clínica y generar órdenes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
