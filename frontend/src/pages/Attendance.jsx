import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { 
  ExternalLink, Plus, Clock, X, CheckCircle2, Search, Filter, 
  Download, LogIn, LogOut, Smartphone, AlertCircle, Settings, 
  AlertTriangle, DollarSign, Calendar, Zap, UserCheck, ShieldAlert,
  MapPin, Navigation, Users, CheckSquare, Square, Building
} from 'lucide-react';
import axios from 'axios';

const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

const Attendance = () => {
  const { data, loading, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [showChefModal, setShowChefModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('SUMMARY'); // 'SUMMARY' or 'LOGS'

  const [newAttendance, setNewAttendance] = useState({ empId: '', type: 'IN', site: 'Abidjan' });

  // Mobile GPS Geofencing state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null); // { lat, lon, accuracy }
  const [gpsSelectedEmpId, setGpsSelectedEmpId] = useState('');
  const [gpsSelectedProjectId, setGpsSelectedProjectId] = useState('');
  const [gpsType, setGpsType] = useState('IN');
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState('');

  // Chef de chantier bulk check-in state
  const [chefProjectId, setChefProjectId] = useState('');
  const [chefType, setChefType] = useState('IN');
  const [chefDate, setChefDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedChefEmps, setSelectedChefEmps] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Terminal Kiosk state
  const [kioskInput, setKioskInput] = useState('');
  const [kioskFeedback, setKioskFeedback] = useState(null);

  // Shift & Rates Settings State
  const [attSettings, setAttSettings] = useState({
    heure_arrivee_officielle: '08:00',
    heure_depart_officiel: '17:00',
    marge_tolerance_minutes: 15,
    taux_horaire_base: 2500,
    taux_journalier_base: 20000,
    taux_majoration_heures_sup: 25
  });

  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState('');

  // Load attendance settings from backend or context
  useEffect(() => {
    if (data?.attendanceSettings) {
      setAttSettings(prev => ({
        ...prev,
        ...data.attendanceSettings
      }));
    }
  }, [data?.attendanceSettings]);

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted animate-pulse">Chargement des présences...</div>;

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await axios.post('/api/attendance/settings', attSettings);
      setSavingSettings(false);
      setSettingsSavedMessage('Paramètres d\'horaires et taux mis à jour avec succès !');
      setTimeout(() => {
        setSettingsSavedMessage('');
        setShowSettingsModal(false);
      }, 1500);
      refreshData();
    } catch (err) {
      setSavingSettings(false);
      alert(err.response?.data?.error || 'Erreur lors de la sauvegarde des paramètres.');
    }
  };

  const handleCreateAttendance = async (e) => {
    e.preventDefault();
    if (!newAttendance.empId) return alert('Veuillez sélectionner un employé');

    const emp = (data?.employees || []).find(e => e.id.toString() === newAttendance.empId.toString());
    if (!emp) return alert('Employé non trouvé');

    try {
      await axios.post('/api/attendance', {
        empId: emp.id,
        matricule: emp.matricule,
        nom: `${emp.nom} ${emp.prenoms}`,
        type: newAttendance.type,
        timestamp: new Date().toISOString(),
        site: newAttendance.site || emp.site || 'Abidjan'
      });
      alert('Pointage enregistré avec succès');
      setShowModal(false);
      setNewAttendance({ empId: '', type: 'IN', site: 'Abidjan' });
      refreshData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement du pointage');
    }
  };

  const handleKioskPointage = async (actionType) => {
    const val = kioskInput.trim();
    if (!val) return alert('Veuillez saisir votre numéro de matricule (ex: 001 ou 1).');

    let searchMat = val.toUpperCase();
    if (!searchMat.startsWith('EMP-')) {
      const numPart = searchMat.replace(/\D/g, '');
      searchMat = 'EMP-' + numPart.padStart(3, '0');
    }

    const emp = (data?.employees || []).find(e => 
      (e.matricule && e.matricule.toUpperCase() === searchMat) ||
      (e.matricule && e.matricule.toUpperCase().includes(val.toUpperCase())) ||
      (e.id && e.id.toString() === val)
    );

    if (!emp) {
      setKioskFeedback({ type: 'error', message: `Matricule "${val}" inconnu.` });
      setTimeout(() => setKioskFeedback(null), 3500);
      return;
    }

    try {
      await axios.post('/api/attendance', {
        empId: emp.id,
        matricule: emp.matricule,
        nom: `${emp.nom} ${emp.prenoms}`,
        type: actionType,
        timestamp: new Date().toISOString(),
        site: emp.site || 'Abidjan'
      });
      setKioskFeedback({
        type: 'success',
        name: `${emp.nom} ${emp.prenoms}`,
        action: actionType === 'IN' ? 'Entrée enregistrée' : 'Départ enregistré'
      });
      setKioskInput('');
      refreshData();
      setTimeout(() => setKioskFeedback(null), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Erreur lors de l\'enregistrement du pointage.';
      setKioskFeedback({ type: 'error', message: errMsg });
      setTimeout(() => setKioskFeedback(null), 4000);
    }
  };

  // GPS Geofencing Location Trigger
  const handleFetchGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy)
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(`Impossible de récupérer votre position GPS (${err.message}). Veuillez autoriser la localisation.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Submit GPS Pointage
  const handleSubmitGpsPointage = async (e) => {
    e.preventDefault();
    if (!gpsSelectedEmpId) return alert('Veuillez sélectionner un salarié.');
    if (!gpsCoords) return alert('Veuillez activer et récupérer votre position GPS.');

    const emp = (data?.employees || []).find(e => e.id.toString() === gpsSelectedEmpId.toString());
    if (!emp) return alert('Salarié introuvable.');

    const project = (data?.projects || []).find(p => p.id.toString() === gpsSelectedProjectId.toString());

    try {
      await axios.post('/api/attendance', {
        empId: emp.id,
        matricule: emp.matricule,
        nom: `${emp.nom} ${emp.prenoms}`,
        type: gpsType,
        timestamp: new Date().toISOString(),
        site: project ? project.nom : (emp.site || 'Chantier'),
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lon,
        projectId: project ? project.id : null
      });

      setGpsSuccessMsg(`Pointage GPS (${gpsType === 'IN' ? 'Entrée' : 'Sortie'}) validé avec succès pour ${emp.nom} ${emp.prenoms} !`);
      refreshData();
      setTimeout(() => {
        setGpsSuccessMsg('');
        setShowGpsModal(false);
        setGpsSelectedEmpId('');
        setGpsCoords(null);
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement du pointage GPS.');
    }
  };

  // Bulk Attendance Submit (Chef de Chantier)
  const handleBulkAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (selectedChefEmps.length === 0) return alert('Veuillez sélectionner au moins un salarié présent.');
    
    const project = (data?.projects || []).find(p => p.id.toString() === chefProjectId.toString());
    const siteName = project ? project.nom : 'Chantier Général';

    const records = selectedChefEmps.map(empId => {
      const emp = (data?.employees || []).find(e => e.id.toString() === empId.toString());
      return {
        empId: emp.id,
        matricule: emp.matricule,
        nom: `${emp.nom} ${emp.prenoms}`,
        type: chefType,
        timestamp: `${chefDate}T${chefType === 'IN' ? '07:30:00' : '17:00:00'}.000Z`,
        site: siteName,
        projectId: project ? project.id : null
      };
    });

    setBulkSubmitting(true);
    try {
      const res = await axios.post('/api/attendance/bulk', { records });
      setBulkSubmitting(false);
      setBulkSuccessMsg(`${res.data.count || records.length} pointages groupés enregistrés avec succès !`);
      refreshData();
      setTimeout(() => {
        setBulkSuccessMsg('');
        setShowChefModal(false);
        setSelectedChefEmps([]);
      }, 2000);
    } catch (err) {
      setBulkSubmitting(false);
      alert(err.response?.data?.error || 'Erreur lors du pointage groupé.');
    }
  };

  // Convert "HH:mm" to minutes since midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const officialArriveeMin = parseTimeToMinutes(attSettings.heure_arrivee_officielle || '08:00');
  const officialDepartMin = parseTimeToMinutes(attSettings.heure_depart_officiel || '17:00');
  const toleranceMin = parseInt(attSettings.marge_tolerance_minutes || 15, 10);
  const lateThresholdMin = officialArriveeMin + toleranceMin;
  
  // Standard Shift Duration (e.g., 08:00 to 17:00 = 9 hours - 1h break = 8 hours = 480 minutes)
  const totalShiftMin = Math.max(60, officialDepartMin - officialArriveeMin);
  const standardWorkMin = Math.max(60, totalShiftMin - 60); // 8 hours standard work

  const allEmployees = (data?.employees || []).filter(e => e.is_deleted === 0);
  const allAttendance = data?.attendance || [];
  const todayDateStr = new Date().toDateString();

  // Group Attendance Records by Employee and Date
  const attendanceSummaries = [];
  const employeeGroups = {};

  allAttendance.forEach(rec => {
    const dateKey = new Date(rec.timestamp).toDateString();
    const groupKey = `${rec.empId}_${dateKey}`;
    if (!employeeGroups[groupKey]) {
      employeeGroups[groupKey] = {
        empId: rec.empId,
        dateStr: dateKey,
        rawDate: new Date(rec.timestamp),
        inRecords: [],
        outRecords: []
      };
    }
    if (rec.type === 'IN') employeeGroups[groupKey].inRecords.push(rec);
    if (rec.type === 'OUT') employeeGroups[groupKey].outRecords.push(rec);
  });

  Object.values(employeeGroups).forEach(group => {
    const emp = allEmployees.find(e => e.id === group.empId) || {
      id: group.empId,
      nom: group.inRecords[0]?.nom || group.outRecords[0]?.nom || 'Employé',
      prenoms: '',
      matricule: group.inRecords[0]?.matricule || 'EMP-???',
      poste: 'Salarié',
      departement: 'Opérations',
      site: group.inRecords[0]?.site || 'Abidjan'
    };

    // Sort punches chronologically
    group.inRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    group.outRecords.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const firstIn = group.inRecords[0];
    const lastOut = group.outRecords[group.outRecords.length - 1];

    let inTimeFormatted = '-';
    let outTimeFormatted = '-';
    let delayMinutes = 0;
    let isLate = false;
    let earlyMinutes = 0;
    let isEarlyDeparture = false;
    let workedMinutes = 0;
    let overtimeMinutes = 0;
    let basePay = 0;
    let overtimePay = 0;
    let totalPay = 0;

    if (firstIn) {
      const inDate = new Date(firstIn.timestamp);
      inTimeFormatted = inDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const inMinOfDay = inDate.getHours() * 60 + inDate.getMinutes();

      if (inMinOfDay > lateThresholdMin) {
        isLate = true;
        delayMinutes = inMinOfDay - officialArriveeMin;
      }
    }

    if (lastOut) {
      const outDate = new Date(lastOut.timestamp);
      outTimeFormatted = outDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const outMinOfDay = outDate.getHours() * 60 + outDate.getMinutes();

      if (outMinOfDay < officialDepartMin) {
        isEarlyDeparture = true;
        earlyMinutes = officialDepartMin - outMinOfDay;
      }
    }

    if (firstIn && lastOut) {
      const inTimeMs = new Date(firstIn.timestamp).getTime();
      const outTimeMs = new Date(lastOut.timestamp).getTime();
      if (outTimeMs > inTimeMs) {
        workedMinutes = Math.round((outTimeMs - inTimeMs) / 60000);
        overtimeMinutes = Math.max(0, workedMinutes - standardWorkMin);
      }
    }

    // Pay Calculations
    const regularWorkedHours = Math.min(workedMinutes, standardWorkMin) / 60;
    const overtimeHours = overtimeMinutes / 60;

    basePay = regularWorkedHours * (attSettings.taux_horaire_base || 2500);
    const overtimeRate = (attSettings.taux_horaire_base || 2500) * (1 + (attSettings.taux_majoration_heures_sup || 25) / 100);
    overtimePay = overtimeHours * overtimeRate;
    totalPay = basePay + overtimePay;

    attendanceSummaries.push({
      id: `${group.empId}_${group.dateStr}`,
      emp,
      dateStr: group.dateStr,
      isToday: group.dateStr === todayDateStr,
      rawDate: group.rawDate,
      firstIn,
      lastOut,
      inTimeFormatted,
      outTimeFormatted,
      isLate,
      delayMinutes,
      isEarlyDeparture,
      earlyMinutes,
      workedMinutes,
      overtimeMinutes,
      totalPay: Math.round(totalPay),
      site: firstIn?.site || lastOut?.site || emp.site || 'Abidjan'
    });
  });

  // Calculate Today's Real-time KPIs
  const todaySummaries = attendanceSummaries.filter(s => s.isToday);
  const presentTodayCount = todaySummaries.length;
  const lateTodaySummaries = todaySummaries.filter(s => s.isLate);
  const lateTodayCount = lateTodaySummaries.length;
  const totalLateMinutesToday = lateTodaySummaries.reduce((sum, s) => sum + s.delayMinutes, 0);
  const totalOvertimeMinutesToday = todaySummaries.reduce((sum, s) => sum + s.overtimeMinutes, 0);
  const totalPayrollToday = todaySummaries.reduce((sum, s) => sum + s.totalPay, 0);

  // Filter Summaries for Display Table
  const filteredSummaries = attendanceSummaries.filter(s => {
    const matchesSearch = `${s.emp.nom} ${s.emp.prenoms} ${s.emp.matricule}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.site.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSite = siteFilter === 'ALL' || s.site.toLowerCase().includes(siteFilter.toLowerCase());
    let matchesStatus = true;
    if (statusFilter === 'LATE') matchesStatus = s.isLate;
    if (statusFilter === 'EARLY') matchesStatus = s.isEarlyDeparture;
    if (statusFilter === 'OVERTIME') matchesStatus = s.overtimeMinutes > 0;
    if (statusFilter === 'ONTIME') matchesStatus = !s.isLate && s.firstIn;

    return matchesSearch && matchesSite && matchesStatus;
  }).sort((a, b) => b.rawDate - a.rawDate);

  // Export CSV Analysis
  const handleExportCSV = () => {
    const headers = ['Matricule,Employe,Site,Date,Heure_Arrivee,Statut_Arrivee,Retard_Min,Heure_Depart,Statut_Depart,Depart_Precoce_Min,Temps_Travaille,Heures_Sup_Min,Gain_Estime_FCFA'];
    const rows = filteredSummaries.map(s => {
      const arriveeStatut = s.isLate ? `Retard (+${s.delayMinutes}m)` : 'A l\'heure';
      const departStatut = s.isEarlyDeparture ? `Depart Precoce (-${s.earlyMinutes}m)` : (s.lastOut ? 'Sortie Reguliere' : 'En cours');
      const timeWorkedStr = s.workedMinutes > 0 ? `${Math.floor(s.workedMinutes / 60)}h ${s.workedMinutes % 60}m` : '-';
      return `${s.emp.matricule},"${s.emp.nom} ${s.emp.prenoms}","${s.site}","${s.dateStr}","${s.inTimeFormatted}","${arriveeStatut}",${s.delayMinutes},"${s.outTimeFormatted}","${departStatut}",${s.earlyMinutes},"${timeWorkedStr}",${s.overtimeMinutes},${s.totalPay}`;
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analyse_Pointages_SIRH_CIV_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Pointage & Présence" 
        subtitle="Suivi des entrées/sorties, retards, heures sup & rémunération en temps réel"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => {
                setShowGpsModal(true);
                handleFetchGpsLocation();
              }}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
                <MapPin size={15} /> Pointage GPS Mobile
            </button>

            <button 
              onClick={() => setShowChefModal(true)}
              className="bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-800 transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
            >
                <Users size={15} /> Pointage Chef Chantier
            </button>

            <button 
              onClick={() => setShowSettingsModal(true)}
              className="bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md flex items-center gap-2"
            >
                <Settings size={15} /> Paramètres Horaires
            </button>

            <button 
              onClick={() => setShowModal(true)}
              className="bg-ci-green text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-ci-greenDark transition-all shadow-lg shadow-ci-green/20 flex items-center gap-2"
            >
                <Plus size={16} /> Nouveau Pointage
            </button>

            <button 
              onClick={() => setShowKioskModal(true)}
              className="bg-ci-orange text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-ci-orange/20 flex items-center gap-2"
            >
                <Smartphone size={16} /> Terminal Borne
            </button>

            <a 
              href="/terminal" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-950 transition-all shadow-lg flex items-center gap-2"
            >
                <ExternalLink size={14} /> Plein Écran (/terminal)
            </a>
          </div>
        }
      />

      {/* KPI Cards: Shift & Financial Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-ci-green shrink-0">
            <UserCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Présents aujourd'hui</p>
            <h3 className="text-2xl font-black text-ci-text mt-0.5">{presentTodayCount} <span className="text-xs text-ci-muted font-bold">/ {allEmployees.length} Salariés</span></h3>
            <p className="text-[11px] font-semibold text-ci-green mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-ci-green inline-block animate-pulse"></span> {Math.round((presentTodayCount / (allEmployees.length || 1)) * 100)}% de taux de présence
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Retards Détectés</p>
            <h3 className="text-2xl font-black text-rose-600 mt-0.5">{lateTodayCount} <span className="text-xs font-bold text-rose-400">Cas</span></h3>
            <p className="text-[11px] font-bold text-rose-600 mt-1">
              +{totalLateMinutesToday} min de retard cumulées
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Zap size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Heures Sup. Valides</p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">+{Math.floor(totalOvertimeMinutesToday / 60)}h {totalOvertimeMinutesToday % 60}m</h3>
            <p className="text-[11px] font-semibold text-amber-700 mt-1">
              Majoration officicielle (+{attSettings.taux_majoration_heures_sup}%)
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-ci-green shrink-0">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Masse Salariale du Jour</p>
            <h3 className="text-2xl font-black text-ci-green mt-0.5">{totalPayrollToday.toLocaleString('fr-FR')} <span className="text-xs font-bold text-ci-green">FCFA</span></h3>
            <p className="text-[11px] font-semibold text-ci-muted mt-1">
              Calculé à {attSettings.taux_horaire_base} FCFA/h
            </p>
          </div>
        </div>
      </div>

      {/* Official Shift Schedule Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6 border border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-ci-green/20 border border-ci-green/50 rounded-2xl flex items-center justify-center text-ci-green shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-white">Horaires Officiels de Travail & Tolérance</h4>
            <p className="text-xs text-slate-300 font-medium">
              Arrivée : <strong className="text-emerald-400 font-black">{attSettings.heure_arrivee_officielle}</strong> (Marge tolérance +{attSettings.marge_tolerance_minutes}m) &nbsp;•&nbsp; 
              Départ : <strong className="text-orange-400 font-black">{attSettings.heure_depart_officiel}</strong> &nbsp;•&nbsp; 
              Taux Horaire : <strong className="text-emerald-400 font-black">{attSettings.taux_horaire_base} FCFA/h</strong>
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettingsModal(true)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all"
        >
          ⚙️ Modifier les Horaires
        </button>
      </div>

      {/* Main Content Card: Filter & Table */}
      <div className="bg-white rounded-[2.5rem] border border-ci-border shadow-sm overflow-hidden p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ci-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-ci-muted" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher salarié, matricule, site..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-ci-bg rounded-2xl text-xs font-bold text-ci-text outline-none w-72 placeholder:text-ci-muted border border-transparent focus:border-ci-green"
              />
            </div>

            <div className="flex items-center gap-2 bg-ci-bg p-1 rounded-2xl border border-ci-border">
              <Filter size={14} className="text-ci-muted ml-2" />
              <select 
                value={siteFilter}
                onChange={e => setSiteFilter(e.target.value)}
                className="bg-transparent py-2 pr-3 text-xs font-bold text-ci-text outline-none"
              >
                <option value="ALL">Tous les Sites</option>
                <option value="Abidjan">Abidjan Plateau</option>
                <option value="San-Pédro">San-Pédro</option>
                <option value="Bouaké">Bouaké</option>
                <option value="Yamoussoukro">Yamoussoukro</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-ci-bg p-1 rounded-2xl border border-ci-border">
              <select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent py-2 pr-3 text-xs font-bold text-ci-text outline-none"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="LATE">🔴 Retards Détectés</option>
                <option value="EARLY">🟠 Départs Précoces</option>
                <option value="OVERTIME">⚡ Heures Supplémentaires</option>
                <option value="ONTIME">🟢 À l'heure</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="px-4 py-3 bg-ci-bg hover:bg-ci-border rounded-2xl text-xs font-black text-ci-text flex items-center gap-2 transition-all"
            >
              <Download size={14} /> Exporter Rapport CSV
            </button>
          </div>
        </div>

        {/* Attendance Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-ci-border text-[10px] font-black uppercase text-ci-muted tracking-widest bg-ci-bg/50">
                <th className="px-6 py-4 rounded-l-2xl">Salarié</th>
                <th className="px-6 py-4">Pointage Entrée (IN)</th>
                <th className="px-6 py-4">Pointage Sortie (OUT)</th>
                <th className="px-6 py-4">Durée Travaillée</th>
                <th className="px-6 py-4">Heures Sup.</th>
                <th className="px-6 py-4">Gain Estimé</th>
                <th className="px-6 py-4 rounded-r-2xl text-right">Site</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ci-border text-xs">
              {filteredSummaries.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        src={s.emp.photo}
                        nom={s.emp.nom}
                        prenoms={s.emp.prenoms}
                        matricule={s.emp.matricule}
                        size="sm"
                        className="rounded-xl shadow-sm shrink-0"
                      />
                      <div>
                        <h4 className="font-black text-ci-text">{s.emp.nom} {s.emp.prenoms}</h4>
                        <p className="text-[10px] text-ci-muted font-bold uppercase">{s.emp.matricule} • {s.emp.poste || 'Salarié'}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {s.firstIn ? (
                      <div className="space-y-1">
                        <div className="font-black text-ci-text flex items-center gap-1.5">
                          <LogIn size={14} className="text-ci-green" /> {s.inTimeFormatted}
                        </div>
                        {s.isLate ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertCircle size={10} /> Retard (+{s.delayMinutes}m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={10} /> À l'heure
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-ci-muted font-semibold italic">Non renseigné</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {s.lastOut ? (
                      <div className="space-y-1">
                        <div className="font-black text-ci-text flex items-center gap-1.5">
                          <LogOut size={14} className="text-ci-orange" /> {s.outTimeFormatted}
                        </div>
                        {s.isEarlyDeparture ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                            <AlertTriangle size={10} /> Départ Précoce (-{s.earlyMinutes}m)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                            <CheckCircle2 size={10} /> Sortie Régulière
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        En cours de journée
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {s.workedMinutes > 0 ? (
                      <span className="font-black text-ci-text">
                        {Math.floor(s.workedMinutes / 60)}h {s.workedMinutes % 60}m
                      </span>
                    ) : (
                      <span className="text-ci-muted font-bold">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {s.overtimeMinutes > 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
                        <Zap size={12} /> +{Math.floor(s.overtimeMinutes / 60)}h {s.overtimeMinutes % 60}m
                      </span>
                    ) : (
                      <span className="text-ci-muted font-bold text-xs">0h</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-black text-ci-green text-sm">
                      {s.totalPay.toLocaleString('fr-FR')} FCFA
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {s.site}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredSummaries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-ci-muted font-bold italic">
                    Aucun pointage enregistré correspondant aux critères sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal (Paramètres Horaires & Barèmes Taux) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full border border-ci-border shadow-2xl space-y-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-gradient-to-br from-[#009E49] to-[#F77F00] rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-600/20 shrink-0">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900 tracking-wider">Paramètres des Horaires & Barèmes</h3>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Détection automatique retards & calcul salarial</p>
                </div>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {settingsSavedMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={18} /> {settingsSavedMessage}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Section 1: Plannings & Tolérances */}
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Clock size={15} className="text-[#009E49]" /> 1. Plannings Officiels & Tolérance
                  </h4>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white px-2.5 py-1 rounded-md border border-slate-200">Horaire Fixe</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Heure Arrivée Officielle</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        required
                        value={attSettings.heure_arrivee_officielle}
                        onChange={e => setAttSettings({ ...attSettings, heure_arrivee_officielle: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#009E49] shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Heure Départ Officielle</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        required
                        value={attSettings.heure_depart_officiel}
                        onChange={e => setAttSettings({ ...attSettings, heure_depart_officiel: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#F77F00] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Marge de Tolérance au Retard (Minutes)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="0"
                      max="120"
                      value={attSettings.marge_tolerance_minutes}
                      onChange={e => setAttSettings({ ...attSettings, marge_tolerance_minutes: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#009E49] shadow-sm"
                    />
                    <span className="text-xs font-bold text-slate-500 shrink-0">Minutes</span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Tout pointage au-delà de {attSettings.heure_arrivee_officielle || '08:00'} + {attSettings.marge_tolerance_minutes || 15} min est marqué comme Retard.</p>
                </div>
              </div>

              {/* Section 2: Tarification & Majoration */}
              <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <DollarSign size={15} className="text-[#009E49]" /> 2. Barèmes Financiers & Heures Sup.
                  </h4>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md border border-emerald-200">Rémunération</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Taux Horaire Base (FCFA/h)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0"
                        value={attSettings.taux_horaire_base}
                        onChange={e => setAttSettings({ ...attSettings, taux_horaire_base: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-black text-emerald-700 outline-none focus:ring-2 focus:ring-[#009E49] shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Taux Journalier Base (FCFA/J)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0"
                        value={attSettings.taux_journalier_base}
                        onChange={e => setAttSettings({ ...attSettings, taux_journalier_base: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-[#009E49] shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Majoration des Heures Supplémentaires (%)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      min="0"
                      max="200"
                      value={attSettings.taux_majoration_heures_sup}
                      onChange={e => setAttSettings({ ...attSettings, taux_majoration_heures_sup: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs font-black text-amber-700 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                    />
                    <span className="text-xs font-bold text-amber-600 shrink-0">% Majoration</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowSettingsModal(false)} 
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-2xl text-xs font-bold uppercase text-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={savingSettings} 
                  className="px-8 py-3.5 bg-[#009E49] hover:bg-[#008037] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 active:scale-95"
                >
                  {savingSettings ? 'Enregistrement...' : 'Valider les Horaires'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Pointage Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-ci-border shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase text-ci-text tracking-wider">Enregistrer un Pointage</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-ci-muted hover:text-ci-text"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateAttendance} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-ci-muted">Salarié</label>
                <select
                  required
                  value={newAttendance.empId}
                  onChange={e => setNewAttendance({ ...newAttendance, empId: e.target.value })}
                  className="w-full px-5 py-4 bg-ci-bg rounded-2xl text-xs font-bold outline-none"
                >
                  <option value="">Sélectionner un employé</option>
                  {(data?.employees || []).filter(e => e.is_deleted === 0).map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.matricule})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-ci-muted">Type de Pointage</label>
                  <select
                    value={newAttendance.type}
                    onChange={e => setNewAttendance({ ...newAttendance, type: e.target.value })}
                    className="w-full px-5 py-4 bg-ci-bg rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="IN">Entrée (IN)</option>
                    <option value="OUT">Sortie (OUT)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-ci-muted">Site / Localisation</label>
                  <select
                    value={newAttendance.site}
                    onChange={e => setNewAttendance({ ...newAttendance, site: e.target.value })}
                    className="w-full px-5 py-4 bg-ci-bg rounded-2xl text-xs font-bold outline-none"
                  >
                    <option value="Abidjan">Abidjan</option>
                    <option value="San-Pédro">San-Pédro</option>
                    <option value="Bouaké">Bouaké</option>
                    <option value="Yamoussoukro">Yamoussoukro</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-slate-100 rounded-xl text-xs font-bold uppercase text-slate-700">Annuler</button>
                <button type="submit" className="px-6 py-3 bg-ci-green text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-ci-green/20">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminal Kiosk Modal */}
      {showKioskModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-md w-full border border-ci-border space-y-6 relative overflow-hidden animate-fadeIn">
            {kioskFeedback && (
              <div className={`absolute inset-0 z-50 p-8 flex flex-col items-center justify-center text-center space-y-4 rounded-[40px] text-white ${
                kioskFeedback.type === 'success' ? 'bg-ci-green' : 'bg-red-600'
              }`}>
                {kioskFeedback.type === 'success' ? <CheckCircle2 size={60} /> : <AlertCircle size={60} />}
                <h2 className="text-2xl font-black">{kioskFeedback.type === 'success' ? 'POINTAGE VALIDÉ !' : 'ERREUR'}</h2>
                <p className="text-base font-bold">{kioskFeedback.name || kioskFeedback.message}</p>
                {kioskFeedback.action && <span className="px-4 py-1.5 bg-white/20 rounded-full text-xs font-black uppercase">{kioskFeedback.action}</span>}
              </div>
            )}

            <div className="flex items-center justify-between border-b border-ci-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-ci-green to-ci-orange rounded-2xl flex items-center justify-center text-white font-black shadow-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-ci-text">Terminal Borne SIRH-CIV</h3>
                  <p className="text-[10px] text-ci-green font-bold uppercase tracking-widest">Saisie rapide de pointage</p>
                </div>
              </div>
              <button onClick={() => setShowKioskModal(false)} className="text-ci-muted hover:text-ci-text p-2">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-xl font-black text-ci-text uppercase">IDENTIFICATION</h2>
              <p className="text-[10px] font-bold text-ci-muted uppercase tracking-wider">Saisissez votre matricule (ex: 001 ou 002)</p>
              <div className="p-4 bg-ci-bg rounded-3xl">
                <input 
                  type="text" 
                  readOnly 
                  value={kioskInput || '--- --- ---'}
                  className="w-full bg-transparent text-center text-3xl font-black tracking-[0.2em] text-ci-text outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button 
                  key={n}
                  onClick={() => kioskInput.length < 8 && setKioskInput(prev => prev + n)}
                  className="h-14 rounded-2xl bg-ci-bg hover:bg-ci-border text-2xl font-black text-ci-text transition-all active:scale-95 shadow-sm"
                >
                  {n}
                </button>
              ))}
              <button 
                onClick={() => setKioskInput('')}
                className="h-14 rounded-2xl bg-red-50 text-ci-danger font-black text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                EFFACER
              </button>
              <button 
                onClick={() => kioskInput.length < 8 && setKioskInput(prev => prev + '0')}
                className="h-14 rounded-2xl bg-ci-bg hover:bg-ci-border text-2xl font-black text-ci-text transition-all active:scale-95 shadow-sm"
              >
                0
              </button>
              <button 
                onClick={() => setKioskInput(prev => prev.slice(0, -1))}
                className="h-14 rounded-2xl bg-ci-bg text-ci-text flex items-center justify-center transition-all active:scale-95 hover:bg-ci-border shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button 
                onClick={() => handleKioskPointage('IN')}
                className="group flex flex-col items-center gap-2 p-4 bg-white border-2 border-ci-green rounded-3xl hover:bg-ci-green transition-all shadow-lg shadow-ci-green/20 active:scale-95"
              >
                <LogIn size={24} className="text-ci-green group-hover:text-white transition-colors" />
                <span className="font-black text-ci-green group-hover:text-white uppercase tracking-widest text-xs">ARRIVÉE</span>
              </button>

              <button 
                onClick={() => handleKioskPointage('OUT')}
                className="group flex flex-col items-center gap-2 p-4 bg-white border-2 border-ci-orange rounded-3xl hover:bg-ci-orange transition-all shadow-lg shadow-ci-orange/20 active:scale-95"
              >
                <LogOut size={24} className="text-ci-orange group-hover:text-white transition-colors" />
                <span className="font-black text-ci-orange group-hover:text-white uppercase tracking-widest text-xs">DÉPART</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pointage Mobile GPS Geofencing Modal */}
      {showGpsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full border border-ci-border space-y-6 relative overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ci-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/30">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-ci-text">Pointage Mobile GPS (Geofencing)</h3>
                  <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Validation de présence par rayon satellite</p>
                </div>
              </div>
              <button onClick={() => setShowGpsModal(false)} className="text-ci-muted hover:text-ci-text p-2">
                <X size={20} />
              </button>
            </div>

            {gpsSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={18} /> {gpsSuccessMsg}
              </div>
            )}

            {/* GPS Status Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Navigation size={13} className={gpsLoading ? "animate-spin text-blue-500" : "text-blue-600"} />
                  Statut Satellite GPS
                </span>
                <button
                  type="button"
                  onClick={handleFetchGpsLocation}
                  disabled={gpsLoading}
                  className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-wider underline disabled:opacity-50"
                >
                  {gpsLoading ? 'Acquisition...' : 'Rafraîchir position'}
                </button>
              </div>

              {gpsLoading && (
                <div className="text-xs font-bold text-blue-600 flex items-center gap-2 py-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Acquisition des coordonnées satellites en cours...
                </div>
              )}

              {gpsError && (
                <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} /> {gpsError}
                </div>
              )}

              {gpsCoords && !gpsLoading && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">Latitude</span>
                      <strong className="text-slate-800">{gpsCoords.lat.toFixed(6)}</strong>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 block uppercase font-sans font-bold">Longitude</span>
                      <strong className="text-slate-800">{gpsCoords.lon.toFixed(6)}</strong>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between">
                    <span>Précision capteur: ±{gpsCoords.accuracy}m</span>
                    <span className="text-emerald-600 font-black">● Signal GPS Valide</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitGpsPointage} className="space-y-4">
              {/* Chantier Target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-ci-muted">Chantier / Projet BTP Référent</label>
                <select
                  value={gpsSelectedProjectId}
                  onChange={e => setGpsSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-ci-bg border border-ci-border rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">Sélectionner un chantier...</option>
                  {(data?.projects || []).map(p => (
                    <option key={p.id} value={p.id}>{p.nom} ({p.site || p.client}) - Rayon: {p.rayon_geofence || 250}m</option>
                  ))}
                </select>
              </div>

              {/* Geofence Perimeter Feedback */}
              {gpsCoords && gpsSelectedProjectId && (() => {
                const proj = (data?.projects || []).find(p => p.id.toString() === gpsSelectedProjectId.toString());
                if (!proj || !proj.latitude || !proj.longitude) return null;
                const dist = calculateDistanceMeters(gpsCoords.lat, gpsCoords.lon, proj.latitude, proj.longitude);
                const allowedRadius = proj.rayon_geofence || 250;
                const isInside = dist <= allowedRadius;

                return (
                  <div className={`p-3.5 rounded-2xl border text-xs font-bold space-y-1 ${
                    isInside ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex items-center gap-2 font-black">
                      {isInside ? <CheckCircle2 size={16} className="text-emerald-600" /> : <AlertTriangle size={16} className="text-amber-600" />}
                      {isInside ? 'DANS LE PÉRIMÈTRE AUTORISÉ' : 'HORS DU PÉRIMÈTRE THÉORIQUE'}
                    </div>
                    <div className="text-[11px] font-semibold opacity-90">
                      Distance au chantier : <strong className="font-black">{dist} mètres</strong> (Rayon max toléré : {allowedRadius}m)
                    </div>
                  </div>
                );
              })()}

              {/* Salarié */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-ci-muted">Salarié / Ouvrier</label>
                <select
                  required
                  value={gpsSelectedEmpId}
                  onChange={e => setGpsSelectedEmpId(e.target.value)}
                  className="w-full px-4 py-3 bg-ci-bg border border-ci-border rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">Sélectionner un collaborateur</option>
                  {(data?.employees || []).filter(e => e.is_deleted === 0).map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.matricule} - {e.poste})</option>
                  ))}
                </select>
              </div>

              {/* Type IN / OUT */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-ci-muted">Type de Pointage</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGpsType('IN')}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      gpsType === 'IN' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <LogIn size={15} /> Arrivée (IN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGpsType('OUT')}
                    className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      gpsType === 'OUT' ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <LogOut size={15} /> Départ (OUT)
                  </button>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowGpsModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase text-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!gpsCoords || !gpsSelectedEmpId}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all disabled:opacity-40"
                >
                  Enregistrer GPS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pointage Groupé Chantier (Chef de Chantier) */}
      {showChefModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-2xl w-full border border-ci-border space-y-6 relative overflow-hidden animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ci-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-700 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-purple-600/30">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-ci-text">Pointage Chantier Groupé (Chef de Chantier)</h3>
                  <p className="text-[10px] text-purple-700 font-bold uppercase tracking-widest">Saisie rapide d'appel journalier des équipes</p>
                </div>
              </div>
              <button onClick={() => setShowChefModal(false)} className="text-ci-muted hover:text-ci-text p-2">
                <X size={20} />
              </button>
            </div>

            {bulkSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={18} /> {bulkSuccessMsg}
              </div>
            )}

            <form onSubmit={handleBulkAttendanceSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-ci-muted">Chantier / Projet</label>
                  <select
                    value={chefProjectId}
                    onChange={e => setChefProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-ci-bg border border-ci-border rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="">Sélectionner un chantier...</option>
                    {(data?.projects || []).map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-ci-muted">Date du Pointage</label>
                  <input
                    type="date"
                    required
                    value={chefDate}
                    onChange={e => setChefDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-ci-bg border border-ci-border rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-ci-muted">Type d'Événement</label>
                  <select
                    value={chefType}
                    onChange={e => setChefType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-ci-bg border border-ci-border rounded-xl text-xs font-bold outline-none"
                  >
                    <option value="IN">Arrivée Matin (07h30)</option>
                    <option value="OUT">Départ Soir (17h00)</option>
                  </select>
                </div>
              </div>

              {/* Multi-selection of Employees */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                    <CheckSquare size={14} className="text-purple-600" /> Liste des Ouvriers & Salariés
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChefEmps(allEmployees.map(e => e.id))}
                      className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 hover:bg-purple-100"
                    >
                      Tout cocher ({allEmployees.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChefEmps([])}
                      className="text-[10px] font-black text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100"
                    >
                      Décocher
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                  {allEmployees.map(emp => {
                    const isChecked = selectedChefEmps.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedChefEmps(selectedChefEmps.filter(id => id !== emp.id));
                          } else {
                            setSelectedChefEmps([...selectedChefEmps, emp.id]);
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked ? 'bg-purple-50/80 border-purple-300 text-purple-950 font-bold' : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isChecked ? 'bg-purple-700 text-white border-purple-700' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <CheckCircle2 size={14} />}
                          </div>
                          <div>
                            <p className="text-xs font-black">{emp.nom} {emp.prenoms}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{emp.matricule} • {emp.poste || 'Ouvrier'} • {emp.site}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          isChecked ? 'bg-purple-200 text-purple-900' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isChecked ? 'Présent' : 'Non coché'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 text-right text-xs font-black text-purple-800">
                  Total à valider : {selectedChefEmps.length} salarié(s)
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowChefModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase text-slate-700 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={bulkSubmitting || selectedChefEmps.length === 0}
                  className="flex-1 py-3.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40"
                >
                  {bulkSubmitting ? 'Enregistrement groupé...' : `Valider ${selectedChefEmps.length} Pointages`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
