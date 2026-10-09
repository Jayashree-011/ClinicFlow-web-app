import React from 'react';
import {
  Home, Users, Calendar, Stethoscope, FileText,
  Settings, Activity, DollarSignIcon, HelpCircle,
  Bell, LogOut, Pill, Contact, UserCog, FlaskConical
} from 'lucide-react';
import { getCookie } from '../services/api';

interface SidebarProps {
  tabList: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  unreadNotifications?: number;
}

export function Sidebar({ tabList, activeTab, setActiveTab, onLogout, unreadNotifications = 0 }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'encounters', label: 'Encounters', icon: FileText },
    { id: 'doctors', label: 'Doctors', icon: Stethoscope },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'lab',     label: 'Laboratory', icon: FlaskConical },
    { id: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { id: 'prescription', label: 'Prescriptions', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'billing', label: 'Billing & Payments', icon: DollarSignIcon },
    { id: 'staff', label: 'Staff', icon: Contact },
    { id: 'users', label: 'User Management', icon: UserCog },
  ];

  const labelUserName = getCookie('name') || "Dr. Debjoty Karkun"; // Replace with dynamic username if available
  const labelUserRole = getCookie('role') || "Administrator"; // Replace with dynamic role if available

  const bottomMenuItems = [
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'notification', label: 'Notification', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredMenuItems = tabList.map(tab => menuItems.find(item => item.id === tab)).filter(Boolean) as typeof menuItems;

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col justify-between font-sans antialiased select-none">
      <div>
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-blue-400">ClinicFlow</h1>
          <p className="text-slate-400 text-xs mt-0.5">Hospital Management</p>
        </div>

        <nav className="p-4 space-y-1">
          {filteredMenuItems.map((item) => {
            // const item = menuItems.find((i) => i.id === id);
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto">
        <nav className="p-4 pt-0 space-y-1 border-b border-slate-800">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showBadge = item.id === 'notification' && unreadNotifications > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <span className="relative">
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-red-500 text-white text-[8px] font-bold px-0.5">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  )}
                </span>
                <span>{item.label}</span>
                {showBadge && (
                  <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-900/50">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                {labelUserName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">{labelUserName}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{labelUserRole}</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={onLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}