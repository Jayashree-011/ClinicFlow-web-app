import { useState } from 'react';
import { Sidebar } from './Sidebar';
import Dashboard from './Reception/Dashboard';
import { Patients } from './Patients';
import { Appointments } from './Appointments';
import  Billing from './Billing';
import { Staff } from './Staff';
import { RecordsSection } from './RecordsSection';
import { PharmacyComponent } from "./PharmacyComponent";

export function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />; 

      case 'patients':
        return <Patients />;

      case 'appointments':
        return <Appointments />;

      case 'staff':
        return <Staff />;

      case 'records':
        return <RecordsSection />; 

      case 'pharmacy':
  return <PharmacyComponent />;
      case 'billing':
        return <Billing />;

      default:
        return <Dashboard />;
    }
  };
console.log(activeTab);
  return (
    <div className="size-full flex bg-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}