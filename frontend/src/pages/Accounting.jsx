import React from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { Link, Database, ShieldCheck, Code, ArrowRightLeft, CheckCircle2, Download } from 'lucide-react';
import { calculateDetailedPaie } from '../utils/payrollCalc';

const Accounting = () => {
  const { data, loading } = useData();

  if (loading) return <div className="p-10 text-center uppercase font-black text-ci-muted animate-pulse">Chargement de la comptabilité...</div>;

  const apiKey = data?.settings?.apiKey || 'sk_live_sirh_98a76d5e4c3b2a10';
  const activeEmployees = (data?.employees || []).filter(e => e.statut === 'Actif' && !e.is_deleted);

  const handleExportODPaie = () => {
    let csv = "data:text/csv;charset=utf-8,CompteSYSCOHADA,LibelleCompte,DebitFCFA,CreditFCFA\n";
    
    let totalBrut = 0;
    let totalCNPSSalarial = 0;
    let totalCNPSPatronal = 0;
    let totalITS = 0;
    let totalITSPatronal = 0;
    let totalNet = 0;

    activeEmployees.forEach(emp => {
      const p = calculateDetailedPaie(emp, 0);
      totalBrut += p.brutTotal;
      totalCNPSSalarial += p.cnpsSalarial;
      totalCNPSPatronal += p.cnpsPatronal;
      totalITS += p.itsNet;
      totalITSPatronal += p.taxesPatronalesDetails.itsPatronal + p.taxesPatronalesDetails.taxeApprentissage + p.taxesPatronalesDetails.fdfp;
      totalNet += p.netAPayer;
    });

    // Écritures SYSCOHADA
    csv += `641100,Salaires de base et appointements,${Math.round(totalBrut)},0\n`;
    csv += `645100,Cotisations patronales CNPS,${Math.round(totalCNPSPatronal)},0\n`;
    csv += `647100,Charges fiscales patronales (ITS/TA/FDFP),${Math.round(totalITSPatronal)},0\n`;
    csv += `431100,CNPS Retenues salariales & patronales,0,${Math.round(totalCNPSSalarial + totalCNPSPatronal)}\n`;
    csv += `447100,État Impôts retenus a la source (ITS),0,${Math.round(totalITS + totalITSPatronal)}\n`;
    csv += `422100,Personnel Rémunérations dues (Net a payer),0,${Math.round(totalNet)}\n`;

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Journal_OD_Paie_SYSCOHADA_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="API & Comptabilité SYSCOHADA" 
        subtitle="Interconnexion avec vos systèmes financiers (Sage, SAP, Odoo, QuickBooks)"
      />

      <div className="bg-white rounded-[3rem] p-10 border border-ci-border shadow-xl mb-10">
        <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 bg-ci-infoLight rounded-[2rem] flex items-center justify-center text-ci-info">
                <Database size={32} />
            </div>
            <div>
                <h3 className="text-xl font-black text-ci-text tracking-tighter uppercase">Statut de la Synchronisation</h3>
                <p className="text-sm font-medium text-ci-muted">Système connecté à la base de données SIRH-CIV</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-ci-greenLight px-4 py-2 rounded-full text-ci-green text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 size={14} /> Service Actif (SYSCOHADA)
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
                <h4 className="text-xs font-black text-ci-muted uppercase tracking-[0.3em] border-b pb-4">Configuration API SaaS</h4>
                <div className="space-y-4">
                    <div className="p-6 bg-ci-bg rounded-[2rem] border border-ci-border">
                        <p className="text-[9px] font-black text-ci-muted uppercase mb-2">Clé d'accès Privée Active</p>
                        <div className="flex items-center justify-between">
                            <code className="text-xs font-mono font-bold text-ci-text tracking-widest">{apiKey}</code>
                            <button 
                              onClick={() => { navigator.clipboard.writeText(apiKey); alert('Clé API copiée !'); }}
                              className="text-[10px] font-black text-ci-info uppercase hover:underline"
                            >
                              Copier
                            </button>
                        </div>
                    </div>
                    <div className="p-6 bg-ci-bg rounded-[2rem] border border-ci-border">
                        <p className="text-[9px] font-black text-ci-muted uppercase mb-2">Endpoint de Destination Webhook</p>
                        <p className="text-xs font-bold text-ci-text font-mono">https://api.compta-ci.com/v1/payroll</p>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                <h4 className="text-xs font-black text-ci-muted uppercase tracking-[0.3em] border-b pb-4">Actions Rapides Comptables</h4>
                <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={handleExportODPaie}
                      className="w-full py-5 bg-ci-text text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
                    >
                        <ArrowRightLeft size={16} /> Exporter Journal OD Paie (SYSCOHADA CSV)
                    </button>
                    <button 
                      onClick={() => alert("Spécification Webhook API disponible dans la documentation intégrée.")}
                      className="w-full py-5 bg-white border-2 border-ci-border text-ci-text rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-ci-bg transition-all flex items-center justify-center gap-3"
                    >
                        <Code size={16} /> Documentation Webhook & Format Sage/SAP
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
