import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, User, HelpCircle, Copy, Check, ChevronDown, Zap } from 'lucide-react';
import axios from 'axios';

const QUICK_PROMPTS = [
  "Quelles sont les majorations d'heures supplémentaires dans le BTP en Côte d'Ivoire ?",
  "Comment s'effectue la déclaration DISA CNPS annuelle ?",
  "Quelles sont les obligations d'EPI pour un ouvrier sur chantier ?",
  "Comment calculer le préavis et l'indemnité de licenciement légale ?",
  "Quel est le barème officiel ITS et IGR 2026 en Côte d'Ivoire ?"
];

const AiRhAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Bonjour ! Je suis votre **Assistant IA GEBAT RH**.\n\nJe suis expert en **Droit du travail ivoirien**, **Réglementation BTP**, **Fiscalité DGI / CNPS**, et gestion SIRH. Comment puis-je vous aider aujourd'hui ?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const getLocalKnowledgeResponse = (text) => {
    const q = String(text || '').toLowerCase();
    if (q.includes('heure') && (q.includes('sup') || q.includes('majoration') || q.includes('40h') || q.includes('48h') || q.includes('nuit'))) {
      return "En Côte d'Ivoire et selon la Convention Collective BTP, les heures supplémentaires se décomptent au-delà de **40h par semaine** avec les majorations légales suivantes :\n\n" +
        "• **De la 41ème à la 46ème heure** : majoration de **+15%** sur le taux horaire de base.\n" +
        "• **De la 47ème à la 55ème heure** : majoration de **+50%**.\n" +
        "• **Heures de nuit en semaine (21h à 5h)** : majoration de **+50%**.\n" +
        "• **Dimanche et jours fériés de jour** : majoration de **+50%**.\n" +
        "• **Dimanche et jours fériés de nuit** : majoration de **+100%**.\n\n" +
        "💡 *Sur les chantiers GEBAT, les heures supplémentaires sont automatiquement comptabilisées et valorisées sur le bulletin de paie.*";
    }
    if (q.includes('disa') || (q.includes('cnps') && (q.includes('annuel') || q.includes('déclaration') || q.includes('mars')))) {
      return "La **DISA (Déclaration Individuelle des Salaires Annuels)** est l'obligation déclarative annuelle CNPS en Côte d'Ivoire :\n\n" +
        "• **Date limite de dépôt** : au plus tard le **31 mars** de chaque année pour l'exercice précédent.\n" +
        "• **Contenu officiel** : Matricules CNPS, identités, périodes travaillées, total des salaires bruts et assiettes plafonnées.\n" +
        "• **Plafonds applicables** : Plafond Retraite = **1 647 315 FCFA / mois** ; Plafond Régime Général (Prestations Familiales & AT) = **70 000 FCFA / mois**.\n" +
        "• **Cotisations** : Retraite Salarié 6,3% / Retraite Patronal 7,7% ; Prestations Familiales 5,75% ; Risque AT/MP BTP 3,00% à 4,00%.\n\n" +
        "💡 *Le module Paie GEBAT génère l'export DISA normalisé en un clic.*";
    }
    if (q.includes('epi') || q.includes('équipement') || q.includes('sécurité') || q.includes('casque') || q.includes('harnais') || q.includes('protection')) {
      return "Les obligations légales et de sécurité chantier (**EPI**) pour les ouvriers et encadrants BTP comprennent :\n\n" +
        "• **Casque de sécurité NF EN 397** avec jugulaire obligatoire en permanence sur chantier.\n" +
        "• **Chaussures de sécurité S3** montantes avec semelle anti-perforation et embout acier 200J.\n" +
        "• **Gilet haute visibilité classe 2 (EN ISO 20471)** de jour comme de nuit.\n" +
        "• **Gants de manutention et anti-coupure (EN 388)** adaptés aux tâches (coffrage, ferraillage).\n" +
        "• **Harnais anti-chute (EN 361) avec longe absorbante** dès que le travail en hauteur dépasse **2 mètres**.\n" +
        "• **Lunettes de protection et protections auditives** selon les zones bruyantes ou de meulage.\n\n" +
        "💡 *Toute dotation doit être consignée sur la fiche collaborateur avec accusé de réception.*";
    }
    if (q.includes('licenciement') || q.includes('indemnité') || q.includes('rupture') || q.includes('préavis') || q.includes('solde de tout compte')) {
      return "Selon l'article 16.12 du Code du Travail de Côte d'Ivoire, l'**indemnité de licenciement** (hors faute lourde) se calcule sur le salaire global mensuel moyen des 12 derniers mois :\n\n" +
        "• **De 1 an à 5 ans d'ancienneté** : **30%** du salaire mensuel moyen par année de présence.\n" +
        "• **De 6 ans à 10 ans d'ancienneté** : **35%** par an.\n" +
        "• **Au-delà de 10 ans d'ancienneté** : **40%** par an.\n\n" +
        "**Préavis légal** : Ouvriers payés à l'heure (8 à 15 jours) ; Employés & Agents de maîtrise (1 mois) ; Cadres et assimilés (3 mois).\n" +
        "Le solde de tout compte inclut également l'indemnité compensatrice de congés payés non pris.";
    }
    if (q.includes('its') || q.includes('igr') || q.includes('fiscal') || q.includes('impot') || q.includes('dgi') || q.includes('barème') || q.includes('cn')) {
      return "La fiscalité sur les salaires en Côte d'Ivoire (Réforme DGI) s'établit comme suit :\n\n" +
        "• **ITS (Impôt sur Traitements et Salaires)** : retenue salariale de **1,2%** sur le brut imposable.\n" +
        "• **CN (Contribution Nationale)** : retenue salariale de **1,2%**.\n" +
        "• **IGR (Impôt Général sur le Revenu)** : calcul progressif par tranches après abattement de 20% (frais pro), 10% (impôts) et division par le nombre de **parts familiales (1 à 5 parts)**.\n" +
        "• **Charges Patronales DGI** : ITS Patronal (1,2%), Taxe d'Apprentissage (0,4%), FDFP formation continue (0,6% à 1,2%).";
    }
    if (q.includes('congé') || q.includes('absence') || q.includes('maternité') || q.includes('mariage') || q.includes('décès')) {
      return "En Côte d'Ivoire (Code du Travail Art. 25.1) :\n\n" +
        "• **Congés payés ordinaires** : **2,2 jours ouvrables** par mois de travail effectif, soit **26,4 jours ouvrables par an**.\n" +
        "• **Majoration d'ancienneté** : +1 jour après 5 ans, +2 jours après 10 ans, +3 jours après 15 ans.\n" +
        "• **Congé de maternité** : **14 semaines** consécutives indemnisées par la CNPS.\n" +
        "• **Permissions exceptionnelles payées** : Mariage du travailleur (4 jours), Mariage d'un enfant (2 jours), Naissance d'un enfant (2 jours), Décès du conjoint ou ascendant/descendant direct (4 jours).";
    }
    if (q.includes('cdd') || q.includes('24 mois') || q.includes('essai') || q.includes('contrat') || q.includes('cdi') || q.includes('précarité')) {
      return "Réglementation des contrats de travail en Côte d'Ivoire :\n\n" +
        "• **Durée maximale du CDD** : **24 mois consécutifs** (renouvellements inclus). Au-delà, requalification automatique en **CDI**.\n" +
        "• **Indemnité de fin de contrat (Prime de précarité)** : **3%** du total des rémunérations brutes perçues pendant la durée du CDD.\n" +
        "• **Période d'essai légale** : Ouvriers et manœuvres = 8 jours ; Employés mensualisés = 1 mois ; Cadres et ingénieurs = 3 mois renouvelable 1 fois.";
    }
    if (q.includes('sanction') || q.includes('discipline') || q.includes('mise à pied') || q.includes('blâme') || q.includes('avertissement') || q.includes('faute')) {
      return "La procédure disciplinaire légale en Côte d'Ivoire exige le respect strict des droits de la défense :\n\n" +
        "• **Échelle des sanctions** : 1. Avertissement écrit • 2. Blâme avec inscription au dossier • 3. Mise à pied temporaire sans salaire (**1 à 8 jours maximum**) • 4. Licenciement.\n" +
        "• **Procédure obligatoire** : Notification d'une demande d'explications écrites laissant au moins 48 heures au salarié pour répondre avant toute décision.\n" +
        "• **Délai de prescription** : Les sanctions doivent être notifiées dans un délai de 3 mois maximum suivant la connaissance des faits.";
    }
    if (q.includes('smig') || q.includes('smic') || q.includes('salaire minimum') || q.includes('75000') || q.includes('grille')) {
      return "En Côte d'Ivoire, le **SMIG (Salaire Minimum Interprofessionnel Garanti)** est fixé à **75 000 FCFA net / mois**.\n\n" +
        "Dans le secteur du BTP, les salaires minima conventionnels sont fixés par la grille catégorielle :\n" +
        "• Ouvriers et Manœuvres (Catégories 1 à 3)\n" +
        "• Ouvriers Spécialisés et Qualifiés (Catégories 4 à 6 - Coffreurs, Ferrailleurs, Grutiers)\n" +
        "• Chefs d'équipe et Conducteurs de travaux (Catégories 7 à 9)\n" +
        "• Cadres et Ingénieurs BTP (Catégories 10 à 12).";
    }
    if (q.includes('pointage') || q.includes('gps') || q.includes('géolocalisation') || q.includes('chantier') || q.includes('haversine')) {
      return "Le module **Pointage Mobile GEBAT** intègre :\n\n" +
        "• **Pointage GPS Satellite** : Détection des coordonnées latitude/longitude avec calcul de conformité géographique par formule de Haversine.\n" +
        "• **Périmètre Geofencing** : Rayon de tolérance configurable par chantier (ex: 250 mètres).\n" +
        "• **Pointage d'équipe groupé** : Permet au chef de chantier d'effectuer l'appel de son équipe en un clic pour synchronisation instantanée avec la paie.";
    }
    return "Bonjour ! En tant qu'Assistant IA RH & BTP pour GEBAT SA, je peux vous renseigner avec précision sur :\n\n" +
      "• **Le Code du Travail CI & Conventions BTP** (Congés, CDD/CDI, Essai, Sanctions).\n" +
      "• **La Paie & Charges Sociales** (Heures sup 15%/50%/100%, Cotisations CNPS, DISA annuelle).\n" +
      "• **La Fiscalité des Salaires** (ITS 1.2%, CN 1.2%, IGR barème progressif, DGI e-Impôts).\n" +
      "• **La Sécurité Chantier** (Dotations EPI conformes, Habilitations B2V/CACES).\n\n" +
      "Posez-moi votre question ou choisissez une suggestion ci-dessus !";
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = customPrompt || inputValue.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputValue('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/assistant', {
        prompt: textToSend,
        question: textToSend,
        context: 'GEBAT SA - SIRH & Gestion BTP Côte d\'Ivoire'
      });

      const replyText = res.data?.reply || res.data?.answer || res.data?.response || getLocalKnowledgeResponse(textToSend);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: replyText
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const fallbackText = getLocalKnowledgeResponse(textToSend);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: fallbackText
        }
      ]);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format basic bold and bullet markdown in responses
  const renderFormattedText = (text) => {
    return text.split('\n').map((line, idx) => {
      // Bold **text**
      const parts = [];
      const regex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-black text-slate-900">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            {parts.length > 0 ? parts : line.replace(/^[\s•-]+/, '')}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed min-h-[1rem]">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={15} className="animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-ping"></span>
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
                Assistant IA RH
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded">BTP</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Législation & Paie CI</p>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-full sm:max-w-md bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[520px] sm:h-[600px] max-h-[85vh] animate-scaleIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Assistant IA RH & BTP</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Droit CI • Paie • Fiscalité • Conventions BTP</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="bg-slate-50 border-b border-slate-200 p-3 overflow-x-auto custom-scrollbar flex gap-2">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-[10px] font-bold text-slate-700 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all shadow-sm shrink-0 flex items-center gap-1.5"
              >
                <Zap size={11} className="text-amber-500" /> {prompt.slice(0, 32)}...
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-sm">
                    IA
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-1 relative group ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium text-xs rounded-tr-none shadow-md'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none'
                  }`}
                >
                  {m.sender === 'ai' ? renderFormattedText(m.text) : <p className="text-xs">{m.text}</p>}
                  
                  {m.sender === 'ai' && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="text-[9px] font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check size={10} className="text-emerald-600" /> Copié
                          </>
                        ) : (
                          <>
                            <Copy size={10} /> Copier
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-black shrink-0 mt-1 shadow-sm">
                    RH
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                  IA
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-500">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  Recherche & analyse en cours...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez une question RH, paie ou BTP..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-emerald-600/30 disabled:opacity-40 shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AiRhAssistant;
