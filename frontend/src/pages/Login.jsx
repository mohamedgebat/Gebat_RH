import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, HelpCircle, UserCog, User, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-[#E5A110] selection:text-slate-950">
      
      {/* Main GEBAT Card Container (Exact 50/50 Half Screen Split) */}
      <div className="max-w-6xl w-full rounded-[2.5rem] bg-white shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[640px]">
        
        {/* Left Side: 50% Form Container */}
        <div className="p-8 lg:p-12 bg-white text-slate-900 flex flex-col justify-between relative z-10 space-y-6">
          
          {/* Top Logo Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-amber-400/10 p-1.5 rounded-2xl shadow-sm border border-amber-400/40 flex items-center justify-center shrink-0">
                <img src="/gebat_logo.png" alt="GEBAT Logo Officiel" className="h-9 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  GEBAT <span className="text-[#2563EB]">360°</span>
                </h1>
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                  {activeTab === 'admin' ? 'CONSTRUCTION OPERATING SYSTEM — RH' : 'PORTAIL ESPACE SALARIÉ GEBAT'}
                </p>
              </div>
            </div>
          </div>

          {/* Center Hero Headline */}
          <div className="space-y-2 my-1">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight tracking-tight">
              Pilotez vos équipes.<br />
              <span className="text-[#E5A110]">Maîtrisez chaque détail.</span>
            </h2>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              La plateforme intégrée pour gérer vos collaborateurs BTP de la planification à la performance.
            </p>
            <div className="w-12 h-1 bg-[#E5A110] rounded-full mt-2"></div>
          </div>

          {/* Segmented Tab Switcher (RH vs Salarié) */}
          <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErr(null); }}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'admin' 
                  ? 'bg-[#2563EB] text-white shadow-md font-black' 
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <UserCog size={15} />
              Accès RH / Admin
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('employee'); setErr(null); }}
              className={`py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'employee' 
                  ? 'bg-[#2563EB] text-white shadow-md font-black' 
                  : 'text-slate-600 hover:text-slate-900 font-bold'
              }`}
            >
              <User size={15} />
              Espace Salarié
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            
            {/* Field 1: Email / Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {activeTab === 'admin' ? "Adresse e-mail" : "Identifiant Employé GEBAT"}
              </label>
              <div className="relative flex items-center group">
                <Mail className="absolute left-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400"
                  placeholder={activeTab === 'admin' ? "nom@gebat-sa.com" : "employe@gebat-sa.com ou 001"}
                />
              </div>
            </div>

            {/* Field 2: Password + Forgot Link */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Mot de passe</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter votre administrateur GEBAT RH.'); }} className="text-xs text-[#2563EB] hover:underline font-bold">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative flex items-center group">
                <Lock className="absolute left-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400"
                  placeholder="••••••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-bold">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-slate-300 cursor-pointer accent-[#2563EB]"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            {/* Error Display */}
            {err && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-fadeIn">
                <ShieldCheck size={16} className="shrink-0 text-rose-600" />
                <span>{err}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button 
              disabled={loading}
              type="submit" 
              className="w-full py-3.5 bg-gradient-to-r from-[#E5A110] via-[#F59E0B] to-[#D97706] text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>SE CONNECTER</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Badges */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accès rapide Démo GEBAT</span>
              <span className="text-[9px] font-bold text-[#2563EB] flex items-center gap-1">
                <Sparkles size={10} /> 1-Clic
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button 
                type="button" 
                onClick={() => handleFillDemo('admin')}
                className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-slate-800 text-left transition-all"
              >
                <div className="text-[10px] font-black uppercase text-[#2563EB]">Compte RH</div>
                <div className="text-[9px] text-slate-500 font-semibold">admin@sirh.ci</div>
              </button>
              <button 
                type="button" 
                onClick={() => handleFillDemo('employee')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-slate-800 text-left transition-all"
              >
                <div className="text-[10px] font-black uppercase text-amber-600">Employé</div>
                <div className="text-[9px] text-slate-500 font-semibold">employe@sirh.ci</div>
              </button>
            </div>
          </div>

          {/* Bottom Footer Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" /> Connexion sécurisée | GEBAT RH
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Support Technique GEBAT : support@gebat-sa.com'); }} className="text-[#2563EB] font-bold hover:underline flex items-center gap-1">
              Besoin d'aide ? <HelpCircle size={14} />
            </a>
          </div>

        </div>

        {/* Right Side: Exactly 50% Half Screen - Zoomed Out Crisp GEBAT Hero Photo */}
        <div className="relative min-h-[380px] lg:min-h-full overflow-hidden bg-slate-900 flex items-end p-6 lg:p-8 border-l border-slate-200">
          
          {/* Zoomed-Out Crisp Photo Fitting Entire Scene & Subject */}
          <img 
            src="/gebat_hero_bg.jpg" 
            alt="Chantier GEBAT avec le vrai logo et professionnelle souriante en plan large" 
            className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-500"
          />

          {/* Bottom Gradient for Text Overlay Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"></div>

          {/* Overlay Badge at Bottom Right */}
          <div className="relative z-10 bg-slate-900/85 backdrop-blur-md border border-amber-400/40 p-4 rounded-2xl max-w-sm space-y-1 shadow-2xl text-white">
            <div className="flex items-center gap-2 text-xs font-black text-[#E5A110]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A110] animate-pulse"></span> GEBAT RH & Capital Humain
            </div>
            <p className="text-[11px] font-medium text-slate-200">
              Valorisez le capital humain de vos chantiers et infrastructures avec la suite intégrée GEBAT.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
