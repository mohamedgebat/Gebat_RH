import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { 
  Building, MapPin, Globe, Shield, Save, RefreshCw, 
  Palette, Image as ImageIcon, Upload, DollarSign, 
  Check, Phone, Mail, FileText, AlertTriangle, Percent, Sliders,
  Layers, Key, CheckSquare, Zap, Cpu, Users, Lock, Server
} from 'lucide-react';
import axios from 'axios';

const COLOR_PRESETS = [
  { name: "Côte d'Ivoire (Vert & Orange)", primary: '#009E49', secondary: '#F77F00' },
  { name: "Sénégal & UEMOA (Vert & Or)", primary: '#00853f', secondary: '#fdef42' },
  { name: "Bleu Corporate & Émeraude", primary: '#0284c7', secondary: '#10b981' },
  { name: "Violet Tech & Rose Modern", primary: '#7c3aed', secondary: '#ec4899' },
  { name: "Dark Slate & Ambre", primary: '#0f172a', secondary: '#f59e0b' }
];

const COUNTRY_OPTIONS = [
  { code: 'CI', name: "Côte d'Ivoire 🇨🇮", currency: 'F CFA (XOF)', smic: 75000, cnps: 6.3 },
  { code: 'SN', name: "Sénégal 🇸🇳", currency: 'F CFA (XOF)', smic: 64223, cnps: 5.6 },
  { code: 'CM', name: "Cameroun 🇨🇲", currency: 'F CFA (XAF)', smic: 41875, cnps: 4.2 },
  { code: 'GA', name: "Gabon 🇬🇦", currency: 'F CFA (XAF)', smic: 150000, cnps: 2.5 },
  { code: 'TG', name: "Togo 🇹🇬", currency: 'F CFA (XOF)', smic: 52500, cnps: 4.0 },
  { code: 'BJ', name: "Bénin 🇧🇯", currency: 'F CFA (XOF)', smic: 52000, cnps: 3.6 },
  { code: 'BF', name: "Burkina Faso 🇧🇫", currency: 'F CFA (XOF)', smic: 34664, cnps: 5.5 },
  { code: 'ML', name: "Mali 🇲🇱", currency: 'F CFA (XOF)', smic: 40000, cnps: 3.6 },
  { code: 'FR', name: "France 🇫🇷", currency: 'EUR (€)', smic: 1766, cnps: 11.3 },
  { code: 'INT', name: "International / Autre 🌐", currency: 'USD ($)', smic: 1000, cnps: 5.0 }
];

