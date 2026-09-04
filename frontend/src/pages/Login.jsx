import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, UserCog, User, Globe, MapPin, Sparkles, CheckCircle2, Building2 } from 'lucide-react';

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#f8faf9] font-sans selection:bg-[#009E49] selection:text-white">
      
      {/* Left Panel: Dark Emerald Brand & Mission Statement (Strict Match to media_1788373689320.jpg) */}
      <div className="bg-[#051811] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-emerald-950">
        
        {/* Background Geometric Grid & World Map Texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#009E49_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#009E49]/25 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#F77F00]/20 rounded-full blur-3xl"></div>

        {/* Top Branding Header */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#009E49] to-[#008037] rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/40 shrink-0">
                <span className="text-xl tracking-tighter">SIRH</span>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  SIRH<span className="text-[#009E49]">-CIV</span>
                </h1>
                <p className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider">République de Côte d'Ivoire</p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800/60 rounded-full text-[10px] font-black uppercase text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 🇨🇮 Éléphant RH
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed">
            Système d'Information des Ressources Humaines – Côte d'Ivoire.<br />
            <span className="text-slate-400 italic">Your modern HR solution in Ivory Coast.</span>
          </p>
        </div>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-10 space-y-6">
          <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight max-w-lg tracking-tight">
            Bienvenue sur votre espace RH sécurisé. <span className="text-emerald-400">Transformez la gestion de vos talents.</span>
          </h2>

          {/* Multi-site Location Nodes Container */}
          <div className="pt-4 relative">
            <div className="p-6 bg-slate-900/70 border border-emerald-900/60 rounded-3xl backdrop-blur-md max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" /> Réseau National Multi-Sites
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase border border-emerald-800/60">
                  4 Pôles Connectés
                </span>
              </div>

              {/* Sites Badges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Abidjan Plateau
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span> San-Pédro Port
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Bouaké Centre
                </div>
                <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-orange-400"></span> Yamoussoukro
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#009E49] to-[#F77F00] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                  🇨🇮
                </div>
                <div className="text-[11px]">
                  <h4 className="font-black text-white">Sécurité & Conformité CNPS</h4>
                  <p className="text-slate-400 text-[10px]">Cryptage SSL 256-bit • Sauvegarde Automatique</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 text-slate-500 text-[11px] font-medium flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400/90 font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#009E49]" /> Abidjan Plateau, Côte d'Ivoire
          </span>
          <span className="text-slate-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-900">
            v2.4 Enterprise Edition
          </span>
        </div>
      </div>

      {/* Right Panel: Clean White Form Container (Strict Match to media_1788373689320.jpg) */}
      <div className="flex flex-col justify-between p-6 lg:p-16 relative">
        <div className="max-w-md w-full mx-auto my-auto space-y-8 animate-fadeIn">
          
          {/* Welcome Title Outside Card */}
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenue</h1>
            <p className="text-xs font-semibold text-slate-500">Veuillez entrer vos identifiants pour accéder à SIRH-CIV.</p>
          </div>

          {/* Segmented Tab Switcher (Admin RH vs Employé) */}
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
              <UserCog size={16} className={activeTab === 'admin' ? 'text-[#009E49]' : ''} />
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
              <User size={16} className={activeTab === 'employee' ? 'text-[#F77F00]' : ''} />
              Espace Salarié
            </button>
          </div>

          {/* Floating White Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                {activeTab === 'admin' ? 'Connexion à votre compte RH' : 'Connexion Espace Employé'}
              </h2>
              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${
                activeTab === 'admin' ? 'bg-emerald-50 text-[#009E49] border-emerald-200' : 'bg-orange-50 text-[#F77F00] border-orange-200'
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
                  <Mail className="absolute left-4 text-slate-400 group-focus-within:text-[#009E49] transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#009E49] focus:ring-2 focus:ring-[#009E49]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder={activeTab === 'admin' ? "example@sirhciv.ci" : "employe@sirh.ci ou 001"}
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mot de passe</label>
                <div className="relative flex items-center group">
                  <Lock className="absolute left-4 text-slate-400 group-focus-within:text-[#009E49] transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#009E49] focus:ring-2 focus:ring-[#009E49]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
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

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#009E49] focus:ring-[#009E49] border-slate-300 cursor-pointer accent-[#009E49]"
                  />
                  <span className="font-semibold text-slate-700">Se souvenir de moi</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter votre administrateur RH pour réinitialiser votre mot de passe.'); }} className="font-semibold text-slate-600 hover:text-[#009E49] transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Error Message Display */}
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
                className="w-full py-4 bg-[#009E49] hover:bg-[#008037] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>SE CONNECTER</span>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Switcher */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Démo accès rapide</p>
                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                  <Sparkles size={10} /> 1-Clic Remplissage
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => handleFillDemo('admin')} 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left group ${
                    activeTab === 'admin' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-emerald-100 text-[#009E49] rounded-lg flex items-center justify-center shrink-0">
                    <UserCog size={16} />
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
                    activeTab === 'employee' ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-500/20' : 'bg-slate-50 border-slate-200 hover:border-orange-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-orange-100 text-[#F77F00] rounded-lg flex items-center justify-center shrink-0">
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
              Nouveau sur SIRH-CIV ? <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter la Direction des Ressources Humaines de votre entreprise.'); }} className="text-[#009E49] font-bold hover:underline">Contactez votre administrateur RH</a>
            </div>
          </div>
        </div>

        {/* Bottom Terms & Privacy Links */}
        <div className="text-center text-xs font-medium text-slate-400 pt-6 flex items-center justify-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Termes d'utilisation</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Politique de confidentialité</a>
          <span>•</span>
          <span className="text-slate-300 font-semibold">République de Côte d'Ivoire</span>
        </div>
      </div>

    </div>
  );
};

export default Login;
