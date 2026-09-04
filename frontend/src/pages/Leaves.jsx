import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { Palmtree, Clock, CheckCircle, XCircle, Calendar, AlertTriangle, ListChecks, Filter, Eye, X } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Leaves = () => {
  const { data, loading, refreshData } = useData();
  const [activeTab, setActiveTab] = useState('En attente');
  const [selectedLeave, setSelectedLeave] = useState(null);

  if (loading) return <div className="p-10 text-center text-ci-muted font-bold uppercase tracking-widest animate-pulse">Analyse des flux d'absences...</div>;

  const handleDecision = async (id, status) => {
    if (window.confirm(`Confirmer la décision : ${status} ?`)) {
        try {
            await axios.patch(`/api/leaves/${id}`, { statut: status });
            refreshData();
        } catch (err) {
            alert('Erreur lors de la mise à jour');
        }
    }
  };

  const getEmpName = (id) => {
    const emp = data.employees.find(e => e.id === id);
    return emp ? `${emp.nom} ${emp.prenoms}` : 'Inconnu';
  };

  const filteredLeaves = (data?.leaves || []).filter(l => activeTab === 'Tous' || l.statut === activeTab);

  return (
    <div className="animate-fadeIn space-y-10">
      <PageHeader 
        title="Flux des Absences" 
        subtitle={`${data.leaves.filter(l => l.statut === 'En attente').length} dossiers prioritaires à traiter`}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-ci-orangeLight text-ci-orange rounded-2xl flex items-center justify-center"><Clock size={28} /></div>
            <div>
                <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">En attente</p>
                <h3 className="text-2xl font-black text-ci-text">{data.leaves.filter(l => l.statut === 'En attente').length} dossiers</h3>
            </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-ci-greenLight text-ci-green rounded-2xl flex items-center justify-center"><CheckCircle size={28} /></div>
            <div>
                <p className="text-[10px] font-black text-ci-muted uppercase tracking-widest">Approuvés</p>
                <h3 className="text-2xl font-black text-ci-text">{data.leaves.filter(l => l.statut === 'Approuvé').length} dossiers</h3>
            </div>
        </div>
        <div className="bg-ci-sidebar p-6 rounded-[2rem] text-white shadow-xl flex items-center gap-6">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center"><Calendar size={28} /></div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Absences ce jour</p>
                <h3 className="text-2xl font-black">2 personnes</h3>
            </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-ci-border overflow-hidden">
        <div className="px-8 py-6 bg-ci-bg/30 border-b border-ci-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
                {['En attente', 'Approuvé', 'Refusé', 'Tous'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab ? 'bg-ci-text text-white shadow-lg' : 'bg-white text-ci-muted hover:bg-ci-bg border border-ci-border'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <button className="flex items-center gap-2 text-[10px] font-black text-ci-green uppercase tracking-widest hover:underline">
                <AlertTriangle size={14} className="text-ci-orange" />
                Vérifier les conflits de planning
            </button>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-ci-bg/50 text-[10px] font-black uppercase tracking-widest text-ci-muted">
                    <tr>
                        <th className="px-8 py-6 text-left">Collaborateur</th>
                        <th className="px-8 py-6 text-left">Nature de l'absence</th>
                        <th className="px-8 py-6 text-left">Calendrier Opérationnel</th>
                        <th className="px-8 py-6 text-left">Impact (Jours)</th>
                        <th className="px-8 py-6 text-left">Statut</th>
                        <th className="px-8 py-6 text-center">Détails</th>
                        <th className="px-8 py-6 text-right">Décision RH</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-ci-bg">
                    {filteredLeaves.length === 0 ? (
                        <tr>
                            <td colSpan="7" className="px-8 py-12 text-center text-ci-muted text-xs font-bold uppercase tracking-wider">
                                Aucun dossier de congé trouvé pour cette sélection.
                            </td>
                        </tr>
                    ) : (
                        filteredLeaves.map((l) => (
                            <tr key={l.id} className="hover:bg-ci-bg/30 transition-colors">
                                <td className="px-8 py-6">
                                    <p className="text-sm font-black text-ci-text tracking-tight">{getEmpName(l.empId)}</p>
                                    <p className="text-[10px] font-bold text-ci-muted uppercase mt-0.5 tracking-tighter">Référence DOC-RH-{l.id}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-ci-orange shadow-[0_0_8px_rgba(247,127,0,0.5)]"></div>
                                        <span className="text-xs font-black text-ci-text uppercase tracking-tight">{l.type}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-xs font-bold text-ci-text uppercase tracking-tighter">Du {new Date(l.debut).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}</p>
                                    <p className="text-xs font-bold text-ci-text uppercase tracking-tighter">Au {new Date(l.fin).toLocaleDateString('fr-FR', {day:'numeric', month:'short'})}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-sm font-black text-ci-green bg-ci-greenLight px-3 py-1.5 rounded-xl border border-ci-green/10">
                                        {l.duree} <span className="text-[9px] uppercase font-bold text-ci-muted ml-1">jours</span>
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                                        l.statut === 'Approuvé' ? 'bg-ci-greenLight text-ci-green border-ci-green/20' : 
                                        l.statut === 'Refusé' ? 'bg-red-50 text-ci-danger border-red-100' : 'bg-ci-orangeLight text-ci-orange border-ci-orange/20'
                                    }`}>
                                        {l.statut}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <button 
                                        onClick={() => setSelectedLeave(l)}
                                        className="p-2.5 bg-ci-bg text-ci-info rounded-xl hover:bg-ci-sidebar hover:text-white transition-all shadow-sm flex items-center justify-center mx-auto"
                                        title="Voir les détails"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    {l.statut === 'En attente' ? (
                                        <div className="flex items-center justify-end gap-3">
                                            <button 
                                                onClick={() => handleDecision(l.id, 'Approuvé')}
                                                className="p-3 bg-ci-green text-white rounded-2xl hover:bg-ci-greenDark transition-all shadow-lg shadow-ci-green/20"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDecision(l.id, 'Refusé')}
                                                className="p-3 bg-white border-2 border-red-100 text-ci-danger rounded-2xl hover:bg-red-50 transition-all"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="p-3 bg-ci-bg text-ci-muted rounded-2xl hover:bg-ci-sidebar hover:text-white transition-all">
                                            <ListChecks size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            {filteredLeaves.length === 0 && (
                <div className="p-20 text-center">
                    <p className="text-ci-muted font-black uppercase tracking-widest text-sm italic">Aucun dossier dans cette catégorie</p>
                </div>
            )}
        </div>
      </div>

      {/* Modal Détails Congé */}
      {selectedLeave && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-scaleIn p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tighter uppercase text-ci-sidebar">Détails de l'Absence</h3>
              <button onClick={() => setSelectedLeave(null)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-ci-bg/50 p-6 rounded-3xl">
                <div className="w-16 h-16 bg-gradient-to-br from-ci-orangeLight to-white text-ci-orange rounded-2xl flex items-center justify-center font-black text-xl border border-ci-orange/15">
                  <Palmtree size={28} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-ci-text leading-tight">{getEmpName(selectedLeave.empId)}</h4>
                  <p className="text-xs font-bold text-ci-muted mt-1">Matricule: {data?.employees?.find(e => e.id === selectedLeave.empId)?.matricule || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-ci-bg rounded-2xl">
                  <p className="text-[9px] font-black text-ci-muted uppercase">Type de congé</p>
                  <p className="text-sm font-bold text-ci-text">{selectedLeave.type}</p>
                </div>
                <div className="p-4 bg-ci-bg rounded-2xl">
                  <p className="text-[9px] font-black text-ci-muted uppercase">Statut actuel</p>
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider mt-1 ${
                    selectedLeave.statut === 'Approuvé' ? 'bg-ci-greenLight text-ci-green' : 
                    selectedLeave.statut === 'Refusé' ? 'bg-red-50 text-ci-danger' : 'bg-ci-orangeLight text-ci-orange'
                  }`}>{selectedLeave.statut}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-ci-bg rounded-2xl">
                  <p className="text-[9px] font-black text-ci-muted uppercase">Date de début</p>
                  <p className="text-sm font-bold text-ci-text">{new Date(selectedLeave.debut).toLocaleDateString('fr-CI')}</p>
                </div>
                <div className="p-4 bg-ci-bg rounded-2xl">
                  <p className="text-[9px] font-black text-ci-muted uppercase">Date de fin</p>
                  <p className="text-sm font-bold text-ci-text">{new Date(selectedLeave.fin).toLocaleDateString('fr-CI')}</p>
                </div>
              </div>

              <div className="p-4 bg-ci-bg rounded-2xl">
                <p className="text-[9px] font-black text-ci-muted uppercase">Durée cumulée</p>
                <p className="text-sm font-black text-ci-green">{selectedLeave.duree} jours ouvrables</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase ml-1 text-ci-muted">Motif de la demande</p>
                <div className="w-full px-6 py-4 bg-ci-bg rounded-2xl text-sm font-medium text-ci-text">
                  {selectedLeave.motif || "Aucun motif spécifique renseigné."}
                </div>
              </div>

              {selectedLeave.statut === 'En attente' && (
                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => { handleDecision(selectedLeave.id, 'Refusé'); setSelectedLeave(null); }}
                    className="flex-1 py-4 border-2 border-red-100 text-ci-danger rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all"
                  >
                    Refuser
                  </button>
                  <button 
                    onClick={() => { handleDecision(selectedLeave.id, 'Approuvé'); setSelectedLeave(null); }}
                    className="flex-1 py-4 bg-ci-green text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-ci-greenDark transition-all shadow-lg shadow-ci-green/10"
                  >
                    Approuver
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
