import React from 'react';
import PageHeader from '../components/PageHeader';
import { HelpCircle, Phone, Mail, MessageSquare, BookOpen, ChevronRight } from 'lucide-react';

const Support = () => {
  const faqs = [
    { q: "Comment modifier un bulletin déjà clôturé ?", a: "Contactez l'administrateur système pour réouvrir la période de paie." },
    { q: "Calcul de l'IGR : quels sont les taux ?", a: "L'application suit le barème progressif de la DGI Côte d'Ivoire mis à jour en 2024." },
    { q: "Comment ajouter un nouveau site de travail ?", a: "Allez dans les paramètres système ou contactez le support technique." },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader 
        title="Support & Aide" 
        subtitle="Assistance technique et documentation utilisateur"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[3rem] border border-ci-border shadow-sm text-center group hover:border-ci-green transition-all">
            <div className="w-16 h-16 bg-ci-greenLight text-ci-green rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Phone size={28} />
            </div>
            <h4 className="font-black text-ci-text uppercase text-sm tracking-tight">Support Téléphone</h4>
            <p className="text-xs font-bold text-ci-muted mt-2 uppercase tracking-widest">+225 27 22 00 00 00</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-ci-border shadow-sm text-center group hover:border-ci-orange transition-all">
            <div className="w-16 h-16 bg-ci-orangeLight text-ci-orange rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Mail size={28} />
            </div>
            <h4 className="font-black text-ci-text uppercase text-sm tracking-tight">Support Email</h4>
            <p className="text-xs font-bold text-ci-muted mt-2 uppercase tracking-widest">support@sirh.ci</p>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-ci-border shadow-sm text-center group hover:border-ci-info transition-all">
            <div className="w-16 h-16 bg-blue-50 text-ci-info rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={28} />
            </div>
            <h4 className="font-black text-ci-text uppercase text-sm tracking-tight">Chat en Direct</h4>
            <button className="text-[9px] font-black text-white bg-ci-info px-4 py-2 rounded-full mt-4 uppercase tracking-widest">Démarrer</button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-ci-border shadow-xl overflow-hidden">
        <div className="px-10 py-6 bg-ci-bg border-b border-ci-border flex items-center gap-4">
            <BookOpen className="text-ci-text" size={20} />
            <h3 className="text-xs font-black text-ci-text uppercase tracking-widest">Foire Aux Questions (FAQ)</h3>
        </div>
        <div className="divide-y divide-ci-bg">
            {faqs.map((faq, i) => (
                <div key={i} className="p-10 hover:bg-ci-bg/30 transition-colors group cursor-pointer flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-ci-text group-hover:text-ci-green transition-colors">{faq.q}</h4>
                        <p className="text-xs font-medium text-ci-muted mt-2 leading-relaxed">{faq.a}</p>
                    </div>
                    <ChevronRight className="text-ci-muted" size={20} />
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
