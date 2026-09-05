import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, AlertTriangle, ArrowRight, User, Sparkles, Briefcase, Award } from 'lucide-react';

const CandidateTest = () => {
  const { id } = useParams();
  
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Steps: 'identity', 'test', 'result'
  const [step, setStep] = useState('identity');
  
  const [candidate, setCandidate] = useState({
    nom: '',
    prenoms: '',
    email: '',
    telephone: ''
  });
  
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Fetch test details (without correct answers)
    const fetchTest = async () => {
      try {
        const res = await axios.get(`/api/assessments/${id}`);
        const data = res.data;
        
        setTestData(data);
        setTimeLeft(data.duree_minutes * 60);
      } catch (err) {
        setError(err.response?.data?.error || 'Test d\'évaluation introuvable ou erreur de connexion.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTest();
  }, [id]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmitTest(); // Auto submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTest = (e) => {
    e.preventDefault();
    if (!candidate.nom || !candidate.prenoms || !candidate.email) {
      alert("Veuillez remplir vos informations.");
      return;
    }
    setStep('test');
    setTimerActive(true);
  };

  const handleSelectOption = (questionId, option) => {
    setResponses({
      ...responses,
      [questionId]: option
    });
  };

  const handleSubmitTest = async () => {
    setTimerActive(false);
    
    const timeSpent = (testData.duree_minutes * 60) - timeLeft;
    
    try {
      const res = await axios.post(`/api/assessments/${id}/submit`, {
        ...candidate,
        reponses: responses,
        temps_ecoule: timeSpent
      });
      setResult(res.data);
      setStep('result');
    } catch (err) {
      alert('Erreur lors de la soumission de votre test. Vérifiez votre connexion.');
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Chargement de l'évaluation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
          <AlertTriangle size={50} className="text-rose-500 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">{error}</h2>
          <p className="text-xs text-slate-500">Veuillez contacter le service des ressources humaines de votre entreprise.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans antialiased text-slate-800 flex flex-col">
      
      {/* Executive Header Bar */}
      <header className="bg-[#051915] text-white sticky top-0 z-40 border-b border-emerald-900/50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="font-extrabold text-xs tracking-wider text-emerald-400 uppercase">Logiciel RH</div>
              <div className="font-black text-xl tracking-tight text-white leading-none">SIRH-CIV</div>
            </div>
          </div>

          {step === 'test' && (
            <div className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 border transition-all ${
              timeLeft < 180 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              <Clock size={16} /> Temps restant : {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: IDENTITY */}
          {step === 'identity' && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-8"
            >
              <div className="space-y-3 text-center">
                <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                  <Sparkles size={12} /> Évaluation Technique & Aptitude
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{testData.titre}</h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xl mx-auto">{testData.description || 'Consignes et modalités d\'évaluation.'}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                  <Clock size={14} className="text-emerald-600" /> Durée impartie : <span className="font-extrabold text-slate-900">{testData.duree_minutes} minutes</span>
                </div>
              </div>

              <form onSubmit={startTest} className="space-y-5 border-t border-slate-100 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Nom *</label>
                    <input 
                      required 
                      value={candidate.nom} onChange={e => setCandidate({...candidate, nom: e.target.value})}
                      placeholder="Votre nom" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Prénoms *</label>
                    <input 
                      required 
                      value={candidate.prenoms} onChange={e => setCandidate({...candidate, prenoms: e.target.value})}
                      placeholder="Vos prénoms" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Adresse Email *</label>
                    <input 
                      required type="email"
                      value={candidate.email} onChange={e => setCandidate({...candidate, email: e.target.value})}
                      placeholder="votre.email@exemple.com" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">Téléphone *</label>
                    <input 
                      required 
                      value={candidate.telephone} onChange={e => setCandidate({...candidate, telephone: e.target.value})}
                      placeholder="+225 0700000000" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full py-4 bg-[#008A5E] hover:bg-[#007550] text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 mt-4"
                >
                  Commencer l'évaluation <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: TEST QUESTIONS */}
          {step === 'test' && (
            <motion.div 
              key="test"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-8"
            >
              <div className="space-y-6">
                {testData.questions.map((q, i) => {
                  const options = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
                  return (
                    <div key={q.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        <span className="text-emerald-600 mr-2">{i + 1}.</span> {q.texte_question}
                        <span className="ml-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                          ({q.type_question === 'multiple' ? 'Plusieurs choix possibles' : q.type_question === 'text' ? 'Réponse courte' : 'Choix unique'})
                        </span>
                      </h3>
                      
                      {q.image_url && (
                        <div className="my-3 overflow-hidden rounded-2xl border border-slate-200 shadow-sm max-w-md">
                          <img src={q.image_url} alt={`Illustration Q${i+1}`} className="w-full h-auto max-h-64 object-contain bg-white p-2" />
                        </div>
                      )}
                      
                      {q.type_question === 'text' ? (
                        <div className="space-y-1">
                          <input 
                            type="text"
                            placeholder="Saisissez votre réponse ici..."
                            value={responses[q.id] || ''}
                            onChange={e => setResponses({ ...responses, [q.id]: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                          />
                        </div>
                      ) : q.type_question === 'multiple' ? (
                        <div className="space-y-2">
                          {options.map((opt, j) => {
                            const currentSelected = Array.isArray(responses[q.id]) ? responses[q.id] : [];
                            const isChecked = currentSelected.includes(opt);

                            return (
                              <label 
                                key={j} 
                                className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                                  isChecked 
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={e => {
                                    let newArr = [...currentSelected];
                                    if (e.target.checked) {
                                      if (!newArr.includes(opt)) newArr.push(opt);
                                    } else {
                                      newArr = newArr.filter(item => item !== opt);
                                    }
                                    setResponses({ ...responses, [q.id]: newArr });
                                  }}
                                  className="w-4 h-4 accent-emerald-600"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {options.map((opt, j) => (
                            <label 
                              key={j} 
                              className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 cursor-pointer ${
                                responses[q.id] === opt 
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm' 
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name={`question_${q.id}`} 
                                checked={responses[q.id] === opt}
                                onChange={() => handleSelectOption(q.id, opt)}
                                className="w-4 h-4 accent-emerald-600"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={handleSubmitTest} 
                className="w-full py-4 bg-[#008A5E] hover:bg-[#007550] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Terminer & Soumettre mes Réponses
              </button>
            </motion.div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={44} />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Évaluation Transmise !</h1>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Merci <strong className="text-slate-800">{candidate.prenoms}</strong>, vos réponses ont été enregistrées avec succès.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 inline-block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score Obtenu</span>
                <p className="text-4xl font-extrabold text-emerald-600">
                  {result?.score} <span className="text-lg text-slate-400 font-bold">/ {result?.totalPoints}</span>
                </p>
              </div>

              <p className="text-[11px] font-bold text-slate-400 pt-4">Vous pouvez maintenant fermer cet onglet en toute sécurité.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default CandidateTest;
