import React, { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { GraduationCap, Award, Calendar, BookOpen, Plus, X, Trash2 } from 'lucide-react';

const Trainings = () => {
  const { data, loading, refreshData } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titre: '', departement: 'Comptabilité & Finance', date: '', participants: 0 });

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted">Analyse du plan de formation...</div>;

  const trainings = data?.trainings || [];
  const departments = (data?.settings?.departments && data.settings.departments.length > 0) 
    ? data.settings.departments 
    : ['Direction Générale', 'Ressources Humaines', 'Comptabilité & Finance', 'Technique & BTP', 'Commercial & Marketing', 'Informatique / IT', 'Logistique & Achats', 'Sécurité & QHSE'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre || !form.date) return alert('Veuillez remplir le titre et la date');
    try {
      await axios.post('/api/trainings', form);
      await refreshData();
      setShowForm(false);
      setForm({ titre: '', departement: departments[0] || 'Comptabilité & Finance', date: '', participants: 0 });
    } catch {
      alert('Erreur lors de la création');
    }
  };

  const handleStatusChange = async (id, statut) => {
    try {
      await axios.patch(`/api/trainings/${id}`, { statut });
      refreshData();
    } catch {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id, titre) => {
    if (!window.confirm(`Supprimer la formation "${titre}" ?`)) return;
    try {
      await axios.delete(`/api/trainings/${id}`);
      refreshData();
    } catch {
      alert('Erreur lors de la suppression de la formation');
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Plan de formation" 
        subtitle="Développement des compétences et certifications"
        actions={
            <button onClick={() => setShowForm(true)} className="bg-ci-green text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-ci-greenDark transition-all shadow-lg flex items-center gap-2">
                <Plus size={14} /> Nouvelle Formation
            </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trainings.map((t) => (
          <div key={t.id} className="bg-white rounded-[2.5rem] p-8 border border-ci-border shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-ci-bg rounded-2xl flex items-center justify-center text-ci-green group-hover:scale-110 transition-transform">
                      <GraduationCap size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                        t.statut === 'En cours' ? 'bg-blue-50 text-ci-info' : 
                        t.statut === 'Terminée' ? 'bg-ci-greenLight text-ci-green' : 'bg-ci-bg text-ci-muted'
                    }`}>{t.statut}</span>
                    <button 
                      onClick={() => handleDelete(t.id, t.titre)} 
                      className="p-1.5 hover:bg-red-50 text-ci-muted hover:text-red-500 rounded-lg transition-colors"
                      title="Supprimer la formation"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
              </div>
              
              <h4 className="text-lg font-black text-ci-text leading-tight mb-2">{t.titre}</h4>
              <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mb-6">{t.departement}</p>
              
              <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-ci-text">
                      <Calendar size={16} className="text-ci-orange" />
                      <span>{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-ci-text">
                      <BookOpen size={16} className="text-ci-info" />
                      <span>{t.participants} participants inscrits</span>
                  </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-ci-bg flex justify-between items-center">
                <select
                  value={t.statut}
                  onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className="text-[10px] font-black text-ci-green uppercase bg-ci-bg px-3 py-2 rounded-xl border-none outline-none cursor-pointer hover:bg-ci-greenLight"
                >
                  <option value="Planifiée">Planifiée</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminée">Terminée</option>
                </select>
                <Award size={20} className="text-ci-orange opacity-40" />
            </div>
          </div>
        ))}
        {trainings.length === 0 && (
          <div className="col-span-full py-16 text-center text-ci-muted font-bold italic">
            Aucune formation planifiée. Cliquez sur « Nouvelle Formation » pour commencer.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter">Nouvelle formation</h3>
              <button onClick={() => setShowForm(false)} className="p-2 bg-ci-bg rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Titre de la formation</label>
                <input required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm" placeholder="Ex: Gestion de la Paie CI & CNPS" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Département concerné</label>
                <select value={form.departement} onChange={(e) => setForm({ ...form, departement: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm">
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Date prévue</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Participants prévus</label>
                <input type="number" min="0" value={form.participants} onChange={(e) => setForm({ ...form, participants: parseInt(e.target.value) || 0 })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm" />
              </div>
              <button type="submit" className="w-full py-4 bg-ci-green text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-ci-greenDark transition-all">
                Planifier la formation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainings;
