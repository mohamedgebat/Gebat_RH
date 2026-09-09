import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { 
  Users, CheckCircle2, XCircle, Clock, AlertTriangle, 
  Palmtree, DollarSign, Car, Receipt, Filter, Search, 
  MessageSquare, ChevronRight, ShieldCheck, HardHat, Calendar
} from 'lucide-react';

const ManagerHub = () => {
  const { user } = useAuth();
  const { data, refreshData } = useData();
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approvals'); // 'approvals', 'team', 'attendances'
  const [approvalType, setApprovalType] = useState('all'); // 'all', 'leaves', 'advances', 'missions', 'expenses'
  const [commentModal, setCommentModal] = useState({ open: false, type: '', id: '', action: '', comment: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchManagerOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/manager/overview');
      setManagerData(res.data);
    } catch (err) {
      console.error('Erreur chargement Manager Hub:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerOverview();
  }, []);

  const handleDecision = async () => {
    const { type, id, action, currentStatut, comment } = commentModal;
    if (!id || !type || !action) return;

    setActionLoading(true);
    try {
      const isStep2 = currentStatut === 'Validée N+1' || currentStatut === 'En attente RH';
      if (type === 'leave') {
        const statut = action === 'approve' ? (isStep2 ? 'Approuvé' : 'Validée N+1') : 'Refusé';
        await axios.patch(`/api/leaves/${id}`, { statut, commentaire: comment });
      } else if (type === 'advance') {
        const statut = action === 'approve' ? (isStep2 ? 'Accordée' : 'Validée N+1') : 'Refusée';
        await axios.patch(`/api/advances/${id}`, { statut, commentaire: comment });
      } else if (type === 'mission') {
        const statut = action === 'approve' ? (isStep2 ? 'Approuvée' : 'Validée N+1') : 'Refusée';
        const payload = isStep2 
          ? { statut, validation_rh: user?.name || 'Direction RH', commentaires: comment }
          : { statut, validation_n1: user?.name || 'Manager N+1', commentaires: comment };
        await axios.patch(`/api/missions/${id}`, payload);
      } else if (type === 'expense') {
        const statut = action === 'approve' ? (isStep2 ? 'Approuvée' : 'Validée N+1') : 'Refusée';
        const payload = isStep2 
          ? { statut, validation_rh: user?.name || 'Direction RH' }
          : { statut, validation_n1: user?.name || 'Manager N+1' };
        await axios.patch(`/api/expenses/${id}`, payload);
      }

      setCommentModal({ open: false, type: '', id: '', action: '', currentStatut: '', comment: '' });
      await fetchManagerOverview();
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Erreur décision manager:', err);
      alert(err.response?.data?.error || 'Erreur lors de l\'enregistrement de la décision.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingLeaves = managerData?.pendingLeaves || [];
  const pendingAdvances = managerData?.pendingAdvances || [];
  const pendingMissions = managerData?.pendingMissions || [];
  const pendingExpenses = managerData?.pendingExpenses || [];
  const historyMissions = managerData?.historyMissions || [];
  const historyExpenses = managerData?.historyExpenses || [];
  const team = managerData?.team || [];
  const totalPending = pendingLeaves.length + pendingAdvances.length + pendingMissions.length + pendingExpenses.length;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header Manager Hub */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#E5A110]/10 text-[#E5A110] rounded-2xl">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Espace Manager (MSS) & Hub d'Approbation
              </h1>
              <p className="text-xs font-bold text-slate-400">
                Pilotage d'équipe • Workflows de validation multi-niveaux N+1 & RH • Standard SAP HCM & Odoo
              </p>
            </div>
          </div>
        </div>

        {/* Badges Synthèse */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center gap-2 text-xs font-black">
            <Clock size={16} className="text-amber-600" />
            <span>{totalPending} demande(s) en attente</span>
          </div>

          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-2 text-xs font-black">
            <Users size={16} className="text-emerald-600" />
            <span>{team.length} membre(s) supervisé(s)</span>
          </div>
        </div>
      </div>

      {/* Onglets Principaux */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        {[
          { id: 'approvals', label: `Hub Approbations (${totalPending})`, icon: <CheckCircle2 size={16} /> },
          { id: 'history', label: `Historique Validés & Clôturés (${historyMissions.length + historyExpenses.length})`, icon: <ShieldCheck size={16} /> },
          { id: 'team', label: `Mon Équipe (${team.length})`, icon: <Users size={16} /> },
          { id: 'attendances', label: 'Présences du Jour', icon: <Calendar size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENU ONGLET 1 : HUB D'APPROBATIONS MULTI-NIVEAUX */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Sous-filtres de type */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Toutes', count: totalPending },
              { id: 'leaves', label: 'Congés & Permissions', count: pendingLeaves.length },
              { id: 'advances', label: 'Avances sur Salaire', count: pendingAdvances.length },
              { id: 'missions', label: 'Ordres de Mission', count: pendingMissions.length },
              { id: 'expenses', label: 'Notes de Frais', count: pendingExpenses.length },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setApprovalType(f.id)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all ${
                  approvalType === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {totalPending === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-black">
                ✓
              </div>
              <h3 className="text-base font-black text-slate-900">Toutes les demandes sont à jour !</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Aucune demande en attente de votre validation. Les dossiers clôturés sont conservés dans l'Historique Validés.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Congés */}
              {(approvalType === 'all' || approvalType === 'leaves') && pendingLeaves.map(leave => {
                const isStep2 = leave.statut === 'Validée N+1' || leave.statut === 'En attente RH';
                return (
                  <div key={`leave-${leave.id}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-amber-400 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 border ${
                          isStep2 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          <Palmtree size={12} /> Congé {isStep2 ? '(Étape 2 : RH)' : '(Étape 1 : N+1)'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {leave.duree || 1} jour(s)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <EmployeeAvatar src={leave.photo} nom={leave.nom} prenoms={leave.prenoms} size="md" />
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{leave.nom} {leave.prenoms}</h4>
                          <p className="text-[10px] text-slate-500 font-bold">{leave.poste} • {leave.departement}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-700 font-medium">
                        <p><strong>Période :</strong> Du {new Date(leave.debut).toLocaleDateString('fr-FR')} au {new Date(leave.fin).toLocaleDateString('fr-FR')}</p>
                        {leave.motif && <p className="italic text-slate-500 font-normal">"{leave.motif}"</p>}
                        {leave.validation_n1 && <p className="text-[10px] text-emerald-700 font-bold">✓ Étape 1 Validée par : {leave.validation_n1}</p>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'leave', id: leave.id, action: 'reject', currentStatut: leave.statut, comment: '' })}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black transition-colors"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'leave', id: leave.id, action: 'approve', currentStatut: leave.statut, comment: '' })}
                        className={`px-4 py-2 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 ${
                          isStep2 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={14} /> {isStep2 ? 'Valider Étape 2 (RH)' : 'Approuver (N+1)'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 2. Avances */}
              {(approvalType === 'all' || approvalType === 'advances') && pendingAdvances.map(adv => {
                const isStep2 = adv.statut === 'Validée N+1' || adv.statut === 'En attente RH';
                return (
                  <div key={`adv-${adv.id}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-amber-400 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 border ${
                          isStep2 ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          <DollarSign size={12} /> Avance {isStep2 ? '(Étape 2 : RH)' : '(Étape 1 : N+1)'}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-900">
                          {new Intl.NumberFormat('fr-CI').format(adv.montant)} FCFA
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <EmployeeAvatar src={adv.photo} nom={adv.nom} prenoms={adv.prenoms} size="md" />
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{adv.nom} {adv.prenoms}</h4>
                          <p className="text-[10px] text-slate-500 font-bold">{adv.poste} • {adv.departement}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-700 font-medium">
                        <p><strong>Mois de Remboursement :</strong> {adv.moisRemboursement}</p>
                        {adv.motif && <p className="italic text-slate-500 font-normal">"{adv.motif}"</p>}
                        {adv.validation_n1 && <p className="text-[10px] text-emerald-700 font-bold">✓ Étape 1 Validée par : {adv.validation_n1}</p>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'advance', id: adv.id, action: 'reject', currentStatut: adv.statut, comment: '' })}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black transition-colors"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'advance', id: adv.id, action: 'approve', currentStatut: adv.statut, comment: '' })}
                        className={`px-4 py-2 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 ${
                          isStep2 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={14} /> {isStep2 ? 'Valider Étape 2 (RH)' : 'Valider Avance (N+1)'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 3. Missions */}
              {(approvalType === 'all' || approvalType === 'missions') && pendingMissions.map(m => {
                const isStep2 = m.statut === 'Validée N+1' || m.statut === 'En attente RH';
                return (
                  <div key={`mission-${m.id}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 border ${
                          isStep2 ? 'bg-indigo-100 text-indigo-900 border-indigo-300' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          <Car size={12} /> Mission {isStep2 ? '(Étape 2 : RH / Direction)' : '(Étape 1 : Manager N+1)'}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {m.destination}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <EmployeeAvatar src={m.photo} nom={m.nom} prenoms={m.prenoms} size="md" />
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{m.nom} {m.prenoms}</h4>
                          <p className="text-[10px] text-slate-500 font-bold">{m.titre}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-700 font-medium">
                        <p><strong>Dates :</strong> Du {new Date(m.date_debut).toLocaleDateString('fr-FR')} au {new Date(m.date_fin).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Moyen :</strong> {m.moyen_transport} {m.vehicule && `(${m.vehicule})`}</p>
                        {m.avance_frais > 0 && <p><strong>Avance sollicitée :</strong> {new Intl.NumberFormat('fr-CI').format(m.avance_frais)} F CFA</p>}
                        {m.validation_n1 && <p className="text-[10px] text-indigo-700 font-bold">✓ Étape 1 Validée par N+1 : {m.validation_n1}</p>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'mission', id: m.id, action: 'reject', currentStatut: m.statut, comment: '' })}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black transition-colors"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'mission', id: m.id, action: 'approve', currentStatut: m.statut, comment: '' })}
                        className={`px-4 py-2 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 ${
                          isStep2 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={14} /> {isStep2 ? 'Valider Étape 2 (RH)' : 'Valider Étape 1 (N+1)'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 4. Notes de Frais */}
              {(approvalType === 'all' || approvalType === 'expenses') && pendingExpenses.map(exp => {
                const isStep2 = exp.statut === 'Validée N+1' || exp.statut === 'En attente RH';
                return (
                  <div key={`exp-${exp.id}`} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:border-purple-400 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg flex items-center gap-1.5 border ${
                          isStep2 ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}>
                          <Receipt size={12} /> Note de Frais {isStep2 ? '(Étape 2 : RH / Compta)' : '(Étape 1 : Manager N+1)'}
                        </span>
                        <span className="text-xs font-mono font-black text-purple-900">
                          {new Intl.NumberFormat('fr-CI').format(exp.montant)} FCFA
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <EmployeeAvatar src={exp.photo} nom={exp.nom} prenoms={exp.prenoms} size="md" />
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{exp.nom} {exp.prenoms}</h4>
                          <p className="text-[10px] text-slate-500 font-bold">{exp.poste} • {exp.departement}</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1 text-slate-700 font-medium">
                        <p><strong>Catégorie :</strong> {exp.categorie}</p>
                        <p><strong>Date Dépense :</strong> {new Date(exp.date_depense).toLocaleDateString('fr-FR')}</p>
                        {exp.description && <p className="italic text-slate-500">"{exp.description}"</p>}
                        {exp.validation_n1 && <p className="text-[10px] text-purple-700 font-bold">✓ Étape 1 Validée par N+1 : {exp.validation_n1}</p>}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'expense', id: exp.id, action: 'reject', currentStatut: exp.statut, comment: '' })}
                        className="px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-black transition-colors"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => setCommentModal({ open: true, type: 'expense', id: exp.id, action: 'approve', currentStatut: exp.statut, comment: '' })}
                        className={`px-4 py-2 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 ${
                          isStep2 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={14} /> {isStep2 ? 'Valider Étape 2 (RH)' : 'Valider Étape 1 (N+1)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET HISTORIQUE : DOSSIERS VALIDÉS & CLÔTURÉS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase">Historique des Rapports & Demandes Validés</h3>
              <p className="text-xs font-medium text-slate-400">Tous les dossiers ayant passé avec succès les étapes de validation N+1 et RH.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {historyMissions.concat(historyExpenses).length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-bold">
                Aucun dossier validé archivé pour le moment.
              </div>
            ) : (
              historyMissions.concat(historyExpenses).map(item => (
                <div key={`hist-${item.id}`} className="py-3 flex items-center justify-between hover:bg-slate-50 p-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar src={item.photo} nom={item.nom} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.nom} {item.prenoms}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{item.titre || item.categorie || 'Dossier Validé'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase rounded-lg border border-emerald-200">
                      ✓ Clôturé ({item.statut})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : MON ÉQUIPE */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map(emp => (
            <div key={emp.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
              <EmployeeAvatar src={emp.photo} nom={emp.nom} prenoms={emp.prenoms} matricule={emp.matricule} size="lg" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 truncate">{emp.nom} {emp.prenoms}</h4>
                <p className="text-[10px] font-bold text-[#2563EB] truncate uppercase">{emp.poste}</p>
                <p className="text-[9px] text-slate-400 truncate">{emp.departement} {emp.site && `• ${emp.site}`}</p>
                {emp.telephone && <p className="text-[10px] font-mono text-slate-600 mt-1">{emp.telephone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTENU ONGLET 3 : PRÉSENCE DU JOUR */}
      {activeTab === 'attendances' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">
            Pointage en direct de l'équipe ({new Date().toLocaleDateString('fr-FR')})
          </h3>
          <div className="divide-y divide-slate-100">
            {team.map(emp => {
              const att = managerData?.todayAttendances?.find(a => a.empId === emp.id);
              const isPresent = att && (att.statut === 'Présent' || att.heureArrivee);
              return (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar src={emp.photo} nom={emp.nom} size="sm" />
                    <div>
                      <h5 className="text-xs font-black text-slate-900">{emp.nom} {emp.prenoms}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{emp.matricule}</span>
                    </div>
                  </div>

                  <div>
                    {isPresent ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                        Présent (Arrivée {att.heureArrivee || '07:45'})
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        Non pointé
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMATION / COMMENTAIRE DÉCISION */}
      {commentModal.open && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <MessageSquare size={18} className="text-[#2563EB]" />
              <span>{commentModal.action === 'approve' ? 'Confirmation de Validation N+1' : 'Motif de Refus'}</span>
            </h3>

            <p className="text-xs text-slate-500">
              {commentModal.action === 'approve'
                ? "Vous vous apprêtez à valider cette demande. Vous pouvez ajouter une instruction ou observation pour l'employé et la DRH :"
                : "Veuillez préciser le motif du refus pour la traçabilité et l'information du collaborateur :"}
            </p>

            <textarea
              rows={3}
              value={commentModal.comment}
              onChange={(e) => setCommentModal({ ...commentModal, comment: e.target.value })}
              placeholder="Commentaire ou observation (optionnel pour validation, recommandé pour refus)..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#2563EB]/20 outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCommentModal({ open: false, type: '', id: '', action: '', comment: '' })}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-colors uppercase"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDecision}
                disabled={actionLoading}
                className={`px-5 py-2.5 text-white text-xs font-black rounded-xl uppercase shadow-md transition-all ${
                  commentModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'Traitement...' : commentModal.action === 'approve' ? 'Confirmer Validation' : 'Confirmer Refus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerHub;
