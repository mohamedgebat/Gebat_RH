import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, HelpCircle, ArrowLeft, Sparkles } from 'lucide-react';
import axios from 'axios';

const EmployeeLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/employee/login', { username, password });
      
      if (response.data.mustChangePassword) {
        setLoading(false);
        navigate('/force-password-change', { state: { userType: 'employee', identifier: username } });
        return;
      }

      const authPayload = {
        ...response.data.employee,
        role: 'employee',
        token: response.data.token
      };

      localStorage.setItem('sirh_auth_user', JSON.stringify(authPayload));
      localStorage.setItem('employee', JSON.stringify(response.data.employee));
      
      navigate('/portal');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants d\'employé GEBAT incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('employe@sirh.ci');
    setPassword('employe');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/40 to-slate-200 flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-[#E5A110] selection:text-slate-950">
      
      {/* Main GEBAT Card Container (Exact 50/50 Half Screen Split) */}
      <div className="max-w-6xl w-full rounded-[2.5rem] bg-white shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[640px]">
        
        {/* Left Side: 50% Form Container */}
        <div className="p-8 lg:p-12 bg-white text-slate-900 flex flex-col justify-between relative z-10 space-y-6">
          
          {/* Top Logo Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3.5">
              <div className="bg-amber-400/10 p-1.5 rounded-2xl shadow-sm border border-amber-400/40 flex items-center justify-center shrink-0">
                <img src="/gebat_logo.png" alt="GEBAT Logo Officiel" className="h-9 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  GEBAT <span className="text-[#2563EB]">RH</span>
                </h1>
                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                  PORTAIL ESPACE SALARIÉ GEBAT
                </p>
              </div>
            </div>
          </div>

          {/* Center Hero Headline */}
          <div className="space-y-2.5 my-1">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 leading-tight tracking-tight">
              Bienvenue Salarié.<br />
              <span className="text-[#E5A110]">Accédez à vos services RH.</span>
            </h2>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Consultez vos bulletins de paie, déposez vos congés et gérez votre carrière en toute confidentialité.
            </p>
            <div className="w-12 h-1.5 bg-[#E5A110] rounded-full mt-2"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            
            {/* Field 1: Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Identifiant Salarié GEBAT</label>
              <div className="relative flex items-center group">
                <User className="absolute left-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400"
                  placeholder="employe@gebat-sa.com ou 001"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Mot de passe</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter le Service RH GEBAT.'); }} className="text-xs text-[#2563EB] hover:underline font-bold">
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
            {error && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-fadeIn">
                <ShieldCheck size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
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
                  <span>SE CONNECTER À MON PORTAIL</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Button */}
          <div>
            <button 
              type="button" 
              onClick={handleFillDemo}
              className="w-full p-2.5 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl text-slate-900 text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] font-black uppercase text-amber-700">Compte Salarié Démo</div>
                <div className="text-[9px] text-slate-500 font-semibold">employe@sirh.ci / employe</div>
              </div>
              <span className="text-[9px] font-black text-amber-700 uppercase bg-white px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                <Sparkles size={10} /> Remplir
              </span>
            </button>
          </div>

          {/* Bottom Footer Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <Link to="/login" className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-bold">
              <ArrowLeft size={14} /> Accès Admin / RH
            </Link>
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
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A110] animate-pulse"></span> Portail Salarié GEBAT
            </div>
            <p className="text-[11px] font-medium text-slate-200">
              Accédez à vos bulletins de paie, vos demandes de congés et vos plannings en toute simplicité.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default EmployeeLogin;
