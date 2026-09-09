import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { 
  Users, Palmtree, Banknote, UserPlus, TrendingUp, Calendar, Clock, 
  CheckCircle2, AlertCircle, Plus, FileText, AlertOctagon, ArrowRight, 
  ShieldAlert, Award, PieChart, BarChart3, Activity, Layers, MapPin, 
  DollarSign, Briefcase, Filter, ChevronRight, Percent, Zap, Sliders,
  UserCheck, Scale, Target, TrendingDown, RefreshCw, Check, X, ShieldCheck,
  MousePointerClick, Sparkles, ArrowUpRight, Building2, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { calculateDetailedPaie } from '../utils/payrollCalc';
import { getIvorianHoliday } from '../utils/holidays';

const Dashboard = () => {
  const { data, loading, refreshData } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rh'); 
  const [selectedSite, setSelectedSite] = useState('Tous');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedContractType, setSelectedContractType] = useState('all');
  const [salarySimulationIncrease, setSalarySimulationIncrease] = useState(5);

  const [hrStats, setHrStats] = useState(null);
  const [payrollStats, setPayrollStats] = useState(null);
  const [leavesStats, setLeavesStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [recruitmentStats, setRecruitmentStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchDashboards = async () => {
      setLoadingStats(true);
      try {
        const params = {
          department: selectedDept,
          site: selectedSite === 'Tous' ? 'all' : selectedSite,
          contractType: selectedContractType
        };
        const [hrRes, payRes, leaveRes, attRes, recRes] = await Promise.all([
          axios.get('/api/dashboard/hr', { params }),
          axios.get('/api/dashboard/payroll', { params }),
          axios.get('/api/dashboard/leaves', { params }),
          axios.get('/api/dashboard/attendance', { params }),
          axios.get('/api/dashboard/recruitment', { params })
        ]);
        setHrStats(hrRes.data);
        setPayrollStats(payRes.data);
        setLeavesStats(leaveRes.data);
        setAttendanceStats(attRes.data);
        setRecruitmentStats(recRes.data);
      } catch (err) {
        console.error('Error fetching dynamic dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchDashboards();
  }, [selectedDept, selectedSite, selectedContractType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg"></div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Chargement du Tableau de Bord Stratégique...</p>
        </div>
      </div>
    );
  }

  const rawEmployees = data?.employees || [];
  const rawLeaves = data?.leaves || [];
  const rawContracts = data?.contracts || [];
  const applications = data?.applications || [];
  const evaluations = data?.evaluations || [];
  const recruitment = data?.recruitment || [];

  const availableDepts = Array.from(new Set([
    ...(data?.departments || []).map(d => d.nom),
    ...rawEmployees.map(e => e.departement).filter(Boolean)
  ]));

  const employees = rawEmployees.filter(e => {
    const matchesSite = selectedSite === 'Tous' || (e.site || '').toLowerCase().includes(selectedSite.toLowerCase());
    const matchesDept = selectedDept === 'all' || (e.departement || '').toLowerCase() === selectedDept.toLowerCase();
    const matchesContract = selectedContractType === 'all' || (e.type || 'CDI').toLowerCase() === selectedContractType.toLowerCase();
    return matchesSite && matchesDept && matchesContract;
  });

  const activeEmployees = employees.filter(e => e.statut === 'Actif' && !e.is_deleted);
  const inactiveEmployees = employees.filter(e => e.statut !== 'Actif' || e.is_deleted);

  const payrollTotals = activeEmployees.reduce((acc, emp) => {
    const p = calculateDetailedPaie(emp, 0);
    const dgi = p.itsNet + p.taxesPatronalesDetails.itsPatronal + 
                p.taxesPatronalesDetails.taxeApprentissage + 
                p.taxesPatronalesDetails.fdfp;
    const cnps = p.cnpsSalarial + p.cnpsPatronal;

    return {
      net: acc.net + p.netAPayer,
      brut: acc.brut + p.brutTotal,
      dgi: acc.dgi + dgi,
      cnps: acc.cnps + cnps,
      totalCost: acc.totalCost + p.brutTotal + p.cnpsPatronal + p.taxesPatronalesDetails.totalTaxesPatronales
    };
  }, { net: 0, brut: 0, dgi: 0, cnps: 0, totalCost: 0 });

  const avgSalaryBrut = activeEmployees.length > 0 ? payrollTotals.brut / activeEmployees.length : 0;
  const avgSalaryNet = activeEmployees.length > 0 ? payrollTotals.net / activeEmployees.length : 0;

  const femaleEmployees = activeEmployees.filter(e => {
    const s = (e.sexe || '').trim().toUpperCase();
    return s === 'F' || s.startsWith('FEM') || s === 'WOMAN';
  });
  const maleEmployees = activeEmployees.filter(e => {
    const s = (e.sexe || '').trim().toUpperCase();
    return s === 'M' || s === 'H' || s.startsWith('MAS') || s.startsWith('HOM');
  });
  const femaleCount = femaleEmployees.length;
  const maleCount = maleEmployees.length;
  const femalePercentage = activeEmployees.length > 0 ? ((femaleCount / activeEmployees.length) * 100).toFixed(1) : '0.0';

  const femaleAvgSalary = femaleCount > 0 
    ? femaleEmployees.reduce((sum, e) => sum + (e.salaireBase || 0), 0) / femaleCount 
    : 0;
  const maleAvgSalary = maleCount > 0 
    ? maleEmployees.reduce((sum, e) => sum + (e.salaireBase || 0), 0) / maleCount 
    : 0;
  const genderPayGap = maleAvgSalary > 0 
    ? (((maleAvgSalary - femaleAvgSalary) / maleAvgSalary) * 100).toFixed(1) 
    : '0';

  const deptAnalytics = activeEmployees.reduce((acc, emp) => {
    const dept = emp.departement || 'Général';
    if (!acc[dept]) acc[dept] = { count: 0, totalBrut: 0, countFemale: 0 };
    acc[dept].count += 1;
    acc[dept].totalBrut += (emp.salaireBase || 0);
    if ((emp.sexe || '').toLowerCase().startsWith('f')) acc[dept].countFemale += 1;
    return acc;
  }, {});

  const now = new Date();
  const seniorityPyramid = activeEmployees.reduce((acc, emp) => {
    if (!emp.dateEmbauche) {
      acc['< 2 ans'] += 1;
      return acc;
    }
    const emb = new Date(emp.dateEmbauche);
    const years = (now - emb) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 2) acc['< 2 ans'] += 1;
    else if (years < 5) acc['2 - 5 ans'] += 1;
    else if (years < 10) acc['5 - 10 ans'] += 1;
    else acc['> 10 ans'] += 1;
    return acc;
  }, { '< 2 ans': 0, '2 - 5 ans': 0, '5 - 10 ans': 0, '> 10 ans': 0 });

  const contractTypesCount = activeEmployees.reduce((acc, emp) => {
    const type = emp.type || 'CDI';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const turnoverRate = activeEmployees.length > 0 
    ? ((inactiveEmployees.length / activeEmployees.length) * 100).toFixed(1) 
    : '0.0';

  const validNotes = evaluations.map(ev => Number(ev.note)).filter(n => !isNaN(n) && n > 0);
  const avgPerformanceNote = validNotes.length > 0 
    ? (validNotes.reduce((a, b) => a + b, 0) / validNotes.length).toFixed(1) 
    : 'N/A';

  const formatCurrency = (val) => {
    return val >= 1000000
      ? `${(val / 1000000).toFixed(2)}M F`
      : `${new Intl.NumberFormat('fr-FR').format(Math.round(val))} F`;
  };

  const pendingLeaves = rawLeaves.filter(l => l.statut === 'En attente');
  const pendingCertificates = activeEmployees.filter(e => e.attestationTravail || e.attestationStage || e.attestationSalaire);
  const pendingDEs = (data?.disciplinaryActions || []).filter(act => act.statut === 'En attente de réponse');

  const getUpcomingHolidays = () => {
    const list = [];
    const current = new Date();
    for (let i = 0; i < 90; i++) {
      const nextDay = new Date(current);
      nextDay.setDate(current.getDate() + i);
      const holiday = getIvorianHoliday(nextDay);
      if (holiday) {
        const dateKey = nextDay.toISOString().split('T')[0];
        if (!list.some(h => h.dateKey === dateKey)) {
          list.push({
            dateKey,
            dateStr: nextDay.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }),
            label: holiday.label,
            daysRemaining: i
          });
        }
      }
    }
    return list.slice(0, 3);
  };
  const upcomingHolidays = getUpcomingHolidays();

  const expiringContracts = rawContracts.filter(c => {
    if (!c.fin) return false;
    const fin = new Date(c.fin);
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    return fin <= in30Days && c.statut === 'Actif';
  }).slice(0, 3);

  const simulatedPayrollCost = payrollTotals.totalCost * (1 + salarySimulationIncrease / 100);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      {/* ─── Sober Executive Header Banner ─── */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> BDD Connectée & Conforme
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Abidjan • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tableau de Bord RH & Paie
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 font-medium max-w-2xl">
            Supervision décisionnelle des effectifs, de la paie et de la conformité sociale et fiscale DGI & CNPS (Côte d'Ivoire).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/payroll')}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <Banknote size={16} /> Clôture de Paie Mensuelle
          </button>
          <button 
            onClick={() => navigate('/employees')}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <UserPlus size={16} /> Nouveau Salarié
          </button>
        </div>
      </div>

      {/* ─── Dynamic SQL Filters & View Switcher Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400 px-2">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtres :</span>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors">
            <Layers size={14} className="text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase"
            >
              <option value="all">Tous départements</option>
              {availableDepts.map((d, idx) => (
                <option key={idx} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Site Filter */}
          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors">
            <MapPin size={14} className="text-slate-400" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="Tous">Tous les sites</option>
              <option value="Abidjan">Abidjan</option>
              <option value="San-Pédro">San-Pédro</option>
              <option value="Bouaké">Bouaké</option>
              <option value="Yamoussoukro">Yamoussoukro</option>
            </select>
          </div>

          {/* Contract Type Filter */}
          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors">
            <Briefcase size={14} className="text-slate-400" />
            <select
              value={selectedContractType}
              onChange={(e) => setSelectedContractType(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer uppercase"
            >
              <option value="all">Tous contrats</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Consultance">Consultance</option>
            </select>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('rh')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'rh' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users size={14} /> Vue Direction RH
          </button>

          <button
            onClick={() => setActiveTab('data_analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'data_analytics' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={14} /> Data Analyste & Projections
          </button>
        </div>
      </div>

      {/* ─── VUE DIRECTION RH (CLEAN MINIMALIST WHITE CARDS) ─── */}
      {activeTab === 'rh' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Primary Metric Cards Grid — Clean White Minimalist Executive Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Effectifs Actifs Card */}
            <div 
              onClick={() => navigate('/employees')}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
              title="Cliquer pour accéder à la liste des salariés"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors flex items-center gap-1">
                  Accéder <ArrowUpRight size={14} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Effectifs Actifs</p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {hrStats ? hrStats.activeEmployees : activeEmployees.length}
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md font-bold">
                    +{(hrStats ? hrStats.newEmployees : 1)} ce mois
                  </span>
                  <span className="text-slate-400 font-semibold">
                    {hrStats ? hrStats.departures : inactiveEmployees.length} inactifs
                  </span>
                </div>
              </div>
            </div>

            {/* Demandes de Congés Card */}
            <div 
              onClick={() => navigate('/leaves')}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
              title="Cliquer pour gérer les demandes de congés"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Palmtree size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors flex items-center gap-1">
                  Accéder <ArrowUpRight size={14} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Demandes de Congés</p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {leavesStats ? leavesStats.pendingLeaves : pendingLeaves.length}
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md font-bold">
                    En attente RH
                  </span>
                  <span className="text-slate-400 font-semibold">
                    {leavesStats ? leavesStats.consumedDays : 0}j pris
                  </span>
                </div>
              </div>
            </div>

            {/* Masse Salariale Nette Card */}
            <div 
              onClick={() => navigate('/payroll')}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
              title="Cliquer pour accéder à la paie mensuelle"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Banknote size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors flex items-center gap-1">
                  Accéder <ArrowUpRight size={14} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Masse Salariale Nette</p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {formatCurrency(payrollStats ? payrollStats.netAPayer : payrollTotals.net)}
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-bold">
                    Coût Total: {formatCurrency(payrollStats ? payrollStats.coutEmployeurTotal : payrollTotals.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sanctions & Demandes d'Explication Card */}
            <div 
              onClick={() => navigate('/disciplinary')}
              className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
              title="Cliquer pour accéder à la gestion disciplinaire"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertOctagon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors flex items-center gap-1">
                  Accéder <ArrowUpRight size={14} />
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sanctions & D.E.</p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                  {pendingDEs.length}
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span className="text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md font-bold">
                    Réponses sous 48h
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Zap size={18} className="text-emerald-500" /> Actions Rapides RH
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/employees')}
                  className="w-full p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/40 bg-slate-50 hover:bg-white text-left transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Ajouter un salarié</p>
                      <p className="text-[10px] text-slate-400 font-bold">Matricule, poste, contrat et salaire</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/leaves')}
                  className="w-full p-4 rounded-2xl border border-slate-200 hover:border-amber-500/40 bg-slate-50 hover:bg-white text-left transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md">
                      <Palmtree size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Valider un congé</p>
                      <p className="text-[10px] text-slate-400 font-bold">Approuver ou refuser les absences</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
                </button>

                <button
                  onClick={() => navigate('/documents')}
                  className="w-full p-4 rounded-2xl border border-slate-200 hover:border-blue-500/40 bg-slate-50 hover:bg-white text-left transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-md">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">Générer une Attestation</p>
                      <p className="text-[10px] text-slate-400 font-bold">Certificat de travail & attestation salaire</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-[#2563EB]" /> Demandes d'Attestations RH
              </h3>
              {pendingCertificates.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toutes les attestations sont délivrées</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingCertificates.slice(0, 4).map(emp => (
                    <div key={emp.id} className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-slate-800">{emp.nom} {emp.prenoms}</p>
                        <span className="text-[10px] font-bold text-[#2563EB]">
                          {emp.attestationTravail ? 'Attestation de Travail' : emp.attestationSalaire ? 'Attestation de Salaire' : 'Attestation de Stage'}
                        </span>
                      </div>
                      <button onClick={() => navigate('/documents')} className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase shadow-sm">
                        Générer PDF
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Calendar size={18} className="text-amber-500" /> Échéances Contrats & Fériés
              </h3>
              <div className="space-y-3">
                {expiringContracts.length === 0 && upcomingHolidays.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pas encore de données disponibles.</p>
                  </div>
                ) : (
                  <>
                    {expiringContracts.map((c, i) => {
                      const emp = employees.find(e => e.id === c.empId);
                      return (
                        <div key={i} className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-slate-800">{emp ? `${emp.nom} ${emp.prenoms}` : `Employé #${c.empId}`}</p>
                            <span className="text-[10px] font-bold text-amber-700">Fin contrat {c.type} : {c.fin}</span>
                          </div>
                          <button onClick={() => navigate('/contracts')} className="text-xs font-black text-amber-700 hover:underline">
                            Gérer
                          </button>
                        </div>
                      );
                    })}

                    {upcomingHolidays.map((h, i) => (
                      <div key={`h-${i}`} className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-black text-slate-800">{h.label}</p>
                          <span className="text-[10px] font-bold text-blue-700">{h.dateStr}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase">
                          +{h.daysRemaining}j
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'data_analytics' && (
        <div className="space-y-8 animate-fadeIn">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-950 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-5 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salaire Brut Moyen</p>
                <h3 className="text-2xl font-black text-white mt-0.5">{formatCurrency(avgSalaryBrut)}</h3>
                <span className="text-[10px] font-bold text-emerald-400">Net Moyen: {formatCurrency(avgSalaryNet)}</span>
              </div>
            </div>

            <div className="bg-slate-950 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-5 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                <PieChart size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diversité F/M</p>
                <h3 className="text-2xl font-black text-white mt-0.5">{femalePercentage}% <span className="text-xs text-blue-300 font-bold">Femmes</span></h3>
                <span className="text-[10px] font-bold text-slate-400">{femaleCount} F / {maleCount} H</span>
              </div>
            </div>

            <div className="bg-slate-950 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-5 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                <Scale size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Écart Salarial F/H</p>
                <h3 className="text-2xl font-black text-white mt-0.5">{genderPayGap}%</h3>
                <span className="text-[10px] font-bold text-amber-400">Différence Hommes vs Femmes</span>
              </div>
            </div>

            <div className="bg-slate-950 text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-5 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taux de Turnover</p>
                <h3 className="text-2xl font-black text-white mt-0.5">{turnoverRate}%</h3>
                <span className="text-[10px] font-bold text-rose-400">Rotation sur 12 mois</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-100">
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sliders size={20} className="text-emerald-600" />
                  Simulateur Prédictif de Masse Salariale (Budget N+1)
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Ajustez l'hypothèse d'augmentation annuelle pour calculer la projection du coût global du travail.</p>
              </div>

              <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 whitespace-nowrap">Augmentation : +{salarySimulationIncrease}%</span>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="1" 
                  value={salarySimulationIncrease}
                  onChange={(e) => setSalarySimulationIncrease(Number(e.target.value))}
                  className="accent-emerald-600 cursor-pointer w-36"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coût Actuel Mensuel</p>
                <h4 className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(payrollTotals.totalCost)}</h4>
              </div>

              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Coût Projeté (+{salarySimulationIncrease}%)</p>
                <h4 className="text-2xl font-black text-emerald-900 mt-2">{formatCurrency(simulatedPayrollCost)}</h4>
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-800">Impact Budgétaire Annuel</p>
                <h4 className="text-2xl font-black text-blue-900 mt-2">
                  +{formatCurrency((simulatedPayrollCost - payrollTotals.totalCost) * 12)} / an
                </h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Layers size={18} className="text-emerald-600" />
                Masse Salariale & Effectifs par Département
              </h3>
              <div className="space-y-4">
                {Object.keys(deptAnalytics).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-2xl border border-slate-100">
                    Pas encore de données disponibles.
                  </div>
                ) : (
                  Object.entries(deptAnalytics).map(([dept, val]) => {
                    const percent = activeEmployees.length > 0 ? ((val.count / activeEmployees.length) * 100).toFixed(1) : 0;
                    return (
                      <div key={dept} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-white hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-black text-slate-900 truncate">{dept}</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                              {val.count} emp. ({val.countFemale} ♀)
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-900">{formatCurrency(val.totalBrut)}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1.5">({percent}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-[#2563EB]" />
                Pyramide des Tranches d'Ancienneté
              </h3>
              <div className="space-y-4">
                {Object.keys(seniorityPyramid).length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-2xl border border-slate-100">
                    Pas encore de données disponibles.
                  </div>
                ) : (
                  Object.entries(seniorityPyramid).map(([range, count]) => {
                    const percent = activeEmployees.length > 0 ? ((count / activeEmployees.length) * 100).toFixed(1) : 0;
                    return (
                      <div key={range} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-white hover:shadow-md transition-all space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-black text-slate-900">Ancienneté {range}</span>
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-900">{count} salarié{count > 1 ? 's' : ''}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1.5">({percent}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2563EB] rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                Répartition par Nature de Contrat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.keys(contractTypesCount).length === 0 ? (
                  <div className="col-span-3 p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50 rounded-2xl border border-slate-100">
                    Pas encore de données disponibles.
                  </div>
                ) : (
                  Object.entries(contractTypesCount).map(([type, count]) => {
                    const percent = ((count / (activeEmployees.length || 1)) * 100).toFixed(0);
                    return (
                      <div key={type} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{type}</p>
                        <h4 className="text-3xl font-black text-slate-900">{count}</h4>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 inline-block w-fit">
                          {percent}% de l'effectif
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Target size={18} className="text-rose-500" />
                Performance RH & Pipeline Sourcing ATS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-rose-50/60 rounded-2xl border border-rose-200/80 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-800">Note Moyenne</p>
                  <h4 className="text-3xl font-black text-rose-950 mt-1">{avgPerformanceNote} / 5.0</h4>
                  <span className="text-[10px] font-bold text-rose-700">Évaluations Annuelles</span>
                </div>

                <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Offres Ouvertes</p>
                  <h4 className="text-3xl font-black text-emerald-950 mt-1">
                    {recruitmentStats ? recruitmentStats.openJobs : recruitment.filter(r => r.statut === 'Ouvert').length}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700">Recrutements Actifs</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </motion.div>
  );
};

export default Dashboard;
