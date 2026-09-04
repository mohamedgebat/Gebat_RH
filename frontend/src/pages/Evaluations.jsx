import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Star, MessageCircle, Calendar, Plus, X, Award, TrendingUp, 
  Target, CheckCircle2, Users, FileSpreadsheet, ChevronRight,
  Sparkles, Filter, Search, BarChart3, ShieldCheck, UserCheck, Activity
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Evaluations = () => {
  const { data, loading, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [selectedEvalDetail, setSelectedEvalDetail] = useState(null);
  const [activeTab, setActiveTab] = useState('evaluations'); // 'evaluations', 'matrix'
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newEval, setNewEval] = useState({
    empId: '', 
    periode: '2026-S1', 
    competence: 4, 
    rendement: 4, 
    assiduite: 4, 
    comportement: 4, 
    statut: 'Terminée', 
    commentaire: ''
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement du bilan des performances...</p>
      </div>
    );
  }

  const evaluations = data?.evaluations || [];
  const employees = data?.employees || [];

  const getEmp = (id) => employees.find(e => e.id === parseInt(id));
  const getEmpName = (id) => {
    const emp = getEmp(id);
    return emp ? `${emp.nom} ${emp.prenoms}` : 'Collaborateur';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const noteGlobal = (newEval.competence + newEval.rendement + newEval.assiduite + newEval.comportement) / 4;
    try {
      await axios.post('/api/evaluations', { ...newEval, note: noteGlobal });
      setShowModal(false);
      refreshData();
      alert('Évaluation de performance enregistrée avec succès !');
      setNewEval({ empId: '', periode: '2026-S1', competence: 4, rendement: 4, assiduite: 4, comportement: 4, statut: 'Terminée', commentaire: '' });
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de l\'évaluation.');
    }
  };

  // Calculations for Metrics
  const totalEvals = evaluations.length;
  const avgScore = totalEvals > 0 ? (evaluations.reduce((acc, curr) => acc + (curr.note || 0), 0) / totalEvals).toFixed(1) : '4.2';
  const topPerformersCount = evaluations.filter(e => (e.note || 0) >= 4.2).length;
  const completionRate = totalEvals > 0 ? Math.round((evaluations.filter(e => e.statut === 'Terminée').length / totalEvals) * 100) : 92;

  // Filtered Evaluations List
  const filteredEvaluations = evaluations.filter(ev => {
    const emp = getEmp(ev.empId);
    const empName = emp ? `${emp.nom} ${emp.prenoms}`.toLowerCase() : '';
    const dept = emp ? (emp.departement || '') : '';
    const matchSearch = empName.includes(searchTerm.toLowerCase()) || (ev.commentaire || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = selectedDept === 'all' || dept === selectedDept;
    const matchPeriod = selectedPeriod === 'all' || ev.periode === selectedPeriod;
    return matchSearch && matchDept && matchPeriod;
  });

  const departments = [...new Set(employees.map(e => e.departement).filter(Boolean))];
  const periods = [...new Set(evaluations.map(e => e.periode).filter(Boolean))];

  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 pb-12">
      
      {/* ── Executive Header Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Award size={13} className="text-emerald-600" /> Bilan de Performance & Compétences 360°
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Évaluations & Performances RH
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl">
            Pilotez les entretiens annuels, la grille de compétences, le taux d'atteinte des objectifs et la cartographie des talents de l'entreprise.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={() => setShowModal(true)} 
            className="px-5 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
          >
            <Plus size={16} /> Nouvelle Évaluation 360°
          </button>
        </div>
      </div>

      {/* ── Metric KPI Cards Bar (Clean White Minimalist Layout) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Score Moyen Globale */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note Moyenne Globale</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Star size={20} fill="currentColor" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{avgScore}</span>
            <span className="text-xs font-bold text-slate-400">/ 5.0</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md">
            <TrendingUp size={12} /> +0.3 pt vs campagne précédente
          </span>
        </div>

        {/* Card 2: Réalisation des Objectifs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atteinte des KPI</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">89.4 %</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md">
            Target RH : 85.0%
          </span>
        </div>

        {/* Card 3: Entretiens Validés RH */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taux de Concrétisation</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{completionRate}%</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-md">
            {totalEvals} Évaluations comptabilisées
          </span>
        </div>

        {/* Card 4: Top Performers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Talents "Haut Potentiel"</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{topPerformersCount}</span>
            <span className="text-xs font-bold text-slate-400">Collaborateurs</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black rounded-md">
            Score ≥ 4.2 / 5.0
          </span>
        </div>

      </div>

      {/* ── Sub-Navigation Tabs & Controls Bar ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'evaluations'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity size={15} /> Évaluations Collaborateurs
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 size={15} /> Matrice des Talents (9-Box)
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Rechercher collaborateur, note..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all"
            />
          </div>

          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer uppercase"
          >
            <option value="all">Département (Tous)</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer uppercase"
          >
            <option value="all">Campagne (Toutes)</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Main Tab Content ── */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <UserCheck size={18} className="text-emerald-600" /> Fiches d'Évaluation Individuelles ({filteredEvaluations.length})
            </h3>
          </div>

          {filteredEvaluations.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <Award size={40} className="mx-auto text-slate-300" />
              <p className="font-black text-slate-500 text-xs uppercase tracking-widest">Aucune évaluation enregistrée pour ces filtres</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvaluations.map((ev) => {
                const emp = getEmp(ev.empId);
                const globalScore = ev.note || ((ev.competence + ev.rendement + ev.assiduite + ev.comportement) / 4);

                return (
                  <motion.div
                    key={ev.id}
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      
                      {/* Card Top Row: Employee Name & Period */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-md">
                            {emp ? `${emp.nom?.[0] || ''}${emp.prenoms?.[0] || ''}` : 'RH'}
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-900 leading-snug">{getEmpName(ev.empId)}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {emp?.poste || 'Collaborateur'} • {emp?.departement || 'Direction'}
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                          {ev.periode}
                        </span>
                      </div>

                      {/* Global Rating Score Highlight */}
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score Global Attribué</p>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-2xl font-black text-slate-900">{globalScore.toFixed(1)}</span>
                            <span className="text-xs font-bold text-slate-400">/ 5.0</span>
                          </div>
                        </div>

                        <div className="flex gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              fill={star <= Math.round(globalScore) ? "currentColor" : "none"}
                              className={star <= Math.round(globalScore) ? "text-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Multi-Criteria Score Progress Bars */}
                      <div className="space-y-2.5 text-xs font-bold">
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase text-slate-500">
                            <span>Compétences Techniques</span>
                            <span className="text-slate-900 font-extrabold">{ev.competence}/5</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(ev.competence / 5) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase text-slate-500">
                            <span>Rendement & RSE</span>
                            <span className="text-slate-900 font-extrabold">{ev.rendement}/5</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(ev.rendement / 5) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase text-slate-500">
                            <span>Assiduité & Rigueur</span>
                            <span className="text-slate-900 font-extrabold">{ev.assiduite}/5</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(ev.assiduite / 5) * 100}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase text-slate-500">
                            <span>Comportement & Leadership</span>
                            <span className="text-slate-900 font-extrabold">{ev.comportement}/5</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(ev.comportement / 5) * 100}%` }}></div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Card Footer: Status & Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        ev.statut === 'Terminée' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {ev.statut}
                      </span>

                      <button
                        onClick={() => setSelectedEvalDetail(ev)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <MessageCircle size={14} /> Commentaire RH
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Matrice 9-Box des Talents ── */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Cartographie des Talents — Matrice 9-Box RH</h3>
            <p className="text-xs text-slate-500 font-medium">Répartition stratégique des collaborateurs selon la performance et le potentiel d'évolution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-6 bg-purple-50 border border-purple-100 rounded-2xl space-y-2">
              <span className="px-2.5 py-0.5 bg-purple-200 text-purple-800 rounded-md text-[9px] font-black uppercase tracking-widest">Top Performers (High Potential)</span>
              <p className="text-2xl font-black text-slate-900">{topPerformersCount} Collaborateurs</p>
              <p className="text-xs text-slate-600 font-medium">Profils éligibles aux promotions stratégiques et plans de succession.</p>
            </div>

            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2">
              <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-800 rounded-md text-[9px] font-black uppercase tracking-widest">Contributeurs Solides</span>
              <p className="text-2xl font-black text-slate-900">{evaluations.filter(e => (e.note || 0) >= 3.5 && (e.note || 0) < 4.2).length} Collaborateurs</p>
              <p className="text-xs text-slate-600 font-medium">Performances constantes et maîtrise optimale du poste.</p>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
              <span className="px-2.5 py-0.5 bg-amber-200 text-amber-800 rounded-md text-[9px] font-black uppercase tracking-widest">Accompagnement & Coaching</span>
              <p className="text-2xl font-black text-slate-900">{evaluations.filter(e => (e.note || 0) < 3.5).length} Collaborateurs</p>
              <p className="text-xs text-slate-600 font-medium">Plan d'action personnalisé et renforcement des compétences requises.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Nouvelle Évaluation 360° ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto"
            >
              <div className="flex justify-between items-center px-8 py-6 bg-slate-900 text-white">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Nouvelle Évaluation de Performance</h3>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">Campagne d'Évaluation 360°</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-8 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Collaborateur Évalué *</label>
                    <select
                      required
                      value={newEval.empId}
                      onChange={e => setNewEval({ ...newEval, empId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="">Sélectionner un collaborateur...</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.departement})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Campagne / Période *</label>
                    <select
                      value={newEval.periode}
                      onChange={e => setNewEval({ ...newEval, periode: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none uppercase"
                    >
                      <option value="2026-S1">2026 - Semestre 1</option>
                      <option value="2025-S2">2025 - Semestre 2</option>
                      <option value="2025-Annuel">2025 - Bilan Annuel</option>
                    </select>
                  </div>
                </div>

                {/* Score Input Sliders */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Évaluation des 4 Piliers (Note de 1 à 5)</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">1. Compétences Techniques ({newEval.competence}/5)</label>
                      <input 
                        type="range" min="1" max="5" step="1" 
                        value={newEval.competence} 
                        onChange={e => setNewEval({ ...newEval, competence: parseInt(e.target.value) })}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">2. Rendement & KPI ({newEval.rendement}/5)</label>
                      <input 
                        type="range" min="1" max="5" step="1" 
                        value={newEval.rendement} 
                        onChange={e => setNewEval({ ...newEval, rendement: parseInt(e.target.value) })}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">3. Assiduité & Rigueur ({newEval.assiduite}/5)</label>
                      <input 
                        type="range" min="1" max="5" step="1" 
                        value={newEval.assiduite} 
                        onChange={e => setNewEval({ ...newEval, assiduite: parseInt(e.target.value) })}
                        className="w-full accent-amber-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">4. Leadership & Esprit ({newEval.comportement}/5)</label>
                      <input 
                        type="range" min="1" max="5" step="1" 
                        value={newEval.comportement} 
                        onChange={e => setNewEval({ ...newEval, comportement: parseInt(e.target.value) })}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Commentaire Stratégique RH</label>
                  <textarea 
                    rows="3" 
                    value={newEval.commentaire} 
                    onChange={e => setNewEval({ ...newEval, commentaire: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 resize-none"
                    placeholder="Synthèse des points forts, axes d'amélioration et plan de formation recommandé..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Enregistrer l'évaluation RH <CheckCircle2 size={16} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Consultation Commentaire RH ── */}
      <AnimatePresence>
        {selectedEvalDetail && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedEvalDetail(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl border border-slate-200 space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{getEmpName(selectedEvalDetail.empId)}</h3>
                  <p className="text-xs text-slate-500 font-bold">Évaluation {selectedEvalDetail.periode}</p>
                </div>
                <button onClick={() => setSelectedEvalDetail(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commentaire & Recommandations RH</span>
                <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                  "{selectedEvalDetail.commentaire || "Aucun commentaire rédigé pour cette évaluation."}"
                </p>
              </div>

              <button
                onClick={() => setSelectedEvalDetail(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Evaluations;
