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
        context: 'GEBAT SA - SIRH & Gestion BTP Côte d\'Ivoire'
      });

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data?.reply || res.data?.response || "Je n'ai pas pu obtenir une réponse pour le moment."
      };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: "Désolé, une erreur est survenue lors de la communication avec le service IA. Veuillez réessayer."
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
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-ping"></span>
            </div>
            <div className="text-left pr-1">
              <div className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
                Assistant IA RH
                <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-bold px-1.5 py-0.2 rounded">BTP</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Législation & Paie CI</p>
            </div>
          </button>
        )}
      </div>

      {/* Chat Window Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] max-h-[85vh] animate-scaleIn">
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
