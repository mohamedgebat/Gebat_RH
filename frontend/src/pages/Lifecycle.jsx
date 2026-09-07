import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { 
  UserPlus, UserMinus, CheckCircle2, Circle, Clock, 
  Shield, HardHat, Laptop, FileText, Calculator, Printer, 
  Trash2, Plus, Download, AlertTriangle, ChevronRight, DollarSign
} from 'lucide-react';

const Lifecycle = () => {
  const { data, refreshData } = useData();
  const employees = data?.employees || [];
  
  const [activeTab, setActiveTab] = useState('onboarding'); // 'onboarding', 'offboarding', 'stc-calculator'
  const [onboardingTasks, setOnboardingTasks] = useState([]);
  const [offboardingRecords, setOffboardingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Onboarding Task State
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    empId: '',
    titre: '',
    categorie: 'EPI & Sécurité',
    description: '',
    echeance: '',
    responsable_action: 'RH'
  });

  // STC Calculator State
  const [selectedStcEmpId, setSelectedStcEmpId] = useState('');
  const [stcForm, setStcForm] = useState({
    dateDepart: new Date().toISOString().split('T')[0],
    motifDepart: 'Fin de Contrat CDD',
    preavisEffectue: true,
    joursPresenceMois: 30,
    deductions: 0
  });
  const [stcResult, setStcResult] = useState(null);
  const [calculatingStc, setCalculatingStc] = useState(false);
  const [savingOffboarding, setSavingOffboarding] = useState(false);

  const fetchLifecycleData = async () => {
    try {
      setLoading(true);
      const [resOnboarding, resOffboarding] = await Promise.all([
        axios.get('/api/lifecycle/onboarding'),
        axios.get('/api/lifecycle/offboarding')
      ]);
      setOnboardingTasks(resOnboarding.data || []);
      setOffboardingRecords(resOffboarding.data || []);
    } catch (err) {
      console.error('Erreur chargement cycle de vie:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLifecycleData();
  }, []);

  const handleToggleTask = async (task) => {
    const nextStatut = task.statut === 'Fait' ? 'À faire' : 'Fait';
    try {
      await axios.patch(`/api/lifecycle/onboarding/${task.id}`, {
        statut: nextStatut,
        date_realisation: nextStatut === 'Fait' ? new Date().toISOString().split('T')[0] : null
      });
      fetchLifecycleData();
    } catch (err) {
      console.error('Erreur mise à jour tâche:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/lifecycle/onboarding', newTaskForm);
      setNewTaskModal(false);
      setNewTaskForm({
        empId: '',
        titre: '',
        categorie: 'EPI & Sécurité',
        description: '',
        echeance: '',
        responsable_action: 'RH'
      });
      fetchLifecycleData();
    } catch (err) {
      console.error('Erreur création tâche:', err);
      alert(err.response?.data?.error || 'Erreur création tâche');
    }
  };

  const handleCalculateStc = async () => {
    if (!selectedStcEmpId) return;
    setCalculatingStc(true);
    try {
      const res = await axios.post('/api/lifecycle/stc-calculate', {
        empId: selectedStcEmpId,
        ...stcForm
      });
      setStcResult(res.data.calculation);
    } catch (err) {
      console.error('Erreur calcul STC:', err);
    } finally {
      setCalculatingStc(false);
    }
  };

  const handleSaveOffboarding = async () => {
    if (!selectedStcEmpId || !stcResult) return;
    setSavingOffboarding(true);
    try {
      await axios.post('/api/lifecycle/offboarding', {
        empId: selectedStcEmpId,
        date_depart: stcForm.dateDepart,
        motif_depart: stcForm.motifDepart,
        preavis_effectue: stcForm.preavisEffectue,
        mois_preavis: stcResult.moisPreavis,
        stc_salaire_presence: stcResult.stc_salaire_presence,
        stc_conges_payes: stcResult.stc_conges_payes,
        stc_preavis: stcResult.stc_preavis,
        stc_indemnite_rupture: stcResult.stc_indemnite_rupture,
        stc_prorata_gratification: stcResult.stc_prorata_gratification,
        stc_deductions: stcResult.stc_deductions,
        stc_total_net: stcResult.stc_total_net,
        restitution_materiel: 1,
        entretien_depart: 1,
        certificat_emis: 1
      });

      alert('Dossier de départ et Solde de Tout Compte enregistrés avec succès !');
      fetchLifecycleData();
      if (refreshData) refreshData();
      setActiveTab('offboarding');
    } catch (err) {
      console.error('Erreur enregistrement offboarding:', err);
      alert(err.response?.data?.error || 'Erreur enregistrement dossier départ');
    } finally {
      setSavingOffboarding(false);
    }
  };

  const selectedEmployee = employees.find(e => String(e.id) === String(selectedStcEmpId));

  const handlePrintStc = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#2563EB]/10 text-[#2563EB] rounded-2xl">
              <UserPlus size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Cycle de Vie Collaborateur : Onboarding & Offboarding
              </h1>
              <p className="text-xs font-bold text-slate-400">
                Checklists d'intégration EPI/IT • Calculateur Solde de Tout Compte (STC) Code du Travail CI
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Onglets */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'onboarding' ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <UserPlus size={15} /> Onboarding ({onboardingTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('offboarding')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'offboarding' ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <UserMinus size={15} /> Départs & STC ({offboardingRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('stc-calculator')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stc-calculator' ? 'bg-[#E5A110] text-slate-950 shadow-md font-black' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Calculator size={15} /> Calculateur STC CI
          </button>
        </div>
      </div>

      {/* ONGLET 1 : ONBOARDING (CHECKLISTS EPI / IT / RH) */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Checklists d'intégration & Dotations (EPI, IT, Visite Médicale)
            </h3>
            <button
              onClick={() => setNewTaskModal(true)}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={14} /> Nouvelle Tâche
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['EPI & Sécurité', 'IT & Matériel', 'Administratif & RH'].map(cat => {
              const catTasks = onboardingTasks.filter(t => t.categorie === cat);
              const doneCount = catTasks.filter(t => t.statut === 'Fait').length;

              return (
                <div key={cat} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {cat === 'EPI & Sécurité' ? <HardHat size={18} className="text-amber-500" /> :
                       cat === 'IT & Matériel' ? <Laptop size={18} className="text-blue-500" /> :
                       <FileText size={18} className="text-emerald-500" />}
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{cat}</h4>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {doneCount}/{catTasks.length}
                    </span>
                  </div>

                  {catTasks.length === 0 ? (
                    <p className="text-center py-6 text-xs text-slate-400 font-medium">Aucune tâche enregistrée.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {catTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleTask(task)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                            task.statut === 'Fait'
                              ? 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                              : 'bg-slate-50 border-slate-200 hover:border-[#2563EB] text-slate-900'
                          }`}
                        >
                          <button className="mt-0.5 text-emerald-600 shrink-0">
                            {task.statut === 'Fait' ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-slate-300" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <h5 className={`text-xs font-bold leading-tight ${task.statut === 'Fait' ? 'line-through opacity-70' : ''}`}>
                              {task.titre}
                            </h5>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              {task.nom} {task.prenoms} ({task.matricule})
                            </p>
                            {task.echeance && (
                              <span className="inline-block mt-1 text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                Échéance: {new Date(task.echeance).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ONGLET 2 : OFFBOARDING (DOSSIERS DE DÉPART) */}
      {activeTab === 'offboarding' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Historique des Clôtures & Soldes de Tout Compte (STC)
            </h3>
            <button
              onClick={() => setActiveTab('stc-calculator')}
              className="px-4 py-2 bg-[#E5A110] text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} /> Clôturer un Nouveau Départ
            </button>
          </div>

          {offboardingRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <UserMinus size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold">Aucun dossier de départ clôturé.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {offboardingRecords.map(rec => (
                <div key={rec.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar src={rec.photo} nom={rec.nom} size="md" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{rec.nom} {rec.prenoms}</h4>
                      <p className="text-[10px] text-slate-500 font-bold">{rec.poste} • {rec.departement}</p>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {rec.motif_depart}
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400 font-bold">Date de Départ : {new Date(rec.date_depart).toLocaleDateString('fr-FR')}</p>
                    <p className="text-sm font-black font-mono text-emerald-700 mt-0.5">
                      STC Net : {new Intl.NumberFormat('fr-CI').format(rec.stc_total_net)} F CFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3 : CALCULATEUR OFFICIEL DU SOLDE DE TOUT COMPTE (STC CI) */}
      {activeTab === 'stc-calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulaire de Calcul */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={18} className="text-[#E5A110]" /> Paramètres du Départ Salarié
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Sélectionner le Collaborateur</label>
                <select
                  value={selectedStcEmpId}
                  onChange={(e) => {
                    setSelectedStcEmpId(e.target.value);
                    setStcResult(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="">-- Choisir un salarié --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom} {emp.prenoms} ({emp.matricule} - {emp.poste})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Motif du Départ</label>
                <select
                  value={stcForm.motifDepart}
                  onChange={(e) => setStcForm({ ...stcForm, motifDepart: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Fin de Contrat CDD">Fin de Contrat CDD</option>
                  <option value="Rupture Conventionnelle">Rupture Conventionnelle (Accord Parties)</option>
                  <option value="Licenciement Motif Économique">Licenciement Motif Économique</option>
                  <option value="Licenciement Motif Personnel">Licenciement Motif Personnel</option>
                  <option value="Démission">Démission Salarié</option>
                  <option value="Départ à la Retraite">Départ à la Retraite</option>
                  <option value="Faute Lourde">Licenciement pour Faute Lourde</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Date de Départ</label>
                  <input
                    type="date"
                    value={stcForm.dateDepart}
                    onChange={(e) => setStcForm({ ...stcForm, dateDepart: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-500">Jours Présence (Mois)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={stcForm.joursPresenceMois}
                    onChange={(e) => setStcForm({ ...stcForm, joursPresenceMois: parseInt(e.target.value, 10) || 30 })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <input
                  type="checkbox"
                  id="preavis"
                  checked={stcForm.preavisEffectue}
                  onChange={(e) => setStcForm({ ...stcForm, preavisEffectue: e.target.checked })}
                  className="w-4 h-4 text-[#2563EB] rounded cursor-pointer"
                />
                <label htmlFor="preavis" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Préavis légal intégralement effectué
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Déductions / Avances Restantes (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={stcForm.deductions}
                  onChange={(e) => setStcForm({ ...stcForm, deductions: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none font-mono"
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                onClick={handleCalculateStc}
                disabled={!selectedStcEmpId || calculatingStc}
                className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Calculator size={16} />
                <span>{calculatingStc ? 'Calcul en cours...' : 'Calculer le Solde de Tout Compte'}</span>
              </button>
            </div>
          </div>

          {/* Reçu et Décompte Officiel STC */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Reçu pour Solde de Tout Compte (Certifié)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">Conforme Code du Travail & Barème BTP Côte d'Ivoire</p>
              </div>

              {stcResult && (
                <button
                  onClick={handlePrintStc}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Imprimer
                </button>
              )}
            </div>

            {!stcResult ? (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <Calculator size={40} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">Sélectionnez un employé et cliquez sur "Calculer le Solde".</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Récapitulatif Collaborateur */}
                <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                  <EmployeeAvatar src={selectedEmployee?.photo} nom={selectedEmployee?.nom} size="md" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{selectedEmployee?.nom} {selectedEmployee?.prenoms}</h4>
                    <p className="text-[10px] font-bold text-slate-500">{selectedEmployee?.poste} • Ancienneté : {stcResult.seniorityYears} an(s)</p>
                    <p className="text-[10px] font-mono text-slate-400">Salaire Base : {new Intl.NumberFormat('fr-CI').format(stcResult.salaireBase)} FCFA</p>
                  </div>
                </div>

                {/* Tableau des Rubriques STC */}
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-3 text-left rounded-l-xl">Rubrique Légale</th>
                      <th className="p-3 text-right">Réf / Détail</th>
                      <th className="p-3 text-right rounded-r-xl">Montant (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    <tr>
                      <td className="p-3">Salaire de Présence (Dernier Mois)</td>
                      <td className="p-3 text-right">{stcForm.joursPresenceMois} jours</td>
                      <td className="p-3 text-right font-mono font-bold">{new Intl.NumberFormat('fr-CI').format(stcResult.stc_salaire_presence)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Indemnité Compensatrice Congés Payés</td>
                      <td className="p-3 text-right">{stcResult.soldeConges} jours acquis</td>
                      <td className="p-3 text-right font-mono font-bold">{new Intl.NumberFormat('fr-CI').format(stcResult.stc_conges_payes)}</td>
                    </tr>
                    {stcResult.stc_preavis > 0 && (
                      <tr>
                        <td className="p-3">Indemnité Compensatrice de Préavis</td>
                        <td className="p-3 text-right">{stcResult.moisPreavis} mois</td>
                        <td className="p-3 text-right font-mono font-bold">{new Intl.NumberFormat('fr-CI').format(stcResult.stc_preavis)}</td>
                      </tr>
                    )}
                    {stcResult.stc_indemnite_rupture > 0 && (
                      <tr>
                        <td className="p-3">Indemnité Légale de Licenciement / Rupture</td>
                        <td className="p-3 text-right">{stcResult.seniorityYears} ans prés.</td>
                        <td className="p-3 text-right font-mono font-bold text-blue-700">{new Intl.NumberFormat('fr-CI').format(stcResult.stc_indemnite_rupture)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="p-3">Prorata Gratification / 13ème Mois</td>
                      <td className="p-3 text-right">Prorata temporis</td>
                      <td className="p-3 text-right font-mono font-bold">{new Intl.NumberFormat('fr-CI').format(stcResult.stc_prorata_gratification)}</td>
                    </tr>
                    {stcResult.stc_deductions > 0 && (
                      <tr className="bg-rose-50/50 text-rose-700">
                        <td className="p-3">Déductions / Avances Restantes</td>
                        <td className="p-3 text-right">Retenues</td>
                        <td className="p-3 text-right font-mono font-bold">-{new Intl.NumberFormat('fr-CI').format(stcResult.stc_deductions)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Net Final STC */}
                <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Montant Net Total à Verser</span>
                    <h4 className="text-2xl font-black font-mono text-emerald-900 mt-0.5">
                      {new Intl.NumberFormat('fr-CI').format(stcResult.stc_total_net)} F CFA
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveOffboarding}
                    disabled={savingOffboarding}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>{savingOffboarding ? 'Clôture...' : 'Enregistrer le Départ'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE TÂCHE ONBOARDING */}
      {newTaskModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-white rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Plus size={18} className="text-[#2563EB]" /> Nouvelle Tâche d'Intégration
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Collaborateur</label>
              <select
                required
                value={newTaskForm.empId}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, empId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
              >
                <option value="">-- Choisir le nouvel employé --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenoms} ({emp.matricule})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Intitulé de la Tâche / Dotation</label>
              <input
                type="text"
                required
                value={newTaskForm.titre}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, titre: e.target.value })}
                placeholder="Ex: Dotation Casque & Chaussures de sécurité S3..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Catégorie</label>
                <select
                  value={newTaskForm.categorie}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, categorie: e.target.value })}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="EPI & Sécurité">EPI & Sécurité</option>
                  <option value="IT & Matériel">IT & Matériel</option>
                  <option value="Administratif & RH">Administratif & RH</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Échéance</label>
                <input
                  type="date"
                  value={newTaskForm.echeance}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, echeance: e.target.value })}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setNewTaskModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black rounded-xl uppercase shadow-md transition-all"
              >
                Enregistrer la tâche
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Lifecycle;
