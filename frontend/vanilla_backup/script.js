// ========================================
// SIRH CÔTE D'IVOIRE - Application Data & Logic
// ========================================

// ---------- DATA PERSISTENCE (API) ----------
// Use absolute URL only if on file:// protocol, otherwise use relative path
const API_URL = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';
let isDataLoaded = false;

async function saveToServer() {
    if (!isDataLoaded) return; // Don't save if we haven't loaded yet
    
    try {
        const response = await fetch(`${API_URL}/sirh-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
        console.error('SIRH: Erreur lors de la sauvegarde:', error);
        showToast('Sauvegarde impossible', 'error');
    }
}

function normalizeAppData() {
    ['employees', 'leaves', 'recruitment', 'evaluations', 'contracts', 'attendance', 'trainings', 'documents', 'applications'].forEach(key => {
        if (!Array.isArray(appData[key])) appData[key] = [];
    });
    if (!appData.settings || typeof appData.settings !== 'object') appData.settings = {};
    if (!appData.payroll || typeof appData.payroll !== 'object') appData.payroll = { mois: 'Non défini', statut: 'En préparation' };
}

async function loadFromServer() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const syncStatus = document.getElementById('syncStatus');
    
    if (syncStatus) syncStatus.innerText = 'Sync...';

    try {
        const response = await fetch(`${API_URL}/sirh-data`);
        if (response.ok) {
            const data = await response.json();
            if (data && typeof data === 'object') {
                Object.assign(appData, data);
                normalizeAppData();
                isDataLoaded = true;
                
                if (statusDot) {
                    statusDot.className = 'w-2 h-2 rounded-full bg-ci-green';
                    statusText.innerText = 'Serveur Connecté';
                }
                if (syncStatus) syncStatus.innerText = 'OK';

                if (appData.currentModule) {
                    showModule(appData.currentModule);
                }
            }
        }
    } catch (error) {
        console.error('SIRH: Erreur lors du chargement:', error);
        if (statusDot) {
            statusDot.className = 'w-2 h-2 rounded-full bg-ci-danger';
            statusText.innerText = 'Mode Hors-Ligne';
        }
        if (syncStatus) syncStatus.innerText = 'Erreur';
        isDataLoaded = true;
        showToast('Mode Hors-Ligne', 'info');
    }
}

function saveToLocalStorage() { saveToServer(); }
function loadFromLocalStorage() { loadFromServer(); }

// ---------- DATA STORE ----------
const appData = {
    currentSite: 'all',
    currentModule: 'dashboard',

    settings: {
        companyName: 'ENTREPRISE IVOIRIENNE SAS',
        rc: 'CI-ABJ-03-2024-B12-12345',
        cc: '2401234 A',
        cnps_employer: '12345678',
        address: 'Abidjan, Plateau, Avenue Marchand',
        phone: '+225 27 20 00 00 00',
        email: 'contact@entreprise.ci',
        logo: '',
    },

    employees: [
        { id: 1, matricule: 'EMP-001', nom: 'Kouamé', prenoms: 'Jean-Baptiste', poste: 'Comptable Senior', departement: 'Comptabilité', site: 'abidjan', type: 'CDI', statut: 'Actif', dateEmbauche: '2020-03-15', salaireBase: 450000, sexe: 'M', telephone: '+225 07 08 09 10 11', email: 'jb.kouame@sirh.ci', cnps: 'CNPS-12345', nbEnfants: 2 },
        { id: 2, matricule: 'EMP-002', nom: 'Bamba', prenoms: 'Aïssatou', poste: 'Agent de sécurité', departement: 'Sécurité', site: 'yopougon', type: 'CDI', statut: 'Actif', dateEmbauche: '2021-06-01', salaireBase: 200000, sexe: 'F', telephone: '+225 05 12 34 56', email: 'a.bamba@sirh.ci', cnps: 'CNPS-23456', nbEnfants: 3 },
        { id: 3, matricule: 'EMP-003', nom: 'Diabaté', prenoms: 'Moussa', poste: 'Professeur Mathématiques', departement: 'Pédagogie', site: 'cocody', type: 'CDI', statut: 'Actif', dateEmbauche: '2019-09-01', salaireBase: 380000, sexe: 'M', telephone: '+225 01 23 45 67', email: 'm.diabate@sirh.ci', cnps: 'CNPS-34567', nbEnfants: 1 },
        { id: 4, matricule: 'EMP-004', nom: 'Traoré', prenoms: 'Fatou', poste: 'Responsable RH', departement: 'Ressources Humaines', site: 'abidjan', type: 'CDI', statut: 'Actif', dateEmbauche: '2018-01-10', salaireBase: 550000, sexe: 'F', telephone: '+225 07 98 76 54', email: 'f.traore@sirh.ci', cnps: 'CNPS-45678', nbEnfants: 2 },
        { id: 5, matricule: 'EMP-005', nom: 'Koné', prenoms: 'Ibrahim', poste: 'Chef de chantier', departement: 'BTP', site: 'bouake', type: 'CDD', statut: 'Actif', dateEmbauche: '2023-01-15', salaireBase: 400000, sexe: 'M', telephone: '+225 01 11 22 33', email: 'i.kone@sirh.ci', cnps: 'CNPS-56789', nbEnfants: 4 },
        { id: 6, matricule: 'EMP-006', nom: 'Ouattara', prenoms: 'Adama', poste: 'Agent de sécurité', departement: 'Sécurité', site: 'abidjan', type: 'CDI', statut: 'Actif', dateEmbauche: '2022-02-01', salaireBase: 200000, sexe: 'M', telephone: '+225 05 44 55 66', email: 'a.ouattara@sirh.ci', cnps: 'CNPS-67890', nbEnfants: 0 },
        { id: 7, matricule: 'EMP-007', nom: 'Dago', prenoms: 'Marie-Claire', poste: 'Secrétaire de direction', departement: 'Direction', site: 'cocody', type: 'CDI', statut: 'Actif', dateEmbauche: '2020-11-20', salaireBase: 320000, sexe: 'F', telephone: '+225 07 77 88 99', email: 'mc.dago@sirh.ci', cnps: 'CNPS-78901', nbEnfants: 1 },
        { id: 8, matricule: 'EMP-008', nom: 'Yao', prenoms: 'Serge', poste: 'Manœuvre BTP', departement: 'BTP', site: 'bouake', type: 'CDD', statut: 'Actif', dateEmbauche: '2023-06-01', salaireBase: 150000, sexe: 'M', telephone: '+225 01 33 44 55', email: 's.yao@sirh.ci', cnps: 'CNPS-89012', nbEnfants: 5 },
        { id: 9, matricule: 'EMP-009', nom: 'Coulibaly', prenoms: 'Awa', poste: 'Directrice école', departement: 'Direction', site: 'cocody', type: 'CDI', statut: 'Actif', dateEmbauche: '2017-09-01', salaireBase: 600000, sexe: 'F', telephone: '+225 05 66 77 88', email: 'a.coulibaly@sirh.ci', cnps: 'CNPS-90123', nbEnfants: 3 },
        { id: 10, matricule: 'EMP-010', nom: 'N\'Guessan', prenoms: 'Patrick', poste: 'Comptable Junior', departement: 'Comptabilité', site: 'abidjan', type: 'Stage', statut: 'Actif', dateEmbauche: '2024-01-08', salaireBase: 180000, sexe: 'M', telephone: '+225 07 22 33 44', email: 'p.nguessan@sirh.ci', cnps: '', nbEnfants: 0 },
        { id: 11, matricule: 'EMP-011', nom: 'Konan', prenoms: 'Brigitte', poste: 'Agent logistique', departement: 'Logistique', site: 'sanpedro', type: 'CDI', statut: 'En congé', dateEmbauche: '2021-04-01', salaireBase: 250000, sexe: 'F', telephone: '+225 01 55 66 77', email: 'b.konan@sirh.ci', cnps: 'CNPS-11223', nbEnfants: 2 },
        { id: 12, matricule: 'EMP-012', nom: 'Cissé', prenoms: 'Abdoulaye', poste: 'Chauffeur', departement: 'Logistique', site: 'abidjan', type: 'CDI', statut: 'Actif', dateEmbauche: '2019-12-01', salaireBase: 220000, sexe: 'M', telephone: '+225 05 88 99 00', email: 'a.cisse@sirh.ci', cnps: 'CNPS-33445', nbEnfants: 3 },
    ],

    leaves: [
        { id: 1, empId: 11, type: 'Congé annuel', debut: '2024-06-10', fin: '2024-06-25', duree: 12, statut: 'Approuvé', motif: 'Voyage familial' },
        { id: 2, empId: 2, type: 'Congé annuel', debut: '2024-07-01', fin: '2024-07-15', duree: 11, statut: 'En attente', motif: 'Repos annuel' },
        { id: 3, empId: 4, type: 'Congé maladie', debut: '2024-06-20', fin: '2024-06-28', duree: 6, statut: 'Approuvé', motif: 'Certificat médical' },
        { id: 4, empId: 1, type: 'Congé annuel', debut: '2024-08-05', fin: '2024-08-20', duree: 12, statut: 'En attente', motif: 'Vacances familiales' },
        { id: 5, empId: 5, type: 'Permission', debut: '2024-07-10', fin: '2024-07-12', duree: 2, statut: 'En attente', motif: 'Événement familial' },
    ],

    recruitment: [
        { id: 1, poste: 'Comptable Senior', departement: 'Comptabilité', site: 'abidjan', type: 'CDI', statut: 'Ouvert', candidats: 15, dateCreation: '2024-05-15' },
        { id: 2, poste: 'Agent de sécurité', departement: 'Sécurité', site: 'yopougon', type: 'CDI', statut: 'En cours', candidats: 32, dateCreation: '2024-05-20' },
        { id: 3, poste: 'Professeur Français', departement: 'Pédagogie', site: 'cocody', type: 'CDI', statut: 'Ouvert', candidats: 8, dateCreation: '2024-06-01' },
        { id: 4, poste: 'Chef de chantier', departement: 'BTP', site: 'bouake', type: 'CDD', statut: 'Clôturé', candidats: 22, dateCreation: '2024-04-10' },
        { id: 5, poste: 'Secrétaire comptable', departement: 'Comptabilité', site: 'sanpedro', type: 'CDI', statut: 'En cours', candidats: 18, dateCreation: '2024-05-28' },
    ],

    evaluations: [
        { id: 1, empId: 1, periode: '2024-S1', competence: 4, rendement: 4, assiduite: 5, comportement: 4, note: 4.25, statut: 'Terminée', commentaire: 'Excellent travail, très rigoureux.' },
        { id: 2, empId: 4, periode: '2024-S1', competence: 5, rendement: 5, assiduite: 5, comportement: 5, note: 5.0, statut: 'Terminée', commentaire: 'Responsable exemplaire, leader naturel.' },
        { id: 3, empId: 5, periode: '2024-S1', competence: 3, rendement: 4, assiduite: 3, comportement: 4, note: 3.5, statut: 'Terminée', commentaire: 'Bon travail, progrès attendus en gestion d\'équipe.' },
        { id: 4, empId: 7, periode: '2024-S1', competence: 4, rendement: 3, assiduite: 5, comportement: 4, note: 4.0, statut: 'En cours', commentaire: '' },
    ],

    payroll: {
        mois: 'Juin 2024',
        statut: 'En préparation',
        nbEmployes: 12,
        masseSalarialeBrute: 3800000,
        masseSalarialeNette: 2950000,
        chargesPatronales: 760000,
    },

    contracts: [
        { id: 1, empId: 1, type: 'CDI', debut: '2020-03-15', fin: '', statut: 'Actif', salaireAnnuel: 5400000 },
        { id: 2, empId: 2, type: 'CDI', debut: '2021-06-01', fin: '', statut: 'Actif', salaireAnnuel: 2400000 },
        { id: 3, empId: 5, type: 'CDD', debut: '2023-01-15', fin: '2024-01-14', statut: 'Actif', salaireAnnuel: 4800000 },
        { id: 4, empId: 8, type: 'CDD', debut: '2023-06-01', fin: '2023-12-01', statut: 'Expiré', salaireAnnuel: 1800000 },
        { id: 5, empId: 10, type: 'Stage', debut: '2024-01-08', fin: '2024-07-08', statut: 'Actif', salaireAnnuel: 2160000 },
    ],

    trainings: [
        { id: 1, titre: 'Sécurité au travail', organisme: 'Cabinet QHSE CI', departement: 'BTP', site: 'bouake', debut: '2024-07-08', fin: '2024-07-10', budget: 450000, statut: 'Planifiée', participants: [5, 8] },
        { id: 2, titre: 'Paie et conformité CNPS', organisme: 'Institut RH Abidjan', departement: 'Comptabilité', site: 'abidjan', debut: '2024-08-12', fin: '2024-08-14', budget: 600000, statut: 'Validée', participants: [1, 10] },
        { id: 3, titre: 'Management de proximité', organisme: 'Afric Talents', departement: 'Direction', site: 'cocody', debut: '2024-09-02', fin: '2024-09-05', budget: 850000, statut: 'Brouillon', participants: [4, 7, 9] },
    ],

    documents: [
        { id: 1, empId: 1, type: 'Contrat', titre: 'Contrat CDI signé', reference: 'CTR-EMP-001', date: '2020-03-15', expiration: '', statut: 'Valide' },
        { id: 2, empId: 5, type: 'Pièce RH', titre: 'Certificat de travail précédent', reference: 'DOC-2023-018', date: '2023-01-15', expiration: '', statut: 'Archivé' },
        { id: 3, empId: 10, type: 'Stage', titre: 'Convention de stage', reference: 'STG-2024-010', date: '2024-01-08', expiration: '2024-07-08', statut: 'À renouveler' },
    ],
};

// ---------- SITES ----------
const sites = {
    all: { nom: 'Tous les sites', adresse: '' },
    abidjan: { nom: 'Abidjan - Plateau', adresse: 'Rue du Commerce, Plateau' },
    cocody: { nom: 'Cocody - Siège', adresse: 'Bd de France, Cocody' },
    yopougon: { nom: 'Yopougon - Usine', adresse: 'Zone industrielle, Yopougon' },
    bouake: { nom: 'Bouaké - Chantier', adresse: 'Route de Séguéla, Bouaké' },
    sanpedro: { nom: 'San Pedro', adresse: 'Port autonome, San Pedro' },
};

// ---------- UTILITY FUNCTIONS ----------
function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR');
}

function getEmpName(empId) {
    const emp = appData.employees.find(e => e.id === empId);
    return emp ? `${emp.nom} ${emp.prenoms}` : 'Inconnu';
}

function getEmpById(empId) {
    return appData.employees.find(e => e.id === empId);
}

function getStatutBadge(statut) {
    const map = {
        'Actif': 'badge-success', 'En congé': 'badge-warning', 'Suspendu': 'badge-danger',
        'Approuvé': 'badge-success', 'En attente': 'badge-warning', 'Refusé': 'badge-danger',
        'Ouvert': 'badge-success', 'En cours': 'badge-info', 'Clôturé': 'badge-muted',
        'Terminée': 'badge-success', 'Expiré': 'badge-danger',
    };
    return map[statut] || 'badge-muted';
}

function filterBySite(data) {
    if (appData.currentSite === 'all') return data;
    return data.filter(item => item.site === appData.currentSite);
}

function showToast(message, type = 'success') {
    const colors = { success: 'bg-ci-green', error: 'bg-ci-danger', warning: 'bg-ci-orange', info: 'bg-ci-info' };
    const icons = { success: 'check-circle', error: 'x-circle', warning: 'alert-triangle', info: 'info' };
    const toast = document.createElement('div');
    toast.className = `toast fixed top-4 right-4 z-[200] ${colors[type]} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium`;
    toast.innerHTML = `<i data-lucide="${icons[type]}" class="w-5 h-5"></i>${message}`;
    document.body.appendChild(toast);
    lucide.createIcons({ nodes: [toast] });
    setTimeout(() => toast.remove(), 3000);
}

// ---------- PAIE IVORIAN CALCULATOR ----------
function calculatePaie(emp) {
    const base = emp.salaireBase;
    const primes = {
        anciennete: Math.round(base * 0.03),
        transport: 25000,
        logement: Math.round(base * 0.05),
        risque: emp.departement === 'Sécurité' ? 20000 : (emp.departement === 'BTP' ? 25000 : 0),
    };
    const totalPrimes = Object.values(primes).reduce((a, b) => a + b, 0);
    const brut = base + totalPrimes;

    // CNPS Salarial: 6.3% (plafond 548,160 FCFA)
    const plafondCNPS = 548160;
    const baseCNPS = Math.min(brut, plafondCNPS);
    const cnpsSalarial = Math.round(baseCNPS * 0.063);

    // CNPS Patronal: 12%
    const cnpsPatronal = Math.round(baseCNPS * 0.12);

    // IGR (simplifié - barème progressif ivoirien)
    const taxableNet = brut - cnpsSalarial;
    let igr = 0;
    if (taxableNet <= 25000) igr = 0;
    else if (taxableNet <= 50000) igr = Math.round((taxableNet - 25000) * 0.10);
    else if (taxableNet <= 100000) igr = Math.round(2500 + (taxableNet - 50000) * 0.15);
    else if (taxableNet <= 200000) igr = Math.round(10000 + (taxableNet - 100000) * 0.20);
    else if (taxableNet <= 400000) igr = Math.round(30000 + (taxableNet - 200000) * 0.25);
    else if (taxableNet <= 600000) igr = Math.round(80000 + (taxableNet - 400000) * 0.35);
    else igr = Math.round(150000 + (taxableNet - 600000) * 0.40);

    // Réduction pour charge de famille (IGR)
    igr = Math.max(0, igr - (emp.nbEnfants * 5000));

    const totalRetenues = cnpsSalarial + igr;
    const net = brut - totalRetenues;

    return {
        base, primes, totalPrimes, brut, cnpsSalarial, cnpsPatronal, igr, totalRetenues, net,
        taxableNet,
    };
}

// ---------- SIDEBAR ----------
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function changeSite(value) {
    appData.currentSite = value;
    showModule(appData.currentModule);
}

function updateBadges() {
    const leaveBadge = document.getElementById('leaveBadge');
    if (leaveBadge) {
        const count = appData.leaves.filter(l => l.statut === 'En attente').length;
        leaveBadge.innerText = count;
        leaveBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// ---------- MODULE ROUTER ----------
function showModule(module) {
    try {
        appData.currentModule = module;
        updateBadges();

        // Update nav active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.module === module);
        });

        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
                toggleSidebar();
            }
        }

        // Render module
        const container = document.getElementById('moduleContainer');
        if (!container) return;
        
        container.style.animation = 'none';
        container.offsetHeight;
        container.style.animation = 'fadeIn 0.3s ease';

        const renderers = {
            dashboard: renderDashboard,
            employees: renderEmployees,
            leaves: renderLeaves,
            payroll: renderPayroll,
            recruitment: renderRecruitment,
            evaluations: renderEvaluations,
            trainings: renderTrainings,
            contracts: renderContracts,
            documents: renderDocuments,
            reports: renderReports,
            accounting: renderAccounting,
            support: renderSupport,
            settings: renderSettings,
            attendance: renderAttendance,
        };

        if (renderers[module]) {
            container.innerHTML = renderers[module]();
        } else {
            container.innerHTML = `<div class="p-8 text-center text-ci-muted">Module "${module}" non trouvé.</div>`;
        }
        lucide.createIcons();
    } catch (error) {
        console.error(`Erreur lors du rendu du module ${module}:`, error);
        document.getElementById('moduleContainer').innerHTML = `
            <div class="p-8 bg-red-50 border border-red-100 rounded-xl text-center">
                <i data-lucide="alert-circle" class="w-12 h-12 text-ci-danger mx-auto mb-4"></i>
                <h3 class="text-lg font-bold text-ci-danger">Erreur d'affichage</h3>
                <p class="text-sm text-ci-muted mt-2">${error.message}</p>
                <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-ci-danger text-white rounded-lg text-sm font-medium">Réessayer</button>
            </div>
        `;
        lucide.createIcons();
    }
}

// ========================================
// DASHBOARD
// ========================================
function renderDashboard() {
    const emps = filterBySite(appData.employees || []);
    const actifs = emps.filter(e => e.statut === 'Actif').length;
    const enConge = emps.filter(e => e.statut === 'En congé').length;
    const leavesPending = (appData.leaves || []).filter(l => l.statut === 'En attente').length;
    const recrutOuverts = (appData.recruitment || []).filter(r => r.statut === 'Ouvert' || r.statut === 'En cours').length;

    const totalBrut = emps.reduce((s, e) => s + (calculatePaie(e)?.brut || 0), 0);
    const totalNet = emps.reduce((s, e) => s + (calculatePaie(e)?.net || 0), 0);
    const totalCNPS = emps.reduce((s, e) => s + (calculatePaie(e)?.cnpsPatronal || 0), 0);

    const byDept = {};
    emps.forEach(e => { 
        if (e.departement) byDept[e.departement] = (byDept[e.departement] || 0) + 1; 
    });

    const bySexe = { M: 0, F: 0 };
    emps.forEach(e => { 
        if (e.sexe && bySexe.hasOwnProperty(e.sexe)) bySexe[e.sexe]++; 
    });

    const deptEntries = Object.entries(byDept).sort((a, b) => b[1] - a[1]);
    const maxDeptCount = deptEntries[0]?.[1] || 1;

    return `
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Tableau de Bord RH</h2>
                <p class="text-ci-muted text-sm mt-1">Bienvenue ! Voici l'essentiel de vos ressources humaines</p>
            </div>
            <div class="flex items-center gap-2 text-sm text-ci-muted">
                <i data-lucide="calendar" class="w-4 h-4"></i>
                <span>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat-card bg-white rounded-xl p-5 border border-ci-border">
                <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <i data-lucide="users" class="w-5 h-5 text-ci-info"></i>
                    </div>
                    <span class="text-xs font-medium badge-success px-2 py-1 rounded-full">${actifs} actifs</span>
                </div>
                <p class="text-2xl font-bold text-ci-text">${emps.length}</p>
                <p class="text-ci-muted text-sm">Total Employés</p>
            </div>

            <div class="stat-card bg-white rounded-xl p-5 border border-ci-border">
                <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <i data-lucide="palmtree" class="w-5 h-5 text-ci-orange"></i>
                    </div>
                    <span class="text-xs font-medium badge-warning px-2 py-1 rounded-full">${leavesPending} en attente</span>
                </div>
                <p class="text-2xl font-bold text-ci-text">${enConge}</p>
                <p class="text-ci-muted text-sm">En Congé</p>
            </div>

            <div class="stat-card bg-white rounded-xl p-5 border border-ci-border">
                <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <i data-lucide="banknote" class="w-5 h-5 text-ci-green"></i>
                    </div>
                    <span class="text-xs font-medium badge-info px-2 py-1 rounded-full">Net</span>
                </div>
                <p class="text-xl font-bold text-ci-text">${formatMoney(totalNet)}</p>
                <p class="text-ci-muted text-sm">Masse Salariale Net</p>
            </div>

            <div class="stat-card bg-white rounded-xl p-5 border border-ci-border">
                <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                        <i data-lucide="user-plus" class="w-5 h-5 text-purple-600"></i>
                    </div>
                    <span class="text-xs font-medium badge-success px-2 py-1 rounded-full">Ouverts</span>
                </div>
                <p class="text-2xl font-bold text-ci-text">${recrutOuverts}</p>
                <p class="text-ci-muted text-sm">Recrutements</p>
            </div>
        </div>

        <!-- Charts & Lists -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Department Distribution -->
            <div class="bg-white rounded-xl p-5 border border-ci-border lg:col-span-2">
                <h3 class="font-semibold text-ci-text mb-4 flex items-center gap-2">
                    <i data-lucide="building" class="w-4 h-4 text-ci-orange"></i>
                    Effectifs par Département
                </h3>
                <div class="space-y-3">
                    ${deptEntries.map(([dept, count]) => `
                    <div class="flex items-center gap-3">
                        <span class="text-sm text-ci-text w-36 truncate">${dept}</span>
                        <div class="flex-1 bg-ci-bg rounded-full h-5 overflow-hidden">
                            <div class="progress-fill bg-gradient-ci h-full rounded-full" style="width: ${(count / maxDeptCount) * 100}%"></div>
                        </div>
                        <span class="text-sm font-semibold text-ci-text w-8 text-right">${count}</span>
                    </div>
                    `).join('')}
                </div>

                <!-- Gender Distribution -->
                <div class="mt-6 pt-4 border-t border-ci-border flex gap-6">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span class="text-sm text-ci-muted">Hommes: <strong class="text-ci-text">${bySexe.M}</strong></span>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-pink-500"></div>
                        <span class="text-sm text-ci-muted">Femmes: <strong class="text-ci-text">${bySexe.F}</strong></span>
                    </div>
                    <div class="flex items-center gap-2 ml-auto">
                        <span class="text-sm text-ci-muted">Ratio H/F: <strong class="text-ci-text">${bySexe.M > 0 ? (bySexe.F / bySexe.M).toFixed(2) : 0}</strong></span>
                    </div>
                </div>
            </div>

            <!-- Pending Leaves -->
            <div class="bg-white rounded-xl p-5 border border-ci-border">
                <h3 class="font-semibold text-ci-text mb-4 flex items-center gap-2">
                    <i data-lucide="clock" class="w-4 h-4 text-ci-orange"></i>
                    Congés en attente
                </h3>
                <div class="space-y-3">
                    ${appData.leaves.filter(l => l.statut === 'En attente').map(l => `
                    <div class="flex items-start gap-3 p-3 bg-ci-bg rounded-lg">
                        <div class="w-8 h-8 bg-ci-orange/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i data-lucide="palmtree" class="w-4 h-4 text-ci-orange"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-ci-text truncate">${getEmpName(l.empId)}</p>
                            <p class="text-xs text-ci-muted">${l.type} · ${l.duree} jours</p>
                            <p class="text-xs text-ci-muted">${formatDate(l.debut)} → ${formatDate(l.fin)}</p>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="approveLeave(${l.id})" class="p-1.5 hover:bg-ci-green/10 rounded-lg" title="Approuver">
                                <i data-lucide="check" class="w-3.5 h-3.5 text-ci-green"></i>
                            </button>
                            <button onclick="rejectLeave(${l.id})" class="p-1.5 hover:bg-ci-danger/10 rounded-lg" title="Refuser">
                                <i data-lucide="x" class="w-3.5 h-3.5 text-ci-danger"></i>
                            </button>
                        </div>
                    </div>
                    `).join('')}
                    ${appData.leaves.filter(l => l.statut === 'En attente').length === 0 ? '<p class="text-sm text-ci-muted text-center py-4">Aucun congé en attente</p>' : ''}
                </div>
            </div>
        </div>

        <!-- Recent Activity & Payroll Summary -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Payroll Summary -->
            <div class="bg-white rounded-xl p-5 border border-ci-border">
                <h3 class="font-semibold text-ci-text mb-4 flex items-center gap-2">
                    <i data-lucide="trending-up" class="w-4 h-4 text-ci-green"></i>
                    Synthèse Paie - ${appData.payroll.mois}
                </h3>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-3 bg-blue-50 rounded-lg">
                        <p class="text-xs text-ci-muted">Brut Total</p>
                        <p class="text-sm font-bold text-ci-text">${formatMoney(totalBrut)}</p>
                    </div>
                    <div class="p-3 bg-green-50 rounded-lg">
                        <p class="text-xs text-ci-muted">Net Total</p>
                        <p class="text-sm font-bold text-ci-green">${formatMoney(totalNet)}</p>
                    </div>
                    <div class="p-3 bg-orange-50 rounded-lg">
                        <p class="text-xs text-ci-muted">CNPS Patronal</p>
                        <p class="text-sm font-bold text-ci-orange">${formatMoney(totalCNPS)}</p>
                    </div>
                    <div class="p-3 bg-purple-50 rounded-lg">
                        <p class="text-xs text-ci-muted">Nb Employés</p>
                        <p class="text-sm font-bold text-ci-text">${emps.length} personnes</p>
                    </div>
                </div>
                <button onclick="showModule('payroll')" class="mt-4 w-full py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    Voir le détail de la paie
                </button>
            </div>

            <!-- Recent Contracts -->
            <div class="bg-white rounded-xl p-5 border border-ci-border">
                <h3 class="font-semibold text-ci-text mb-4 flex items-center gap-2">
                    <i data-lucide="file-text" class="w-4 h-4 text-ci-orange"></i>
                    Contrats Récents
                </h3>
                <div class="space-y-2">
                    ${appData.contracts.slice(0, 5).map(c => `
                    <div class="flex items-center justify-between p-3 bg-ci-bg rounded-lg">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-ci flex items-center justify-center text-white text-xs font-bold">
                                ${getEmpById(c.empId)?.nom.charAt(0) || '?'}
                            </div>
                            <div>
                                <p class="text-sm font-medium text-ci-text">${getEmpName(c.empId)}</p>
                                <p class="text-xs text-ci-muted">${c.type} · ${formatDate(c.debut)}</p>
                            </div>
                        </div>
                        <span class="text-xs font-medium ${getStatutBadge(c.statut)} px-2 py-1 rounded-full">${c.statut}</span>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>`;
}

// ========================================
// EMPLOYEES MODULE
// ========================================
function renderEmployees() {
    const emps = filterBySite(appData.employees);
    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Gestion des Employés</h2>
                <p class="text-ci-muted text-sm">${emps.length} employés trouvés</p>
            </div>
            <button onclick="openAddEmployee()" class="bg-ci-green text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center gap-2">
                <i data-lucide="user-plus" class="w-4 h-4"></i>
                Ajouter un employé
            </button>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl p-4 border border-ci-border flex flex-wrap gap-3">
            <div class="flex-1 min-w-[200px]">
                <input type="text" id="empSearch" placeholder="Rechercher par nom, matricule..." class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green" oninput="filterEmployees()">
            </div>
            <select id="empDeptFilter" class="px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green" onchange="filterEmployees()">
                <option value="">Tous les départements</option>
                <option>Comptabilité</option><option>Sécurité</option><option>Pédagogie</option>
                <option>Ressources Humaines</option><option>BTP</option><option>Direction</option>
                <option>Logistique</option>
            </select>
            <select id="empStatutFilter" class="px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green" onchange="filterEmployees()">
                <option value="">Tous les statuts</option>
                <option>Actif</option><option>En congé</option><option>Suspendu</option>
            </select>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-ci-bg text-ci-muted text-xs uppercase">
                        <tr>
                            <th class="px-4 py-3 text-left">Employé</th>
                            <th class="px-4 py-3 text-left hidden md:table-cell">Matricule</th>
                            <th class="px-4 py-3 text-left hidden sm:table-cell">Poste</th>
                            <th class="px-4 py-3 text-left hidden lg:table-cell">Département</th>
                            <th class="px-4 py-3 text-left hidden md:table-cell">Type</th>
                            <th class="px-4 py-3 text-left">Statut</th>
                            <th class="px-4 py-3 text-left hidden lg:table-cell">Salaire Base</th>
                            <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="empTableBody">
                        ${emps.map(e => `
                        <tr class="table-row border-t border-ci-border">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full ${e.sexe === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'} flex items-center justify-center text-sm font-bold">
                                        ${e.nom.charAt(0)}${e.prenoms.charAt(0)}
                                    </div>
                                    <div>
                                        <p class="font-medium text-ci-text">${e.nom} ${e.prenoms}</p>
                                        <p class="text-xs text-ci-muted">${e.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-4 py-3 hidden md:table-cell text-ci-muted">${e.matricule}</td>
                            <td class="px-4 py-3 hidden sm:table-cell">${e.poste}</td>
                            <td class="px-4 py-3 hidden lg:table-cell text-ci-muted">${e.departement}</td>
                            <td class="px-4 py-3 hidden md:table-cell">
                                <span class="${e.type === 'CDI' ? 'badge-success' : e.type === 'CDD' ? 'badge-warning' : 'badge-info'} text-xs font-medium px-2 py-1 rounded-full">${e.type}</span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="${getStatutBadge(e.statut)} text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                                    <span class="w-1.5 h-1.5 rounded-full ${e.statut === 'Actif' ? 'bg-ci-green' : e.statut === 'En congé' ? 'bg-ci-orange' : 'bg-ci-danger'}"></span>
                                    ${e.statut}
                                </span>
                            </td>
                            <td class="px-4 py-3 hidden lg:table-cell font-medium">${formatMoney(e.salaireBase)}</td>
                            <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-1">
                                    <button onclick="viewEmployee(${e.id})" class="p-1.5 hover:bg-ci-bg rounded-lg" title="Voir">
                                        <i data-lucide="eye" class="w-4 h-4 text-ci-muted"></i>
                                    </button>
                                    <button onclick="editEmployee(${e.id})" class="p-1.5 hover:bg-ci-bg rounded-lg" title="Modifier">
                                        <i data-lucide="pencil" class="w-4 h-4 text-ci-info"></i>
                                    </button>
                                    <button onclick="deleteEmployee(${e.id})" class="p-1.5 hover:bg-red-50 rounded-lg" title="Supprimer">
                                        <i data-lucide="trash-2" class="w-4 h-4 text-ci-danger"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function filterEmployees() {
    const search = document.getElementById('empSearch')?.value.toLowerCase() || '';
    const dept = document.getElementById('empDeptFilter')?.value || '';
    const statut = document.getElementById('empStatutFilter')?.value || '';
    let emps = filterBySite(appData.employees);

    if (search) emps = emps.filter(e => `${e.nom} ${e.prenoms} ${e.matricule} ${e.poste}`.toLowerCase().includes(search));
    if (dept) emps = emps.filter(e => e.departement === dept);
    if (statut) emps = emps.filter(e => e.statut === statut);

    const tbody = document.getElementById('empTableBody');
    if (!tbody) return;
    tbody.innerHTML = emps.map(e => `
        <tr class="table-row border-t border-ci-border">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full ${e.sexe === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'} flex items-center justify-center text-sm font-bold">${e.nom.charAt(0)}${e.prenoms.charAt(0)}</div>
                    <div><p class="font-medium text-ci-text">${e.nom} ${e.prenoms}</p><p class="text-xs text-ci-muted">${e.email}</p></div>
                </div>
            </td>
            <td class="px-4 py-3 hidden md:table-cell text-ci-muted">${e.matricule}</td>
            <td class="px-4 py-3 hidden sm:table-cell">${e.poste}</td>
            <td class="px-4 py-3 hidden lg:table-cell text-ci-muted">${e.departement}</td>
            <td class="px-4 py-3 hidden md:table-cell"><span class="${e.type === 'CDI' ? 'badge-success' : e.type === 'CDD' ? 'badge-warning' : 'badge-info'} text-xs font-medium px-2 py-1 rounded-full">${e.type}</span></td>
            <td class="px-4 py-3"><span class="${getStatutBadge(e.statut)} text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 w-fit"><span class="w-1.5 h-1.5 rounded-full ${e.statut === 'Actif' ? 'bg-ci-green' : 'bg-ci-orange'}"></span>${e.statut}</span></td>
            <td class="px-4 py-3 hidden lg:table-cell font-medium">${formatMoney(e.salaireBase)}</td>
            <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="viewEmployee(${e.id})" class="p-1.5 hover:bg-ci-bg rounded-lg"><i data-lucide="eye" class="w-4 h-4 text-ci-muted"></i></button>
                    <button onclick="editEmployee(${e.id})" class="p-1.5 hover:bg-ci-bg rounded-lg"><i data-lucide="pencil" class="w-4 h-4 text-ci-info"></i></button>
                    <button onclick="deleteEmployee(${e.id})" class="p-1.5 hover:bg-red-50 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4 text-ci-danger"></i></button>
                </div>
            </td>
        </tr>`).join('');
    lucide.createIcons();
}

function openAddEmployee() {
    openModal('Ajouter un employé', `
        <form onsubmit="saveEmployee(event)" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Nom *</label>
                    <input type="text" name="nom" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Prénoms *</label>
                    <input type="text" name="prenoms" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Sexe</label>
                    <select name="sexe" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option value="M">Masculin</option><option value="F">Féminin</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Nb Enfants</label>
                    <input type="number" name="nbEnfants" value="0" min="0" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-ci-text mb-1">Poste *</label>
                <input type="text" name="poste" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Département</label>
                    <select name="departement" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option>Comptabilité</option><option>Sécurité</option><option>Pédagogie</option>
                        <option>Ressources Humaines</option><option>BTP</option><option>Direction</option><option>Logistique</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Site</label>
                    <select name="site" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option value="abidjan">Abidjan - Plateau</option><option value="cocody">Cocody - Siège</option>
                        <option value="yopougon">Yopougon - Usine</option><option value="bouake">Bouaké - Chantier</option>
                        <option value="sanpedro">San Pedro</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Type contrat</label>
                    <select name="type" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option>CDI</option><option>CDD</option><option>Stage</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Salaire de base (FCFA)</label>
                    <input type="number" name="salaireBase" required min="0" step="5000" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Date d'embauche</label>
                    <input type="date" name="dateEmbauche" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Téléphone</label>
                    <input type="tel" name="telephone" placeholder="+225 XX XX XX XX XX" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-ci-text mb-1">Email</label>
                <input type="email" name="email" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark">Enregistrer</button>
            </div>
        </form>
    `);
}

function saveEmployee(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newId = Math.max(...appData.employees.map(emp => emp.id)) + 1;
    const matNum = String(newId).padStart(3, '0');
    appData.employees.push({
        id: newId,
        matricule: `EMP-${matNum}`,
        nom: fd.get('nom'), prenoms: fd.get('prenoms'),
        poste: fd.get('poste'), departement: fd.get('departement'),
        site: fd.get('site'), type: fd.get('type'), statut: 'Actif',
        dateEmbauche: fd.get('dateEmbauche'),
        salaireBase: parseInt(fd.get('salaireBase')) || 0,
        sexe: fd.get('sexe'), telephone: fd.get('telephone') || '',
        email: fd.get('email') || '', cnps: '', nbEnfants: parseInt(fd.get('nbEnfants')) || 0,
    });
    closeModal();
    showModule('employees');
    showToast('Employé ajouté avec succès !');
}

function viewEmployee(id) {
    const emp = getEmpById(id);
    if (!emp) return;
    const paie = calculatePaie(emp);
    const anciennete = new Date().getFullYear() - new Date(emp.dateEmbauche).getFullYear();

    openModal(`${emp.nom} ${emp.prenoms}`, `
        <div class="space-y-6">
            <!-- Profile Header -->
            <div class="flex items-center gap-4 pb-4 border-b border-ci-border">
                <div class="w-16 h-16 rounded-full bg-gradient-ci flex items-center justify-center text-white text-xl font-bold">
                    ${emp.nom.charAt(0)}${emp.prenoms.charAt(0)}
                </div>
                <div>
                    <h3 class="text-xl font-bold text-ci-text">${emp.nom} ${emp.prenoms}</h3>
                    <p class="text-ci-muted">${emp.poste} · ${emp.departement}</p>
                    <span class="${getStatutBadge(emp.statut)} text-xs font-medium px-2 py-1 rounded-full mt-1 inline-block">${emp.statut}</span>
                </div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-4">
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Matricule</p>
                    <p class="text-sm font-medium text-ci-text">${emp.matricule}</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">CNPS</p>
                    <p class="text-sm font-medium text-ci-text">${emp.cnps || 'Non renseigné'}</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Site</p>
                    <p class="text-sm font-medium text-ci-text">${sites[emp.site]?.nom || emp.site}</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Type contrat</p>
                    <p class="text-sm font-medium text-ci-text">${emp.type}</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Date embauche</p>
                    <p class="text-sm font-medium text-ci-text">${formatDate(emp.dateEmbauche)}</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Ancienneté</p>
                    <p class="text-sm font-medium text-ci-text">${anciennete} an(s)</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Téléphone</p>
                    <p class="text-sm font-medium text-ci-text">${emp.telephone || '-'}</p>
                </div>
                <div class="p-3 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Nb Enfants</p>
                    <p class="text-sm font-medium text-ci-text">${emp.nbEnfants}</p>
                </div>
            </div>

            <!-- Salary Breakdown -->
            <div class="border border-ci-border rounded-lg p-4">
                <h4 class="font-semibold text-ci-text mb-3 flex items-center gap-2">
                    <i data-lucide="banknote" class="w-4 h-4 text-ci-green"></i>
                    Simulation Paie
                </h4>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between"><span class="text-ci-muted">Salaire de base</span><span class="font-medium">${formatMoney(paie.base)}</span></div>
                    <div class="flex justify-between text-ci-muted"><span>  Primes (anc., transp., logt., risque)</span><span>+${formatMoney(paie.totalPrimes)}</span></div>
                    <div class="flex justify-between border-t border-ci-border pt-2 font-bold"><span>Salaire Brut</span><span>${formatMoney(paie.brut)}</span></div>
                    <div class="flex justify-between text-red-500"><span>  CNPS Salarial (6.3%)</span><span>-${formatMoney(paie.cnpsSalarial)}</span></div>
                    <div class="flex justify-between text-red-500"><span>  IGR / IR</span><span>-${formatMoney(paie.igr)}</span></div>
                    <div class="flex justify-between border-t-2 border-ci-green pt-2 text-ci-green font-bold text-lg"><span>Salaire Net</span><span>${formatMoney(paie.net)}</span></div>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="generateContract(${emp.id})" class="flex-1 py-2 bg-ci-orange text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="file-text" class="w-4 h-4"></i>Générer Contrat
                </button>
                <button onclick="generateFichePaie(${emp.id})" class="flex-1 py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="printer" class="w-4 h-4"></i>Fiche de Paie
                </button>
            </div>
        </div>
    `);
}

function editEmployee(id) {
    const emp = getEmpById(id);
    if (!emp) return;
    openModal('Modifier l\'employé', `
        <form onsubmit="updateEmployee(event, ${id})" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Nom</label>
                    <input type="text" name="nom" value="${emp.nom}" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Prénoms</label>
                    <input type="text" name="prenoms" value="${emp.prenoms}" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            </div>
            <div><label class="block text-sm font-medium text-ci-text mb-1">Poste</label>
                <input type="text" name="poste" value="${emp.poste}" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Département</label>
                    <select name="departement" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        ${['Comptabilité','Sécurité','Pédagogie','Ressources Humaines','BTP','Direction','Logistique'].map(d => `<option ${emp.departement===d?'selected':''}>${d}</option>`).join('')}
                    </select></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Statut</label>
                    <select name="statut" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option ${emp.statut==='Actif'?'selected':''}>Actif</option><option ${emp.statut==='En congé'?'selected':''}>En congé</option><option ${emp.statut==='Suspendu'?'selected':''}>Suspendu</option>
                    </select></div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Salaire Base (FCFA)</label>
                    <input type="number" name="salaireBase" value="${emp.salaireBase}" min="0" step="5000" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Nb Enfants</label>
                    <input type="number" name="nbEnfants" value="${emp.nbEnfants}" min="0" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark">Mettre à jour</button>
            </div>
        </form>
    `);
}

function updateEmployee(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const emp = getEmpById(id);
    if (!emp) return;
    emp.nom = fd.get('nom'); emp.prenoms = fd.get('prenoms');
    emp.poste = fd.get('poste'); emp.departement = fd.get('departement');
    emp.statut = fd.get('statut'); emp.salaireBase = parseInt(fd.get('salaireBase'));
    emp.nbEnfants = parseInt(fd.get('nbEnfants'));
    closeModal(); showModule('employees');
    showToast('Employé mis à jour !');
}

function deleteEmployee(id) {
    if (confirm('Supprimer cet employé ?')) {
        appData.employees = appData.employees.filter(e => e.id !== id);
        showModule('employees');
        showToast('Employé supprimé', 'warning');
    }
}

// ========================================
// LEAVES MODULE
// ========================================
function renderLeaves() {
    const leavesPending = appData.leaves.filter(l => l.statut === 'En attente').length;
    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Gestion des Congés</h2>
                <p class="text-ci-muted text-sm">${leavesPending} demande(s) en attente de validation</p>
            </div>
            <button onclick="openAddLeave()" class="bg-ci-orange text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                Nouvelle demande
            </button>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-warning">${leavesPending}</p>
                <p class="text-xs text-ci-muted">En attente</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-green">${appData.leaves.filter(l=>l.statut==='Approuvé').length}</p>
                <p class="text-xs text-ci-muted">Approuvés</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-danger">${appData.leaves.filter(l=>l.statut==='Refusé').length}</p>
                <p class="text-xs text-ci-muted">Refusés</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-text">${appData.leaves.reduce((s,l) => s + (l.statut==='Approuvé'?l.duree:0), 0)}</p>
                <p class="text-xs text-ci-muted">Jours approuvés</p>
            </div>
        </div>

        <!-- Leaves Table -->
        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-ci-bg text-ci-muted text-xs uppercase">
                        <tr>
                            <th class="px-4 py-3 text-left">Employé</th>
                            <th class="px-4 py-3 text-left">Type</th>
                            <th class="px-4 py-3 text-left hidden sm:table-cell">Début</th>
                            <th class="px-4 py-3 text-left hidden sm:table-cell">Fin</th>
                            <th class="px-4 py-3 text-left">Durée</th>
                            <th class="px-4 py-3 text-left">Statut</th>
                            <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appData.leaves.map(l => `
                        <tr class="table-row border-t border-ci-border">
                            <td class="px-4 py-3">
                                <p class="font-medium text-ci-text">${getEmpName(l.empId)}</p>
                                <p class="text-xs text-ci-muted">${l.motif}</p>
                            </td>
                            <td class="px-4 py-3">${l.type}</td>
                            <td class="px-4 py-3 hidden sm:table-cell text-ci-muted">${formatDate(l.debut)}</td>
                            <td class="px-4 py-3 hidden sm:table-cell text-ci-muted">${formatDate(l.fin)}</td>
                            <td class="px-4 py-3 font-medium">${l.duree} j</td>
                            <td class="px-4 py-3"><span class="${getStatutBadge(l.statut)} text-xs font-medium px-2 py-1 rounded-full">${l.statut}</span></td>
                            <td class="px-4 py-3 text-right">
                                ${l.statut === 'En attente' ? `
                                <div class="flex items-center justify-end gap-1">
                                    <button onclick="approveLeave(${l.id})" class="p-1.5 hover:bg-ci-green/10 rounded-lg" title="Approuver"><i data-lucide="check" class="w-4 h-4 text-ci-green"></i></button>
                                    <button onclick="rejectLeave(${l.id})" class="p-1.5 hover:bg-ci-danger/10 rounded-lg" title="Refuser"><i data-lucide="x" class="w-4 h-4 text-ci-danger"></i></button>
                                </div>` : '<span class="text-xs text-ci-muted">-</span>'}
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function approveLeave(id) {
    const leave = appData.leaves.find(l => l.id === id);
    if (leave) { leave.statut = 'Approuvé'; showModule('leaves'); showToast('Congé approuvé !'); }
}

function rejectLeave(id) {
    const leave = appData.leaves.find(l => l.id === id);
    if (leave) { leave.statut = 'Refusé'; showModule('leaves'); showToast('Congé refusé', 'warning'); }
}

function openAddLeave() {
    openModal('Nouvelle demande de congé', `
        <form onsubmit="saveLeave(event)" class="space-y-4">
            <div><label class="block text-sm font-medium text-ci-text mb-1">Employé *</label>
                <select name="empId" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    ${appData.employees.map(e => `<option value="${e.id}">${e.nom} ${e.prenoms}</option>`).join('')}
                </select></div>
            <div><label class="block text-sm font-medium text-ci-text mb-1">Type de congé</label>
                <select name="type" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    <option>Congé annuel</option><option>Congé maladie</option><option>Permission</option><option>Congé maternité</option><option>Congé sans solde</option>
                </select></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Date début</label>
                    <input type="date" name="debut" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Date fin</label>
                    <input type="date" name="fin" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            </div>
            <div><label class="block text-sm font-medium text-ci-text mb-1">Motif</label>
                <textarea name="motif" rows="3" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green" placeholder="Motif du congé..."></textarea></div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-orange text-white rounded-lg text-sm font-medium hover:bg-orange-600">Soumettre</button>
            </div>
        </form>
    `);
}

function saveLeave(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const debut = fd.get('debut'), fin = fd.get('fin');
    const duree = Math.ceil((new Date(fin) - new Date(debut)) / (1000*60*60*24));
    const newId = Math.max(...appData.leaves.map(l => l.id)) + 1;
    appData.leaves.push({
        id: newId, empId: parseInt(fd.get('empId')), type: fd.get('type'),
        debut, fin, duree: Math.max(1, duree), statut: 'En attente', motif: fd.get('motif') || '',
    });
    closeModal(); showModule('leaves');
    showToast('Demande de congé soumise !');
}

// ========================================
// PAYROLL MODULE
// ========================================
function renderPayroll() {
    const emps = filterBySite(appData.employees.filter(e => e.statut === 'Actif'));
    const payDetails = emps.map(e => ({ ...e, paie: calculatePaie(e) }));
    const totalBrut = payDetails.reduce((s, e) => s + e.paie.brut, 0);
    const totalNet = payDetails.reduce((s, e) => s + e.paie.net, 0);
    const totalCNPS_Sal = payDetails.reduce((s, e) => s + e.paie.cnpsSalarial, 0);
    const totalCNPS_Pat = payDetails.reduce((s, e) => s + e.paie.cnpsPatronal, 0);
    const totalIGR = payDetails.reduce((s, e) => s + e.paie.igr, 0);

    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Module de Paie</h2>
                <p class="text-ci-muted text-sm">Paie de ${appData.payroll.mois} · Contexte ivoirien (CNPS, IGR)</p>
            </div>
            <div class="flex gap-2">
                <button onclick="exportPayrollCSV()" class="bg-white border border-ci-border text-ci-text px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-bg transition-colors flex items-center gap-2">
                    <i data-lucide="download" class="w-4 h-4"></i>Export CSV
                </button>
                <button onclick="launchPayroll()" class="bg-ci-green text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center gap-2">
                    <i data-lucide="play" class="w-4 h-4"></i>Lancer la paie
                </button>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-xs text-ci-muted mb-1">Masse Brute</p>
                <p class="text-lg font-bold text-ci-text">${formatMoney(totalBrut)}</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-xs text-ci-muted mb-1">Masse Nette</p>
                <p class="text-lg font-bold text-ci-green">${formatMoney(totalNet)}</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-xs text-ci-muted mb-1">CNPS (6.3% Sal.)</p>
                <p class="text-lg font-bold text-ci-orange">${formatMoney(totalCNPS_Sal)}</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-xs text-ci-muted mb-1">IGR Total</p>
                <p class="text-lg font-bold text-ci-danger">${formatMoney(totalIGR)}</p>
            </div>
        </div>

        <!-- Payroll Table -->
        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-ci-bg text-ci-muted text-xs uppercase">
                        <tr>
                            <th class="px-3 py-3 text-left">Employé</th>
                            <th class="px-3 py-3 text-right">Base</th>
                            <th class="px-3 py-3 text-right hidden md:table-cell">Primes</th>
                            <th class="px-3 py-3 text-right font-bold">Brut</th>
                            <th class="px-3 py-3 text-right text-red-500 hidden sm:table-cell">CNPS</th>
                            <th class="px-3 py-3 text-right text-red-500 hidden sm:table-cell">IGR</th>
                            <th class="px-3 py-3 text-right font-bold text-ci-green">Net</th>
                            <th class="px-3 py-3 text-right">Fiche</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payDetails.map(e => `
                        <tr class="table-row border-t border-ci-border">
                            <td class="px-3 py-2.5">
                                <p class="font-medium text-ci-text text-sm">${e.nom} ${e.prenoms}</p>
                                <p class="text-xs text-ci-muted">${e.matricule}</p>
                            </td>
                            <td class="px-3 py-2.5 text-right text-ci-muted">${formatMoney(e.paie.base)}</td>
                            <td class="px-3 py-2.5 text-right text-ci-muted hidden md:table-cell">+${formatMoney(e.paie.totalPrimes)}</td>
                            <td class="px-3 py-2.5 text-right font-bold">${formatMoney(e.paie.brut)}</td>
                            <td class="px-3 py-2.5 text-right text-red-500 hidden sm:table-cell">-${formatMoney(e.paie.cnpsSalarial)}</td>
                            <td class="px-3 py-2.5 text-right text-red-500 hidden sm:table-cell">-${formatMoney(e.paie.igr)}</td>
                            <td class="px-3 py-2.5 text-right font-bold text-ci-green">${formatMoney(e.paie.net)}</td>
                            <td class="px-3 py-2.5 text-right">
                                <button onclick="generateFichePaie(${e.id})" class="p-1.5 hover:bg-ci-bg rounded-lg" title="Fiche de paie">
                                    <i data-lucide="printer" class="w-4 h-4 text-ci-muted"></i>
                                </button>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                    <tfoot class="bg-ci-bg font-bold text-sm">
                        <tr>
                            <td class="px-3 py-3">TOTAL</td>
                            <td class="px-3 py-3 text-right">${formatMoney(payDetails.reduce((s,e)=>s+e.paie.base,0))}</td>
                            <td class="px-3 py-3 text-right hidden md:table-cell">${formatMoney(payDetails.reduce((s,e)=>s+e.paie.totalPrimes,0))}</td>
                            <td class="px-3 py-3 text-right">${formatMoney(totalBrut)}</td>
                            <td class="px-3 py-3 text-right text-red-500 hidden sm:table-cell">${formatMoney(totalCNPS_Sal)}</td>
                            <td class="px-3 py-3 text-right text-red-500 hidden sm:table-cell">${formatMoney(totalIGR)}</td>
                            <td class="px-3 py-3 text-right text-ci-green">${formatMoney(totalNet)}</td>
                            <td class="px-3"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- CNPS Patronal Section -->
        <div class="bg-white rounded-xl p-5 border border-ci-border">
            <h3 class="font-semibold text-ci-text mb-3 flex items-center gap-2">
                <i data-lucide="shield" class="w-4 h-4 text-ci-orange"></i>
                Charges Patronales CNPS (12%)
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-4 bg-ci-orangeLight rounded-lg text-center">
                    <p class="text-xs text-ci-muted">Total CNPS Patronal</p>
                    <p class="text-xl font-bold text-ci-orange">${formatMoney(totalCNPS_Pat)}</p>
                </div>
                <div class="p-4 bg-green-50 rounded-lg text-center">
                    <p class="text-xs text-ci-muted">Total CNPS Salarial</p>
                    <p class="text-xl font-bold text-ci-green">${formatMoney(totalCNPS_Sal)}</p>
                </div>
                <div class="p-4 bg-blue-50 rounded-lg text-center">
                    <p class="text-xs text-ci-muted">Total CNPS Cumulé</p>
                    <p class="text-xl font-bold text-ci-info">${formatMoney(totalCNPS_Pat + totalCNPS_Sal)}</p>
                </div>
            </div>
        </div>
    </div>`;
}

function launchPayroll() {
    if (confirm('Confirmer le lancement de la paie pour tous les employés actifs ?')) {
        appData.payroll.statut = 'Clôturée';
        showToast('Paie lancée avec succès ! Les fiches de paie sont prêtes.', 'success');
    }
}

function generateFichePaie(empId) {
    const emp = getEmpById(empId);
    if (!emp) return;
    const p = calculatePaie(emp);

    const content = `
    <div class="payroll-slip" id="payrollSlip">
        <div class="text-center mb-4 pb-3 border-b-2 border-ci-text">
            <h2 class="text-lg font-bold">ENTREPRISE</h2>
            <p class="text-xs text-ci-muted">N° CC: XXXXX · N° CNPS: XXXXX · NIF: XXXXX</p>
            <p class="text-xs text-ci-muted">${sites[emp.site]?.nom || 'Abidjan'}</p>
        </div>
        <div class="flex justify-between mb-4 text-xs">
            <div><strong>Employé:</strong> ${emp.nom} ${emp.prenoms}<br><strong>Matricule:</strong> ${emp.matricule}<br><strong>CNPS:</strong> ${emp.cnps || '-'}</div>
            <div class="text-right"><strong>Période:</strong> ${appData.payroll.mois}<br><strong>Poste:</strong> ${emp.poste}<br><strong>Dépt:</strong> ${emp.departement}</div>
        </div>
        <table class="w-full border border-ci-text text-xs mb-2">
            <thead><tr class="bg-gray-100"><th class="border border-ci-text px-2 py-1 text-left" colspan="2">GAINS</th><th class="border border-ci-text px-2 py-1 text-left" colspan="2">RETENUES</th></tr></thead>
            <tbody>
                <tr><td class="border border-ci-text px-2 py-1">Salaire de base</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.base)}</td><td class="border border-ci-text px-2 py-1">CNPS Salarial (6.3%)</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.cnpsSalarial)}</td></tr>
                <tr><td class="border border-ci-text px-2 py-1">Prime ancienneté</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.primes.anciennete)}</td><td class="border border-ci-text px-2 py-1">IGR / IR</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.igr)}</td></tr>
                <tr><td class="border border-ci-text px-2 py-1">Prime transport</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.primes.transport)}</td><td class="border border-ci-text px-2 py-1"></td><td class="border border-ci-text px-2 py-1 text-right"></td></tr>
                <tr><td class="border border-ci-text px-2 py-1">Indemnité logement</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.primes.logement)}</td><td class="border border-ci-text px-2 py-1"></td><td class="border border-ci-text px-2 py-1 text-right"></td></tr>
                <tr><td class="border border-ci-text px-2 py-1">Prime risque</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.primes.risque)}</td><td class="border border-ci-text px-2 py-1"></td><td class="border border-ci-text px-2 py-1 text-right"></td></tr>
                <tr class="font-bold"><td class="border border-ci-text px-2 py-1">Total Brut</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.brut)}</td><td class="border border-ci-text px-2 py-1">Total Retenues</td><td class="border border-ci-text px-2 py-1 text-right">${formatMoney(p.totalRetenues)}</td></tr>
            </tbody>
        </table>
        <div class="border-2 border-ci-text p-3 text-center mt-4">
            <p class="text-sm">NET À PAYER: <strong class="text-lg">${formatMoney(p.net)}</strong></p>
        </div>
        <div class="flex justify-between mt-6 pt-4 border-t text-xs text-ci-muted">
            <div><p>Signature de l'employeur</p><br><br><hr class="w-32"></div>
            <div class="text-right"><p>Signature de l'employé</p><br><br><hr class="w-32 ml-auto"></div>
        </div>
    </div>`;

    openModal(`Fiche de Paie - ${emp.nom} ${emp.prenoms}`, `
        ${content}
        <div class="flex gap-2 mt-4 no-print">
            <button onclick="printSlip()" class="flex-1 py-2 bg-ci-green text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <i data-lucide="printer" class="w-4 h-4"></i>Imprimer
            </button>
            <button onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Fermer</button>
        </div>
    `);
}

function printSlip() {
    const slip = document.getElementById('payrollSlip');
    if (!slip) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Fiche de Paie</title><style>body{font-family:'Courier New',monospace;font-size:12px;padding:20px;}table{width:100%;border-collapse:collapse;}td,th{padding:2px 4px;border:1px solid #000;}.font-bold{font-weight:bold;}.text-center{text-align:center;}.text-right{text-align:right;}</style></head><body>${slip.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}

function exportPayrollCSV() {
    const emps = filterBySite(appData.employees.filter(e => e.statut === 'Actif'));
    let csv = 'Matricule,Nom,Prénoms,Poste,Département,Base,Primes,Brut,CNPS_Salarial,IGR,Net\n';
    emps.forEach(e => {
        const p = calculatePaie(e);
        csv += `${e.matricule},${e.nom},${e.prenoms},${e.poste},${e.departement},${p.base},${p.totalPrimes},${p.brut},${p.cnpsSalarial},${p.igr},${p.net}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `paie_${appData.payroll.mois.replace(' ', '_')}.csv`; a.click();
    showToast('Export CSV téléchargé !', 'info');
}

// ========================================
// ATTENDANCE MODULE
// ========================================
function renderAttendance() {
    const attendance = filterBySite(appData.attendance || []);
    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Pointage & Présence</h2>
                <p class="text-ci-muted text-sm">Suivi des entrées/sorties en temps réel</p>
            </div>
            <div class="flex gap-2">
                <a href="attendance.html" target="_blank" class="bg-ci-orange text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2">
                    <i data-lucide="external-link" class="w-4 h-4"></i>Ouvrir le terminal
                </a>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-ci-bg text-ci-muted text-xs uppercase">
                        <tr>
                            <th class="px-4 py-3 text-left">Employé</th>
                            <th class="px-4 py-3 text-left">Type</th>
                            <th class="px-4 py-3 text-left">Date & Heure</th>
                            <th class="px-4 py-3 text-left">Site</th>
                            <th class="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attendance.slice().reverse().map(a => `
                        <tr class="table-row border-t border-ci-border">
                            <td class="px-4 py-3 font-medium text-ci-text">${a.nom} <span class="text-xs text-ci-muted ml-1">(${a.matricule})</span></td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded-full text-[10px] font-bold ${a.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">
                                    ${a.type === 'IN' ? 'ARRIVÉE' : 'DÉPART'}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-ci-muted">
                                ${new Date(a.timestamp).toLocaleDateString()} ${new Date(a.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td class="px-4 py-3 text-xs uppercase text-ci-muted">${a.site}</td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="showToast('Action non implémentée', 'info')" class="p-1 hover:bg-ci-bg rounded"><i data-lucide="more-vertical" class="w-4 h-4 text-ci-muted"></i></button>
                            </td>
                        </tr>`).join('')}
                        ${attendance.length === 0 ? '<tr><td colspan="5" class="p-8 text-center text-ci-muted">Aucun pointage aujourd&apos;hui</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function renderRecruitment() {
    const recs = filterBySite(appData.recruitment);
    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Recrutement</h2>
                <p class="text-ci-muted text-sm">Gestion des offres et candidatures</p>
            </div>
            <button onclick="openAddRecruitment()" class="bg-ci-green text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>Nouvelle offre
            </button>
        </div>

        <!-- Pipeline Stats -->
        <div class="grid grid-cols-3 gap-4">
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-green">${recs.filter(r=>r.statut==='Ouvert').length}</p>
                <p class="text-xs text-ci-muted">Ouverts</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-info">${recs.filter(r=>r.statut==='En cours').length}</p>
                <p class="text-xs text-ci-muted">En cours</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border text-center">
                <p class="text-2xl font-bold text-ci-muted">${recs.filter(r=>r.statut==='Clôturé').length}</p>
                <p class="text-xs text-ci-muted">Clôturés</p>
            </div>
        </div>

        <!-- Offers Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${recs.map(r => `
            <div class="bg-white rounded-xl p-5 border border-ci-border hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between mb-3">
                    <div>
                        <h4 class="font-semibold text-ci-text">${r.poste}</h4>
                        <p class="text-sm text-ci-muted">${r.departement} · ${sites[r.site]?.nom || r.site}</p>
                    </div>
                    <span class="${getStatutBadge(r.statut)} text-xs font-medium px-2 py-1 rounded-full">${r.statut}</span>
                </div>
                <div class="flex items-center gap-4 text-sm text-ci-muted mb-4">
                    <span class="flex items-center gap-1"><i data-lucide="briefcase" class="w-3.5 h-3.5"></i>${r.type}</span>
                    <span class="flex items-center gap-1"><i data-lucide="users" class="w-3.5 h-3.5"></i>${r.candidats} candidats</span>
                    <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3.5 h-3.5"></i>${formatDate(r.dateCreation)}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="viewRecruitment(${r.id})" class="flex-1 py-2 bg-ci-bg text-ci-text rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors text-center">Voir candidats</button>
                    <button onclick="closeRecruitment(${r.id})" class="px-3 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">
                        <i data-lucide="x-circle" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>`).join('')}
        </div>
    </div>`;
}

function openAddRecruitment() {
    openModal('Nouvelle offre de recrutement', `
        <form onsubmit="saveRecruitment(event)" class="space-y-4">
            <div><label class="block text-sm font-medium text-ci-text mb-1">Poste *</label>
                <input type="text" name="poste" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Département</label>
                    <select name="departement" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        ${['Comptabilité','Sécurité','Pédagogie','Ressources Humaines','BTP','Direction','Logistique'].map(d => `<option>${d}</option>`).join('')}
                    </select></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Type contrat</label>
                    <select name="type" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option>CDI</option><option>CDD</option><option>Stage</option>
                    </select></div>
            </div>
            <div><label class="block text-sm font-medium text-ci-text mb-1">Site</label>
                <select name="site" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    <option value="abidjan">Abidjan</option><option value="cocody">Cocody</option><option value="yopougon">Yopougon</option><option value="bouake">Bouaké</option><option value="sanpedro">San Pedro</option>
                </select></div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark">Publier</button>
            </div>
        </form>
    `);
}

function saveRecruitment(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newId = Math.max(...appData.recruitment.map(r => r.id)) + 1;
    appData.recruitment.push({
        id: newId, poste: fd.get('poste'), departement: fd.get('departement'),
        site: fd.get('site'), type: fd.get('type'), statut: 'Ouvert', candidats: 0,
        dateCreation: new Date().toISOString().split('T')[0],
    });
    closeModal(); showModule('recruitment');
    showToast('Offre publiée !');
}

function viewRecruitment(id) {
    const r = appData.recruitment.find(x => x.id === id);
    if (!r) return;
    const apps = appData.applications.filter(a => a.offerId === id);

    openModal(`Candidatures - ${r.poste}`, `
        <div class="space-y-4">
            <div class="flex items-center justify-between mb-4">
                <p class="text-sm text-ci-muted">${apps.length} candidature(s) reçue(s)</p>
            </div>
            ${apps.length === 0 ? `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-ci-bg rounded-full flex items-center justify-center mx-auto mb-3">
                    <i data-lucide="users" class="w-8 h-8 text-ci-muted"></i>
                </div>
                <p class="text-ci-muted">Aucune candidature pour le moment</p>
            </div>` : `
            <div class="space-y-3">
                ${apps.map(a => `
                <div class="bg-ci-bg rounded-xl p-4 border border-ci-border">
                    <div class="flex items-start justify-between">
                        <div>
                            <p class="font-bold text-ci-text">${a.nom} ${a.prenoms}</p>
                            <p class="text-xs text-ci-muted">${a.email} · ${a.telephone}</p>
                            <p class="text-xs text-ci-muted mt-1">Postulé le ${new Date(a.date).toLocaleDateString()}</p>
                        </div>
                        <span class="bg-ci-info text-white text-[10px] font-bold px-2 py-0.5 rounded-full">${a.statut}</span>
                    </div>
                    ${a.motivation ? `<p class="text-xs text-ci-text mt-3 bg-white p-2 rounded italic">"${a.motivation}"</p>` : ''}
                    <div class="mt-3 flex gap-2">
                        ${a.cvLink ? `<a href="${a.cvLink}" target="_blank" class="text-xs text-ci-green font-bold flex items-center gap-1"><i data-lucide="external-link" class="w-3 h-3"></i>Voir CV</a>` : ''}
                        <button onclick="showToast('Action non implémentée', 'info')" class="text-xs text-ci-info font-bold ml-auto">Contacter</button>
                    </div>
                </div>`).join('')}
            </div>`}
        </div>
    `);
}

function closeRecruitment(id) {
    const r = appData.recruitment.find(x => x.id === id);
    if (r) { r.statut = 'Clôturé'; showModule('recruitment'); showToast('Offre clôturée', 'warning'); }
}

// ========================================
// EVALUATIONS MODULE
// ========================================
function renderEvaluations() {
    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Évaluations</h2>
                <p class="text-ci-muted text-sm">Suivi des performances du personnel</p>
            </div>
            <button onclick="openAddEvaluation()" class="bg-ci-orange text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>Nouvelle évaluation
            </button>
        </div>

        <!-- Evaluation Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${appData.evaluations.map(ev => {
                const emp = getEmpById(ev.empId);
                if (!emp) return '';
                const noteColor = ev.note >= 4 ? 'text-ci-green' : ev.note >= 3 ? 'text-ci-orange' : 'text-ci-danger';
                return `
                <div class="bg-white rounded-xl p-5 border border-ci-border">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-gradient-ci flex items-center justify-center text-white font-bold text-sm">${emp.nom.charAt(0)}${emp.prenoms.charAt(0)}</div>
                            <div>
                                <p class="font-semibold text-ci-text">${emp.nom} ${emp.prenoms}</p>
                                <p class="text-xs text-ci-muted">${emp.poste} · Période: ${ev.periode}</p>
                            </div>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-bold ${noteColor}">${ev.note.toFixed(1)}</p>
                            <p class="text-xs text-ci-muted">/ 5</p>
                        </div>
                    </div>

                    <!-- Criteria Bars -->
                    <div class="space-y-2">
                        <div>
                            <div class="flex justify-between text-xs mb-1"><span class="text-ci-muted">Compétence</span><span class="font-medium">${ev.competence}/5</span></div>
                            <div class="bg-ci-bg rounded-full h-2"><div class="bg-ci-green rounded-full h-2" style="width:${ev.competence*20}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1"><span class="text-ci-muted">Rendement</span><span class="font-medium">${ev.rendement}/5</span></div>
                            <div class="bg-ci-bg rounded-full h-2"><div class="bg-ci-orange rounded-full h-2" style="width:${ev.rendement*20}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1"><span class="text-ci-muted">Assiduité</span><span class="font-medium">${ev.assiduite}/5</span></div>
                            <div class="bg-ci-bg rounded-full h-2"><div class="bg-ci-info rounded-full h-2" style="width:${ev.assiduite*20}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-xs mb-1"><span class="text-ci-muted">Comportement</span><span class="font-medium">${ev.comportement}/5</span></div>
                            <div class="bg-ci-bg rounded-full h-2"><div class="bg-purple-500 rounded-full h-2" style="width:${ev.comportement*20}%"></div></div>
                        </div>
                    </div>

                    ${ev.commentaire ? `<p class="text-xs text-ci-muted mt-3 pt-3 border-t border-ci-border italic">"${ev.commentaire}"</p>` : ''}
                    <span class="${getStatutBadge(ev.statut)} text-xs font-medium px-2 py-1 rounded-full mt-3 inline-block">${ev.statut}</span>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function openAddEvaluation() {
    openModal('Nouvelle évaluation', `
        <form onsubmit="saveEvaluation(event)" class="space-y-4">
            <div><label class="block text-sm font-medium text-ci-text mb-1">Employé *</label>
                <select name="empId" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    ${appData.employees.map(e => `<option value="${e.id}">${e.nom} ${e.prenoms} - ${e.poste}</option>`).join('')}
                </select></div>
            <div><label class="block text-sm font-medium text-ci-text mb-1">Période</label>
                <select name="periode" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    <option>2024-S1</option><option>2024-S2</option>
                </select></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Compétence (1-5)</label>
                    <input type="number" name="competence" min="1" max="5" value="3" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Rendement (1-5)</label>
                    <input type="number" name="rendement" min="1" max="5" value="3" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Assiduité (1-5)</label>
                    <input type="number" name="assiduite" min="1" max="5" value="3" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Comportement (1-5)</label>
                    <input type="number" name="comportement" min="1" max="5" value="3" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            </div>
            <div><label class="block text-sm font-medium text-ci-text mb-1">Commentaire</label>
                <textarea name="commentaire" rows="3" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green" placeholder="Commentaires..."></textarea></div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-orange text-white rounded-lg text-sm font-medium hover:bg-orange-600">Enregistrer</button>
            </div>
        </form>
    `);
}

function saveEvaluation(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const c = parseInt(fd.get('competence')), r = parseInt(fd.get('rendement'));
    const a = parseInt(fd.get('assiduite')), co = parseInt(fd.get('comportement'));
    const note = (c + r + a + co) / 4;
    const newId = Math.max(...appData.evaluations.map(ev => ev.id)) + 1;
    appData.evaluations.push({
        id: newId, empId: parseInt(fd.get('empId')), periode: fd.get('periode'),
        competence: c, rendement: r, assiduite: a, comportement: co,
        note, statut: 'Terminée', commentaire: fd.get('commentaire') || '',
    });
    closeModal(); showModule('evaluations');
    showToast('Évaluation enregistrée !');
}

// ========================================
// TRAININGS MODULE
// ========================================
function renderTrainings() {
    const trainings = filterBySite(appData.trainings || []);
    const totalBudget = trainings.reduce((sum, t) => sum + (Number(t.budget) || 0), 0);
    const totalParticipants = trainings.reduce((sum, t) => sum + ((t.participants || []).length), 0);

    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Plan de Formation</h2>
                <p class="text-ci-muted text-sm">Suivi des sessions, budgets et participants</p>
            </div>
            <button onclick="openAddTraining()" class="bg-ci-green text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>Nouvelle formation
            </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-2xl font-bold text-ci-text">${trainings.length}</p>
                <p class="text-xs text-ci-muted">Sessions prévues</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-2xl font-bold text-ci-green">${totalParticipants}</p>
                <p class="text-xs text-ci-muted">Participants inscrits</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-xl font-bold text-ci-orange">${formatMoney(totalBudget)}</p>
                <p class="text-xs text-ci-muted">Budget formation</p>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-ci-bg text-ci-muted text-xs uppercase">
                        <tr>
                            <th class="px-4 py-3 text-left">Formation</th>
                            <th class="px-4 py-3 text-left">Période</th>
                            <th class="px-4 py-3 text-left">Participants</th>
                            <th class="px-4 py-3 text-left">Budget</th>
                            <th class="px-4 py-3 text-left">Statut</th>
                            <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trainings.map(t => `
                        <tr class="table-row border-t border-ci-border">
                            <td class="px-4 py-3">
                                <p class="font-semibold text-ci-text">${t.titre}</p>
                                <p class="text-xs text-ci-muted">${t.organisme} · ${t.departement}</p>
                            </td>
                            <td class="px-4 py-3 text-ci-muted">${formatDate(t.debut)} - ${formatDate(t.fin)}</td>
                            <td class="px-4 py-3 text-ci-text">${(t.participants || []).length}</td>
                            <td class="px-4 py-3 font-medium text-ci-text">${formatMoney(t.budget || 0)}</td>
                            <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-[10px] font-bold ${t.statut === 'Validée' ? 'badge-success' : t.statut === 'Planifiée' ? 'badge-info' : 'badge-warning'}">${t.statut}</span></td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="validateTraining(${t.id})" class="p-2 hover:bg-ci-bg rounded-lg" title="Valider"><i data-lucide="check" class="w-4 h-4 text-ci-green"></i></button>
                                <button onclick="deleteTraining(${t.id})" class="p-2 hover:bg-red-50 rounded-lg" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4 text-ci-danger"></i></button>
                            </td>
                        </tr>`).join('')}
                        ${trainings.length === 0 ? '<tr><td colspan="6" class="p-8 text-center text-ci-muted">Aucune formation enregistrée</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function openAddTraining() {
    openModal('Nouvelle formation', `
        <form onsubmit="saveTraining(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Intitulé</label>
                    <input name="titre" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Organisme</label>
                    <input name="organisme" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Département</label>
                    <input name="departement" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Site</label>
                    <select name="site" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        ${Object.entries(sites).filter(([id]) => id !== 'all').map(([id, site]) => `<option value="${id}">${site.nom}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Budget</label>
                    <input type="number" name="budget" min="0" value="0" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Début</label>
                    <input type="date" name="debut" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Fin</label>
                    <input type="date" name="fin" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-ci-text mb-1">Participants</label>
                <select name="participants" multiple class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green h-32">
                    ${appData.employees.map(e => `<option value="${e.id}">${e.matricule} - ${e.nom} ${e.prenoms}</option>`).join('')}
                </select>
            </div>
            <div class="flex justify-end gap-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-green text-white rounded-lg text-sm font-medium">Enregistrer</button>
            </div>
        </form>
    `);
}

function saveTraining(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const participants = Array.from(e.target.participants.selectedOptions).map(option => parseInt(option.value));
    appData.trainings.push({
        id: Math.max(0, ...appData.trainings.map(t => t.id)) + 1,
        titre: fd.get('titre'),
        organisme: fd.get('organisme'),
        departement: fd.get('departement'),
        site: fd.get('site'),
        debut: fd.get('debut'),
        fin: fd.get('fin'),
        budget: parseInt(fd.get('budget')) || 0,
        statut: 'Planifiée',
        participants,
    });
    closeModal(); saveToLocalStorage(); showModule('trainings'); showToast('Formation ajoutée !');
}

function validateTraining(id) {
    const training = appData.trainings.find(t => t.id === id);
    if (!training) return;
    training.statut = 'Validée';
    saveToLocalStorage(); showModule('trainings'); showToast('Formation validée !');
}

function deleteTraining(id) {
    if (!confirm('Supprimer cette formation ?')) return;
    appData.trainings = appData.trainings.filter(t => t.id !== id);
    saveToLocalStorage(); showModule('trainings'); showToast('Formation supprimée', 'warning');
}

// ========================================
// DOCUMENTS MODULE
// ========================================
function renderDocuments() {
    const documents = appData.documents || [];
    const expiring = documents.filter(d => d.expiration && new Date(d.expiration) <= new Date(Date.now() + 1000 * 60 * 60 * 24 * 45)).length;

    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Dossier Administratif</h2>
                <p class="text-ci-muted text-sm">Contrats, pièces RH, conventions et justificatifs</p>
            </div>
            <button onclick="openAddDocument()" class="bg-ci-green text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>Nouveau document
            </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-2xl font-bold text-ci-text">${documents.length}</p>
                <p class="text-xs text-ci-muted">Documents indexés</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-2xl font-bold text-ci-orange">${expiring}</p>
                <p class="text-xs text-ci-muted">À renouveler bientôt</p>
            </div>
            <div class="stat-card bg-white rounded-xl p-4 border border-ci-border">
                <p class="text-2xl font-bold text-ci-green">${documents.filter(d => d.statut === 'Valide').length}</p>
                <p class="text-xs text-ci-muted">Documents valides</p>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-ci-bg text-ci-muted text-xs uppercase">
                        <tr>
                            <th class="px-4 py-3 text-left">Document</th>
                            <th class="px-4 py-3 text-left">Employé</th>
                            <th class="px-4 py-3 text-left">Référence</th>
                            <th class="px-4 py-3 text-left">Expiration</th>
                            <th class="px-4 py-3 text-left">Statut</th>
                            <th class="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${documents.map(d => `
                        <tr class="table-row border-t border-ci-border">
                            <td class="px-4 py-3">
                                <p class="font-semibold text-ci-text">${d.titre}</p>
                                <p class="text-xs text-ci-muted">${d.type}</p>
                            </td>
                            <td class="px-4 py-3 text-ci-muted">${getEmpName(d.empId)}</td>
                            <td class="px-4 py-3 text-ci-text">${d.reference || '-'}</td>
                            <td class="px-4 py-3 text-ci-muted">${formatDate(d.expiration)}</td>
                            <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-[10px] font-bold ${d.statut === 'Valide' ? 'badge-success' : d.statut === 'Archivé' ? 'badge-muted' : 'badge-warning'}">${d.statut}</span></td>
                            <td class="px-4 py-3 text-right">
                                <button onclick="archiveDocument(${d.id})" class="p-2 hover:bg-ci-bg rounded-lg" title="Archiver"><i data-lucide="archive" class="w-4 h-4 text-ci-muted"></i></button>
                                <button onclick="deleteDocument(${d.id})" class="p-2 hover:bg-red-50 rounded-lg" title="Supprimer"><i data-lucide="trash-2" class="w-4 h-4 text-ci-danger"></i></button>
                            </td>
                        </tr>`).join('')}
                        ${documents.length === 0 ? '<tr><td colspan="6" class="p-8 text-center text-ci-muted">Aucun document enregistré</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>`;
}

function openAddDocument() {
    openModal('Nouveau document RH', `
        <form onsubmit="saveDocument(event)" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Employé</label>
                    <select name="empId" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        ${appData.employees.map(e => `<option value="${e.id}">${e.matricule} - ${e.nom} ${e.prenoms}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Type</label>
                    <select name="type" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option>Contrat</option><option>Pièce RH</option><option>Diplôme</option><option>Stage</option><option>Sanction</option><option>Autre</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Titre</label>
                    <input name="titre" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Référence</label>
                    <input name="reference" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Date document</label>
                    <input type="date" name="date" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Expiration</label>
                    <input type="date" name="expiration" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
            </div>
            <div class="flex justify-end gap-3 pt-4">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-green text-white rounded-lg text-sm font-medium">Enregistrer</button>
            </div>
        </form>
    `);
}

function saveDocument(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    appData.documents.push({
        id: Math.max(0, ...appData.documents.map(d => d.id)) + 1,
        empId: parseInt(fd.get('empId')),
        type: fd.get('type'),
        titre: fd.get('titre'),
        reference: fd.get('reference'),
        date: fd.get('date'),
        expiration: fd.get('expiration'),
        statut: fd.get('expiration') ? 'Valide' : 'Valide',
    });
    closeModal(); saveToLocalStorage(); showModule('documents'); showToast('Document ajouté !');
}

function archiveDocument(id) {
    const documentRh = appData.documents.find(d => d.id === id);
    if (!documentRh) return;
    documentRh.statut = 'Archivé';
    saveToLocalStorage(); showModule('documents'); showToast('Document archivé');
}

function deleteDocument(id) {
    if (!confirm('Supprimer ce document ?')) return;
    appData.documents = appData.documents.filter(d => d.id !== id);
    saveToLocalStorage(); showModule('documents'); showToast('Document supprimé', 'warning');
}

// ========================================
// CONTRACTS MODULE
// ========================================
function renderContracts() {
    return `
    <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 class="text-2xl font-bold text-ci-text">Gestion des Contrats</h2>
                <p class="text-ci-muted text-sm">${appData.contracts.length} contrats enregistrés</p>
            </div>
            <button onclick="openAddContract()" class="bg-ci-green text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors flex items-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>Nouveau contrat
            </button>
        </div>

        <!-- Contracts List -->
        <div class="space-y-3">
            ${appData.contracts.map(c => {
                const emp = getEmpById(c.empId);
                if (!emp) return '';
                return `
                <div class="bg-white rounded-xl p-4 border border-ci-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${c.type === 'CDI' ? 'bg-green-100 text-ci-green' : c.type === 'CDD' ? 'bg-orange-100 text-ci-orange' : 'bg-blue-100 text-ci-info'} flex items-center justify-center text-sm font-bold">
                            ${c.type.charAt(0)}
                        </div>
                        <div>
                            <p class="font-medium text-ci-text">${emp.nom} ${emp.prenoms}</p>
                            <p class="text-sm text-ci-muted">${emp.poste} · ${c.type}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 text-sm">
                        <div class="text-center">
                            <p class="text-xs text-ci-muted">Début</p>
                            <p class="font-medium text-ci-text">${formatDate(c.debut)}</p>
                        </div>
                        <i data-lucide="arrow-right" class="w-4 h-4 text-ci-muted hidden sm:block"></i>
                        <div class="text-center">
                            <p class="text-xs text-ci-muted">Fin</p>
                            <p class="font-medium text-ci-text">${c.fin ? formatDate(c.fin) : 'Indéterminée'}</p>
                        </div>
                        <span class="${getStatutBadge(c.statut)} text-xs font-medium px-2 py-1 rounded-full">${c.statut}</span>
                        <button onclick="generateContract(${c.empId})" class="p-2 hover:bg-ci-bg rounded-lg" title="Générer PDF">
                            <i data-lucide="file-text" class="w-4 h-4 text-ci-orange"></i>
                        </button>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>`;
}

function openAddContract() {
    openModal('Nouveau contrat', `
        <form onsubmit="saveContract(event)" class="space-y-4">
            <div><label class="block text-sm font-medium text-ci-text mb-1">Employé *</label>
                <select name="empId" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    ${appData.employees.map(e => `<option value="${e.id}">${e.nom} ${e.prenoms}</option>`).join('')}
                </select></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Type</label>
                    <select name="type" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                        <option>CDI</option><option>CDD</option><option>Stage</option>
                    </select></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Salaire Annuel (FCFA)</label>
                    <input type="number" name="salaireAnnuel" min="0" step="10000" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-sm font-medium text-ci-text mb-1">Date début</label>
                    <input type="date" name="debut" required class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
                <div><label class="block text-sm font-medium text-ci-text mb-1">Date fin</label>
                    <input type="date" name="fin" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green"></div>
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Annuler</button>
                <button type="submit" class="px-4 py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark">Enregistrer</button>
            </div>
        </form>
    `);
}

function saveContract(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newId = Math.max(...appData.contracts.map(c => c.id)) + 1;
    appData.contracts.push({
        id: newId, empId: parseInt(fd.get('empId')), type: fd.get('type'),
        debut: fd.get('debut'), fin: fd.get('fin') || '', statut: 'Actif',
        salaireAnnuel: parseInt(fd.get('salaireAnnuel')) || 0,
    });
    closeModal(); showModule('contracts');
    showToast('Contrat ajouté !');
}

function generateContract(empId) {
    const emp = getEmpById(empId);
    if (!emp) return;
    const contract = appData.contracts.find(c => c.empId === empId) || { type: emp.type, debut: emp.dateEmbauche, fin: '' };

    openModal(`Contrat ${contract.type} - ${emp.nom} ${emp.prenoms}`, `
        <div class="contract-content text-sm text-ci-text" id="contractContent">
            <div class="text-center mb-6">
                <h2 class="text-lg font-bold">CONTRAT DE TRAVAIL ${contract.type}</h2>
                <p class="text-ci-muted text-xs">Régi par le Code du Travail de la République de Côte d'Ivoire</p>
            </div>

            <p class="mb-4">Entre les soussignés :</p>
            <p class="mb-4 pl-4"><strong>L'Employeur :</strong> [Raison sociale de l'entreprise], dont le siège social est situé à [Adresse], représentée par [Nom du représentant], en sa qualité de [Fonction].</p>

            <p class="mb-4">Et :</p>
            <p class="mb-4 pl-4"><strong>Le Salarié :</strong> <strong>${emp.nom} ${emp.prenoms}</strong>, demeurant à [Adresse du salarié], titulaire de la pièce d'identité n° [N° PI], né(e) le [Date de naissance] à [Lieu].</p>

            <h2>Article 1 - Objet du contrat</h2>
            <p>Le présent contrat a pour objet l'engagement du salarié en qualité de <strong>${emp.poste}</strong>, au sein du département <strong>${emp.departement}</strong>, sur le site de <strong>${sites[emp.site]?.nom || emp.site}</strong>.</p>

            <h2>Article 2 - Type de contrat</h2>
            <p>Le présent contrat est un contrat à <strong>${contract.type === 'CDI' ? 'durée indéterminée' : contract.type === 'CDD' ? 'durée déterminée' : 'de stage professionnel'}</strong>.</p>
            ${contract.type !== 'CDI' ? `<p>Date de fin prévue : <strong>${contract.fin ? formatDate(contract.fin) : 'À définir'}</strong></p>` : ''}

            <h2>Article 3 - Rémunération</h2>
            <p>Le salarié percevra un salaire de base mensuel de <strong>${formatMoney(emp.salaireBase)}</strong>, soumis aux cotisations sociales (CNPS) et à l'Impôt Général sur le Revenu (IGR) conformément à la législation ivoirienne.</p>

            <h2>Article 4 - Durée du travail</h2>
            <p>La durée légale du travail est fixée à 40 heures par semaine, conformément aux dispositions du Code du Travail ivoirien.</p>

            <h2>Article 5 - Congés</h2>
            <p>Le salarié bénéficie d'un congé annuel de 26 jours ouvrables (2,16 jours par mois de travail effectif), conformément à la législation en vigueur en République de Côte d'Ivoire.</p>

            <h2>Article 6 - Affiliation CNPS</h2>
            <p>L'employeur s'engage à affilier le salarié à la Caisse Nationale de Prévoyance Sociale (CNPS) dans les délais prévus par la loi. N° CNPS : <strong>${emp.cnps || 'À obtenir'}</strong></p>

            <h2>Article 7 - Préavis</h2>
            <p>En cas de rupture du contrat, le préavis est fixé à :<br>- 1 mois pour les employés ayant moins de 6 mois d'ancienneté<br>- 1 mois pour ceux ayant entre 6 mois et 2 ans<br>- 2 mois pour ceux ayant plus de 2 ans d'ancienneté</p>

            <h2>Article 8 - Discipline et hygiène</h2>
            <p>Le salarié est tenu de respecter le règlement intérieur de l'entreprise ainsi que les mesures d'hygiène et de sécurité en vigueur.</p>

            <div class="mt-8 flex justify-between pt-4 border-t">
                <div><p class="font-semibold mb-8">Pour l'Employeur</p><hr class="w-40"></div>
                <div class="text-right"><p class="font-semibold mb-8">Le Salarié</p><hr class="w-40 ml-auto"></div>
            </div>

            <p class="text-center text-xs text-ci-muted mt-4">Fait à ${sites[emp.site]?.nom?.split(' - ')[0] || 'Abidjan'}, le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div class="flex gap-2 mt-4 pt-4 border-t no-print">
            <button onclick="printContract()" class="flex-1 py-2 bg-ci-orange text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <i data-lucide="printer" class="w-4 h-4"></i>Imprimer
            </button>
            <button onclick="closeModal()" class="px-4 py-2 border border-ci-border rounded-lg text-sm text-ci-muted hover:bg-ci-bg">Fermer</button>
        </div>
    `);
}

function printContract() {
    const content = document.getElementById('contractContent');
    if (!content) return;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Contrat de Travail</title><style>body{font-family:serif;font-size:12px;padding:30px;max-width:800px;margin:auto;}h2{font-size:14px;font-weight:bold;margin-top:1rem;border-bottom:1px solid #ccc;padding-bottom:4px;}p{text-align:justify;margin-bottom:0.5rem;}</style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.print();
}

// ========================================
// REPORTS MODULE
// ========================================
function renderReports() {
    const emps = filterBySite(appData.employees);
    const totalBrut = emps.reduce((s, e) => s + calculatePaie(e).brut, 0);
    const totalNet = emps.reduce((s, e) => s + calculatePaie(e).net, 0);
    const totalCNPS = emps.reduce((s, e) => s + calculatePaie(e).cnpsPatronal, 0);

    const reports = [
        { nom: 'Effectifs par département', desc: 'Répartition des employés par département', icon: 'building', color: 'bg-blue-50 text-ci-info' },
        { nom: 'Masse salariale', desc: `Brut: ${formatMoney(totalBrut)} | Net: ${formatMoney(totalNet)}`, icon: 'banknote', color: 'bg-green-50 text-ci-green' },
        { nom: 'Bilan CNPS', desc: `Total patronal: ${formatMoney(totalCNPS)}`, icon: 'shield', color: 'bg-orange-50 text-ci-orange' },
        { nom: 'Balance âge', desc: 'Pyramide des âges du personnel', icon: 'bar-chart-3', color: 'bg-purple-50 text-purple-600' },
        { nom: 'Turn-over', desc: 'Taux de rotation du personnel', icon: 'refresh-cw', color: 'bg-red-50 text-ci-danger' },
        { nom: 'Congés consommés', desc: `${appData.leaves.filter(l=>l.statut==='Approuvé').length} congés approuvés`, icon: 'palmtree', color: 'bg-yellow-50 text-yellow-600' },
        { nom: 'Coût par site', desc: 'Répartition des coûts multi-sites', icon: 'map-pin', color: 'bg-indigo-50 text-indigo-600' },
        { nom: 'Export DSN', desc: 'Déclaration sociale nominative', icon: 'file-down', color: 'bg-teal-50 text-teal-600' },
    ];

    return `
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold text-ci-text">Rapports & Statistiques</h2>
            <p class="text-ci-muted text-sm">Générez et consultez vos rapports RH</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            ${reports.map(r => `
            <div class="stat-card bg-white rounded-xl p-5 border border-ci-border cursor-pointer hover:shadow-md" onclick="generateReport('${r.nom}')">
                <div class="w-10 h-10 ${r.color} rounded-lg flex items-center justify-center mb-3">
                    <i data-lucide="${r.icon}" class="w-5 h-5"></i>
                </div>
                <h4 class="font-semibold text-ci-text text-sm">${r.nom}</h4>
                <p class="text-xs text-ci-muted mt-1">${r.desc}</p>
            </div>`).join('')}
        </div>

        <!-- Quick Stats -->
        <div class="bg-white rounded-xl p-6 border border-ci-border">
            <h3 class="font-semibold text-ci-text mb-4 flex items-center gap-2">
                <i data-lucide="activity" class="w-4 h-4 text-ci-green"></i>
                Indicateurs Clés - ${appData.payroll.mois}
            </h3>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="p-4 bg-ci-bg rounded-lg text-center">
                    <p class="text-2xl font-bold text-ci-text">${emps.length}</p>
                    <p class="text-xs text-ci-muted">Effectif total</p>
                </div>
                <div class="p-4 bg-ci-bg rounded-lg text-center">
                    <p class="text-2xl font-bold text-ci-green">${formatMoney(totalNet)}</p>
                    <p class="text-xs text-ci-muted">Masse nette</p>
                </div>
                <div class="p-4 bg-ci-bg rounded-lg text-center">
                    <p class="text-2xl font-bold text-ci-orange">${formatMoney(totalCNPS)}</p>
                    <p class="text-xs text-ci-muted">Charges patronales</p>
                </div>
                <div class="p-4 bg-ci-bg rounded-lg text-center">
                    <p class="text-2xl font-bold text-ci-info">${appData.leaves.filter(l => l.statut === 'En attente').length}</p>
                    <p class="text-xs text-ci-muted">Congés en attente</p>
                </div>
            </div>
        </div>
    </div>`;
}

function generateReport(name) {
    showToast(`Rapport "${name}" en cours de génération...`, 'info');
}

// ========================================
// ACCOUNTING API MODULE
// ========================================
function renderAccounting() {
    return `
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold text-ci-text">API Comptabilité</h2>
            <p class="text-ci-muted text-sm">Intégration avec votre système comptable</p>
        </div>

        <!-- Connection Status -->
        <div class="bg-white rounded-xl p-6 border border-ci-border">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-3 h-3 rounded-full bg-ci-green pulse-dot"></div>
                <span class="text-sm font-medium text-ci-green">Connecté au système comptable</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-4 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Dernière synchronisation</p>
                    <p class="text-sm font-medium text-ci-text">${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</p>
                </div>
                <div class="p-4 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Écritures synchronisées</p>
                    <p class="text-sm font-medium text-ci-text">24 ce mois</p>
                </div>
                <div class="p-4 bg-ci-bg rounded-lg">
                    <p class="text-xs text-ci-muted">Journal comptable</p>
                    <p class="text-sm font-medium text-ci-text">JRN-RH-001</p>
                </div>
            </div>
        </div>

        <!-- API Endpoints -->
        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="px-5 py-3 bg-ci-bg border-b border-ci-border">
                <h3 class="font-semibold text-ci-text text-sm flex items-center gap-2">
                    <i data-lucide="code" class="w-4 h-4 text-ci-orange"></i>
                    Endpoints API disponibles
                </h3>
            </div>
            <div class="divide-y divide-ci-border">
                ${[
                    { method: 'GET', path: '/api/v1/employees', desc: 'Liste des employés', color: 'bg-ci-info' },
                    { method: 'GET', path: '/api/v1/payroll/monthly', desc: 'Données paie mensuelle', color: 'bg-ci-info' },
                    { method: 'POST', path: '/api/v1/payroll/export', desc: 'Exporter écritures comptables', color: 'bg-ci-green' },
                    { method: 'GET', path: '/api/v1/cnps/declarations', desc: 'Déclarations CNPS', color: 'bg-ci-info' },
                    { method: 'POST', path: '/api/v1/sync/compta', desc: 'Synchroniser avec la compta', color: 'bg-ci-green' },
                    { method: 'GET', path: '/api/v1/reports/balance', desc: 'Balance comptable RH', color: 'bg-ci-info' },
                ].map(ep => `
                <div class="px-5 py-3 flex items-center justify-between gap-3 hover:bg-ci-bg/50 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="${ep.color} text-white text-xs font-bold px-2 py-1 rounded">${ep.method}</span>
                        <code class="text-sm text-ci-text font-mono">${ep.path}</code>
                    </div>
                    <p class="text-xs text-ci-muted hidden sm:block">${ep.desc}</p>
                </div>`).join('')}
            </div>
        </div>

        <!-- Export Options -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-white rounded-xl p-5 border border-ci-border">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <i data-lucide="file-spreadsheet" class="w-5 h-5 text-ci-green"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-ci-text text-sm">Export Sage / Compta</h4>
                        <p class="text-xs text-ci-muted">Format compatible Sage, Ciel Compta</p>
                    </div>
                </div>
                <button onclick="exportPayrollCSV()" class="w-full py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors">
                    Exporter les écritures
                </button>
            </div>

            <div class="bg-white rounded-xl p-5 border border-ci-border">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <i data-lucide="shield" class="w-5 h-5 text-ci-orange"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-ci-text text-sm">Déclaration CNPS</h4>
                        <p class="text-xs text-ci-muted">Formulaire de déclaration sociale</p>
                    </div>
                </div>
                <button onclick="showToast('Déclaration CNPS générée !', 'success')" class="w-full py-2 bg-ci-orange text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    Générer déclaration
                </button>
            </div>
        </div>

        <!-- Webhook Config -->
        <div class="bg-white rounded-xl p-5 border border-ci-border">
            <h3 class="font-semibold text-ci-text mb-4 flex items-center gap-2">
                <i data-lucide="webhook" class="w-4 h-4 text-ci-info"></i>
                Configuration Webhook
            </h3>
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">URL du Webhook</label>
                    <input type="url" value="https://compta.votre-entreprise.ci/webhook/sirh" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Clé API</label>
                    <div class="flex gap-2">
                        <input type="password" value="sk-sirh-xxxxxxxxxxxxxxxxxxxx" class="flex-1 px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green font-mono" id="apiKey">
                        <button onclick="showToast('Clé API copiée !', 'info')" class="px-3 py-2 bg-ci-bg border border-ci-border rounded-lg text-ci-text hover:bg-gray-200">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

// ========================================
// SUPPORT MODULE
// ========================================
function renderSupport() {
    return `
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold text-ci-text">Support & Aide</h2>
            <p class="text-ci-muted text-sm">Besoin d'aide ? Nous sommes là pour vous.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl p-6 border border-ci-border text-center">
                <div class="w-12 h-12 bg-ci-orangeLight rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="phone" class="w-6 h-6 text-ci-orange"></i>
                </div>
                <h4 class="font-bold text-ci-text">Assistance Téléphonique</h4>
                <p class="text-sm text-ci-muted mt-2">Du Lundi au Vendredi<br>8h00 - 18h00</p>
                <p class="text-ci-orange font-bold mt-3">+225 27 22 00 00 00</p>
            </div>
            <div class="bg-white rounded-xl p-6 border border-ci-border text-center">
                <div class="w-12 h-12 bg-ci-greenLight rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="mail" class="w-6 h-6 text-ci-green"></i>
                </div>
                <h4 class="font-bold text-ci-text">Support Email</h4>
                <p class="text-sm text-ci-muted mt-2">Réponse sous 24 heures maximum</p>
                <p class="text-ci-green font-bold mt-3">support@sirh.ci</p>
            </div>
            <div class="bg-white rounded-xl p-6 border border-ci-border text-center">
                <div class="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="message-square" class="w-6 h-6 text-ci-info"></i>
                </div>
                <h4 class="font-bold text-ci-text">Chat en direct</h4>
                <p class="text-sm text-ci-muted mt-2">Discutez avec un conseiller RH en ligne</p>
                <button class="mt-4 px-4 py-2 bg-ci-info text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">Démarrer le chat</button>
            </div>
        </div>

        <div class="bg-white rounded-xl border border-ci-border overflow-hidden">
            <div class="px-6 py-4 border-b border-ci-border bg-ci-bg">
                <h3 class="font-bold text-ci-text">Foire Aux Questions (FAQ)</h3>
            </div>
            <div class="divide-y divide-ci-border">
                ${[
                    { q: "Comment lancer la paie mensuelle ?", a: "Allez dans le module 'Paie', vérifiez les données et cliquez sur 'Lancer la paie'." },
                    { q: "Comment ajouter un nouveau site ?", a: "Contactez votre administrateur système ou allez dans les paramètres avancés." },
                    { q: "Calcul de l'IGR en Côte d'Ivoire", a: "L'application utilise le barème progressif officiel de la DGI Côte d'Ivoire." },
                    { q: "Génération de contrats de travail", a: "Dans le module 'Employés', cliquez sur 'Voir' puis 'Générer Contrat'." },
                ].map(item => `
                <div class="p-4 hover:bg-gray-50 transition-colors">
                    <p class="font-semibold text-sm text-ci-text mb-1">${item.q}</p>
                    <p class="text-sm text-ci-muted">${item.a}</p>
                </div>`).join('')}
            </div>
        </div>
    </div>`;
}

// ========================================
// SETTINGS MODULE
// ========================================
function renderSettings() {
    return `
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold text-ci-text">Paramètres</h2>
            <p class="text-ci-muted text-sm">Configurez les informations de votre entreprise</p>
        </div>

        <div class="bg-white rounded-xl p-6 border border-ci-border">
            <form onsubmit="saveSettings(event)" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-ci-text mb-1">Raison Sociale</label>
                        <input type="text" name="companyName" value="${appData.settings.companyName}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-ci-text mb-1">Registre de Commerce (RC)</label>
                        <input type="text" name="rc" value="${appData.settings.rc}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-ci-text mb-1">Compte Contribuable (CC)</label>
                        <input type="text" name="cc" value="${appData.settings.cc}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-ci-text mb-1">N° Employeur CNPS</label>
                        <input type="text" name="cnps_employer" value="${appData.settings.cnps_employer}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-ci-text mb-1">Adresse Siège</label>
                    <input type="text" name="address" value="${appData.settings.address}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-ci-text mb-1">Téléphone</label>
                        <input type="tel" name="phone" value="${appData.settings.phone}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-ci-text mb-1">Email Contact</label>
                        <input type="email" name="email" value="${appData.settings.email}" class="w-full px-3 py-2 border border-ci-border rounded-lg text-sm focus:outline-none focus:border-ci-green">
                    </div>
                </div>
                <div class="pt-4 flex justify-end">
                    <button type="submit" class="px-6 py-2 bg-ci-green text-white rounded-lg text-sm font-medium hover:bg-ci-greenDark transition-colors">
                        Enregistrer les modifications
                    </button>
                </div>
            </form>
        </div>

        <div class="bg-white rounded-xl p-6 border border-ci-border">
            <h3 class="font-bold text-ci-text mb-4 text-red-600">Zone de Danger</h3>
            <p class="text-sm text-ci-muted mb-4">La réinitialisation des données supprimera tous les employés, congés et historiques. Cette action est irréversible.</p>
            <button onclick="resetData()" class="px-4 py-2 border border-ci-danger text-ci-danger rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Réinitialiser toutes les données
            </button>
        </div>
    </div>`;
}

function saveSettings(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    appData.settings.companyName = fd.get('companyName');
    appData.settings.rc = fd.get('rc');
    appData.settings.cc = fd.get('cc');
    appData.settings.cnps_employer = fd.get('cnps_employer');
    appData.settings.address = fd.get('address');
    appData.settings.phone = fd.get('phone');
    appData.settings.email = fd.get('email');
    saveToLocalStorage();
    showToast('Paramètres enregistrés !');
}

function resetData() {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les données ?')) {
        localStorage.removeItem('sirh_data');
        location.reload();
    }
}

// ========================================
// MODAL SYSTEM
// ========================================
function openModal(title, body) {
    const modal = document.getElementById('modal');
    const mTitle = document.getElementById('modalTitle');
    const mBody = document.getElementById('modalBody');
    mTitle.innerText = title;
    mBody.innerHTML = body;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons({ nodes: [mBody] });
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', async () => {
    // Initial UI state (Loading)
    const container = document.getElementById('moduleContainer');
    if (container) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 space-y-4">
                <div class="animate-spin w-10 h-10 border-4 border-ci-green border-t-transparent rounded-full"></div>
                <p class="text-ci-muted text-xs font-black uppercase tracking-widest">Initialisation des données...</p>
            </div>
        `;
    }

    // Try to load from server first
    await loadFromServer();
    
    // If server load failed, ensure we at least show defaults
    if (!isDataLoaded) {
        console.warn('SIRH: Échec du chargement serveur, utilisation des données locales.');
        isDataLoaded = true; // Allow rendering with defaults
    }

    // Show the starting module
    showModule(appData.currentModule || 'dashboard');
    lucide.createIcons();

    // Setup auto-save every 15 seconds
    setInterval(saveToServer, 15000);
});
