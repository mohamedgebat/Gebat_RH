import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  ClipboardList, Plus, Trash2, CheckCircle, 
  Users, Clock, Trophy, Eye, Link, Edit, ArrowLeft,
  Award, TrendingUp, Target, Search, CheckCircle2, Sparkles
} from 'lucide-react';

const AdminAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Views: 'list', 'create', 'edit', 'view'
  const [view, setView] = useState('list');
  const [selectedTest, setSelectedTest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Create/Edit form state
  const [newTest, setNewTest] = useState({
    id: null,
    titre: '',
    description: '',
    duree_minutes: 30,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    type_question: 'single',
    texte_question: '',
    options: ['', '', '', ''],
    reponse_correcte: '',
    points: 1,
    image_url: ''
  });

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await axios.get('/api/assessments');
      setAssessments(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setAssessments([]);
      setLoading(false);
    }
  };

  const loadAssessmentDetails = async (id, mode = 'view') => {
    try {
      const res = await axios.get(`/api/assessments/${id}`);
      const data = res.data || {};
      
      if (mode === 'edit') {
        setNewTest({
          id: data.id,
          titre: data.titre || '',
          description: data.description || '',
          duree_minutes: data.duree_minutes || 30,
          questions: (data.questions || []).map(q => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || [])
          }))
        });
        setView('edit');
      } else {
        setSelectedTest(data);
        const lbRes = await axios.get(`/api/assessments/${id}/leaderboard`);
        setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : []);
        setView('view');
      }
    } catch (err) {
      console.error('Error loading assessment details:', err);
      alert('Erreur lors du chargement des détails du test.');
    }
  };

  const handleAddQuestion = () => {
    const qType = currentQuestion.type_question || 'single';
    if (!currentQuestion.texte_question) {
      alert("Veuillez saisir l'énoncé de la question.");
      return;
    }

    if (qType === 'single') {
      if (currentQuestion.options.some(o => !o) || !currentQuestion.reponse_correcte) {
        alert("Veuillez remplir toutes les options et choisir 1 réponse correcte.");
        return;
      }
    } else if (qType === 'multiple') {
      if (currentQuestion.options.some(o => !o) || !Array.isArray(currentQuestion.reponse_correcte) || currentQuestion.reponse_correcte.length === 0) {
        alert("Veuillez remplir toutes les options et cocher au moins une réponse correcte.");
        return;
      }
    } else if (qType === 'text') {
      if (!currentQuestion.reponse_correcte) {
        alert("Veuillez saisir le texte de la réponse attendue.");
        return;
      }
    }
    
    setNewTest({
      ...newTest,
      questions: [...newTest.questions, { ...currentQuestion }]
    });
    
    setCurrentQuestion({
      type_question: 'single',
      texte_question: '',
      options: ['', '', '', ''],
      reponse_correcte: '',
      points: 1,
      image_url: ''
    });
  };

  const handleRemoveQuestion = (index) => {
    const updated = newTest.questions.filter((_, i) => i !== index);
    setNewTest({ ...newTest, questions: updated });
  };

  const handleSubmitTest = async (e) => {
    e.preventDefault();
    if (newTest.questions.length === 0) {
      alert("Ajoutez au moins une question.");
      return;
    }
    
    const isEdit = view === 'edit';
    
    try {
      if (isEdit) {
        await axios.put(`/api/assessments/${newTest.id}`, newTest);
      } else {
        await axios.post('/api/assessments', newTest);
      }
      alert(`Test ${isEdit ? 'modifié' : 'créé'} avec succès !`);
      setNewTest({ id: null, titre: '', description: '', duree_minutes: 30, questions: [] });
      setView('list');
      fetchAssessments();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Erreur du serveur : " + (err.response?.data?.error || err.message));
    }
  };

  const copyLink = (id) => {
    const link = `${window.location.origin}/test/${id}`;
    navigator.clipboard.writeText(link);
    alert("Lien public copié dans le presse-papier : " + link);
  };

  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const filteredAssessments = safeAssessments.filter(t => 
    (t.titre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPassages = safeAssessments.reduce((acc, curr) => acc + (curr.candidats || 0), 0);

  // --- RENDER VIEWS ---

  if (view === 'create' || view === 'edit') {
    return (
      <div className="space-y-8 font-sans antialiased text-slate-800 pb-12">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <ClipboardList size={14} /> Gestion des Tests
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">
              {view === 'edit' ? 'Modifier le Test d\'Évaluation' : 'Créer un Nouveau Test d\'Évaluation'}
            </h1>
          </div>
          <button 
            onClick={() => { setView('list'); setNewTest({ id: null, titre: '', description: '', duree_minutes: 30, questions: [] }); }}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={16} /> Annuler & Retour
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-6">
          <form onSubmit={handleSubmitTest} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Intitulé du Test *</label>
              <input 
                required
                value={newTest.titre}
                onChange={e => setNewTest({...newTest, titre: e.target.value})}
                placeholder="Ex: Évaluation de Compétences Techniques & Logique"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Durée Allouée (Minutes) *</label>
                <input 
                  type="number" required min="1"
                  value={newTest.duree_minutes}
                  onChange={e => setNewTest({...newTest, duree_minutes: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Description / Consignes</label>
                <input 
                  value={newTest.description}
                  onChange={e => setNewTest({...newTest, description: e.target.value})}
                  placeholder="Objectif et modalités du test..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            <hr className="border-slate-100 my-6" />
            
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Questions du Test ({newTest.questions.length})</h3>
            
            {newTest.questions.map((q, i) => (
              <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900">
                      Question {i + 1} ({q.type_question === 'multiple' ? '☑️ Choix Multiples' : q.type_question === 'text' ? '✍️ Réponse Courte' : '⭕ Choix Unique'}) : {q.texte_question} ({q.points} pts)
                    </span>
                    {q.image_url && (
                      <div>
                        <img src={q.image_url} alt="Illustration question" className="h-20 rounded-xl border border-slate-200 object-cover mt-1" />
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => handleRemoveQuestion(i)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-[11px] font-bold text-emerald-700">
                  ✅ Réponse correcte : {Array.isArray(q.reponse_correcte) ? q.reponse_correcte.join(', ') : q.reponse_correcte}
                </p>
              </div>
            ))}

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Ajouter une Question</h4>
              
              {/* Type de question selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Type de Question *</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion({ ...currentQuestion, type_question: 'single', reponse_correcte: '', options: currentQuestion.options.length ? currentQuestion.options : ['', '', '', ''] })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      (currentQuestion.type_question || 'single') === 'single'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ⭕ Choix Unique (Radio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion({ ...currentQuestion, type_question: 'multiple', reponse_correcte: [], options: currentQuestion.options.length ? currentQuestion.options : ['', '', '', ''] })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      currentQuestion.type_question === 'multiple'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ☑️ Choix Multiples / Double (Case à cocher)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentQuestion({ ...currentQuestion, type_question: 'text', reponse_correcte: '', options: [] })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      currentQuestion.type_question === 'text'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    ✍️ Réponse Courte (Texte libre)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Énoncé de la question *</label>
                <input 
                  placeholder="Énoncé de la question..." 
                  value={currentQuestion.texte_question}
                  onChange={e => setCurrentQuestion({...currentQuestion, texte_question: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>

              {/* Image Option */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Illustration / Image explicative (Optionnel)</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCurrentQuestion({ ...currentQuestion, image_url: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-400 hidden sm:inline">ou URL :</span>
                  <input 
                    placeholder="https://... / Lien de l'image"
                    value={currentQuestion.image_url || ''}
                    onChange={e => setCurrentQuestion({...currentQuestion, image_url: e.target.value})}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                {currentQuestion.image_url && (
                  <div className="mt-2 relative inline-block">
                    <img src={currentQuestion.image_url} alt="Aperçu" className="h-24 rounded-xl border border-slate-200 object-cover shadow-sm" />
                    <button 
                      type="button" 
                      onClick={() => setCurrentQuestion({ ...currentQuestion, image_url: '' })}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Inputs according to type_question */}
              {currentQuestion.type_question === 'text' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Texte de la réponse attendue *</label>
                  <input 
                    placeholder="Ex: Abidjan (ou réponse exacte attendue)"
                    value={currentQuestion.reponse_correcte || ''}
                    onChange={e => setCurrentQuestion({ ...currentQuestion, reponse_correcte: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                  <p className="text-[10px] text-slate-400 font-bold">La réponse de l'évaluation sera comparée sans tenir compte des majuscules/minuscules.</p>
                </div>
              ) : currentQuestion.type_question === 'multiple' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Options de réponse (Cochez toutes les réponses correctes)</label>
                  {[0, 1, 2, 3].map(i => {
                    const currentArr = Array.isArray(currentQuestion.reponse_correcte) ? currentQuestion.reponse_correcte : [];
                    const optVal = currentQuestion.options[i] || '';
                    const isChecked = optVal !== '' && currentArr.includes(optVal);

                    return (
                      <div key={i} className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={e => {
                            if (!optVal) return;
                            let newArr = [...currentArr];
                            if (e.target.checked) {
                              if (!newArr.includes(optVal)) newArr.push(optVal);
                            } else {
                              newArr = newArr.filter(item => item !== optVal);
                            }
                            setCurrentQuestion({ ...currentQuestion, reponse_correcte: newArr });
                          }}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                        <input 
                          placeholder={`Option ${i + 1}`}
                          value={currentQuestion.options[i]}
                          onChange={e => {
                            const newOpts = [...(currentQuestion.options || [])];
                            const oldVal = newOpts[i];
                            const newVal = e.target.value;
                            newOpts[i] = newVal;

                            let newArr = Array.isArray(currentQuestion.reponse_correcte) ? [...currentQuestion.reponse_correcte] : [];
                            if (oldVal && newArr.includes(oldVal)) {
                              newArr = newArr.map(item => item === oldVal ? newVal : item);
                            }
                            setCurrentQuestion({ ...currentQuestion, options: newOpts, reponse_correcte: newArr });
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* SINGLE CHOICE RADIO */
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Options de réponse (Sélectionnez la seule réponse correcte)</label>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="correct_option"
                        checked={currentQuestion.reponse_correcte !== '' && currentQuestion.reponse_correcte === currentQuestion.options[i]}
                        onChange={() => {
                          if (currentQuestion.options[i]) {
                            setCurrentQuestion({ ...currentQuestion, reponse_correcte: currentQuestion.options[i] });
                          }
                        }}
                        className="w-4 h-4 accent-emerald-600 cursor-pointer"
                      />
                      <input 
                        placeholder={`Option ${i + 1}`}
                        value={currentQuestion.options[i]}
                        onChange={e => {
                          const newOpts = [...(currentQuestion.options || [])];
                          newOpts[i] = e.target.value;
                          if (currentQuestion.reponse_correcte === currentQuestion.options[i]) {
                            setCurrentQuestion({ ...currentQuestion, options: newOpts, reponse_correcte: e.target.value });
                          } else {
                            setCurrentQuestion({ ...currentQuestion, options: newOpts });
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Points :</label>
                  <input 
                    type="number" min="1"
                    value={currentQuestion.points}
                    onChange={e => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                    className="w-16 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <button type="button" onClick={handleAddQuestion} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Plus size={14} /> Valider cette question
                </button>
              </div>
            </div>

            <button type="submit" className="w-full py-4 bg-[#008A5E] hover:bg-[#007550] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center gap-2">
              <CheckCircle size={18} /> {view === 'edit' ? 'Enregistrer les Modifications' : 'Créer & Publier le Test'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (view === 'view' && selectedTest) {
    return (
      <div className="space-y-8 font-sans antialiased text-slate-800 pb-12">
        <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <Trophy size={14} /> Classement & Résultats
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">{selectedTest.titre}</h1>
          </div>
          <button onClick={() => setView('list')} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
            <ArrowLeft size={16} /> Retour à la Liste
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Test Questions Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900">{selectedTest.titre}</h3>
              <p className="text-xs text-slate-600 font-medium">{selectedTest.description || 'Aucune description spécifique.'}</p>
              
              <div className="flex items-center gap-4 text-xs font-extrabold text-slate-600 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1.5"><Clock size={16} className="text-emerald-600" /> {selectedTest.duree_minutes} min</span>
                <span className="flex items-center gap-1.5"><ClipboardList size={16} className="text-blue-600" /> {selectedTest.questions?.length || 0} Questions</span>
              </div>

              <button onClick={() => copyLink(selectedTest.id)} className="w-full py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <Link size={16} /> Copier le lien public du test
              </button>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Questions du Test</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {selectedTest.questions?.map((q, i) => (
                  <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">{i+1}. {q.texte_question} ({q.points} pt)</p>
                    <p className="text-[11px] font-extrabold text-emerald-700">✅ {q.reponse_correcte}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="lg:col-span-7">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" /> Classement des Candidats ({leaderboard.length})
              </h3>

              {leaderboard.length === 0 ? (
                <div className="p-12 text-center text-xs font-bold text-slate-400">
                  Aucun candidat n'a encore évalué ce test.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((session, i) => (
                    <div key={session.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white ${
                          i === 0 ? 'bg-amber-400 shadow-md' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{session.nom} {session.prenoms}</p>
                          <p className="text-[10px] font-bold text-slate-400">{session.email} • {session.telephone}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-black text-emerald-700">{session.score} / {session.total_points}</p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 justify-end">
                          <Clock size={10} /> {Math.floor(session.temps_ecoule / 60)}m {session.temps_ecoule % 60}s
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Default List View (Clean White Minimalist Executive Layout)
  return (
    <div className="space-y-8 font-sans antialiased text-slate-800 pb-12">
      
      {/* Executive Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest">
            <ClipboardList size={13} className="text-emerald-600" /> Évaluations & Tests d'Aptitude
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Banque de Tests & Évaluations Candidats
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl">
            Créez des questionnaires d'évaluation technique, partagez les liens publics et consultez les résultats des candidats en temps réel.
          </p>
        </div>

        <button 
          onClick={() => { setNewTest({ id: null, titre: '', description: '', duree_minutes: 30, questions: [] }); setView('create'); }}
          className="px-5 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 shrink-0"
        >
          <Plus size={16} /> Créer un Nouveau Test
        </button>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tests Actifs</span>
          <p className="text-3xl font-extrabold text-slate-900">{safeAssessments.length}</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md">
            Questionnaires en ligne
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passages Totaux</span>
          <p className="text-3xl font-extrabold text-slate-900">{totalPassages}</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-md">
            Évaluations réalisées
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temps Moyen</span>
          <p className="text-3xl font-extrabold text-slate-900">25 min</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-md">
            Durée moyenne d'épreuve
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher un test d'évaluation..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Assessments Cards Grid */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <ClipboardList size={40} className="mx-auto text-slate-300" />
          <p className="font-black text-slate-500 text-xs uppercase tracking-widest">Aucun test d'évaluation disponible</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map(test => (
            <motion.div
              key={test.id}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs shadow-sm">
                    ✨
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase">
                    ⏱️ {test.duree_minutes} MIN
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug">{test.titre}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2">{test.description || 'Aucune description'}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-emerald-600" /> {test.candidats || 0} Passages</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => loadAssessmentDetails(test.id, 'view')}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Eye size={14} /> Résultats
                </button>
                <button
                  onClick={() => loadAssessmentDetails(test.id, 'edit')}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  title="Modifier le test"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => copyLink(test.id)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  title="Copier le lien public"
                >
                  <Link size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAssessments;
