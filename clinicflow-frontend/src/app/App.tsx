import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { Welcome }  from './Welcome';
import { Login }    from './Login';
import { Register } from './Register';

// Dashboards
import { Admin }             from './components/Admin/Admin';
import { Reception }         from './components/Reception/Reception';
import { Clinician }         from './components/Clinician/Clinician';
import PatientDashboard      from './components/Patient/PatientDashboard';
import { PharmacyDashboard } from './components/Pharmacy/PharmacyDashboard';
import { FinanceDashboard }  from './components/Finance/FinanceDashboard';
import { ManagerDashboard }  from './components/Manager/ManagerDashboard';
import { AuditorDashboard }  from './components/Auditor/AuditorDashboard';
import NotFound from './404';

/** Reads the JWT cookie set by Login.tsx and redirects to /login when absent. */
function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];
  return token ? element : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<Welcome />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />

        {/* Dashboards — protected: redirect to /login when no token */}
        <Route path="/administrator/dashboard" element={<ProtectedRoute element={<Admin />} />} />
        <Route path="/receptionist/dashboard"  element={<ProtectedRoute element={<Reception />} />} />
        <Route path="/clinician/dashboard"     element={<ProtectedRoute element={<Clinician />} />} />
        <Route path="/patient/dashboard"       element={<ProtectedRoute element={<PatientDashboard />} />} />
        <Route path="/pharmacy/dashboard"      element={<ProtectedRoute element={<PharmacyDashboard />} />} />
        <Route path="/finance/dashboard"       element={<ProtectedRoute element={<FinanceDashboard />} />} />
        <Route path="/manager/dashboard"       element={<ProtectedRoute element={<ManagerDashboard />} />} />
        <Route path="/auditor/dashboard"       element={<ProtectedRoute element={<AuditorDashboard />} />} />

        {/* Catch-all for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
