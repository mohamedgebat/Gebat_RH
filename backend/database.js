require('dotenv').config();
const path = require('path');
const fs = require('fs');

let mysqlPool = null;
let sqliteDb = null;
let activeEngine = 'none'; // 'mysql' ou 'sqlite'

// Config MySQL depuis .env ou variables d'environnement Cloud (Railway, Clever Cloud, etc.)
const dbType = process.env.DB_TYPE || ((process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQLHOST) ? 'mysql' : 'mysql');
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10);
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'sirh_gebat';

// Objet d'export unique et persistant pour Express
const dbWrapper = {
    get: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeEngine === 'mysql' && mysqlPool) {
            mysqlPool.query(sql, params, (err, results) => {
                if (err) return callback ? callback(err, null) : null;
                const row = results && results.length > 0 ? results[0] : null;
                if (callback) callback(null, row);
            });
        } else if (sqliteDb) {
            sqliteDb.get(sql, params, callback);
        } else {
            if (callback) callback(new Error('Base de données non initialisée'), null);
        }
    },

    all: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeEngine === 'mysql' && mysqlPool) {
            mysqlPool.query(sql, params, (err, results) => {
                if (err) return callback ? callback(err, null) : null;
                if (callback) callback(null, results || []);
            });
        } else if (sqliteDb) {
            sqliteDb.all(sql, params, callback);
        } else {
            if (callback) callback(new Error('Base de données non initialisée'), []);
        }
    },

    run: function(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        if (activeEngine === 'mysql' && mysqlPool) {
            mysqlPool.query(sql, params, function(err, results) {
                if (err) {
                    if (callback) callback(err);
                    return;
                }
                const context = {
                    lastID: results ? results.insertId : 0,
                    changes: results ? results.affectedRows : 0
                };
                if (callback) callback.call(context, null);
            });
        } else if (sqliteDb) {
            sqliteDb.run(sql, params, callback);
        } else {
            if (callback) callback(new Error('Base de données non initialisée'));
        }
    },

    serialize: function(fn) {
        if (activeEngine === 'sqlite' && sqliteDb) {
            sqliteDb.serialize(fn);
        } else if (fn) {
            fn();
        }
    },

    prepare: function(sql) {
        if (activeEngine === 'sqlite' && sqliteDb) {
            return sqliteDb.prepare(sql);
        }
        return {
            run: function(params, callback) {
                dbWrapper.run(sql, params, callback);
            },
            finalize: function() {}
        };
    }
};

function initDatabase() {
    if (dbType === 'mysql' || process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQLHOST) {
        try {
            const mysql = require('mysql2');
            console.log(`📡 Tentative de connexion au serveur MySQL (${dbHost}:${dbPort})...`);
            
            const poolConfig = (process.env.MYSQL_URL || process.env.DATABASE_URL)
                ? {
                    uri: process.env.MYSQL_URL || process.env.DATABASE_URL,
                    waitForConnections: true,
                    connectionLimit: 20,
                    queueLimit: 0,
                    multipleStatements: true,
                    charset: 'utf8mb4'
                }
                : {
                    host: dbHost,
                    port: dbPort,
                    user: dbUser,
                    password: dbPassword,
                    database: dbName,
                    waitForConnections: true,
                    connectionLimit: 20,
                    queueLimit: 0,
                    multipleStatements: true,
                    charset: 'utf8mb4'
                };

            const pool = mysql.createPool(poolConfig);

            pool.getConnection((err, conn) => {
                if (err) {
                    console.warn(`⚠️ Serveur MySQL non disponible (${err.message}). Bascule automatique sur SQLite...`);
                    useSQLiteFallback();
                } else {
                    console.log(`✅ Connecté avec succès à la base MySQL : ${dbName} (${dbHost}:${dbPort})`);
                    conn.release();
                    mysqlPool = pool;
                    activeEngine = 'mysql';
                    initMySQLSchema(pool);
                }
            });
            return;
        } catch (e) {
            console.warn(`⚠️ Module mysql2 non disponible (${e.message}). Bascule sur SQLite...`);
            useSQLiteFallback();
            return;
        }
    } else {
        useSQLiteFallback();
    }
}

