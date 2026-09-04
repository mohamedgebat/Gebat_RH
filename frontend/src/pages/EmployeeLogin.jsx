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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#f8faf9] font-sans selection:bg-[#009E49] selection:text-white">
      
      {/* Left Panel: Dark Emerald Brand & Mission Statement */}
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
                <p className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider">Portail Espace Employé</p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 border border-emerald-800/60 rounded-full text-[10px] font-black uppercase text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 🇨🇮 Espace Salarié
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed">
            Consultez vos bulletins de paie, déposez vos demandes de congés et gérez votre profil RH en toute confidentialité.<br />
            <span className="text-slate-400 italic">Self-service employee portal of Ivory Coast.</span>
          </p>
        </div>

        {/* Center Hero Statement */}
        <div className="relative z-10 my-10 space-y-6">
          <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight max-w-lg tracking-tight">
            Votre espace salarié personnel. <span className="text-emerald-400">Accédez à vos services RH en un clic.</span>
          </h2>

          <div className="pt-4 relative">
            <div className="p-6 bg-slate-900/70 border border-emerald-900/60 rounded-3xl backdrop-blur-md max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" /> Portail Intranet Confidentiel
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full font-black uppercase border border-emerald-800/60">
                  Accès Libre 24/7
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#009E49] to-[#F77F00] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                  🇨🇮
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
          <span className="flex items-center gap-1.5 text-emerald-400/90 font-bold">
            <MapPin className="w-3.5 h-3.5 text-[#009E49]" /> Abidjan, Côte d'Ivoire
          </span>
          <Link to="/login" className="text-emerald-400 hover:text-white font-bold transition-colors flex items-center gap-1 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Accès Admin / RH
          </Link>
        </div>
      </div>

      {/* Right Panel: Clean White Form Container */}
      <div className="flex flex-col justify-between p-6 lg:p-16 relative">
        <div className="max-w-md w-full mx-auto my-auto space-y-8 animate-fadeIn">
          
          {/* Welcome Title Outside Card */}
          <div className="space-y-1 text-left">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenue Salarié</h1>
            <p className="text-xs font-semibold text-slate-500">Veuillez entrer vos identifiants pour vous connecter à votre portail.</p>
          </div>

          {/* Floating White Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Connexion Espace Employé</h2>
              <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-md bg-orange-50 text-[#F77F00] border border-orange-200">
                Portail Salarié
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Field 1: Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nom d'utilisateur / Identifiant</label>
                <div className="relative flex items-center group">
                  <User className="absolute left-4 text-slate-400 group-focus-within:text-[#009E49] transition-colors" size={18} />
                  <input 
                    type="text" 
                    required 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#009E49] focus:ring-2 focus:ring-[#009E49]/20 transition-all placeholder:text-slate-400 placeholder:font-normal"
                    placeholder="ex: employe@sirh.ci ou 001"
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

              {/* Remember Me */}
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
                className="w-full py-4 bg-[#009E49] hover:bg-[#008037] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-700/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>SE CONNECTER À MON PORTAIL</span>
                )}
              </button>
            </form>

            {/* Quick Demo Employee Account Button */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={handleFillDemo} 
                className="w-full flex items-center justify-between p-3 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200 rounded-xl transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 text-[#F77F00] rounded-lg flex items-center justify-center shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-800">Compte Employé Démo</p>
                    <p className="text-[8px] font-bold text-slate-400">employe@sirh.ci / employe</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-[#F77F00] uppercase bg-white px-2.5 py-1 rounded-md border border-orange-200 flex items-center gap-1">
                  <Sparkles size={10} /> Remplir
                </span>
              </button>
            </div>

            {/* Footer Notice */}
            <div className="pt-2 text-center text-xs font-medium text-slate-600">
              Besoin d'aide ? <a href="#" onClick={(e) => { e.preventDefault(); alert('Veuillez contacter le Service des Ressources Humaines de votre établissement.'); }} className="text-[#009E49] font-bold hover:underline">Contactez le service RH</a>
            </div>
          </div>
        </div>

        {/* Bottom Terms & Privacy Links */}
        <div className="text-center text-xs font-medium text-slate-400 pt-6 flex items-center justify-center gap-4">
          <a href="#" className="hover:text-slate-600 transition-colors">Termes d'utilisation</a>
          <span>•</span>
          <a href="#" className="hover:text-slate-600 transition-colors">Politique de confidentialité</a>
        </div>
      </div>

    </div>
  );
};

export default EmployeeLogin;
