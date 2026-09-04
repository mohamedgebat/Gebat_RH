const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'sirh.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite:', err.message);
    } else {
        console.log('Connected to SIRH SQLite database.');
        // Activation du mode Write-Ahead Logging (WAL) et du cache pour haute concurrence (+500 employés)
        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA synchronous = NORMAL;");
        db.run("PRAGMA cache_size = -64000;"); // 64 MB RAM Cache
        db.run("PRAGMA foreign_keys = ON;");
        initSchema();
    }
});
function initSchema() {
    db.serialize(() => {
        // COMPANIES (Multi-Tenant)
        db.run(`CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rc TEXT,
            cc TEXT,
            cnps_employer TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            logo TEXT,
            primaryColor TEXT DEFAULT '#009E49',
            secondaryColor TEXT DEFAULT '#F77F00',
            tenantSlug TEXT UNIQUE DEFAULT 'demo.sirh-civ.ci',
            saasPlan TEXT DEFAULT 'BUSINESS PRO',
            maxEmployees INTEGER DEFAULT 50,
            status TEXT DEFAULT 'Actif',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        // SETTINGS
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            companyName TEXT,
            rc TEXT,
            cc TEXT,
            cnps_employer TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            logo TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // DEPARTMENTS
        db.run(`CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            code TEXT,
            nom TEXT NOT NULL,
            description TEXT,
            responsable_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // POSITIONS
        db.run(`CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            titre TEXT NOT NULL,
            departement TEXT,
            salaireMin REAL DEFAULT 0,
            salaireMax REAL DEFAULT 0,
            description TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // EMPLOYEES
        db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            matricule TEXT UNIQUE,
            nom TEXT,
            prenoms TEXT,
            poste TEXT,
            departement TEXT,
            site TEXT,
            type TEXT,
            statut TEXT,
            dateEmbauche TEXT,
            salaireBase REAL,
            sexe TEXT,
            telephone TEXT,
            email TEXT,
            cnps TEXT,
            nbEnfants INTEGER,
            situationMatrimoniale TEXT DEFAULT 'Célibataire',
            rib TEXT,
            attestationTravail INTEGER DEFAULT 0,
            attestationStage INTEGER DEFAULT 0,
            attestationSalaire INTEGER DEFAULT 0,
            photo TEXT,
            username TEXT UNIQUE,
            password TEXT,
            compteActif INTEGER DEFAULT 1,
            responsable TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // LEAVES
        db.run(`CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            type TEXT,
            debut TEXT,
            fin TEXT,
            duree INTEGER,
            statut TEXT,
            motif TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // LEAVE BALANCES
        db.run(`CREATE TABLE IF NOT EXISTS leave_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER NOT NULL,
            annee INTEGER NOT NULL,
            acquis REAL DEFAULT 26.4,
            pris REAL DEFAULT 0,
            solde REAL DEFAULT 26.4,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id),
            UNIQUE(company_id, empId, annee)
        )`);

        // RECRUITMENT (Offers)
        db.run(`CREATE TABLE IF NOT EXISTS recruitment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            poste TEXT,
            departement TEXT,
            site TEXT,
            type TEXT,
            statut TEXT,
            competences TEXT DEFAULT '',
            experience TEXT DEFAULT '',
            criteres TEXT DEFAULT '',
            mots_cles TEXT DEFAULT '',
            candidats INTEGER DEFAULT 0,
            dateCreation TEXT,
            dateFin TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // APPLICATIONS
        db.run(`CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            offerId INTEGER,
            nom TEXT,
            prenoms TEXT,
            email TEXT,
            telephone TEXT,
            cv TEXT, -- Base64
            lm TEXT, -- Base64
            date TEXT,
            statut TEXT,
            motivation TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(offerId) REFERENCES recruitment(id)
        )`);

        // ATTENDANCE
        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            matricule TEXT,
            nom TEXT,
            type TEXT,
            timestamp TEXT,
            site TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // ATTENDANCE SETTINGS (Horaires & Barèmes Taux)
        db.run(`CREATE TABLE IF NOT EXISTS attendance_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER UNIQUE DEFAULT 1,
            heure_arrivee_officielle TEXT DEFAULT '08:00',
            heure_depart_officiel TEXT DEFAULT '17:00',
            marge_tolerance_minutes INTEGER DEFAULT 15,
            taux_horaire_base REAL DEFAULT 2500,
            taux_journalier_base REAL DEFAULT 20000,
            taux_majoration_heures_sup REAL DEFAULT 25,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // Insert default attendance settings for company_id = 1 if missing
        db.run(`INSERT OR IGNORE INTO attendance_settings (company_id, heure_arrivee_officielle, heure_depart_officiel, marge_tolerance_minutes, taux_horaire_base, taux_journalier_base, taux_majoration_heures_sup)
                VALUES (1, '08:00', '17:00', 15, 2500, 20000, 25)`);

        // EVALUATIONS
        db.run(`CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            periode TEXT,
            competence INTEGER,
            rendement INTEGER,
            assiduite INTEGER,
            comportement INTEGER,
            note REAL,
            statut TEXT,
            commentaire TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // CONTRACTS
        db.run(`CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            type TEXT,
            debut TEXT,
            fin TEXT,
            statut TEXT,
            salaireAnnuel REAL,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // TRAININGS
        db.run(`CREATE TABLE IF NOT EXISTS trainings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            titre TEXT,
            departement TEXT,
            date TEXT,
            participants INTEGER DEFAULT 0,
            statut TEXT DEFAULT 'Planifiée',
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // DOCUMENTS
        db.run(`CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            nom TEXT,
            type TEXT,
            taille TEXT,
            dossier TEXT DEFAULT 'Ressources Humaines',
            date TEXT,
            url_content TEXT,
            is_deleted INTEGER DEFAULT 0,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // PAYROLL HISTORY / PERIODS
        db.run(`CREATE TABLE IF NOT EXISTS payroll_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            periode TEXT,
            dateCloture TEXT,
            masseNette REAL,
            masseBrute REAL,
            nbEmployes INTEGER,
            statut TEXT DEFAULT 'Clôturé',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS payroll_periods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            periode TEXT,
            dateDebut TEXT,
            dateFin TEXT,
            masseNette REAL,
            masseBrute REAL,
            nbEmployes INTEGER,
            statut TEXT DEFAULT 'Clôturé',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // PAYROLL RECORDS (Individual Payslips)
        db.run(`CREATE TABLE IF NOT EXISTS payroll_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            period_id INTEGER,
            empId INTEGER NOT NULL,
            periode TEXT NOT NULL,
            base REAL DEFAULT 0,
            seniorityYears INTEGER DEFAULT 0,
            primeAnc REAL DEFAULT 0,
            transport REAL DEFAULT 30000,
            logement REAL DEFAULT 0,
            risque REAL DEFAULT 0,
            sursalaire REAL DEFAULT 0,
            brutTotal REAL DEFAULT 0,
            brutImposable REAL DEFAULT 0,
            cnpsBase REAL DEFAULT 0,
            cnpsSalarial REAL DEFAULT 0,
            cnpsPatronal REAL DEFAULT 0,
            cnpsRetraitePatronal REAL DEFAULT 0,
            cnpsPFPatronal REAL DEFAULT 0,
            cnpsATPatronal REAL DEFAULT 0,
            itsNet REAL DEFAULT 0,
            itsPatronal REAL DEFAULT 0,
            taxeApprentissage REAL DEFAULT 0,
            fdfp REAL DEFAULT 0,
            totalTaxesPatronales REAL DEFAULT 0,
            avanceSurSalaire REAL DEFAULT 0,
            netAPayer REAL DEFAULT 0,
            totalEmployerCost REAL DEFAULT 0,
            statut TEXT DEFAULT 'Validé',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // PAYROLL ITEMS (Detailed Payslip Lines)
        db.run(`CREATE TABLE IF NOT EXISTS payroll_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL,
            codeRubrique INTEGER,
            designation TEXT NOT NULL,
            base REAL DEFAULT 0,
            tauxSalarial REAL DEFAULT 0,
            gainSalarial REAL DEFAULT 0,
            retenueSalariale REAL DEFAULT 0,
            tauxPatronal REAL DEFAULT 0,
            retenuePatronale REAL DEFAULT 0,
            FOREIGN KEY(record_id) REFERENCES payroll_records(id) ON DELETE CASCADE
        )`);

        // NOTIFICATIONS
        db.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            user_id INTEGER,
            empId INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // USERS
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT, -- 'admin', 'assistant', 'employee'
            empId INTEGER, -- Link to employees table if role is employee
            status TEXT DEFAULT 'Actif',
            dateCreated TEXT,
            is_deleted INTEGER DEFAULT 0,
            must_change_password INTEGER DEFAULT 0,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // ADVANCES (Avances & Prêts sur salaire)
        db.run(`CREATE TABLE IF NOT EXISTS advances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            montant REAL,
            dateDemande TEXT,
            moisRemboursement TEXT,
            statut TEXT DEFAULT 'En attente',
            motif TEXT,
            resteAPayer REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // DISCIPLINARY ACTIONS
        db.run(`CREATE TABLE IF NOT EXISTS disciplinary_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            type TEXT,
            dateEmission TEXT,
            motif TEXT,
            reponseSalarie TEXT,
            dateReponse TEXT,
            statut TEXT DEFAULT 'En attente de réponse',
            dateCloture TEXT,
            sanction TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // ASSESSMENTS
        db.run(`CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            titre TEXT,
            description TEXT,
            duree_minutes INTEGER,
            statut TEXT DEFAULT 'Actif',
            date_creation TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // ASSESSMENT QUESTIONS
        db.run(`CREATE TABLE IF NOT EXISTS assessment_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER,
            texte_question TEXT,
            options TEXT, -- JSON array of strings
            reponse_correcte TEXT, -- The exact string or JSON array of correct options
            points INTEGER DEFAULT 1,
            image_url TEXT, -- Base64 or image URL
            type_question TEXT DEFAULT 'single', -- 'single', 'multiple', 'text'
            FOREIGN KEY(assessment_id) REFERENCES assessments(id)
        )`);
        db.run("ALTER TABLE assessment_questions ADD COLUMN image_url TEXT", (err) => {});
        db.run("ALTER TABLE assessment_questions ADD COLUMN type_question TEXT DEFAULT 'single'", (err) => {});

        // ASSESSMENT SESSIONS (Candidats)
        db.run(`CREATE TABLE IF NOT EXISTS assessment_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER,
            nom TEXT,
            prenoms TEXT,
            email TEXT,
            telephone TEXT,
            score INTEGER,
            total_points INTEGER,
            date_passage TEXT,
            temps_ecoule INTEGER,
            statut TEXT DEFAULT 'Terminé',
            FOREIGN KEY(assessment_id) REFERENCES assessments(id)
        )`);

        // AUDIT LOGS
        db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            user_id INTEGER,
            user_email TEXT,
            user_name TEXT,
            user_role TEXT,
            action TEXT,
            module TEXT,
            details TEXT,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // Schema Migrations (Add missing columns dynamically)
        [
            "ALTER TABLE audit_logs ADD COLUMN user_name TEXT",
            "ALTER TABLE audit_logs ADD COLUMN user_role TEXT",
            "ALTER TABLE audit_logs ADD COLUMN module TEXT",
            "ALTER TABLE audit_logs ADD COLUMN old_value TEXT",
            "ALTER TABLE audit_logs ADD COLUMN new_value TEXT",
            "ALTER TABLE audit_logs ADD COLUMN user_agent TEXT",
            "ALTER TABLE audit_logs ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE employees ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE employees ADD COLUMN situationMatrimoniale TEXT DEFAULT 'Célibataire'",
            "ALTER TABLE employees ADD COLUMN rib TEXT",
            "ALTER TABLE employees ADD COLUMN attestationTravail INTEGER DEFAULT 0",
            "ALTER TABLE employees ADD COLUMN attestationStage INTEGER DEFAULT 0",
            "ALTER TABLE employees ADD COLUMN attestationSalaire INTEGER DEFAULT 0",
            "ALTER TABLE employees ADD COLUMN photo TEXT",
            "ALTER TABLE employees ADD COLUMN username TEXT",
            "ALTER TABLE employees ADD COLUMN password TEXT",
            "ALTER TABLE employees ADD COLUMN compteActif INTEGER DEFAULT 1",
            "ALTER TABLE employees ADD COLUMN nationalite TEXT DEFAULT 'Ivoirienne'",
            "ALTER TABLE employees ADD COLUMN modePaiement TEXT DEFAULT 'Virement Bancaire'",
            "ALTER TABLE employees ADD COLUMN numeroMobileMoney TEXT",
            "ALTER TABLE employees ADD COLUMN is_deleted INTEGER DEFAULT 0",
            "ALTER TABLE employees ADD COLUMN must_change_password INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0",
            "ALTER TABLE leaves ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE contracts ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE recruitment ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE applications ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE attendance ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE evaluations ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE trainings ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE documents ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE payroll_history ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE advances ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE disciplinary_actions ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN company_id INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN logo TEXT",
            "ALTER TABLE settings ADD COLUMN primaryColor TEXT DEFAULT '#009E49'",
            "ALTER TABLE settings ADD COLUMN secondaryColor TEXT DEFAULT '#F77F00'",
            "ALTER TABLE settings ADD COLUMN smicAmount REAL DEFAULT 75000",
            "ALTER TABLE settings ADD COLUMN cnpsPlafond REAL DEFAULT 1647315",
            "ALTER TABLE settings ADD COLUMN cnpsSalarial REAL DEFAULT 6.3",
            "ALTER TABLE settings ADD COLUMN cnpsPatronalRetraite REAL DEFAULT 7.7",
            "ALTER TABLE settings ADD COLUMN cnpsPatronalPF REAL DEFAULT 5.75",
            "ALTER TABLE settings ADD COLUMN cnpsPatronalAT REAL DEFAULT 3.0",
            "ALTER TABLE settings ADD COLUMN itsPatronalIvoirien REAL DEFAULT 1.2",
            "ALTER TABLE settings ADD COLUMN itsPatronalExpat REAL DEFAULT 12.0",
            "ALTER TABLE settings ADD COLUMN taFdfpRate REAL DEFAULT 1.0",
            "ALTER TABLE settings ADD COLUMN timezone TEXT DEFAULT 'GMT (Abidjan)'",
            "ALTER TABLE settings ADD COLUMN currency TEXT DEFAULT 'F CFA (XOF)'",
            "ALTER TABLE settings ADD COLUMN language TEXT DEFAULT 'Français'",
            "ALTER TABLE settings ADD COLUMN tenantSlug TEXT DEFAULT 'demo.sirh-civ.ci'",
            "ALTER TABLE settings ADD COLUMN saasPlan TEXT DEFAULT 'BUSINESS PRO'",
            "ALTER TABLE settings ADD COLUMN maxEmployees INTEGER DEFAULT 50",
            "ALTER TABLE settings ADD COLUMN countryCode TEXT DEFAULT 'CI'",
            "ALTER TABLE settings ADD COLUMN legalHoursPerMonth REAL DEFAULT 173.33",
            "ALTER TABLE settings ADD COLUMN leaveAccrualRate REAL DEFAULT 2.2",
            "ALTER TABLE settings ADD COLUMN apiKey TEXT DEFAULT 'sk_live_sirh_98a76d5e4c3b2a10'",
            "ALTER TABLE settings ADD COLUMN modulePayroll INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN moduleLeaves INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN moduleEvaluations INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN moduleRecruitment INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN modulePortal INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN moduleMobileMoney INTEGER DEFAULT 1",
            "ALTER TABLE settings ADD COLUMN slogan TEXT DEFAULT 'L''Excellence RH & Paie en Afrique'",
            "ALTER TABLE settings ADD COLUMN footerStampText TEXT DEFAULT 'Document Officiel Certifié RH'"
        ].forEach(query => {
            db.run(query, (err) => {});
        });

        // Indexes for multi-tenant scalability (+500 employees)
        db.run("CREATE INDEX IF NOT EXISTS idx_emp_company ON employees(company_id, is_deleted)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_emp_matricule ON employees(matricule)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_emp_username ON employees(username)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_leaves_company ON leaves(company_id, empId)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id, empId)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_advances_company ON advances(company_id, empId)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_payroll_rec_period ON payroll_records(company_id, period_id, empId)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(company_id, created_at DESC)", (err) => {});
        db.run("CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(company_id, user_id, is_read)", (err) => {});

        [
            ["competences", "TEXT DEFAULT ''"],
            ["experience", "TEXT DEFAULT ''"],
            ["criteres", "TEXT DEFAULT ''"],
            ["mots_cles", "TEXT DEFAULT ''"],
            ["dateFin", "TEXT"]
        ].forEach(([column, definition]) => {
            db.run(`ALTER TABLE recruitment ADD COLUMN ${column} ${definition}`, (err) => {});
        });

        ensureDemoUsers();
        seedTrainingsAndDocuments();
    });
}

function ensureDemoUsers() {
    db.serialize(() => {
        db.get("SELECT count(*) as count FROM companies", (err, row) => {
            if (row && row.count === 0) {
                console.log("Seeding default company tenant...");
                db.run(`INSERT INTO companies (id, name, rc, cc, cnps_employer, address, phone, email, tenantSlug, saasPlan, maxEmployees)
                        VALUES (1, 'ENTREPRISE IVOIRIENNE SAS', 'CI-ABJ-03-2024-B12-12345', '2401234 A', '12345678', 'Abidjan, Plateau', '+225 27 20 00 00 00', 'contact@entreprise.ci', 'demo.sirh-civ.ci', 'BUSINESS PRO', 100)`);
            }
        });

        db.get("SELECT count(*) as count FROM departments", (err, row) => {
            if (row && row.count === 0) {
                console.log("Seeding default departments...");
                const depts = [
                    [1, 'DEP-01', 'Comptabilité & Finance', 'Gestion comptable, paie et fiscalité DGI'],
                    [1, 'DEP-02', 'Ressources Humaines', 'Recrutement, contrats, congés et climat social'],
                    [1, 'DEP-03', 'Sécurité & Hygiène', 'Surveillance des sites et prévention des risques'],
                    [1, 'DEP-04', 'Direction Générale', 'Pilotage stratégique et gouvernance'],
                    [1, 'DEP-05', 'BTP & Travaux', 'Gestion des chantiers et opérations'],
                    [1, 'DEP-06', 'Logistique & Transport', 'Gestion de la flotte et des expéditions']
                ];
                const stmt = db.prepare(`INSERT INTO departments (company_id, code, nom, description) VALUES (?,?,?,?)`);
                depts.forEach(d => stmt.run(d));
                stmt.finalize();
            }
        });

        db.get("SELECT count(*) as count FROM positions", (err, row) => {
            if (row && row.count === 0) {
                console.log("Seeding default positions...");
                const positions = [
                    [1, 'Comptable Senior', 'Comptabilité & Finance', 400000, 800000, 'Gestion paie et comptabilité'],
                    [1, 'Responsable RH', 'Ressources Humaines', 500000, 1000000, 'Direction des Ressources Humaines'],
                    [1, 'Agent de Sécurité', 'Sécurité & Hygiène', 150000, 300000, 'Surveillance des sites'],
                    [1, 'Chef de Chantier', 'BTP & Travaux', 350000, 750000, 'Suivi et conduite de travaux']
                ];
                const stmt = db.prepare(`INSERT INTO positions (company_id, titre, departement, salaireMin, salaireMax, description) VALUES (?,?,?,?,?,?)`);
                positions.forEach(p => stmt.run(p));
                stmt.finalize();
            }
        });

        db.get("SELECT count(*) as count FROM payroll_periods", (err, row) => {
            if (row && row.count === 0) {
                console.log("Seeding default payroll periods...");
                db.run(`INSERT INTO payroll_periods (company_id, periode, dateDebut, dateFin, statut, masseBrute, masseNette) 
                        VALUES (1, 'Juin 2026', '2026-06-01', '2026-06-30', 'Clôturé', 4280000, 3510000)`);
            }
        });
    });

    db.get("SELECT count(*) as count FROM users WHERE role = 'admin'", (err, row) => {
        if (row && row.count === 0) {
            console.log("Creating default admin account...");
            db.run(`INSERT INTO users (name, email, password, role, dateCreated) 
                    VALUES ('Super Admin', 'admin@sirh.ci', 'admin123', 'admin', ?)`, 
                    [new Date().toISOString()]);
        }
    });

    db.get("SELECT count(*) as count FROM users WHERE email = 'employe@sirh.ci'", (err, row) => {
        if (row && row.count === 0) {
            db.get("SELECT id FROM employees WHERE matricule = 'EMP-001'", (err, emp) => {
                if (emp) {
                    console.log("Creating default employee account...");
                    db.run(`INSERT INTO users (name, email, password, role, empId, dateCreated) 
                            VALUES ('Jean-Baptiste Kouamé', 'employe@sirh.ci', 'employe', 'employee', ?, ?)`,
                            [emp.id, new Date().toISOString()]);
                }
            });
        }
    });
}

function seedTrainingsAndDocuments() {
    db.get("SELECT count(*) as count FROM trainings", (err, row) => {
        if (row && row.count === 0) {
            const trainings = [
                ['Gestion de la Paie CI', 'Comptabilité', '2026-07-15', 4, 'Planifiée'],
                ['Sécurité Incendie & Secourisme', 'Sécurité', '2026-06-20', 12, 'En cours'],
                ['Lecture de Plans BTP', 'BTP', '2026-05-10', 8, 'Terminée']
            ];
            const stmt = db.prepare(`INSERT INTO trainings (titre, departement, date, participants, statut) VALUES (?,?,?,?,?)`);
            trainings.forEach(t => stmt.run(t));
            stmt.finalize();
        }
    });

    db.get("SELECT count(*) as count FROM documents", (err, row) => {
        if (row && row.count === 0) {
            const docs = [
                ['Règlement Intérieur 2024.pdf', 'PDF', '2.4 MB', 'Ressources Humaines', '2024-01-10'],
                ['Modèle Contrat Stage.docx', 'DOCX', '1.1 MB', 'Modèles', '2024-03-15'],
                ['Tableau Cotisation CNPS.pdf', 'PDF', '850 KB', 'Comptabilité', '2024-05-20']
            ];
            const stmt = db.prepare(`INSERT INTO documents (nom, type, taille, dossier, date) VALUES (?,?,?,?,?)`);
            docs.forEach(d => stmt.run(d));
            stmt.finalize();
        }
    });
}

function seedData() {
    console.log("Seeding rich Ivory Coast data...");
    
    // 1. Seed Settings
    db.run(`INSERT INTO settings (id, companyName, rc, cc, cnps_employer, address, phone, email) 
            VALUES (1, 'ENTREPRISE IVOIRIENNE SAS', 'CI-ABJ-03-2024-B12-12345', '2401234 A', '12345678', 'Abidjan, Plateau, Avenue Marchand', '+225 27 20 00 00 00', 'contact@entreprise.ci')`);

    // 2. Seed 12 Employees
    const emps = [
        ['EMP-001', 'Kouamé', 'Jean-Baptiste', 'Comptable Senior', 'Comptabilité', 'abidjan', 'CDI', 'Actif', '2020-03-15', 450000, 'M', '+225 07 08 09 10 11', 'jb.kouame@sirh.ci', 'CNPS-12345', 2, 'Marié'],
        ['EMP-002', 'Bamba', 'Aïssatou', 'Agent de sécurité', 'Sécurité', 'yopougon', 'CDI', 'Actif', '2021-06-01', 200000, 'F', '+225 05 12 34 56', 'a.bamba@sirh.ci', 'CNPS-23456', 3, 'Célibataire'],
        ['EMP-003', 'Diabaté', 'Moussa', 'Professeur Mathématiques', 'Pédagogie', 'cocody', 'CDI', 'Actif', '2019-09-01', 380000, 'M', '+225 01 23 45 67', 'm.diabate@sirh.ci', 'CNPS-34567', 1, 'Marié'],
        ['EMP-004', 'Traoré', 'Fatou', 'Responsable RH', 'Ressources Humaines', 'abidjan', 'CDI', 'Actif', '2018-01-10', 550000, 'F', '+225 07 98 76 54', 'f.traore@sirh.ci', 'CNPS-45678', 2, 'Marié'],
        ['EMP-005', 'Koné', 'Ibrahim', 'Chef de chantier', 'BTP', 'bouake', 'CDD', 'Actif', '2023-01-15', 400000, 'M', '+225 01 11 22 33', 'i.kone@sirh.ci', 'CNPS-56789', 4, 'Marié'],
        ['EMP-006', 'Ouattara', 'Adama', 'Agent de sécurité', 'Sécurité', 'abidjan', 'CDI', 'Actif', '2022-02-01', 200000, 'M', '+225 05 44 55 66', 'a.ouattara@sirh.ci', 'CNPS-67890', 0, 'Célibataire'],
        ['EMP-007', 'Dago', 'Marie-Claire', 'Secrétaire de direction', 'Direction', 'cocody', 'CDI', 'Actif', '2020-11-20', 320000, 'F', '+225 07 77 88 99', 'mc.dago@sirh.ci', 'CNPS-78901', 1, 'Célibataire'],
        ['EMP-008', 'Yao', 'Serge', 'Manœuvre BTP', 'BTP', 'bouake', 'CDD', 'Actif', '2023-06-01', 150000, 'M', '+225 01 33 44 55', 's.yao@sirh.ci', 'CNPS-89012', 5, 'Marié'],
        ['EMP-009', 'Coulibaly', 'Awa', 'Directrice école', 'Direction', 'cocody', 'CDI', 'Actif', '2017-09-01', 600000, 'F', '+225 05 66 77 88', 'a.coulibaly@sirh.ci', 'CNPS-90123', 3, 'Veuve'],
        ['EMP-010', 'N\'Guessan', 'Patrick', 'Comptable Junior', 'Comptabilité', 'abidjan', 'Stage', 'Actif', '2024-01-08', 180000, 'M', '+225 07 22 33 44', 'p.nguessan@sirh.ci', '', 0, 'Célibataire'],
        ['EMP-011', 'Konan', 'Brigitte', 'Agent logistique', 'Logistique', 'sanpedro', 'CDI', 'En congé', '2021-04-01', 250000, 'F', '+225 01 55 66 77', 'b.konan@sirh.ci', 'CNPS-11223', 2, 'Marié'],
        ['EMP-012', 'Cissé', 'Abdoulaye', 'Chauffeur', 'Logistique', 'abidjan', 'CDI', 'Actif', '2019-12-01', 220000, 'M', '+225 05 88 99 00', 'a.cisse@sirh.ci', 'CNPS-33445', 3, 'Marié']
    ];
    
    const stmtEmp = db.prepare(`INSERT INTO employees (matricule, nom, prenoms, poste, departement, site, type, statut, dateEmbauche, salaireBase, sexe, telephone, email, cnps, nbEnfants, situationMatrimoniale) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    emps.forEach(e => stmtEmp.run(e));
    stmtEmp.finalize();

    // 3. Seed Contracts matching those employees (empId is sequential 1-indexed in SQLite)
    const contracts = [
        [1, 'CDI', '2020-03-15', '', 'Actif', 5400000],
        [2, 'CDI', '2021-06-01', '', 'Actif', 2400000],
        [3, 'CDI', '2019-09-01', '', 'Actif', 4560000],
        [4, 'CDI', '2018-01-10', '', 'Actif', 6600000],
        [5, 'CDD', '2023-01-15', '2024-01-14', 'Actif', 4800000],
        [8, 'CDD', '2023-06-01', '2023-12-01', 'Expiré', 1800000],
        [10, 'Stage', '2024-01-08', '2024-07-08', 'Actif', 2160000]
    ];
    const stmtContract = db.prepare(`INSERT INTO contracts (empId, type, debut, fin, statut, salaireAnnuel) VALUES (?,?,?,?,?,?)`);
    contracts.forEach(c => stmtContract.run(c));
    stmtContract.finalize();

    // 4. Seed Leaves
    const leaves = [
        [11, 'Congé annuel', '2026-06-10', '2026-06-25', 12, 'Approuvé', 'Voyage familial'],
        [2, 'Congé annuel', '2026-07-01', '2026-07-15', 11, 'En attente', 'Repos annuel'],
        [4, 'Congé maladie', '2026-06-20', '2026-06-28', 6, 'Approuvé', 'Certificat médical'],
        [1, 'Congé annuel', '2026-08-05', '2026-08-20', 12, 'En attente', 'Vacances familiales']
    ];
    const stmtLeave = db.prepare(`INSERT INTO leaves (empId, type, debut, fin, duree, statut, motif) VALUES (?,?,?,?,?,?,?)`);
    leaves.forEach(l => stmtLeave.run(l));
    stmtLeave.finalize();

    // 5. Seed Recruitment (Offers)
    const offers = [
        ['Comptable Senior', 'Comptabilité', 'abidjan', 'CDI', 'Ouvert', 'Excel avancé, paie, fiscalité, audit, Sage', '3 ans minimum', 'Rigueur, reporting, disponibilité immédiate', 15, '2026-05-15'],
        ['Agent de sécurité', 'Sécurité', 'yopougon', 'CDI', 'En cours', 'Surveillance, contrôle d’accès, secourisme, ronde', '2 ans minimum', 'Ponctualité, discipline, bonne condition physique', 32, '2026-05-20'],
        ['Professeur Français', 'Pédagogie', 'cocody', 'CDI', 'Ouvert', 'Enseignement, pédagogie, grammaire, rédaction, programme scolaire', '2 ans minimum', 'Licence, gestion de classe, expression orale', 8, '2026-06-01'],
        ['Chef de chantier', 'BTP', 'bouake', 'CDD', 'Clôturé', 'Lecture de plans, gestion équipe, construction, suivi travaux', '5 ans minimum', 'Leadership, mobilité, respect sécurité chantier', 22, '2026-04-10']
    ];
    const stmtOffer = db.prepare(`INSERT INTO recruitment (poste, departement, site, type, statut, competences, experience, criteres, candidats, dateCreation) VALUES (?,?,?,?,?,?,?,?,?,?)`);
    offers.forEach(o => stmtOffer.run(o));
    stmtOffer.finalize();

    // 6. Seed Evaluations
    const evals = [
        [1, '2026-S1', 4, 4, 5, 4, 4.25, 'Terminée', 'Excellent travail, très rigoureux.'],
        [4, '2026-S1', 5, 5, 5, 5, 5.0, 'Terminée', 'Responsable exemplaire, leader naturel.'],
        [5, '2026-S1', 3, 4, 3, 4, 3.5, 'Terminée', 'Bon travail, progrès attendus en gestion d\'équipe.']
    ];
    const stmtEval = db.prepare(`INSERT INTO evaluations (empId, periode, competence, rendement, assiduite, comportement, note, statut, commentaire) VALUES (?,?,?,?,?,?,?,?,?)`);
    evals.forEach(e => stmtEval.run(e));
    stmtEval.finalize();

    // 7. Seed Advances
    const advances = [
        [1, 100000, '2026-06-15', 'Juin 2026', 'Approuvé', 'Avance pour scolarité', 100000],
        [2, 50000, '2026-06-10', 'Juin 2026', 'Remboursé', 'Frais médicaux', 0],
        [3, 80000, '2026-06-18', 'Juillet 2026', 'En attente', 'Achat équipements', 80000]
    ];
    const stmtAdvance = db.prepare(`INSERT INTO advances (empId, montant, dateDemande, moisRemboursement, statut, motif, resteAPayer) VALUES (?,?,?,?,?,?,?)`);
    advances.forEach(adv => stmtAdvance.run(adv));
    stmtAdvance.finalize();

    // 8. Seed Disciplinary Actions
    const disciplinary = [
        [1, 'Demande d\'explication', '2026-06-12', 'Retards répétés et injustifiés de plus de 30 minutes au cours de la semaine du 8 juin.', 'J\'ai rencontré des perturbations majeures sur le réseau de bus SOTRA suite aux fortes pluies à Abidjan.', '2026-06-13', 'Classé sans suite', '2026-06-14', 'Aucune'],
        [2, 'Demande d\'explication', '2026-07-02', 'Absence non autorisée et non justifiée à votre poste de travail le 1er juillet de 14h à 18h.', '', '', 'En attente de réponse', '', ''],
        [1, 'Avertissement', '2026-07-10', 'Non-respect des consignes de sécurité sur le port des EPI lors des visites sur le chantier de Bouaké.', 'J\'accuse réception de cet avertissement et je veillerai à porter mes équipements de protection systématiquement.', '2026-07-11', 'Sanctionné', '2026-07-12', 'Avertissement Écrit']
    ];
    const stmtDisciplinary = db.prepare(`INSERT INTO disciplinary_actions (empId, type, dateEmission, motif, reponseSalarie, dateReponse, statut, dateCloture, sanction) VALUES (?,?,?,?,?,?,?,?,?)`);
    disciplinary.forEach(d => stmtDisciplinary.run(d));
    stmtDisciplinary.finalize();
}

module.exports = db;
