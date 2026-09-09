import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, Palmtree, Banknote, Clock, UserPlus, 
  Star, FileText, BarChart3, Link, HelpCircle, Settings, LogOut, 
  Shield, GraduationCap, FolderKanban, Briefcase, AlertOctagon, 
  ClipboardList, ShieldAlert, X, GitMerge, ShieldCheck, UserCheck, 
  Car, TrendingUp, ChevronDown, ChevronRight, HardHat, Sliders, 
  Building2
} from 'lucide-react';
import axios from 'axios';

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axios.post('/api/audit-logs', { action: 'DECONNEXION', module: 'Authentification', details: 'Déconnexion manuelle' });
    } catch (e) {}
    if (onClose) onClose();
    logout();
    navigate('/login');
  };

  const navCategories = [
    {
      id: 'dashboard',
      title: 'TABLEAU DE BORD',
      icon: <LayoutDashboard size={18} />,
      items: [
        { icon: <LayoutDashboard size={16} />, label: 'Tableau de bord', path: '/' },
        { icon: <GitMerge size={16} />, label: 'Organigramme', path: '/org-chart' },
        { icon: <ShieldCheck size={16} />, label: 'Espace Manager (MSS)', path: '/manager-hub' },
        { icon: <TrendingUp size={16} />, label: 'People Analytics (BI)', path: '/analytics' },
      ]
    },
    {
      id: 'personnel',
      title: 'GESTION DU PERSONNEL',
      icon: <Users size={18} />,
      items: [
        { icon: <Users size={16} />, label: 'Collaborateurs', path: '/employees' },
        { icon: <UserCheck size={16} />, label: 'Cycle de Vie & STC', path: '/lifecycle' },
        { icon: <FileText size={16} />, label: 'Contrats', path: '/contracts' },
        { icon: <Car size={16} />, label: 'Missions & Frais', path: '/missions-expenses' },
      ]
    },
    {
      id: 'projects',
      title: 'GESTION DES PROJETS',
      icon: <Building2 size={18} />,
      items: [
        { icon: <FolderKanban size={16} />, label: 'Liste des projets', path: '/projects' },
        { icon: <BarChart3 size={16} />, label: 'Vue Projet 360°', path: '/analytics' },
      ]
    },
    {
      id: 'payroll_time',
      title: 'PAIE & TEMPS DE TRAVAIL',
      icon: <Banknote size={18} />,
      items: [
        { icon: <Banknote size={16} />, label: 'Paie & Bulletins', path: '/payroll' },
        { icon: <Clock size={16} />, label: 'Pointage & Présence', path: '/attendance' },
        { icon: <Palmtree size={16} />, label: 'Congés & Absences', path: '/leaves' },
      ]
    },
    {
      id: 'btp',
      title: 'GESTION GLOBALE BTP',
      icon: <HardHat size={18} />,
      items: [
        { icon: <HardHat size={16} />, label: 'Suivi Chantiers BTP', path: '/projects' },
        { icon: <Car size={16} />, label: 'Engins & Véhicules', path: '/missions-expenses' },
      ]
    },
    {
      id: 'talents',
      title: 'TALENTS & DÉVELOPPEMENT',
      icon: <UserPlus size={18} />,
      items: [
        { icon: <UserPlus size={16} />, label: 'Recrutement', path: '/recruitment' },
        { icon: <Briefcase size={16} />, label: 'Portail Carrière', path: '/careers', external: true },
        { icon: <Star size={16} />, label: 'Performance & Évaluations', path: '/evaluations' },
        { icon: <ClipboardList size={16} />, label: 'Tests Candidats', path: '/assessments' },
        { icon: <GraduationCap size={16} />, label: 'Formations', path: '/trainings' },
      ]
    },
    {
      id: 'admin_compliance',
      title: 'ADMINISTRATION & KPI',
      icon: <Sliders size={18} />,
      items: [
        { icon: <AlertOctagon size={16} />, label: 'Alertes & Disciplinaire', path: '/disciplinary' },
        { icon: <ShieldAlert size={16} />, label: 'Registre Audit Trail', path: '/audit-logs' },
        { icon: <FolderKanban size={16} />, label: 'Documents RH', path: '/documents' },
        { icon: <BarChart3 size={16} />, label: 'Rapports RH', path: '/reports' },
        { icon: <Link size={16} />, label: 'API Comptabilité', path: '/accounting' },
        { icon: <Shield size={16} />, label: 'Administration', path: '/administration' },
        { icon: <Settings size={16} />, label: 'Paramètres', path: '/settings' },
        { icon: <HelpCircle size={16} />, label: 'Support', path: '/support' },
      ]
    }
  ];

  // Auto-expand category containing the current route
  const getActiveCategoryId = () => {
    const currentPath = location.pathname;
    for (const cat of navCategories) {
      if (cat.items.some(item => item.path === currentPath || (item.path !== '/' && currentPath.startsWith(item.path)))) {
        return cat.id;
      }
    }
    return 'dashboard';
  };

  const [openCategories, setOpenCategories] = useState({
    [getActiveCategoryId()]: true
  });

  useEffect(() => {
    const activeCat = getActiveCategoryId();
    setOpenCategories(prev => ({ ...prev, [activeCat]: true }));
  }, [location.pathname]);

  const toggleCategory = (id) => {
    setOpenCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleNavClick = () => {
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#070D1D] text-slate-200 flex flex-col z-50 border-r border-[#15203A] shadow-2xl transition-transform duration-300 ease-in-out shrink-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      {/* GEBAT Branding Header */}
      <div className="p-4 border-b border-[#15203A] bg-[#0A1227] flex items-center justify-between">
        <div className="p-2.5 bg-slate-950/80 rounded-2xl border border-amber-500/30 flex items-center gap-3 flex-1 mr-2 shadow-md">
          <img src="/gebat_logo.png" alt="GEBAT Logo" className="h-9 max-w-[75px] object-contain shrink-0" />
          <div className="border-l border-slate-700/60 pl-2.5">
            <h1 className="text-white font-black tracking-tight text-sm leading-none">GEBAT <span className="text-amber-400">RH</span></h1>
            <p className="text-[8px] font-black text-amber-400/90 uppercase tracking-widest mt-1">CAPITAL HUMAIN</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button 
          onClick={onClose} 
          className="lg:hidden p-2 rounded-xl bg-[#141F3A] text-slate-400 hover:text-white transition-colors"
          title="Fermer menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Collapsible Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
        {navCategories.map((cat) => {
          const isOpenCat = !!openCategories[cat.id];
          const isCategoryActive = cat.items.some(item => 
            item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path))
          );

          return (
            <div key={cat.id} className="space-y-2">
              {/* Category Card Header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all border ${
                  isCategoryActive || isOpenCat
                    ? 'bg-[#101A34] text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/5 relative overflow-hidden'
                    : 'bg-[#0B1327] text-slate-300 border-[#162242] hover:bg-[#101B37] hover:border-slate-700'
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {(isCategoryActive || isOpenCat) && (
                  <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 rounded-l-2xl"></span>
                )}

                <div className="flex items-center gap-3 pl-1">
                  <div className={`p-2 rounded-xl flex items-center justify-center transition-colors ${
                    isCategoryActive || isOpenCat
                      ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                      : 'bg-slate-900/80 text-amber-400/80 border border-slate-800'
                  }`}>
                    {cat.icon}
                  </div>
                  <span className="font-extrabold text-xs tracking-wider uppercase text-amber-400">
                    {cat.title}
                  </span>
                </div>

                <div className="text-amber-400/90 ml-2">
                  {isOpenCat ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </button>

              {/* Collapsible Sub-items Container */}
              {isOpenCat && (
                <div className="ml-5 pl-3 border-l-2 border-amber-500/30 space-y-1.5 py-1">
                  {cat.items.map((item) =>
                    item.external ? (
                      <a
                        key={item.path}
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleNavClick}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#142042] hover:text-white transition-all group"
                      >
                        <span className="text-slate-400 group-hover:text-amber-400 transition-colors">{item.icon}</span>
                        <span>{item.label}</span>
                        <span className="ml-auto text-[8px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-black">EXT</span>
                      </a>
                    ) : (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                            isActive 
                              ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 scale-[1.01]' 
                              : 'text-slate-300 font-bold hover:bg-[#121E3D] hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className={isActive ? 'text-slate-950' : 'text-slate-400'}>{item.icon}</span>
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Logout Button */}
      <div className="p-4 border-t border-[#15203A] bg-[#091023]">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors border border-rose-500/10">
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

