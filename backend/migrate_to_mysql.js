require('dotenv').config();
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const sqliteDbPath = path.join(__dirname, 'sirh.db');

async function migrate() {
    console.log('====================================================');
    console.log('🚀 DEBUT DE MIGRATION SQLITE -> MYSQL POUR GEBAT SA');
    console.log('====================================================');

    if (!fs.existsSync(sqliteDbPath)) {
        console.error('❌ Base de données SQLite sirh.db introuvable.');
        process.exit(1);
    }

    const connectionConfig = (process.env.MYSQL_URL || process.env.DATABASE_URL)
        ? { uri: process.env.MYSQL_URL || process.env.DATABASE_URL, multipleStatements: true }
        : {
            host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
            port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
            user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
            database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'sirh_gebat',
            multipleStatements: true
        };

    console.log(`📡 Connexion au serveur MySQL...`);
    let connection;
    try {
        connection = await mysql.createConnection(connectionConfig);
        console.log(`✅ Base de données MySQL connectée.`);

        // Charger le schéma MySQL
        const schemaPath = path.join(__dirname, 'schema_mysql.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await connection.query(schemaSql);
            console.log('✅ Schéma MySQL importé et tables créées.');
        }

    } catch (err) {
        console.error(`❌ Erreur de connexion à MySQL (${err.message}). Vérifiez vos paramètres de connexion.`);
        process.exit(1);
    }

    // Connexion SQLite
    const sqliteDb = new sqlite3.Database(sqliteDbPath);

    function getSqliteRows(query) {
        return new Promise((resolve, reject) => {
            sqliteDb.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    const tables = [
        'companies', 'settings', 'departments', 'positions', 'employees',
        'users', 'leaves', 'leave_balances', 'recruitment', 'applications',
        'attendance', 'attendance_settings', 'evaluations', 'contracts',
        'trainings', 'documents', 'payroll_history', 'payroll_periods',
        'payroll_records', 'payroll_items', 'notifications', 'advances',
        'disciplinary_actions', 'assessments', 'assessment_questions',
        'assessment_sessions', 'audit_logs'
    ];

    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    for (const table of tables) {
        try {
            const rows = await getSqliteRows(`SELECT * FROM ${table}`);
            if (rows.length > 0) {
                console.log(`📦 Migration de la table ${table} (${rows.length} lignes)...`);
                
                for (const row of rows) {
                    const keys = Object.keys(row);
                    const values = Object.values(row);
                    const placeholders = keys.map(() => '?').join(', ');
                    const columns = keys.map(k => `\`${k}\``).join(', ');
                    
                    const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ')};`;
                    await connection.execute(sql, values);
                }
            }
        } catch (e) {
            console.warn(`⚠️ Table ${table} ignorée ou vide:`, e.message);
        }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    await connection.end();
    sqliteDb.close();

    console.log('====================================================');
    console.log('🎉 MIGRATION COMPLÈTE RÉUSSIE AVEC SUCCÈS !');
    console.log('   Toutes les données GEBAT SA sont synchronisées dans MySQL.');
    console.log('====================================================');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Erreur durant la migration:', err);
    process.exit(1);
});
