import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { compressImage } from '../utils/imageCompressor';
import { UserPlus, Search, MoreVertical, MapPin, Download, UserMinus, Trash2, X, Eye, FileText, Shield, CheckCircle, Briefcase, GraduationCap, Calendar, AlertTriangle, Edit, ArrowRight, CreditCard, AlertOctagon, Users, Banknote, HardHat, Camera, UploadCloud, LayoutGrid, List, Filter, Phone, Mail, CheckSquare, Square, ArrowUpDown, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { generateAttestationTravail, generateAttestationStage, generateAttestationSalaire } from '../utils/documentGenerator';
import { calculateDetailedPaie } from '../utils/payrollCalc';
import { useNavigate } from 'react-router-dom';

const Employees = () => {
  const { data, loading, refreshData } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [selectedDept, setSelectedDept] = useState('Tous');
  const [selectedContract, setSelectedContract] = useState('Tous');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('nom');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [newEmp, setNewEmp] = useState({
      matricule: '', nom: '', prenoms: '', poste: '', departement: '', site: '', type: 'CDI', dateEmbauche: '', salaireBase: '', sexe: 'M', telephone: '', email: '', cnps: '', nbEnfants: 0, situationMatrimoniale: 'Célibataire', rib: '', photo: '', username: '', password: '', nationalite: 'Ivoirienne', modePaiement: 'Virement Bancaire', numeroMobileMoney: '', responsable: ''
  });
  const [editEmp, setEditEmp] = useState({
      matricule: '', nom: '', prenoms: '', poste: '', departement: '', site: '', type: 'CDI', dateEmbauche: '', salaireBase: '', sexe: 'M', telephone: '', email: '', cnps: '', nbEnfants: 0, situationMatrimoniale: 'Célibataire', rib: '', photo: '', username: '', password: '', nationalite: 'Ivoirienne', modePaiement: 'Virement Bancaire', numeroMobileMoney: '', responsable: ''
  });
  const [certificatePermissions, setCertificatePermissions] = useState({
      attestationTravail: 0,
      attestationStage: 0,
      attestationSalaire: 0
  });

  const handleGeneratePDF = (emp) => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Veuillez autoriser les pop-ups.'); return; }
    
    const formatDate = (d) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatMontant = (m) => new Intl.NumberFormat('fr-CI').format(m) + ' F CFA';

    const primaryColor = company.primaryColor || '#009E49';
    const secondaryColor = company.secondaryColor || '#F77F00';
    const logoUrl = company.logo || '/gebat_logo.png';

    // Responsable Hiérarchique
    const managerObj = emp.responsable ? (data?.employees || []).find(e => e.id.toString() === emp.responsable.toString()) : null;
    const managerName = managerObj ? `${managerObj.nom} ${managerObj.prenoms}` : 'Direction Général';

    // Ancienneté
    const embDate = emp.dateEmbauche ? new Date(emp.dateEmbauche) : new Date();
    const diffMonths = Math.max(0, Math.floor((new Date() - embDate) / (1000 * 60 * 60 * 24 * 30.44)));
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    const ancienneteeStr = years > 0 ? `${years} an(s) et ${months} mois` : `${months} mois`;

    // QR Verification
    const qrData = `DOSSIER RH | Emp: ${emp.nom} ${emp.prenoms} | Mat: ${emp.matricule} | Ste: ${company.companyName || 'SIRH'}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Fiche Individuelle - ${emp.nom} ${emp.prenoms}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    
    @page {
      size: A4;
      margin: 10mm 15mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 30px;
      background: #ffffff;
      line-height: 1.5;
    }

    .doc-wrapper {
      max-width: 820px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      padding: 40px;
      position: relative;
      background: #ffffff;
    }

    .brand-accent {
      height: 5px;
      width: 100%;
      background: linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      position: absolute;
      top: 0;
      left: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logo-img {
      max-width: 100px;
      max-height: 70px;
      object-fit: contain;
    }

    .company-info h1 {
      font-size: 17px;
      font-weight: 900;
      color: ${primaryColor};
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }

    .company-info p {
      font-size: 9.5px;
      color: #64748b;
      margin: 1px 0;
      font-weight: 600;
    }

    .header-right {
      text-align: right;
    }

    .ref-badge {
      font-size: 9px;
      font-weight: 800;
      color: #0f172a;
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .qr-img {
      width: 65px;
      height: 65px;
      border: 1px solid #e2e8f0;
      padding: 2px;
      border-radius: 6px;
    }

    .doc-title-container {
      text-align: center;
      margin-bottom: 25px;
    }

    .doc-title {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #0f172a;
      background: #f8fafc;
      border-bottom: 3px solid ${primaryColor};
      padding: 8px 24px;
      display: inline-block;
      border-radius: 6px;
    }

    .profile-hero {
      display: flex;
      gap: 25px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 25px;
      align-items: center;
    }

    .employee-photo {
      width: 100px;
      height: 110px;
      object-fit: cover;
      border-radius: 12px;
      border: 2px solid ${primaryColor};
    }

    .avatar-placeholder {
      width: 100px;
      height: 110px;
      background: linear-gradient(135deg, ${primaryColor} 0%, #065f46 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 900;
      color: #ffffff;
    }

    .hero-details {
      flex: 1;
    }

    .hero-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 6px 0;
    }

    .hero-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 6px;
    }

    .tag-badge {
      font-size: 9.5px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .tag-green { background: #dcfce7; color: #15803d; }
    .tag-amber { background: #fef3c7; color: #b45309; }
    .tag-blue { background: #e0f2fe; color: #0369a1; }

    .section-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-left: 4px solid ${primaryColor};
      padding-left: 10px;
      margin-top: 20px;
      margin-bottom: 12px;
      color: #0f172a;
      background: #f8fafc;
      padding-top: 5px;
      padding-bottom: 5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 25px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .info-label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }

    .signatures {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .signature-box {
      border: 1px dashed #cbd5e1;
      padding: 15px;
      text-align: center;
      height: 95px;
      font-size: 9.5px;
      color: #94a3b8;
      border-radius: 10px;
      background: #fafafa;
    }

    .footer {
      margin-top: 35px;
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      text-transform: uppercase;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    <div class="brand-accent"></div>
    
    <div class="header">
      <div class="logo-container">
        <img src="${logoUrl}" class="logo-img" alt="Logo GEBAT" />
        <div class="company-info">
          <h1>${company.companyName || 'GEBAT SA'}</h1>
          <p>Adresse : ${company.address || 'Abidjan, Plateau, Côte d\'Ivoire'}</p>
          <p>Tél : ${company.phone || '+225 27 20 00 00 00'} | E-mail : ${company.email || 'rh@entreprise.ci'}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="ref-badge">DOSSIER REF: ${emp.matricule}</div>
        <br/>
        <img src="${qrUrl}" class="qr-img" alt="Vérification QR" />
      </div>
    </div>

    <div class="doc-title-container">
      <div class="doc-title">Fiche Individuelle de Collaborateur</div>
    </div>

    <div class="profile-hero">
      ${emp.photo 
        ? `<img src="${emp.photo}" class="employee-photo" alt="${emp.nom}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="avatar-placeholder" style="display:none;">${emp.nom ? emp.nom[0] : ''}${emp.prenoms ? emp.prenoms[0] : ''}</div>` 
        : `<div class="avatar-placeholder">${emp.nom ? emp.nom[0] : ''}${emp.prenoms ? emp.prenoms[0] : ''}</div>`
      }
      <div class="hero-details">
        <h2 class="hero-name">${emp.nom} ${emp.prenoms}</h2>
        <p style="font-size: 12px; font-weight: 800; color: ${primaryColor}; text-transform: uppercase; margin: 0 0 8px 0;">${emp.poste}</p>
        <div class="hero-tags">
          <span class="tag-badge tag-green">MATRICULE : ${emp.matricule}</span>
          <span class="tag-badge tag-amber">CONTRAT : ${emp.type}</span>
          <span class="tag-badge tag-blue">STATUT : ${emp.statut}</span>
        </div>
      </div>
    </div>

    <div class="section-title">1. Affectation Stratégique & Organigramme</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Intitulé du Poste</div>
        <div class="info-value">${emp.poste}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Département</div>
        <div class="info-value">${emp.departement}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Site d'affectation</div>
        <div class="info-value" style="text-transform: uppercase;">${emp.site}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Responsable Hiérarchique</div>
        <div class="info-value">${managerName}</div>
      </div>
    </div>

    <div class="section-title">2. Modalités Contractuelles & Rémunération</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nature du Contrat</div>
        <div class="info-value">${emp.type}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Date d'embauche</div>
        <div class="info-value">${formatDate(emp.dateEmbauche)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Ancienneté Effective</div>
        <div class="info-value" style="color: ${primaryColor}; font-weight: 900;">${ancienneteeStr}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Salaire Mensuel de Base</div>
        <div class="info-value" style="font-size: 12px; font-weight: 900;">${formatMontant(emp.salaireBase)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Mode de Règlement</div>
        <div class="info-value">${emp.modePaiement || 'Virement Bancaire'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">RIB / Mobile Money</div>
        <div class="info-value">${emp.rib || emp.numeroMobileMoney || '—'}</div>
      </div>
    </div>

    <div class="section-title">3. État Civil & Sécurité Sociale</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Genre</div>
        <div class="info-value">${emp.sexe === 'M' ? 'Masculin (Homme)' : 'Féminin (Femme)'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Nationalité</div>
        <div class="info-value">${emp.nationalite || 'Ivoirienne'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Situation Matrimoniale</div>
        <div class="info-value">${emp.situationMatrimoniale || 'Célibataire'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Enfants à charge</div>
        <div class="info-value">${emp.nbEnfants || 0} enfant(s)</div>
      </div>
      <div class="info-item">
        <div class="info-label">N° Immatriculation CNPS</div>
        <div class="info-value" style="font-weight: 800; color: #0369a1;">${emp.cnps || 'Non affilié'}</div>
      </div>
    </div>

    <div class="section-title">4. Coordonnées Officieuses & Contact</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Numéro Téléphone Direct</div>
        <div class="info-value">${emp.telephone || '—'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Adresse E-mail Professionnelle</div>
        <div class="info-value">${emp.email || '—'}</div>
      </div>
    </div>

    <div class="signatures">
      <div>
        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; color: #0f172a;">Le Département des Ressources Humaines</div>
        <div class="signature-box">Signature & Cachet Officiel de l'Employeur</div>
      </div>
      <div>
        <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; color: #0f172a;">Le Collaborateur</div>
        <div class="signature-box">Signature précédée de la mention "Lu et certifié conforme"</div>
      </div>
    </div>

    <div class="footer">
      Document administratif confidentiel RH • Généré par le SIRH le ${formatDate(new Date())} • Conforme au Code du Travail CI
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 700);
  };

  if (loading) return <div className="p-10 text-center uppercase font-black tracking-widest text-ci-muted animate-pulse">Initialisation de la base employés...</div>;

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer définitivement ce collaborateur ?')) {
        try {
            await axios.delete(`/api/employees/${id}`);
            refreshData();
        } catch (err) {
            alert('Erreur lors de la suppression');
        }
    }
  };

  // Helper d'Éligibilité des Attestations en temps réel
  const getCertificateEligibility = (emp) => {
    if (!emp) return { trabajo: { eligible: false }, stage: { eligible: false }, salaire: { eligible: false } };
    const isStage = (emp.type || '').toLowerCase().includes('stage');
    const isActif = emp.statut === 'Actif';
    const hasSalary = Number(emp.salaireBase) >= 75000;

    return {
      trabajo: {
        eligible: !isStage,
        title: emp.statut === 'Inactif' ? 'Certificat de Travail (Fin de contrat)' : 'Attestation de Travail (En poste)',
        reason: isStage 
          ? 'Non applicable pour un contrat de stage. Utilisez l\'Attestation de Stage.' 
          : 'Éligible pour contrat ' + (emp.type || 'CDI/CDD')
      },
      stage: {
        eligible: isStage,
        title: 'Attestation de Fin de Stage',
        reason: isStage 
          ? 'Éligible (Stagiaire enregistre)' 
          : 'Réservé exclusivement aux stagiaires (Contrat de type Stage)'
      },
      salaire: {
        eligible: hasSalary,
        title: 'Attestation de Salaire Officielle',
        reason: hasSalary 
          ? 'Éligible (Salaire de base > 75 000 FCFA)' 
          : 'Salaire de base non configuré ou inférieur au SMIC'
      }
    };
  };

  const handleCertificatePermissions = async (emp) => {
    setSelectedEmp(emp);
    setCertificatePermissions({
        attestationTravail: emp.attestationTravail || 0,
        attestationStage: emp.attestationStage || 0,
        attestationSalaire: emp.attestationSalaire || 0
    });
    setShowCertificateModal(true);
    setActiveMenuId(null);
  };

  const handleUpdateCertificatePermissions = async () => {
    try {
        await axios.patch(`/api/employees/${selectedEmp.id}/certificates`, certificatePermissions);
        refreshData();
        setShowCertificateModal(false);
        alert('Permissions d\'attestation mises à jour avec succès');
    } catch (err) {
        alert('Erreur lors de la mise à jour des permissions');
    }
  };

  const handleTerminateContract = async () => {
    if (!selectedEmp) return;
    if (window.confirm(`Êtes-vous sûr de vouloir résilier le contrat de ${selectedEmp.nom} ${selectedEmp.prenoms} ?`)) {
        try {
            await axios.patch(`/api/employees/${selectedEmp.id}`, { statut: 'Inactif', compteActif: 0 });
            refreshData();
            const updated = { ...selectedEmp, statut: 'Inactif' };
            setSelectedEmp(updated);
            
            // Déclenchement automatique de l'attestation légale de fin de contrat "au bon moment"
            if (window.confirm(`Le contrat de ${updated.nom} ${updated.prenoms} est désormais résilié.\n\nSouhaitez-vous générer immédiatement l'Attestation / Certificat de Travail officiel de fin de contrat ?`)) {
                handleDownloadWorkCertificate(updated);
            }
        } catch (err) {
            alert('Erreur lors de la résiliation du contrat');
        }
    }
  };

  const handleTerminateContractById = async (id, emp) => {
    try {
        await axios.patch(`/api/employees/${id}`, { statut: 'Inactif', compteActif: 0 });
        refreshData();
        
        // Déclenchement automatique de l'attestation "au bon moment"
        if (emp && window.confirm(`Le contrat de ${emp.nom} ${emp.prenoms} est désormais résilié.\n\nSouhaitez-vous générer immédiatement le Certificat de Travail de fin de contrat ?`)) {
            handleDownloadWorkCertificate(emp);
        } else {
            alert('Contrat résilié avec succès et compte désactivé.');
        }
    } catch (err) {
        alert('Erreur lors de la résiliation du contrat');
    }
  };

  const handleDownloadWorkCertificate = (emp) => {
    const company = data?.settings || {};
    generateAttestationTravail(emp, company);
  };

  const handleDownloadInternshipCertificate = (emp) => {
    const company = data?.settings || {};
    generateAttestationStage(emp, company);
  };

  const handleDownloadSalaryCertificate = (emp) => {
    const company = data?.settings || {};
    const payslipDetails = calculateDetailedPaie(emp, 0);
    generateAttestationSalaire(emp, company, payslipDetails);
  };
  const handleAdd = async (e) => {
    e.preventDefault();
    
    // Validation du salaire minimum (SMIC Côte d'Ivoire: 75 000 FCFA, sauf pour les stagiaires)
    const isStageNew = (newEmp.type || '').toLowerCase().includes('stage');
    if (!isStageNew && newEmp.salaireBase && parseFloat(newEmp.salaireBase) < 75000) {
        alert('Le salaire de base ne peut pas être inférieur au SMIC (75 000 FCFA), sauf pour les contrats de type Stage.');
        return;
    }
    
    try {
        await axios.post('/api/employees', newEmp);
        setShowModal(false);
        refreshData();
        setNewEmp({ matricule: '', nom: '', prenoms: '', poste: '', departement: '', site: '', type: 'CDI', dateEmbauche: '', salaireBase: '', sexe: 'M', telephone: '', email: '', cnps: '', nbEnfants: 0, situationMatrimoniale: 'Célibataire', rib: '', photo: '', username: '', password: '', nationalite: 'Ivoirienne', modePaiement: 'Virement Bancaire', numeroMobileMoney: '', responsable: '' });
    } catch (err) {
        alert('Erreur lors de l\'ajout: ' + (err.response?.data?.error || err.message));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
        setNewEmp(prev => ({ ...prev, photo: compressed }));
      } catch (err) {
        console.error('Erreur compression photo:', err);
        const reader = new FileReader();
        reader.onloadend = () => setNewEmp(prev => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(file);
      }
    }
  };

  const handleEditPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
        setEditEmp(prev => ({ ...prev, photo: compressed }));
      } catch (err) {
        console.error('Erreur compression photo:', err);
        const reader = new FileReader();
        reader.onloadend = () => setEditEmp(prev => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(file);
      }
    }
  };

  const handleEdit = (emp) => {
    console.log('handleEdit called with emp:', emp);
    const updatedEmp = {
        matricule: emp.matricule || '',
        nom: emp.nom || '',
        prenoms: emp.prenoms || '',
        poste: emp.poste || '',
        departement: emp.departement || '',
        site: emp.site || '',
        type: emp.type || 'CDI',
        dateEmbauche: emp.dateEmbauche || '',
        salaireBase: emp.salaireBase || '',
        sexe: emp.sexe || 'M',
        telephone: emp.telephone || '',
        email: emp.email || '',
        cnps: emp.cnps || '',
        nbEnfants: emp.nbEnfants || 0,
        situationMatrimoniale: emp.situationMatrimoniale || 'Célibataire',
        rib: emp.rib || '',
        photo: emp.photo || '',
        username: emp.username || '',
        password: emp.password || '',
        nationalite: emp.nationalite || 'Ivoirienne',
        modePaiement: emp.modePaiement || 'Virement Bancaire',
        numeroMobileMoney: emp.numeroMobileMoney || '',
        responsable: emp.responsable || '',
        compteActif: emp.compteActif !== undefined ? emp.compteActif : 1
    };
    console.log('Setting editEmp to:', updatedEmp);
    setEditEmp(updatedEmp);
    setSelectedEmp(emp);
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    // Validation du salaire minimum (SMIC Côte d'Ivoire: 75 000 FCFA, sauf pour les stagiaires)
    const isStageEdit = (editEmp.type || '').toLowerCase().includes('stage');
    if (!isStageEdit && editEmp.salaireBase && parseFloat(editEmp.salaireBase) < 75000) {
        alert('Le salaire de base ne peut pas être inférieur au SMIC (75 000 FCFA), sauf pour les contrats de type Stage.');
        return;
    }
    
    try {
        const response = await axios.put(`/api/employees/${selectedEmp.id}`, editEmp);
        setShowEditModal(false);
        setSelectedEmp(null);
        refreshData();
        alert('Profil de l\'employé mis à jour avec succès');
    } catch (err) {
        console.error('Update error:', err);
        alert('Erreur lors de la mise à jour: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleGenerateBadge = (emp) => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Veuillez autoriser les pop-ups.'); return; }
    
    const formatDate = (d) => {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify({id: emp.id, matricule: emp.matricule, nom: emp.nom, prenoms: emp.prenoms}))}`;

    const managerName = emp.responsable ? (() => {
        const resp = (data?.employees || []).find(e => e.id.toString() === emp.responsable.toString());
        return resp ? `${resp.nom} ${resp.prenoms}` : '';
    })() : '';

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Badge Professionnel (Recto/Verso) - ${emp.nom} ${emp.prenoms}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
    @page {
      size: 53.98mm 85.6mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      padding: 10px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      background: #e2e8f0;
    }
    .card-page {
      page-break-after: always;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .badge-card {
      width: 53.98mm;
      height: 85.6mm;
      background: #ffffff;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
      border: 1px solid #cbd5e1;
      padding: 0 0 3mm 0;
      text-align: center;
    }
    
    /* Top Accent Banner */
    .ci-banner {
      height: 4mm;
      width: 100%;
      background: #009E49;
      position: relative;
      z-index: 10;
    }

    /* Subtle Light Grid Texture */
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#cbd5e1 0.8px, transparent 0.8px);
      background-size: 3.5mm 3.5mm;
      pointer-events: none;
      opacity: 0.35;
      z-index: 1;
    }

    /* Light Geometric Graphic Shapes */
    .geo-shape-top {
      position: absolute;
      top: -12mm;
      right: -15mm;
      width: 45mm;
      height: 45mm;
      background: linear-gradient(135deg, rgba(247, 127, 0, 0.12) 0%, rgba(247, 127, 0, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
    }

    .geo-shape-bottom {
      position: absolute;
      bottom: -15mm;
      left: -15mm;
      width: 50mm;
      height: 50mm;
      background: linear-gradient(135deg, rgba(0, 158, 73, 0.12) 0%, rgba(0, 158, 73, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
    }

    .diagonal-line {
      position: absolute;
      top: 16mm;
      left: -5mm;
      width: 65mm;
      height: 20mm;
      background: linear-gradient(90deg, rgba(0, 158, 73, 0.05) 0%, rgba(247, 127, 0, 0.05) 100%);
      transform: rotate(-12deg);
      pointer-events: none;
      z-index: 1;
    }

    /* Header Branding */
    .card-header {
      padding: 3mm 3mm 1mm 3mm;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 4;
    }

    .brand-box {
      display: flex;
      align-items: center;
      gap: 2mm;
      margin-bottom: 0.5mm;
    }

    .logo-container-badge {
      background: #ffffff;
      padding: 0.8mm 1.5mm;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      height: 8mm;
    }

    .logo-badge-img {
      max-height: 6.5mm;
      max-width: 16mm;
      object-fit: contain;
      display: block;
    }

    .company-title {
      font-size: 7.2pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 0;
      line-height: 1.1;
      text-align: left;
    }

    .badge-sub {
      font-size: 4.8pt;
      font-weight: 800;
      color: #009E49;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: rgba(0, 158, 73, 0.08);
      border: 1px solid rgba(0, 158, 73, 0.2);
      padding: 0.5mm 2mm;
      border-radius: 3px;
      margin-top: 1mm;
    }

    /* Photo Frame Styling */
    .photo-section {
      position: relative;
      margin: 1.5mm 0;
      z-index: 4;
    }

    .photo-frame {
      width: 25mm;
      height: 30mm;
      border-radius: 10px;
      padding: 1.5px;
      background: linear-gradient(135deg, #F77F00 0%, #009E49 100%);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .employee-photo {
      width: 100%;
      height: 100%;
      border-radius: 9px;
      object-fit: cover;
      display: block;
    }

    .employee-avatar {
      width: 100%;
      height: 100%;
      border-radius: 9px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #009E49;
      font-size: 22pt;
      font-weight: 900;
    }

    .status-dot {
      position: absolute;
      bottom: -1mm;
      right: -1mm;
      width: 4mm;
      height: 4mm;
      border-radius: 50%;
      border: 2px solid #ffffff;
      ${emp.statut === 'Actif' ? 'background: #10b981; box-shadow: 0 0 6px #10b981;' : 'background: #ef4444; box-shadow: 0 0 6px #ef4444;'}
    }

    /* Employee Details */
    .info-container {
      width: 100%;
      padding: 0 2.5mm;
      z-index: 4;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .employee-fullname {
      font-size: 9.5pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      margin: 0 0 0.5mm 0;
      line-height: 1.15;
    }

    .employee-role {
      font-size: 6.5pt;
      font-weight: 800;
      color: #F77F00;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 0 0 1.5mm 0;
    }

    .tag-group {
      display: flex;
      gap: 1mm;
      justify-content: center;
      margin-bottom: 2mm;
    }

    .matricule-pill {
      font-size: 5.5pt;
      font-weight: 900;
      font-family: monospace;
      color: #009E49;
      background: rgba(0, 158, 73, 0.1);
      border: 1px solid rgba(0, 158, 73, 0.3);
      padding: 0.6mm 2.5mm;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .dept-pill {
      font-size: 5.5pt;
      font-weight: 800;
      color: #0284c7;
      background: rgba(2, 132, 199, 0.08);
      border: 1px solid rgba(2, 132, 199, 0.25);
      padding: 0.6mm 2mm;
      border-radius: 4px;
      text-transform: uppercase;
    }

    /* QR Code Section */
    .qr-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 4;
      position: relative;
    }

    .qr-box {
      background: #ffffff;
      padding: 1.2mm;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
    }

    .qr-img {
      width: 13mm;
      height: 13mm;
    }

    .card-side-label {
      font-size: 3.8pt;
      font-weight: 900;
      color: #94a3b8;
      letter-spacing: 1px;
      margin-top: 1mm;
    }

    /* ==================== VERSO STYLES ==================== */
    .verso-card {
      padding: 0 4mm 4mm 4mm;
      justify-content: space-between;
      align-items: center;
    }

    .verso-notice-container {
      z-index: 4;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 2mm;
      margin: 1.5mm 0;
      text-align: center;
    }

    .verso-notice-title {
      font-size: 4.2pt;
      font-weight: 900;
      color: #009E49;
      letter-spacing: 0.6px;
      margin-bottom: 0.8mm;
      text-transform: uppercase;
    }

    .verso-notice-text {
      font-size: 3.8pt;
      font-weight: 600;
      color: #334155;
      line-height: 1.25;
      margin: 0 0 1mm 0;
    }

    .verso-notice-lost {
      font-size: 3.6pt;
      font-weight: 700;
      color: #F77F00;
      margin: 0;
      font-style: italic;
    }

    .company-contact-box {
      z-index: 4;
      text-align: center;
      margin: 0.8mm 0;
    }

    .company-contact-name {
      font-size: 4.8pt;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 0.3mm 0;
    }

    .company-contact-info {
      font-size: 3.8pt;
      font-weight: 600;
      color: #64748b;
      margin: 0.2mm 0;
    }

    .verso-footer-bar {
      width: 100%;
      z-index: 4;
    }

    .signature-box {
      width: 100%;
      border-top: 1px dashed #cbd5e1;
      padding-top: 1mm;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .signature-box span {
      font-size: 3.8pt;
      font-weight: 800;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sig-area {
      height: 7mm;
      width: 100%;
    }

    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
        gap: 0 !important;
      }
      .card-page {
        margin-bottom: 0 !important;
        page-break-after: always !important;
      }
      .badge-card {
        box-shadow: none !important;
        border: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- ==================== RECTO (FRONT) ==================== -->
  <div class="card-page">
    <div class="badge-card">
      <div class="ci-banner"></div>
      <div class="bg-grid"></div>
      <div class="geo-shape-top"></div>
      <div class="geo-shape-bottom"></div>
      <div class="diagonal-line"></div>

      <!-- 1. Header & Logo Officiel GEBAT -->
      <div class="card-header">
        <div class="brand-box">
          <div class="logo-container-badge">
            <img src="${company.logo || '/gebat_logo.png'}" class="logo-badge-img" alt="Logo GEBAT" />
          </div>
          <div>
            <h1 class="company-title">${company.companyName || 'GEBAT SA'}</h1>
            <div class="badge-sub">CARTE D'IDENTITÉ PROFESSIONNELLE</div>
          </div>
        </div>
      </div>

      <!-- 2. Photo Portrait avec cadre dégradé -->
      <div class="photo-section">
        <div class="photo-frame">
          ${emp.photo 
            ? `<img src="${emp.photo}" class="employee-photo" alt="${emp.nom}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="employee-avatar" style="display:none;">${emp.nom ? emp.nom[0] : ''}${emp.prenoms ? emp.prenoms[0] : ''}</div>`
            : `<div class="employee-avatar">${emp.nom ? emp.nom[0] : ''}${emp.prenoms ? emp.prenoms[0] : ''}</div>`
          }
        </div>
        <div class="status-dot"></div>
      </div>

      <!-- 3. Nom, Poste, Matricule & Département -->
      <div class="info-container">
        <h2 class="employee-fullname">${emp.nom} ${emp.prenoms}</h2>
        <p class="employee-role">${emp.poste}</p>
        
        <div class="tag-group">
          <span class="matricule-pill">MAT: ${emp.matricule}</span>
          ${emp.departement ? `<span class="dept-pill">${emp.departement}</span>` : ''}
        </div>
      </div>

      <!-- 4. QR Code Uniquement -->
      <div class="qr-section">
        <div class="qr-box">
          <img src="${qrCodeUrl}" class="qr-img" alt="Code QR Verification" />
        </div>
        <div class="card-side-label">RECTO • VÉRIFICATION OFFICIELLE</div>
      </div>
    </div>
  </div>

  <!-- ==================== VERSO (BACK) ==================== -->
  <div class="card-page">
    <div class="badge-card verso-card">
      <div class="ci-banner"></div>
      <div class="bg-grid"></div>
      <div class="geo-shape-top"></div>
      <div class="geo-shape-bottom"></div>

      <!-- 1. Header & Branding Verso -->
      <div class="card-header" style="padding-top: 3.5mm;">
        <div class="brand-box">
          <div class="logo-container-badge">
            <img src="${company.logo || '/gebat_logo.png'}" class="logo-badge-img" alt="Logo GEBAT" />
          </div>
          <div>
            <h1 class="company-title">${company.companyName || 'GEBAT SA'}</h1>
          </div>
        </div>
      </div>

      <!-- 2. Notice Légale d'Utilisation -->
      <div class="verso-notice-container">
        <div class="verso-notice-title">CLAUSE D'UTILISATION</div>
        <p class="verso-notice-text">
          La présente carte est la propriété exclusive de <strong>${company.companyName || 'GEBAT SA'}</strong>. Elle est strictement personnelle et incessible. Le titulaire est tenu de la présenter à toute réquisition et de la restituer en cas de cessation de fonction.
        </p>
        <p class="verso-notice-lost">
          En cas de perte, prière de contacter la Direction des Ressources Humaines.
        </p>
      </div>

      <!-- 3. Coordonnées de l'Entreprise -->
      <div class="company-contact-box">
        <p class="company-contact-name">${company.companyName || 'GEBAT SA'}</p>
        <p class="company-contact-info">${company.address || 'Abidjan, Côte d\'Ivoire'}</p>
        <p class="company-contact-info">Tél: ${company.phone || '+225 27 22 52 34 23'} • Email: ${company.email || 'gebat@gebat-sa.com'}</p>
      </div>

      <!-- 4. Bloc Signature & Cachet DRH -->
      <div class="verso-footer-bar">
        <div class="signature-box">
          <span>Cachet & Signature de la Direction</span>
          <div class="sig-area"></div>
        </div>
        <div class="card-side-label" style="margin-top: 1mm;">VERSO • RH & ADMINISTRATION</div>
      </div>
    </div>
  </div>

</body>
</html>`;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    if (!data?.employees?.length) return;
    const headers = ['Matricule', 'Nom', 'Prenoms', 'Poste', 'Departement', 'Site', 'Type', 'Statut', 'Date Embauche', 'Salaire Base', 'Sexe', 'Telephone', 'Email', 'CNPS', 'Situation Matrimoniale', 'Enfants'];
    const rows = data.employees.map(emp => [
      emp.matricule,
      emp.nom,
      emp.prenoms,
      emp.poste,
      emp.departement,
      emp.site,
      emp.type,
      emp.statut,
      emp.dateEmbauche,
      emp.salaireBase,
      emp.sexe,
      emp.telephone,
      emp.email,
      emp.cnps,
      emp.situationMatrimoniale,
      emp.nbEnfants
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `collaborateurs_sirh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departmentsList = ['Tous', ...Array.from(new Set((data?.employees || []).map(e => e.departement).filter(Boolean)))];
  const contractTypesList = ['Tous', 'CDI', 'CDD', 'Stage', 'Consultant'];

  const filteredEmployees = (data?.employees || []).filter(emp => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !s || 
      emp.nom.toLowerCase().includes(s) || 
      emp.prenoms.toLowerCase().includes(s) || 
      emp.matricule.toLowerCase().includes(s) ||
      (emp.poste && emp.poste.toLowerCase().includes(s)) ||
      (emp.departement && emp.departement.toLowerCase().includes(s)) ||
      (emp.site && emp.site.toLowerCase().includes(s));
    
    const matchesStatus = filterStatus === 'Tous' || emp.statut === filterStatus;
    const matchesDept = selectedDept === 'Tous' || emp.departement === selectedDept;
    const matchesContract = selectedContract === 'Tous' || emp.type === selectedContract;

    return matchesSearch && matchesStatus && matchesDept && matchesContract;
  }).sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(e => e.id));
    }
  };

  const toggleSelectOne = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkExportCSV = () => {
    const targets = selectedIds.length > 0 
      ? (data?.employees || []).filter(e => selectedIds.includes(e.id))
      : filteredEmployees;
    if (!targets.length) return;
    
    const headers = ['Matricule', 'Nom', 'Prenoms', 'Poste', 'Departement', 'Site', 'Type', 'Statut', 'Date Embauche', 'Salaire Base', 'Sexe', 'Telephone', 'Email', 'CNPS', 'Situation Matrimoniale', 'Enfants'];
    const rows = targets.map(emp => [
      emp.matricule, emp.nom, emp.prenoms, emp.poste, emp.departement, emp.site, emp.type, emp.statut, emp.dateEmbauche, emp.salaireBase, emp.sexe, emp.telephone, emp.email, emp.cnps, emp.situationMatrimoniale, emp.nbEnfants
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `collaborateurs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allEmps = data?.employees || [];
  const activeEmps = allEmps.filter(e => e.statut === 'Actif');
  const femaleEmps = allEmps.filter(e => {
    const s = (e.sexe || '').trim().toUpperCase();
    return s === 'F' || s.startsWith('FEM') || s === 'WOMAN';
  });
  const maleEmps = allEmps.filter(e => {
    const s = (e.sexe || '').trim().toUpperCase();
    return s === 'M' || s === 'H' || s.startsWith('MAS') || s.startsWith('HOM');
  });
  const cdiEmps = allEmps.filter(e => (e.type || '').toUpperCase() === 'CDI');
  const cddEmps = allEmps.filter(e => (e.type || '').toUpperCase() === 'CDD');
  const stageEmps = allEmps.filter(e => (e.type || '').toLowerCase().includes('stage'));
  const onSiteEmps = allEmps.filter(e => e.site && e.site.toLowerCase() !== 'siège' && e.site.toLowerCase() !== 'siege');
  const siteRate = allEmps.length > 0 ? Math.round((onSiteEmps.length / allEmps.length) * 100) : 0;
  const completeDossiers = allEmps.filter(e => e.cnps && e.telephone);
  const complianceRate = allEmps.length > 0 ? Math.round((completeDossiers.length / allEmps.length) * 100) : 0;
  const avgSalary = activeEmps.length > 0 ? Math.round(activeEmps.reduce((sum, e) => sum + (e.salaireBase || 0), 0) / activeEmps.length) : 0;

  return (
    <div className="animate-fadeIn space-y-8">
      <PageHeader 
        title="Base Collaborateurs & Capital Humain" 
        subtitle={`${filteredEmployees.length} employés affichés (${activeEmps.length} actifs)`}
        actions={
            <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white text-[#2563EB] shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-900'}`}
                        title="Vue Tableau Détaillé"
                    >
                        <List size={15} /> Tableau
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white text-[#2563EB] shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-900'}`}
                        title="Vue Grille / Cartes"
                    >
                        <LayoutGrid size={15} /> Grille
                    </button>
                </div>

                <button
                    onClick={handleBulkExportCSV}
                    className="px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-xs font-black flex items-center gap-2 shadow-sm"
                >
                    <Download size={16} className="text-emerald-600" /> Export CSV {selectedIds.length > 0 && `(${selectedIds.length})`}
                </button>

                <button 
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-[#2563EB] text-white rounded-2xl hover:bg-blue-700 transition-all text-xs font-black shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                    <UserPlus size={16} /> Nouveau Collaborateur
                </button>
            </div>
        }
      />


      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-wider">Effectif Actif</p>
            <h3 className="text-lg font-black text-ci-text leading-tight mt-0.5">{activeEmps.length} / {allEmps.length}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-0.5">En poste</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Briefcase size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-wider">Contrats CDI</p>
            <h3 className="text-lg font-black text-ci-text leading-tight mt-0.5">{cdiEmps.length} CDI</h3>
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">{allEmps.length > 0 ? Math.round((cdiEmps.length / allEmps.length) * 100) : 0}% de l'effectif</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <UserPlus size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-wider">Parité Féminine</p>
            <h3 className="text-lg font-black text-ci-text leading-tight mt-0.5">{allEmps.length > 0 ? ((femaleEmps.length / allEmps.length) * 100).toFixed(1) : '0.0'}%</h3>
            <p className="text-[10px] font-bold text-purple-600 mt-0.5 whitespace-nowrap">{femaleEmps.length} Femmes • {maleEmps.length} Hommes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-ci-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Banknote size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-ci-muted uppercase tracking-wider">Salaire Moyen</p>
            <h3 className="text-lg font-black text-ci-text leading-tight mt-0.5">{new Intl.NumberFormat('fr-CI').format(avgSalary)} F</h3>
            <p className="text-[10px] font-bold text-blue-600 mt-0.5">FCFA / mois</p>
          </div>
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-20 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn border border-slate-700">
            <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center text-xs font-black">
                    {selectedIds.length}
                </span>
                <span className="text-xs font-bold">Collaborateur(s) sélectionné(s)</span>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={handleBulkExportCSV}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md"
                >
                    <Download size={14} /> Exporter Sélection (CSV)
                </button>
                <button
                    onClick={() => setSelectedIds([])}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                    Désélectionner tout
                </button>
            </div>
        </div>
      )}

      {/* Search & Advanced Filters Bar */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-ci-border p-4 md:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-ci-muted" size={18} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher par nom, matricule, poste, département..." 
                    className="w-full pl-12 pr-10 py-3.5 bg-ci-bg border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-ci-green/10 outline-none transition-all" 
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Department Filter */}
                <div className="flex items-center gap-2 bg-ci-bg px-3 py-2 rounded-2xl border border-slate-200">
                    <Filter size={14} className="text-[#2563EB]" />
                    <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="Tous">Tous Départements</option>
                        {departmentsList.filter(d => d !== 'Tous').map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Contract Type Filter */}
                <div className="flex items-center gap-2 bg-ci-bg px-3 py-2 rounded-2xl border border-slate-200">
                    <Briefcase size={14} className="text-amber-600" />
                    <select
                        value={selectedContract}
                        onChange={(e) => setSelectedContract(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="Tous">Tous Contrats</option>
                        {contractTypesList.filter(c => c !== 'Tous').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2 bg-ci-bg px-3 py-2 rounded-2xl border border-slate-200">
                    <ArrowUpDown size={14} className="text-emerald-600" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        <option value="nom">Trier par Nom</option>
                        <option value="dateEmbauche">Trier par Ancienneté</option>
                        <option value="salaireBase">Trier par Salaire</option>
                        <option value="departement">Trier par Département</option>
                    </select>
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="text-xs font-black text-slate-500 hover:text-slate-900 ml-1 px-1.5 py-0.5 rounded bg-white border"
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-hide">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-2">Statut :</span>
            {['Tous', 'Actif', 'En congé', 'Inactif'].map(status => (
                <button 
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        filterStatus === status ? 'bg-ci-sidebar text-white shadow-md' : 'bg-ci-bg text-ci-muted hover:bg-slate-100 border border-transparent'
                    }`}
                >
                    {status}
                </button>
            ))}
            {(selectedDept !== 'Tous' || selectedContract !== 'Tous' || filterStatus !== 'Tous' || searchTerm) && (
                <button
                    onClick={() => {
                        setSelectedDept('Tous');
                        setSelectedContract('Tous');
                        setFilterStatus('Tous');
                        setSearchTerm('');
                    }}
                    className="ml-auto text-[10px] font-bold text-rose-500 hover:underline"
                >
                    Réinitialiser les filtres
                </button>
            )}
        </div>
      </div>

      {/* Main Render: Grid (Trombinoscope) or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => {
            const isSelected = selectedIds.includes(emp.id);
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className={`bg-white rounded-3xl border ${isSelected ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xl' : 'border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300'} transition-all cursor-pointer overflow-hidden flex flex-col relative group`}
              >
                {/* Header Top Bar Accent */}
                <div className="h-2 bg-gradient-to-r from-[#2563EB] via-purple-500 to-[#E5A110]"></div>

                {/* Checkbox Floating Button */}
                <button
                  onClick={(e) => toggleSelectOne(emp.id, e)}
                  className="absolute top-4 right-4 z-10 p-1.5 rounded-xl bg-white/90 shadow-md border border-slate-200 text-slate-400 hover:text-[#2563EB] transition-colors"
                >
                  {isSelected ? <CheckSquare size={18} className="text-[#2563EB]" /> : <Square size={18} />}
                </button>

                <div className="p-6 flex flex-col items-center text-center flex-1">
                  {/* Photo Profile */}
                  <div className="relative mb-4">
                    <EmployeeAvatar
                      src={emp.photo}
                      nom={emp.nom}
                      prenoms={emp.prenoms}
                      matricule={emp.matricule}
                      size="xl"
                      className="rounded-3xl shadow-lg border-2 border-white ring-4 ring-slate-100 group-hover:scale-105 transition-transform"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md ${
                      emp.statut === 'Actif' ? 'bg-emerald-500' : emp.statut === 'En congé' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></span>
                  </div>

                  {/* Name & Role */}
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight hover:text-[#2563EB] transition-colors">
                    {emp.nom} {emp.prenoms}
                  </h3>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-1">{emp.poste}</p>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    <span className="text-[10px] font-black text-[#2563EB] uppercase bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                      {emp.matricule}
                    </span>
                    <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded-lg">
                      {emp.type}
                    </span>
                    {emp.departement && (
                      <span className="text-[10px] font-black text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded-lg">
                        {emp.departement}
                      </span>
                    )}
                  </div>

                  {/* Contact Info Quick Bar */}
                  <div className="w-full mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-3 text-slate-500 text-xs font-medium">
                    {emp.telephone && (
                      <a
                        href={`tel:${emp.telephone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-[#2563EB] p-1.5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"
                        title={emp.telephone}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    {emp.email && (
                      <a
                        href={`mailto:${emp.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 hover:text-[#2563EB] p-1.5 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors"
                        title={emp.email}
                      >
                        <Mail size={14} />
                      </a>
                    )}
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <MapPin size={12} className="text-amber-500" /> {emp.site || 'Abidjan'}
                    </span>
                  </div>
                </div>

                {/* Footer Quick Actions */}
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGeneratePDF(emp); }}
                    className="text-[10px] font-black text-slate-700 hover:text-emerald-600 uppercase flex items-center gap-1 transition-colors"
                  >
                    <FileText size={13} /> Fiche PDF
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGenerateBadge(emp); }}
                    className="text-[10px] font-black text-slate-700 hover:text-[#2563EB] uppercase flex items-center gap-1 transition-colors"
                  >
                    <CreditCard size={13} /> Badge Pro
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedEmp(emp); }}
                    className="text-[10px] font-black text-[#2563EB] uppercase flex items-center gap-1 transition-colors hover:underline"
                  >
                    <Eye size={13} /> Profil
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full p-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <UserMinus size={40} />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Aucun collaborateur trouvé avec ces critères</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-2xl border border-ci-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-ci-bg/50 text-[10px] font-black uppercase tracking-widest text-ci-muted border-b border-ci-border">
                    <tr>
                        <th className="px-6 py-6 text-center w-12">
                          <button onClick={toggleSelectAll} className="text-slate-400 hover:text-[#2563EB]">
                            {selectedIds.length > 0 && selectedIds.length === filteredEmployees.length ? (
                              <CheckSquare size={18} className="text-[#2563EB]" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </th>
                        <th className="px-8 py-6 text-left cursor-pointer hover:text-slate-900" onClick={() => { setSortBy('nom'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                          <span className="flex items-center gap-1">Profil & Identité {sortBy === 'nom' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                        </th>
                        <th className="px-8 py-6 text-left cursor-pointer hover:text-slate-900" onClick={() => { setSortBy('departement'); setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); }}>
                          <span className="flex items-center gap-1">Position Stratégique {sortBy === 'departement' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                        </th>
                        <th className="px-8 py-6 text-left">Localisation</th>
                        <th className="px-8 py-6 text-left">Contrat</th>
                        <th className="px-8 py-6 text-left">Statut</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-ci-bg">
                    <AnimatePresence>
                        {filteredEmployees.map((emp) => {
                          const isSelected = selectedIds.includes(emp.id);
                          return (
                            <motion.tr 
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key={emp.id} 
                                onClick={() => setSelectedEmp(emp)}
                                className={`transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/60' : 'hover:bg-ci-bg/40'}`}
                            >
                                <td className="px-6 py-6 text-center" onClick={(e) => toggleSelectOne(emp.id, e)}>
                                  <button className="text-slate-400 hover:text-[#2563EB]">
                                    {isSelected ? <CheckSquare size={18} className="text-[#2563EB]" /> : <Square size={18} />}
                                  </button>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-5">
                                        <EmployeeAvatar
                                            src={emp.photo}
                                            nom={emp.nom}
                                            prenoms={emp.prenoms}
                                            matricule={emp.matricule}
                                            size="lg"
                                            className="rounded-[1.5rem] group-hover:rotate-3 transition-transform"
                                        />
                                        <div>
                                            <p className="text-base font-black text-ci-text tracking-tighter leading-none">{emp.nom} {emp.prenoms}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-black text-ci-green uppercase bg-ci-greenLight px-2 py-0.5 rounded leading-none">{emp.matricule}</span>
                                                <span className="text-[10px] font-bold text-ci-muted uppercase tracking-widest">{emp.sexe}</span>
                                                <span className="text-[10px] font-bold text-ci-muted uppercase tracking-widest">• {emp.situationMatrimoniale || 'Célibataire'} • {emp.nbEnfants || 0} enf.</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <p className="text-sm font-black text-ci-text uppercase tracking-tight leading-none">{emp.poste}</p>
                                    <p className="text-[10px] font-bold text-ci-muted uppercase mt-2 tracking-widest">{emp.departement}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-xs font-black text-ci-text uppercase">
                                        <div className="w-8 h-8 bg-ci-bg rounded-lg flex items-center justify-center"><MapPin size={14} className="text-ci-orange" /></div>
                                        {emp.site}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="px-4 py-2 bg-white text-ci-text text-[10px] font-black rounded-xl border border-ci-border uppercase shadow-sm">
                                        {emp.type}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                                        emp.statut === 'Actif' ? 'bg-ci-greenLight text-ci-green border-ci-green/20' : 
                                        emp.statut === 'En congé' ? 'bg-ci-orangeLight text-ci-orange border-ci-orange/20' : 
                                        'bg-red-50 text-ci-danger border-red-100'
                                    }`}>
                                        {emp.statut}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right relative">
                                    <div className="flex justify-end items-center gap-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                                            }}
                                            className="px-4 py-2 bg-ci-bg text-ci-text rounded-xl hover:bg-ci-sidebar hover:text-white transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                                        >
                                            Actions <MoreVertical size={12} />
                                        </button>

                                        {activeMenuId === emp.id && (
                                            <div className="absolute right-8 top-16 w-48 bg-white border border-ci-border rounded-2xl shadow-xl z-50 py-2 animate-scaleIn text-left">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedEmp(emp);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 hover:bg-ci-bg text-xs font-bold text-ci-text flex items-center gap-2 transition-colors"
                                                >
                                                    <Eye size={14} className="text-ci-info" /> Voir Détails
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(emp);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 hover:bg-ci-bg text-xs font-bold text-ci-text flex items-center gap-2 transition-colors"
                                                >
                                                    <Edit size={14} className="text-ci-green" /> Modifier Profil
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCertificatePermissions(emp);
                                                    }}
                                                    className="w-full px-4 py-2.5 hover:bg-ci-bg text-xs font-bold text-ci-text flex items-center gap-2 transition-colors"
                                                >
                                                    <Shield size={14} className="text-ci-orange" /> Gérer Attestations
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGeneratePDF(emp);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 hover:bg-ci-bg text-xs font-bold text-ci-text flex items-center gap-2 transition-colors"
                                                >
                                                    <FileText size={14} className="text-emerald-600" /> Fiche PDF
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGenerateBadge(emp);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 hover:bg-ci-bg text-xs font-bold text-ci-text flex items-center gap-2 transition-colors"
                                                >
                                                    <CreditCard size={14} className="text-ci-sidebar" /> Badge Pro
                                                </button>
                                                {emp.statut === 'Actif' && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`Êtes-vous sûr de vouloir mettre fin au contrat de ${emp.nom} ${emp.prenoms} ?\n\nUne attestation de travail sera générée automatiquement.`)) {
                                                                handleTerminateContractById(emp.id, emp);
                                                            }
                                                            setActiveMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2.5 hover:bg-red-50 text-xs font-bold text-ci-danger flex items-center gap-2 transition-colors"
                                                    >
                                                        <AlertTriangle size={14} className="text-ci-danger" /> Résilier + Attestation
                                                    </button>
                                                )}
                                                <div className="border-t border-ci-border my-1"></div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(emp.id);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full px-4 py-2.5 hover:bg-red-50 text-xs font-bold text-ci-danger flex items-center gap-2 transition-colors"
                                                >
                                                    <Trash2 size={14} /> Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                          );
                        })}
                    </AnimatePresence>
                </tbody>
            </table>
            {filteredEmployees.length === 0 && (
                <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-ci-bg rounded-full flex items-center justify-center mx-auto text-ci-muted"><UserMinus size={40} /></div>
                    <p className="text-ci-muted font-black uppercase tracking-widest text-sm">Aucun collaborateur trouvé</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ajout */}
      {showModal && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-scaleIn p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black tracking-tighter uppercase">Nouveau Collaborateur</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>
                  <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Matricule</label>
                          <input type="text" required value={newEmp.matricule} onChange={e => setNewEmp({...newEmp, matricule: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Ex: EMP-100" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Email Pro</label>
                          <input type="email" required value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="nom@entreprise.ci" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nom</label>
                          <input type="text" required value={newEmp.nom} onChange={e => setNewEmp({...newEmp, nom: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Prénoms</label>
                          <input type="text" required value={newEmp.prenoms} onChange={e => setNewEmp({...newEmp, prenoms: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Poste</label>
                          <input type="text" required value={newEmp.poste} onChange={e => setNewEmp({...newEmp, poste: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Département</label>
                          <select value={newEmp.departement} onChange={e => setNewEmp({...newEmp, departement: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="">Choisir...</option>
                              <option>Direction</option>
                              <option>Comptabilité</option>
                              <option>Ressources Humaines</option>
                              <option>Sécurité</option>
                              <option>BTP</option>
                              <option>Logistique</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Responsable Hiérarchique</label>
                          <select value={newEmp.responsable} onChange={e => setNewEmp({...newEmp, responsable: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="">Aucun (Direction)</option>
                              {(data?.employees || []).filter(e => e.statut === 'Actif').map(empOption => (
                                  <option key={empOption.id} value={empOption.id}>
                                      {empOption.nom} {empOption.prenoms} - {empOption.poste}
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Site</label>
                          <select value={newEmp.site} onChange={e => setNewEmp({...newEmp, site: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="">Choisir...</option>
                              <option value="abidjan">Abidjan - Plateau</option>
                              <option value="bouake">Bouaké</option>
                              <option value="sanpedro">San Pedro</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Salaire de Base (FCFA)</label>
                          <input type="number" required value={newEmp.salaireBase} onChange={e => setNewEmp({...newEmp, salaireBase: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Genre (Sexe)</label>
                          <select value={newEmp.sexe} onChange={e => setNewEmp({...newEmp, sexe: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="M">Masculin (M)</option>
                              <option value="F">Féminin (F)</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Situation Matrimoniale</label>
                          <select value={newEmp.situationMatrimoniale} onChange={e => setNewEmp({...newEmp, situationMatrimoniale: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="Célibataire">Célibataire</option>
                              <option value="Marié">Marié(e)</option>
                              <option value="Divorcé">Divorcé(e)</option>
                              <option value="Veuf">Veuf/Veuve</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nombre d'enfants à charge</label>
                          <input type="number" min="0" required value={newEmp.nbEnfants} onChange={e => setNewEmp({...newEmp, nbEnfants: parseInt(e.target.value) || 0})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Numéro CNPS</label>
                          <input type="text" value={newEmp.cnps} onChange={e => setNewEmp({...newEmp, cnps: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Ex: CNPS-12345" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">RIB Bancaire</label>
                          <input type="text" value={newEmp.rib} onChange={e => setNewEmp({...newEmp, rib: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Ex: CI01 00012 345678901234 56" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nationalité</label>
                          <select value={newEmp.nationalite || 'Ivoirienne'} onChange={e => setNewEmp({...newEmp, nationalite: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="Ivoirienne">Ivoirienne (ITS Pat: 1.2%)</option>
                              <option value="Expatrié">Expatrié (ITS Pat: 12%)</option>
                              <option value="Autre CEDEAO">Autre CEDEAO</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Mode de Règlement</label>
                          <select value={newEmp.modePaiement || 'Virement Bancaire'} onChange={e => setNewEmp({...newEmp, modePaiement: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="Virement Bancaire">Virement Bancaire</option>
                              <option value="Wave">Wave</option>
                              <option value="Orange Money">Orange Money</option>
                              <option value="MTN MoMo">MTN MoMo</option>
                              <option value="Chèque/Espèces">Chèque/Espèces</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Numéro Mobile Money (Si applicable)</label>
                          <input type="text" value={newEmp.numeroMobileMoney || ''} onChange={e => setNewEmp({...newEmp, numeroMobileMoney: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="+225 07..." />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Date d'embauche</label>
                          <input type="date" required value={newEmp.dateEmbauche} onChange={e => setNewEmp({...newEmp, dateEmbauche: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Téléphone</label>
                          <input type="text" required value={newEmp.telephone} onChange={e => setNewEmp({...newEmp, telephone: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="+225 ..." />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nom d'utilisateur (login)</label>
                          <input type="text" value={newEmp.username} onChange={e => setNewEmp({...newEmp, username: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Pour connexion employé" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Mot de passe</label>
                          <input type="password" value={newEmp.password} onChange={e => setNewEmp({...newEmp, password: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Pour connexion employé" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1 flex items-center gap-1.5 text-slate-700">
                              <Camera size={13} className="text-ci-green" /> Photo de profil
                          </label>
                          <div className="flex items-center gap-4 p-4 bg-ci-bg rounded-2xl border border-ci-border">
                              <EmployeeAvatar
                                  src={newEmp.photo}
                                  nom={newEmp.nom}
                                  prenoms={newEmp.prenoms}
                                  matricule={newEmp.matricule}
                                  size="xl"
                                  className="rounded-2xl"
                              />
                              <div className="flex-1 space-y-2">
                                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-xs font-bold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-ci-green file:text-white hover:file:opacity-90 cursor-pointer" />
                                  <p className="text-[10px] text-slate-400 font-medium">Format JPEG/PNG optimisé automatiquement (max 400x400px)</p>
                              </div>
                              {newEmp.photo && (
                                  <button
                                      type="button"
                                      onClick={() => setNewEmp({ ...newEmp, photo: '' })}
                                      className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                                      title="Supprimer la photo"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              )}
                          </div>
                      </div>
                      <div className="md:col-span-2 flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-gray-200">Annuler</button>
                        <button type="submit" className="flex-1 py-5 bg-ci-green text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-ci-green/20 hover:bg-ci-greenDark transition-all">Enregistrer le profil</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Modification Employé */}
      {showEditModal && selectedEmp && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-scaleIn p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tighter uppercase">Modifier le Profil</h3>
                    <button onClick={() => setShowEditModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>
                  <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Matricule</label>
                          <input type="text" required value={editEmp.matricule || ''} onChange={e => setEditEmp({...editEmp, matricule: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Email Pro</label>
                          <input type="email" required value={editEmp.email || ''} onChange={e => setEditEmp({...editEmp, email: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nom</label>
                          <input type="text" required value={editEmp.nom || ''} onChange={e => setEditEmp({...editEmp, nom: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Prénoms</label>
                          <input type="text" required value={editEmp.prenoms || ''} onChange={e => setEditEmp({...editEmp, prenoms: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Poste</label>
                          <input type="text" required value={editEmp.poste || ''} onChange={e => setEditEmp({...editEmp, poste: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Département</label>
                          <select value={editEmp.departement || ''} onChange={e => setEditEmp({...editEmp, departement: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="">Choisir...</option>
                              <option>Direction</option>
                              <option>Comptabilité</option>
                              <option>Ressources Humaines</option>
                              <option>Sécurité</option>
                              <option>BTP</option>
                              <option>Logistique</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Responsable Hiérarchique</label>
                          <select value={editEmp.responsable || ''} onChange={e => setEditEmp({...editEmp, responsable: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="">Aucun (Direction)</option>
                              {(data?.employees || []).filter(e => e.statut === 'Actif' && e.id !== selectedEmp?.id).map(empOption => (
                                  <option key={empOption.id} value={empOption.id}>
                                      {empOption.nom} {empOption.prenoms} - {empOption.poste}
                                  </option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Site</label>
                          <select value={editEmp.site || ''} onChange={e => setEditEmp({...editEmp, site: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="">Choisir...</option>
                              <option value="abidjan">Abidjan - Plateau</option>
                              <option value="bouake">Bouaké</option>
                              <option value="sanpedro">San Pedro</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Salaire de Base (FCFA)</label>
                          <input type="number" required value={editEmp.salaireBase || ''} onChange={e => setEditEmp({...editEmp, salaireBase: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Genre (Sexe)</label>
                          <select value={editEmp.sexe || 'M'} onChange={e => setEditEmp({...editEmp, sexe: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="M">Masculin (M)</option>
                              <option value="F">Féminin (F)</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Situation Matrimoniale</label>
                          <select value={editEmp.situationMatrimoniale || 'Célibataire'} onChange={e => setEditEmp({...editEmp, situationMatrimoniale: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="Célibataire">Célibataire</option>
                              <option value="Marié">Marié(e)</option>
                              <option value="Divorcé">Divorcé(e)</option>
                              <option value="Veuf">Veuf/Veuve</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nombre d'enfants à charge</label>
                          <input type="number" min="0" required value={editEmp.nbEnfants || 0} onChange={e => setEditEmp({...editEmp, nbEnfants: parseInt(e.target.value) || 0})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Numéro CNPS</label>
                          <input type="text" value={editEmp.cnps || ''} onChange={e => setEditEmp({...editEmp, cnps: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Ex: CNPS-12345" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">RIB Bancaire</label>
                          <input type="text" value={editEmp.rib || ''} onChange={e => setEditEmp({...editEmp, rib: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Ex: CI01 00012 345678901234 56" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nationalité</label>
                          <select value={editEmp.nationalite || 'Ivoirienne'} onChange={e => setEditEmp({...editEmp, nationalite: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="Ivoirienne">Ivoirienne (ITS Pat: 1.2%)</option>
                              <option value="Expatrié">Expatrié (ITS Pat: 12%)</option>
                              <option value="Autre CEDEAO">Autre CEDEAO</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Mode de Règlement</label>
                          <select value={editEmp.modePaiement || 'Virement Bancaire'} onChange={e => setEditEmp({...editEmp, modePaiement: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold outline-none">
                              <option value="Virement Bancaire">Virement Bancaire</option>
                              <option value="Wave">Wave</option>
                              <option value="Orange Money">Orange Money</option>
                              <option value="MTN MoMo">MTN MoMo</option>
                              <option value="Chèque/Espèces">Chèque/Espèces</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Numéro Mobile Money (Si applicable)</label>
                          <input type="text" value={editEmp.numeroMobileMoney || ''} onChange={e => setEditEmp({...editEmp, numeroMobileMoney: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="+225 07..." />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Date d'embauche</label>
                          <input type="date" required value={editEmp.dateEmbauche || ''} onChange={e => setEditEmp({...editEmp, dateEmbauche: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Téléphone</label>
                          <input type="text" required value={editEmp.telephone || ''} onChange={e => setEditEmp({...editEmp, telephone: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="+225 ..." />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Nom d'utilisateur (login)</label>
                          <input type="text" value={editEmp.username || ''} onChange={e => setEditEmp({...editEmp, username: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Pour connexion employé" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1">Mot de passe</label>
                          <input type="password" value={editEmp.password || ''} onChange={e => setEditEmp({...editEmp, password: e.target.value})} className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none" placeholder="Pour connexion employé" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black uppercase ml-1 flex items-center gap-1.5 text-slate-700">
                              <Camera size={13} className="text-ci-green" /> Photo de profil
                          </label>
                          <div className="flex items-center gap-4 p-4 bg-ci-bg rounded-2xl border border-ci-border">
                              <EmployeeAvatar
                                  src={editEmp.photo}
                                  nom={editEmp.nom}
                                  prenoms={editEmp.prenoms}
                                  matricule={editEmp.matricule}
                                  size="xl"
                                  className="rounded-2xl"
                              />
                              <div className="flex-1 space-y-2">
                                  <input type="file" accept="image/*" onChange={handleEditPhotoUpload} className="w-full text-xs font-bold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-ci-green file:text-white hover:file:opacity-90 cursor-pointer" />
                                  <p className="text-[10px] text-slate-400 font-medium">Format JPEG/PNG optimisé automatiquement (max 400x400px)</p>
                              </div>
                              {editEmp.photo && (
                                  <button
                                      type="button"
                                      onClick={() => setEditEmp({ ...editEmp, photo: '' })}
                                      className="p-2.5 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                                      title="Supprimer la photo"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              )}
                          </div>
                      </div>
                      <div className="md:col-span-2 flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-5 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-gray-200">Annuler</button>
                        <button type="submit" className="flex-1 py-5 bg-ci-green text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-ci-green/20 hover:bg-ci-greenDark transition-all">Mettre à jour</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Gestion Attestations */}
      {showCertificateModal && selectedEmp && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-scaleIn p-10">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase">Gérer Attestations</h3>
                        <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mt-1">{selectedEmp.nom} {selectedEmp.prenoms}</p>
                    </div>
                    <button onClick={() => setShowCertificateModal(false)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>

                  <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-ci-bg rounded-2xl border border-ci-border">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-ci-greenLight text-ci-green rounded-xl flex items-center justify-center">
                                  <Shield size={20} />
                              </div>
                              <div>
                                  <p className="text-sm font-black text-ci-text">Attestation de Travail</p>
                                  <p className="text-[10px] font-bold text-ci-muted">Certifie l'emploi actuel</p>
                              </div>
                          </div>
                          <button
                              onClick={() => setCertificatePermissions({...certificatePermissions, attestationTravail: certificatePermissions.attestationTravail ? 0 : 1})}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  certificatePermissions.attestationTravail 
                                      ? 'bg-ci-green text-white' 
                                      : 'bg-white border border-ci-border text-ci-muted'
                              }`}
                          >
                              <CheckCircle size={20} />
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-ci-bg rounded-2xl border border-ci-border">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-ci-orangeLight text-ci-orange rounded-xl flex items-center justify-center">
                                  <Shield size={20} />
                              </div>
                              <div>
                                  <p className="text-sm font-black text-ci-text">Attestation de Stage</p>
                                  <p className="text-[10px] font-bold text-ci-muted">Pour stagiaires</p>
                              </div>
                          </div>
                          <button
                              onClick={() => setCertificatePermissions({...certificatePermissions, attestationStage: certificatePermissions.attestationStage ? 0 : 1})}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  certificatePermissions.attestationStage 
                                      ? 'bg-ci-orange text-white' 
                                      : 'bg-white border border-ci-border text-ci-muted'
                              }`}
                          >
                              <CheckCircle size={20} />
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-ci-bg rounded-2xl border border-ci-border">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-ci-sidebar/10 text-ci-sidebar rounded-xl flex items-center justify-center">
                                  <Shield size={20} />
                              </div>
                              <div>
                                  <p className="text-sm font-black text-ci-text">Attestation de Salaire</p>
                                  <p className="text-[10px] font-bold text-ci-muted">Pour démarches bancaires</p>
                              </div>
                          </div>
                          <button
                              onClick={() => setCertificatePermissions({...certificatePermissions, attestationSalaire: certificatePermissions.attestationSalaire ? 0 : 1})}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                  certificatePermissions.attestationSalaire 
                                      ? 'bg-ci-sidebar text-white' 
                                      : 'bg-white border border-ci-border text-ci-muted'
                              }`}
                          >
                              <CheckCircle size={20} />
                          </button>
                      </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setShowCertificateModal(false)} className="flex-1 py-4 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-gray-200">Annuler</button>
                    <button onClick={handleUpdateCertificatePermissions} className="flex-1 py-4 bg-ci-green text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-ci-green/20 hover:bg-ci-greenDark transition-all">Sauvegarder</button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Détails Collaborateur */}
      {selectedEmp && !showEditModal && !showCertificateModal && (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl animate-scaleIn p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tighter uppercase text-ci-sidebar">Profil Collaborateur</h3>
                    <button onClick={() => setSelectedEmp(null)} className="p-2 bg-ci-bg rounded-xl hover:rotate-90 transition-all"><X /></button>
                  </div>

                  <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-center gap-6 bg-ci-bg/50 p-8 rounded-3xl">
                          <EmployeeAvatar
                              src={selectedEmp.photo}
                              nom={selectedEmp.nom}
                              prenoms={selectedEmp.prenoms}
                              matricule={selectedEmp.matricule}
                              size="2xl"
                              className="rounded-3xl shadow-lg border-2 border-slate-200"
                          />
                          <div className="text-center sm:text-left flex-1">
                              <h4 className="text-2xl font-black text-ci-text leading-tight">{selectedEmp.nom} {selectedEmp.prenoms}</h4>
                              <p className="text-sm font-black text-ci-green uppercase mt-1">{selectedEmp.poste}</p>
                              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                  <span className="text-[10px] font-black text-ci-sidebar uppercase bg-ci-bg px-3 py-1 rounded-full">{selectedEmp.matricule}</span>
                                  <span className="text-[10px] font-black text-ci-info uppercase bg-blue-50 px-3 py-1 rounded-full">{selectedEmp.departement}</span>
                                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                      selectedEmp.statut === 'Actif' ? 'bg-ci-greenLight text-ci-green' : 
                                      selectedEmp.statut === 'En congé' ? 'bg-ci-orangeLight text-ci-orange' : 'bg-red-50 text-ci-danger'
                                  }`}>{selectedEmp.statut}</span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-2">
                              <button 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(selectedEmp); }}
                                  className="px-4 py-2.5 bg-ci-sidebar text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md"
                              >
                                  <Edit size={12} /> Modifier Profil
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Genre</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.sexe === 'M' ? 'Masculin (M)' : 'Féminin (F)'}</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Situation Matrimoniale</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.situationMatrimoniale || 'Célibataire'}</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Enfants à charge</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.nbEnfants || 0} enfant(s)</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Numéro Affiliation CNPS</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.cnps || 'Non affilié(e)'}</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Type de Contrat</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.type}</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Date de recrutement</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{new Date(selectedEmp.dateEmbauche).toLocaleDateString('fr-CI')}</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Responsable Hiérarchique</p>
                              <p className="text-sm font-bold text-ci-text mt-1">
                                  {selectedEmp.responsable 
                                    ? (() => {
                                        const resp = (data?.employees || []).find(e => e.id.toString() === selectedEmp.responsable.toString());
                                        return resp ? `${resp.nom} ${resp.prenoms}` : 'Inconnu';
                                      })()
                                    : 'Aucun (Direction)'}
                              </p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Salaire de Base Brut</p>
                              <p className="text-sm font-black text-ci-text mt-1">{new Intl.NumberFormat('fr-CI').format(selectedEmp.salaireBase)} F CFA / mois</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Site Géographique</p>
                              <p className="text-sm font-bold text-ci-text mt-1 uppercase">{selectedEmp.site}</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Numéro de Téléphone</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.telephone || '—'}</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl">
                              <p className="text-[9px] font-black text-ci-muted uppercase">Adresse E-mail Professionnelle</p>
                              <p className="text-sm font-bold text-ci-text mt-1 break-all">{selectedEmp.email || '—'}</p>
                          </div>
                          <div className="p-4 bg-ci-bg rounded-2xl sm:col-span-2">
                              <p className="text-[9px] font-black text-ci-muted uppercase">RIB Bancaire</p>
                              <p className="text-sm font-bold text-ci-text mt-1">{selectedEmp.rib || 'Non renseigné'}</p>
                          </div>
                      </div>

                      {/* Sécurité BTP, Habilitations & Dotation EPI */}
                      <div className="pt-6 border-t border-ci-border space-y-3">
                          <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                                  <HardHat size={16} className="text-amber-500" /> Sécurité Chantier, Habilitations & Dotation EPI
                              </h4>
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                  Conforme BTP
                              </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block">Habilitation Électrique</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                      <CheckCircle size={14} className="text-emerald-600" />
                                      <span className="text-xs font-black text-slate-800">
                                          {selectedEmp.departement === 'BTP' || selectedEmp.poste?.toLowerCase().includes('electr') ? 'B2V / BR / H0' : 'B0 (Non-électricien)'}
                                      </span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Valide jusqu'en Déc 2026</span>
                              </div>

                              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block">CACES / Engins / Hauteur</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                      <CheckCircle size={14} className="text-emerald-600" />
                                      <span className="text-xs font-black text-slate-800">
                                          {selectedEmp.poste?.toLowerCase().includes('conduct') ? 'CACES R482 Cat. A+C' : 'Aptitude Hauteur R408'}
                                      </span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Certification Chantier</span>
                              </div>

                              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block">Visite Médicale Travail</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                      <CheckCircle size={14} className="text-emerald-600" />
                                      <span className="text-xs font-black text-emerald-700">Apte sans restriction</span>
                                  </div>
                                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">Médecine du travail CIV</span>
                              </div>
                          </div>

                          <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                              <div>
                                  <p className="text-xs font-black text-amber-900">Pack Dotation EPI Remis :</p>
                                  <p className="text-[10px] font-bold text-amber-800 mt-0.5">
                                      Casque EN397 • Chaussures S3 • Gilet Haute Visibilité • Gants anti-coupure • Lunettes UV
                                  </p>
                              </div>
                              <span className="text-[9px] font-black text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                                  Pack Complet
                              </span>
                          </div>
                      </div>

                      {/* Disciplinary History Section */}
                      <div className="pt-6 border-t border-ci-border">
                          <h4 className="text-xs font-black text-ci-text uppercase tracking-widest mb-4 flex items-center gap-2 text-ci-danger">
                              <AlertOctagon size={16} /> Historique Disciplinaire
                          </h4>
                          
                          {(() => {
                              const empDEs = (data.disciplinaryActions || []).filter(de => de.empId === selectedEmp.id);
                              if (empDEs.length === 0) {
                                  return <p className="text-xs font-bold text-ci-muted italic p-4 bg-ci-bg rounded-2xl">Aucun incident ou demande d'explication dans le dossier.</p>;
                              }
                              return (
                                  <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                      {empDEs.map(de => (
                                          <div key={de.id} className="p-4 bg-ci-bg rounded-2xl border border-ci-border flex justify-between items-start gap-4 hover:shadow-md transition-shadow">
                                              <div className="space-y-1">
                                                  <div className="flex items-center gap-2">
                                                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded leading-none ${
                                                          de.type === 'Demande d\'explication' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                                                      }`}>{de.type}</span>
                                                      <span className="text-[10px] font-bold text-ci-muted">{de.dateEmission}</span>
                                                  </div>
                                                  <p className="text-xs font-bold text-ci-text line-clamp-2 mt-1">{de.motif}</p>
                                                  {de.sanction && (
                                                      <p className="text-[10px] font-black text-ci-orange uppercase mt-1">Sanction : {de.sanction}</p>
                                                  )}
                                              </div>
                                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                                  de.statut === 'En attente de réponse' ? 'bg-amber-100 text-amber-800' :
                                                  de.statut === 'Répondu' ? 'bg-blue-100 text-blue-800' :
                                                  de.statut === 'Sanctionné' ? 'bg-red-100 text-red-800' :
                                                  'bg-slate-100 text-slate-800'
                                              }`}>
                                                  {de.statut}
                                              </span>
                                          </div>
                                      ))}
                                  </div>
                              );
                          })()}
                      </div>

                      {/* Actions Section avec Contrôle d'Éligibilité des Attestations en temps réel */}
                      <div className="pt-6 border-t border-ci-border">
                          <h4 className="text-xs font-black text-ci-text uppercase tracking-widest mb-4">Génération d'Attestations & Documents Officiels</h4>
                          
                          {(() => {
                              const elig = getCertificateEligibility(selectedEmp);
                              return (
                                  <div className="grid grid-cols-1 gap-3">
                                      {/* Attestation / Certificat de travail */}
                                      <div className="p-4 bg-ci-bg/60 rounded-2xl border border-ci-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-black text-xs text-ci-text">{elig.trabajo.title}</span>
                                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                                      elig.trabajo.eligible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                                  }`}>
                                                      {elig.trabajo.eligible ? '🟢 Éligible' : '⚪ Indisponible'}
                                                  </span>
                                              </div>
                                              <p className="text-[10px] text-ci-muted font-bold mt-0.5">{elig.trabajo.reason}</p>
                                          </div>
                                          <button 
                                              onClick={() => handleDownloadWorkCertificate(selectedEmp)}
                                              disabled={!elig.trabajo.eligible}
                                              className="px-4 py-2.5 bg-ci-green hover:bg-ci-green/90 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
                                          >
                                              <Briefcase size={14} /> Générer PDF
                                          </button>
                                      </div>

                                      {/* Attestation de stage */}
                                      <div className="p-4 bg-ci-bg/60 rounded-2xl border border-ci-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-black text-xs text-ci-text">{elig.stage.title}</span>
                                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                                      elig.stage.eligible ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                                                  }`}>
                                                      {elig.stage.eligible ? '🟢 Éligible (Stagiaire)' : '⚪ Indisponible'}
                                                  </span>
                                              </div>
                                              <p className="text-[10px] text-ci-muted font-bold mt-0.5">{elig.stage.reason}</p>
                                          </div>
                                          <button 
                                              onClick={() => handleDownloadInternshipCertificate(selectedEmp)}
                                              disabled={!elig.stage.eligible}
                                              className="px-4 py-2.5 bg-ci-orange hover:bg-ci-orange/90 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
                                          >
                                              <GraduationCap size={14} /> Générer PDF
                                          </button>
                                      </div>

                                      {/* Attestation de salaire */}
                                      <div className="p-4 bg-ci-bg/60 rounded-2xl border border-ci-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                              <div className="flex items-center gap-2">
                                                  <span className="font-black text-xs text-ci-text">{elig.salaire.title}</span>
                                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                                      elig.salaire.eligible ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                                                  }`}>
                                                      {elig.salaire.eligible ? '🟢 Éligible' : '⚪ Indisponible'}
                                                  </span>
                                              </div>
                                              <p className="text-[10px] text-ci-muted font-bold mt-0.5">{elig.salaire.reason}</p>
                                          </div>
                                          <button 
                                              onClick={() => handleDownloadSalaryCertificate(selectedEmp)}
                                              disabled={!elig.salaire.eligible}
                                              className="px-4 py-2.5 bg-ci-sidebar hover:bg-ci-sidebar/90 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shrink-0"
                                          >
                                              <FileText size={14} /> Générer PDF
                                          </button>
                                      </div>
                                  </div>
                              );
                          })()}
                              <button 
                                  onClick={() => {
                                      setSelectedEmp(null);
                                      navigate(`/disciplinary?empId=${selectedEmp.id}`);
                                  }}
                                  className="p-4 bg-red-50 text-ci-danger rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-ci-danger hover:text-white transition-all flex items-center justify-center gap-2 sm:col-span-2 border border-red-100"
                              >
                                  <AlertOctagon size={16} /> Émettre une Demande d'Explication (D.E.)
                              </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                              <button 
                                  onClick={() => { handleGeneratePDF(selectedEmp); setSelectedEmp(null); }}
                                  className="p-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                              >
                                  <FileText size={16} /> Fiche Employé PDF
                              </button>
                              <button 
                                  onClick={() => { handleGenerateBadge(selectedEmp); setSelectedEmp(null); }}
                                  className="p-4 bg-ci-sidebar text-white rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-ci-sidebar/80 transition-all flex items-center justify-center gap-2"
                              >
                                  <CreditCard size={16} /> Badge Pro
                              </button>
                              {selectedEmp.statut === 'Actif' && (
                                  <button 
                                      onClick={handleTerminateContract}
                                      className="p-4 bg-red-50 text-ci-danger rounded-2xl font-black text-[10px] uppercase tracking-wider hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                  >
                                      <AlertTriangle size={16} /> Résilier Contrat
                                  </button>
                              )}
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-ci-bg">
                          <button 
                              onClick={() => setSelectedEmp(null)}
                              className="flex-1 py-4 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-gray-200 transition-all"
                          >
                              Fermer
                          </button>
                      </div>
                  </div>
              </div>
      )}
    </div>
  );
};

export default Employees;
