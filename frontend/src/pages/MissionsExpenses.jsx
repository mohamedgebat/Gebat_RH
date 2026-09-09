import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { 
  Car, Receipt, Plus, CheckCircle2, Clock, 
  AlertTriangle, Filter, Search, Printer, DollarSign, 
  HardHat, MapPin, Calendar, FileText, Image, ChevronRight, Download
} from 'lucide-react';

const MissionsExpenses = () => {
  const { user } = useAuth();
  const { data, refreshData } = useData();
  const employees = data?.employees || [];

  const [activeTab, setActiveTab] = useState('missions'); // 'missions', 'expenses'
  const [missions, setMissions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Mission Modal
  const [missionModal, setMissionModal] = useState(false);
  const [missionForm, setMissionForm] = useState({
    empId: '',
    titre: '',
    destination: '',
    site: '',
    date_debut: '',
    date_fin: '',
    moyen_transport: 'Véhicule de Société',
    vehicule: '',
    avance_frais: 0,
    motif: ''
  });

  // New Expense Modal
  const [expenseModal, setExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    empId: '',
    mission_id: '',
    date_depense: new Date().toISOString().split('T')[0],
    categorie: 'Carburant / Transport',
    montant: '',
    description: '',
    justificatif: null
  });

  const [selectedMissionForPrint, setSelectedMissionForPrint] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resMissions, resExpenses] = await Promise.all([
        axios.get('/api/missions'),
        axios.get('/api/expenses')
      ]);
      setMissions(resMissions.data || []);
      setExpenses(resExpenses.data || []);
    } catch (err) {
      console.error('Erreur chargement missions & frais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateMission = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/missions', missionForm);
      setMissionModal(false);
      setMissionForm({
        empId: '',
        titre: '',
        destination: '',
        site: '',
        date_debut: '',
        date_fin: '',
        moyen_transport: 'Véhicule de Société',
        vehicule: '',
        avance_frais: 0,
        motif: ''
      });
      fetchData();
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Erreur création mission:', err);
      alert(err.response?.data?.error || 'Erreur création mission');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/expenses', expenseForm);
      setExpenseModal(false);
      setExpenseForm({
        empId: '',
        mission_id: '',
        date_depense: new Date().toISOString().split('T')[0],
        categorie: 'Carburant / Transport',
        montant: '',
        description: '',
        justificatif: null
      });
      fetchData();
      if (refreshData) refreshData();
    } catch (err) {
      console.error('Erreur création note de frais:', err);
      alert(err.response?.data?.error || 'Erreur création note de frais');
    }
  };

  const handleApproveMission = async (m) => {
    try {
      const isStep2 = m.statut === 'Validée N+1' || m.statut === 'En attente RH';
      const payload = isStep2 
        ? { statut: 'Approuvée', validation_rh: user?.name || 'Direction RH' }
        : { statut: 'Validée N+1', validation_n1: user?.name || 'Manager N+1' };
      await axios.patch(`/api/missions/${m.id}`, payload);
      fetchData();
    } catch (err) {
      console.error('Erreur approbation mission:', err);
    }
  };

  const handleApproveExpense = async (exp) => {
    try {
      const isStep2 = exp.statut === 'Validée N+1' || exp.statut === 'En attente RH';
      const payload = isStep2 
        ? { statut: 'Approuvée', validation_rh: user?.name || 'Direction RH' }
        : { statut: 'Validée N+1', validation_n1: user?.name || 'Manager N+1' };
      await axios.patch(`/api/expenses/${exp.id}`, payload);
      fetchData();
    } catch (err) {
      console.error('Erreur approbation frais:', err);
    }
  };

  const handleToggleIncludePayroll = async (exp) => {
    try {
      const nextVal = exp.inclus_paie ? 0 : 1;
      await axios.patch(`/api/expenses/${exp.id}`, { 
        inclus_paie: nextVal,
        mois_paie: nextVal ? 'Juin 2026' : null 
      });
      fetchData();
    } catch (err) {
      console.error('Erreur bascule paie:', err);
    }
  };

  const totalExpensesAmount = expenses.reduce((acc, exp) => acc + (parseFloat(exp.montant) || 0), 0);
  const totalAdvancesAmount = missions.reduce((acc, m) => acc + (parseFloat(m.avance_frais) || 0), 0);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#2563EB]/10 text-[#2563EB] rounded-2xl">
              <Car size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Ordres de Mission & Notes de Frais Chantiers
              </h1>
              <p className="text-xs font-bold text-slate-400">
                Gestion des déplacements professionnels BTP • Justificatifs & Intégration en Paie
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs font-black flex items-center gap-2">
            <Car size={16} className="text-[#2563EB]" />
            <span>{missions.length} mission(s)</span>
          </div>
          <div className="px-4 py-2.5 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl text-xs font-black flex items-center gap-2 font-mono">
            <Receipt size={16} className="text-purple-600" />
            <span>Frais : {new Intl.NumberFormat('fr-CI').format(totalExpensesAmount)} F CFA</span>
          </div>
        </div>
      </div>

      {/* Barre d'onglets & Actions rapides */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
          <button
            onClick={() => setActiveTab('missions')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'missions' ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Car size={15} /> Ordres de Mission ({missions.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'expenses' ? 'bg-[#2563EB] text-white shadow-md' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Receipt size={15} /> Notes de Frais ({expenses.length})
          </button>
        </div>

        <div>
          {activeTab === 'missions' ? (
            <button
              onClick={() => setMissionModal(true)}
              className="px-5 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Nouvel Ordre de Mission
            </button>
          ) : (
            <button
              onClick={() => setExpenseModal(true)}
              className="px-5 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Nouvelle Note de Frais
            </button>
          )}
        </div>
      </div>

      {/* CONTENU ONGLET 1 : ORDRES DE MISSION */}
      {activeTab === 'missions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          {missions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Car size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold">Aucun ordre de mission enregistré.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {missions.map(m => (
                <div key={m.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <EmployeeAvatar src={m.photo} nom={m.nom} prenoms={m.prenoms} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{m.nom} {m.prenoms}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          m.statut === 'Approuvée' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : (m.statut === 'Validée N+1' || m.statut === 'En attente RH')
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {m.statut === 'Validée N+1' ? 'Validée Étape 1 (N+1)' : m.statut}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#2563EB] mt-0.5">{m.titre} &bull; Destination : {m.destination}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Du {new Date(m.date_debut).toLocaleDateString('fr-FR')} au {new Date(m.date_fin).toLocaleDateString('fr-FR')} &bull; {m.moyen_transport}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.avance_frais > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Avance Déplacement</span>
                        <p className="text-xs font-mono font-black text-slate-900">{new Intl.NumberFormat('fr-CI').format(m.avance_frais)} F</p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedMissionForPrint(m)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                      title="Imprimer l'Ordre de Mission Officiel"
                    >
                      <Printer size={15} />
                    </button>

                    {m.statut !== 'Approuvée' && (
                      <button
                        onClick={() => handleApproveMission(m)}
                        className={`px-3.5 py-2 text-white rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 shadow-sm ${
                          m.statut === 'Validée N+1' || m.statut === 'En attente RH'
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <CheckCircle2 size={13} /> {m.statut === 'Validée N+1' || m.statut === 'En attente RH' ? 'Valider Étape 2 (RH)' : 'Valider Étape 1'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CONTENU ONGLET 2 : NOTES DE FRAIS */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Receipt size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-bold">Aucune note de frais enregistrée.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expenses.map(exp => (
                <div key={exp.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/60 p-3 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <EmployeeAvatar src={exp.photo} nom={exp.nom} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{exp.nom} {exp.prenoms}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                          {exp.categorie}
                        </span>
                        {exp.inclus_paie === 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Inclus Paie ({exp.mois_paie || 'Actuel'})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{exp.description || 'Frais de mission / chantier'}</p>
                      <p className="text-[10px] text-slate-400">Date : {new Date(exp.date_depense).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Montant Remboursable</span>
                      <p className="text-sm font-mono font-black text-purple-900">{new Intl.NumberFormat('fr-CI').format(exp.montant)} FCFA</p>
                    </div>

                    <button
                      onClick={() => handleToggleIncludePayroll(exp)}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                        exp.inclus_paie === 1
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title="Intégrer au calcul du bulletin de paie"
                    >
                      {exp.inclus_paie === 1 ? '✓ Imputé Paie' : '+ Imputer Paie'}
                    </button>

                    {exp.statut !== 'Approuvée' && exp.statut !== 'Remboursée' && (
                      <button
                        onClick={() => handleApproveExpense(exp)}
                        className={`px-3 py-2 text-white rounded-xl text-xs font-black uppercase transition-all ${
                          exp.statut === 'Validée N+1' || exp.statut === 'En attente RH'
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {exp.statut === 'Validée N+1' || exp.statut === 'En attente RH' ? 'Valider Étape 2 (RH)' : 'Valider Étape 1'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL NOUVEL ORDRE DE MISSION */}
      {missionModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateMission} className="bg-white rounded-[2.5rem] w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Car size={18} className="text-[#2563EB]" /> Créer un Ordre de Mission
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Collaborateur Missionné</label>
              <select
                required
                value={missionForm.empId}
                onChange={(e) => setMissionForm({ ...missionForm, empId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
              >
                <option value="">-- Choisir le collaborateur --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenoms} ({emp.matricule} - {emp.poste})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Intitulé / Objet de la Mission</label>
              <input
                type="text"
                required
                value={missionForm.titre}
                onChange={(e) => setMissionForm({ ...missionForm, titre: e.target.value })}
                placeholder="Ex: Supervision Coulage Béton Chantier Pont..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Destination (Ville / Région)</label>
                <input
                  type="text"
                  required
                  value={missionForm.destination}
                  onChange={(e) => setMissionForm({ ...missionForm, destination: e.target.value })}
                  placeholder="Ex: San-Pedro / Yamoussoukro"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Chantier / Projet lié</label>
                <input
                  type="text"
                  value={missionForm.site}
                  onChange={(e) => setMissionForm({ ...missionForm, site: e.target.value })}
                  placeholder="Ex: Terminal Minéralier"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Date Début</label>
                <input
                  type="date"
                  required
                  value={missionForm.date_debut}
                  onChange={(e) => setMissionForm({ ...missionForm, date_debut: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Date Fin</label>
                <input
                  type="date"
                  required
                  value={missionForm.date_fin}
                  onChange={(e) => setMissionForm({ ...missionForm, date_fin: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Moyen de Transport</label>
                <select
                  value={missionForm.moyen_transport}
                  onChange={(e) => setMissionForm({ ...missionForm, moyen_transport: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Véhicule de Société">Véhicule de Société</option>
                  <option value="Véhicule Personnel">Véhicule Personnel (Frais km)</option>
                  <option value="Avion / Vol Intérieur">Avion / Vol Intérieur</option>
                  <option value="Transport Public / Car">Transport Public / Car</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Avance Frais (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  value={missionForm.avance_frais}
                  onChange={(e) => setMissionForm({ ...missionForm, avance_frais: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setMissionModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black rounded-xl uppercase shadow-md transition-all"
              >
                Émettre l'Ordre de Mission
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL NOUVELLE NOTE DE FRAIS */}
      {expenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateExpense} className="bg-white rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleIn space-y-4">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Receipt size={18} className="text-[#2563EB]" /> Saisir une Note de Frais
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Collaborateur</label>
              <select
                required
                value={expenseForm.empId}
                onChange={(e) => setExpenseForm({ ...expenseForm, empId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
              >
                <option value="">-- Choisir le collaborateur --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nom} {emp.prenoms} ({emp.matricule})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Catégorie</label>
                <select
                  value={expenseForm.categorie}
                  onChange={(e) => setExpenseForm({ ...expenseForm, categorie: e.target.value })}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Carburant / Transport">Carburant / Transport</option>
                  <option value="Péage & Stationnement">Péage & Stationnement</option>
                  <option value="Hébergement / Hôtel">Hébergement / Hôtel</option>
                  <option value="Restauration & Per Diem">Restauration & Per Diem</option>
                  <option value="Matériel & Fournitures Chantier">Matériel Chantier</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Montant (FCFA)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expenseForm.montant}
                  onChange={(e) => setExpenseForm({ ...expenseForm, montant: e.target.value })}
                  placeholder="Ex: 35000"
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Description / Justification</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Ex: Plein gasoil pick-up mission San-Pedro..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setExpenseModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-black rounded-xl uppercase shadow-md transition-all"
              >
                Soumettre le Frais
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DOCUMENT OFFICIEL ORDRE DE MISSION IMPRIMABLE */}
      {selectedMissionForPrint && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 sm:p-10 shadow-2xl border border-slate-200 animate-scaleIn space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">ORDRE DE MISSION OFFICIEL</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Réf: ODM-{selectedMissionForPrint.id}/2026</p>
              </div>
              <button
                onClick={() => setSelectedMissionForPrint(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>Il est ordonné à M./Mme <strong>{selectedMissionForPrint.nom} {selectedMissionForPrint.prenoms}</strong>, immatriculé(e) sous le numéro <strong>{selectedMissionForPrint.matricule}</strong>, occupant la fonction de <strong>{selectedMissionForPrint.poste}</strong> au sein de <strong>GEBAT SA</strong> :</p>
              
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-200">
                <p><strong>Objet de la mission :</strong> {selectedMissionForPrint.titre}</p>
                <p><strong>Lieu / Destination :</strong> {selectedMissionForPrint.destination} {selectedMissionForPrint.site && `(${selectedMissionForPrint.site})`}</p>
                <p><strong>Période de la mission :</strong> Du {new Date(selectedMissionForPrint.date_debut).toLocaleDateString('fr-FR')} au {new Date(selectedMissionForPrint.date_fin).toLocaleDateString('fr-FR')}</p>
                <p><strong>Moyen de locomotion :</strong> {selectedMissionForPrint.moyen_transport} {selectedMissionForPrint.vehicule && `(${selectedMissionForPrint.vehicule})`}</p>
                <p><strong>Avance sur frais de mission :</strong> {new Intl.NumberFormat('fr-CI').format(selectedMissionForPrint.avance_frais || 0)} F CFA</p>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Les autorités civiles et militaires sont priées de bien vouloir prêter aide et assistance au porteur du présent ordre de mission en cas de nécessité.
              </p>

              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-bold border-t border-slate-200">
                <div>
                  <p className="text-slate-400 uppercase text-[10px]">Le Collaborateur Missionné</p>
                  <p className="mt-8 font-black">{selectedMissionForPrint.nom} {selectedMissionForPrint.prenoms}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[10px]">Pour la Direction Générale</p>
                  <p className="mt-8 font-black text-[#2563EB]">Cachet & Signature RH</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[#2563EB] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md"
              >
                <Printer size={14} /> Imprimer l'Ordre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionsExpenses;
