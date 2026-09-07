import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import AiRhAssistant from './AiRhAssistant';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Search, Building2 } from 'lucide-react';

const Layout = () => {
  const { user } = useAuth();
  const todayFormatted = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-[#E5A110] selection:text-slate-950">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Executive Topbar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 sticky top-0 z-40 flex items-center justify-between shadow-sm">
          
          {/* Left: Quick Date & Search Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <Building2 size={15} className="text-[#2563EB]" />
              <span className="capitalize text-slate-900 font-black">GEBAT SA</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium capitalize">{todayFormatted}</span>
            </div>
          </div>

          {/* Right: Notification Center & User Profile */}
          <div className="flex items-center gap-4">
            {/* Cloche de Notification Intelligente */}
            <NotificationCenter />

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Profile Badge */}
            <div className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-xs shadow-md">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RH'}
              </div>
              <div className="text-left leading-tight">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <span>{user?.name || 'Administrateur GEBAT'}</span>
                  <ShieldCheck size={12} className="text-emerald-600" />
                </div>
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Responsable RH' : 'Gestionnaire'}
                </div>
              </div>
            </div>
          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating AI RH Assistant */}
      <AiRhAssistant />
    </div>
  );
};

export default Layout;
