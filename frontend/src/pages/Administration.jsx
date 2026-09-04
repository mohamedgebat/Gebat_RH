import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { UserPlus, Shield, UserCheck, Mail, Trash2, Key, UserCog, Edit, X, Lock, Users, RefreshCw, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const Administration = () => {
  const { data, loading, refreshData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'assistant', empId: '' });
  const [editUser, setEditUser] = useState({ name: '', email: '', role: '', status: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted">Chargement des privilèges...</div>;

  // Get employees without user accounts
  const employeesWithoutAccounts = (data.employees || []).filter(emp => 
    !(data.users || []).some(u => u.empId === emp.id)
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/users', newUser);
      setShowModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'assistant', empId: '' });
      refreshData();
      alert('Utilisateur créé avec succès');
    } catch (err) {
      alert('Erreur lors de la création');
    }
  };

  const handleCreateUserFromEmployee = async (empId) => {
    try {
      await axios.post(`/api/users/from-employee/${empId}`);
      setShowEmployeeModal(false);
      refreshData();
      alert('Compte utilisateur créé à partir de l\'employé');
    } catch (err) {
      alert('Erreur lors de la création: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSyncEmployeeStatus = async () => {
    try {
      const response = await axios.post('/api/users/sync-employee-status');
      refreshData();
      alert(response.data.message);
    } catch (err) {
      alert('Erreur lors de la synchronisation');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/${selectedUser.id}`, editUser);
      setShowEditModal(false);
      setSelectedUser(null);
      setEditUser({ name: '', email: '', role: '', status: '' });
      refreshData();
      alert('Utilisateur mis à jour avec succès');
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await axios.patch(`/api/users/${selectedUser.id}/password`, {
        currentPassword: '',
        newPassword: passwordForm.newPassword,
        forceReset: true
      });
      setShowPasswordModal(false);
      setSelectedUser(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      refreshData();
      alert('Mot de passe réinitialisé avec succès');
    } catch (err) {
      alert('Erreur lors de la réinitialisation');
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Supprimer cet accès ?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        refreshData();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUser({ name: user.name, email: user.email, role: user.role, status: user.status });
    setShowEditModal(true);
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Administration" 
        subtitle="Gestion des accès et utilisateurs système"
        actions={
            <div className="flex flex-wrap gap-3">
                <Link to="/audit-logs" className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center gap-2">
                    <ShieldAlert size={14} /> Journal d'Audit
                </Link>
                <button onClick={handleSyncEmployeeStatus} className="bg-ci-info text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2">
                    <RefreshCw size={14} /> Sync Statut
                </button>
                <button onClick={() => setShowEmployeeModal(true)} className="bg-ci-green text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2">
                    <Users size={14} /> Compte Employé
                </button>
                <button onClick={() => setShowModal(true)} className="bg-ci-sidebar text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2">
                    <UserPlus size={14} /> Nouveau Compte
                </button>
            </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-ci-sidebar rounded-2xl flex items-center justify-center text-white"><Shield size={28} /></div>
            <div>
                <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Administrateurs</p>
                <h3 className="text-2xl font-black text-ci-text">{data.users?.filter(u => u.role === 'admin').length}</h3>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-ci-info rounded-2xl flex items-center justify-center text-white"><UserCog size={28} /></div>
            <div>
                <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Assistants RH</p>
                <h3 className="text-2xl font-black text-ci-text">{data.users?.filter(u => u.role === 'assistant').length}</h3>
            </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-ci-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-ci-green rounded-2xl flex items-center justify-center text-white"><UserCheck size={28} /></div>
            <div>
                <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Comptes Employés</p>
                <h3 className="text-2xl font-black text-ci-text">{data.users?.filter(u => u.role === 'employee').length}</h3>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-ci-border overflow-hidden">
        <table className="w-full text-sm">
            <thead className="bg-ci-bg/50 text-[10px] font-black uppercase tracking-widest text-ci-muted">
                <tr>
                    <th className="px-8 py-5 text-left">Utilisateur</th>
                    <th className="px-8 py-5 text-left">Rôle</th>
                    <th className="px-8 py-5 text-left">Statut</th>
                    <th className="px-8 py-5 text-left">Création</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-ci-bg">
                {data.users?.map(u => (
                    <tr key={u.id} className="hover:bg-ci-bg/20 transition-colors">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center font-black text-ci-sidebar uppercase">{u.name?.charAt(0) || '?'}</div>
                                <div>
                                    <p className="font-bold text-ci-text">{u.name}</p>
                                    <p className="text-[10px] font-bold text-ci-muted uppercase">{u.email}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                                u.role === 'admin' ? 'bg-ci-sidebar text-white' : 
                                u.role === 'assistant' ? 'bg-ci-info text-white' : 'bg-ci-bg text-ci-text'
                            }`}>{u.role}</span>
                        </td>
                        <td className="px-8 py-5">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-ci-green uppercase"><div className="w-1.5 h-1.5 rounded-full bg-ci-green"></div> {u.status}</span>
                        </td>
                        <td className="px-8 py-5 text-ci-muted font-bold text-[10px] uppercase">{new Date(u.dateCreated).toLocaleDateString()}</td>
                        <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openEditModal(u)} className="p-2 hover:bg-ci-bg rounded-lg text-ci-muted"><Edit size={16} /></button>
                                <button onClick={() => openPasswordModal(u)} className="p-2 hover:bg-ci-bg rounded-lg text-ci-muted"><Key size={16} /></button>
                                {u.email !== 'admin@sirh.ci' && (
                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-50 text-ci-danger rounded-lg"><Trash2 size={16} /></button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Modal Création */}
      {showModal && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-scaleIn p-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase mb-8">Nouveau Compte</h3>
                  <form onSubmit={handleCreateUser} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nom Complet</label>
                          <input type="text" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase ml-1">Email</label>
                            <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase ml-1">Mot de passe</label>
                            <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Rôle Système</label>
                          <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="admin">Administrateur (Total)</option>
                              <option value="assistant">Assistant RH (Limité)</option>
                              <option value="employee">Collaborateur (Portail)</option>
                          </select>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Créer l'accès</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Modification */}
      {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-scaleIn p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">Modifier l'Utilisateur</h3>
                    <button onClick={() => setShowEditModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>
                  <form onSubmit={handleEditUser} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nom Complet</label>
                          <input type="text" required value={editUser.name} onChange={e => setEditUser({...editUser, name: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Email</label>
                          <input type="email" required value={editUser.email} onChange={e => setEditUser({...editUser, email: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase ml-1">Rôle</label>
                            <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                                <option value="admin">Administrateur</option>
                                <option value="assistant">Assistant RH</option>
                                <option value="employee">Collaborateur</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase ml-1">Statut</label>
                            <select value={editUser.status} onChange={e => setEditUser({...editUser, status: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                                <option value="Actif">Actif</option>
                                <option value="Inactif">Inactif</option>
                            </select>
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Mettre à jour</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Réinitialisation Mot de Passe */}
      {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-scaleIn p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">Réinitialiser le Mot de Passe</h3>
                    <button onClick={() => setShowPasswordModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>
                  <p className="text-sm font-bold text-ci-muted mb-6">Utilisateur: {selectedUser.name} ({selectedUser.email})</p>
                  <form onSubmit={handleResetPassword} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nouveau Mot de Passe</label>
                          <input type="password" required value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Confirmer le Mot de Passe</label>
                          <input type="password" required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-sidebar/10 outline-none" />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-4 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest">Annuler</button>
                        <button type="submit" className="flex-1 py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">
                            <Lock size={16} /> Réinitialiser
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Création Compte Employé */}
      {showEmployeeModal && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-scaleIn p-10">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">Créer Compte depuis Employé</h3>
                    <button onClick={() => setShowEmployeeModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>
                  <p className="text-sm font-bold text-ci-muted mb-6">Sélectionnez un employé pour créer son compte d'accès automatiquement</p>
                  
                  {employeesWithoutAccounts.length === 0 ? (
                      <div className="text-center py-10">
                          <p className="text-sm font-bold text-ci-muted">Tous les employés ont déjà un compte utilisateur</p>
                      </div>
                  ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                          {employeesWithoutAccounts.map(emp => (
                              <div key={emp.id} className="flex items-center justify-between p-4 bg-ci-bg rounded-2xl border border-ci-border hover:border-ci-green transition-colors">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-ci-greenLight rounded-xl flex items-center justify-center font-black text-ci-green uppercase">
                                          {emp.nom?.charAt(0)}{emp.prenoms?.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-ci-text">{emp.nom} {emp.prenoms}</p>
                                          <p className="text-[10px] font-bold text-ci-muted uppercase">{emp.poste} • {emp.departement}</p>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={() => handleCreateUserFromEmployee(emp.id)}
                                      className="px-4 py-2 bg-ci-green text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-ci-greenDark transition-all"
                                  >
                                      Créer Compte
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Administration;