function useSQLiteFallback() {
    activeEngine = 'sqlite';
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'sirh.db');
    
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Erreur de connexion SQLite:', err.message);
        } else {
            console.log('🔒 Connecté à la base de données SQLite GEBAT SA (Mode Fallback Secours).');
            sqliteDb.run("PRAGMA journal_mode = WAL;");
            sqliteDb.run("PRAGMA synchronous = NORMAL;");
            sqliteDb.run("PRAGMA cache_size = -64000;");
            sqliteDb.run("PRAGMA foreign_keys = ON;");
            initSQLiteSchema(sqliteDb);
        }
    });
}

function initMySQLSchema(pool) {
    console.log("🛠️ Vérification et initialisation du schéma MySQL pour GEBAT SA...");
    const schemaSqlPath = path.join(__dirname, 'schema_mysql.sql');
    if (fs.existsSync(schemaSqlPath)) {
        const sqlContent = fs.readFileSync(schemaSqlPath, 'utf8');
        pool.query(sqlContent, (err) => {
            if (err) {
                console.error("Erreur initialisation schéma MySQL:", err.message);
            } else {
                console.log("✅ Schéma & données de base MySQL pour GEBAT SA synchronisés avec succès.");
            }
        });
    }
}

function initSQLiteSchema(sDb) {
    sDb.serialize(() => {
        sDb.run(`CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rc TEXT,
            cc TEXT,
            cnps_employer TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            logo TEXT DEFAULT '/gebat_logo.png',
            primaryColor TEXT DEFAULT '#2563EB',
            secondaryColor TEXT DEFAULT '#E5A110',
            tenantSlug TEXT UNIQUE DEFAULT 'gebat-sa.ci',
            saasPlan TEXT DEFAULT 'BUSINESS PRO',
            maxEmployees INTEGER DEFAULT 250,
            status TEXT DEFAULT 'Actif',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            companyName TEXT,
            rc TEXT,
            cc TEXT,
            cnps_employer TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            logo TEXT DEFAULT '/gebat_logo.png',
            primaryColor TEXT DEFAULT '#2563EB',
            secondaryColor TEXT DEFAULT '#E5A110',
            slogan TEXT DEFAULT 'Constructeur d''Infrastructures & Capital Humain',
            footerStampText TEXT DEFAULT 'Document Officiel Certifié RH',
            smtp_host TEXT DEFAULT '',
            smtp_port INTEGER DEFAULT 587,
            smtp_user TEXT DEFAULT '',
            smtp_pass TEXT DEFAULT '',
            smtp_secure INTEGER DEFAULT 0,
            sender_email TEXT DEFAULT 'notifications@gebat-sa.com',
            sender_name TEXT DEFAULT 'GEBAT SA - Notifications RH',
            email_notif_leaves INTEGER DEFAULT 1,
            email_notif_advances INTEGER DEFAULT 1,
            email_notif_payroll INTEGER DEFAULT 1,
            email_notif_contracts INTEGER DEFAULT 1,
            email_notif_disciplinary INTEGER DEFAULT 1,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        // Migration sécurisée des colonnes SMTP pour bases existantes
        const smtpCols = [
            'smtp_host TEXT DEFAULT ""',
            'smtp_port INTEGER DEFAULT 587',
            'smtp_user TEXT DEFAULT ""',
            'smtp_pass TEXT DEFAULT ""',
            'smtp_secure INTEGER DEFAULT 0',
            'sender_email TEXT DEFAULT "notifications@gebat-sa.com"',
            'sender_name TEXT DEFAULT "GEBAT SA - Notifications RH"',
            'email_notif_leaves INTEGER DEFAULT 1',
            'email_notif_advances INTEGER DEFAULT 1',
            'email_notif_payroll INTEGER DEFAULT 1',
            'email_notif_contracts INTEGER DEFAULT 1',
            'email_notif_disciplinary INTEGER DEFAULT 1'
        ];
        smtpCols.forEach(colDef => {
            sDb.run(`ALTER TABLE settings ADD COLUMN ${colDef}`, () => {});
        });

        // Migration sécurisée des colonnes de Profil & Coordonnées Employés
        const empProfileCols = [
            'adresse TEXT DEFAULT ""',
            'emailPerso TEXT DEFAULT ""',
            'contactUrgenceNom TEXT DEFAULT ""',
            'contactUrgenceTelephone TEXT DEFAULT ""',
            'contactUrgenceLien TEXT DEFAULT ""',
            'bio TEXT DEFAULT ""'
        ];
        empProfileCols.forEach(colDef => {
            sDb.run(`ALTER TABLE employees ADD COLUMN ${colDef}`, () => {});
        });

        // Migration sécurisée des colonnes Utilisateurs
        const userProfileCols = [
            'photo TEXT DEFAULT ""',
            'telephone TEXT DEFAULT ""'
        ];
        userProfileCols.forEach(colDef => {
            sDb.run(`ALTER TABLE users ADD COLUMN ${colDef}`, () => {});
        });

        sDb.run(`CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            code TEXT UNIQUE,
            nom TEXT NOT NULL,
            description TEXT,
            responsable_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS positions (
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

        sDb.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            matricule TEXT UNIQUE,
            nom TEXT,
            prenoms TEXT,
            poste TEXT,
            departement TEXT,
            site TEXT,
            type TEXT,
            statut TEXT DEFAULT 'Actif',
            dateEmbauche TEXT,
            salaireBase REAL,
            sexe TEXT,
            telephone TEXT,
            email TEXT,
            cnps TEXT,
            nbEnfants INTEGER DEFAULT 0,
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
            must_change_password INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'employee',
            empId INTEGER,
            status TEXT DEFAULT 'Actif',
            dateCreated TEXT,
            is_deleted INTEGER DEFAULT 0,
            must_change_password INTEGER DEFAULT 0,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS leaves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            type TEXT,
            debut TEXT,
            fin TEXT,
            duree INTEGER,
            statut TEXT DEFAULT 'En attente',
            motif TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS leave_balances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER NOT NULL,
            annee INTEGER NOT NULL,
            acquis REAL DEFAULT 26.40,
            pris REAL DEFAULT 0.00,
            solde REAL DEFAULT 26.40,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id),
            UNIQUE(company_id, empId, annee)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS recruitment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            poste TEXT,
            departement TEXT,
            site TEXT,
            type TEXT,
            statut TEXT DEFAULT 'Ouvert',
            competences TEXT,
            experience TEXT,
            criteres TEXT,
            mots_cles TEXT,
            candidats INTEGER DEFAULT 0,
            dateCreation TEXT,
            dateFin TEXT,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            offerId INTEGER,
            nom TEXT,
            prenoms TEXT,
            email TEXT,
            telephone TEXT,
            cv TEXT,
            lm TEXT,
            date TEXT,
            statut TEXT DEFAULT 'Nouveau',
            motivation TEXT,
            score_ats INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(offerId) REFERENCES recruitment(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            matricule TEXT,
            nom TEXT,
            type TEXT,
            timestamp TEXT,
            site TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS attendance_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1 UNIQUE,
            heure_arrivee_officielle TEXT DEFAULT '08:00',
            heure_depart_officiel TEXT DEFAULT '17:00',
            marge_tolerance_minutes INTEGER DEFAULT 15,
            taux_horaire_base REAL DEFAULT 2500,
            taux_journalier_base REAL DEFAULT 20000,
            taux_majoration_heures_sup REAL DEFAULT 25,
            sites_travail TEXT DEFAULT 'Abidjan - Siège, Chantier Bouaké, San Pedro, Yamoussoukro',
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`ALTER TABLE attendance_settings ADD COLUMN sites_travail TEXT DEFAULT 'Abidjan - Siège, Chantier Bouaké, San Pedro, Yamoussoukro'`, (err) => {
            // Ignorer si la colonne existe déjà
        });

        sDb.run(`CREATE TABLE IF NOT EXISTS evaluations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            periode TEXT,
            competence INTEGER DEFAULT 3,
            rendement INTEGER DEFAULT 3,
            assiduite INTEGER DEFAULT 3,
            comportement INTEGER DEFAULT 3,
            note REAL DEFAULT 3.0,
            statut TEXT DEFAULT 'En cours',
            commentaire TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS contracts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            type TEXT,
            debut TEXT,
            fin TEXT,
            statut TEXT DEFAULT 'Actif',
            salaireAnnuel REAL DEFAULT 0,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS trainings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            titre TEXT,
            departement TEXT,
            date TEXT,
            participants INTEGER DEFAULT 0,
            statut TEXT DEFAULT 'Planifiée',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            nom TEXT,
            type TEXT DEFAULT 'PDF',
            taille TEXT DEFAULT '0 KB',
            dossier TEXT DEFAULT 'Ressources Humaines',
            date TEXT,
            is_deleted INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS payroll_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            periode TEXT,
            dateCloture TEXT,
            masseNette REAL DEFAULT 0,
            masseBrute REAL DEFAULT 0,
            nbEmployes INTEGER DEFAULT 0,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS payroll_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            history_id INTEGER,
            periode TEXT,
            empId INTEGER,
            matricule TEXT,
            nom TEXT,
            departement TEXT,
            poste TEXT,
            baseSalary REAL DEFAULT 0,
            transport REAL DEFAULT 0,
            primeRendement REAL DEFAULT 0,
            primeAnciennete REAL DEFAULT 0,
            heuresSup REAL DEFAULT 0,
            brutTotal REAL DEFAULT 0,
            itsNet REAL DEFAULT 0,
            cnpsSalarial REAL DEFAULT 0,
            cmuSalarial REAL DEFAULT 0,
            netAPayer REAL DEFAULT 0,
            chargesPatronales REAL DEFAULT 0,
            dateCloture TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS advances (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER,
            montant REAL DEFAULT 0,
            dateDemande TEXT,
            moisRemboursement TEXT,
            statut TEXT DEFAULT 'En attente',
            motif TEXT,
            resteAPayer REAL DEFAULT 0,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS disciplinary_actions (
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
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            titre TEXT NOT NULL,
            description TEXT,
            duree_minutes INTEGER DEFAULT 30,
            statut TEXT DEFAULT 'Actif',
            date_creation TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS assessment_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER NOT NULL,
            texte_question TEXT NOT NULL,
            options TEXT,
            reponse_correcte TEXT,
            points INTEGER DEFAULT 1,
            image_url TEXT,
            type_question TEXT DEFAULT 'single',
            FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS assessment_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            assessment_id INTEGER NOT NULL,
            nom TEXT NOT NULL,
            prenoms TEXT,
            email TEXT NOT NULL,
            telephone TEXT,
            score INTEGER DEFAULT 0,
            total_points INTEGER DEFAULT 0,
            date_passage TEXT DEFAULT CURRENT_TIMESTAMP,
            temps_ecoule INTEGER DEFAULT 0,
            FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            user_id INTEGER,
            empId INTEGER,
            title TEXT,
            message TEXT,
            type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            user_id INTEGER,
            user_email TEXT,
            user_name TEXT,
            user_role TEXT,
            action TEXT NOT NULL,
            details TEXT,
            module TEXT DEFAULT 'Général',
            ip_address TEXT,
            user_agent TEXT,
            old_value TEXT,
            new_value TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            code TEXT UNIQUE,
            nom TEXT NOT NULL,
            client TEXT,
            site TEXT,
            budget_mo REAL DEFAULT 0,
            cout_actuel_mo REAL DEFAULT 0,
            date_debut TEXT,
            date_fin TEXT,
            chef_chantier TEXT,
            latitude REAL DEFAULT 5.3484,
            longitude REAL DEFAULT -4.0175,
            rayon_geofence INTEGER DEFAULT 250,
            statut TEXT DEFAULT 'En cours',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

        sDb.run(`CREATE TABLE IF NOT EXISTS project_allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            emp_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            mois TEXT,
            heures_allouees REAL DEFAULT 173.33,
            cout_impute REAL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(emp_id) REFERENCES employees(id),
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )`);

        // Module Ordres de Mission (BTP / Déplacements Chantiers)
        sDb.run(`CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER NOT NULL,
            titre TEXT NOT NULL,
            motif TEXT,
            destination TEXT NOT NULL,
            site TEXT,
            date_debut TEXT NOT NULL,
            date_fin TEXT NOT NULL,
            moyen_transport TEXT DEFAULT 'Véhicule de Société',
            vehicule TEXT,
            avance_frais REAL DEFAULT 0,
            statut TEXT DEFAULT 'En attente N+1',
            commentaires TEXT,
            validation_n1 TEXT,
            validation_rh TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // Module Notes de Frais & Justificatifs
        sDb.run(`CREATE TABLE IF NOT EXISTS expense_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER NOT NULL,
            mission_id INTEGER,
            date_depense TEXT NOT NULL,
            categorie TEXT NOT NULL,
            montant REAL NOT NULL,
            description TEXT,
            justificatif TEXT,
            statut TEXT DEFAULT 'Soumis',
            validation_n1 TEXT,
            validation_rh TEXT,
            inclus_paie INTEGER DEFAULT 0,
            mois_paie TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id),
            FOREIGN KEY(mission_id) REFERENCES missions(id) ON DELETE SET NULL
        )`);

        // Module Onboarding (Intégration & Dotations EPI/IT)
        sDb.run(`CREATE TABLE IF NOT EXISTS onboarding_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER NOT NULL,
            titre TEXT NOT NULL,
            categorie TEXT DEFAULT 'EPI & Sécurité',
            description TEXT,
            echeance TEXT,
            statut TEXT DEFAULT 'À faire',
            responsable_action TEXT DEFAULT 'RH',
            date_realisation TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // Module Offboarding & Solde de Tout Compte (STC)
        sDb.run(`CREATE TABLE IF NOT EXISTS offboarding_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER DEFAULT 1,
            empId INTEGER NOT NULL,
            date_notification TEXT,
            date_depart TEXT NOT NULL,
            motif_depart TEXT NOT NULL,
            statut TEXT DEFAULT 'En cours',
            preavis_effectue INTEGER DEFAULT 1,
            mois_preavis INTEGER DEFAULT 1,
            stc_salaire_presence REAL DEFAULT 0,
            stc_conges_payes REAL DEFAULT 0,
            stc_preavis REAL DEFAULT 0,
            stc_indemnite_rupture REAL DEFAULT 0,
            stc_prorata_gratification REAL DEFAULT 0,
            stc_deductions REAL DEFAULT 0,
            stc_total_net REAL DEFAULT 0,
            restitution_materiel INTEGER DEFAULT 0,
            entretien_depart INTEGER DEFAULT 0,
            certificat_emis INTEGER DEFAULT 0,
            notes TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(company_id) REFERENCES companies(id),
            FOREIGN KEY(empId) REFERENCES employees(id)
        )`);

        // Seed default projects if table is empty
        sDb.get("SELECT COUNT(*) as count FROM projects", (err, row) => {
            if (!err && (!row || row.count === 0)) {
                sDb.run(`INSERT INTO projects (code, nom, client, site, budget_mo, cout_actuel_mo, date_debut, date_fin, chef_chantier, latitude, longitude, rayon_geofence, statut) VALUES
                    ('CH-2026-01', 'Tour F Plateau - Travaux Finitions', 'Gouvernement CI / Ministère Construction', 'Plateau, Abidjan', 45000000, 18500000, '2026-01-10', '2026-12-31', 'M. Kouamé Adjoumani', 5.3245, -4.0189, 200, 'En cours'),
                    ('CH-2026-02', 'Résidence Akwaba Golf - Gros Œuvre', 'Groupe Immobilier Palmeraie', 'Cocody Riviera, Abidjan', 28000000, 12400000, '2026-02-01', '2026-10-30', 'Ing. Soro Brahima', 5.3612, -3.9520, 300, 'En cours'),
                    ('CH-2026-03', 'Échangeur Voie Y4 - Voirie & Réseaux', 'AGEROUTE Côte d''Ivoire', 'Abobo - Anyama', 62000000, 24800000, '2025-11-15', '2026-08-31', 'Chef Konan Jean', 5.4310, -4.0321, 500, 'En cours'),
                    ('CH-2026-04', 'Terminal Minéralier San-Pedro', 'Port Autonome de San-Pedro', 'San-Pedro Port', 85000000, 31200000, '2026-03-01', '2027-02-28', 'Ing. Bakayoko Moussa', 4.7521, -6.6432, 400, 'En cours')
                `);
            }
        });
    });
}

// Initialisation au chargement
initDatabase();

module.exports = dbWrapper;
