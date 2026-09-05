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
            FOREIGN KEY(company_id) REFERENCES companies(id)
        )`);

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
    });
}

// Initialisation au chargement
initDatabase();

module.exports = dbWrapper;
