import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Palmtree, Banknote, Clock, UserPlus, Star, FileText, BarChart3, Link, HelpCircle, Settings, LogOut, Shield, GraduationCap, FolderKanban, Briefcase, AlertOctagon, ClipboardList, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/audit-logs', { action: 'DECONNEXION', module: 'Authentification', details: 'Déconnexion manuelle' });
    } catch (e) {}
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Tableau de bord', path: '/' },
    { icon: <Users size={18} />, label: 'Employés', path: '/employees' },
    { icon: <AlertOctagon size={18} />, label: 'Disciplinaire', path: '/disciplinary' },
    { icon: <Palmtree size={18} />, label: 'Congés', path: '/leaves' },
    { icon: <Banknote size={18} />, label: 'Paie', path: '/payroll' },
    { icon: <Clock size={18} />, label: 'Pointage', path: '/attendance' },
    { icon: <UserPlus size={18} />, label: 'Recrutement', path: '/recruitment' },
    { icon: <Briefcase size={18} />, label: 'Portail Carrière', path: '/careers', external: true },
    { icon: <Star size={18} />, label: 'Évaluations (Internes)', path: '/evaluations' },
    { icon: <ClipboardList size={18} />, label: 'Tests (Candidats)', path: '/assessments' },
    { icon: <FileText size={18} />, label: 'Contrats', path: '/contracts' },
    { icon: <GraduationCap size={18} />, label: 'Formations', path: '/trainings' },
    { icon: <FolderKanban size={18} />, label: 'Documents', path: '/documents' },
    { icon: <BarChart3 size={18} />, label: 'Rapports', path: '/reports' },
    { icon: <Link size={18} />, label: 'API Comptabilité', path: '/accounting' },
    { icon: <HelpCircle size={18} />, label: 'Support', path: '/support' },
    { icon: <Shield size={18} />, label: 'Administration', path: '/administration' },
    { icon: <ShieldAlert size={18} />, label: 'Journal d\'Audit', path: '/audit-logs' },
    { icon: <Settings size={18} />, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-300 flex flex-col z-50 border-r border-slate-800 shadow-xl">
      {/* GEBAT Header Branding */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3.5 bg-slate-950/60">
        <div className="w-12 h-10 rounded-xl overflow-hidden bg-white p-0.5 shadow-md flex items-center justify-center shrink-0 border border-amber-400">
          <img src="/gebat_logo.png" alt="GEBAT Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-white font-black tracking-tight text-lg leading-none">GEBAT <span className="text-[#E5A110]">RH</span></h1>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Gestion Talents</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3.5 space-y-1 custom-scrollbar">
        {navItems.map((item) =>
          item.external ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-slate-800 hover:text-white"
            >
              {item.icon}
              <span>{item.label}</span>
              <span className="ml-auto text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-black">EXT</span>
            </a>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 font-bold' : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors">
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
