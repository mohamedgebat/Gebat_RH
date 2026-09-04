import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ForcePasswordChange = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialUserType = location.state?.userType || 'admin';
  const initialIdentifier = location.state?.identifier || '';

  const [userType, setUserType] = useState(initialUserType);
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!identifier || !currentPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Le nouveau mot de passe et la confirmation ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Le nouveau mot de passe doit être différent du mot de passe actuel.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/force-change-password', {
        userType: userType === 'employee' ? 'employee' : 'user',
        identifier,
        currentPassword,
        newPassword
      });

      setSuccess(response.data.message || 'Mot de passe modifié avec succès ! Redirection vers la page de connexion...');

      setTimeout(() => {
        if (userType === 'employee') {
          navigate('/employee-login', { state: { message: 'Mot de passe réinitialisé avec succès. Veuillez vous connecter.' } });
        } else {
          navigate('/login', { state: { message: 'Mot de passe réinitialisé avec succès. Veuillez vous connecter.' } });
        }
      }, 2500);

    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la modification du mot de passe. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ci-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-ci-border shadow-2xl p-8 space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-black text-ci-text tracking-tight uppercase">Premier Accès Sécurisé</h1>
          <p className="text-xs font-bold text-ci-muted">
            Pour votre sécurité, vous devez personnaliser votre mot de passe avant d'accéder au SIRH.
          </p>
        </div>

        {/* Type Switcher */}
        <div className="flex bg-ci-bg p-1.5 rounded-2xl border border-ci-border">
          <button
            type="button"
            onClick={() => setUserType('admin')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              userType !== 'employee' ? 'bg-white text-ci-text shadow-sm' : 'text-ci-muted hover:text-ci-text'
            }`}
          >
            Gestionnaire RH / Admin
          </button>
          <button
            type="button"
            onClick={() => setUserType('employee')}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              userType === 'employee' ? 'bg-white text-ci-text shadow-sm' : 'text-ci-muted hover:text-ci-text'
            }`}
          >
            Portail Employé
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-ci-muted mb-1">
              {userType === 'employee' ? 'Nom d\'utilisateur' : 'Adresse Email'}
            </label>
            <input
              type={userType === 'employee' ? 'text' : 'email'}
              required
              placeholder={userType === 'employee' ? 'ex: kgomez' : 'ex: k.gomez@sirh.ci'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 bg-ci-bg border border-ci-border rounded-2xl text-xs font-bold text-ci-text outline-none focus:ring-2 focus:ring-ci-green/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-ci-muted mb-1">
              Mot de passe actuel / temporaire
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-ci-bg border border-ci-border rounded-2xl text-xs font-bold text-ci-text outline-none focus:ring-2 focus:ring-ci-green/50 pr-10"
              />
              <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ci-muted" />
            </div>
          </div>

          <div className="pt-2 border-t border-ci-border">
            <label className="block text-[10px] font-black uppercase tracking-widest text-ci-muted mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Min. 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-ci-bg border border-ci-border rounded-2xl text-xs font-bold text-ci-text outline-none focus:ring-2 focus:ring-ci-green/50 pr-10"
              />
              <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ci-muted" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-ci-muted mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-ci-bg border border-ci-border rounded-2xl text-xs font-bold text-ci-text outline-none focus:ring-2 focus:ring-ci-green/50 pr-10"
              />
              <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ci-muted" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {loading ? 'Modification en cours...' : 'Valider et réinitialiser'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to={userType === 'employee' ? '/employee-login' : '/login'}
            className="inline-flex items-center gap-2 text-xs font-black text-ci-muted hover:text-ci-text transition-all"
          >
            <ArrowLeft size={14} />
            Retour à la page de connexion
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForcePasswordChange;
