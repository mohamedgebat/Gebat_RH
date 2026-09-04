import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { Calculator, Download, Printer, CheckCircle2, TrendingUp, Info, PieChart, ArrowUpRight, DollarSign, FileText, Smartphone, ShieldCheck, Plus, Check, X, Building, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { calculateDetailedPaie } from '../utils/payrollCalc';
import { generateOfficialCIVBulletin } from '../utils/documentGenerator';

const Payroll = () => {
  const { data, loading, refreshData } = useData();
  const [selectedMonth, setSelectedMonth] = useState('Juin 2026');
  const [selectedEmpForPayslip, setSelectedEmpForPayslip] = useState(null);
  const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'advances', 'declarations', 'export'
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [newAdvance, setNewAdvance] = useState({ empId: '', montant: '', moisRemboursement: 'Juin 2026', motif: '' });

  const handleCloseMonth = async () => {
    if (window.confirm(`Voulez-vous clôturer la paie pour ${selectedMonth} ? Cette action est irréversible.`)) {
        try {
            const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
            const totals = activeEmps.reduce((acc, emp) => {
              const empAdvances = (data?.advances || []).filter(a => a.empId === emp.id && a.statut === 'Approuvé');
              const advanceTotal = empAdvances.reduce((sum, a) => sum + (a.montant || 0), 0);
              const p = calculateDetailedPaie(emp, advanceTotal);
              return { masseNette: acc.masseNette + p.netAPayer, masseBrute: acc.masseBrute + p.brutTotal };
            }, { masseNette: 0, masseBrute: 0 });

            const res = await axios.post('/api/payroll/close', {
              periode: selectedMonth,
              masseNette: totals.masseNette,
              masseBrute: totals.masseBrute,
              nbEmployes: activeEmps.length
            });
            alert(res.data.message);
            refreshData();
        } catch (err) {
            alert('Erreur lors de la clôture');
        }
    }
  };

  const getEmpAdvanceDeduction = (empId) => {
    const activeAdvances = (data?.advances || []).filter(a => a.empId === empId && a.statut === 'Approuvé');
    return activeAdvances.reduce((sum, a) => sum + (a.montant || 0), 0);
  };

  const calculatePaie = (emp) => {
    const advanceDeduction = getEmpAdvanceDeduction(emp.id);
    const details = calculateDetailedPaie(emp, advanceDeduction);
    return { 
      brut: details.brutTotal, 
      cnpsSalarial: details.cnpsSalarial, 
      cnpsPatronal: details.cnpsPatronal, 
      igr: details.itsNet,
      itsPatronal: details.taxesPatronalesDetails.itsPatronal,
      totalTaxesPatronales: details.taxesPatronalesDetails.totalTaxesPatronales,
      avance: details.avanceSurSalaire,
      net: details.netAPayer,
      details: details
    };
  };

  const handleCreateAdvance = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/advances', {
        empId: parseInt(newAdvance.empId),
        montant: parseFloat(newAdvance.montant),
        dateDemande: new Date().toISOString().split('T')[0],
        moisRemboursement: newAdvance.moisRemboursement,
        motif: newAdvance.motif,
        statut: 'Approuvé'
      });
      alert('Avance enregistrée et approuvée avec succès');
      setShowAdvanceModal(false);
      setNewAdvance({ empId: '', montant: '', moisRemboursement: 'Juin 2026', motif: '' });
      refreshData();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de l\'avance');
    }
  };

  const handleUpdateAdvanceStatus = async (advanceId, newStatus) => {
    try {
      await axios.patch(`/api/advances/${advanceId}`, { statut: newStatus });
      refreshData();
    } catch (err) {
      alert('Erreur lors de la mise à jour de l\'avance');
    }
  };

  const handleExportMobileMoneyCSV = () => {
    const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
    let csvContent = "data:text/csv;charset=utf-8,Matricule,Nom,Prenoms,ModePaiement,Telephone_MobileMoney,Montant_Net_FCFA\n";
    
    activeEmps.forEach(emp => {
      const paie = calculatePaie(emp);
      const phone = emp.numeroMobileMoney || emp.telephone || '';
      const mode = emp.modePaiement || 'Virement Bancaire';
      csvContent += `${emp.matricule},"${emp.nom}","${emp.prenoms}",${mode},${phone},${paie.net}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Paiement_Salaires_MobileMoney_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPayslip = (emp, payslipDetails) => {
    const company = data?.settings || {};
    generateOfficialCIVBulletin(emp, payslipDetails, company, selectedMonth);
  };

  const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
  const totals = activeEmps.reduce((acc, emp) => {
    const p = calculatePaie(emp);
    return { 
        net: acc.net + p.net, 
        brut: acc.brut + p.brut, 
        cnps: acc.cnps + p.cnpsSalarial + p.cnpsPatronal,
        cnpsSalarial: acc.cnpsSalarial + p.cnpsSalarial,
        cnpsPatronal: acc.cnpsPatronal + p.cnpsPatronal,
        cnpsPatronalRetraite: acc.cnpsPatronalRetraite + p.details.cnpsPatronalDetails.retraite,
        cnpsPatronalPF: acc.cnpsPatronalPF + p.details.cnpsPatronalDetails.prestationsFamiliales,
        cnpsPatronalAT: acc.cnpsPatronalAT + p.details.cnpsPatronalDetails.accidentTravail,
        itsSalarial: acc.itsSalarial + p.igr,
        itsPatronal: acc.itsPatronal + p.details.taxesPatronalesDetails.itsPatronal,
        taxeApprentissage: acc.taxeApprentissage + p.details.taxesPatronalesDetails.taxeApprentissage,
        fdfp: acc.fdfp + p.details.taxesPatronalesDetails.fdfp,
        advances: acc.advances + p.avance,
        taxesPatronales: acc.taxesPatronales + p.totalTaxesPatronales
    };
  }, { 
    net: 0, brut: 0, cnps: 0, cnpsSalarial: 0, cnpsPatronal: 0,
    cnpsPatronalRetraite: 0, cnpsPatronalPF: 0, cnpsPatronalAT: 0,
    itsSalarial: 0, itsPatronal: 0, taxeApprentissage: 0, fdfp: 0,
    advances: 0, taxesPatronales: 0 
  });

  if (loading) return <div className="p-10 text-center uppercase font-black tracking-widest text-ci-muted animate-pulse">Chargement de la paie ivoirienne...</div>;

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Gestion de la Paie Ivoirienne" 
        subtitle={`Conformité DGI, CNPS & Mobile Money • ${selectedMonth}`}
        actions={
          <div className="flex gap-3">
            <button 
                onClick={handleCloseMonth}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2"
            >
                <CheckCircle2 size={16} /> Clôturer la Paie
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 w-fit border border-slate-200">
        <button 
          onClick={() => setActiveTab('journal')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'journal' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Calculator size={15} /> Journal de Paie
        </button>
        <button 
          onClick={() => setActiveTab('advances')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'advances' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <DollarSign size={15} /> Avances & Prêts
        </button>
        <button 
          onClick={() => setActiveTab('declarations')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'declarations' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Building size={15} /> Déclarations CNPS & DGI
        </button>
        <button 
          onClick={() => setActiveTab('export')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'export' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Smartphone size={15} /> Mobile Money & Virements
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Total à Verser</p>
            <h3 className="text-3xl font-black mt-2 font-mono text-emerald-400">{new Intl.NumberFormat('fr-FR').format(totals.net)} F</h3>
            <div className="mt-4 text-[10px] font-bold text-slate-400 flex justify-between">
              <span>Retenue Avances: {new Intl.NumberFormat('fr-FR').format(totals.advances)} F</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Charges CNPS (Sociales)</p>
            <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">{new Intl.NumberFormat('fr-FR').format(totals.cnps)} F</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Salarial 6.3% + Patronal (Retraite, PF, AT)</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impôts Directs & Patronaux (DGI)</p>
            <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">{new Intl.NumberFormat('fr-FR').format(totals.igr + totals.taxesPatronales)} F</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">ITS Salarial ({new Intl.NumberFormat('fr-FR').format(totals.igr)} F) + ITS Pat/TA/FDFP</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masse Salariale Brute</p>
            <h3 className="text-2xl font-black text-slate-800 mt-2 font-mono">{new Intl.NumberFormat('fr-FR').format(totals.brut)} F</h3>
            <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase flex items-center gap-1"><ShieldCheck size={12}/> SMIC 75 000 F Respecté</p>
        </div>
      </div>

      {/* TAB 1: JOURNAL DE PAIE */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-wider">Livre de Paie Mensuel - Salariés Actifs</h3>
            <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600">{activeEmps.length} Salariés</span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                      <tr>
                          <th className="px-6 py-4 text-left">Employé</th>
                          <th className="px-6 py-4 text-right">Brut Total</th>
                          <th className="px-6 py-4 text-right">CNPS (6.3%)</th>
                          <th className="px-6 py-4 text-right">ITS (Retenu)</th>
                          <th className="px-6 py-4 text-right">Avance Déd.</th>
                          <th className="px-6 py-4 text-right">Net A Payer</th>
                          <th className="px-6 py-4 text-center">Bulletin</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {activeEmps.map((emp) => {
                          const paie = calculatePaie(emp);
                          return (
                              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <p className="font-black text-slate-800 uppercase">{emp.nom} {emp.prenoms}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">{emp.matricule} • {emp.poste} ({emp.nationalite || 'Ivoirienne'})</p>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold font-mono">{new Intl.NumberFormat('fr-FR').format(paie.brut)} F</td>
                                  <td className="px-6 py-4 text-right text-red-500 font-bold font-mono">-{new Intl.NumberFormat('fr-FR').format(paie.cnpsSalarial)} F</td>
                                  <td className="px-6 py-4 text-right text-red-500 font-bold font-mono">-{new Intl.NumberFormat('fr-FR').format(paie.igr)} F</td>
                                  <td className="px-6 py-4 text-right text-amber-600 font-bold font-mono">
                                    {paie.avance > 0 ? `-${new Intl.NumberFormat('fr-FR').format(paie.avance)} F` : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-black text-sm font-mono border border-emerald-200">
                                          {new Intl.NumberFormat('fr-FR').format(paie.net)} F
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <button 
                                          onClick={() => handlePrintPayslip(emp, paie.details)}
                                          title="Imprimer Bulletin"
                                          className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                      >
                                          <Printer size={16} />
                                      </button>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
        </div>
      )}

      {/* TAB 2: GESTION DES AVANCES SUR SALAIRE */}
      {activeTab === 'advances' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-black text-slate-800 uppercase text-sm">Gestion des Avances sur Salaire & Prêts</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Les avances approuvées sont automatiquement déduites de la paie mensuelle du salarié.</p>
            </div>
            <button 
              onClick={() => setShowAdvanceModal(true)}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800"
            >
              <Plus size={16}/> Saisir une Avance
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-xs font-medium">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left">Employé</th>
                  <th className="px-6 py-4 text-right">Montant (FCFA)</th>
                  <th className="px-6 py-4 text-center">Date Demande</th>
                  <th className="px-6 py-4 text-center">Mois Remboursement</th>
                  <th className="px-6 py-4 text-left">Motif</th>
                  <th className="px-6 py-4 text-center">Statut</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.advances || []).map((adv) => {
                  const emp = (data?.employees || []).find(e => e.id === adv.empId);
                  return (
                    <tr key={adv.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {emp ? `${emp.nom} ${emp.prenoms}` : `Employé #${adv.empId}`}
                      </td>
                      <td className="px-6 py-4 text-right font-black font-mono text-slate-900">
                        {new Intl.NumberFormat('fr-FR').format(adv.montant)} F
                      </td>
                      <td className="px-6 py-4 text-center text-slate-500">{adv.dateDemande || '-'}</td>
                      <td className="px-6 py-4 text-center font-bold text-slate-700">{adv.moisRemboursement || 'En cours'}</td>
                      <td className="px-6 py-4 text-slate-600 italic">{adv.motif || 'Aucun motif'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          adv.statut === 'Approuvé' ? 'bg-emerald-100 text-emerald-800' :
                          adv.statut === 'Refusé' ? 'bg-red-100 text-red-800' :
                          adv.statut === 'Remboursé' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {adv.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {adv.statut === 'En attente' && (
                            <>
                              <button 
                                onClick={() => handleUpdateAdvanceStatus(adv.id, 'Approuvé')}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white"
                                title="Approuver l'avance"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => handleUpdateAdvanceStatus(adv.id, 'Refusé')}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white"
                                title="Refuser l'avance"
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}
                          {adv.statut === 'Approuvé' && (
                            <button 
                              onClick={() => handleUpdateAdvanceStatus(adv.id, 'Remboursé')}
                              className="px-3 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-lg hover:bg-blue-600 hover:text-white uppercase"
                            >
                              Solder
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!data?.advances || data.advances.length === 0) && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400 font-bold uppercase text-xs">
                      Aucune demande d'avance sur salaire enregistrée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DECLARATIONS CNPS & DGI */}
      {activeTab === 'declarations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CNPS BOX */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base uppercase">Déclaration CNPS Côte d'Ivoire</h3>
                <p className="text-xs text-slate-500 font-medium">Cotisations Sociales Mensuelles & Support DISA</p>
              </div>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Building size={20}/></span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Retraite Salariale (6.3% - max 3.375M)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.cnpsSalarial)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Retraite Patronale (7.7% - max 3.375M)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.cnpsPatronalRetraite)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Prestations Familiales (5.75% - max 70k)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.cnpsPatronalPF)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Accident du Travail (3.00% - max 70k)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.cnpsPatronalAT)} F</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-900 uppercase text-sm">Total à payer CNPS</span>
                <span className="font-black font-mono text-emerald-600 text-lg">{new Intl.NumberFormat('fr-FR').format(totals.cnpsSalarial + totals.cnpsPatronal)} F CFA</span>
              </div>
            </div>
          </div>

          {/* DGI BOX */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-base uppercase">Impôts sur Salaires - DGI (e-Impôts)</h3>
                <p className="text-xs text-slate-500 font-medium">Réforme Fiscale 2024 - Impôt Unique (ITS)</p>
              </div>
              <span className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><FileText size={20}/></span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">ITS Salarial (Retenu à la source)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.itsSalarial)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">ITS Patronal (1.2% / 12% Expat)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.itsPatronal)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Taxe d'Apprentissage (TA 0.4%)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.taxeApprentissage)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Taxe Formation Continue (FDFP 0.6%)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.fdfp)} F</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-black text-slate-900 uppercase text-sm">Total à payer DGI</span>
                <span className="font-black font-mono text-orange-600 text-lg">{new Intl.NumberFormat('fr-FR').format(totals.itsSalarial + totals.taxesPatronales)} F CFA</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPORT MOBILE MONEY & VIREMENT */}
      {activeTab === 'export' && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base uppercase">Ordres de Virement & Mobile Money</h3>
              <p className="text-xs text-slate-500 font-medium">Exportation des fichiers pour paiement Wave, Orange Money, MTN MoMo et Banques</p>
            </div>
            <button 
              onClick={handleExportMobileMoneyCSV}
              className="bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-emerald-700 shadow-lg"
            >
              <Download size={16}/> Télécharger Fichier CSV de Paiement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800 uppercase text-xs">Virements Bancaires</span>
                <Wallet size={20} className="text-slate-600" />
              </div>
              <p className="text-2xl font-black font-mono text-slate-900">
                {new Intl.NumberFormat('fr-FR').format(
                  activeEmps.filter(e => !e.modePaiement || e.modePaiement === 'Virement Bancaire').reduce((s, e) => s + calculatePaie(e).net, 0)
                )} F
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase">NSIA, SGCI, Ecobank, BOA</p>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-amber-900 uppercase text-xs">Orange / MTN / Moov</span>
                <Smartphone size={20} className="text-amber-600" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-900">
                {new Intl.NumberFormat('fr-FR').format(
                  activeEmps.filter(e => e.modePaiement && (e.modePaiement.includes('Orange') || e.modePaiement.includes('MTN'))).reduce((s, e) => s + calculatePaie(e).net, 0)
                )} F
              </p>
              <p className="text-[10px] text-amber-700 font-bold uppercase">Paiement Mobile Money direct</p>
            </div>

            <div className="p-6 bg-sky-50 border border-sky-200 rounded-3xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-black text-sky-900 uppercase text-xs">Wave Digital</span>
                <Smartphone size={20} className="text-sky-600" />
              </div>
              <p className="text-2xl font-black font-mono text-sky-900">
                {new Intl.NumberFormat('fr-FR').format(
                  activeEmps.filter(e => e.modePaiement === 'Wave').reduce((s, e) => s + calculatePaie(e).net, 0)
                )} F
              </p>
              <p className="text-[10px] text-sky-700 font-bold uppercase">Wave Bulk Payout API</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Saisie d'Avance */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
            <h3 className="font-black text-slate-900 uppercase text-lg">Enregistrer une Avance sur Salaire</h3>
            
            <form onSubmit={handleCreateAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Salarié Beneficiaire</label>
                <select 
                  required
                  value={newAdvance.empId}
                  onChange={(e) => setNewAdvance({...newAdvance, empId: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  <option value="">-- Choisir un salarié --</option>
                  {activeEmps.map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.matricule})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Montant de l'Avance (FCFA)</label>
                <input 
                  type="number"
                  required
                  placeholder="Ex: 50000"
                  value={newAdvance.montant}
                  onChange={(e) => setNewAdvance({...newAdvance, montant: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mois de Retenue</label>
                <input 
                  type="text"
                  required
                  value={newAdvance.moisRemboursement}
                  onChange={(e) => setNewAdvance({...newAdvance, moisRemboursement: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Motif de la demande</label>
                <textarea 
                  rows="2"
                  placeholder="Ex: Scolarité des enfants, soins médicaux..."
                  value={newAdvance.motif}
                  onChange={(e) => setNewAdvance({...newAdvance, motif: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-black text-xs uppercase rounded-xl hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-emerald-600 text-white font-black text-xs uppercase rounded-xl hover:bg-emerald-700 shadow-md"
                >
                  Approuver & Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
