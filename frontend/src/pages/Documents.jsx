import React, { useState } from 'react';
import axios from 'axios';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { FolderKanban, FileText, Download, Trash2, Search, FileCode, FilePlus, X } from 'lucide-react';

const Documents = () => {
  const { data, loading, refreshData } = useData();
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', type: 'PDF', taille: '', dossier: 'Ressources Humaines' });

  if (loading) return <div className="p-10 text-center">Chargement des documents...</div>;

  const docs = data?.documents || [];
  const folders = ['Ressources Humaines', 'Comptabilité', 'Modèles', 'Archives'];

  const folderCounts = folders.reduce((acc, f) => {
    acc[f] = docs.filter(d => d.dossier === f).length;
    return acc;
  }, {});

  const filteredDocs = docs.filter(d =>
    d.nom.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedFolder || d.dossier === selectedFolder)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom) return alert('Veuillez saisir le nom du document');
    try {
      await axios.post('/api/documents', form);
      await refreshData();
      setShowForm(false);
      setForm({ nom: '', type: 'PDF', taille: '', dossier: 'Ressources Humaines' });
    } catch {
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce document ?')) return;
    try {
      await axios.delete(`/api/documents/${id}`);
      refreshData();
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Gestion documentaire" 
        subtitle="Espace centralisé des documents RH"
        actions={
            <button onClick={() => setShowForm(true)} className="bg-ci-sidebar text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2">
                <FilePlus size={14} /> Ajouter un document
            </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {folders.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => setSelectedFolder(selectedFolder === folder ? '' : folder)}
              className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:border-ci-orange transition-colors text-left group ${
                selectedFolder === folder ? 'border-ci-orange ring-2 ring-ci-orange/20' : 'border-ci-border'
              }`}
            >
                <FolderKanban className="text-ci-orange mb-4 group-hover:scale-110 transition-transform" size={32} />
                <h4 className="text-sm font-black text-ci-text uppercase tracking-tight">{folder}</h4>
                <p className="text-[10px] font-bold text-ci-muted mt-1 uppercase tracking-widest">{folderCounts[folder] || 0} fichiers</p>
            </button>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-ci-border overflow-hidden">
        <div className="p-6 border-b border-ci-bg">
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ci-muted" size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher un document..."
                  className="w-full pl-12 pr-4 py-3 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-ci-orange/20 outline-none"
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-ci-bg/50 text-[10px] font-black uppercase tracking-widest text-ci-muted">
                    <tr>
                        <th className="px-6 py-4 text-left">Nom du fichier</th>
                        <th className="px-6 py-4 text-left">Dossier</th>
                        <th className="px-6 py-4 text-left">Type</th>
                        <th className="px-6 py-4 text-left">Taille</th>
                        <th className="px-6 py-4 text-left">Dernière modification</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-ci-bg text-sm">
                    {filteredDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-ci-bg/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted">
                                        {doc.type === 'PDF' ? <FileText size={20} className="text-red-500" /> : <FileCode size={20} className="text-blue-500" />}
                                    </div>
                                    <p className="font-bold text-ci-text uppercase tracking-tighter">{doc.nom}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-[10px] text-ci-muted uppercase">{doc.dossier}</td>
                            <td className="px-6 py-4 font-black text-[10px] text-ci-muted">{doc.type}</td>
                            <td className="px-6 py-4 font-bold text-ci-muted">{doc.taille}</td>
                            <td className="px-6 py-4 font-bold text-ci-text">{new Date(doc.date).toLocaleDateString('fr-FR')}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => alert(`Document "${doc.nom}" — référencé dans le SIRH. Téléchargement simulé.`)}
                                      className="p-2 hover:bg-ci-bg rounded-lg text-ci-info"
                                      title="Télécharger"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-red-50 rounded-lg text-ci-danger" title="Supprimer">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {filteredDocs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-ci-muted font-bold italic">
                          Aucun document trouvé.
                        </td>
                      </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter">Ajouter un document</h3>
              <button onClick={() => setShowForm(false)} className="p-2 bg-ci-bg rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Nom du fichier</label>
                <input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none" placeholder="Ex: Règlement Intérieur 2024.pdf" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none">
                    <option>PDF</option><option>DOCX</option><option>XLSX</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Taille</label>
                  <input value={form.taille} onChange={(e) => setForm({ ...form, taille: e.target.value })}
                    className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none" placeholder="Ex: 2.4 MB" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Dossier</label>
                <select value={form.dossier} onChange={(e) => setForm({ ...form, dossier: e.target.value })}
                  className="w-full mt-2 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none">
                  {folders.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                Enregistrer le document
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
