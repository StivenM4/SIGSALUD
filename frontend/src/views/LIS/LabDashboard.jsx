import React, { useState, useEffect } from 'react';
import { lisApi } from '../../api/apiConfig';
import { Beaker, CheckCircle, AlertTriangle } from 'lucide-react';

export default function LabDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const { data } = await lisApi.get('/orders');
      setOrders(data.orders || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const simulateResult = async (orderCode) => {
    // Simulamos un valor aleatorio de leucocitos (algunos generarán alertas críticas > 11.0)
    const randomValue = (Math.random() * (15 - 4) + 4).toFixed(1);
    const results = [{ test_name: 'Leucocitos', value: randomValue, unit: 'x10^9/L', reference_range: '4.5 - 11.0' }];
    
    try {
      await lisApi.post(`/orders/${orderCode}/results`, { results });
      alert(`Resultado simulado guardado: ${randomValue}`);
      fetchPendingOrders(); // Refrescar lista
    } catch (err) {
      console.error(err);
      alert('Error al guardar el resultado simulado');
    }
  };

  return (
    <div className="container animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h1 className="h2 flex items-center gap-2 text-primary-color">
          <Beaker size={28}/> Dashboard LIS (Laboratorio Clínico)
        </h1>
      </div>

      <div className="card">
        <h2 className="h3 mb-4">Bandeja de Órdenes Pendientes</h2>
        
        {loading ? (
             <p className="text-muted text-center py-4">Cargando...</p>
        ) : (
          <div className="flex-col gap-4">
            {orders.length === 0 ? <p className="text-muted">No hay órdenes pendientes en este momento.</p> : null}
            
            {orders.map(o => (
              <div key={o.id} className="glass-panel flex items-center justify-between" style={{ padding: '1rem', borderLeft: '4px solid var(--secondary-color)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-primary">{o.order_code}</span>
                    <span className={`badge ${o.priority === 'URGENTE' ? 'badge-danger' : 'badge-info'}`}>
                      {o.priority}
                    </span>
                  </div>
                  <p className="text-sm"><strong>Paciente:</strong> {o.patient_name}</p>
                  <p className="text-sm text-muted">Solicitado por Dr. {o.doctor_name}</p>
                  <p className="text-sm border-t mt-2 pt-2 border-slate-200"><strong>Tests:</strong> {o.tests_requested}</p>
                </div>
                
                <div className="flex-col gap-2">
                  {o.status === 'RECIBIDA' && (
                    <button className="btn btn-secondary text-sm">Registrar Muestra</button>
                  )}
                  {o.status === 'MUESTRA_TOMADA' && (
                    <button className="btn btn-primary text-sm" onClick={() => simulateResult(o.order_code)}>Simular Analizador</button>
                  )}
                  {o.status === 'RESULTADOS_REGISTRADOS' && (
                    <button className="btn btn-success text-sm flex items-center gap-1" style={{ backgroundColor: 'var(--success-color)', color: 'white'}}><CheckCircle size={14}/> Validar Resultado</button>
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
