import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import EmployeeAvatar from '../components/EmployeeAvatar';
import { compressImage } from '../utils/imageCompressor';
import { LogOut, Palmtree, FileText, Settings, LayoutGrid, Calendar, Bell, ChevronRight, CheckCircle2, Printer, Download, Info, User, Mail, Phone, MapPin, Briefcase, Calendar as CalendarIcon, Shield, Lock, Eye, EyeOff, Save, GraduationCap, AlertTriangle, DollarSign, Plus, Camera, UploadCloud, Trash2 } from 'lucide-react';
import { calculateDetailedPaie } from '../utils/payrollCalc';
import { generateAttestationTravail, generateCertificatTravail, generateAttestationSalaire } from '../utils/documentGenerator';
import { useNavigate } from 'react-router-dom';
import { calculateRealLeaveDays } from '../utils/holidays';

const EmployeePortal = () => {
  const { user, logout, updateUser } = useAuth();
  const { data, loading, refreshData } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEmpForPayslip, setSelectedEmpForPayslip] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('Juin 2026');
  const [leaveForm, setLeaveForm] = useState({ type: 'Congé annuel', debut: '', fin: '', motif: '' });
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ montant: '', moisRemboursement: 'Juin 2026', motif: '' });
  const [advanceSubmitting, setAdvanceSubmitting] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Profile Edit State
  const [employeeProfileForm, setEmployeeProfileForm] = useState({
    telephone: '',
    email: '',
    emailPerso: '',
    situationMatrimoniale: 'Célibataire',
    nbEnfants: 0,
    adresse: '',
    contactUrgenceNom: '',
    contactUrgenceTelephone: '',
    contactUrgenceLien: '',
    rib: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  const employee = (data?.employees || []).find(e => e.id === (user?.empId || user?.id || 1));

  // Sync profile form when employee data is loaded
  useEffect(() => {
    if (employee) {
      setEmployeeProfileForm({
        telephone: employee.telephone || '',
        email: employee.email || '',
        emailPerso: employee.emailPerso || '',
        situationMatrimoniale: employee.situationMatrimoniale || 'Célibataire',
        nbEnfants: employee.nbEnfants || 0,
        adresse: employee.adresse || '',
        contactUrgenceNom: employee.contactUrgenceNom || '',
        contactUrgenceTelephone: employee.contactUrgenceTelephone || '',
        contactUrgenceLien: employee.contactUrgenceLien || '',
        rib: employee.rib || ''
      });
    }
  }, [employee]);

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !employee?.id) return;
    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
      await axios.patch('/api/profile/photo', { photo: compressed });
      if (updateUser) updateUser({ photo: compressed });
      await refreshData();
      alert('Photo de profil mise à jour avec succès !');
    } catch (err) {
      console.error('Erreur mise à jour photo:', err);
      alert('Erreur lors du téléchargement de la photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!employee?.id || !window.confirm('Voulez-vous vraiment supprimer votre photo de profil ?')) return;
    setUploadingPhoto(true);
    try {
      await axios.patch('/api/profile/photo', { photo: null });
      if (updateUser) updateUser({ photo: null });
      await refreshData();
      alert('Photo de profil supprimée.');
    } catch (err) {
      console.error('Erreur suppression photo:', err);
      alert('Erreur lors de la suppression de la photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEmployeeProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');
    try {
      const res = await axios.put('/api/profile', {
        ...employeeProfileForm,
        name: `${employee.nom} ${employee.prenoms}`,
        email: employeeProfileForm.email || employee.email,
        telephone: employeeProfileForm.telephone
      });
      if (res.data?.user && updateUser) {
        updateUser(res.data.user);
      }
      await refreshData();
      setProfileSuccessMsg('Vos coordonnées et votre profil ont été mis à jour avec succès !');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erreur mise à jour profil employé:', err);
      setProfileErrorMsg(err.response?.data?.error || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Check if employee account is active
  useEffect(() => {
    const employeeData = localStorage.getItem('employee');
    if (employeeData) {
      const emp = JSON.parse(employeeData);
      if (emp.compteActif === 0) {
        localStorage.removeItem('employee');
        alert('Votre compte a été bloqué. Veuillez contacter l\'administration.');
        navigate('/employee-login');
      }
    }
  }, [navigate]);

  if (loading) return <div className="p-10 text-center uppercase font-black tracking-widest text-ci-muted animate-pulse">Initialisation de votre espace...</div>;

  const myLeaves = (data?.leaves || []).filter(l => l.empId === employee?.id);
  const myAttendance = (data?.attendance || []).filter(a => a.empId === employee?.id);

  // Calcul du solde de congés (base: 30 jours annuels - congés pris approuvés)
  const annualLeaveAllowance = 30;
  const approvedLeaveDays = myLeaves
    .filter(l => l.statut === 'Approuvé')
    .reduce((total, leave) => total + (leave.duree || 0), 0);
  const leaveBalance = annualLeaveAllowance - approvedLeaveDays;

  // Calcul du taux d'assiduité
  const calculateAttendanceRate = () => {
    if (!myAttendance || myAttendance.length === 0) return 95; // Valeur par défaut si aucune donnée
    
    const presentDays = myAttendance.filter(a => a.type === 'arrivée').length;
    const totalExpectedDays = myAttendance.length / 2; // Approximation: chaque jour = arrivée + départ
    const rate = totalExpectedDays > 0 ? (presentDays / totalExpectedDays) * 100 : 95;
    return Math.min(Math.round(rate * 10) / 10, 100); // Arrondi à 1 décimale, max 100%
  };
  const attendanceRate = calculateAttendanceRate();

  // Compteur de demandes en attente
  const pendingRequests = myLeaves.filter(l => l.statut === 'En attente').length;

  // Message d'accueil basé sur l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  // Calcul de l'ancienneté
  const calculateSeniority = () => {
    if (!employee?.dateEmbauche) return 0;
    const hireDate = new Date(employee.dateEmbauche);
    const today = new Date();
    const years = today.getFullYear() - hireDate.getFullYear();
    const months = today.getMonth() - hireDate.getMonth();
    return months < 0 ? years - 1 : years;
  };
  const seniorityYears = calculateSeniority();

  const myAdvances = (data?.advances || []).filter(a => a.empId === employee?.id);

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!employee) return;
    setAdvanceSubmitting(true);
    try {
      await axios.post('/api/advances', {
        empId: employee.id,
        montant: parseFloat(advanceForm.montant),
        dateDemande: new Date().toISOString().split('T')[0],
        moisRemboursement: advanceForm.moisRemboursement,
        motif: advanceForm.motif,
        statut: 'En attente'
      });
      alert('Votre demande d\'avance sur salaire a été soumise.');
      setAdvanceForm({ montant: '', moisRemboursement: 'Juin 2026', motif: '' });
      refreshData();
    } catch (err) {
      alert('Erreur lors de la soumission de l\'avance');
    } finally {
      setAdvanceSubmitting(false);
    }
  };

  if (!employee && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-ci-bg rounded-full flex items-center justify-center mx-auto text-ci-muted"><Settings size={40} /></div>
          <p className="text-ci-muted font-black uppercase tracking-widest">Profil collaborateur non trouvé</p>
          <button onClick={logout} className="text-ci-green font-bold hover:underline uppercase text-xs tracking-widest">Retour à la connexion</button>
        </div>
      </div>
    );
  }

  const handlePrintPayslip = (emp, payslipDetails) => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bulletin de Paie - ${emp.nom} ${emp.prenoms}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #2d3436;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
            }
            .payslip-card {
              border: 2px solid #2d3436;
              padding: 24px;
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .header-table td {
              border: 1px solid #dfe6e9;
              padding: 12px;
              vertical-align: top;
            }
            .title {
              text-align: center;
              font-weight: 900;
              font-size: 18px;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 15px 0;
              background-color: #f1f2f6;
              padding: 10px;
              border: 2px solid #2d3436;
            }
            .rubriques-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .rubriques-table th {
              background-color: #2d3436;
              color: #ffffff;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.05em;
              padding: 10px;
              text-align: left;
              border: 1px solid #2d3436;
            }
            .rubriques-table td {
              border: 1px solid #dfe6e9;
              padding: 8px 10px;
              font-size: 11px;
            }
            .rubriques-table .num {
              text-align: right;
              font-variant-numeric: tabular-nums;
            }
            .totals-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              margin-bottom: 20px;
            }
            .totals-table td {
              border: 1px solid #2d3436;
              padding: 10px;
              font-size: 11px;
              font-weight: bold;
            }
            .net-box {
              background-color: #E8F5E9;
              border: 2px solid #009E49;
              padding: 15px;
              text-align: center;
              font-size: 16px;
              font-weight: 900;
              color: #007A38;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .patronal-box {
              border: 1px dashed #b2bec3;
              padding: 12px;
              background-color: #f9f9f9;
              margin-bottom: 20px;
              font-size: 10px;
            }
            .patronal-box h4 {
              margin: 0 0 8px 0;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #636e72;
            }
            .patronal-table {
              width: 100%;
              border-collapse: collapse;
            }
            .patronal-table td {
              padding: 4px;
            }
            .footer-signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding-top: 20px;
            }
            .signature-block {
              width: 45%;
              border: 1px solid #dfe6e9;
              padding: 15px;
              text-align: center;
              min-height: 100px;
              font-size: 11px;
            }
            .signature-block .signature-title {
              font-weight: bold;
              text-transform: uppercase;
              font-size: 9px;
              color: #636e72;
              border-bottom: 1px solid #dfe6e9;
              padding-bottom: 5px;
              margin-bottom: 30px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
              .payslip-card {
                border: 1px solid #000;
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end;">
            <button onclick="window.print();" style="background-color: #009E49; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Imprimer / Télécharger en PDF</button>
          </div>
          <div class="payslip-card">
            <table class="header-table">
              <tr>
                <td style="width: 25%; vertical-align: top; padding-right: 15px;">
                  <div style="background: #ffffff; padding: 5px 8px; border-radius: 10px; border: 1px solid #e2e8f0; display: inline-block;">
                    <img src="${company.logo || '/gebat_logo.png'}" alt="GEBAT Logo" style="max-height: 55px; max-width: 110px; object-fit: contain; display: block;" />
                  </div>
                </td>
                <td style="width: 40%; vertical-align: top;">
                  <h3 style="margin: 0 0 5px 0; text-transform: uppercase; font-weight: 900; color: #2563EB;">${company.companyName || 'GEBAT SA'}</h3>
                  <p style="margin: 0; font-size: 11px; line-height: 1.4; color: #636e72;">
                    ${company.address || 'Abidjan, Côte d\'Ivoire'}<br>
                    Téléphone: ${company.phone || '+225 27 20 00 00 00'}<br>
                    Email: ${company.email || 'rh@gebat-sa.com'}<br>
                    <strong>N° CC:</strong> ${company.cc || '2401234 A'}<br>
                    <strong>N° RC:</strong> ${company.rc || 'CI-ABJ-03-2024-B12-12345'}<br>
                    <strong>N° CNPS Emp:</strong> ${company.cnps_employer || '12345678'}
                  </p>
                </td>
                <td style="width: 35%; vertical-align: top;">
                  <h4 style="margin: 0 0 5px 0; text-transform: uppercase; font-weight: bold; color: #F77F00;">Salarié</h4>
                  <p style="margin: 0; font-size: 11px; line-height: 1.4;">
                    <strong>Matricule:</strong> ${emp.matricule}<br>
                    <strong>Nom & Prénoms:</strong> ${emp.nom} ${emp.prenoms}<br>
                    <strong>Fonction:</strong> ${emp.poste}<br>
                    <strong>Département:</strong> ${emp.departement}<br>
                    <strong>Date d'embauche:</strong> ${emp.dateEmbauche || '-'}<br>
                    <strong>N° CNPS:</strong> ${emp.cnps || '-'}<br>
                    <strong>Situation familiale:</strong> ${emp.situationMatrimoniale || 'Célibataire'} • ${emp.nbEnfants || 0} enfant(s)<br>
                    <strong>Parts fiscales:</strong> ${payslipDetails.parts} part(s)
                  </p>
                </td>
              </tr>
            </table>

            <div class="title">
              Bulletin de Paie - ${selectedMonth}
            </div>

            <table class="rubriques-table">
              <thead>
                <tr>
                  <th style="width: 45%;">Désignation Rubrique</th>
                  <th style="width: 15%; text-align: right;">Base</th>
                  <th style="width: 10%; text-align: right;">Taux %</th>
                  <th style="width: 15%; text-align: right;">Gains (FCFA)</th>
                  <th style="width: 15%; text-align: right;">Retenues (FCFA)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Salaire de base</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.base)}</td>
                  <td class="num">100%</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.base)}</td>
                  <td class="num"></td>
                </tr>
                ${payslipDetails.primeAnc > 0 ? `
                <tr>
                  <td>Prime d'ancienneté (${payslipDetails.seniorityYears} ans)</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.base)}</td>
                  <td class="num">${payslipDetails.seniorityYears}%</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.primeAnc)}</td>
                  <td class="num"></td>
                </tr>` : ''}
                <tr>
                  <td>Indemnité de logement (15%)</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.base)}</td>
                  <td class="num">15%</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.logement)}</td>
                  <td class="num"></td>
                </tr>
                <tr>
                  <td>Indemnité de transport (Obligatoire)</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.transport)}</td>
                  <td class="num">-</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.transport)}</td>
                  <td class="num"></td>
                </tr>
                ${payslipDetails.risque > 0 ? `
                <tr>
                  <td>Indemnité de risque</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.risque)}</td>
                  <td class="num">-</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.risque)}</td>
                  <td class="num"></td>
                </tr>` : ''}
                
                <tr>
                  <td>Cotisation CNPS Salariale (6.3%)</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsBase)}</td>
                  <td class="num">6.3%</td>
                  <td class="num"></td>
                  <td class="num" style="color: #d63031;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsSalarial)}</td>
                </tr>
                <tr>
                  <td>Impôt unique traitements & salaires (ITS) 2024</td>
                  <td class="num">${new Intl.NumberFormat('fr-FR').format(payslipDetails.brutImposable)}</td>
                  <td class="num">Progressif</td>
                  <td class="num"></td>
                  <td class="num" style="color: #d63031;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.itsNet)}</td>
                </tr>
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td style="width: 50%; text-align: left;">CUMULS MENSUELS</td>
                <td style="width: 25%; text-align: right;">TOTAL GAINS</td>
                <td style="width: 25%; text-align: right;">TOTAL RETENUES</td>
              </tr>
              <tr>
                <td style="font-weight: normal; font-size: 11px; color: #636e72;">
                  Assiette ITS: ${new Intl.NumberFormat('fr-FR').format(payslipDetails.brutImposable)} FCFA<br>
                  Réduction impôt RICF: ${new Intl.NumberFormat('fr-FR').format(payslipDetails.ricf)} FCFA (pour ${payslipDetails.parts} part(s))
                </td>
                <td style="text-align: right; font-size: 14px;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.brutTotal)}</td>
                <td style="text-align: right; font-size: 14px; color: #d63031;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsSalarial + payslipDetails.itsNet)}</td>
              </tr>
            </table>

            <div class="net-box">
              Net à payer : ${new Intl.NumberFormat('fr-FR').format(payslipDetails.netAPayer)} FCFA
            </div>

            <div class="patronal-box">
              <h4>Détail des Charges Sociales Patronales (CNPS)</h4>
              <table class="patronal-table">
                <tr>
                  <td>Retraite part patronale (7.70% base max 1.2M) :</td>
                  <td style="text-align: right; font-weight: bold;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsPatronalDetails.retraite)} FCFA</td>
                </tr>
                <tr>
                  <td>Prestations familiales (5.75% base max 70k) :</td>
                  <td style="text-align: right; font-weight: bold;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsPatronalDetails.prestationsFamiliales)} FCFA</td>
                </tr>
                <tr>
                  <td>Accidents du travail (3.00% base max 70k) :</td>
                  <td style="text-align: right; font-weight: bold;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsPatronalDetails.accidentTravail)} FCFA</td>
                </tr>
                <tr style="border-top: 1px solid #dfe6e9;">
                  <td style="font-weight: bold; padding-top: 4px;">Total des charges patronales CNPS :</td>
                  <td style="text-align: right; font-weight: bold; padding-top: 4px;">${new Intl.NumberFormat('fr-FR').format(payslipDetails.cnpsPatronal)} FCFA</td>
                </tr>
              </table>
            </div>

            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid #dfe6e9; padding-bottom: 5px;">
              Paiement effectué par Virement Bancaire
            </div>

            <div class="footer-signatures">
              <div class="signature-block">
                <div class="signature-title">Signature du Salarié</div>
                <div style="font-size: 10px; color: #b2bec3; margin-top: 40px;">(Précédée de la mention "Lu et approuvé")</div>
              </div>
              <div class="signature-block">
                <div class="signature-title">L'Employeur (Cachet & Signature)</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const detailedPaie = calculateDetailedPaie(employee);

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveForm.debut) {
      alert('Veuillez choisir une date de début');
      return;
    }
    setLeaveSubmitting(true);
    try {
      const duree = calculateRealLeaveDays(leaveForm.debut, leaveForm.fin || leaveForm.debut);
      await axios.post('/api/leaves', {
        empId: employee.id,
        type: leaveForm.type,
        debut: leaveForm.debut,
        fin: leaveForm.fin || leaveForm.debut,
        duree,
        statut: 'En attente',
        motif: leaveForm.motif || 'Demande via portail collaborateur'
      });
      await refreshData();
      alert('Votre demande de congé a été transmise à la RH.');
      setLeaveForm({ type: 'Congé annuel', debut: '', fin: '', motif: '' });
    } catch {
      alert('Erreur lors de l\'envoi de la demande');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setPasswordSubmitting(true);
    try {
      await axios.patch(`/api/users/${user.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert('Mot de passe mis à jour avec succès');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleDownloadLeaveDocument = (leave) => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attestation de Congé - ${employee?.nom} ${employee?.prenoms}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #2d3436;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
            }
            .document {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #2d3436;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2d3436;
            }
            .company-name {
              font-size: 24px;
              font-weight: 900;
              color: #009E49;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .company-details {
              font-size: 12px;
              color: #636e72;
              margin-top: 10px;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 30px 0;
              color: #2d3436;
              background-color: #f1f2f6;
              padding: 15px;
              border: 2px solid #2d3436;
            }
            .employee-info {
              background-color: #f9f9f9;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #009E49;
            }
            .employee-info p {
              margin: 8px 0;
              font-size: 14px;
            }
            .employee-info strong {
              color: #009E49;
            }
            .leave-details {
              margin: 30px 0;
            }
            .leave-details p {
              margin: 12px 0;
              font-size: 14px;
            }
            .leave-details strong {
              color: #F77F00;
            }
            .status-box {
              background-color: #E8F5E9;
              border: 2px solid #009E49;
              padding: 15px;
              text-align: center;
              font-size: 16px;
              font-weight: 900;
              color: #007A38;
              text-transform: uppercase;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dfe6e9;
              text-align: center;
              font-size: 12px;
              color: #636e72;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-block {
              width: 45%;
              border: 1px solid #dfe6e9;
              padding: 20px;
              text-align: center;
              min-height: 120px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
              .document {
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end;">
            <button onclick="window.print();" style="background-color: #009E49; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Imprimer / Télécharger en PDF</button>
          </div>
          <div class="document">
            <div class="header" style="display: flex; align-items: center; justify-content: space-between; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 15px;">
                <div style="background: #ffffff; padding: 4px 8px; border-radius: 10px; border: 1px solid #e2e8f0; display: inline-block;">
                  <img src="${company.logo || '/gebat_logo.png'}" alt="GEBAT Logo" style="max-height: 50px; max-width: 100px; object-fit: contain;" />
                </div>
                <div>
                  <div class="company-name" style="color: #2563EB; font-weight: 900; font-size: 16px;">${company.companyName || 'GEBAT SA'}</div>
                  <div class="company-details" style="font-size: 11px; color: #64748b;">
                    ${company.address || 'Abidjan, Côte d\'Ivoire'} | Tél: ${company.phone || '+225 27 20 00 00 00'}
                  </div>
                </div>
              </div>
            </div>

            <div class="title">ATTESTATION DE CONGÉ</div>

            <div class="employee-info">
              <p><strong>Employé:</strong> ${employee?.nom} ${employee?.prenoms}</p>
              <p><strong>Matricule:</strong> ${employee?.matricule}</p>
              <p><strong>Poste:</strong> ${employee?.poste}</p>
              <p><strong>Département:</strong> ${employee?.departement}</p>
            </div>

            <div class="leave-details">
              <p><strong>Type de congé:</strong> ${leave.type}</p>
              <p><strong>Date de début:</strong> ${new Date(leave.debut).toLocaleDateString('fr-FR')}</p>
              <p><strong>Date de fin:</strong> ${new Date(leave.fin).toLocaleDateString('fr-FR')}</p>
              <p><strong>Durée:</strong> ${leave.duree} jour(s)</p>
              <p><strong>Motif:</strong> ${leave.motif || 'Non spécifié'}</p>
            </div>

            <div class="status-box">
              STATUT: ${leave.statut}
            </div>

            <div class="footer">
              <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
              <p>Ce document certifie que la demande de congé a été enregistrée dans le système SIRH</p>
            </div>

            <div class="signature-section">
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature de l'employé</p>
                <p style="font-size: 10px; color: #b2bec3;">(Précédé de la mention "Lu et approuvé")</p>
              </div>
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature RH</p>
                <p style="font-size: 10px; color: #b2bec3;">(Cachet & Signature)</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadWorkCertificate = () => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attestation de Travail - ${employee?.nom} ${employee?.prenoms}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #2d3436;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
            }
            .document {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #009E49;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #009E49;
            }
            .company-name {
              font-size: 24px;
              font-weight: 900;
              color: #009E49;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 30px 0;
              color: #009E49;
              background-color: #E8F5E9;
              padding: 15px;
              border: 2px solid #009E49;
            }
            .content {
              line-height: 1.8;
              margin: 30px 0;
              text-align: justify;
            }
            .employee-info {
              background-color: #f9f9f9;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #009E49;
            }
            .employee-info p {
              margin: 8px 0;
              font-size: 14px;
            }
            .employee-info strong {
              color: #009E49;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dfe6e9;
              text-align: center;
              font-size: 12px;
              color: #636e72;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-block {
              width: 45%;
              border: 1px solid #dfe6e9;
              padding: 20px;
              text-align: center;
              min-height: 120px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end;">
            <button onclick="window.print();" style="background-color: #009E49; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Imprimer / Télécharger en PDF</button>
          </div>
          <div class="document">
            <div class="header">
              <div class="company-name">${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</div>
              <div class="company-details">
                ${company.address || 'Abidjan, Côte d\'Ivoire'}<br>
                Téléphone: ${company.phone || '+225 27 20 00 00 00'}<br>
                Email: ${company.email || 'contact@entreprise.ci'}
              </div>
            </div>
            <div class="title">ATTESTATION DE TRAVAIL</div>
            <div class="content">
              <p>Je soussigné, ${company.companyName || 'le représentant légal'}, certifie par la présente que <strong>${employee?.nom} ${employee?.prenoms}</strong>, matricule <strong>${employee?.matricule}</strong>, est employé(e) dans notre entreprise.</p>
              <div class="employee-info">
                <p><strong>Nom & Prénoms:</strong> ${employee?.nom} ${employee?.prenoms}</p>
                <p><strong>Matricule:</strong> ${employee?.matricule}</p>
                <p><strong>Poste:</strong> ${employee?.poste}</p>
                <p><strong>Département:</strong> ${employee?.departement}</p>
                <p><strong>Date d'embauche:</strong> ${employee?.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : '-'}</p>
                <p><strong>Situation:</strong> ${employee?.statut}</p>
                <p><strong>Type de contrat:</strong> ${employee?.type}</p>
              </div>
              <p>Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.</p>
            </div>
            <div class="footer">
              <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <div class="signature-section">
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature de l'employé</p>
              </div>
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature RH</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadInternshipCertificate = () => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attestation de Stage - ${employee?.nom} ${employee?.prenoms}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #2d3436;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
            }
            .document {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #F77F00;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #F77F00;
            }
            .company-name {
              font-size: 24px;
              font-weight: 900;
              color: #F77F00;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 30px 0;
              color: #F77F00;
              background-color: #FFF3E0;
              padding: 15px;
              border: 2px solid #F77F00;
            }
            .content {
              line-height: 1.8;
              margin: 30px 0;
              text-align: justify;
            }
            .employee-info {
              background-color: #f9f9f9;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #F77F00;
            }
            .employee-info p {
              margin: 8px 0;
              font-size: 14px;
            }
            .employee-info strong {
              color: #F77F00;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dfe6e9;
              text-align: center;
              font-size: 12px;
              color: #636e72;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-block {
              width: 45%;
              border: 1px solid #dfe6e9;
              padding: 20px;
              text-align: center;
              min-height: 120px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end;">
            <button onclick="window.print();" style="background-color: #F77F00; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Imprimer / Télécharger en PDF</button>
          </div>
          <div class="document">
            <div class="header">
              <div class="company-name">${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</div>
              <div class="company-details">
                ${company.address || 'Abidjan, Côte d\'Ivoire'}<br>
                Téléphone: ${company.phone || '+225 27 20 00 00 00'}<br>
                Email: ${company.email || 'contact@entreprise.ci'}
              </div>
            </div>
            <div class="title">ATTESTATION DE STAGE</div>
            <div class="content">
              <p>Je soussigné, ${company.companyName || 'le représentant légal'}, atteste par la présente que <strong>${employee?.nom} ${employee?.prenoms}</strong> a effectué un stage au sein de notre entreprise.</p>
              <div class="employee-info">
                <p><strong>Nom & Prénoms:</strong> ${employee?.nom} ${employee?.prenoms}</p>
                <p><strong>Poste:</strong> ${employee?.poste}</p>
                <p><strong>Département:</strong> ${employee?.departement}</p>
                <p><strong>Date de début:</strong> ${employee?.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : '-'}</p>
              </div>
              <p>Le stagiaire a fait preuve de sérieux et de professionnalisme durant son stage. Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.</p>
            </div>
            <div class="footer">
              <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <div class="signature-section">
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature du stagiaire</p>
              </div>
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature RH</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSalaryCertificate = () => {
    const company = data?.settings || {};
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Attestation de Salaire - ${employee?.nom} ${employee?.prenoms}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #2d3436;
              margin: 0;
              padding: 40px;
              background-color: #ffffff;
            }
            .document {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #2d3436;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #2d3436;
            }
            .company-name {
              font-size: 24px;
              font-weight: 900;
              color: #2d3436;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .title {
              text-align: center;
              font-size: 20px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin: 30px 0;
              color: #2d3436;
              background-color: #f1f2f6;
              padding: 15px;
              border: 2px solid #2d3436;
            }
            .content {
              line-height: 1.8;
              margin: 30px 0;
              text-align: justify;
            }
            .salary-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .salary-table th {
              background-color: #2d3436;
              color: white;
              padding: 12px;
              text-align: left;
            }
            .salary-table td {
              border: 1px solid #dfe6e9;
              padding: 12px;
            }
            .employee-info {
              background-color: #f9f9f9;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #2d3436;
            }
            .employee-info p {
              margin: 8px 0;
              font-size: 14px;
            }
            .employee-info strong {
              color: #2d3436;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dfe6e9;
              text-align: center;
              font-size: 12px;
              color: #636e72;
            }
            .signature-section {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
            }
            .signature-block {
              width: 45%;
              border: 1px solid #dfe6e9;
              padding: 20px;
              text-align: center;
              min-height: 120px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="max-width: 800px; margin: 0 auto 20px auto; display: flex; justify-content: flex-end;">
            <button onclick="window.print();" style="background-color: #2d3436; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">Imprimer / Télécharger en PDF</button>
          </div>
          <div class="document">
            <div class="header">
              <div class="company-name">${company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</div>
              <div class="company-details">
                ${company.address || 'Abidjan, Côte d\'Ivoire'}<br>
                Téléphone: ${company.phone || '+225 27 20 00 00 00'}<br>
                Email: ${company.email || 'contact@entreprise.ci'}
              </div>
            </div>
            <div class="title">ATTESTATION DE SALAIRE</div>
            <div class="content">
              <p>Je soussigné, ${company.companyName || 'le représentant légal'}, certifie certifie par la présente que <strong>${employee?.nom} ${employee?.prenoms}</strong>, matricule <strong>${employee?.matricule}</strong>, perçoit les rémunérations suivantes au sein de notre entreprise.</p>
              <div class="employee-info">
                <p><strong>Nom & Prénoms:</strong> ${employee?.nom} ${employee?.prenoms}</p>
                <p><strong>Matricule:</strong> ${employee?.matricule}</p>
                <p><strong>Poste:</strong> ${employee?.poste}</p>
                <p><strong>Département:</strong> ${employee?.departement}</p>
                <p><strong>Date d'embauche:</strong> ${employee?.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : '-'}</p>
              </div>
              <table class="salary-table">
                <thead>
                  <tr>
                    <th>Élément</th>
                    <th>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Salaire de base mensuel</td>
                    <td>${new Intl.NumberFormat('fr-FR').format(employee?.salaireBase || 0)} FCFA</td>
                  </tr>
                  <tr>
                    <td>Salaire de base annuel</td>
                    <td>${new Intl.NumberFormat('fr-FR').format((employee?.salaireBase || 0) * 12)} FCFA</td>
                  </tr>
                  <tr>
                    <td>Mode de paiement</td>
                    <td>Virement bancaire (RIB: ${employee?.rib || 'à fournir'})</td>
                  </tr>
                </tbody>
              </table>
              <p>Cette attestation est délivrée à la demande de l'intéressé(e) pour servir et valoir ce que de droit.</p>
            </div>
            <div class="footer">
              <p>Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            </div>
            <div class="signature-section">
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature de l'employé</p>
              </div>
              <div class="signature-block">
                <p style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #636e72; margin-bottom: 40px;">Signature RH</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      {/* Portal Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-ci-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-ci rounded-xl flex items-center justify-center">
                    <LayoutGrid className="text-white" size={20} />
                </div>
                <div>
                    <h1 className="font-black text-ci-text text-sm uppercase tracking-widest">Espace Collaborateur</h1>
                    <p className="text-[9px] font-bold text-ci-green uppercase tracking-widest mt-0.5">SIRH CI Self-Service</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <button className="relative p-2 text-ci-muted hover:text-ci-text transition-colors">
                    <Bell size={20} />
                    {pendingRequests > 0 && <span className="absolute top-2 right-2 w-5 h-5 bg-ci-orange rounded-full text-white text-[9px] font-black flex items-center justify-center">{pendingRequests}</span>}
                </button>
                <button onClick={logout} className="flex items-center gap-2 px-5 py-2 bg-red-50 text-ci-danger text-[10px] font-black rounded-full hover:bg-red-100 transition-all uppercase tracking-widest">
                    Déconnexion <LogOut size={14} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
            
            {/* Sidebar User Info */}
            <aside className="lg:col-span-3 space-y-4 sm:space-y-8">
                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-ci-border text-center overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-ci opacity-5 group-hover:opacity-10 transition-opacity"></div>
                    <EmployeeAvatar
                        src={employee?.photo}
                        nom={employee?.nom}
                        prenoms={employee?.prenoms}
                        matricule={employee?.matricule}
                        size="2xl"
                        className="mx-auto mb-4 sm:mb-6 shadow-xl border-4 border-white relative z-10"
                    />
                    <h2 className="text-xl sm:text-2xl font-black text-ci-text tracking-tighter leading-tight">{employee?.nom} {employee?.prenoms}</h2>
                    <p className="text-[10px] font-black text-ci-muted uppercase tracking-[0.2em] mt-1 sm:mt-2">{employee?.poste}</p>
                    <div className="mt-4 sm:mt-6 flex justify-center gap-2">
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-ci-greenLight text-ci-green text-[9px] font-black rounded-full border border-ci-green/20 uppercase tracking-widest">Actif</span>
                        <span className="px-3 sm:px-4 py-1 sm:py-1.5 bg-ci-bg text-ci-text text-[9px] font-black rounded-full border border-ci-border uppercase tracking-widest">{employee?.matricule}</span>
                    </div>
                </div>

                <nav className="bg-white rounded-3xl sm:rounded-[2.5rem] p-2 sm:p-4 shadow-xl border border-ci-border flex lg:flex-col gap-1.5 overflow-x-auto max-w-full custom-scrollbar">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={17} /> },
                        { id: 'leaves', label: 'Mes Congés', icon: <Palmtree size={17} /> },
                        { id: 'payroll', label: 'Ma Paie', icon: <FileText size={17} /> },
                        { id: 'advances', label: 'Mes Avances', icon: <DollarSign size={17} /> },
                        { id: 'certificates', label: 'Attestations', icon: <Printer size={17} /> },
                        { id: 'settings', label: 'Mon Profil', icon: <Settings size={17} /> },
                    ].map(tab => (
                        <button 
                            key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 lg:w-full ${
                                activeTab === tab.id ? 'bg-ci-green text-white shadow-lg shadow-ci-green/20' : 'text-ci-text hover:bg-ci-bg'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Portal Content */}
            <div className="lg:col-span-9 space-y-6 sm:space-y-8 animate-fadeIn">
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Welcome Section */}
                        <div className="bg-gradient-ci rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black tracking-tighter mb-2">{getGreeting()}, {employee?.prenoms || 'Collaborateur'} 👋</h2>
                                <p className="text-sm font-bold opacity-80">Bienvenue sur votre espace personnel. Voici un aperçu de vos activités.</p>
                                <div className="mt-6 flex flex-wrap gap-4">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Ancienneté</p>
                                        <p className="text-lg font-black">{seniorityYears} an(s)</p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Département</p>
                                        <p className="text-lg font-black">{employee?.departement}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-ci-text p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                                <Palmtree className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Solde Congés</p>
                                <h3 className="text-6xl font-black mt-4 tracking-tighter">{leaveBalance}</h3>
                                <p className="text-xs font-bold mt-4 flex items-center gap-2"><CheckCircle2 className="text-ci-green" size={16} /> Jours sur {annualLeaveAllowance} acquis</p>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-ci-border">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ci-muted">Dernier Salaire Net</p>
                                <h3 className="text-4xl font-black text-ci-text mt-4 tracking-tighter font-mono">{new Intl.NumberFormat('fr-FR').format(detailedPaie.netAPayer)} F</h3>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-ci-green uppercase tracking-widest bg-ci-greenLight px-3 py-1 rounded-full">Payé le 05/06</span>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-ci-border">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ci-muted">Assiduité</p>
                                <h3 className="text-4xl font-black text-ci-text mt-4 tracking-tighter">{attendanceRate}%</h3>
                                <div className="mt-6 h-2 bg-ci-bg rounded-full overflow-hidden">
                                    <div className="h-full bg-ci-orange rounded-full shadow-[0_0_8px_rgba(247,127,0,0.5)]" style={{ width: `${attendanceRate}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-ci-border">
                            <h4 className="text-xs font-black text-ci-text uppercase tracking-[0.3em] mb-8">Activités Récentes</h4>
                            <div className="space-y-4">
                                {myLeaves.slice(-3).reverse().map(l => (
                                    <div key={l.id} className="flex items-center justify-between p-5 bg-ci-bg rounded-[2rem] border border-ci-border">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-ci-orange shadow-sm"><Calendar size={20} /></div>
                                            <div>
                                                <p className="text-sm font-bold text-ci-text">Demande de {l.type}</p>
                                                <p className="text-[10px] font-bold text-ci-muted uppercase">{l.duree} jours - Du {new Date(l.debut).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                l.statut === 'Approuvé' ? 'bg-ci-greenLight text-ci-green' : 'bg-ci-orangeLight text-ci-orange'
                                            }`}>{l.statut}</span>
                                            {l.statut === 'Approuvé' && (
                                                <button
                                                    onClick={() => handleDownloadLeaveDocument(l)}
                                                    className="p-2.5 bg-ci-green text-white rounded-xl hover:bg-green-600 transition-all"
                                                    title="Télécharger l'attestation"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {myLeaves.length === 0 && <p className="text-center py-6 text-ci-muted font-bold italic">Aucune demande enregistrée.</p>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div className="space-y-8">
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-ci-border">
                            <h3 className="text-3xl font-black text-ci-text tracking-tighter mb-10 uppercase">Demander un congé</h3>
                            <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Type de Congé</label>
                                    <select
                                      value={leaveForm.type}
                                      onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                                      className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none"
                                    >
                                        <option>Congé annuel</option>
                                        <option>Congé maladie</option>
                                        <option>Permission exceptionnelle</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Date de début</label>
                                    <input
                                      type="date"
                                      required
                                      value={leaveForm.debut}
                                      onChange={(e) => setLeaveForm({ ...leaveForm, debut: e.target.value })}
                                      className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Date de fin (optionnel)</label>
                                    <input
                                      type="date"
                                      value={leaveForm.fin}
                                      onChange={(e) => setLeaveForm({ ...leaveForm, fin: e.target.value })}
                                      className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Motif</label>
                                    <input
                                      type="text"
                                      value={leaveForm.motif}
                                      onChange={(e) => setLeaveForm({ ...leaveForm, motif: e.target.value })}
                                      placeholder="Raison de la demande..."
                                      className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <button
                                      type="submit"
                                      disabled={leaveSubmitting}
                                      className="w-full py-5 bg-ci-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {leaveSubmitting ? 'Envoi...' : <>Envoyer la demande <ChevronRight size={18} /></>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8">
                        {/* Profile Information Card */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-ci-border">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-ci-text tracking-tighter uppercase">Mon Profil</h3>
                                    <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mt-1">Informations personnelles et professionnelles</p>
                                </div>
                                <div className="w-12 h-12 bg-ci-greenLight text-ci-green rounded-2xl flex items-center justify-center"><User size={24} /></div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-ci-green uppercase tracking-widest border-b border-ci-border pb-3">Informations Personnelles</h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><User size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Nom & Prénoms</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.nom} {employee?.prenoms}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><Mail size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Email</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.email || user?.email}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><Phone size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Téléphone</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.telephone || '-'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><Briefcase size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">RIB Bancaire</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.rib || 'Non renseigné'}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><Shield size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Situation Matrimoniale</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.situationMatrimoniale || 'Célibataire'} • {employee?.nbEnfants || 0} enfant(s)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Information */}
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black text-ci-orange uppercase tracking-widest border-b border-ci-border pb-3">Informations Professionnelles</h4>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><Briefcase size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Poste</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.poste}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><MapPin size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Département</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.departement}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><MapPin size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Site</p>
                                                <p className="text-sm font-black text-ci-text mt-1 capitalize">{employee?.site}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-ci-bg rounded-xl flex items-center justify-center text-ci-muted flex-shrink-0"><CalendarIcon size={18} /></div>
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Date d'embauche</p>
                                                <p className="text-sm font-black text-ci-text mt-1">{employee?.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Details */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-ci-bg rounded-2xl p-6 text-center">
                                    <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Matricule</p>
                                    <p className="text-lg font-black text-ci-text mt-2">{employee?.matricule}</p>
                                </div>
                                <div className="bg-ci-bg rounded-2xl p-6 text-center">
                                    <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Type de contrat</p>
                                    <p className="text-lg font-black text-ci-text mt-2">{employee?.type}</p>
                                </div>
                                <div className="bg-ci-bg rounded-2xl p-6 text-center">
                                    <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Statut</p>
                                    <p className="text-lg font-black text-ci-green mt-2">{employee?.statut}</p>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-ci-bg rounded-2xl p-6">
                                    <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">N° CNPS</p>
                                    <p className="text-lg font-black text-ci-text mt-2">{employee?.cnps || '-'}</p>
                                </div>
                                <div className="bg-ci-bg rounded-2xl p-6">
                                    <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">Salaire de base</p>
                                    <p className="text-lg font-black text-ci-text mt-2">{new Intl.NumberFormat('fr-FR').format(employee?.salaireBase || 0)} FCFA</p>
                                </div>
                                <div className="bg-ci-bg rounded-2xl p-6">
                                    <p className="text-[9px] font-bold text-ci-muted uppercase tracking-widest">RIB Bancaire</p>
                                    <p className="text-sm font-black text-ci-text mt-2">{employee?.rib || 'Non renseigné'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Password Change Card */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-ci-border">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-ci-text tracking-tighter uppercase">Changer mon mot de passe</h3>
                                    <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mt-1">Sécurité du compte</p>
                                </div>
                                <div className="w-12 h-12 bg-ci-orangeLight text-ci-orange rounded-2xl flex items-center justify-center"><Lock size={24} /></div>
                            </div>

                            <form onSubmit={handlePasswordChange} className="max-w-2xl space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Mot de passe actuel</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none pr-12"
                                            placeholder="Entrez votre mot de passe actuel"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-ci-muted hover:text-ci-text"
                                        >
                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            value={passwordForm.newPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                            className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none pr-12"
                                            placeholder="Entrez votre nouveau mot de passe (min. 6 caractères)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-ci-muted hover:text-ci-text"
                                        >
                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-ci-text uppercase tracking-widest ml-1">Confirmer le nouveau mot de passe</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            value={passwordForm.confirmPassword}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                            className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-ci-orange/10 outline-none pr-12"
                                            placeholder="Confirmez votre nouveau mot de passe"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-ci-muted hover:text-ci-text"
                                        >
                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={passwordSubmitting}
                                    className="w-full py-5 bg-ci-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {passwordSubmitting ? 'Mise à jour...' : <>Mettre à jour le mot de passe <Save size={18} /></>}
                                </button>
                            </form>
                        </div>

                        {/* Certificates Section */}
                        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-ci-border">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-2xl font-black text-ci-text tracking-tighter uppercase">Mes Attestations</h3>
                                    <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mt-1">Télécharger vos documents officiels</p>
                                </div>
                                <div className="w-12 h-12 bg-ci-greenLight text-ci-green rounded-2xl flex items-center justify-center"><Download size={24} /></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {employee?.attestationTravail === 1 && (
                                    <button
                                        onClick={handleDownloadWorkCertificate}
                                        className="p-6 bg-ci-bg rounded-[2rem] border border-ci-border hover:border-ci-green hover:bg-ci-greenLight transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-ci-green text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Briefcase size={24} />
                                        </div>
                                        <p className="text-sm font-black text-ci-text mb-1">Attestation de Travail</p>
                                        <p className="text-[10px] font-bold text-ci-muted">Certifie votre emploi actuel</p>
                                    </button>
                                )}

                                {employee?.attestationStage === 1 && (
                                    <button
                                        onClick={handleDownloadInternshipCertificate}
                                        className="p-6 bg-ci-bg rounded-[2rem] border border-ci-border hover:border-ci-orange hover:bg-ci-orangeLight transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-ci-orange text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <GraduationCap size={24} />
                                        </div>
                                        <p className="text-sm font-black text-ci-text mb-1">Attestation de Stage</p>
                                        <p className="text-[10px] font-bold text-ci-muted">Pour stagiaires</p>
                                    </button>
                                )}

                                {employee?.attestationSalaire === 1 && (
                                    <button
                                        onClick={handleDownloadSalaryCertificate}
                                        className="p-6 bg-ci-bg rounded-[2rem] border border-ci-border hover:border-ci-sidebar hover:bg-ci-sidebar/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-ci-sidebar text-white rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <FileText size={24} />
                                        </div>
                                        <p className="text-sm font-black text-ci-text mb-1">Attestation de Salaire</p>
                                        <p className="text-[10px] font-bold text-ci-muted">Pour démarches bancaires</p>
                                    </button>
                                )}

                                {employee?.attestationTravail !== 1 && employee?.attestationStage !== 1 && employee?.attestationSalaire !== 1 && (
                                    <div className="col-span-3 text-center py-8">
                                        <p className="text-ci-muted font-bold italic">Aucune attestation disponible. Contactez le service RH.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payroll' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-ci-border">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-ci-text tracking-tighter uppercase">Mes Bulletins de Paie</h3>
                                <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mt-1">Consultez et téléchargez vos fiches de paie</p>
                            </div>
                            <div className="w-12 h-12 bg-ci-greenLight text-ci-green rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
                        </div>
                        
                        <div className="overflow-hidden border border-ci-border rounded-[2rem]">
                            <table className="w-full">
                                <thead className="bg-ci-bg/50 text-[9px] font-black uppercase tracking-widest text-ci-muted border-b border-ci-border">
                                    <tr>
                                        <th className="px-8 py-5 text-left">Période</th>
                                        <th className="px-8 py-5 text-right">Salaire Brut</th>
                                        <th className="px-8 py-5 text-right">Retenues (ITS + CNPS)</th>
                                        <th className="px-8 py-5 text-right">Salaire Net</th>
                                        <th className="px-8 py-5 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ci-bg text-sm">
                                    <tr className="hover:bg-ci-bg/20 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-ci-text">{selectedMonth}</p>
                                            <p className="text-[9px] font-bold text-ci-muted mt-0.5 uppercase">Virement Bancaire</p>
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono font-bold text-ci-text">{new Intl.NumberFormat('fr-FR').format(detailedPaie.brutTotal)} F</td>
                                        <td className="px-8 py-5 text-right font-mono text-red-500 font-bold">-{new Intl.NumberFormat('fr-FR').format(detailedPaie.cnpsSalarial + detailedPaie.itsNet)} F</td>
                                        <td className="px-8 py-5 text-right">
                                            <span className="bg-ci-greenLight text-ci-green px-4 py-2 rounded-xl font-black font-mono shadow-sm border border-ci-green/10 text-sm">
                                                {new Intl.NumberFormat('fr-FR').format(detailedPaie.netAPayer)} F
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button 
                                                    onClick={() => setSelectedEmpForPayslip(employee)}
                                                    title="Visualiser le bulletin"
                                                    className="p-2.5 bg-ci-bg text-ci-info rounded-xl hover:bg-ci-info hover:text-white transition-all"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handlePrintPayslip(employee, detailedPaie)}
                                                    title="Imprimer / PDF"
                                                    className="p-2.5 bg-ci-bg text-ci-orange rounded-xl hover:bg-ci-orange hover:text-white transition-all"
                                                >
                                                    <Download size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'advances' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        <div className="md:col-span-5 bg-white rounded-[3rem] p-8 shadow-xl border border-ci-border space-y-6">
                            <h3 className="text-xl font-black text-ci-text uppercase tracking-tight">Demander une Avance</h3>
                            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-ci-muted">Montant Souhaité (FCFA)</label>
                                    <input 
                                        type="number" required placeholder="Ex: 50000"
                                        value={advanceForm.montant}
                                        onChange={e => setAdvanceForm({...advanceForm, montant: e.target.value})}
                                        className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none font-mono"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-ci-muted">Mois de Retenue</label>
                                    <input 
                                        type="text" required
                                        value={advanceForm.moisRemboursement}
                                        onChange={e => setAdvanceForm({...advanceForm, moisRemboursement: e.target.value})}
                                        className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-ci-muted">Motif de la demande</label>
                                    <textarea 
                                        rows="3" placeholder="Scolarité, santé, urgence familiale..."
                                        value={advanceForm.motif}
                                        onChange={e => setAdvanceForm({...advanceForm, motif: e.target.value})}
                                        className="w-full px-6 py-4 bg-ci-bg border-none rounded-2xl text-sm font-medium focus:ring-4 focus:ring-ci-green/10 outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" disabled={advanceSubmitting}
                                    className="w-full py-4 bg-ci-sidebar text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    {advanceSubmitting ? 'Envoi...' : <><Plus size={14}/> Envoyer la Demande</>}
                                </button>
                            </form>
                        </div>

                        <div className="md:col-span-7 bg-white rounded-[3rem] p-8 shadow-xl border border-ci-border space-y-6">
                            <h3 className="text-xl font-black text-ci-text uppercase tracking-tight">Historique des Demandes</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs font-medium">
                                    <thead className="bg-ci-bg text-[10px] font-black uppercase tracking-widest text-ci-muted border-b border-ci-border">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Date</th>
                                            <th className="px-6 py-4 text-right">Montant</th>
                                            <th className="px-6 py-4 text-center">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-ci-bg">
                                        {myAdvances.map(a => (
                                            <tr key={a.id} className="hover:bg-ci-bg/25">
                                                <td className="px-6 py-4">{a.dateDemande || '-'}</td>
                                                <td className="px-6 py-4 text-right font-black font-mono text-slate-800">{new Intl.NumberFormat('fr-FR').format(a.montant)} F</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                                                        a.statut === 'Approuvé' ? 'bg-emerald-100 text-emerald-800' :
                                                        a.statut === 'Refusé' ? 'bg-red-100 text-red-800' :
                                                        a.statut === 'Remboursé' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {a.statut}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {myAdvances.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-6 text-ci-muted uppercase text-[10px] font-bold">Aucune avance demandée</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'certificates' && (
                    <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-ci-border space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-ci-text uppercase tracking-tighter">Mes Attestations Administratives</h3>
                            <p className="text-xs text-ci-muted font-medium mt-1">Générez et imprimez vos attestations pré-approuvées par le service des Ressources Humaines.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            {/* Attestation de travail */}
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-between h-48">
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase">Attestation de Travail</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-2">Prouve votre emploi actuel au sein de l'entreprise.</p>
                                </div>
                                {employee.attestationTravail === 1 ? (
                                    <button 
                                        onClick={() => generateAttestationTravail(employee, data?.settings || {})}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        <Printer size={14}/> Imprimer / PDF
                                    </button>
                                ) : (
                                    <div className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><Lock size={12}/> Non autorisée</div>
                                )}
                            </div>

                            {/* Attestation de stage */}
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-between h-48">
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase">Attestation de Stage / Certificat</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-2">Délivrée aux stagiaires en fin de stage.</p>
                                </div>
                                {employee.attestationStage === 1 ? (
                                    <button 
                                        onClick={() => generateCertificatTravail(employee, data?.settings || {})}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        <Printer size={14}/> Imprimer / PDF
                                    </button>
                                ) : (
                                    <div className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><Lock size={12}/> Non autorisée</div>
                                )}
                            </div>

                            {/* Attestation de Salaire */}
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col justify-between h-48">
                                <div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase">Attestation de Salaire</h4>
                                    <p className="text-[10px] text-slate-500 font-medium mt-2">Détaille votre salaire brut de base et vos indemnités.</p>
                                </div>
                                {employee.attestationSalaire === 1 ? (
                                    <button 
                                        onClick={() => {
                                            const activeAdvances = (data?.advances || []).filter(a => a.empId === employee.id && a.statut === 'Approuvé');
                                            const advanceTotal = activeAdvances.reduce((sum, a) => sum + (a.montant || 0), 0);
                                            generateAttestationSalaire(employee, data?.settings || {}, calculateDetailedPaie(employee, advanceTotal));
                                        }}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        <Printer size={14}/> Imprimer / PDF
                                    </button>
                                ) : (
                                    <div className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><Lock size={12}/> Non autorisée</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-8 animate-fadeIn">
                        
                        {/* Status Messages */}
                        {profileSuccessMsg && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                                <span>{profileSuccessMsg}</span>
                            </div>
                        )}
                        {profileErrorMsg && (
                            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
                                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                                <span>{profileErrorMsg}</span>
                            </div>
                        )}

                        {/* Photo & Identity Banner */}
                        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-xl border border-ci-border">
                            <h3 className="text-xl sm:text-2xl font-black text-ci-text uppercase tracking-tight mb-8 flex items-center gap-3">
                                <User className="text-ci-green" size={24} /> Mon Profil & Identité Professionnelle
                            </h3>

                            <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-ci-border">
                                <div className="relative group">
                                    <EmployeeAvatar
                                        src={employee?.photo}
                                        nom={employee?.nom}
                                        prenoms={employee?.prenoms}
                                        matricule={employee?.matricule}
                                        size="2xl"
                                        className="shadow-2xl border-4 border-ci-greenLight"
                                    />
                                    <label 
                                        className="absolute bottom-0 right-0 p-2.5 bg-ci-green text-white rounded-2xl shadow-lg cursor-pointer hover:bg-ci-greenDark transition-all"
                                        title="Changer ma photo de profil"
                                    >
                                        <Camera size={16} />
                                        <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                                    </label>
                                </div>

                                <div className="text-center sm:text-left flex-1 space-y-2">
                                    <h4 className="text-2xl font-black text-ci-text">{employee?.nom} {employee?.prenoms}</h4>
                                    <p className="text-xs font-bold text-ci-green uppercase tracking-widest">{employee?.poste} • {employee?.departement}</p>
                                    <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                                        <span className="px-3 py-1 bg-ci-bg text-ci-text text-[10px] font-black rounded-full uppercase border border-ci-border">Matricule: {employee?.matricule}</span>
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase border border-emerald-200">Statut: {employee?.statut || 'Actif'}</span>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase border border-blue-200">Contrat: {employee?.type || 'CDI'}</span>
                                    </div>

                                    <div className="pt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                                        <label className="px-4 py-2.5 bg-ci-green text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-ci-greenDark transition-all flex items-center gap-2 shadow-sm">
                                            <UploadCloud size={14} /> {uploadingPhoto ? 'Optimisation...' : 'Changer ma photo'}
                                            <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" disabled={uploadingPhoto} />
                                        </label>
                                        {employee?.photo && (
                                            <button 
                                                onClick={handleRemovePhoto}
                                                disabled={uploadingPhoto}
                                                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-100 transition-all flex items-center gap-2"
                                            >
                                                <Trash2 size={14} /> Supprimer la photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section Édition Coordonnées & Données Personnelles */}
                            <form onSubmit={handleEmployeeProfileSubmit} className="pt-8 space-y-6">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <Phone size={16} className="text-ci-green" /> Mes Coordonnées & Informations Personnelles
                                    </h4>
                                    <span className="text-[10px] font-bold text-slate-400">Directement modifiables par le collaborateur</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {/* Téléphone */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Téléphone Principal</label>
                                        <input
                                            type="tel"
                                            value={employeeProfileForm.telephone}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, telephone: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all"
                                            placeholder="+225 07 00 00 00 00"
                                        />
                                    </div>

                                    {/* Email Professionnel */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Professionnel (Identifiant)</label>
                                        <input
                                            type="email"
                                            value={employeeProfileForm.email}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all"
                                            placeholder="prenom.nom@gebat-sa.ci"
                                        />
                                    </div>

                                    {/* Email Personnel */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Personnel de Secours</label>
                                        <input
                                            type="email"
                                            value={employeeProfileForm.emailPerso}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, emailPerso: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all"
                                            placeholder="personnel@email.com"
                                        />
                                    </div>

                                    {/* Situation Matrimoniale */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Situation Matrimoniale</label>
                                        <select
                                            value={employeeProfileForm.situationMatrimoniale}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, situationMatrimoniale: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all cursor-pointer"
                                        >
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="Marié(e)">Marié(e)</option>
                                            <option value="Divorcé(e)">Divorcé(e)</option>
                                            <option value="Veuf(ve)">Veuf(ve)</option>
                                        </select>
                                    </div>

                                    {/* Nombre d'enfants */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nombre d'enfants à charge</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="15"
                                            value={employeeProfileForm.nbEnfants}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, nbEnfants: parseInt(e.target.value, 10) || 0 })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all"
                                        />
                                    </div>

                                    {/* RIB / Numéro de compte */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">RIB / N° de Compte Bancaire</label>
                                        <input
                                            type="text"
                                            value={employeeProfileForm.rib}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, rib: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all"
                                            placeholder="CI000 00000 00000000000 00"
                                        />
                                    </div>

                                    {/* Adresse de résidence */}
                                    <div className="space-y-1.5 sm:col-span-2 md:col-span-3">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Adresse de Résidence (Quartier, Commune, Ville)</label>
                                        <input
                                            type="text"
                                            value={employeeProfileForm.adresse}
                                            onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, adresse: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-ci-green outline-none transition-all"
                                            placeholder="Ex: Cocody Angré 8ème Tranche, Abidjan"
                                        />
                                    </div>
                                </div>

                                {/* Contact d'urgence */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Shield size={14} className="text-amber-500" /> Personne à Contacter en Cas d'Urgence
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400">Nom & Prénoms</label>
                                            <input
                                                type="text"
                                                value={employeeProfileForm.contactUrgenceNom}
                                                onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, contactUrgenceNom: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                                                placeholder="Ex: Kouamé Aya Marie"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400">Numéro de Téléphone</label>
                                            <input
                                                type="tel"
                                                value={employeeProfileForm.contactUrgenceTelephone}
                                                onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, contactUrgenceTelephone: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                                                placeholder="+225 05 00 00 00 00"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black uppercase text-slate-400">Lien de Parenté</label>
                                            <input
                                                type="text"
                                                value={employeeProfileForm.contactUrgenceLien}
                                                onChange={(e) => setEmployeeProfileForm({ ...employeeProfileForm, contactUrgenceLien: e.target.value })}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                                                placeholder="Ex: Époux / Épouse, Frère, Mère"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-slate-100">
                                    <button
                                        type="submit"
                                        disabled={profileSaving}
                                        className="px-6 py-3.5 bg-ci-green hover:bg-ci-greenDark text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-ci-green/20 disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        <span>{profileSaving ? 'Enregistrement...' : 'Enregistrer mes coordonnées'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Password Update Form */}
                        <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-xl border border-ci-border">
                            <h3 className="text-xl sm:text-2xl font-black text-ci-text uppercase tracking-tight mb-6 flex items-center gap-3">
                                <Lock className="text-amber-500" size={24} /> Sécurité & Mot de Passe Personnel
                            </h3>
                            <form onSubmit={handlePasswordChange} className="max-w-xl space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-ci-muted">Mot de passe actuel</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswords.current ? "text" : "password"} 
                                            required
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                            className="w-full px-6 py-4 bg-ci-bg border border-ci-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none pr-12"
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})} className="absolute right-4 top-1/2 -translate-y-1/2 text-ci-muted hover:text-ci-text">
                                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-ci-muted">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswords.new ? "text" : "password"} 
                                            required minLength={6}
                                            value={passwordForm.newPassword}
                                            onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                            className="w-full px-6 py-4 bg-ci-bg border border-ci-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none pr-12"
                                            placeholder="Au moins 6 caractères"
                                        />
                                        <button type="button" onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})} className="absolute right-4 top-1/2 -translate-y-1/2 text-ci-muted hover:text-ci-text">
                                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-ci-muted">Confirmer le nouveau mot de passe</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswords.confirm ? "text" : "password"} 
                                            required minLength={6}
                                            value={passwordForm.confirmPassword}
                                            onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                            className="w-full px-6 py-4 bg-ci-bg border border-ci-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-ci-green/10 outline-none pr-12"
                                            placeholder="Confirmez à l'identique"
                                        />
                                        <button type="button" onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})} className="absolute right-4 top-1/2 -translate-y-1/2 text-ci-muted hover:text-ci-text">
                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={passwordSubmitting}
                                    className="py-4 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save size={16} /> {passwordSubmitting ? 'Mise à jour...' : 'Enregistrer le nouveau mot de passe'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Payslip Modal Preview */}
      {selectedEmpForPayslip && (() => {
        const emp = selectedEmpForPayslip;
        const paieDetails = calculateDetailedPaie(emp);
        const company = data?.settings || {};
        
        return (
          <div className="fixed inset-0 bg-ci-dark/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl animate-scaleIn p-10 max-h-[95vh] overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex justify-between items-center mb-6 no-print">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase text-ci-text">Mon Bulletin de Paie</h3>
                  <p className="text-[10px] font-bold text-ci-muted uppercase tracking-widest mt-1">Côte d'Ivoire - Conformité DGI & CNPS 2024</p>
                </div>
                <button 
                  onClick={() => setSelectedEmpForPayslip(null)} 
                  className="p-3 bg-ci-bg text-ci-muted rounded-2xl hover:rotate-90 hover:bg-red-50 hover:text-ci-danger transition-all font-black"
                >
                  Fermer
                </button>
              </div>

              {/* Payslip Document Preview */}
              <div className="bg-white border-2 border-ci-text p-8 rounded-3xl shadow-sm text-ci-text font-sans text-xs">
                {/* Header */}
                <div className="grid grid-cols-2 gap-6 border-b border-ci-border pb-6">
                  <div>
                    <h4 className="text-sm font-black uppercase text-ci-green">{company.companyName || 'ENTREPRISE IVOIRIENNE SAS'}</h4>
                    <div className="mt-2 space-y-1 text-ci-muted font-medium text-[11px]">
                      <p>{company.address || 'Abidjan, Côte d\'Ivoire'}</p>
                      <p>Tél: {company.phone || '+225 27 20 00 00 00'} • Email: {company.email || 'contact@entreprise.ci'}</p>
                      <p><strong>N° Compte Contribuable (CC) :</strong> {company.cc || '2401234 A'}</p>
                      <p><strong>N° Registre de Commerce (RC) :</strong> {company.rc || 'CI-ABJ-03-2024-B12-12345'}</p>
                      <p><strong>N° CNPS Employeur :</strong> {company.cnps_employer || '12345678'}</p>
                    </div>
                  </div>
                  <div className="border-l border-ci-border pl-6">
                    <h4 className="text-xs font-black uppercase text-ci-muted tracking-widest">Collaborateur</h4>
                    <div className="mt-2 space-y-1 font-bold text-[11px]">
                      <p className="text-sm uppercase font-black text-ci-sidebar">{emp.nom} {emp.prenoms}</p>
                      <p><span className="text-ci-muted font-normal">Matricule :</span> {emp.matricule}</p>
                      <p><span className="text-ci-muted font-normal">Fonction :</span> {emp.poste}</p>
                      <p><span className="text-ci-muted font-normal">Département :</span> {emp.departement}</p>
                      <p><span className="text-ci-muted font-normal">Date d'embauche :</span> {emp.dateEmbauche || '-'}</p>
                      <p><span className="text-ci-muted font-normal">N° CNPS :</span> {emp.cnps || '-'}</p>
                      <p><span className="text-ci-muted font-normal">RIB Bancaire :</span> {emp.rib || 'Non renseigné'}</p>
                      <p><span className="text-ci-muted font-normal">Famille :</span> {emp.situationMatrimoniale || 'Célibataire'} • {emp.nbEnfants || 0} enfant(s)</p>
                      <p><span className="text-ci-muted font-normal">Quotient familial :</span> {paieDetails.parts} part(s)</p>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="my-6 bg-ci-bg/50 border border-ci-text text-center py-4 rounded-xl">
                  <h3 className="text-base font-black uppercase tracking-wider">BULLETIN DE PAIE - {selectedMonth}</h3>
                </div>

                {/* Rubrics Table */}
                <table className="w-full border-collapse border border-ci-border">
                  <thead>
                    <tr className="bg-ci-sidebar text-white text-[10px] uppercase font-black tracking-wider">
                      <th className="border border-ci-border px-4 py-2.5 text-left">Désignation de la Rubrique</th>
                      <th className="border border-ci-border px-4 py-2.5 text-right">Base</th>
                      <th className="border border-ci-border px-4 py-2.5 text-right">Taux % / Réf</th>
                      <th className="border border-ci-border px-4 py-2.5 text-right">Gains (FCFA)</th>
                      <th className="border border-ci-border px-4 py-2.5 text-right">Retenues (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ci-border font-medium text-[11px]">
                    <tr>
                      <td className="px-4 py-2">Salaire de base</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.base)}</td>
                      <td className="px-4 py-2 text-right">100%</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.base)}</td>
                      <td className="px-4 py-2 text-right font-mono"></td>
                    </tr>
                    {paieDetails.primeAnc > 0 && (
                      <tr>
                        <td className="px-4 py-2">Prime d'ancienneté ({paieDetails.seniorityYears} ans)</td>
                        <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.base)}</td>
                        <td className="px-4 py-2 text-right">{paieDetails.seniorityYears}%</td>
                        <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.primeAnc)}</td>
                        <td className="px-4 py-2 text-right font-mono"></td>
                      </tr>
                    )}
                    <tr>
                      <td className="px-4 py-2">Indemnité de logement (15%)</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.base)}</td>
                      <td className="px-4 py-2 text-right">15%</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.logement)}</td>
                      <td className="px-4 py-2 text-right font-mono"></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Indemnité de transport (Obligatoire)</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.transport)}</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.transport)}</td>
                      <td className="px-4 py-2 text-right font-mono"></td>
                    </tr>
                    {paieDetails.risque > 0 && (
                      <tr>
                        <td className="px-4 py-2">Indemnité de risque</td>
                        <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.risque)}</td>
                        <td className="px-4 py-2 text-right">-</td>
                        <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.risque)}</td>
                        <td className="px-4 py-2 text-right font-mono"></td>
                      </tr>
                    )}
                    {/* Retenues */}
                    <tr className="bg-red-50/30">
                      <td className="px-4 py-2">Cotisation CNPS Salariale (Retraite 6.3%)</td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsBase)}</td>
                      <td className="px-4 py-2 text-right">6.3%</td>
                      <td className="px-4 py-2 text-right font-mono"></td>
                      <td className="px-4 py-2 text-right font-mono text-red-500 font-bold">-{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsSalarial)}</td>
                    </tr>
                    <tr className="bg-red-50/30">
                      <td className="px-4 py-2">
                        Impôt Unique (ITS) 2024
                        <span className="block text-[9px] text-ci-muted mt-0.5 font-normal">
                          ITS Brut: {new Intl.NumberFormat('fr-FR').format(paieDetails.itsBrut)} F | RICF déduite: {new Intl.NumberFormat('fr-FR').format(paieDetails.ricf)} F
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{new Intl.NumberFormat('fr-FR').format(paieDetails.brutImposable)}</td>
                      <td className="px-4 py-2 text-right">Tranches</td>
                      <td className="px-4 py-2 text-right font-mono"></td>
                      <td className="px-4 py-2 text-right font-mono text-red-500 font-bold">-{new Intl.NumberFormat('fr-FR').format(paieDetails.itsNet)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Cumuls and Totals */}
                <div className="grid grid-cols-2 border border-t-0 border-ci-border p-4 bg-ci-bg/25">
                  <div className="text-[10px] text-ci-muted space-y-0.5 font-bold uppercase">
                    <p>Assiette fiscale (Brut imposable) : {new Intl.NumberFormat('fr-FR').format(paieDetails.brutImposable)} FCFA</p>
                    <p>Réduction charges famille (RICF) : {new Intl.NumberFormat('fr-FR').format(paieDetails.ricf)} FCFA</p>
                  </div>
                  <div className="flex justify-end gap-10 font-bold text-[11px]">
                    <div className="text-right">
                      <p className="text-[9px] text-ci-muted uppercase">Total Gains</p>
                      <p className="text-sm font-mono mt-0.5">{new Intl.NumberFormat('fr-FR').format(paieDetails.brutTotal)} F</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-ci-muted uppercase">Total Retenues</p>
                      <p className="text-sm font-mono mt-0.5 text-red-500">{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsSalarial + paieDetails.itsNet)} F</p>
                    </div>
                  </div>
                </div>

                {/* Net Pay Box */}
                <div className="mt-6 bg-ci-greenLight border-2 border-ci-green p-5 rounded-2xl text-center">
                  <span className="text-[10px] font-black uppercase text-ci-green tracking-widest">Net à Verser</span>
                  <h3 className="text-2xl font-black text-ci-greenDark mt-1 tracking-tighter font-mono">
                    {new Intl.NumberFormat('fr-FR').format(paieDetails.netAPayer)} F CFA
                  </h3>
                </div>

                {/* Employer Social Charges Panel */}
                <div className="mt-6 border border-dashed border-ci-border p-4 bg-ci-bg/20 rounded-2xl">
                  <h5 className="text-[9px] font-black text-ci-muted uppercase tracking-widest mb-3">Récapitulatif des Cotisations Patronales (CNPS)</h5>
                  <div className="grid grid-cols-3 gap-4 text-[10px] font-bold">
                    <div>
                      <span className="block text-ci-muted uppercase text-[8px]">Retraite (7.70% base max 1.2M)</span>
                      <span className="font-mono mt-1 block">{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsPatronalDetails.retraite)} F</span>
                    </div>
                    <div>
                      <span className="block text-ci-muted uppercase text-[8px]">Prestations Fam. (5.75% base max 70k)</span>
                      <span className="font-mono mt-1 block">{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsPatronalDetails.prestationsFamiliales)} F</span>
                    </div>
                    <div>
                      <span className="block text-ci-muted uppercase text-[8px]">Accidents Travail (3.00% base max 70k)</span>
                      <span className="font-mono mt-1 block">{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsPatronalDetails.accidentTravail)} F</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dashed border-ci-border flex justify-between items-center text-[10px] font-black uppercase">
                    <span>Total charges patronales CNPS</span>
                    <span className="font-mono text-ci-text">{new Intl.NumberFormat('fr-FR').format(paieDetails.cnpsPatronal)} F</span>
                  </div>
                </div>

                {/* Payment Method */}
                <p className="mt-6 text-[9px] font-black uppercase text-ci-muted tracking-widest border-b border-ci-border pb-2">
                  Mode de règlement : Virement Bancaire
                </p>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-10 mt-6 pt-6">
                  <div className="border border-ci-border p-4 rounded-2xl text-center h-28 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-ci-muted uppercase tracking-widest">Le Salarié (précédé de "Lu et approuvé")</span>
                    <span className="text-[8px] text-gray-300 italic">Signature</span>
                  </div>
                  <div className="border border-ci-border p-4 rounded-2xl text-center h-28 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-ci-muted uppercase tracking-widest">L'Employeur (Cachet & Signature)</span>
                    <span className="text-[8px] text-gray-300 italic">Signature & Cachet</span>
                  </div>
                </div>
              </div>

              {/* Print Action Bar */}
              <div className="mt-8 flex gap-4 no-print">
                <button 
                  onClick={() => setSelectedEmpForPayslip(null)} 
                  className="flex-1 py-4 bg-ci-bg text-ci-text rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Fermer l'aperçu
                </button>
                <button 
                  onClick={() => handlePrintPayslip(emp, paieDetails)}
                  className="flex-1 py-4 bg-ci-orange text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-ci-orange/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Imprimer / Télécharger en PDF
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default EmployeePortal;
