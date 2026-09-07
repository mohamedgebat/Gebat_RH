import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { 
  GitMerge, Search, Filter, ZoomIn, ZoomOut, RotateCcw, 
  Download, Users, Building2, HardHat, ChevronDown, ChevronRight, 
  UserCheck, Shield, Phone, Mail, MapPin, Printer, Eye, Sparkles
} from 'lucide-react';

const Organigram = () => {
  const { data, loading } = useData();
  const employees = data?.employees || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [selectedEmployeeModal, setSelectedEmployeeModal] = useState(null);
  const chartRef = useRef(null);

  // Extraire les départements et sites uniques
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.departement).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  const sites = useMemo(() => {
    const set = new Set(employees.map(e => e.site).filter(Boolean));
    return Array.from(set);
  }, [employees]);

  // Construction de l'arbre hiérarchique
  const hierarchyTree = useMemo(() => {
    if (!employees || employees.length === 0) return null;

    const empMap = new Map();
    employees.forEach(emp => {
      empMap.set(emp.id, { ...emp, directReports: [] });
    });

    const roots = [];

    employees.forEach(emp => {
      const node = empMap.get(emp.id);
      
      let parent = null;
      if (emp.responsable) {
        const respLower = String(emp.responsable).trim().toLowerCase();
        for (const candidate of employees) {
          const candFullName = `${candidate.nom} ${candidate.prenoms}`.trim().toLowerCase();
          const candMat = String(candidate.matricule || '').trim().toLowerCase();
          if (candFullName === respLower || candMat === respLower || (respLower.length > 3 && candFullName.includes(respLower))) {
            parent = empMap.get(candidate.id);
            break;
          }
        }
      }

      if (parent && parent.id !== emp.id) {
        parent.directReports.push(node);
      } else {
        roots.push(node);
      }
    });

    if (roots.length === 0 && employees.length > 0) {
      return {
        id: 'root-company',
        nom: 'DIRECTION GÉNÉRALE',
        prenoms: 'GEBAT SA',
        poste: 'Comité de Direction',
        departement: 'Direction',
        directReports: Array.from(empMap.values())
      };
    }

    if (roots.length === 1) {
      return roots[0];
    }

    return {
      id: 'root-company',
      nom: 'DIRECTION GÉNÉRALE',
      prenoms: 'GEBAT SA',
      poste: 'Conseil d\'Administration & Direction',
      departement: 'Direction Générale',
      directReports: roots
    };
  }, [employees]);

  const toggleCollapse = (nodeId) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const renderOrgNode = (node, level = 0) => {
    if (!node) return null;

    const isCollapsed = collapsedNodes[node.id];
    const hasChildren = node.directReports && node.directReports.length > 0;
    const matchesSearch = !searchTerm || 
      `${node.nom} ${node.prenoms}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(node.poste || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(node.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDept === 'ALL' || node.departement === selectedDept;
    const matchesSite = selectedSite === 'ALL' || node.site === selectedSite;
    const isDimmed = !(matchesSearch && matchesDept && matchesSite);

    const isTopExecutive = level === 0 || String(node.poste || '').toLowerCase().includes('direct') || String(node.poste || '').toLowerCase().includes('gérant');

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Carte Collaborateur */}
        <div 
          onClick={() => setSelectedEmployeeModal(node)}
          className={`relative w-64 sm:w-72 bg-white rounded-3xl p-4 shadow-lg border-2 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-2xl ${
            isDimmed ? 'opacity-40 grayscale' : 'opacity-100'
          } ${
            isTopExecutive ? 'border-[#2563EB] shadow-blue-500/10' : 'border-slate-200 hover:border-[#E5A110]'
          }`}
        >
          {/* Badge Département */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 truncate max-w-[150px]">
              {node.departement || 'Général'}
            </span>
            {node.matricule && (
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {node.matricule}
              </span>
            )}
          </div>

          {/* Photo & Nom */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <EmployeeAvatar
                src={node.photo}
                nom={node.nom}
                prenoms={node.prenoms}
                matricule={node.matricule}
                size="md"
                className="rounded-2xl shadow-md border-2 border-white group-hover:scale-105 transition-transform"
              />
              {node.statut === 'Actif' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" title="Actif"></span>
              )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-xs font-black text-slate-900 leading-tight truncate group-hover:text-[#2563EB] transition-colors">
                {node.nom} {node.prenoms}
              </h4>
              <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">
                {node.poste || 'Collaborateur'}
              </p>
              {node.site && (
                <p className="text-[9px] font-semibold text-amber-600 flex items-center gap-1 mt-1 truncate">
                  <HardHat size={10} className="shrink-0" /> {node.site}
                </p>
              )}
            </div>
          </div>

          {/* Footer Card: Effectifs sous supervision */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-[#2563EB]" />
              <span>{node.directReports?.length || 0} subordonné(s)</span>
            </span>

            {hasChildren && (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(node.id);
                }}
                className="p-1 rounded-lg bg-slate-100 hover:bg-[#2563EB] hover:text-white text-slate-700 transition-colors"
                title={isCollapsed ? "Déplier l'équipe" : "Replier l'équipe"}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Lignes Connectrices */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center w-full">
            <div className="w-0.5 h-6 bg-slate-300"></div>

            {node.directReports.length > 1 && (
              <div 
                className="h-0.5 bg-slate-300"
                style={{
                  width: `calc(100% - ${100 / node.directReports.length}%)`
                }}
              ></div>
            )}

            <div className="flex gap-6 sm:gap-10 pt-2 items-start justify-center flex-wrap sm:flex-nowrap">
              {node.directReports.map(child => (
                <div key={child.id} className="relative flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                  {renderOrgNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header & Commandes */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#2563EB]/10 text-[#2563EB] rounded-2xl">
              <GitMerge size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Organigramme & Hiérarchie d'Entreprise
              </h1>
              <p className="text-xs font-bold text-slate-400">
                Structure organisationnelle interactive • Standard SAP SuccessFactors & Odoo HR
              </p>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.1))}
              className="p-2 text-slate-700 hover:bg-white rounded-xl transition-all"
              title="Zoom Arrière (-)"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-3 text-xs font-mono font-black text-slate-700">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.1))}
              className="p-2 text-slate-700 hover:bg-white rounded-xl transition-all"
              title="Zoom Avant (+)"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-2 text-slate-500 hover:bg-white rounded-xl transition-all ml-1"
              title="Réinitialiser le zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
          >
            <Printer size={14} /> Imprimer
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un collaborateur, un poste, un matricule..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <Building2 size={16} className="text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
          >
            <option value="ALL">Tous les Départements</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 min-w-[180px]">
          <HardHat size={16} className="text-slate-400" />
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white outline-none cursor-pointer"
          >
            <option value="ALL">Tous les Chantiers / Sites</option>
            {sites.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="px-4 py-2 bg-blue-50 text-[#2563EB] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
          <Users size={14} />
          <span>{employees.length} Collaborateurs</span>
        </div>
      </div>

      {/* Visualiseur Organigramme */}
      <div 
        ref={chartRef}
        className="bg-slate-100/70 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 sm:p-12 overflow-x-auto overflow-y-auto min-h-[600px] flex justify-center custom-scrollbar"
      >
        <div 
          className="transition-transform duration-200 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {hierarchyTree ? (
            renderOrgNode(hierarchyTree)
          ) : (
            <div className="text-center py-20 space-y-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 mx-auto shadow-sm">
                <GitMerge size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600">Aucune donnée hiérarchique disponible</p>
              <p className="text-xs text-slate-400">Ajoutez des employés et renseignez leur responsable pour générer l'organigramme.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Fiche Collaborateur */}
      {selectedEmployeeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-200 p-8 animate-scaleIn">
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <EmployeeAvatar
                  src={selectedEmployeeModal.photo}
                  nom={selectedEmployeeModal.nom}
                  prenoms={selectedEmployeeModal.prenoms}
                  matricule={selectedEmployeeModal.matricule}
                  size="xl"
                  className="rounded-2xl shadow-xl border-4 border-slate-50"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {selectedEmployeeModal.nom} {selectedEmployeeModal.prenoms}
                  </h3>
                  <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                    {selectedEmployeeModal.poste}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full">
                    {selectedEmployeeModal.statut || 'Actif'}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEmployeeModal(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-6 space-y-4 text-xs font-medium text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Matricule</span>
                  <span className="text-slate-900 font-bold font-mono">{selectedEmployeeModal.matricule || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Département</span>
                  <span className="text-slate-900 font-bold">{selectedEmployeeModal.departement || 'Général'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Chantier / Site</span>
                  <span className="text-slate-900 font-bold">{selectedEmployeeModal.site || 'Siège'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Type de Contrat</span>
                  <span className="text-slate-900 font-bold">{selectedEmployeeModal.type || 'CDI'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {selectedEmployeeModal.telephone && (
                  <p className="flex items-center gap-2 text-slate-700">
                    <Phone size={14} className="text-[#2563EB]" />
                    <span>{selectedEmployeeModal.telephone}</span>
                  </p>
                )}
                {selectedEmployeeModal.email && (
                  <p className="flex items-center gap-2 text-slate-700">
                    <Mail size={14} className="text-[#2563EB]" />
                    <span>{selectedEmployeeModal.email}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 text-slate-700">
                  <UserCheck size={14} className="text-[#E5A110]" />
                  <span><strong>Responsable N+1 :</strong> {selectedEmployeeModal.responsable || 'Direction Générale'}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEmployeeModal(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organigram;
