import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { 
  Briefcase, Users, XCircle, Plus, Search, Filter, ArrowUpRight, 
  CheckCircle2, Trash2, X, BrainCircuit, Target, SlidersHorizontal, 
  Trophy, AlertTriangle, UserCheck, Mail, Phone, Calendar, Building,
  Award, FileText, Sparkles, UserPlus, Send, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const PROFILE_KEYWORDS = {
  'Comptabilité': ['comptable', 'comptabilite', 'finance', 'paie', 'fiscal', 'audit', 'facture', 'tresorerie', 'sage', 'excel', 'bilan'],
  'Sécurité': ['securite', 'agent', 'surveillance', 'gardiennage', 'controle', 'incendie', 'secourisme', 'discipline', 'ronde'],
  'BTP': ['btp', 'chantier', 'chef', 'construction', 'travaux', 'maconnerie', 'plans', 'equipe', 'ouvrage', 'genie civil'],
  'Pédagogie': ['professeur', 'enseignement', 'pedagogie', 'classe', 'francais', 'eleves', 'formation', 'education', 'programme'],
  'Direction': ['direction', 'assistant', 'secretariat', 'administration', 'coordination', 'planning', 'reporting', 'organisation'],
  default: ['experience', 'competence', 'formation', 'certification', 'motivation', 'responsable', 'equipe']
};

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const unique = (items) => [...new Set(items.filter(Boolean))];

const tokenizeCriteria = (value = '') =>
  unique(
    normalizeText(value)
      .split(/[\s,;./|()\n\r-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3)
  );

const extractYears = (value = '') => {
  const text = normalizeText(value);
  const wordToNum = {
    'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
    'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10, 'onze': 11,
    'douze': 12, 'quinze': 15, 'vingt': 20
  };
  
  let maxYears = 0;
  const regex = /(?:(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt)\s*(?:a|-|au moins|minimum)?\s*)?(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze|vingt)\s*(ans?|annees?|years?|mois)/g;
  
  const matches = [...text.matchAll(regex)];
  
  for (const match of matches) {
    let numStr = match[2];
    let unit = match[3];
    let num = parseInt(numStr, 10);
    
    if (isNaN(num)) {
      num = wordToNum[numStr] || 0;
    }
    
    if (unit === 'mois') {
      num = num / 12;
    }
    
    if (num > maxYears) {
      maxYears = num;
    }
  }
  return maxYears;
};

const getOfferForApp = (app, offers) => offers.find((offer) => Number(offer.id) === Number(app.offerId));

const buildAtsProfile = (app, offer) => {
  const targetText = normalizeText(`${offer?.poste || ''} ${offer?.departement || ''} ${offer?.competences || ''} ${offer?.experience || ''} ${offer?.criteres || ''} ${offer?.mots_cles || ''}`);
  const candidateText = normalizeText(`${app.motivation || ''} ${app.nom || ''} ${app.prenoms || ''} ${app.email || ''}`);
  
  const posteKeywords = unique((targetText.match(/[a-z0-9]{4,}/g) || []).slice(0, 8));
  const sectorKeywords = PROFILE_KEYWORDS[offer?.departement] || PROFILE_KEYWORDS.default;
  const skillKeywords = tokenizeCriteria(offer?.competences || '');
  const criteriaKeywords = tokenizeCriteria(offer?.criteres || '');
  const requiredAtsKeywords = tokenizeCriteria(offer?.mots_cles || '');
  
  const requiredYears = extractYears(offer?.experience || '');
  const candidateYears = extractYears(app.motivation || '');

  const matchKeyword = (kw) => {
    if (!kw || kw.trim().length === 0) return false;
    const cleanKw = normalizeText(kw.trim());
    try {
      return new RegExp(`(?:^|[\\s,;./|()\\[\\]\\-_:!?'"])${cleanKw}(?:$|[\\s,;./|()\\[\\]\\-_:!?'"])`, 'i').test(candidateText) || candidateText.includes(cleanKw);
    } catch {
      return candidateText.includes(cleanKw);
    }
  };
  
  const matchedPoste = posteKeywords.filter(matchKeyword);
  const matchedSector = sectorKeywords.filter(matchKeyword);
  const matchedSkills = skillKeywords.filter(matchKeyword);
  const missingSkills = skillKeywords.filter(k => !matchedSkills.includes(k));
  const matchedCriteria = criteriaKeywords.filter(matchKeyword);
  const matchedAtsKeywords = requiredAtsKeywords.filter(matchKeyword);
  const missingAtsKeywords = requiredAtsKeywords.filter(k => !matchedAtsKeywords.includes(k));
  
  const motivationLength = normalizeText(app.motivation || '').length;
  const hasCv = Boolean(app.cv);
  const hasLm = Boolean(app.lm);
  const hasContact = Boolean(app.email && app.telephone);
  
  // 1. Mots-clés requis (40 pts max)
  let atsScore = 0;
  if (requiredAtsKeywords.length > 0) {
    atsScore = (matchedAtsKeywords.length / requiredAtsKeywords.length) * 40;
  } else if (matchedPoste.length > 0) {
    atsScore = Math.min(25, matchedPoste.length * 8);
  } else {
    atsScore = 15;
  }

  // 2. Compétences clés (25 pts max)
  let skillsScore = 0;
  if (skillKeywords.length > 0) {
    skillsScore = (matchedSkills.length / skillKeywords.length) * 25;
  } else {
    skillsScore = matchedSector.length > 0 ? 15 : 10;
  }

  // 3. Expérience (20 pts max)
  let experienceScore = 0;
  if (requiredYears > 0) {
    if (candidateYears >= requiredYears) experienceScore = 20;
    else if (candidateYears > 0) experienceScore = Math.round((candidateYears / requiredYears) * 15);
    else experienceScore = 0;
  } else {
    experienceScore = candidateYears > 0 ? 15 : 10;
  }
  
  // 4. Critères bonus (10 pts max)
  let criteriaScore = 0;
  if (criteriaKeywords.length > 0) {
    criteriaScore = (matchedCriteria.length / criteriaKeywords.length) * 10;
  } else {
    criteriaScore = 5;
  }

  // 5. Complétude du dossier (15 pts max)
  const dossierScore = (hasContact ? 5 : 0) + (hasCv ? 5 : 0) + (hasLm ? 2 : 0) + (motivationLength > 50 ? 3 : 0);
  
  const rawScore = atsScore + skillsScore + experienceScore + criteriaScore + dossierScore;
  const cappedScore = Math.min(100, Math.max(5, Math.round(rawScore)));
  const level = cappedScore >= 75 ? 'best' : cappedScore >= 50 ? 'medium' : 'low';
  const label = cappedScore >= 75 ? 'Top Profil' : cappedScore >= 50 ? 'Profil Moyen' : 'À Compléter';
  const color = cappedScore >= 75 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : cappedScore >= 50 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-600 bg-rose-50 border-rose-200';

  const strengths = [
    hasCv && 'CV transmis',
    hasContact && 'Coordonnées complètes',
    requiredAtsKeywords.length > 0 && matchedAtsKeywords.length > 0 && `Mots-clés: ${matchedAtsKeywords.length}/${requiredAtsKeywords.length} (${matchedAtsKeywords.slice(0, 3).join(', ')})`,
    matchedSkills.length > 0 && `Compétences: ${matchedSkills.slice(0, 3).join(', ')}`,
    candidateYears > 0 && (requiredYears > 0 && candidateYears >= requiredYears ? `${candidateYears} ans exp. requise validée` : `${candidateYears} an(s) d'expérience`),
    matchedCriteria.length > 0 && `Bonus: ${matchedCriteria.slice(0, 2).join(', ')}`,
    matchedPoste.length > 0 && `Adéquation poste`
  ].filter(Boolean);

  const gaps = [
    !hasCv && 'CV non fourni',
    !hasContact && 'Téléphone ou email manquant',
    requiredAtsKeywords.length > 0 && missingAtsKeywords.length > 0 && `Mots-clés manquants (${missingAtsKeywords.slice(0, 3).join(', ')})`,
    skillKeywords.length > 0 && missingSkills.length > 0 && `Compétences manquantes: ${missingSkills.slice(0, 3).join(', ')}`,
    requiredYears > 0 && candidateYears < requiredYears && `Expérience: ${candidateYears || 0}/${requiredYears} ans exigés`
  ].filter(Boolean);

  return { 
    score: cappedScore, 
    level, 
    label, 
    color, 
    strengths, 
    gaps, 
    matchedPoste, 
    matchedSector, 
    matchedSkills, 
    missingSkills,
    matchedCriteria, 
    matchedAtsKeywords, 
    missingAtsKeywords,
    requiredYears, 
    candidateYears 
  };
};

const STAGE_COLORS = {
  'Nouveau': 'bg-blue-50/50 text-blue-700 border-blue-200/60',
  'En étude': 'bg-violet-50/50 text-violet-700 border-violet-200/60',
  'Entretien': 'bg-amber-50/50 text-amber-700 border-amber-200/60',
  'Retenu': 'bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-sm shadow-emerald-100',
  'Rejeté': 'bg-rose-50 text-rose-600 border-rose-200'
};

const ProgressCircle = ({ score }) => {
  const strokeWidth = 8;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colorClass = score >= 75 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-400';

  return (
    <div className="relative flex items-center justify-center w-14 h-14">
      <svg className="transform -rotate-90 w-14 h-14">
        <circle cx="28" cy="28" r={radius} className="stroke-slate-100 fill-none" strokeWidth={strokeWidth} />
        <motion.circle
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          cx="28"
          cy="28"
          r={radius}
          className={`fill-none ${colorClass}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[10px] font-black ${colorClass}`}>{score}</span>
      </div>
    </div>
  );
};

const Recruitment = () => {
  const { data, loading, refreshData } = useData();
  const [view, setView] = useState('offers');
  const [showModal, setShowModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  
  const emptyOffer = { poste: '', departement: 'Direction', site: 'abidjan', type: 'CDI', competences: '', experience: '', criteres: '', mots_cles: '', dateFin: '' };
  const [newOffer, setNewOffer] = useState(emptyOffer);

  const emptyCandidate = { offerId: '', nom: '', prenoms: '', email: '', telephone: '', motivation: '', statut: 'Nouveau', cv: '', lm: '' };
  const [newCandidate, setNewCandidate] = useState(emptyCandidate);

  const [searchTerm, setSearchTerm] = useState('');
  const [offerSearchTerm, setOfferSearchTerm] = useState('');
  const [selectedOfferFilter, setSelectedOfferFilter] = useState('all');
  const [atsLevelFilter, setAtsLevelFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("Fichier trop lourd. Maximum 2MB.");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCandidate(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const openBase64InNewTab = (base64Data) => {
    if (!base64Data) return;
    if (!base64Data.startsWith('data:')) {
      window.open(base64Data, '_blank');
      return;
    }
    
    try {
      const arr = base64Data.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      showToast("Erreur lors de l'ouverture du document.");
      console.error(e);
    }
  };

  const scoredApplications = useMemo(() => {
    return (data.applications || [])
      .map((app) => {
        const offer = getOfferForApp(app, data.recruitment || []);
        return { ...app, offer, ats: buildAtsProfile(app, offer) };
      })
      .sort((a, b) => b.ats.score - a.ats.score || new Date(b.date) - new Date(a.date));
  }, [data.applications, data.recruitment]);

  const filteredApplications = scoredApplications.filter((app) => {
    const haystack = normalizeText(`${app.nom} ${app.prenoms} ${app.email} ${app.offer?.poste || ''} ${app.motivation || ''}`);
    const matchesSearch = haystack.includes(normalizeText(searchTerm));
    const matchesOffer = selectedOfferFilter === 'all' || Number(app.offerId) === Number(selectedOfferFilter);
    const matchesLevel = atsLevelFilter === 'all' || app.ats.level === atsLevelFilter;
    const matchesStage = stageFilter === 'all' || (app.statut || 'Nouveau') === stageFilter;
    return matchesSearch && matchesOffer && matchesLevel && matchesStage;
  });

  const filteredOffers = (data.recruitment || []).filter((offer) => {
    const haystack = normalizeText(`${offer.poste} ${offer.departement} ${offer.site} ${offer.type}`);
    return haystack.includes(normalizeText(offerSearchTerm));
  });

  const stats = useMemo(() => {
    const offers = data.recruitment || [];
    const apps = data.applications || [];
    const activeOffers = offers.filter((r) => r.statut === 'Ouvert').length;
    const closedOffers = offers.filter((r) => r.statut === 'Clôturé').length;
    const totalApps = apps.length;
    const retainedApps = apps.filter((a) => a.statut === 'Retenu').length;
    const avgAts = scoredApplications.length
      ? Math.round(scoredApplications.reduce((sum, app) => sum + app.ats.score, 0) / scoredApplications.length)
      : 0;

    return { activeOffers, closedOffers, totalApps, retainedApps, avgAts };
  }, [data.recruitment, data.applications, scoredApplications]);

  const atsStats = {
    best: scoredApplications.filter((app) => app.ats.level === 'best').length,
    medium: scoredApplications.filter((app) => app.ats.level === 'medium').length,
    low: scoredApplications.filter((app) => app.ats.level === 'low').length,
  };

  if (loading) return <div className="p-10 text-center uppercase font-black tracking-widest text-slate-400 animate-pulse">Initialisation du module Recrutement...</div>;

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/recruitment', newOffer);
      setShowModal(false);
      refreshData();
      setNewOffer(emptyOffer);
      showToast('Offre publiée avec succès !');
    } catch (err) {
      showToast('Erreur lors de la publication');
    }
  };

  const handleAddCandidateManual = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/applications', {
        ...newCandidate,
        date: new Date().toISOString().split('T')[0]
      });
      setShowCandidateModal(false);
      refreshData();
      setNewCandidate(emptyCandidate);
      showToast('Candidature ajoutée avec succès !');
    } catch (err) {
      showToast('Erreur lors de l\'ajout de la candidature');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (window.confirm('Supprimer cette offre ?')) {
      try {
        await axios.delete(`/api/recruitment/${id}`);
        refreshData();
        showToast('Offre supprimée');
      } catch (err) {
        showToast('Erreur lors de la suppression');
      }
    }
  };

  const handleUpdateOfferStatus = async (id, status) => {
    try {
      await axios.patch(`/api/recruitment/${id}`, { statut: status });
      refreshData();
      showToast('Statut de l\'offre mis à jour');
    } catch (err) {
      showToast('Erreur lors de la mise à jour');
    }
  };

  const handleUpdateAppStatus = async (id, status) => {
    try {
      await axios.patch(`/api/applications/${id}`, { statut: status });
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp((prev) => ({ ...prev, statut: status }));
      }
      refreshData();
    } catch (err) {
      showToast('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteApplication = async (id) => {
    if (window.confirm('Supprimer cette candidature ?')) {
      try {
        await axios.delete(`/api/applications/${id}`);
        if (selectedApp?.id === id) setSelectedApp(null);
        refreshData();
        showToast('Candidature supprimée');
      } catch (err) {
        showToast('Erreur lors de la suppression');
      }
    }
  };

  const handleConvertToEmployee = async (app) => {
    if (window.confirm(`Convertir le candidat ${app.nom} ${app.prenoms} en Employé actif ?`)) {
      try {
        const nextMatricule = `EMP${String(Math.floor(100 + Math.random() * 900))}`;
        await axios.post('/api/employees', {
          matricule: nextMatricule,
          nom: app.nom,
          prenoms: app.prenoms,
          poste: app.offer?.poste || 'Nouvelle Recrue',
          departement: app.offer?.departement || 'Direction',
          site: app.offer?.site || 'Abidjan',
          type: app.offer?.type || 'CDI',
          dateEmbauche: new Date().toISOString().split('T')[0],
          salaireBase: 150000,
          sexe: 'M',
          telephone: app.telephone || '',
          email: app.email,
          statut: 'Actif',
          compteActif: 1
        });
        
        await handleUpdateAppStatus(app.id, 'Retenu');
        showToast(`${app.nom} a été embauché ! Matricule: ${nextMatricule}`);
      } catch (err) {
        alert(err.response?.data?.error || 'Erreur lors de la conversion en employé');
      }
    }
  };

  return (
    <div className="animate-fadeIn space-y-8 pb-12 relative min-h-screen">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-slate-800/95 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 font-bold text-sm flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader 
        title="Talent Acquisition" 
        subtitle="Gestion Premium des offres, scoring ATS et pipeline de recrutement"
        actions={
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/60 backdrop-blur-md p-1 rounded-2xl border border-slate-200/60 flex shadow-sm">
              <button 
                onClick={() => setView('offers')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center gap-2 ${view === 'offers' ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
              >
                <Briefcase size={14} /> Offres ({data.recruitment?.length || 0})
              </button>
              <button 
                onClick={() => setView('applications')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all duration-300 flex items-center gap-2 ${view === 'applications' ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
              >
                <Users size={14} /> Candidats ({data.applications?.length || 0})
              </button>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCandidateModal(true)} 
              className="bg-white/80 backdrop-blur text-slate-700 border border-slate-200/60 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
            >
              <UserPlus size={14} className="text-emerald-500" /> Ajout Candidat
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Plus size={14} /> Publier une Offre
            </motion.button>
          </div>
        }
      />

      {/* 4 Metric Cards - Glassmorphism & Gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Offres Ouvertes', value: stats.activeOffers, sub: `/ ${data.recruitment?.length || 0}`, icon: <Briefcase size={22} />, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
          { label: 'Candidatures Reçues', value: stats.totalApps, icon: <Users size={22} />, color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Score ATS Moyen', value: `${stats.avgAts}%`, icon: <BrainCircuit size={22} />, color: 'from-violet-400 to-fuchsia-500', bg: 'bg-violet-50', text: 'text-violet-600' },
          { label: 'Recrutés / Retenus', value: stats.retainedApps, icon: <UserCheck size={22} />, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -4, scale: 1.01 }}
            className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/30 flex items-center gap-4 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-150 transition-transform duration-500`}></div>
            <div className={`w-14 h-14 ${stat.bg} ${stat.text} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stat.value} {stat.sub && <span className="text-xs font-bold text-slate-400">{stat.sub}</span>}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'offers' ? (
          <motion.div key="offers" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="space-y-6">
            
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-96 group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  value={offerSearchTerm}
                  onChange={(e) => setOfferSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all shadow-inner"
                  placeholder="Rechercher une offre par poste, département..."
                />
              </div>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">
                {filteredOffers.length} offre(s) publiée(s)
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-left">Poste & Localisation</th>
                      <th className="px-8 py-5 text-left">Département</th>
                      <th className="px-8 py-5 text-center">Engagement</th>
                      <th className="px-8 py-5 text-left">Statut Offre</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredOffers.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50 flex items-center justify-center font-black text-slate-400 text-lg shadow-inner group-hover:scale-105 transition-transform">
                              {r.poste.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{r.poste}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-2">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">ID OFF-{r.id}</span>
                                <span>{r.site}</span>
                                <span className="text-emerald-500 font-black">{r.type}</span>
                              </p>
                              {(r.mots_cles || r.competences || r.experience || r.criteres) && (
                                <div className="mt-2.5 flex flex-wrap gap-1.5 max-w-xl">
                                  {r.experience && <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-200/60 shadow-sm shadow-amber-100/50">Exp: {r.experience}</span>}
                                  {r.mots_cles && tokenizeCriteria(r.mots_cles).slice(0, 3).map((kw) => (
                                    <span key={kw} className="text-[9px] font-black uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200/60 shadow-sm">⚡ {kw}</span>
                                  ))}
                                  {tokenizeCriteria(r.competences).slice(0, 3).map((skill) => (
                                    <span key={skill} className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200/60 shadow-sm shadow-emerald-100/50">{skill}</span>
                                  ))}
                                  {r.criteres && <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200/60 shadow-sm">★ {r.criteres}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-slate-700 bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl uppercase tracking-wider">{r.departement}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button
                            onClick={() => { setSelectedOfferFilter(r.id); setView('applications'); }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200/60 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 rounded-2xl transition-all font-black text-[10px] uppercase text-slate-600 shadow-sm"
                          >
                            <Users size={14} className={r.candidats > 0 ? "text-emerald-500" : "text-slate-400"} />
                            <span>{r.candidats || 0} postulant(s)</span>
                          </button>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={r.statut}
                            onChange={(e) => handleUpdateOfferStatus(r.id, e.target.value)}
                            className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer border shadow-sm transition-colors ${
                              r.statut === 'Ouvert' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200/60'
                            }`}
                          >
                            <option value="Ouvert">Ouvert</option>
                            <option value="Clôturé">Clôturé</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => { setNewCandidate({ ...emptyCandidate, offerId: r.id }); setShowCandidateModal(true); }}
                              title="Ajouter un candidat"
                              className="w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200/60 text-emerald-500 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm"
                            >
                              <UserPlus size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOffer(r.id)} 
                              title="Supprimer l'offre"
                              className="w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200/60 text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredOffers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-20 text-center">
                          <div className="flex flex-col items-center justify-center opacity-50">
                            <Briefcase size={48} className="text-slate-300 mb-4" />
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Aucune offre publiée</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="apps" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="space-y-6">
            
            {/* Premium ATS Intelligence Banner */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] border border-slate-700/50 shadow-2xl shadow-slate-900/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>
              
              <div className="p-8 lg:p-10 relative z-10 flex flex-col xl:flex-row xl:items-center gap-8 justify-between border-b border-white/10">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-emerald-500/20">
                    <BrainCircuit size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Intelligence ATS & Pipeline</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 max-w-xl leading-relaxed">
                      L'algorithme de matching évalue automatiquement l'adéquation des profils. Utilisez les filtres avancés pour trier les talents par pertinence et étape de recrutement.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 min-w-0 xl:min-w-[450px]">
                  {[
                    ['Top Profils', atsStats.best, 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', <Trophy size={16} />],
                    ['Moyens', atsStats.medium, 'text-amber-400 bg-amber-400/10 border-amber-400/20', <Target size={16} />],
                    ['À Compléter', atsStats.low, 'text-rose-400 bg-rose-400/10 border-rose-400/20', <AlertTriangle size={16} />],
                  ].map(([label, value, color, icon]) => (
                    <div key={label} className="bg-white/5 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10 flex-1 min-w-[120px]">
                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg w-fit border ${color}`}>{icon}<span className="text-[9px] font-black uppercase tracking-wider">{label}</span></div>
                      <p className="text-3xl font-black text-white mt-3">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="p-6 lg:px-10 lg:py-8 bg-black/20 backdrop-blur-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <div className="relative group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all placeholder:text-slate-500"
                    placeholder="Recherche globale..."
                  />
                </div>

                {[
                  { icon: <Filter size={16} />, value: selectedOfferFilter, setter: setSelectedOfferFilter, options: [['all', 'Tous les postes'], ...(data.recruitment || []).map(o => [o.id, o.poste])] },
                  { icon: <SlidersHorizontal size={16} />, value: atsLevelFilter, setter: setAtsLevelFilter, options: [['all', 'Tous Niveaux ATS'], ['best', 'Top Profils (75%+)'], ['medium', 'Profils Moyens (50%+)'], ['low', 'À Compléter (<50%)']] },
                  { icon: <UserCheck size={16} />, value: stageFilter, setter: setStageFilter, options: [['all', 'Toutes les étapes'], ['Nouveau', 'Nouveaux'], ['En étude', 'En étude'], ['Entretien', 'Entretiens'], ['Retenu', 'Retenus'], ['Rejeté', 'Rejetés']] }
                ].map((filter, i) => (
                  <div key={i} className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors">{filter.icon}</span>
                    <select
                      value={filter.value}
                      onChange={(e) => filter.setter(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-slate-200 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 transition-all"
                    >
                      {filter.options.map(([val, label]) => (
                        <option key={val} value={val} className="text-slate-800 font-bold">{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </section>

            {/* Candidate Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredApplications.map((app) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={app.id} 
                  className="bg-white p-6 lg:p-7 rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-slate-300/40 transition-all group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-bl-[6rem] -mr-10 -mt-10 pointer-events-none transition-transform duration-700 group-hover:scale-125 ${app.ats.score >= 75 ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-white border border-slate-200/80 shadow-inner rounded-2xl flex items-center justify-center font-black text-slate-700 text-lg group-hover:-rotate-3 transition-transform shrink-0">
                          {app.nom?.[0]}{app.prenoms?.[0]}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 leading-tight uppercase tracking-tight">{app.nom} <span className="font-bold text-slate-600 capitalize">{app.prenoms}</span></h4>
                          <span className="text-[9px] font-black text-slate-400 uppercase mt-0.5 block tracking-wider">Postulé le {new Date(app.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* Circle ATS */}
                      <ProgressCircle score={app.ats.score} />
                    </div>

                    <div className="mb-5 bg-slate-50 rounded-2xl p-4 border border-slate-100 relative z-10">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cible</p>
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-tight">{app.offer?.poste || 'Candidature Spontanée'}</p>
                    </div>

                    {/* Pipeline Stage Select Pill */}
                    <div className="mb-6 relative z-10">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1.5 ml-1">Pipeline</label>
                      <select
                        value={app.statut || 'Nouveau'}
                        onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all shadow-sm focus:ring-2 focus:ring-slate-200 ${STAGE_COLORS[app.statut || 'Nouveau']}`}
                      >
                        <option value="Nouveau">Nouveau</option>
                        <option value="En étude">En étude</option>
                        <option value="Entretien">Entretien</option>
                        <option value="Retenu">Retenu (À Embaucher)</option>
                        <option value="Rejeté">Rejeté</option>
                      </select>
                    </div>

                    {/* ATS Badges */}
                    <div className="relative z-10">
                      <div className="flex flex-wrap gap-1.5">
                        {(app.ats.strengths.length ? app.ats.strengths : app.ats.gaps).slice(0, 4).map((item) => (
                          <span key={item} className="text-[9px] font-bold bg-white text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-sm">{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100 gap-2 relative z-10">
                    <button 
                      onClick={() => setSelectedApp(app)}
                      className="text-[10px] font-black text-slate-700 bg-slate-100 px-4 py-2 rounded-xl uppercase tracking-wider hover:bg-slate-800 hover:text-white transition-colors shadow-sm flex items-center gap-2"
                    >
                      Ouvrir <ArrowUpRight size={14} />
                    </button>
                    
                    <div className="flex gap-2">
                      {app.statut !== 'Retenu' && (
                        <button
                          onClick={() => handleConvertToEmployee(app)}
                          title="Convertir en Employé"
                          className="w-9 h-9 flex items-center justify-center bg-emerald-50 border border-emerald-200/60 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white hover:shadow-md hover:shadow-emerald-500/20 transition-all"
                        >
                          <UserCheck size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteApplication(app.id)}
                        title="Supprimer"
                        className="w-9 h-9 flex items-center justify-center bg-white border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white hover:border-transparent transition-all shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredApplications.length === 0 && (
              <div className="py-24 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-4 rotate-12">
                  <Users size={32} />
                </div>
                <h4 className="text-lg font-black text-slate-700 uppercase tracking-tight">Aucun profil trouvé</h4>
                <p className="text-slate-400 font-bold text-sm mt-1">Ajustez vos filtres de recherche ou changez de statut.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      <AnimatePresence>
        {/* Modal Add Offer */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative z-10 p-8 lg:p-10 max-h-[92vh] overflow-y-auto border border-slate-200"
            >
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-800">Nouvelle Offre d'Emploi</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Définissez les critères pour l'analyse intelligente des CV.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-500"><X size={20} /></button>
              </div>
              
              <form onSubmit={handlePublish} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Intitulé du Poste *</label>
                  <input type="text" required value={newOffer.poste} onChange={e => setNewOffer({...newOffer, poste: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/30 focus:bg-white outline-none transition-all shadow-inner" placeholder="Ex: Développeur React Senior..." />
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Département</label>
                    <select value={newOffer.departement} onChange={e => setNewOffer({...newOffer, departement: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all shadow-inner">
                      <option>Direction</option><option>Comptabilité</option><option>Sécurité</option><option>BTP</option><option>Pédagogie</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Contrat</label>
                    <select value={newOffer.type} onChange={e => setNewOffer({...newOffer, type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all shadow-inner">
                      <option>CDI</option><option>CDD</option><option>Stage</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Localisation</label>
                    <select value={newOffer.site} onChange={e => setNewOffer({...newOffer, site: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all shadow-inner">
                      <option value="abidjan">Abidjan</option><option value="yopougon">Yopougon</option><option value="cocody">Cocody</option><option value="bouake">Bouaké</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Date limite</label>
                    <input type="date" value={newOffer.dateFin} onChange={e => setNewOffer({...newOffer, dateFin: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all shadow-inner" />
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 space-y-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full"></div>
                  <div className="flex items-start gap-4 relative z-10">
                    <BrainCircuit size={24} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-black uppercase tracking-wider">Critéres de Scoring ATS</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">Définissez les mots-clés requis pour analyser les candidatures.</p>
                    </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Mots-clés requis (Séparés par des virgules) *</label>
                    <div className="flex gap-2">
                      <input
                        required type="text" value={newOffer.mots_cles} onChange={e => setNewOffer({...newOffer, mots_cles: e.target.value})}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-500"
                        placeholder="Ex: react, javascript, nodejs, devops"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Compétences clés</label>
                    <textarea
                      rows={2} value={newOffer.competences} onChange={e => setNewOffer({...newOffer, competences: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600 resize-none"
                      placeholder="Ex: React, Node, Tailwind, TypeScript..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Expérience</label>
                      <input required value={newOffer.experience} onChange={e => setNewOffer({...newOffer, experience: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600" placeholder="Ex: 3 ans" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Critéres Bonus</label>
                      <input value={newOffer.criteres} onChange={e => setNewOffer({...newOffer, criteres: e.target.value})} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-600" placeholder="Ex: Disponible, Permis B..." />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:scale-[1.01] transition-all active:scale-95">
                  Publier l'Offre
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal Add Candidate */}
        {showCandidateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCandidateModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 p-8 lg:p-10 max-h-[92vh] overflow-y-auto border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-black tracking-tighter uppercase text-slate-800">Ajout Candidat</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">Saisie manuelle d'une candidature.</p>
                </div>
                <button onClick={() => setShowCandidateModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-500"><X size={18} /></button>
              </div>

              <form onSubmit={handleAddCandidateManual} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Offre Visée *</label>
                  <select required value={newCandidate.offerId} onChange={e => setNewCandidate({...newCandidate, offerId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/30">
                    <option value="">Sélectionnez une offre...</option>
                    {(data.recruitment || []).map(r => (
                      <option key={r.id} value={r.id}>{r.poste} ({r.site})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Nom *</label>
                    <input type="text" required value={newCandidate.nom} onChange={e => setNewCandidate({...newCandidate, nom: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Yao" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Prénoms *</label>
                    <input type="text" required value={newCandidate.prenoms} onChange={e => setNewCandidate({...newCandidate, prenoms: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Jean" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email *</label>
                    <input type="email" required value={newCandidate.email} onChange={e => setNewCandidate({...newCandidate, email: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="jean@mail.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Téléphone</label>
                    <input type="text" value={newCandidate.telephone} onChange={e => setNewCandidate({...newCandidate, telephone: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="07000000" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Résumé du Profil</label>
                  <textarea 
                    rows={4} value={newCandidate.motivation} onChange={e => setNewCandidate({...newCandidate, motivation: e.target.value})} 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none resize-none focus:ring-2 focus:ring-emerald-500/30" 
                    placeholder="Expérience, compétences..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">CV (PDF/Image) *</label>
                    <input type="file" accept=".pdf,image/*" required onChange={e => handleFileUpload(e, 'cv')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Lettre de Motiv.</label>
                    <input type="file" accept=".pdf,image/*" onChange={e => handleFileUpload(e, 'lm')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 mt-2 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                  Enregistrer Candidature
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Modal App Details */}
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedApp(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl relative z-10 p-8 lg:p-10 max-h-[92vh] overflow-y-auto border border-slate-200"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl pr-8 border border-slate-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-slate-900/20">
                    {selectedApp.nom[0]}{selectedApp.prenoms[0]}
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 leading-tight uppercase tracking-tight">{selectedApp.nom} <span className="font-bold text-slate-600 capitalize">{selectedApp.prenoms}</span></h4>
                    <p className="text-[10px] font-black text-emerald-600 uppercase mt-1 tracking-widest">{selectedApp.offer?.poste || 'Candidature Spontanée'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-500 shrink-0"><X size={20} /></button>
              </div>
              
              <div className="space-y-6">
                
                {/* Contacts Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <a href={`tel:${selectedApp.telephone}`} className="p-4 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-3xl transition-all flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:scale-110 transition-transform"><Phone size={18} /></div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
                      <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{selectedApp.telephone || 'Non défini'}</p>
                    </div>
                  </a>
                  <a href={`mailto:${selectedApp.email}`} className="p-4 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 rounded-3xl transition-all flex items-center gap-4 group">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-110 transition-transform"><Mail size={18} /></div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{selectedApp.email}</p>
                    </div>
                  </a>
                </div>

                {/* Pipeline Status Selector */}
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Étape du Recrutement</p>
                  <div className="flex flex-wrap gap-2">
                    {['Nouveau', 'En étude', 'Entretien', 'Retenu', 'Rejeté'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateAppStatus(selectedApp.id, st)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                          (selectedApp.statut || 'Nouveau') === st 
                            ? STAGE_COLORS[st] + ' scale-105' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:scale-105'
                        }`}
                      >
                        {st === 'Retenu' ? '✓ À Embaucher' : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ATS Box */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/20 blur-[50px] rounded-full"></div>
                  
                  <div className="flex items-center justify-between gap-4 relative z-10">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnostic ATS</p>
                      <h4 className="text-2xl font-black uppercase tracking-tight text-emerald-400 mt-1">{selectedApp.ats?.label || 'Analyse auto'}</h4>
                    </div>
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[20px] flex flex-col items-center justify-center p-2 backdrop-blur-md">
                      <span className="text-3xl font-black text-white">{selectedApp.ats?.score || 0}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">/ 100</span>
                    </div>
                  </div>

                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-6 relative z-10">
                    <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${selectedApp.ats?.score || 0}%` }}></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 relative z-10">
                    <div>
                      <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400/80 mb-2.5"><CheckCircle2 size={12}/> Points Forts</p>
                      <div className="space-y-2">
                        {(selectedApp.ats?.strengths?.length ? selectedApp.ats.strengths : ['Aucun point fort spécifique détecté']).map((item) => (
                          <p key={item} className="text-[10px] font-bold bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-slate-200">{item}</p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-400/80 mb-2.5"><AlertTriangle size={12}/> Lacunes</p>
                      <div className="space-y-2">
                        {(selectedApp.ats?.gaps?.length ? selectedApp.ats.gaps : ['Profil correspondant globalement aux attentes']).map((item) => (
                          <p key={item} className="text-[10px] font-bold bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-slate-200">{item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motivation Content */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Synthèse / Lettre de motivation</p>
                  <div className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-xs font-medium text-slate-600 leading-relaxed text-justify max-h-48 overflow-y-auto">
                    {selectedApp.motivation || <span className="italic text-slate-400">Aucun détail fourni par le candidat.</span>}
                  </div>
                </div>

                {/* Documents Content */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Documents Joints</p>
                  <div className="flex flex-wrap gap-4">
                    {selectedApp.cv ? (
                      <button onClick={() => openBase64InNewTab(selectedApp.cv)} className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl transition-all group flex-1">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Curriculum Vitae</p>
                          <p className="text-[9px] font-bold text-slate-400">Ouvrir le document</p>
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl opacity-60 flex-1">
                        <div className="w-10 h-10 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center shrink-0"><XCircle size={20} /></div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-500 uppercase tracking-tight">Aucun CV</p>
                        </div>
                      </div>
                    )}

                    {selectedApp.lm ? (
                      <button onClick={() => openBase64InNewTab(selectedApp.lm)} className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl transition-all group flex-1">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Lettre de Motiv.</p>
                          <p className="text-[9px] font-bold text-slate-400">Ouvrir le document</p>
                        </div>
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Convert to Employee Button */}
                <div className="pt-4">
                  <button
                    onClick={() => handleConvertToEmployee(selectedApp)}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles size={18} /> Convertir en Employé
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Recruitment;
