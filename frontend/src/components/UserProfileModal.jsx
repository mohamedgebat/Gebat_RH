import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, User, Mail, Phone, Lock, Camera, Trash2, CheckCircle2, 
  AlertCircle, ShieldCheck, KeyRound, Eye, EyeOff, Save, Loader2 
} from 'lucide-react';
import EmployeeAvatar from './EmployeeAvatar';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { compressImage } from '../utils/imageCompressor';

const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { refreshData } = useData();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password' | 'account'
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    telephone: '',
    photo: ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        photo: user.photo || ''
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setStatusMessage({ type: '', text: '' });
      setActiveTab('profile');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
      setProfileForm(prev => ({ ...prev, photo: compressed }));
      
      // Auto-save photo to server immediately
      const res = await axios.patch('/api/profile/photo', { photo: compressed });
      if (res.data?.success) {
        updateUser({ photo: compressed });
        if (refreshData) await refreshData();
        setStatusMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
      }
    } catch (err) {
      console.error('Erreur compression/upload photo:', err);
      setStatusMessage({ type: 'error', text: 'Erreur lors du traitement de la photo.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Voulez-vous vraiment retirer votre photo de profil ?')) return;

    setUploadingPhoto(true);
    try {
      await axios.patch('/api/profile/photo', { photo: null });
      setProfileForm(prev => ({ ...prev, photo: '' }));
      updateUser({ photo: null });
      if (refreshData) await refreshData();
      setStatusMessage({ type: 'success', text: 'Photo de profil retirée.' });
    } catch (err) {
      console.error('Erreur suppression photo:', err);
      setStatusMessage({ type: 'error', text: 'Erreur lors de la suppression de la photo.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setStatusMessage({ type: 'error', text: 'Le nom et l\'adresse email sont obligatoires.' });
      return;
    }

    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const res = await axios.put('/api/profile', {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        telephone: profileForm.telephone.trim(),
        photo: profileForm.photo
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      if (refreshData) await refreshData();

      setStatusMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
      setTimeout(() => {
        setStatusMessage({ type: '', text: '' });
      }, 4000);
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Erreur lors de la mise à jour du profil.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Veuillez remplir tous les champs de mot de passe.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Les deux nouveaux mots de passe ne correspondent pas.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    setLoading(true);

    try {
      const res = await axios.patch('/api/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (res.data?.success) {
        setStatusMessage({ type: 'success', text: 'Mot de passe modifié avec succès !' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setStatusMessage({ type: '', text: '' });
        }, 4000);
      }
    } catch (err) {
      console.error('Erreur modification mot de passe:', err);
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Erreur lors du changement de mot de passe.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: 'bg-slate-200' };
    if (pwd.length < 6) return { level: 1, label: 'Trop court (min. 6 car.)', color: 'bg-red-500 text-red-600' };
    
    let strength = 0;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;

    if (strength <= 2) return { level: 2, label: 'Moyen', color: 'bg-amber-500 text-amber-600' };
    if (strength === 3) return { level: 3, label: 'Bon', color: 'bg-blue-500 text-blue-600' };
    return { level: 4, label: 'Excellent & Sécurisé', color: 'bg-emerald-500 text-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 sm:px-8 py-6 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <EmployeeAvatar
                src={profileForm.photo || user?.photo}
                nom={profileForm.name || user?.name || 'Utilisateur'}
                size="md"
                className="ring-4 ring-white/20 shadow-xl"
              />
              <label 
                className="absolute -bottom-1 -right-1 p-1.5 bg-[#2563EB] text-white rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-all"
                title="Changer ma photo"
              >
                <Camera size={12} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                  disabled={uploadingPhoto} 
                />
              </label>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">{profileForm.name || user?.name}</h3>
                <ShieldCheck size={18} className="text-emerald-400" />
              </div>
              <p className="text-xs font-semibold text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-[#E5A110]">
                  {user?.role === 'admin' ? 'Administrateur RH' : user?.role === 'assistant' ? 'Assistant RH' : 'Collaborateur'}
                </span>
                <span>•</span>
                <span>{profileForm.email || user?.email}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage.text && (
          <div className={`px-6 py-3 text-xs font-bold flex items-center gap-2 shrink-0 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : 'bg-red-50 text-red-800 border-b border-red-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> : <AlertCircle size={16} className="shrink-0 text-red-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 sm:px-8 gap-2 shrink-0 overflow-x-auto">
          {[
            { id: 'profile', label: 'Mon Profil & Coordonnées', icon: <User size={15} /> },
            { id: 'password', label: 'Sécurité & Mot de Passe', icon: <Lock size={15} /> },
            { id: 'account', label: 'Informations du Compte', icon: <KeyRound size={15} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setStatusMessage({ type: '', text: '' }); }}
              className={`flex items-center gap-2 py-3.5 px-3 sm:px-4 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Mon Profil */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              
              {/* Photo Management Banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <EmployeeAvatar
                    src={profileForm.photo}
                    nom={profileForm.name}
                    size="lg"
                    className="shadow-md"
                  />
                  <div>
                    <p className="text-xs font-black text-slate-900">Photo de profil officielle</p>
                    <p className="text-[11px] font-medium text-slate-500">Visible dans l'en-tête, les fiches et les documents RH.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 shadow-sm">
                    <Camera size={14} /> {uploadingPhoto ? 'Optimisation...' : 'Modifier la photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                  </label>
                  {profileForm.photo && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Supprimer la photo"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <User size={13} className="text-[#2563EB]" /> Nom complet & Prénoms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] outline-none transition-all"
                    placeholder="Ex: Kouamé Jean-Baptiste"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Mail size={13} className="text-[#2563EB]" /> Email de connexion <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] outline-none transition-all"
                    placeholder="nom@gebat-sa.ci"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Phone size={13} className="text-[#2563EB]" /> Numéro de Téléphone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.telephone}
                    onChange={(e) => setProfileForm({ ...profileForm, telephone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] outline-none transition-all"
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>

              </div>

              {/* Submit Profile Form */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{loading ? 'Enregistrement...' : 'Enregistrer mon profil'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: Sécurité & Mot de Passe */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                  <Lock size={14} className="text-amber-600" /> Sécurité des Identifiants
                </div>
                <p className="text-xs font-medium mt-1 opacity-90">
                  Pour des raisons de conformité et de sécurité, utilisez un mot de passe robuste combinant lettres, chiffres et caractères spéciaux.
                </p>
              </div>

              <div className="space-y-4 max-w-lg">
                
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Mot de passe actuel <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] outline-none pr-12 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] outline-none pr-12 transition-all"
                      placeholder="Min. 6 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordForm.newPassword && (
                    <div className="pt-2 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 rounded-full ${pwdStrength.level >= 1 ? pwdStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 rounded-full ${pwdStrength.level >= 2 ? pwdStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 rounded-full ${pwdStrength.level >= 3 ? pwdStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 rounded-full ${pwdStrength.level >= 4 ? pwdStrength.color.split(' ')[0] : 'bg-slate-200'}`} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-wider ${pwdStrength.color.split(' ')[1] || 'text-slate-500'}`}>
                        Niveau : {pwdStrength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] outline-none pr-12 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Submit Password Form */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  <span>{loading ? 'Mise à jour...' : 'Modifier mon mot de passe'}</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 3: Informations du Compte */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Identifiant Système (ID)</p>
                  <p className="text-base font-black text-slate-900 mt-1">#{user?.id}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rôle & Privilèges</p>
                  <p className="text-base font-black text-[#2563EB] mt-1 capitalize">{user?.role || 'Collaborateur'}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Statut du Compte</p>
                  <p className="text-base font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {user?.status || 'Actif'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Entreprise / Société</p>
                  <p className="text-base font-black text-slate-900 mt-1">GEBAT SA</p>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default UserProfileModal;
