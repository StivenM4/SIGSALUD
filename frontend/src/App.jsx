import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './components/PrivateRoute';
import Login from './views/Auth/Login';
import PatientDashboard from './views/HIS/PatientDashboard';
import LabDashboard from './views/LIS/LabDashboard';
import RadiologyDashboard from './views/RIS/RadiologyDashboard';
import { Navbar } from './components/Navbar';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<Login />} />

        {/* Vistas HIS */}
        <Route path="/his/*" element={
          <PrivateRoute allowedRoles={['MEDICO', 'ADMINISTRADOR']}>
            <Navbar />
            <PatientDashboard />
          </PrivateRoute>
        } />

        {/* Vistas LIS */}
        <Route path="/lis/*" element={
          <PrivateRoute allowedRoles={['TECNICO_LAB', 'BACTERIOLOGO', 'ADMINISTRADOR']}>
            <Navbar />
            <LabDashboard />
          </PrivateRoute>
        } />

        {/* Vistas RIS */}
        <Route path="/ris/*" element={
          <PrivateRoute allowedRoles={['TECNICO_RAD', 'RADIOLOGO', 'ADMINISTRADOR']}>
            <Navbar />
            <RadiologyDashboard />
          </PrivateRoute>
        } />

        <Route path="/unauthorized" element={
          <div className="flex items-center justify-center min-h-screen flex-col">
            <h1 className="h1 text-danger-color mb-4">Acceso Denegado</h1>
            <p className="text-muted">No tienes permisos para ver esta pantalla.</p>
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
