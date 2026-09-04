import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCog, User, Globe, MapPin, Sparkles, Building2 } from 'lucide-react';

const Login = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'employee'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      if (activeTab === 'admin') {
        const res = await axios.post('/api/auth/login', { email: username, password });
        
        if (res.data.mustChangePassword) {
          setLoading(false);
          navigate('/force-password-change', { state: { userType: 'admin', identifier: username } });
          return;
        }

        login(res.data);
        setLoading(false);
        if (res.data.role === 'admin' || res.data.role === 'assistant') {
          navigate('/');
        } else {
          navigate('/portal');
        }
      } else {
        // Employee Portal Login
        const res = await axios.post('/api/employee/login', { username, password });
        
        if (res.data.mustChangePassword) {
          setLoading(false);
          navigate('/force-password-change', { state: { userType: 'employee', identifier: username } });
          return;
        }

        const authPayload = {
          ...res.data.employee,
          role: 'employee',
          token: res.data.token
        };

        localStorage.setItem('sirh_auth_user', JSON.stringify(authPayload));
        localStorage.setItem('employee', JSON.stringify(res.data.employee));
        setLoading(false);
        navigate('/portal');
      }
    } catch (error) {
      setErr(error.response?.data?.error || "Identifiants incorrects ou accès non autorisé.");
      setLoading(false);
    }
  };

  const handleFillDemo = (type) => {
    if (type === 'admin') {
      setActiveTab('admin');
      setUsername('admin@sirh.ci');
      setPassword('admin123');
    } else {
      setActiveTab('employee');
      setUsername('employe@sirh.ci');
      setPassword('employe');
    }
    setErr(null);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC] font-sans selection:bg-[#2563EB] selection:text-white">
      
      {/* Left Panel: GEBAT Dark Slate & Gold Brand Panel */}
      <div className="bg-[#0F172A] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        
        {/* Background Texture & Glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E5A110_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#2563EB]/25 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E5A110]/20 rounded-full blur-3xl"></div>

        {/* Top Branding Header */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-2xl shadow-xl border-2 border-[#E5A110] flex items-center justify-center shrink-0">
                <img src="/gebat_logo.png" alt="GEBAT" className="h-9 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  GEBAT <span className="text-[#E5A110]">RH</span>
                </h1>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Plateforme de Gestion RH</p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 border border-amber-500/40 rounded-full text-[10px] font-black uppercase text-amber-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#E5A110] animate-pulse"></span> GEBAT Officiel
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed pt-1">
            Système de Gestion des Ressources Humaines, Pointage & Paie GEBAT.<br />
            <span className="text-slate-400 italic">Your comprehensive enterprise HR solution.</span>
          </p>
        </div>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-10 space-y-6">
          <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight max-w-lg tracking-tight">
            Bienvenue sur votre espace RH sécurisé. <span className="text-[#E5A110]">Optimisez la gestion de vos collaborateurs.</span>
          </h2>

          {/* GEBAT Multi-site Badges */}
          <div className="pt-4 relative">
            <div className="p-6 bg-slate-900/80 border border-amber-500/30 rounded-3xl backdrop-blur-md max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" /> Infrastructure GEBAT Centralisée
                </span>
                <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded-full font-black uppercase border border-amber-600/40">
                  Temps Réel
                </span>
              </div>

              {/* Sites Badges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="flex items-center gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span> Abidjan Plateau
                </div>
                <div className="flex items-center gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> San-Pédro
                </div>
                <div className="flex items-center gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Bouaké
                </div>
                <div className="flex items-center gap-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Yamoussoukro
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-amber-400">
                  <img src="/gebat_logo.png" alt="Gebat" className="w-full h-full object-contain" />
                </div>
                <div className="text-[11px]">
                  <h4 className="font-black text-white">Sécurité SSL 256-bit & CNPS</h4>
                  <p className="text-slate-400 text-[10px]">Conformité Code du Travail & Rémunération</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 text-slate-500 text-[11px] font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-amber-400/90 font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#E5A110]" /> Siège GEBAT, Côte d'Ivoire
          </span>
          <span className="text-slate-400 font-bold bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            GEBAT v2.4 Enterprise Edition
          </span>
        </div>
      </div>

      {/* Right Panel: Clean White Form Container */}
      <div className="flex flex-col justify-between p-6 lg:p-16 relative">
        <div className="max-w-md w-full mx-auto my-auto space-y-8 animate-fadeIn">
          
          {/* Welcome Title */}
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenue sur GEBAT</h1>
            <p className="text-xs font-semibold text-slate-500">Veuillez entrer vos identifiants pour accéder à la plateforme.</p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="bg-slate-200/70 p-1.5 rounded-2xl grid grid-cols-2 gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErr(null); }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin' 
                  ? 'bg-white text-slate-900 shadow-md font-black' 
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <UserCog size={16} className={activeTab === 'admin' ? 'text-[#2563EB]' : ''} />
              Accès Admin / RH
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('employee'); setErr(null); }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'employee' 
                  ? 'bg-white text-slate-900 shadow-md font-black' 
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <User size={16} className={activeTab === 'employee' ? 'text-[#E5A110]' : ''} />
              Espace Salarié
            </button>
          </div>

          {/* Floating White Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {activeTab === 'admin' ? 'Connexion Compte RH GEBAT' : 'Connexion Espace Salarié GEBAT'}
              </h2>
              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${
                activeTab === 'admin' ? 'bg-blue-50 text-[#2563EB] border-blue-200' : 'bg-amber-50 text-[#D97706] border-amber-200'
              }`}>
                {activeTab === 'admin' ? 'Portail RH' : 'Portail Salarié'}
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Field 1: Email / Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {activeTab === 'admin' ? "Email / Nom d'utilisateur" : "Identifiant Employé (ex: 001)"}
                </label>
                <div className="relative flex items-center group">
                  <Mail className="absolute left-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder={activeTab === 'admin' ? "admin@gebat.ci" : "employe@gebat.ci ou 001"}
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mot de passe</label>
                <div className="relative flex items-center group">
                  <Lock className="absolute left-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-slate-300 cursor-pointer accent-[#2563EB]"
                  />
                  <span className="font-semibold text-slate-700">Se souvenir de moi</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter votre administrateur GEBAT RH pour réinitialiser votre mot de passe.'); }} className="font-semibold text-slate-600 hover:text-[#2563EB] transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Error Display */}
              {err && (
                <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-fadeIn">
                  <ShieldCheck size={16} className="shrink-0 text-rose-600" />
                  <span>{err}</span>
                </div>
              )}

              {/* Primary Submit Button */}
              <button 
                disabled={loading}
                type="submit" 
                className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>SE CONNECTER À GEBAT</span>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Switcher */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Démo accès rapide</p>
                <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1">
                  <Sparkles size={10} /> 1-Clic Remplissage
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => handleFillDemo('admin')} 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group ${
                    activeTab === 'admin' ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-blue-100 text-[#2563EB] rounded-lg flex items-center justify-center shrink-0 font-bold text-xs">
                    GE
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-800">Compte RH</p>
                    <p className="text-[8px] font-bold text-slate-400">admin@sirh.ci</p>
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={() => handleFillDemo('employee')} 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group ${
                    activeTab === 'employee' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200 hover:border-amber-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-amber-100 text-[#D97706] rounded-lg flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-800">Employé</p>
                    <p className="text-[8px] font-bold text-slate-400">employe@sirh.ci</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 text-center text-xs font-medium text-slate-600">
              Nouveau sur GEBAT ? <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter la Direction des Ressources Humaines de GEBAT.'); }} className="text-[#2563EB] font-bold hover:underline">Contactez votre administrateur GEBAT</a>
            </div>
          </div>
        </div>

        {/* Bottom Terms & Privacy Links */}
        <div className="text-center text-xs font-medium text-slate-400 pt-6 flex items-center justify-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Termes GEBAT</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Politique de confidentialité</a>
          <span>•</span>
          <span className="text-slate-300 font-semibold">GEBAT RH 2026</span>
        </div>
      </div>

    </div>
  );
};

export default Login;
