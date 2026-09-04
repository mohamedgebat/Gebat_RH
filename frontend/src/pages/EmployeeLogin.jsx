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
    <div className="min-h-screen bg-[#071326] flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-[#E5A110] selection:text-slate-950">
      
      {/* Main GEBAT Card Container (Strict Match to media_1788538059601.png) */}
      <div className="max-w-7xl w-full rounded-[2.5rem] bg-[#0E1E38] shadow-2xl border border-slate-800/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* Left Side: Dark Blue Form Container (6 cols) */}
        <div className="lg:col-span-6 p-8 lg:p-14 bg-[#0E1E38] text-white flex flex-col justify-between relative z-10 space-y-6">
          
          {/* Top Logo Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1.5 rounded-xl shadow-lg border-2 border-[#E5A110] flex items-center justify-center shrink-0">
                <img src="/gebat_logo.png" alt="GEBAT Logo" className="h-8 object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
                  GEBAT <span className="text-[#E5A110]">RH</span>
                </h1>
                <p className="text-[10px] font-black text-[#E5A110]/80 uppercase tracking-widest">
                  PORTAIL ESPACE SALARIÉ GEBAT
                </p>
              </div>
            </div>
          </div>

          {/* Center Hero Headline */}
          <div className="space-y-3 my-2">
            <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              Bienvenue Salarié.<br />
              <span className="text-[#E5A110]">Accédez à vos services RH.</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed">
              Consultez vos bulletins de paie, déposez vos congés et gérez votre carrière en toute confidentialité.
            </p>
            <div className="w-12 h-1 bg-[#E5A110] rounded-full mt-2"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Field 1: Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Identifiant Salarié GEBAT</label>
              <div className="relative flex items-center group">
                <User className="absolute left-4 text-slate-400 group-focus-within:text-[#E5A110] transition-colors" size={18} />
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#172B4D]/80 border border-slate-700/80 rounded-xl text-sm font-semibold text-white outline-none focus:border-[#E5A110] focus:ring-2 focus:ring-[#E5A110]/20 transition-all placeholder:text-slate-500"
                  placeholder="employe@gebat-sa.com ou 001"
                />
              </div>
            </div>

            {/* Field 2: Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Mot de passe</label>
                <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter le Service RH GEBAT.'); }} className="text-xs text-[#E5A110] hover:underline font-semibold">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative flex items-center group">
                <Lock className="absolute left-4 text-slate-400 group-focus-within:text-[#E5A110] transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-[#172B4D]/80 border border-slate-700/80 rounded-xl text-sm font-semibold text-white outline-none focus:border-[#E5A110] focus:ring-2 focus:ring-[#E5A110]/20 transition-all placeholder:text-slate-500"
                  placeholder="••••••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-semibold">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#E5A110] focus:ring-[#E5A110] border-slate-700 cursor-pointer accent-[#E5A110]"
                />
                <span>Se souvenir de moi</span>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-rose-950/80 text-rose-300 p-3.5 rounded-xl text-xs font-bold border border-rose-800 flex items-center gap-2 animate-fadeIn">
                <ShieldCheck size={16} className="shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button 
              disabled={loading}
              type="submit" 
              className="w-full py-4 bg-gradient-to-r from-[#E5A110] via-[#F59E0B] to-[#D97706] text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="pt-2">
            <button 
              type="button" 
              onClick={handleFillDemo}
              className="w-full p-3 bg-[#172B4D]/60 hover:bg-[#172B4D] border border-slate-700/80 hover:border-[#E5A110] rounded-xl text-slate-200 text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] font-black uppercase text-[#E5A110]">Compte Salarié Démo</div>
                <div className="text-[9px] text-slate-400 font-medium">employe@sirh.ci / employe</div>
              </div>
              <span className="text-[9px] font-black text-amber-300 uppercase bg-[#0E1E38] px-2.5 py-1 rounded-md border border-amber-500/40 flex items-center gap-1">
                <Sparkles size={10} /> Remplir
              </span>
            </button>
          </div>

          {/* Bottom Footer Row */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-medium text-slate-400">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-semibold">
              <ArrowLeft size={14} /> Accès Admin / RH
            </Link>
            <a href="#" onClick={(e) => { e.preventDefault(); alert('Support Technique GEBAT : support@gebat-sa.com'); }} className="text-[#E5A110] font-bold hover:underline flex items-center gap-1">
              Besoin d'aide ? <HelpCircle size={14} />
            </a>
          </div>

        </div>

        {/* Right Side: Enhanced Hero Construction Background Image (6 cols) */}
        <div className="lg:col-span-6 relative min-h-[400px] lg:min-h-full overflow-hidden bg-slate-900 flex items-end p-8">
          
          {/* Hero Background Image */}
          <img 
            src="/gebat_hero_bg.jpg" 
            alt="Chantier GEBAT avec professionnel souriant" 
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Smooth Left Fade Gradient Matching media_1788538059601.png */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E1E38] via-[#0E1E38]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1E38]/90 via-transparent to-transparent"></div>

          {/* Overlay Badge at Bottom Right */}
          <div className="relative z-10 bg-slate-900/80 backdrop-blur-md border border-amber-500/40 p-4 rounded-2xl max-w-sm space-y-1 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-black text-[#E5A110]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A110] animate-pulse"></span> Espace Employé GEBAT
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
