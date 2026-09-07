import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Palmtree, Banknote, Clock, UserPlus, 
  Star, FileText, BarChart3, Link, HelpCircle, Settings, LogOut, 
  Shield, GraduationCap, FolderKanban, Briefcase, AlertOctagon, 
  ClipboardList, ShieldAlert, X, GitMerge, ShieldCheck, UserCheck, 
  Car, TrendingUp
} from 'lucide-react';
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

  const navSections = [
    {
      title: 'PILOTAGE STRATÉGIQUE',
      items: [
        { icon: <LayoutDashboard size={17} />, label: 'Tableau de bord', path: '/' },
        { icon: <GitMerge size={17} />, label: 'Organigramme', path: '/org-chart' },
        { icon: <ShieldCheck size={17} />, label: 'Espace Manager (MSS)', path: '/manager-hub' },
        { icon: <TrendingUp size={17} />, label: 'People Analytics (BI)', path: '/analytics' },
      ]
    },
    {
      title: 'GESTION DU PERSONNEL',
      items: [
        { icon: <Users size={17} />, label: 'Collaborateurs', path: '/employees' },
        { icon: <UserCheck size={17} />, label: 'Cycle de Vie & STC', path: '/lifecycle' },
        { icon: <FileText size={17} />, label: 'Contrats', path: '/contracts' },
        { icon: <Car size={17} />, label: 'Missions & Frais', path: '/missions-expenses' },
      ]
    },
    {
      title: 'PAIE & TEMPS DE TRAVAIL',
      items: [
        { icon: <Banknote size={17} />, label: 'Paie & Bulletins', path: '/payroll' },
        { icon: <Clock size={17} />, label: 'Pointage & Présence', path: '/attendance' },
        { icon: <Palmtree size={17} />, label: 'Congés & Absences', path: '/leaves' },
      ]
    },
    {
      title: 'TALENTS & DÉVELOPPEMENT',
      items: [
        { icon: <UserPlus size={17} />, label: 'Recrutement', path: '/recruitment' },
        { icon: <Briefcase size={17} />, label: 'Portail Carrière', path: '/careers', external: true },
        { icon: <Star size={17} />, label: 'Performance & Évaluations', path: '/evaluations' },
        { icon: <ClipboardList size={17} />, label: 'Tests Candidats', path: '/assessments' },
        { icon: <GraduationCap size={17} />, label: 'Formations', path: '/trainings' },
      ]
    },
    {
      title: 'ADMINISTRATION & COMPLIANCE',
      items: [
        { icon: <AlertOctagon size={17} />, label: 'Alertes, Dérives & Disciplinaire', path: '/disciplinary' },
        { icon: <ShieldAlert size={17} />, label: 'Registre Audit Trail & Sécurité', path: '/audit-logs' },
        { icon: <FolderKanban size={17} />, label: 'Documents RH', path: '/documents' },
        { icon: <BarChart3 size={17} />, label: 'Rapports RH', path: '/reports' },
        { icon: <Link size={17} />, label: 'API Comptabilité', path: '/accounting' },
        { icon: <Shield size={17} />, label: 'Administration', path: '/administration' },
        { icon: <Settings size={17} />, label: 'Paramètres', path: '/settings' },
        { icon: <HelpCircle size={17} />, label: 'Support', path: '/support' },
      ]
    }
  ];

  const handleNavClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-950 text-slate-300 flex flex-col z-50 border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out shrink-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* GEBAT Header Branding - Prominent Card for Maximum Visibility */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
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

      <nav className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">
              {section.title}
            </h3>
            {section.items.map((item) =>
              item.external ? (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 transition-all hover:bg-slate-900 hover:text-white group"
                >
                  <span className="text-slate-500 group-hover:text-amber-400 transition-colors">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="ml-auto text-[8px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-black">EXT</span>
                </a>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 font-black tracking-tight' 
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              )
            )}
          </div>
        ))}
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
