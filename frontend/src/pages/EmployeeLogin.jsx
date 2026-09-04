import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ShieldCheck, Globe, MapPin, ArrowLeft, UserCog, Sparkles } from 'lucide-react';
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
      setError(err.response?.data?.error || 'Identifiants d\'employé incorrects.');
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#F8FAFC] font-sans selection:bg-[#2563EB] selection:text-white">
      
      {/* Left Panel: GEBAT Dark Slate & Gold Brand Panel */}
      <div className="bg-[#0F172A] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        
        {/* Background Texture */}
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
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Portail Espace Salarié</p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-amber-500/40 rounded-full text-[10px] font-black uppercase text-amber-300">
              <span className="w-2 h-2 rounded-full bg-[#E5A110] animate-pulse"></span> Salarié GEBAT
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed">
            Consultez vos bulletins de paie, déposez vos demandes de congés et gérez votre profil RH GEBAT.<br />
            <span className="text-slate-400 italic">Self-service GEBAT employee portal.</span>
          </p>
        </div>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-10 space-y-6">
          <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight max-w-lg tracking-tight">
            Votre espace salarié personnel. <span className="text-[#E5A110]">Accédez à vos services RH en un clic.</span>
          </h2>

          <div className="pt-4 relative">
            <div className="p-6 bg-slate-900/80 border border-amber-500/30 rounded-3xl backdrop-blur-md max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" /> Portail Intranet GEBAT
                </span>
                <span className="text-[10px] bg-amber-950/80 text-amber-300 px-2.5 py-1 rounded-full font-black uppercase border border-amber-600/40">
                  Accès Libre 24/7
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shrink-0 border border-amber-400">
                  <img src="/gebat_logo.png" alt="Gebat" className="w-full h-full object-contain" />
                </div>
                <div className="text-[11px]">
                  <h4 className="font-black text-white">Bulletins, Demandes & Pointages</h4>
                  <p className="text-slate-400 text-[10px]">Accès fluide sur Ordinateur, Tablette & Mobile</p>
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
          <Link to="/login" className="text-blue-400 hover:text-white font-bold transition-colors flex items-center gap-1 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            <ArrowLeft className="w-3.5 h-3.5" /> Accès Admin / RH
          </Link>
        </div>
      </div>

      {/* Right Panel: Clean White Form Container */}
      <div className="flex flex-col justify-between p-6 lg:p-16 relative">
        <div className="max-w-md w-full mx-auto my-auto space-y-8 animate-fadeIn">
          
          {/* Welcome Title */}
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenue Salarié GEBAT</h1>
            <p className="text-xs font-semibold text-slate-500">Veuillez entrer vos identifiants pour vous connecter à votre portail.</p>
          </div>

          {/* Floating White Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Connexion Espace Salarié</h2>
              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-amber-50 text-[#D97706] border border-amber-200">
                Portail Salarié
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Field 1: Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nom d'utilisateur / Identifiant</label>
                <div className="relative flex items-center group">
                  <User className="absolute left-4 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="ex: employe@sirh.ci ou 001"
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
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-rose-50 text-rose-700 p-3.5 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-2 animate-fadeIn">
                  <ShieldCheck size={16} className="shrink-0 text-rose-600" />
                  <span>{error}</span>
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
                  <span>SE CONNECTER À MON PORTAIL GEBAT</span>
                )}
              </button>
            </form>

            {/* Quick Demo Employee Account Button */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleFillDemo} 
                className="w-full flex items-center justify-between p-3 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200 rounded-xl transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 text-[#D97706] rounded-lg flex items-center justify-center shrink-0 font-bold text-xs">
                    GE
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-800">Compte Salarié Démo</p>
                    <p className="text-[8px] font-bold text-slate-400">employe@sirh.ci / employe</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-[#D97706] uppercase bg-white px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                  <Sparkles size={10} /> Remplir
                </span>
              </button>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 text-center text-xs font-medium text-slate-600">
              Besoin d'aide ? <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter le Service des Ressources Humaines de GEBAT.'); }} className="text-[#2563EB] font-bold hover:underline">Contactez le service RH GEBAT</a>
            </div>
          </div>
        </div>

        {/* Bottom Terms & Privacy Links */}
        <div className="text-center text-xs font-medium text-slate-400 pt-6 flex items-center justify-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Termes GEBAT</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Politique de confidentialité</a>
        </div>
      </div>

    </div>
  );
};

export default EmployeeLogin;
