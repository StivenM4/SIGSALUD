import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LogOut, User, Activity } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <nav className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="flex items-center gap-2">
        <Activity className="text-primary-color" size={28} />
        <span className="h2 text-primary">SIGSALUD</span>
        <span className="badge badge-info ml-2">{user.role}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-muted">
          <User size={18} />
          <span>{user.full_name}</span>
        </div>
        <button onClick={logout} className="btn btn-secondary">
          <LogOut size={16} /> Salir
        </button>
      </div>
    </nav>
  );
};