const Settings = () => {
  const { data, loading, refreshData } = useData();
  const [formData, setFormData] = useState({
    companyName: '',
    rc: '',
    cc: '',
    cnps_employer: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
    primaryColor: '#009E49',
    secondaryColor: '#F77F00',
    smicAmount: 75000,
    cnpsPlafond: 1647315,
    cnpsSalarial: 6.3,
    cnpsPatronalRetraite: 7.7,
    cnpsPatronalPF: 5.75,
    cnpsPatronalAT: 3.0,
    itsPatronalIvoirien: 1.2,
    itsPatronalExpat: 12.0,
    taFdfpRate: 1.0,
    timezone: 'GMT (Abidjan)',
    currency: 'F CFA (XOF)',
    language: 'Français',
    tenantSlug: 'demo.sirh-civ.ci',
    saasPlan: 'BUSINESS PRO',
    maxEmployees: 50,
    countryCode: 'CI',
    legalHoursPerMonth: 173.33,
    leaveAccrualRate: 2.2,
    apiKey: 'sk_live_sirh_98a76d5e4c3b2a10',
    modulePayroll: true,
    moduleLeaves: true,
    moduleEvaluations: true,
    moduleRecruitment: true,
    modulePortal: true,
    moduleMobileMoney: true,
    slogan: "L'Excellence RH & Paie en Afrique",
    footerStampText: "Document Officiel Certifié RH"
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('saas_identity');

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setFormData({
        companyName: s.companyName || 'ENTREPRISE IVOIRIENNE SAS',
        rc: s.rc || 'CI-ABJ-03-2024-B12-12345',
        cc: s.cc || '2401234 A',
        cnps_employer: s.cnps_employer || '12345678',
        address: s.address || 'Abidjan, Plateau, Avenue Marchand',
        phone: s.phone || '+225 27 20 00 00 00',
        email: s.email || 'contact@entreprise.ci',
        logo: s.logo || '',
        primaryColor: s.primaryColor || '#009E49',
        secondaryColor: s.secondaryColor || '#F77F00',
        smicAmount: s.smicAmount !== undefined ? s.smicAmount : 75000,
        cnpsPlafond: s.cnpsPlafond !== undefined ? s.cnpsPlafond : 1647315,
        cnpsSalarial: s.cnpsSalarial !== undefined ? s.cnpsSalarial : 6.3,
        cnpsPatronalRetraite: s.cnpsPatronalRetraite !== undefined ? s.cnpsPatronalRetraite : 7.7,
        cnpsPatronalPF: s.cnpsPatronalPF !== undefined ? s.cnpsPatronalPF : 5.75,
        cnpsPatronalAT: s.cnpsPatronalAT !== undefined ? s.cnpsPatronalAT : 3.0,
        itsPatronalIvoirien: s.itsPatronalIvoirien !== undefined ? s.itsPatronalIvoirien : 1.2,
        itsPatronalExpat: s.itsPatronalExpat !== undefined ? s.itsPatronalExpat : 12.0,
        taFdfpRate: s.taFdfpRate !== undefined ? s.taFdfpRate : 1.0,
        timezone: s.timezone || 'GMT (Abidjan)',
        currency: s.currency || 'F CFA (XOF)',
        language: s.language || 'Français',
        tenantSlug: s.tenantSlug || 'demo.sirh-civ.ci',
        saasPlan: s.saasPlan || 'BUSINESS PRO',
        maxEmployees: s.maxEmployees !== undefined ? s.maxEmployees : 50,
        countryCode: s.countryCode || 'CI',
        legalHoursPerMonth: s.legalHoursPerMonth !== undefined ? s.legalHoursPerMonth : 173.33,
        leaveAccrualRate: s.leaveAccrualRate !== undefined ? s.leaveAccrualRate : 2.2,
        apiKey: s.apiKey || 'sk_live_sirh_98a76d5e4c3b2a10',
        modulePayroll: s.modulePayroll !== undefined ? Boolean(s.modulePayroll) : true,
        moduleLeaves: s.moduleLeaves !== undefined ? Boolean(s.moduleLeaves) : true,
        moduleEvaluations: s.moduleEvaluations !== undefined ? Boolean(s.moduleEvaluations) : true,
        moduleRecruitment: s.moduleRecruitment !== undefined ? Boolean(s.moduleRecruitment) : true,
        modulePortal: s.modulePortal !== undefined ? Boolean(s.modulePortal) : true,
        moduleMobileMoney: s.moduleMobileMoney !== undefined ? Boolean(s.moduleMobileMoney) : true,
        slogan: s.slogan || "L'Excellence RH & Paie en Afrique",
        footerStampText: s.footerStampText || "Document Officiel Certifié RH"
      });
    }
  }, [data]);

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted">Chargement de l'environnement SaaS...</div>;

  const activeEmployeesCount = (data?.employees || []).filter(e => e.statut === 'Actif').length;
  const usagePercentage = Math.min(100, Math.round((activeEmployeesCount / (formData.maxEmployees || 50)) * 100));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Le fichier est trop volumineux (Maximum 3 Mo)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountryChange = (cCode) => {
    const matched = COUNTRY_OPTIONS.find(c => c.code === cCode);
    if (matched) {
      setFormData({
        ...formData,
        countryCode: matched.code,
        currency: matched.currency,
        smicAmount: matched.smic,
        cnpsSalarial: matched.cnps
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post('/api/sirh-data', { settings: formData });
      alert('Configurations SaaS enregistrées avec succès ! La plateforme s\'est adaptée à vos paramètres.');
      refreshData();
    } catch (err) {
      alert('Erreur lors de la sauvegarde : ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Configuration SaaS Multi-Tenant & Adaptabilité" 
        subtitle="Personnalisez le domaine, le logo, la charte graphique, les modules d'abonnement et la réglementation pays"
      />

      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('saas_identity')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'saas_identity' 
              ? 'bg-ci-sidebar text-white shadow-lg shadow-ci-sidebar/20' 
              : 'bg-white text-ci-muted hover:bg-ci-bg border border-ci-border'
          }`}
        >
          <Building size={16} /> Identité Organisation & Marque Blanched
        </button>

        <button
          onClick={() => setActiveTab('saas_subscription')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'saas_subscription' 
              ? 'bg-ci-sidebar text-white shadow-lg shadow-ci-sidebar/20' 
              : 'bg-white text-ci-muted hover:bg-ci-bg border border-ci-border'
          }`}
        >
          <Layers size={16} /> Formule SaaS, Quotas & Activation Modules
        </button>

        <button
          onClick={() => setActiveTab('jurisdiction')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'jurisdiction' 
              ? 'bg-ci-sidebar text-white shadow-lg shadow-ci-sidebar/20' 
              : 'bg-white text-ci-muted hover:bg-ci-bg border border-ci-border'
          }`}
        >
          <Globe size={16} /> Réglementation Pays & Convention RH
        </button>

        <button
          onClick={() => setActiveTab('payroll_rates')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'payroll_rates' 
              ? 'bg-ci-sidebar text-white shadow-lg shadow-ci-sidebar/20' 
              : 'bg-white text-ci-muted hover:bg-ci-bg border border-ci-border'
          }`}
        >
          <Sliders size={16} /> Barèmes Paie, CNPS & Fiscalité
        </button>

        <button
          onClick={() => setActiveTab('security_api')}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security_api' 
              ? 'bg-ci-sidebar text-white shadow-lg shadow-ci-sidebar/20' 
              : 'bg-white text-ci-muted hover:bg-ci-bg border border-ci-border'
          }`}
        >
          <Key size={16} /> Clé API SaaS & Sécurité
        </button>
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'saas_identity' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ci-text">Fiche Organisation & Domaine SaaS</h3>
                  <p className="text-xs text-ci-muted font-bold">Informations légales pour l'en-tête des bulletins et contrats.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Sous-domaine / Alias SaaS</label>
                  <div className="flex items-center gap-2 bg-ci-bg p-3 rounded-2xl border border-ci-border">
                    <Globe size={16} className="text-ci-muted shrink-0" />
                    <input 
                      type="text"
                      required
                      value={formData.tenantSlug}
                      onChange={e => setFormData({ ...formData, tenantSlug: e.target.value })}
                      className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Raison Sociale / Nom Officiel</label>
                  <input 
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-5 py-3.5 bg-ci-bg border-none rounded-2xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Slogan / Déclaration d'Entreprise</label>
                  <input 
                    type="text"
                    value={formData.slogan}
                    onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                    className="w-full px-5 py-3.5 bg-ci-bg border-none rounded-2xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Registre du Commerce (RC)</label>
                    <input 
                      type="text"
                      value={formData.rc}
                      onChange={e => setFormData({ ...formData, rc: e.target.value })}
                      className="w-full px-4 py-3 bg-ci-bg border-none rounded-2xl text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Compte Contribuables (CC)</label>
                    <input 
                      type="text"
                      value={formData.cc}
                      onChange={e => setFormData({ ...formData, cc: e.target.value })}
                      className="w-full px-4 py-3 bg-ci-bg border-none rounded-2xl text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">N° Employeur CNPS / Social</label>
                    <input 
                      type="text"
                      value={formData.cnps_employer}
                      onChange={e => setFormData({ ...formData, cnps_employer: e.target.value })}
                      className="w-full px-4 py-3 bg-ci-bg border-none rounded-2xl text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Téléphone Siège</label>
                    <input 
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-ci-bg border-none rounded-2xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Email Contact RH & Support</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-ci-bg border-none rounded-2xl text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ci-text">Logo & Charte Visuelle Blanched</h3>
                  <p className="text-xs text-ci-muted font-bold">Applique les couleurs et le logo sur tous les écrans & PDF.</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-ci-border rounded-3xl bg-ci-bg/40 space-y-4">
                {formData.logo ? (
                  <div className="relative group">
                    <img 
                      src={formData.logo} 
                      alt="Logo Entreprise" 
                      className="max-h-28 object-contain rounded-2xl border border-ci-border bg-white p-3 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 shadow-md transition-all text-xs font-black"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-100 to-amber-100 text-ci-sidebar flex items-center justify-center font-black text-2xl border border-ci-border">
                    {formData.companyName ? formData.companyName.charAt(0) : 'E'}
                  </div>
                )}

                <label className="px-5 py-2.5 bg-ci-sidebar text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-ci-sidebar/90 transition-all flex items-center gap-2 shadow-md">
                  <Upload size={14} /> Importer le Logo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Thèmes Graphiques Préréglés</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: preset.primary, secondaryColor: preset.secondary })}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                        formData.primaryColor === preset.primary && formData.secondaryColor === preset.secondary
                          ? 'border-ci-green bg-emerald-50/40 shadow-sm'
                          : 'border-ci-border hover:bg-ci-bg/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: preset.primary }}></div>
                        <div className="w-4 h-4 rounded-full border border-white shadow-sm -ml-2" style={{ backgroundColor: preset.secondary }}></div>
                        <span className="text-[10px] font-black text-ci-text uppercase ml-1">{preset.name}</span>
                      </div>
                      {formData.primaryColor === preset.primary && formData.secondaryColor === preset.secondary && (
                        <Check size={14} className="text-ci-green shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ci-border">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase">Couleur Primaire</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.primaryColor} 
                      onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={formData.primaryColor} 
                      onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full px-3 py-2 bg-ci-bg border-none rounded-xl text-xs font-mono font-bold uppercase outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase">Couleur Secondaire</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.secondaryColor} 
                      onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                    />
                    <input 
                      type="text" 
                      value={formData.secondaryColor} 
                      onChange={e => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-full px-3 py-2 bg-ci-bg border-none rounded-xl text-xs font-mono font-bold uppercase outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saas_subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-6 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl space-y-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center">
                  <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                    Abonnement SaaS Actif
                  </span>
                  <Zap size={20} className="text-amber-400" />
                </div>
                <h3 className="text-3xl font-black mt-4 uppercase tracking-wider">{formData.saasPlan}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Licence multi-tenant valide avec accès à tous les microservices RH.</p>
              </div>

              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-300 uppercase">Capacité Salariés Utilisée</span>
                  <span className="text-emerald-400 font-mono">{activeEmployeesCount} / {formData.maxEmployees} Salariés</span>
                </div>

                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-amber-400 h-full transition-all duration-500"
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-1">
                  <span>Usage: {usagePercentage}%</span>
                  <span>{formData.maxEmployees - activeEmployeesCount} Licences Disponibles</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Offre SaaS Sélectionnée</label>
                  <select 
                    value={formData.saasPlan}
                    onChange={e => setFormData({ ...formData, saasPlan: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-bold text-white outline-none"
                  >
                    <option value="STARTER">STARTER (15 Salariés)</option>
                    <option value="BUSINESS PRO">BUSINESS PRO (50 Salariés)</option>
                    <option value="ENTERPRISE CUSTOM">ENTERPRISE (Illimité)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Plafond Salariés Actifs</label>
                  <input 
                    type="number"
                    value={formData.maxEmployees}
                    onChange={e => setFormData({ ...formData, maxEmployees: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-black">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ci-text">Activation des Modules Fonctionnels</h3>
                  <p className="text-xs text-ci-muted font-bold">Activez ou désactivez les fonctionnalités selon votre formule.</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'modulePayroll', title: 'Gestion de la Paie & Fiscalité (CNPS / DGI)', desc: 'Calcul de paie ivoirienne, livre de paie et bulletins PDF' },
                  { key: 'moduleLeaves', title: 'Gestion des Congés & Prêts Salariés', desc: 'Demandes de congés, suivi des soldes et déduction des avances' },
                  { key: 'moduleEvaluations', title: 'Évaluations de Performance & Compétences', desc: 'Gestion des fiches d\'évaluations annuelles et KPIs' },
                  { key: 'moduleRecruitment', title: 'Recrutement & CV Matching IA', desc: 'Gestion des offres, tri automatique et tests candidats' },
                  { key: 'modulePortal', title: 'Portail Salarié Self-Service', desc: 'Espace sécurisé réservé aux employés pour fiches & demandes' },
                  { key: 'moduleMobileMoney', title: 'Export Paiements Mobile Money & Virements', desc: 'Fichiers CSV Wave, Orange Money, MTN & virement bancaire' }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-ci-bg/50 rounded-2xl border border-ci-border flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{item.title}</h4>
                      <p className="text-[10px] font-bold text-ci-muted">{item.desc}</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={formData[item.key]}
                      onChange={e => setFormData({ ...formData, [item.key]: e.target.checked })}
                      className="w-5 h-5 accent-emerald-600 cursor-pointer rounded-md"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jurisdiction' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ci-text">Législation du Travail & Zone Réglementaire</h3>
                  <p className="text-xs text-ci-muted font-bold">Sélectionnez le pays pour appliquer les règles RH & fiscales correspondantes.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase ml-1">Pays de Juridiction Principale</label>
                  <select 
                    value={formData.countryCode}
                    onChange={e => handleCountryChange(e.target.value)}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                  >
                    {COUNTRY_OPTIONS.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase ml-1">Devise Monétaire Principale</label>
                  <input 
                    type="text"
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase ml-1">Fuseau Horaire de Référence</label>
                  <select 
                    value={formData.timezone}
                    onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none"
                  >
                    <option value="GMT (Abidjan)">GMT (Abidjan, Côte d'Ivoire)</option>
                    <option value="GMT+0 (Dakar)">GMT+0 (Dakar, Sénégal)</option>
                    <option value="GMT+1 (Douala)">GMT+1 (Douala, Cameroun)</option>
                    <option value="GMT+1 (Libreville)">GMT+1 (Libreville, Gabon)</option>
                    <option value="GMT+1 (Paris)">GMT+1 (Paris, France)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase ml-1">Volume d'Heures Légales Mensuelles</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.legalHoursPerMonth}
                    onChange={e => setFormData({ ...formData, legalHoursPerMonth: Number(e.target.value) })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold font-mono outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ci-muted uppercase ml-1">Taux d'Accumulation Congés (j/mois)</label>
                  <input 
                    type="number"
                    step="0.1"
                    value={formData.leaveAccrualRate}
                    onChange={e => setFormData({ ...formData, leaveAccrualRate: Number(e.target.value) })}
                    className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold font-mono outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 space-y-6">
              <div className="flex items-center gap-3 text-emerald-800">
                <CheckSquare size={22} />
                <h4 className="text-xs font-black uppercase tracking-widest">Conformité Réglementaire</h4>
              </div>
              <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                SIRH-CIV adapte automatiquement la paie et la fiscalité aux lois du pays sélectionné (Côte d'Ivoire, Zone OHADA / UEMOA).
              </p>
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 text-[10px] font-bold text-emerald-900 space-y-2">
                <div>✔ Exonération Transport Fixée à 30 000 FCFA</div>
                <div>✔ SMIC Minimum {formData.smicAmount} {formData.currency}</div>
                <div>✔ CNPS Salariale {formData.cnpsSalarial}% Imputée</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payroll_rates' && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm space-y-8 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                <Sliders size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-ci-text">Modification des Taux Social, CNPS & Fiscalité DGI</h3>
                <p className="text-xs text-ci-muted font-bold">Tous ces paramètres sont 100% modifiables et directement appliqués au moteur de calcul de la paie.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Montant du SMIC Légale ({formData.currency})</label>
                <input 
                  type="number" 
                  required
                  value={formData.smicAmount} 
                  onChange={e => setFormData({...formData, smicAmount: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-slate-800 font-mono outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Plafond Cotisable CNPS Retraite ({formData.currency})</label>
                <input 
                  type="number" 
                  required
                  value={formData.cnpsPlafond} 
                  onChange={e => setFormData({...formData, cnpsPlafond: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-slate-800 font-mono outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux Cotisation CNPS Salariale (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.cnpsSalarial} 
                  onChange={e => setFormData({...formData, cnpsSalarial: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-emerald-700 outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux CNPS Retraite Patronale (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.cnpsPatronalRetraite} 
                  onChange={e => setFormData({...formData, cnpsPatronalRetraite: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-emerald-700 outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux CNPS Prestations Familiales (PF %)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.cnpsPatronalPF} 
                  onChange={e => setFormData({...formData, cnpsPatronalPF: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-emerald-700 outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux CNPS Accident du Travail (AT %)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.cnpsPatronalAT} 
                  onChange={e => setFormData({...formData, cnpsPatronalAT: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-emerald-700 outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux ITS Patronal (Salariés Nationaux %)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.itsPatronalIvoirien} 
                  onChange={e => setFormData({...formData, itsPatronalIvoirien: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-[#2563EB] outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux ITS Patronal (Salariés Expatriés %)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.itsPatronalExpat} 
                  onChange={e => setFormData({...formData, itsPatronalExpat: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-rose-700 outline-none"
                />
              </div>

              <div className="p-6 bg-ci-bg/50 rounded-2xl border border-ci-border space-y-3">
                <label className="text-[10px] font-black text-ci-muted uppercase">Taux Taxe Apprentissage & Formation (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.taFdfpRate} 
                  onChange={e => setFormData({...formData, taFdfpRate: Number(e.target.value)})}
                  className="w-full px-6 py-4 bg-white border border-ci-border rounded-2xl text-lg font-black text-[#2563EB] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security_api' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-ci-text">Clé d'API Secrète SaaS & Connecteurs ERP</h3>
                  <p className="text-xs text-ci-muted font-bold">Connectez votre SIRH à SAP, Sage, Odoo ou vos applications métiers.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-ci-muted">Clé d'API Live Secret</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      readOnly
                      value={formData.apiKey}
                      className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-700 outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        const newKey = 'sk_live_sirh_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                        setFormData({ ...formData, apiKey: newKey });
                      }}
                      className="px-4 py-4 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase shrink-0 hover:bg-slate-800 transition-all"
                    >
                      Régénérer
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-bold text-amber-900 flex items-center gap-3">
                  <Lock size={18} className="shrink-0 text-amber-600" />
                  <span>Cette clé permet l'importation/exportation des fiches de paie via API Webhook sécurisée.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-red-50 p-8 rounded-[2.5rem] border border-red-100 space-y-6">
              <div className="flex items-center gap-3 text-ci-danger">
                <Shield size={22} />
                <h4 className="text-xs font-black uppercase tracking-widest">Zone de Danger</h4>
              </div>
              <p className="text-xs font-bold text-red-700 leading-relaxed">
                Réinitialisation globale des données de l'organisation.
              </p>
              <button 
                type="button"
                onClick={() => {
                  if (window.confirm("ATTENTION : Êtes-vous ABSOLUMENT certain de vouloir réinitialiser l'application ? Cette action est irréversible.")) {
                    alert("Seul l'administrateur SaaS principal peut effectuer une réinitialisation matérielle.");
                  }
                }}
                className="w-full py-4 bg-white border-2 border-red-200 text-ci-danger rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-ci-danger hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <AlertTriangle size={16} /> Maintenance Système
              </button>
            </div>
          </div>
        )}

        <div className="pt-6 flex justify-end">
          <button 
            type="submit" 
            disabled={saving} 
            className="px-10 py-5 bg-ci-green text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-ci-green/20 hover:bg-ci-greenDark transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Enregistrer Toutes les Configurations SaaS
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
