import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, MapPin, Layers, Zap, ChevronRight, X, Send, CheckCircle, 
  Upload, Trash2, AlertCircle, FileBadge, Search, Filter,
  ArrowRight, Clock, Users, Star, Building, TrendingUp, Globe, Sparkles,
  ShieldCheck, Target, ArrowUpRight, GraduationCap, Mail, UserCheck
} from 'lucide-react';

/* ─── Zone de dépôt de fichier Premium ─── */
const FileDropZone = ({ label, accept, required, multiple, file, files, onFileChange, onRemove, hint }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = multiple ? Array.from(e.dataTransfer.files) : e.dataTransfer.files[0] || null;
    onFileChange(dropped);
  }, [multiple, onFileChange]);

  const handleInput = (e) => {
    const selected = multiple ? Array.from(e.target.files) : e.target.files[0] || null;
    onFileChange(selected);
    e.target.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  const fileList = multiple ? (files || []) : (file ? [file] : []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-widest text-slate-600">{label}</label>
        {required
          ? <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-rose-100">Requis</span>
          : <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest">Optionnel</span>
        }
      </div>
      
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center gap-3 text-center ${
          dragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-emerald-50/30'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-emerald-100 text-emerald-600' : 'bg-white shadow-sm text-slate-400'}`}>
          <Upload size={24} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-700">
            Glissez-déposez votre document ou <span className="text-emerald-600 hover:text-emerald-700 underline underline-offset-4">parcourez</span>
          </p>
          {hint && <p className="text-xs font-medium text-slate-400 mt-1">{hint}</p>}
        </div>
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleInput} />
      </motion.div>

      <AnimatePresence>
        {fileList.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-2">
            {fileList.map((f, i) => (
              <div key={i} className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-700 truncate">{f.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatSize(f.size)}</p>
                </div>
                <button type="button" onClick={() => onRemove(i)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Careers Page Component ─── */
const Careers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState({ nom: '', prenoms: '', email: '', telephone: '', motivation: '' });
  const [cvFile, setCvFile] = useState(null);
  const [lmFile, setLmFile] = useState(null);
  const [otherFiles, setOtherFiles] = useState([]);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('Abidjan, San-Pédro');
  const [deptFilter, setDeptFilter] = useState('All');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const resetForm = () => {
    setApplyForm({ nom: '', prenoms: '', email: '', telephone: '', motivation: '' });
    setCvFile(null); setLmFile(null); setOtherFiles([]); setFormError('');
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!cvFile) { setFormError('Veuillez charger votre CV (obligatoire).'); return; }
    setApplyLoading(true);
    try {
      const toBase64 = (f) => new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f);
      });
      const cvB64 = await toBase64(cvFile);
      const lmB64 = lmFile ? await toBase64(lmFile) : '';
      const othersB64 = await Promise.all(otherFiles.map(f => toBase64(f)));
      await axios.post('/api/applications', {
        offerId: selectedOffer.id,
        nom: applyForm.nom, prenoms: applyForm.prenoms,
        email: applyForm.email, telephone: applyForm.telephone,
        cv: cvB64, cvName: cvFile.name,
        lm: lmB64, lmName: lmFile ? lmFile.name : '',
        otherDocs: othersB64.map((b, i) => ({ data: b, name: otherFiles[i].name })),
        date: new Date().toISOString(), statut: 'Nouveau', motivation: applyForm.motivation
      });
      setApplySuccess(true);
      setOffers(prev => prev.map(o => o.id === selectedOffer.id ? { ...o, candidats: (o.candidats || 0) + 1 } : o));
      setTimeout(() => { setApplySuccess(false); setShowApply(false); setSelectedOffer(null); resetForm(); }, 3500);
    } catch {
      setFormError('Une erreur est survenue lors du dépôt de candidature. Veuillez réessayer.');
    } finally {
      setApplyLoading(false);
    }
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get('/api/sirh-data');
        setOffers(res.data.recruitment.filter(o => o.statut !== 'Clôturé'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const filteredOffers = offers.filter(o => {
    const haystack = `${o.poste} ${o.departement} ${o.site} ${o.type}`.toLowerCase();
    const matchSearch = haystack.includes(searchTerm.toLowerCase());
    const matchLocation = locationSearch === '' || (o.site || '').toLowerCase().includes(locationSearch.toLowerCase().split(',')[0].trim());
    const matchDept = deptFilter === 'Toutes' || deptFilter === 'All' || o.departement === deptFilter || (deptFilter === 'Technologie' && o.departement === 'BTP') || (deptFilter === 'Opérations' && o.departement === 'Sécurité');
    return matchSearch && matchDept;
  });

  const categories = [
    { name: 'Toutes', count: offers.length },
    { name: 'Technologie', count: 1 },
    { name: 'Finance', count: 2 },
    { name: 'Ressources Humaines', count: 3 },
    { name: 'Opérations', count: 1 },
    { name: 'Ventes', count: 1 },
    { name: 'Marketing', count: 3 }
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans antialiased text-slate-800">
      
      {/* ─── Top Executive Navy Header with Emerald Line ─── */}
      <header className="bg-[#051915] text-white sticky top-0 z-40 border-b border-emerald-900/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Branding GEBAT SA */}
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
              <img src="/gebat_logo.png" alt="GEBAT Logo Officiel" className="h-9 max-w-[80px] object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-wider text-emerald-400 uppercase">Portail Recrutement</div>
              <div className="font-black text-xl tracking-tight text-white leading-none">GEBAT SA</div>
            </div>
          </div>

          {/* Offres Disponibles Badge */}
          <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {offers.length} Offres d'Emploi Ouvertes
          </div>
        </div>

        {/* Hero Title Banner Inside Header */}
        <div className="py-12 bg-gradient-to-r from-[#031310] via-[#051915] to-[#0A2922] text-center border-t border-emerald-950">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Trouvez Votre Avenir chez GEBAT SA – BTP & Génie Civil Côte d'Ivoire
          </h1>
        </div>
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* Section Title */}
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">PORTAIL CARRIÈRES & RECRUTEMENT</h2>
        </div>

        {/* ── Search Bar Section ── */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full flex items-center">
            <Search size={18} className="absolute left-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-xs font-bold outline-none text-slate-800 placeholder-slate-400"
              placeholder="Rechercher un poste, compétences, mots-clés..."
            />
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

          <div className="relative flex-1 w-full flex items-center">
            <MapPin size={18} className="absolute left-4 text-slate-400" />
            <input
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-xs font-bold outline-none text-slate-800 placeholder-slate-400"
              placeholder="Localisation : Abidjan, San-Pédro"
            />
          </div>

          <button className="w-full md:w-auto px-8 py-3.5 bg-[#008A5E] hover:bg-[#007550] text-white font-extrabold text-xs tracking-wider rounded-xl transition-all shadow-md">
            RECHERCHER
          </button>
        </div>

        {/* ── Department Category Selector Pills ── */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setDeptFilter(cat.name)}
              className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                deptFilter === cat.name || (deptFilter === 'All' && cat.name === 'Toutes')
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.name} <span className="opacity-60 text-[10px]">{cat.count}</span>
            </button>
          ))}
        </div>

        {/* ── Main Layout Grid (8 cols job list + 4 cols sidebar) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left 8 Columns: Job Cards Grid */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="py-24 flex justify-center">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <Briefcase size={40} className="mx-auto text-slate-300" />
                <p className="font-extrabold text-slate-500 text-xs">Aucune offre d'emploi ne correspond à vos critères</p>
                <button onClick={() => { setSearchTerm(''); setDeptFilter('Toutes'); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">Réinitialiser les filtres</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredOffers.map(o => (
                  <div 
                    key={o.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
                  >
                    <div className="space-y-3">
                      {/* Logo Icon & Title Header */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 p-1 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                          <img src="/gebat_logo.png" alt="GEBAT" className="max-h-8 max-w-8 object-contain" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                            {o.poste}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] font-extrabold text-slate-500">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {o.site}</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md">{o.type}</span>
                            <span>•</span>
                            <span>{o.departement}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-black">{o.salaire || '2.5M FCFA'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description Short Text */}
                      <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                        Nous recherchons un(e) {o.poste} qualifié(e) pour intégrer notre pôle {o.departement} à {o.site}.
                      </p>

                      {/* Bold Salary Indicator */}
                      <div>
                        <p className="text-sm font-black text-slate-900">{o.salaire || '2.5M FCFA/mois'}</p>
                      </div>

                      {/* Requirements List */}
                      <ul className="text-[11px] text-slate-600 space-y-1 font-medium pt-1">
                        <li className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Exigences clés : {o.competences || 'Expertise requise'}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Contrat requis : {o.type}
                        </li>
                      </ul>
                    </div>

                    {/* CTA Action Buttons: Details & Apply */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => { setSelectedOffer(o); setShowApply(false); }}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs tracking-wider rounded-xl transition-all border border-slate-200 flex items-center gap-1"
                      >
                        <FileBadge size={14} className="text-slate-500" /> VOIR DÉTAILS
                      </button>
                      <button
                        onClick={() => { setSelectedOffer(o); setShowApply(true); }}
                        className="px-4 py-2 bg-[#008A5E] hover:bg-[#007550] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        POSTULER <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right 4 Columns: Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Widget 1: Featured Jobs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Offres En Vedette</h3>
              
              <div className="space-y-3">
                {offers.slice(0, 3).map(o => (
                  <div 
                    key={o.id}
                    onClick={() => { setSelectedOffer(o); setShowApply(true); }}
                    className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-colors cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      ✨
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 truncate">{o.poste}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                        📍 {o.site} • {o.type} • <span className="text-emerald-700">{o.salaire || '2.5M FCFA'}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors">
                Afficher plus
              </button>
            </div>

            {/* Widget 2: Newsletter / Talent Pool Subscription Card */}
            <div className="bg-[#051915] text-white p-6 rounded-2xl shadow-xl space-y-4 border border-emerald-900/40">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">CVTHÈQUE & ALERTES RH</h3>
                <p className="text-xs font-bold text-white">Inscrivez-vous pour recevoir les offres dans votre boîte mail</p>
              </div>

              {newsletterSubscribed ? (
                <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} /> Abonné à la CVthèque SIRH-CIV !
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={e => setNewsletterEmail(e.target.value)}
                    placeholder="Adresse email"
                    className="w-full px-4 py-3 bg-white text-slate-800 rounded-xl text-xs font-bold outline-none"
                  />
                  <button
                    onClick={() => { if (newsletterEmail) setNewsletterSubscribed(true); }}
                    className="w-full py-3 bg-[#008A5E] hover:bg-[#007550] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
                  >
                    S'ABONNER
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* ── Modal Détail Offre (VOIR DÉTAILS) ── */}
      <AnimatePresence>
        {selectedOffer && !showApply && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6" 
            onClick={() => setSelectedOffer(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200" 
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-8 bg-[#051915] text-white relative overflow-hidden shrink-0">
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider">{selectedOffer.type}</span>
                      <span className="text-xs font-bold text-slate-300">{selectedOffer.departement}</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white">{selectedOffer.poste}</h3>
                    <p className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <MapPin size={14} /> {selectedOffer.site} • Publié le {new Date(selectedOffer.dateCreated || Date.now()).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button onClick={() => setSelectedOffer(null)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-8 bg-slate-50 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Description du Poste</h4>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed">
                        Nous recherchons un(e) <strong className="text-slate-900">{selectedOffer.poste}</strong> qualifié(e) pour intégrer notre pôle <strong className="text-slate-900">{selectedOffer.departement}</strong> basé à <strong className="text-slate-900">{selectedOffer.site}</strong>. Vous participerez activement à la réussite des projets stratégiques.
                      </p>
                    </div>

                    {selectedOffer.competences && (
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Compétences Clés & Exigences</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedOffer.competences.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                            <span key={skill} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-xl">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Synthèse</h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between border-b pb-2 border-slate-100">
                          <span className="font-bold text-slate-400">Nature du Contrat</span>
                          <span className="font-black text-slate-800">{selectedOffer.type}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 border-slate-100">
                          <span className="font-bold text-slate-400">Expérience</span>
                          <span className="font-black text-slate-800">{selectedOffer.experience || 'Indifférent'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 border-slate-100">
                          <span className="font-bold text-slate-400">Localisation</span>
                          <span className="font-black text-slate-800">{selectedOffer.site}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2 border-slate-100">
                          <span className="font-bold text-slate-400">Rémunération</span>
                          <span className="font-black text-emerald-700">{selectedOffer.salaire || '2.5M FCFA'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowApply(true)}
                        className="w-full py-3.5 bg-[#008A5E] hover:bg-[#007550] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        <Send size={16} /> POSTULER MAINTENANT
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal Formulaire Candidature ── */}
      <AnimatePresence>
        {showApply && selectedOffer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl flex flex-col my-auto border border-slate-200 relative overflow-hidden"
            >
              <div className="flex justify-between items-center px-8 py-6 bg-[#051915] text-white shrink-0">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Soumettre ma candidature</h3>
                  <p className="text-xs font-bold text-emerald-400 mt-0.5">{selectedOffer.poste} — {selectedOffer.site}</p>
                </div>
                <button onClick={() => { setShowApply(false); resetForm(); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-8">
                {applySuccess ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                      <CheckCircle size={36} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Candidature Transmise !</h3>
                    <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                      Votre dossier a été enregistré avec succès dans notre plateforme RH. Notre service de recrutement vous contactera très prochainement.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="space-y-6">
                    {formError && (
                      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertCircle size={16} /> {formError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-2">Informations Candidat</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Nom *</label>
                            <input required value={applyForm.nom} onChange={e => setApplyForm({ ...applyForm, nom: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white" placeholder="Nom" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Prénoms *</label>
                            <input required value={applyForm.prenoms} onChange={e => setApplyForm({ ...applyForm, prenoms: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white" placeholder="Prénoms" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Email *</label>
                          <input type="email" required value={applyForm.email} onChange={e => setApplyForm({ ...applyForm, email: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white" placeholder="email@exemple.com" />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Téléphone *</label>
                          <input required value={applyForm.telephone} onChange={e => setApplyForm({ ...applyForm, telephone: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white" placeholder="+225 0700000000" />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Motivations / Résumé</label>
                          <textarea rows="3" value={applyForm.motivation} onChange={e => setApplyForm({ ...applyForm, motivation: e.target.value })} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white resize-none" placeholder="Quelques mots sur vous..."></textarea>
                        </div>
                      </div>

                      <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-2">Documents (CV & Lettre)</h4>
                        
                        <FileDropZone 
                          label="Curriculum Vitae (PDF, Word)" 
                          accept=".pdf,.doc,.docx" required file={cvFile} 
                          onFileChange={setCvFile} onRemove={() => setCvFile(null)} 
                        />
                        
                        <FileDropZone 
                          label="Lettre de Motivation" 
                          accept=".pdf,.doc,.docx" file={lmFile} 
                          onFileChange={setLmFile} onRemove={() => setLmFile(null)} 
                        />
                      </div>
                    </div>

                    <button
                      type="submit" disabled={applyLoading}
                      className="w-full py-4 bg-[#008A5E] hover:bg-[#007550] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md disabled:opacity-70 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                      {applyLoading ? 'Envoi en cours...' : <>Envoyer ma candidature <Send size={16} /></>}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Careers;
