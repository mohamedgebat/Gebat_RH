import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Palmtree, Banknote, Clock, UserPlus, Star, FileText, BarChart3, Link, HelpCircle, Settings, LogOut, Shield, GraduationCap, FolderKanban, Briefcase, AlertOctagon, ClipboardList, ShieldAlert, X } from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('/api/audit-logs', { action: 'DECONNEXION', module: 'Authentification', details: 'Déconnexion manuelle' });
    } catch (e) {}
    if (onClose) onClose();
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

  const handleNavClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col z-50 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out shrink-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* GEBAT Header Branding - Prominent Card for Maximum Visibility */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="p-2.5 bg-white rounded-2xl shadow-lg border border-amber-400 flex items-center gap-2.5 flex-1 mr-2">
          <img src="/gebat_logo.png" alt="GEBAT Logo Officiel" className="h-9 max-w-[80px] object-contain shrink-0" />
          <div className="border-l border-slate-200 pl-2">
            <h1 className="text-slate-900 font-black tracking-tight text-sm leading-none">GEBAT <span className="text-[#2563EB]">RH</span></h1>
            <p className="text-[8px] font-black text-[#E5A110] uppercase tracking-wider mt-1">CAPITAL HUMAIN</p>
          </div>
        </div>

        {/* Mobile Close Drawer Button */}
        <button 
          onClick={onClose} 
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Fermer menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3.5 space-y-1 custom-scrollbar">
        {navItems.map((item) =>
          item.external ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleNavClick}
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
              onClick={handleNavClick}
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
