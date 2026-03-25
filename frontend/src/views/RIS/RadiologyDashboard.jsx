import React, { useState, useEffect } from 'react';
import { risApi } from '../../api/apiConfig';
import { Image as ImageIcon, CheckCircle, Calendar } from 'lucide-react';

export default function RadiologyDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await risApi.get('/orders');
      setOrders(data.orders || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="h2 flex items-center gap-2 text-primary-color" style={{ color: 'var(--accent-color)'}}>
          <ImageIcon size={28}/> Dashboard RIS (Radiología)
        </h1>
      </div>

      <div className="card">
        <h2 className="h3 mb-4">Cola de Estudios Radiológicos</h2>
        
        {loading ? (
             <p className="text-muted text-center py-4">Cargando...</p>
        ) : (
          <div className="flex-col gap-4">
            {orders.length === 0 ? <p className="text-muted">No hay estudios radiológicos programados.</p> : null}
            
            {orders.map(o => (
              <div key={o.id} className="glass-panel flex items-center justify-between" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-color)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-primary">{o.order_code}</span>
                    <span className="badge badge-warning">{o.status}</span>
                  </div>
                  <p className="text-sm"><strong>Paciente:</strong> {o.patient_name} <span className="text-muted">| Dr. {o.doctor_name}</span></p>
                  <p className="text-sm border-t mt-2 pt-2 border-slate-200"><strong>Estudio:</strong> {o.study_type} ({o.body_region})</p>
                </div>
                
                <div className="flex-col gap-2">
                  {o.status === 'RECIBIDA' && (
                    <button className="btn btn-secondary text-sm flex items-center gap-1"><Calendar size={14}/> Agendar Cita</button>
                  )}
                  {o.status === 'AGENDADA' && (
                    <button className="btn btn-primary text-sm" style={{ backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)'}}>Realizar Estudio DICOM</button>
                  )}
                  {o.status === 'ESTUDIO_REALIZADO' && (
                    <button className="btn btn-primary text-sm flex items-center gap-1" style={{ backgroundColor: 'var(--success-color)', color: 'white'}}><CheckCircle size={14}/> Redactar Informe</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
