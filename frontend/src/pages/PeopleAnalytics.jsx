import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import { 
  BarChart3, TrendingUp, AlertTriangle, Users, DollarSign, 
  Download, FileSpreadsheet, ShieldAlert, PieChart, Activity,
  ArrowUpRight, Building2, Calendar, FileText, CheckCircle2,
  Filter, RefreshCw, Briefcase, ChevronRight, Layers, HelpCircle
} from 'lucide-react';

const PeopleAnalytics = () => {
  const { data } = useData();
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'absenteeism', 'payroll_bi', 'bank_export'
  const [bankMonth, setBankMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bankExportData, setBankExportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/analytics/kpis');
      setKpis(res.data);
    } catch (err) {
      console.error('Erreur chargement analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  const handleGenerateBankFile = async () => {
    try {
      setExportLoading(true);
      setDownloadSuccess(false);
      const res = await axios.post('/api/analytics/bank-transfer-file', {
        mois: bankMonth,
        format: 'UEMOA_STANDARD'
      });
      setBankExportData(res.data);
    } catch (err) {
      console.error('Erreur génération fichier de virement:', err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!bankExportData?.fileContent) return;
    const blob = new Blob([bankExportData.fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', bankExportData.filename || 'VIREMENT_UEMOA.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(val || 0);
  };

  const employees = data?.employees || [];
  const contracts = data?.contracts || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <BarChart3 size={14} /> Executive HR BI & People Analytics
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Tableau de Bord Stratégique & Décisionnel
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Analyse prédictive du capital humain, indice d'absentéisme de Bradford, simulation de masse salariale et passerelle d'export interbancaire UEMOA / DISA CNPS.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchKpis}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualiser BI
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/70 backdrop-blur border border-indigo-500/30 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Effectif Actif</span>
              <Users size={16} className="text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {kpis?.activeEmployees ?? employees.length} <span className="text-xs font-normal text-slate-400">salariés</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> 100% déclaré & tracé
            </div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur border border-indigo-500/30 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Masse Salariale Brute</span>
              <DollarSign size={16} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">
              {formatCurrency(kpis?.masseSalarialeTotale || 0)}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              Mensuel prévisionnel
            </div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur border border-indigo-500/30 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Bradford Risque Élevé</span>
              <ShieldAlert size={16} className="text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {kpis?.bradfordScores?.filter(b => b.score > 200).length || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              Score B &gt; 200 pts
            </div>
          </div>

          <div className="bg-slate-900/70 backdrop-blur border border-indigo-500/30 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
              <span>Ratio CDI / CDD</span>
              <PieChart size={16} className="text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">
              {kpis?.contractStats?.CDI || 0} / {kpis?.contractStats?.CDD || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold mt-1">
              Stabilité RH
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity size={15} /> Vue Globale & Pyramide des Âges
        </button>
        <button
          onClick={() => setActiveTab('absenteeism')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'absenteeism'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert size={15} /> Indice d'Absentéisme (Bradford)
        </button>
        <button
          onClick={() => setActiveTab('payroll_bi')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'payroll_bi'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign size={15} /> Répartition & Masse Salariale
        </button>
        <button
          onClick={() => setActiveTab('bank_export')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'bank_export'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Download size={15} /> Fichier Virements Bancaires UEMOA
        </button>
      </div>

      {/* TAB 1: OVERVIEW & AGE PYRAMID */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pyramide des Âges */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Users size={18} className="text-blue-600" /> Pyramide des Âges & Mixité Homme / Femme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Répartition démographique de l'effectif pour la gestion prévisionnelle des emplois et compétences (GPEC).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Hommes
                </span>
                <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                  <span className="w-3 h-3 rounded bg-pink-500 inline-block"></span> Femmes
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {kpis?.agePyramid && Object.entries(kpis.agePyramid).map(([range, counts]) => {
                const totalInAge = counts.M + counts.F;
                const maxEmps = Math.max(...Object.values(kpis.agePyramid).map(c => c.M + c.F), 1);
                const widthPercent = (totalInAge / maxEmps) * 100;
                
                return (
                  <div key={range} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{range}</span>
                      <span>{totalInAge} employés ({counts.M}H / {counts.F}F)</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(counts.M / (counts.M + counts.F || 1)) * widthPercent}%` }}
                        className="bg-blue-500 h-full transition-all duration-500"
                        title={`Hommes: ${counts.M}`}
                      />
                      <div 
                        style={{ width: `${(counts.F / (counts.M + counts.F || 1)) * widthPercent}%` }}
                        className="bg-pink-500 h-full transition-all duration-500"
                        title={`Femmes: ${counts.F}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Typologie des Contrats & Répartition */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-amber-500" /> Structure Contractuelle
              </h3>
              
              <div className="space-y-3">
                {kpis?.contractStats && Object.entries(kpis.contractStats).map(([type, count]) => {
                  const total = Object.values(kpis.contractStats).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  const colorClass = type === 'CDI' ? 'bg-emerald-500' : type === 'CDD' ? 'bg-blue-500' : type === 'Stage' ? 'bg-amber-500' : 'bg-purple-500';

                  return (
                    <div key={type} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        <span className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></span>
                          {type}
                        </span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className={`h-full ${colorClass}`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
              <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <HelpCircle size={14} /> Déclaration Annuelle DISA CNPS
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">
                Les effectifs et rémunérations brutes sont prêts pour l'export de l'État 301 et la déclaration DISA annuelle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BRADFORD ABSENTEEISM */}
      {activeTab === 'absenteeism' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600" /> Matrice & Indice de Bradford (Absentéisme BTP)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Formule internationale : <span className="font-mono font-bold text-slate-700 dark:text-slate-300">B = S² × D</span> (où S = nombre d'occurrences d'absences, D = nombre total de jours).
                  Met en évidence la désorganisation causée par les micro-absences répétées sur les chantiers.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                  0-50: Normal
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                  51-200: Modéré
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800">
                  &gt;200: Alerte
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Collaborateur</th>
                    <th className="py-3 px-4">Département</th>
                    <th className="py-3 px-4 text-center">Occurrences (S)</th>
                    <th className="py-3 px-4 text-center">Jours Cumulés (D)</th>
                    <th className="py-3 px-4 text-center">Formule Bradford</th>
                    <th className="py-3 px-4 text-center">Score B</th>
                    <th className="py-3 px-4 text-center">Niveau de Risque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {kpis?.bradfordScores && kpis.bradfordScores.length > 0 ? (
                    kpis.bradfordScores.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{b.nom}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{b.matricule}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{b.departement || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">{b.occurrences} fois</td>
                        <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300">{b.totalJours} j</td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500">{b.occurrences}² × {b.totalJours}</td>
                        <td className="py-3.5 px-4 text-center font-black text-sm">
                          <span className={b.score > 200 ? 'text-rose-600 dark:text-rose-400' : b.score > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {b.score}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            b.risque === 'Élevé'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : b.risque === 'Modéré'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {b.risque === 'Élevé' && <AlertTriangle size={12} />}
                            {b.risque}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-400">
                        Aucune donnée d'absence significative enregistrée pour cette année.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL BI & DEPARTMENTS */}
      {activeTab === 'payroll_bi' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" /> Poids des Départements dans la Masse Salariale
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Consolidation de la charge salariale brute par pôle opérationnel (Chantiers, Bureau d'Études, Administration).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis?.deptStats && Object.entries(kpis.deptStats).map(([dept, data]) => {
                const totalMass = kpis.masseSalarialeTotale || 1;
                const percentage = Math.round((data.masseSalariale / totalMass) * 100);

                return (
                  <div key={dept} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{dept}</h4>
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Effectif rattaché</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{data.count} pers.</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Masse salariale</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(data.masseSalariale)}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                        <div style={{ width: `${percentage}%` }} className="h-full bg-indigo-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BANK EXPORT UEMOA */}
      {activeTab === 'bank_export' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="max-w-2xl">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-emerald-600" /> Générateur de Fichier de Virement Interbancaire UEMOA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conforme aux normes de télétransmission bancaire UEMOA (BCEAO / SICA-UEMOA / SGCI, BICICI, BOA, ECOBANK, NSIA, SIB). Génère instantanément le fichier plat délimité sécurisé contenant les salaires nets et RIBs validés.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mois de Paie Cible</label>
                <input 
                  type="month" 
                  value={bankMonth} 
                  onChange={(e) => setBankMonth(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleGenerateBankFile}
                disabled={exportLoading}
                className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
              >
                <RefreshCw size={14} className={exportLoading ? 'animate-spin' : ''} />
                {exportLoading ? 'Compilation...' : 'Compiler le Fichier UEMOA'}
              </button>
            </div>

            {bankExportData && (
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} /> Fichier UEMOA Prêt pour Télétransmission
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      {bankExportData.totalEmployees} salariés éligibles • Montant total : <span className="font-bold">{formatCurrency(bankExportData.totalAmount)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadFile}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all shrink-0"
                  >
                    <Download size={14} /> Télécharger ({bankExportData.filename})
                  </button>
                </div>

                {downloadSuccess && (
                  <div className="p-3 bg-emerald-500 text-white text-xs font-bold rounded-xl text-center shadow">
                    ✓ Fichier téléchargé avec succès. Vous pouvez l'importer directement dans le portail e-banking de votre banque.
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Aperçu du Flux Bancaire Plat :</div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 max-h-60 custom-scrollbar">
                    {bankExportData.fileContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleAnalytics;
