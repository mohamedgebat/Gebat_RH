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
    <aside className="fixed left-0 top-0 h-full w-64 bg-ci-sidebar text-white/70 flex flex-col z-50">
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-ci-green to-ci-orange rounded-xl flex items-center justify-center">
            <Users className="text-white" size={24} />
        </div>
        <div>
            <h1 className="text-white font-black tracking-tighter leading-none">SIRH CI</h1>
            <p className="text-[10px] font-bold text-ci-green uppercase tracking-widest mt-1">Opérations</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        {navItems.map((item) =>
          item.external ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:bg-white/5 hover:text-white"
            >
              {item.icon}
              <span>{item.label}</span>
              <span className="ml-auto text-[10px] bg-ci-orange/20 text-ci-orange px-1.5 py-0.5 rounded font-bold">EXT</span>
            </a>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'bg-ci-green text-white shadow-lg shadow-ci-green/20' : 'hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors">
            <LogOut size={18} />
            <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
