import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, User } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'MEDICO' || res.user.role === 'ADMINISTRADOR') navigate('/his');
      else if (res.user.role === 'TECNICO_LAB' || res.user.role === 'BACTERIOLOGO') navigate('/lis');
      else if (res.user.role === 'TECNICO_RAD' || res.user.role === 'RADIOLOGO') navigate('/ris');
      else navigate('/his');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ 
        background: 'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%)'
    }}>
      
      <div className="card glass-panel animate-fade-in login-container">
        
        {/* Lado Izquierdo - Branding Moderno */}
        <div className="login-left flex-col justify-center items-center" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent-color) 100%)', padding: '3rem', color: 'white', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
          
          <div className="glass-panel animate-pulse flex items-center justify-center mb-6" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Activity size={40} color="white" />
          </div>
          <h1 className="h1" style={{ color: 'white', marginBottom: '1rem', zIndex: 1 }}>SIGSALUD</h1>
          <p style={{ textAlign: 'center', opacity: 0.9, fontSize: '1.1rem', zIndex: 1, fontWeight: 300 }}>
            Plataforma Hospitalaria de Nueva Generación.<br/>HIS, LIS y RIS interconectados.
          </p>
        </div>

        {/* Lado Derecho - Formulario de Login */}
        <div className="login-right flex-col justify-center" style={{ padding: '3rem 4rem', background: 'rgba(255,255,255,0.6)' }}>
          <div className="mb-8">
            <h2 className="h2 text-primary" style={{ marginBottom: '0.5rem' }}>Bienvenido de nuevo</h2>
            <p className="text-muted">Por favor ingresa tus credenciales</p>
          </div>

          {errorMsg && (
            <div className="glass-panel badge-danger" style={{ padding: '0.75rem', marginBottom: '1.5rem', border: '1px solid var(--danger-color)', borderRadius: 'var(--radius-md)' }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex-col gap-5">
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 600 }}>Nombre de Usuario</label>
              <div style={{ position: 'relative' }}>
                <User size={18} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem', height: '48px', fontSize: '1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  value={username} onChange={(e)=>setUsername(e.target.value)} 
                  placeholder="Ej. admin"
                  required 
                />
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontWeight: 600 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} className="text-muted" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem', height: '48px', fontSize: '1rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  value={password} onChange={(e)=>setPassword(e.target.value)} 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 600 }} disabled={loading}>
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
