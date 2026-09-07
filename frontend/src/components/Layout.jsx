import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationCenter from './NotificationCenter';
import AiRhAssistant from './AiRhAssistant';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Search, Building2, Menu } from 'lucide-react';

const Layout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const todayFormatted = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-[#E5A110] selection:text-slate-950">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Executive Topbar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-sm">
          
          {/* Left: Mobile Hamburger & Quick Date Badge */}
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
              title="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <Building2 size={15} className="text-[#2563EB] shrink-0" />
              <span className="capitalize text-slate-900 font-black">GEBAT SA</span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-500 font-medium capitalize hidden sm:inline truncate max-w-[180px]">{todayFormatted}</span>
            </div>
          </div>

          {/* Right: Notification Center & User Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cloche de Notification Intelligente */}
            <NotificationCenter />

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile Badge */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 p-1 sm:p-1.5 sm:pr-4 rounded-2xl border border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RH'}
              </div>
              <div className="text-left leading-tight hidden sm:block">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1 truncate max-w-[120px] md:max-w-[180px]">
                  <span>{user?.name || 'Administrateur GEBAT'}</span>
                  <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                </div>
                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Responsable RH' : 'Gestionnaire'}
                </div>
              </div>
            </div>
          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Floating AI RH Assistant */}
      <AiRhAssistant />
    </div>
  );
};

export default Layout;
