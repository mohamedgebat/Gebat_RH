import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { AlertOctagon, Plus, Search, X, Calendar, User, MessageSquare, Printer, Check, Trash2, Edit, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { generateDemandeExplication, generateLettreAvertissement } from '../utils/documentGenerator';

const Disciplinary = () => {
  const { data, loading, refreshData } = useData();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const [newAction, setNewAction] = useState({
    empId: '',
    type: 'Demande d\'explication',
    dateEmission: new Date().toISOString().split('T')[0],
    motif: '',
    statut: 'En attente de réponse'
  });

  const [replyForm, setReplyForm] = useState({
    reponseSalarie: '',
    dateReponse: new Date().toISOString().split('T')[0]
  });

  const [closeForm, setCloseForm] = useState({
    statut: 'Sanctionné',
    sanction: 'Avertissement Écrit',
    dateCloture: new Date().toISOString().split('T')[0]
  });

  // Handle auto-triggering modal if empId is provided in query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const empId = params.get('empId');
    if (empId && data?.employees?.length) {
      setNewAction(prev => ({ ...prev, empId: parseInt(empId) }));
      setShowCreateModal(true);
      // Clean query params so it doesn't reopen on reload
      navigate('/disciplinary', { replace: true });
    }
  }, [location, data, navigate]);

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted">Chargement des procédures...</div>;

  const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
  const actionsList = data?.disciplinaryActions || [];

  const filteredActions = actionsList.filter(act => {
    const emp = (data?.employees || []).find(e => e.id === act.empId);
    const empName = emp ? `${emp.nom} ${emp.prenoms}`.toLowerCase() : '';
    const matchesSearch = empName.includes(searchTerm.toLowerCase()) || 
                          act.motif.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatut === 'Tous' || act.statut === filterStatut;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAction.empId) return alert('Veuillez sélectionner un employé');
    try {
      await axios.post('/api/disciplinary', newAction);
      setShowCreateModal(false);
      setNewAction({
        empId: '',
        type: 'Demande d\'explication',
        dateEmission: new Date().toISOString().split('T')[0],
        motif: '',
        statut: 'En attente de réponse'
      });
      refreshData();
      alert('Demande d\'explication émise avec succès (Délai légal de 48h enclenché)');
    } catch (err) {
      alert('Erreur lors de la création');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/disciplinary/${selectedAction.id}`, {
        reponseSalarie: replyForm.reponseSalarie,
        dateReponse: replyForm.dateReponse,
        statut: 'Répondu'
      });
      setShowReplyModal(false);
      setSelectedAction(null);
      setReplyForm({ reponseSalarie: '', dateReponse: new Date().toISOString().split('T')[0] });
      refreshData();
      alert('Réponse du salarié enregistrée');
    } catch (err) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        statut: closeForm.statut,
        dateCloture: closeForm.dateCloture,
        sanction: closeForm.statut === 'Classé sans suite' ? 'Aucune' : closeForm.sanction
      };
      await axios.patch(`/api/disciplinary/${selectedAction.id}`, payload);
      setShowCloseModal(false);
      setSelectedAction(null);
      refreshData();
      alert('Procédure disciplinaire clôturée');
    } catch (err) {
      alert('Erreur lors de la clôture');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement cette procédure ?')) {
      try {
        await axios.delete(`/api/disciplinary/${id}`);
        refreshData();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handlePrintDE = (act) => {
    const emp = (data?.employees || []).find(e => e.id === act.empId);
    if (!emp) return alert('Employé introuvable');
    generateDemandeExplication(emp, data.settings, { motif: act.motif });
  };

  const handlePrintWarning = (act) => {
    const emp = (data?.employees || []).find(e => e.id === act.empId);
    if (!emp) return alert('Employé introuvable');
    generateLettreAvertissement(emp, data.settings, {
      dateDE: act.dateEmission,
      dateReponse: act.dateReponse,
      motif: act.motif
    });
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Procédures Disciplinaires" 
        subtitle="Conformité Code du travail ivoirien • Demandes d'Explication (D.E.)"
        actions={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-ci-sidebar text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={14} /> Émettre une D.E.
          </button>
        }
      />

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertOctagon size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase">En attente de réponse</p>
            <h3 className="text-2xl font-black text-ci-text">{actionsList.filter(a => a.statut === 'En attente de réponse').length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase">Réponses à analyser</p>
            <h3 className="text-2xl font-black text-ci-text">{actionsList.filter(a => a.statut === 'Répondu').length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-ci-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-ci-danger rounded-2xl flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-ci-muted uppercase">Procédures Sanctionnées</p>
            <h3 className="text-2xl font-black text-ci-text">{actionsList.filter(a => a.statut === 'Sanctionné').length}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-ci-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ci-muted" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom d'employé ou motif..." 
            className="w-full pl-14 pr-6 py-4 bg-ci-bg border-none rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none transition-all" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {['Tous', 'En attente de réponse', 'Répondu', 'Sanctionné', 'Classé sans suite'].map(statut => (
            <button 
              key={statut}
              onClick={() => setFilterStatut(statut)}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatut === statut ? 'bg-ci-sidebar text-white shadow-lg' : 'bg-ci-bg text-ci-muted hover:bg-white border border-transparent hover:border-ci-border'
              }`}
            >
              {statut}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid/Table */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-ci-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ci-bg/50 text-[10px] font-black uppercase tracking-widest text-ci-muted border-b border-ci-border">
              <tr>
                <th className="px-8 py-6 text-left">Employé</th>
                <th className="px-8 py-6 text-left">Date émise</th>
                <th className="px-8 py-6 text-left">Motif de l'infraction</th>
                <th className="px-8 py-6 text-center">Statut</th>
                <th className="px-8 py-6 text-left">Sanction Décidée</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ci-bg text-xs">
              {filteredActions.map((act) => {
                const emp = (data?.employees || []).find(e => e.id === act.empId);
                return (
                  <tr key={act.id} className="hover:bg-ci-bg/20 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-ci-text uppercase">{emp ? `${emp.nom} ${emp.prenoms}` : 'Employé inconnu'}</p>
                      <p className="text-[10px] font-bold text-ci-muted uppercase">{emp ? emp.matricule : '-'} • {emp ? emp.poste : '-'}</p>
                    </td>
                    <td className="px-8 py-6 font-bold text-ci-text">{act.dateEmission}</td>
                    <td className="px-8 py-6 max-w-xs font-bold text-ci-muted truncate" title={act.motif}>{act.motif}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        act.statut === 'En attente de réponse' ? 'bg-amber-100 text-amber-800' :
                        act.statut === 'Répondu' ? 'bg-blue-100 text-blue-800' :
                        act.statut === 'Sanctionné' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {act.statut}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black uppercase text-ci-orange tracking-wider">{act.sanction || '—'}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {act.statut === 'En attente de réponse' && (
                          <button 
                            onClick={() => { setSelectedAction(act); setShowReplyModal(true); }}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold hover:bg-blue-600 hover:text-white rounded-lg transition-colors uppercase tracking-wider text-[9px]"
                          >
                            Réponse
                          </button>
                        )}
                        {act.statut === 'Répondu' && (
                          <button 
                            onClick={() => { setSelectedAction(act); setShowCloseModal(true); }}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-600 hover:text-white rounded-lg transition-colors uppercase tracking-wider text-[9px]"
                          >
                            Clôturer
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrintDE(act)}
                          className="p-2 bg-ci-bg text-ci-text hover:bg-ci-sidebar hover:text-white rounded-lg transition-colors"
                          title="Imprimer Demande d'Explication"
                        >
                          <Printer size={14} />
                        </button>
                        {act.statut === 'Sanctionné' && act.sanction.includes('Avertissement') && (
                          <button 
                            onClick={() => handlePrintWarning(act)}
                            className="p-2 bg-red-50 text-ci-danger hover:bg-ci-danger hover:text-white rounded-lg transition-colors"
                            title="Imprimer Lettre d'Avertissement"
                          >
                            <Printer size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(act.id)}
                          className="p-2 bg-red-50 text-ci-danger hover:bg-ci-danger hover:text-white rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredActions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-ci-muted font-bold italic uppercase">
                    Aucune procédure disciplinaire enregistrée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Emettre une D.E. */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Émettre une D.E. Écrite</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Collaborateur en cause</label>
                <select 
                  required
                  value={newAction.empId}
                  onChange={e => setNewAction({ ...newAction, empId: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">-- Choisir un collaborateur --</option>
                  {activeEmps.map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.matricule})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Type de lettre</label>
                  <select value={newAction.type} onChange={e => setNewAction({...newAction, type: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none">
                    <option>Demande d'explication</option>
                    <option>Avertissement</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Date d'émission</label>
                  <input type="date" required value={newAction.dateEmission} onChange={e => setNewAction({...newAction, dateEmission: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Motifs & Faits reprochés</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Ex: Retards répétitifs, insubordination, absence injustifiée..."
                  value={newAction.motif}
                  onChange={e => setNewAction({...newAction, motif: e.target.value})}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-ci-bg text-ci-text font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-ci-sidebar text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 shadow-md">Émettre la D.E.</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Réponse du Salarié */}
      {showReplyModal && selectedAction && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Enregistrer la Réponse</h3>
                <p className="text-[10px] font-bold text-ci-muted uppercase mt-1">D.E. du {selectedAction.dateEmission}</p>
              </div>
              <button onClick={() => { setShowReplyModal(false); setSelectedAction(null); }} className="p-2 bg-ci-bg rounded-xl"><X /></button>
            </div>
            
            <form onSubmit={handleReplySubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Date de réception de la réponse</label>
                <input type="date" required value={replyForm.dateReponse} onChange={e => setReplyForm({...replyForm, dateReponse: e.target.value})}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Explications écrites du salarié</label>
                <textarea 
                  required
                  rows="5"
                  placeholder="Saisir la justification écrite remise par l'employé..."
                  value={replyForm.reponseSalarie}
                  onChange={e => setReplyForm({...replyForm, reponseSalarie: e.target.value})}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowReplyModal(false); setSelectedAction(null); }} className="flex-1 py-4 bg-ci-bg text-ci-text font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-ci-green text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-ci-greenDark shadow-md">Valider la réponse</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Clôture & Sanction */}
      {showCloseModal && selectedAction && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Décision & Clôture</h3>
                <p className="text-[10px] font-bold text-ci-muted uppercase mt-1">Dossier disciplinaire en cours</p>
              </div>
              <button onClick={() => { setShowCloseModal(false); setSelectedAction(null); }} className="p-2 bg-ci-bg rounded-xl"><X /></button>
            </div>
            
            <form onSubmit={handleCloseSubmit} className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 font-bold space-y-1">
                <p className="uppercase font-black flex items-center gap-1"><AlertTriangle size={14}/> Rappel des faits reprochés :</p>
                <p className="italic">"{selectedAction.motif}"</p>
                <p className="uppercase font-black mt-2">Réponse du salarié :</p>
                <p className="italic">"{selectedAction.reponseSalarie}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Décision RH</label>
                  <select value={closeForm.statut} onChange={e => setCloseForm({...closeForm, statut: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none">
                    <option value="Sanctionné">Sanctionné</option>
                    <option value="Classé sans suite">Classé sans suite (Aucune sanction)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Date de clôture</label>
                  <input type="date" required value={closeForm.dateCloture} onChange={e => setCloseForm({...closeForm, dateCloture: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none" />
                </div>
              </div>

              {closeForm.statut === 'Sanctionné' && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Sanction Retenue</label>
                  <select value={closeForm.sanction} onChange={e => setCloseForm({...closeForm, sanction: e.target.value})}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg border-none rounded-xl text-xs font-bold outline-none">
                    <option>Avertissement Écrit</option>
                    <option>Blâme</option>
                    <option>Mise à pied disciplinaire</option>
                    <option>Licenciement pour faute</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setShowCloseModal(false); setSelectedAction(null); }} className="flex-1 py-4 bg-ci-bg text-ci-text font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-ci-danger text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-700 shadow-md">Clôturer le Dossier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disciplinary;
