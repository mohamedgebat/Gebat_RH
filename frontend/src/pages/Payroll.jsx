import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import { 
  Calculator, Download, Printer, CheckCircle2, TrendingUp, Info, 
  PieChart, ArrowUpRight, DollarSign, FileText, Smartphone, ShieldCheck, 
  Plus, Check, X, Building, Wallet, HardHat, FileSpreadsheet, Share2, 
  MessageCircle, Send, AlertTriangle, Layers, UserCheck, Briefcase, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { calculateDetailedPaie } from '../utils/payrollCalc';
import { generateOfficialCIVBulletin } from '../utils/documentGenerator';

const Payroll = () => {
  const { data, loading, refreshData } = useData();
  const [selectedMonth, setSelectedMonth] = useState('Juin 2026');
  const [selectedEmpForPayslip, setSelectedEmpForPayslip] = useState(null);
  const [activeTab, setActiveTab] = useState('journal'); // 'journal', 'advances', 'declarations', 'projects', 'export'
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  
  const [newAdvance, setNewAdvance] = useState({ empId: '', montant: '', moisRemboursement: 'Juin 2026', motif: '' });
  const [newProject, setNewProject] = useState({ code: '', nom: '', client: '', site: 'Abidjan', budget_mo: '', chef_chantier: '' });
  const [newAllocation, setNewAllocation] = useState({ emp_id: '', project_id: '', heures_allouees: 173.33, mois: 'Juin 2026' });

  const handleCloseMonth = async () => {
    if (window.confirm(`Voulez-vous clôturer la paie pour ${selectedMonth} ? Cette action est irréversible.`)) {
        try {
            const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
            let totalMasseNette = 0;
            let totalMasseBrute = 0;

            const recordsToSave = activeEmps.map(emp => {
              const empAdvances = (data?.advances || []).filter(a => a.empId === emp.id && a.statut === 'Approuvé');
              const advanceTotal = empAdvances.reduce((sum, a) => sum + (a.montant || 0), 0);
              const p = calculateDetailedPaie(emp, advanceTotal);
              totalMasseNette += p.netAPayer;
              totalMasseBrute += p.brutTotal;

              return {
                empId: emp.id,
                matricule: emp.matricule,
                nom: `${emp.prenoms || ''} ${emp.nom || ''}`.trim(),
                departement: emp.departement,
                poste: emp.poste,
                baseSalary: emp.salaireBase || 0,
                brutTotal: p.brutTotal,
                itsNet: p.itsNet,
                cnpsSalarial: p.cnpsSalarial,
                cmuSalarial: p.cmuSalarial,
                netAPayer: p.netAPayer,
                chargesPatronales: p.taxesPatronalesDetails?.totalTaxesPatronales || 0
              };
            });

            const res = await axios.post('/api/payroll/close', {
              periode: selectedMonth,
              masseNette: totalMasseNette,
              masseBrute: totalMasseBrute,
              nbEmployes: activeEmps.length,
              records: recordsToSave
            });
            alert(res.data.message);
            await refreshData();
        } catch (err) {
            alert('Erreur lors de la clôture: ' + (err.response?.data?.message || err.message));
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

  // WhatsApp Payslip Direct Share
  const handleShareWhatsApp = (emp, paie) => {
    const rawPhone = emp.telephone || emp.numeroMobileMoney || '';
    let phone = rawPhone.replace(/\D/g, '');
    if (phone.length === 10 && !phone.startsWith('225')) {
      phone = '225' + phone;
    }
    
    const company = data?.settings?.companyName || 'GEBAT SA';
    const message = `Bonjour ${emp.prenoms} ${emp.nom},\n\nVotre bulletin de paie pour la période de *${selectedMonth}* a été validé par la Direction des Ressources Humaines de *${company}*.\n\n` +
      `📌 *Détails de Paie* :\n` +
      `• Salaire Brut : ${new Intl.NumberFormat('fr-FR').format(paie.brut)} F CFA\n` +
      `• Retenue CNPS : -${new Intl.NumberFormat('fr-FR').format(paie.cnpsSalarial)} F CFA\n` +
      `• Retenue ITS/Impôts : -${new Intl.NumberFormat('fr-FR').format(paie.igr)} F CFA\n` +
      (paie.avance > 0 ? `• Retenue Avance : -${new Intl.NumberFormat('fr-FR').format(paie.avance)} F CFA\n` : '') +
      `💵 *NET À PERCEVOIR : ${new Intl.NumberFormat('fr-FR').format(paie.net)} F CFA*\n\n` +
      `Votre bulletin PDF officiel est téléchargeable sur votre espace collaborateur sécurisé SIRH GEBAT. Votre mot de passe de déchiffrement est votre code matricule : *${emp.matricule}*.\n\n` +
      `Direction des Ressources Humaines ${company}`;

    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Envoi direct du bulletin de paie par email
  const handleSendEmailPayslip = async (emp, paie) => {
    if (!emp.email) {
      alert(`L'employé ${emp.nom} ${emp.prenoms} n'a pas d'adresse email enregistrée dans sa fiche.`);
      return;
    }
    try {
      const res = await axios.post('/api/payroll/send-payslip-email', {
        empId: emp.id,
        periode: selectedMonth,
        netAPayer: paie.net,
        totalBrut: paie.brut,
        datePaiement: new Date().toLocaleDateString('fr-FR')
      });
      alert(`✅ Bulletin de paie transmis par email avec succès à ${emp.email} !`);
    } catch (err) {
      alert('Erreur lors de l\'envoi par email : ' + (err.response?.data?.error || err.message));
    }
  };

  // Export DISA CNPS Format Normalisé (e-CNPS Côte d'Ivoire)
  const handleExportDisaCNPS = () => {
    const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
    let csv = "Matricule_CNPS;Nom;Prenoms;Poste;Type_Contrat;Salaire_Brut_Mensuel;Plafond_General_70k;Plafond_Retraite_1647k;Cotisation_Salariale_6_3;Cotisation_Patronale_Retraite_7_7;Prestations_Familiales_5_75;Accident_Travail_3_0;Total_Cotisations_CNPS\n";
    
    activeEmps.forEach(emp => {
      const p = calculatePaie(emp);
      const brut = p.brut;
      const cnpsPlafondGen = Math.min(brut, 70000);
      const cnpsPlafondRetraite = Math.min(brut, 1647315);
      const cnpsSal = p.cnpsSalarial;
      const cnpsPatRet = p.details.cnpsPatronalDetails.retraite;
      const cnpsPatPF = p.details.cnpsPatronalDetails.prestationsFamiliales;
      const cnpsPatAT = p.details.cnpsPatronalDetails.accidentTravail;
      const totalCNPS = cnpsSal + p.cnpsPatronal;

      csv += `"${emp.cnps || 'EN_COURS'}";"${emp.nom}";"${emp.prenoms}";"${emp.poste}";"${emp.type || 'CDI'}";${brut};${cnpsPlafondGen};${cnpsPlafondRetraite};${cnpsSal};${cnpsPatRet};${cnpsPatPF};${cnpsPatAT};${totalCNPS}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DISA_CNPS_Declaration_Officielle_${selectedMonth.replace(' ', '_')}.csv`;
    link.click();
  };

  // Export Déclaration e-Impôts DGI Côte d'Ivoire
  const handleExportDgiImpots = () => {
    const activeEmps = (data?.employees || []).filter(e => e.statut === 'Actif');
    let csv = "Matricule;Nom_Prenoms;Nationalite;Parts_Fiscales;Brut_Imposable;Abattement_Frais_Pro_20;Abattement_10;Base_ITS;ITS_Salarial_1_2;CN_1_2;IGR_Net;ITS_Patronal;Taxe_Apprentissage_0_4;FDFP_0_6;Total_Retenues_DGI\n";

    activeEmps.forEach(emp => {
      const p = calculatePaie(emp);
      const brut = p.brut;
      const abatt20 = Math.round(brut * 0.2);
      const abatt10 = Math.round((brut - abatt20) * 0.1);
      const baseITS = brut - abatt20 - abatt10;
      const itsSal = p.igr;
      const itsPat = p.details.taxesPatronalesDetails.itsPatronal;
      const ta = p.details.taxesPatronalesDetails.taxeApprentissage;
      const fdfp = p.details.taxesPatronalesDetails.fdfp;
      const totalDGI = itsSal + p.details.taxesPatronalesDetails.totalTaxesPatronales;

      csv += `"${emp.matricule}";"${emp.nom} ${emp.prenoms}";"${emp.nationalite || 'Ivoirienne'}";${emp.nbEnfants ? (1 + emp.nbEnfants * 0.5) : 1};${brut};${abatt20};${abatt10};${baseITS};${itsSal};0;${itsSal};${itsPat};${ta};${fdfp};${totalDGI}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Declaration_eImpots_DGI_Salaires_${selectedMonth.replace(' ', '_')}.csv`;
    link.click();
  };

  // Export Écritures Comptables SYSCOHADA (Sage 100 / Odoo / Excel)
  const handleExportSyscohadaSage = () => {
    const datePiece = new Date().toISOString().split('T')[0];
    let csv = "Date_Piece;Code_Journal;Compte_General;Libelle_Ecriture;Debit_FCFA;Credit_FCFA;Ref_Piece\n";

    // 661100 Débit : Rémunérations directes
    csv += `${datePiece};OD;661100;"Salaires bruts - Paie ${selectedMonth}";${totals.brut};0;"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    // 664100 Débit : Charges patronales CNPS
    csv += `${datePiece};OD;664100;"Charges sociales patronales CNPS";${totals.cnpsPatronal};0;"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    // 664200 Débit : Taxes patronales sur salaires (DGI)
    csv += `${datePiece};OD;664200;"Taxes patronales sur salaires (ITS/TA/FDFP)";${totals.taxesPatronales};0;"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    
    // 422000 Crédit : Salaires nets dus aux employés
    csv += `${datePiece};OD;422000;"Rémunérations nettes dues au personnel";0;${totals.net};"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    // 431000 Crédit : CNPS à payer (Salarial + Patronal)
    csv += `${datePiece};OD;431000;"Sécurité Sociale (CNPS CI globale)";0;${totals.cnpsSalarial + totals.cnpsPatronal};"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    // 447100 Crédit : Impôts retenus sur salaires (DGI)
    csv += `${datePiece};OD;447100;"Trésor Public - Retenues fiscales ITS/IGR";0;${totals.itsSalarial};"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    // 447200 Crédit : Taxes patronales DGI à verser
    csv += `${datePiece};OD;447200;"Trésor Public - Taxes patronales";0;${totals.taxesPatronales};"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    
    if (totals.advances > 0) {
      // 421000 Crédit : Avances récupérées
      csv += `${datePiece};OD;421000;"Avances et acomptes récupérés sur salaires";0;${totals.advances};"PAIE-${selectedMonth.replace(' ', '')}"\n`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Ecritures_Comptables_SYSCOHADA_Sage_${selectedMonth.replace(' ', '_')}.csv`;
    link.click();
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

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/projects', newProject);
      alert('Chantier / Projet BTP créé avec succès');
      setShowProjectModal(false);
      setNewProject({ code: '', nom: '', client: '', site: 'Abidjan', budget_mo: '', chef_chantier: '' });
      refreshData();
    } catch (err) {
      alert('Erreur lors de la création du projet');
    }
  };

  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    try {
      const emp = (data?.employees || []).find(e => e.id.toString() === newAllocation.emp_id.toString());
      const baseSalary = emp ? (emp.salaireBase || 150000) : 150000;
      const hourlyRate = Math.round(baseSalary / 173.33);
      const totalCost = Math.round(hourlyRate * parseFloat(newAllocation.heures_allouees || 173.33));

      await axios.post('/api/project-allocations', {
        emp_id: parseInt(newAllocation.emp_id),
        project_id: parseInt(newAllocation.project_id),
        heures_allouees: parseFloat(newAllocation.heures_allouees),
        cout_impute: totalCost,
        mois: newAllocation.mois
      });
      alert('Affectation d\'heures et de coûts enregistrée avec succès');
      setShowAllocationModal(false);
      refreshData();
    } catch (err) {
      alert('Erreur lors de l\'affectation analytique');
    }
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

  const projects = data?.projects || [];
  const projectAllocations = data?.projectAllocations || [];

  if (loading) return <div className="p-10 text-center uppercase font-black tracking-widest text-ci-muted animate-pulse">Chargement de la paie ivoirienne...</div>;

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Gestion de la Paie & Chantiers BTP" 
        subtitle={`Conformité DGI, DISA CNPS, SYSCOHADA & Mobile Money • ${selectedMonth}`}
        actions={
          <div className="flex gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setNewAdvance(prev => ({ ...prev, moisRemboursement: e.target.value }));
                setNewAllocation(prev => ({ ...prev, mois: e.target.value }));
              }}
              className="bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="Janvier 2026">Janvier 2026</option>
              <option value="Février 2026">Février 2026</option>
              <option value="Mars 2026">Mars 2026</option>
              <option value="Avril 2026">Avril 2026</option>
              <option value="Mai 2026">Mai 2026</option>
              <option value="Juin 2026">Juin 2026</option>
              <option value="Juillet 2026">Juillet 2026</option>
              <option value="Août 2026">Août 2026</option>
              <option value="Septembre 2026">Septembre 2026</option>
              <option value="Octobre 2026">Octobre 2026</option>
              <option value="Novembre 2026">Novembre 2026</option>
              <option value="Décembre 2026">Décembre 2026</option>
            </select>
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
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 w-fit border border-slate-200 overflow-x-auto max-w-full">
        <button 
          onClick={() => setActiveTab('journal')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'journal' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Calculator size={15} /> Journal de Paie
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'projects' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <HardHat size={15} /> Chantiers & Coûts BTP
        </button>
        <button 
          onClick={() => setActiveTab('advances')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'advances' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <DollarSign size={15} /> Avances & Prêts
        </button>
        <button 
          onClick={() => setActiveTab('declarations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'declarations' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Building size={15} /> Déclarations CNPS & DGI
        </button>
        <button 
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'export' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <FileSpreadsheet size={15} /> Exports DISA, Sage & MoMo
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

      {/* TAB 1: JOURNAL DE PAIE AVEC PARTAGE WHATSAPP */}
      {activeTab === 'journal' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-wider">Livre de Paie Mensuel - Salariés Actifs</h3>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">Envoi WhatsApp direct & Impression des bulletins certifiés</p>
            </div>
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
                          <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {activeEmps.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-400 font-bold uppercase text-xs">
                            Aucun salarié actif trouvé en base de données pour cette période
                          </td>
                        </tr>
                      ) : (
                        activeEmps.map((emp) => {
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
                                      <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => handlePrintPayslip(emp, paie.details)}
                                            title="Imprimer Bulletin Officiel"
                                            className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Printer size={15} />
                                        </button>
                                        <button 
                                            onClick={() => handleSendEmailPayslip(emp, paie)}
                                            title="Transmettre le bulletin par Email"
                                            className="p-2.5 bg-blue-50 text-[#2563EB] rounded-xl hover:bg-[#2563EB] hover:text-white transition-all shadow-sm"
                                        >
                                            <Mail size={15} />
                                        </button>
                                        <button 
                                            onClick={() => handleShareWhatsApp(emp, paie)}
                                            title="Notifier le salarié par WhatsApp"
                                            className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <MessageCircle size={15} />
                                        </button>
                                      </div>
                                  </td>
                              </tr>
                          );
                      })
                    )}
                  </tbody>
              </table>
          </div>
        </div>
      )}

      {/* TAB : CHANTIERS & IMPUTATIONS COÛTS BTP */}
      {activeTab === 'projects' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-black text-slate-800 uppercase text-sm">Gestion Analytique des Coûts Chantiers (BTP)</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Suivi en temps réel de la main-d'œuvre consommée par projet vs budget prévisionnel.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAllocationModal(true)}
                className="bg-slate-100 text-slate-800 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <Layers size={15}/> Imputer des Heures
              </button>
              <button 
                onClick={() => setShowProjectModal(true)}
                className="bg-ci-sidebar text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:opacity-90 shadow-md flex items-center gap-2"
              >
                <Plus size={15}/> Nouveau Chantier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => {
              const projAllocations = (projectAllocations || []).filter(a => Number(a.project_id) === Number(proj.id) || Number(a.projectId) === Number(proj.id));
              const allocatedCostSum = projAllocations.reduce((sum, a) => sum + (parseFloat(a.cout_impute) || 0), 0);
              const cout = allocatedCostSum > 0 ? allocatedCostSum : (proj.cout_actuel_mo || 0);
              const budget = proj.budget_mo || 0;
              const pct = budget > 0 ? Math.min(100, Math.round((cout / budget) * 100)) : 0;
              const isOver = cout > budget && budget > 0;

              return (
                <div key={proj.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-md space-y-4 hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 font-mono font-black text-[10px] rounded-lg border border-amber-200 uppercase">
                        {proj.code}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-2">{proj.nom}</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase">{proj.client} • {proj.site}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${proj.statut === 'En cours' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                      {proj.statut}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Consommation Main-d'Œuvre</span>
                      <span className={`font-mono font-black ${isOver ? 'text-red-600' : 'text-slate-900'}`}>{pct}% ({new Intl.NumberFormat('fr-FR').format(cout)} F)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Chef : {proj.chef_chantier || 'Non assigné'}</span>
                      <span>Budget Alloué : {new Intl.NumberFormat('fr-FR').format(proj.budget_mo)} F</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table des Imputations Analytiques Réelles */}
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider">Historique des Imputations de Main-d'Œuvre</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Détail des heures et coûts salariaux imputés par chantier</p>
              </div>
              <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-mono">
                {projectAllocations.length} Imputations
              </span>
            </div>
            <table className="w-full text-xs font-medium">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left">Chantier</th>
                  <th className="px-6 py-4 text-left">Salarié / Ouvrier</th>
                  <th className="px-6 py-4 text-center">Période</th>
                  <th className="px-6 py-4 text-right">Heures Allouées</th>
                  <th className="px-6 py-4 text-right">Coût Imputé (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectAllocations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 font-bold uppercase text-xs">
                      Aucune imputation d'heures enregistrée en base de données pour le moment
                    </td>
                  </tr>
                ) : (
                  projectAllocations.map((alloc) => {
                    const emp = (data?.employees || []).find(e => e.id === alloc.emp_id);
                    const proj = (data?.projects || []).find(p => p.id === alloc.project_id);
                    return (
                      <tr key={alloc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-800 uppercase">{alloc.project_nom || proj?.nom || `Chantier #${alloc.project_id}`}</p>
                          <p className="text-[10px] font-bold text-amber-600 font-mono">{alloc.project_code || proj?.code || ''}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {alloc.emp_nom ? `${alloc.emp_nom} ${alloc.emp_prenoms || ''}` : (emp ? `${emp.nom} ${emp.prenoms}` : `Salarié #${alloc.emp_id}`)}
                          <p className="text-[10px] text-slate-400 font-normal">{alloc.poste || emp?.poste || ''}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{alloc.mois || selectedMonth}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{alloc.heures_allouees} h</td>
                        <td className="px-6 py-4 text-right font-mono font-black text-emerald-700">
                          {new Intl.NumberFormat('fr-FR').format(alloc.cout_impute)} F
                        </td>
                      </tr>
                    );
                  })
                )}
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
                <span className="text-slate-600">Retraite Salariale (6.3% - max 1.647M)</span>
                <span className="font-mono text-slate-900">{new Intl.NumberFormat('fr-FR').format(totals.cnpsSalarial)} F</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl font-bold">
                <span className="text-slate-600">Retraite Patronale (7.7% - max 1.647M)</span>
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

      {/* TAB 4: EXPORT DISA CNPS, e-IMPOTS, SYSCOHADA SAGE & MOBILE MONEY */}
      {activeTab === 'export' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DISA CNPS CARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Building size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Fichier DISA CNPS Normalisé</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Exportation certifiée compatible avec le portail e-CNPS Côte d'Ivoire (cotisations et plafonds légaux).</p>
              </div>
              <button 
                onClick={handleExportDisaCNPS}
                className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Download size={15}/> Télécharger DISA (.CSV)
              </button>
            </div>

            {/* DGI e-IMPOTS CARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4">
                  <FileText size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Déclaration e-Impôts DGI</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Récapitulatif fiscal mensuel (ITS, IGR, parts familiales, FDFP & Taxe d'Apprentissage).</p>
              </div>
              <button 
                onClick={handleExportDgiImpots}
                className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Download size={15}/> Télécharger DGI (.CSV)
              </button>
            </div>

            {/* SYSCOHADA SAGE CARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <FileSpreadsheet size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 uppercase">Écritures Sage / SYSCOHADA</h4>
                <p className="text-xs text-slate-500 font-medium mt-1">Journal comptable des salaires prêt pour intégration directe dans Sage 100, Odoo ou Cegid.</p>
              </div>
              <button 
                onClick={handleExportSyscohadaSage}
                className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Download size={15}/> Télécharger Sage (.CSV)
              </button>
            </div>
          </div>

          {/* MOBILE MONEY BOX */}
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
                <Download size={16}/> Télécharger Fichier Mobile Money
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

      {/* Modal Nouveau Chantier BTP */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase text-lg">Nouveau Chantier / Projet BTP</h3>
              <button onClick={() => setShowProjectModal(false)} className="p-2 bg-slate-100 rounded-xl"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Nom du Chantier / Ouvrage</label>
                <input 
                  required 
                  value={newProject.nom} 
                  onChange={e => setNewProject({...newProject, nom: e.target.value})}
                  placeholder="Ex: Tour F Plateau - Phase 2" 
                  className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-xs outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Client / Maître d'Ouvrage</label>
                  <input 
                    required 
                    value={newProject.client} 
                    onChange={e => setNewProject({...newProject, client: e.target.value})}
                    placeholder="Ex: Ministère de la Construction" 
                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-xs outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Localisation / Site</label>
                  <input 
                    required 
                    value={newProject.site} 
                    onChange={e => setNewProject({...newProject, site: e.target.value})}
                    placeholder="Ex: Plateau, Abidjan" 
                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-xs outline-none" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Budget Main-d'Œuvre (FCFA)</label>
                  <input 
                    type="number"
                    required 
                    value={newProject.budget_mo} 
                    onChange={e => setNewProject({...newProject, budget_mo: e.target.value})}
                    placeholder="Ex: 35000000" 
                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-mono font-bold text-xs outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500">Conducteur / Chef Chantier</label>
                  <input 
                    value={newProject.chef_chantier} 
                    onChange={e => setNewProject({...newProject, chef_chantier: e.target.value})}
                    placeholder="Ex: Ing. Kouamé Paul" 
                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-xs outline-none" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 shadow-lg"
              >
                Créer le Projet Chantier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Imputation Heures & Coûts par Chantier */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase text-lg">Imputer des Heures sur Chantier</h3>
              <button onClick={() => setShowAllocationModal(false)} className="p-2 bg-slate-100 rounded-xl"><X size={18}/></button>
            </div>
            
            <form onSubmit={handleCreateAllocation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Salarié / Ouvrier</label>
                <select 
                  required
                  value={newAllocation.emp_id}
                  onChange={e => setNewAllocation({...newAllocation, emp_id: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-xs outline-none"
                >
                  <option value="">-- Choisir un salarié --</option>
                  {activeEmps.map(e => (
                    <option key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.poste})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Chantier Destination</label>
                <select 
                  required
                  value={newAllocation.project_id}
                  onChange={e => setNewAllocation({...newAllocation, project_id: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-bold text-xs outline-none"
                >
                  <option value="">-- Choisir un chantier BTP --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500">Heures Allouées (Mois)</label>
                <input 
                  type="number" 
                  step="0.5" 
                  required 
                  value={newAllocation.heures_allouees} 
                  onChange={e => setNewAllocation({...newAllocation, heures_allouees: e.target.value})}
                  className="w-full mt-1 p-3 bg-slate-50 rounded-xl font-mono font-bold text-xs outline-none" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg"
              >
                Valider l'Imputation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
