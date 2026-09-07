import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { HelpCircle, Phone, Mail, MessageSquare, BookOpen, ChevronDown, ChevronUp, Send, CheckCircle, X } from 'lucide-react';

const Support = () => {
  const { data } = useData();
  const settings = data?.settings || {};
  const [openFaq, setOpenFaq] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'Technique', message: '' });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const phone = settings.phone || '+225 27 22 00 00 00';
  const email = settings.email || 'support@gebat-sa.com';

  const faqs = [
    { 
      q: "Comment modifier un bulletin déjà clôturé ?", 
      a: "Un bulletin clôturé fige les cotisations légales (CNPS, ITS). Seul un utilisateur avec le rôle Administrateur RH peut rouvrir la période de paie via le module Paramètres ou générer un bulletin d'ajustement / rappel." 
    },
    { 
      q: "Calcul de l'IGR & ITS : quels sont les barèmes ivoiriens appliqués ?", 
      a: "L'application respecte à 100% le Code Général des Impôts de Côte d'Ivoire (ITS 1,2%, CN 1,2%, IGR progressif avec déduction des parts familiales et abattements de 20% et 10%)." 
    },
    { 
      q: "Comment ajouter un nouveau site de travail ou département ?", 
      a: "Rendez-vous dans 'Paramètres' > 'Paramètres de l'Entreprise' pour configurer vos départements, sites de travail géolocalisés et plafonds CNPS." 
    },
    {
      q: "Comment fonctionne la détection des conflits de planning sur les congés ?",
      a: "Le système analyse en temps réel les départs simultanés au sein d'un même département. Dès qu'un seuil critique est atteint, une alerte est générée pour les managers."
    },
    {
      q: "Comment exporter le récapitulatif mensuel pour la déclaration CNPS (DISA) ?",
      a: "Dans l'onglet 'Paie', cliquez sur 'Export Récapitulatif' ou 'Livre de Paie' pour obtenir les montants bruts plafonnés et les cotisations patronales/salariales prêtes pour la plateforme CNPS."
    }
  ];

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setShowChatModal(false);
      setTicketForm({ subject: '', category: 'Technique', message: '' });
      alert('Votre ticket a été envoyé avec succès à l\'équipe support GEBAT RH. Un accusé de réception a été généré.');
    }, 1200);
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Support & Aide" 
        subtitle="Assistance technique, documentation et accompagnement utilisateurs"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <a 
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="bg-white p-8 rounded-[3rem] border border-ci-border shadow-sm text-center group hover:border-ci-green hover:shadow-xl transition-all block"
        >
            <div className="w-16 h-16 bg-ci-greenLight text-ci-green rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Phone size={28} />
            </div>
            <h4 className="font-black text-ci-text uppercase text-sm tracking-tight">Support Téléphone</h4>
            <p className="text-xs font-bold text-ci-muted mt-2 uppercase tracking-widest">{phone}</p>
            <span className="inline-block mt-3 text-[10px] font-black text-ci-green uppercase tracking-widest">Appeler maintenant &rarr;</span>
        </a>

        <a 
          href={`mailto:${email}?subject=Demande%20d'assistance%20SIRH%20GEBAT`}
          className="bg-white p-8 rounded-[3rem] border border-ci-border shadow-sm text-center group hover:border-ci-orange hover:shadow-xl transition-all block"
        >
            <div className="w-16 h-16 bg-ci-orangeLight text-ci-orange rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Mail size={28} />
            </div>
            <h4 className="font-black text-ci-text uppercase text-sm tracking-tight">Support Email</h4>
            <p className="text-xs font-bold text-ci-muted mt-2 uppercase tracking-widest">{email}</p>
            <span className="inline-block mt-3 text-[10px] font-black text-ci-orange uppercase tracking-widest">Envoyer un email &rarr;</span>
        </a>

        <div className="bg-white p-8 rounded-[3rem] border border-ci-border shadow-sm text-center group hover:border-ci-info hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
              <div className="w-16 h-16 bg-blue-50 text-ci-info rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare size={28} />
              </div>
              <h4 className="font-black text-ci-text uppercase text-sm tracking-tight">Assistance & Ticket</h4>
              <p className="text-xs font-bold text-ci-muted mt-2 uppercase tracking-widest">Équipe disponible 8h-18h</p>
            </div>
            <button 
              onClick={() => setShowChatModal(true)}
              className="text-[10px] font-black text-white bg-ci-info hover:bg-blue-600 px-6 py-3 rounded-2xl mt-4 uppercase tracking-widest shadow-md transition-all"
            >
              Ouvrir un ticket
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-ci-border shadow-xl overflow-hidden mb-10">
        <div className="px-10 py-6 bg-ci-bg border-b border-ci-border flex items-center gap-4">
            <BookOpen className="text-ci-text" size={20} />
            <h3 className="text-xs font-black text-ci-text uppercase tracking-widest">Foire Aux Questions (FAQ) & Guide Pratique</h3>
        </div>
        <div className="divide-y divide-ci-bg">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div 
                  key={i} 
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="p-8 hover:bg-ci-bg/30 transition-colors cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-ci-text hover:text-ci-green transition-colors">{faq.q}</h4>
                        {isOpen ? <ChevronUp className="text-ci-orange" size={20} /> : <ChevronDown className="text-ci-muted" size={20} />}
                    </div>
                    {isOpen && (
                      <p className="text-xs font-medium text-ci-muted mt-4 leading-relaxed bg-ci-bg/50 p-4 rounded-2xl border border-ci-border/50 animate-fadeIn">
                        {faq.a}
                      </p>
                    )}
                </div>
              );
            })}
        </div>
      </div>

      {showChatModal && (
        <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-ci-info rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Ouvrir un ticket d'assistance</h3>
                  <p className="text-[10px] font-bold text-ci-muted uppercase">Support technique SIRH GEBAT</p>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} className="p-2 bg-ci-bg rounded-xl"><X size={18} /></button>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Type de demande</label>
                <select 
                  value={ticketForm.category} 
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm"
                >
                  <option value="Technique">Bug technique ou dysfonctionnement</option>
                  <option value="Paie">Question sur les calculs de Paie / CNPS / Impôts</option>
                  <option value="Formation">Demande de formation utilisateur</option>
                  <option value="Amélioration">Suggestion d'évolution du SIRH</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Objet du ticket</label>
                <input 
                  required 
                  value={ticketForm.subject} 
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm" 
                  placeholder="Ex: Correction de l'abattement IGR pour salarié étranger" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-ci-muted">Description détaillée</label>
                <textarea 
                  required 
                  rows={4}
                  value={ticketForm.message} 
                  onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 bg-ci-bg rounded-xl font-bold outline-none text-sm resize-none" 
                  placeholder="Expliquez la situation avec un maximum de précisions..." 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={ticketSubmitted}
                  className="w-full py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {ticketSubmitted ? (
                    <>
                      <CheckCircle size={16} className="text-ci-green" /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Envoyer le ticket de support
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
