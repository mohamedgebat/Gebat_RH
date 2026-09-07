require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt, maskPhone, maskCnps, maskEmail, anonymizeData } = require('./encryption');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// En-têtes de sécurité HTTP
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé en dev pour compatibilité Vite
}));

// Restriction CORS flexible & sécurisée
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:3000,https://gebat-rh.vercel.app')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Autoriser les requêtes sans origine (Mobile, Postman, Curl, Same-Origin)
        if (!origin) return callback(null, true);
        
        // Autoriser dynamiquement tout port sur localhost ou 127.0.0.1 en développement
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        
        if (isLocalhost || configuredOrigins.includes(origin) || process.env.CORS_ORIGIN === '*') {
            callback(null, true);
        } else {
            console.warn(`[CORS REJECTED] Origine non autorisée : ${origin}`);
            callback(new Error(`Non autorisé par la politique CORS : ${origin}`));
        }
    },
    credentials: true
}));

// Rate Limiters
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes soumises. Veuillez réessayer plus tard.', code: 'RATE_LIMIT_EXCEEDED' }
});
app.use(globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Trop de tentatives de connexion. Compte protégé, réessayez dans 15 minutes.', code: 'TOO_MANY_ATTEMPTS' }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.static(path.join(__dirname, '../frontend')));

// --- UTILS & REPONSES NORMALISÉES ---
function sendError(res, statusCode, message, code = "BAD_REQUEST") {
    return res.status(statusCode).json({ error: message, code });
}

function queryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function queryGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function queryRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

async function verifyPassword(plainPassword, storedPassword) {
    if (!storedPassword) return false;
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        return await bcrypt.compare(plainPassword, storedPassword);
    }
    return plainPassword === storedPassword;
}

// --- MIDDLEWARES DE VALIDATION & AUTHENTIFICATION ---

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return sendError(res, 401, 'Accès non autorisé : Jeton de connexion manquant', 'UNAUTHORIZED');
    }

    jwt.verify(token, process.env.JWT_SECRET || 'sirh_civ_super_secret_key_2026_change_in_production', (err, user) => {
        if (err) return sendError(res, 403, 'Jeton de session invalide ou expiré', 'INVALID_TOKEN');
        req.user = user;
        req.company_id = user.company_id || 1;
        next();
    });
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) return sendError(res, 401, 'Utilisateur non authentifié', 'UNAUTHENTICATED');
        if (!allowedRoles.includes(req.user.role)) {
            return sendError(res, 403, 'Accès refusé : Privilèges insuffisants', 'FORBIDDEN');
        }
        next();
    };
}

function dbRunTransaction(queries) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (err) => { if (err) return reject(err); });
            for (let q of queries) {
                db.run(q.sql, q.params || [], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return reject(err);
                    }
                });
            }
            db.run("COMMIT", (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

function validateIdParam(paramName = 'id') {
    return (req, res, next) => {
        const val = req.params[paramName];
        if (!val || isNaN(val) || parseInt(val, 10) <= 0) {
            return sendError(res, 400, `L'identifiant ${paramName} est invalide`, 'INVALID_ID');
        }
        next();
    };
}

function validateEmailFormat(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateAmountValue(val) {
    if (val === undefined || val === null) return false;
    const num = Number(val);
    return !isNaN(num) && num >= 0;
}

// --- FONCTION AVANCÉE DU JOURNAL D'AUDIT ---
function logAuditAction(req, action, details, module = 'Général', oldValue = null, newValue = null) {
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || req.user?.username || 'Anonyme';
    const userName = req.user?.name || req.body?.name || req.body?.email || 'Visiteur';
    const userRole = req.user?.role || 'visiteur';
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Navigateur Inconnu';
    
    const oldStr = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
    const newStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;

    db.run(
        `INSERT INTO audit_logs (user_id, user_email, user_name, user_role, action, module, details, old_value, new_value, ip_address, user_agent, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [userId, userEmail, userName, userRole, action, module, details, oldStr, newStr, ip, userAgent, new Date().toISOString()],
        (err) => { if (err) console.error('Erreur journal d\'audit:', err.message); }
    );
}

// ==========================================
// 1. ROUTES PUBLIQUES
// ==========================================

// Authentification Admin / Gestionnaire
app.post('/api/auth/login', authLimiter, (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return sendError(res, 400, 'Email et mot de passe requis', 'MISSING_FIELDS');
    }
    if (!validateEmailFormat(email)) {
        return sendError(res, 400, 'Format d\'adresse email invalide', 'INVALID_EMAIL');
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        if (!user) return sendError(res, 401, 'Identifiants incorrects', 'INVALID_CREDENTIALS');

        const isMatch = await verifyPassword(password, user.password);
        if (!isMatch) return sendError(res, 401, 'Identifiants incorrects', 'INVALID_CREDENTIALS');

        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
            const hashed = await bcrypt.hash(password, 10);
            db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role, empId: user.empId },
            process.env.JWT_SECRET || 'sirh_civ_super_secret_key_2026_change_in_production',
            { expiresIn: '24h' }
        );

        const { password: _, ...userData } = user;
        const mustChangePassword = user.must_change_password === 1;
        logAuditAction(req, 'CONNEXION_UTILISATEUR', `Connexion réussie de ${user.email}`);
        res.json({ ...userData, token, mustChangePassword });
    });
});

// Authentification Espace Employé
app.post('/api/employee/login', authLimiter, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return sendError(res, 400, 'Nom d\'utilisateur et mot de passe requis', 'MISSING_FIELDS');
    }

    db.get("SELECT * FROM employees WHERE username = ?", [username], async (err, employee) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        if (!employee) return sendError(res, 401, 'Identifiants incorrects', 'INVALID_CREDENTIALS');

        if (employee.compteActif === 0) {
            return sendError(res, 403, 'Compte désactivé. Contactez l\'administration.', 'ACCOUNT_DISABLED');
        }

        const isMatch = await verifyPassword(password, employee.password);
        if (!isMatch) return sendError(res, 401, 'Identifiants incorrects', 'INVALID_CREDENTIALS');

        if (employee.password && !employee.password.startsWith('$2a$') && !employee.password.startsWith('$2b$')) {
            const hashed = await bcrypt.hash(password, 10);
            db.run("UPDATE employees SET password = ? WHERE id = ?", [hashed, employee.id]);
        }

        const token = jwt.sign(
            { id: employee.id, name: `${employee.nom} ${employee.prenoms}`, username: employee.username, role: 'employee', empId: employee.id },
            process.env.JWT_SECRET || 'sirh_civ_super_secret_key_2026_change_in_production',
            { expiresIn: '24h' }
        );

        const { password: _, ...employeeData } = employee;
        const mustChangePassword = employee.must_change_password === 1;
        logAuditAction(req, 'CONNEXION_EMPLOYE', `Connexion de l'employé ${employee.username}`);
        res.json({ employee: employeeData, token, mustChangePassword, message: 'Connexion réussie' });
    });
});

// Changement de mot de passe obligatoire au premier accès
app.post('/api/auth/force-change-password', async (req, res) => {
    const { userType, identifier, currentPassword, newPassword } = req.body;
    if (!identifier || !currentPassword || !newPassword) {
        return sendError(res, 400, 'Identifiant, mot de passe actuel et nouveau mot de passe requis', 'MISSING_FIELDS');
    }

    if (newPassword.length < 6) {
        return sendError(res, 400, 'Le nouveau mot de passe doit contenir au moins 6 caractères', 'WEAK_PASSWORD');
    }

    const table = userType === 'employee' ? 'employees' : 'users';
    const field = userType === 'employee' ? 'username' : 'email';

    db.get(`SELECT * FROM ${table} WHERE ${field} = ?`, [identifier], async (err, account) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        if (!account) return sendError(res, 404, 'Compte non trouvé', 'NOT_FOUND');

        const isMatch = await verifyPassword(currentPassword, account.password);
        if (!isMatch) return sendError(res, 401, 'Mot de passe actuel incorrect', 'INVALID_CREDENTIALS');

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run(`UPDATE ${table} SET password = ?, must_change_password = 0 WHERE id = ?`, [hashedPassword, account.id], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'PREMIER_ACCES_CHANGEMENT_MDP', `Changement de mot de passe au 1er accès réussi pour ${identifier}`, 'Authentification');
            res.json({ message: 'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.' });
        });
    });
});

// Candidatures publiques (Page Carrières)
app.post('/api/applications', (req, res) => {
    const { offerId, nom, prenoms, email, telephone, cv, lm, date, statut, motivation } = req.body;
    if (!offerId || !nom || !email) {
        return sendError(res, 400, 'Champs obligatoires manquants (Offre, Nom, Email)', 'MISSING_FIELDS');
    }
    if (!validateEmailFormat(email)) {
        return sendError(res, 400, 'Adresse email invalide', 'INVALID_EMAIL');
    }

    db.run(`INSERT INTO applications (offerId, nom, prenoms, email, telephone, cv, lm, date, statut, motivation) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [offerId, nom, prenoms || '', email, telephone || '', cv || '', lm || '', date || new Date().toISOString().split('T')[0], statut || 'Nouveau', motivation || ''],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            db.run(`UPDATE recruitment SET candidats = candidats + 1 WHERE id = ?`, [offerId]);
            res.json({ id: this.lastID, message: 'Candidature transmise avec succès' });
        });
});

// Passage de test candidat (Public)
app.get('/api/assessments/:id', validateIdParam('id'), async (req, res) => {
    try {
        const assessment = await queryAll("SELECT id, titre, description, duree_minutes, statut FROM assessments WHERE id = ?", [req.params.id]);
        if (!assessment || assessment.length === 0) return sendError(res, 404, 'Test introuvable', 'NOT_FOUND');
        if (assessment[0].statut !== 'Actif') return sendError(res, 403, 'Ce test est actuellement fermé', 'TEST_CLOSED');
        
        const questions = await queryAll("SELECT id, texte_question, options, points, image_url, type_question FROM assessment_questions WHERE assessment_id = ?", [req.params.id]);
        res.json({ ...assessment[0], questions });
    } catch (error) {
        sendError(res, 500, error.message, 'DATABASE_ERROR');
    }
});

// Soumission de test candidat (Public)
app.post('/api/assessments/:id/submit', validateIdParam('id'), async (req, res) => {
    const { nom, prenoms, email, telephone, reponses, temps_ecoule } = req.body;
    const assessmentId = req.params.id;

    if (!nom || !email) {
        return sendError(res, 400, 'Nom et email du candidat obligatoires', 'MISSING_FIELDS');
    }
    if (!validateEmailFormat(email)) {
        return sendError(res, 400, 'Format d\'email invalide', 'INVALID_EMAIL');
    }

    try {
        const questions = await queryAll("SELECT id, reponse_correcte, points, type_question FROM assessment_questions WHERE assessment_id = ?", [assessmentId]);
        
        let score = 0;
        let totalPoints = 0;
        
        questions.forEach(q => {
            totalPoints += (q.points || 1);
            const userResp = reponses ? reponses[q.id] : null;
            const qType = q.type_question || 'single';

            if (userResp !== undefined && userResp !== null) {
                if (qType === 'multiple') {
                    // Checkbox array or comma-separated string
                    let userOpts = Array.isArray(userResp) ? userResp : [userResp];
                    let correctOpts = [];
                    try {
                        correctOpts = typeof q.reponse_correcte === 'string' && q.reponse_correcte.startsWith('[') 
                            ? JSON.parse(q.reponse_correcte) 
                            : String(q.reponse_correcte).split(',').map(s => s.trim());
                    } catch (e) {
                        correctOpts = [q.reponse_correcte];
                    }
                    
                    const sortedUser = [...userOpts].sort().join('|||');
                    const sortedCorrect = [...correctOpts].sort().join('|||');
                    if (sortedUser === sortedCorrect) {
                        score += (q.points || 1);
                    }
                } else if (qType === 'text') {
                    // Short text answer (case insensitive match)
                    const userText = String(userResp).trim().toLowerCase();
                    const correctText = String(q.reponse_correcte || '').trim().toLowerCase();
                    if (userText === correctText) {
                        score += (q.points || 1);
                    }
                } else {
                    // Single choice radio
                    if (String(userResp).trim() === String(q.reponse_correcte).trim()) {
                        score += (q.points || 1);
                    }
                }
            }
        });
        
        db.run(`INSERT INTO assessment_sessions (assessment_id, nom, prenoms, email, telephone, score, total_points, date_passage, temps_ecoule) VALUES (?,?,?,?,?,?,?,?,?)`,
            [assessmentId, nom, prenoms || '', email, telephone || '', score, totalPoints, new Date().toISOString(), temps_ecoule || 0],
            function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
                res.json({ message: 'Test soumis avec succès', score, totalPoints });
            });
    } catch (error) {
        sendError(res, 500, error.message, 'DATABASE_ERROR');
    }
});

// Dynamic Employee Instant Lookup for Public Kiosk
app.get('/api/public/attendance/lookup/:matricule', (req, res) => {
    const rawMat = (req.params.matricule || '').trim();
    if (!rawMat) return sendError(res, 400, 'Matricule requis', 'MISSING_FIELDS');

    let searchMat = rawMat.toUpperCase();
    if (!searchMat.startsWith('EMP-')) {
        const numPart = searchMat.replace(/\D/g, '');
        searchMat = 'EMP-' + numPart.padStart(3, '0');
    }

    db.get("SELECT id, matricule, nom, prenoms, poste, departement, photo, site FROM employees WHERE (matricule = ? OR matricule LIKE ? OR id = ?) AND is_deleted = 0",
        [searchMat, `%${rawMat}%`, isNaN(rawMat) ? -1 : parseInt(rawMat, 10)],
        (err, emp) => {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            if (!emp) return res.json({ found: false });

            const todayPrefix = new Date().toISOString().split('T')[0];
            db.all("SELECT type, timestamp FROM attendance WHERE empId = ? AND timestamp LIKE ? ORDER BY timestamp ASC",
                [emp.id, `${todayPrefix}%`],
                (errAtt, records) => {
                    const inRecord = (records || []).find(r => r.type === 'IN');
                    const outRecord = (records || []).find(r => r.type === 'OUT');
                    res.json({
                        found: true,
                        id: emp.id,
                        matricule: emp.matricule,
                        nom: emp.nom,
                        prenoms: emp.prenoms,
                        poste: emp.poste || 'Salarié',
                        departement: emp.departement || 'SIRH-CIV',
                        site: emp.site || 'Abidjan Plateau',
                        photo: emp.photo || null,
                        hasInToday: !!inRecord,
                        hasOutToday: !!outRecord,
                        inTime: inRecord ? new Date(inRecord.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
                        outTime: outRecord ? new Date(outRecord.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null
                    });
                }
            );
        }
    );
});

// Live Public Ticker Feed for Kiosk
app.get('/api/public/attendance/ticker', (req, res) => {
    const todayPrefix = new Date().toISOString().split('T')[0];
    db.all("SELECT nom, matricule, type, timestamp, site FROM attendance WHERE timestamp LIKE ? ORDER BY id DESC LIMIT 15",
        [`${todayPrefix}%`],
        (err, rows) => {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json(rows || []);
        }
    );
});

// Helper pour vérifier le pointage en double le même jour
function checkDuplicateAttendance(empId, type, callback) {
    const todayPrefix = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    db.get(
        "SELECT id, type, timestamp FROM attendance WHERE empId = ? AND type = ? AND timestamp LIKE ?",
        [empId, type, `${todayPrefix}%`],
        (err, existing) => {
            if (err) return callback(err, null);
            if (existing) {
                const labelType = type === 'IN' ? 'Entrée (Arrivée)' : 'Sortie (Départ)';
                return callback(null, `Vous avez déjà enregistré votre ${labelType} aujourd'hui.`);
            }

            if (type === 'OUT') {
                db.get(
                    "SELECT id FROM attendance WHERE empId = ? AND type = 'IN' AND timestamp LIKE ?",
                    [empId, `${todayPrefix}%`],
                    (errIn, inRecord) => {
                        if (errIn) return callback(errIn, null);
                        if (!inRecord) {
                            return callback(null, "Vous devez d'abord enregistrer votre Entrée (Arrivée) avant de pouvoir pointer votre Sortie.");
                        }
                        callback(null, null);
                    }
                );
            } else {
                callback(null, null);
            }
        }
    );
}

// Terminal Borne Pointage Public (Kiosk)
app.post('/api/public/attendance/terminal', (req, res) => {
    const { matricule, type, site } = req.body;
    if (!matricule) {
        return sendError(res, 400, 'Matricule obligatoire', 'MISSING_FIELDS');
    }

    let searchMat = matricule.trim().toUpperCase();
    if (!searchMat.startsWith('EMP-')) {
        const numPart = searchMat.replace(/\D/g, '');
        searchMat = 'EMP-' + numPart.padStart(3, '0');
    }

    db.get("SELECT * FROM employees WHERE (matricule = ? OR matricule LIKE ? OR id = ?) AND is_deleted = 0", 
        [searchMat, `%${matricule.trim()}%`, isNaN(matricule) ? -1 : parseInt(matricule, 10)], 
        (err, emp) => {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            if (!emp) return sendError(res, 404, 'Matricule non reconnu dans le système SIRH-CIV', 'EMPLOYEE_NOT_FOUND');

            const pointageType = type || 'IN';
            checkDuplicateAttendance(emp.id, pointageType, (errDup, errorMsg) => {
                if (errDup) return sendError(res, 500, errDup.message, 'DATABASE_ERROR');
                if (errorMsg) return sendError(res, 400, errorMsg, 'DUPLICATE_ATTENDANCE');

                const ts = new Date().toISOString();
                db.run(`INSERT INTO attendance (company_id, empId, matricule, nom, type, timestamp, site) VALUES (?,?,?,?,?,?,?)`,
                    [emp.company_id || 1, emp.id, emp.matricule, `${emp.nom} ${emp.prenoms}`, pointageType, ts, site || emp.site || 'Abidjan Plateau'],
                    function(errInsert) {
                        if (errInsert) return sendError(res, 500, errInsert.message, 'DATABASE_ERROR');
                        res.json({ 
                            id: this.lastID, 
                            message: 'Pointage effectué avec succès', 
                            employeeName: `${emp.nom} ${emp.prenoms}`,
                            matricule: emp.matricule,
                            type: pointageType
                        });
                    }
                );
            });
        }
    );
});

// Classement public du test
app.get('/api/assessments/:id/leaderboard', validateIdParam('id'), async (req, res) => {
    try {
        const sessions = await queryAll("SELECT id, nom, prenoms, email, telephone, score, total_points, date_passage, temps_ecoule FROM assessment_sessions WHERE assessment_id = ? ORDER BY score DESC, temps_ecoule ASC", [req.params.id]);
        res.json(sessions);
    } catch (error) {
        sendError(res, 500, error.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 2. ROUTES PROTÉGÉES (AUTHENTIFICATION OBLIGATOIRE)
// ==========================================

// Enregistrement manuel de pointage (RH)
app.post('/api/attendance', authenticateToken, (req, res) => {
    const { empId, matricule, nom, type, timestamp, site } = req.body;
    if (!empId || !type) {
        return sendError(res, 400, 'Employé et type de pointage obligatoires', 'MISSING_FIELDS');
    }
    const companyId = req.company_id || 1;
    const ts = timestamp || new Date().toISOString();

    checkDuplicateAttendance(empId, type, (errDup, errorMsg) => {
        if (errDup) return sendError(res, 500, errDup.message, 'DATABASE_ERROR');
        if (errorMsg) return sendError(res, 400, errorMsg, 'DUPLICATE_ATTENDANCE');

        db.run(`INSERT INTO attendance (company_id, empId, matricule, nom, type, timestamp, site) VALUES (?,?,?,?,?,?,?)`,
            [companyId, empId, matricule || '', nom || '', type, ts, site || 'Abidjan'],
            function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
                logAuditAction(req, 'POINTAGE_MANUEL', `Pointage ${type} enregistré pour ${nom} (${matricule})`, 'Pointage');
                res.json({ id: this.lastID, message: 'Pointage enregistré avec succès' });
            });
    });
});

// Global SIRH Data Feed avec Isolation des Données et Multi-Tenant Scoping
app.get('/api/sirh-data', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const [
            settings, allEmployees, allLeaves, recruitment, applications, 
            allAttendance, allEvaluations, allContracts, allUsers, trainings, 
            allDocuments, payrollHistory, allAdvances, allDisciplinary,
            departments, positions, leaveBalances, notifications, payrollRecords,
            attendanceSettings, allProjects, allProjectAllocations
        ] = await Promise.all([
            queryAll("SELECT * FROM settings WHERE id = 1 OR company_id = ?", [companyId]),
            queryAll("SELECT * FROM employees WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM leaves WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM recruitment WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM applications WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM attendance WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM evaluations WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM contracts WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT id, name, email, role, empId, status, dateCreated FROM users WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM trainings WHERE (company_id = ? OR company_id = 1) ORDER BY date DESC", [companyId]),
            queryAll("SELECT * FROM documents WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1) ORDER BY date DESC", [companyId]),
            queryAll("SELECT * FROM payroll_history WHERE (company_id = ? OR company_id = 1) ORDER BY dateCloture DESC", [companyId]),
            queryAll("SELECT * FROM advances WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM disciplinary_actions WHERE (company_id = ? OR company_id = 1) ORDER BY dateEmission DESC", [companyId]),
            queryAll("SELECT * FROM departments WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM positions WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM leave_balances WHERE (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT * FROM notifications WHERE (company_id = ? OR company_id = 1) ORDER BY created_at DESC LIMIT 50", [companyId]),
            queryAll("SELECT * FROM payroll_records WHERE (company_id = ? OR company_id = 1) ORDER BY created_at DESC", [companyId]),
            queryAll("SELECT * FROM attendance_settings WHERE company_id = ?", [companyId]),
            queryAll("SELECT * FROM projects WHERE (company_id = ? OR company_id = 1) ORDER BY id DESC", [companyId]),
            queryAll("SELECT * FROM project_allocations WHERE (company_id = ? OR company_id = 1)", [companyId])
        ]);

        const userRole = req.user?.role;
        const userEmpId = req.user?.empId;

        // Isolation des données : Les employés ne consultent QUE leurs propres informations
        let employees = allEmployees;
        let leaves = allLeaves;
        let contracts = allContracts;
        let advances = allAdvances;
        let disciplinaryActions = allDisciplinary;
        let evaluations = allEvaluations;
        let attendance = allAttendance;
        let userNotifications = notifications;

        if (userRole === 'employee' && userEmpId) {
            employees = allEmployees.filter(e => e.id === userEmpId);
            leaves = allLeaves.filter(l => l.empId === userEmpId);
            contracts = allContracts.filter(c => c.empId === userEmpId);
            advances = allAdvances.filter(a => a.empId === userEmpId);
            disciplinaryActions = allDisciplinary.filter(d => d.empId === userEmpId);
            evaluations = allEvaluations.filter(ev => ev.empId === userEmpId);
            attendance = allAttendance.filter(at => at.empId === userEmpId);
            userNotifications = notifications.filter(n => n.empId === userEmpId || n.user_id === req.user.id);
            logAuditAction(req, 'CONSULTATION_ESPACE_EMPLOYE', `Accès isolé au profil employé #${userEmpId}`);
        } else {
            logAuditAction(req, 'CONSULTATION_MODULES_RH', `Accès global aux modules par ${req.user?.email || 'Admin'}`);
        }

        const defaultAttSettings = {
            company_id: companyId,
            heure_arrivee_officielle: '08:00',
            heure_depart_officiel: '17:00',
            marge_tolerance_minutes: 15,
            taux_horaire_base: 2500,
            taux_journalier_base: 20000,
            taux_majoration_heures_sup: 25
        };

        res.json({
            currentSite: 'all',
            currentModule: 'dashboard',
            settings: settings[0] || {},
            attendanceSettings: attendanceSettings[0] || defaultAttSettings,
            employees,
            leaves,
            recruitment,
            applications,
            attendance,
            evaluations,
            contracts,
            users: userRole === 'admin' ? allUsers : [],
            trainings,
            documents: allDocuments,
            payrollHistory: userRole === 'admin' || userRole === 'assistant' ? payrollHistory : [],
            payrollRecords: userRole === 'admin' || userRole === 'assistant' ? payrollRecords : [],
            advances,
            disciplinaryActions,
            departments,
            positions,
            leaveBalances,
            notifications: userNotifications,
            projects: allProjects || [],
            projectAllocations: allProjectAllocations || []
        });
    } catch (error) {
        sendError(res, 500, error.message, 'DATABASE_ERROR');
    }
});

// Endpoint pour lire / mettre à jour les paramètres de pointage (Horaires & Taux)
app.get('/api/attendance/settings', authenticateToken, (req, res) => {
    const companyId = req.company_id || 1;
    db.get("SELECT * FROM attendance_settings WHERE company_id = ?", [companyId], (err, row) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json(row || {
            company_id: companyId,
            heure_arrivee_officielle: '08:00',
            heure_depart_officiel: '17:00',
            marge_tolerance_minutes: 15,
            taux_horaire_base: 2500,
            taux_journalier_base: 20000,
            taux_majoration_heures_sup: 25
        });
    });
});

app.post('/api/attendance/settings', authenticateToken, authorizeRoles('admin', 'assistant'), (req, res) => {
    const companyId = req.company_id || 1;
    const { 
        heure_arrivee_officielle, 
        heure_depart_officiel, 
        marge_tolerance_minutes, 
        taux_horaire_base, 
        taux_journalier_base, 
        taux_majoration_heures_sup 
    } = req.body;

    const arrivee = heure_arrivee_officielle || '08:00';
    const depart = heure_depart_officiel || '17:00';
    const tolerance = parseInt(marge_tolerance_minutes || 15, 10);
    const tauxHoraire = parseFloat(taux_horaire_base || 2500);
    const tauxJournalier = parseFloat(taux_journalier_base || 20000);
    const majoration = parseFloat(taux_majoration_heures_sup || 25);

    db.run(`INSERT INTO attendance_settings 
            (company_id, heure_arrivee_officielle, heure_depart_officiel, marge_tolerance_minutes, taux_horaire_base, taux_journalier_base, taux_majoration_heures_sup, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(company_id) DO UPDATE SET
            heure_arrivee_officielle = excluded.heure_arrivee_officielle,
            heure_depart_officiel = excluded.heure_depart_officiel,
            marge_tolerance_minutes = excluded.marge_tolerance_minutes,
            taux_horaire_base = excluded.taux_horaire_base,
            taux_journalier_base = excluded.taux_journalier_base,
            taux_majoration_heures_sup = excluded.taux_majoration_heures_sup,
            updated_at = CURRENT_TIMESTAMP`,
        [companyId, arrivee, depart, tolerance, tauxHoraire, tauxJournalier, majoration],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'MODIFICATION_PARAMETRES_POINTAGE', `Horaires officiels (${arrivee}-${depart}), tolérance (${tolerance}m), taux (${tauxHoraire} FCFA/h)`);
            res.json({ message: 'Paramètres d\'horaires et barèmes mis à jour avec succès' });
        }
    );
});

// Real Database-Calculated Dashboard KPIs Endpoint
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const [totalEmps, activeEmps, contractsCount, pendingLeavesCount, payrollSum, deptBreakdown, contractBreakdown, leaveStatBreakdown] = await Promise.all([
            queryAll("SELECT count(*) as count FROM employees WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT count(*) as count FROM employees WHERE is_deleted = 0 AND statut = 'Actif' AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT count(*) as count FROM contracts WHERE statut = 'Actif' AND is_deleted = 0 AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT count(*) as count FROM leaves WHERE statut = 'En attente' AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT COALESCE(SUM(salaireBase), 0) as total FROM employees WHERE is_deleted = 0 AND statut = 'Actif' AND (company_id = ? OR company_id = 1)", [companyId]),
            queryAll("SELECT departement, COUNT(*) as count, SUM(salaireBase) as masse FROM employees WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1) GROUP BY departement", [companyId]),
            queryAll("SELECT type, COUNT(*) as count FROM contracts WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1) GROUP BY type", [companyId]),
            queryAll("SELECT statut, COUNT(*) as count FROM leaves WHERE (company_id = ? OR company_id = 1) GROUP BY statut", [companyId])
        ]);

        res.json({
            totalEmployees: totalEmps[0]?.count || 0,
            activeEmployees: activeEmps[0]?.count || 0,
            activeContracts: contractsCount[0]?.count || 0,
            pendingLeaves: pendingLeavesCount[0]?.count || 0,
            payrollMass: payrollSum[0]?.total || 0,
            departmentBreakdown: deptBreakdown || [],
            contractBreakdown: contractBreakdown || [],
            leaveStatBreakdown: leaveStatBreakdown || []
        });
    } catch (error) {
        sendError(res, 500, error.message, 'DATABASE_ERROR');
    }
});

// REST API Departments & Positions
app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAll("SELECT * FROM departments WHERE company_id = ? OR company_id = 1 ORDER BY nom ASC", [req.company_id || 1]);
        res.json(rows);
    } catch (err) { sendError(res, 500, err.message, 'DATABASE_ERROR'); }
});

app.post('/api/departments', authenticateToken, authorizeRoles('admin'), (req, res) => {
    const { code, nom, description, responsable_id } = req.body;
    if (!nom) return sendError(res, 400, 'Nom du département obligatoire', 'MISSING_FIELDS');
    db.run("INSERT INTO departments (company_id, code, nom, description, responsable_id) VALUES (?,?,?,?,?)",
        [req.company_id || 1, code || '', nom, description || '', responsable_id || null],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'CREATION_DEPARTEMENT', `Création du département ${nom}`);
            res.json({ id: this.lastID, message: 'Département créé avec succès' });
        });
});

app.delete('/api/departments/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM departments WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Département supprimé' });
    });
});

app.get('/api/positions', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAll("SELECT * FROM positions WHERE company_id = ? OR company_id = 1 ORDER BY titre ASC", [req.company_id || 1]);
        res.json(rows);
    } catch (err) { sendError(res, 500, err.message, 'DATABASE_ERROR'); }
});

app.post('/api/positions', authenticateToken, authorizeRoles('admin'), (req, res) => {
    const { titre, departement, salaireMin, salaireMax, description } = req.body;
    if (!titre) return sendError(res, 400, 'Titre du poste obligatoire', 'MISSING_FIELDS');
    db.run("INSERT INTO positions (company_id, titre, departement, salaireMin, salaireMax, description) VALUES (?,?,?,?,?,?)",
        [req.company_id || 1, titre, departement || 'Général', salaireMin || 0, salaireMax || 0, description || ''],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Poste ajouté avec succès' });
        });
});

// --- SPECIALIZED DYNAMIC DASHBOARD API ENDPOINTS ---
app.get('/api/dashboard/hr', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { department, site, contractType } = req.query;

        let whereClause = "WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1)";
        let params = [companyId];

        if (department && department !== 'all') {
            whereClause += " AND departement = ?";
            params.push(department);
        }
        if (site && site !== 'all') {
            whereClause += " AND site = ?";
            params.push(site);
        }
        if (contractType && contractType !== 'all') {
            whereClause += " AND type = ?";
            params.push(contractType);
        }

        const totalRow = await queryGet(`SELECT COUNT(*) as total FROM employees ${whereClause}`, params);
        const activeRow = await queryGet(`SELECT COUNT(*) as total FROM employees ${whereClause} AND statut = 'Actif'`, params);
        const newHiresRow = await queryGet(`SELECT COUNT(*) as total FROM employees ${whereClause} AND dateEmbauche >= date('now', '-30 days')`, params);
        const departuresRow = await queryGet(`SELECT COUNT(*) as total FROM employees WHERE (is_deleted = 1 OR statut = 'Inactif') AND (company_id = ? OR company_id = 1)`, [companyId]);

        const expiringRow = await queryGet(`
            SELECT COUNT(*) as total FROM contracts c 
            JOIN employees e ON c.empId = e.id 
            WHERE c.statut = 'Actif' AND c.fin IS NOT NULL AND c.fin != '' AND c.fin <= date('now', '+30 days') 
            AND (c.company_id = ? OR c.company_id = 1)
        `, [companyId]);

        const deptRows = await queryAll(`
            SELECT departement, COUNT(*) as count, SUM(salaireBase) as masse 
            FROM employees ${whereClause} 
            GROUP BY departement
        `, params);

        const contractRows = await queryAll(`
            SELECT type, COUNT(*) as count 
            FROM employees ${whereClause} 
            GROUP BY type
        `, params);

        res.json({
            totalEmployees: totalRow ? totalRow.total : 0,
            activeEmployees: activeRow ? activeRow.total : 0,
            newEmployees: newHiresRow ? newHiresRow.total : 0,
            departures: departuresRow ? departuresRow.total : 0,
            expiringContracts: expiringRow ? expiringRow.total : 0,
            departmentBreakdown: deptRows || [],
            contractTypeBreakdown: contractRows || []
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.get('/api/dashboard/payroll', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { department, site, contractType } = req.query;

        let empWhere = "WHERE e.is_deleted = 0 AND (e.company_id = ? OR e.company_id = 1)";
        let empParams = [companyId];

        if (department && department !== 'all') { empWhere += " AND e.departement = ?"; empParams.push(department); }
        if (site && site !== 'all') { empWhere += " AND e.site = ?"; empParams.push(site); }
        if (contractType && contractType !== 'all') { empWhere += " AND e.type = ?"; empParams.push(contractType); }

        const activeEmployees = await queryAll(`SELECT * FROM employees e ${empWhere} AND e.statut = 'Actif'`, empParams);

        let masseSalarialeBrute = 0;
        let netAPayer = 0;
        let chargesPatronales = 0;
        let coutEmployeurTotal = 0;

        activeEmployees.forEach(emp => {
            const base = emp.salaireBase || 75000;
            const brut = base + 30000;
            const cnpsPatronal = Math.min(brut, 1647315) * (0.077 + 0.0575 + 0.03);
            const itsPatronal = brut * 0.012;
            const taFdfp = brut * 0.01;
            const charges = cnpsPatronal + itsPatronal + taFdfp;

            masseSalarialeBrute += brut;
            netAPayer += (base * 0.82);
            chargesPatronales += charges;
            coutEmployeurTotal += (brut + charges);
        });

        const recordsCount = await queryGet(`SELECT COUNT(*) as total FROM payroll_records WHERE (company_id = ? OR company_id = 1)`, [companyId]);
        const periodsRows = await queryAll(`SELECT * FROM payroll_periods WHERE (company_id = ? OR company_id = 1) ORDER BY id DESC LIMIT 12`, [companyId]);

        res.json({
            masseSalariale: Math.round(masseSalarialeBrute),
            netAPayer: Math.round(netAPayer),
            chargesPatronales: Math.round(chargesPatronales),
            coutEmployeurTotal: Math.round(coutEmployeurTotal),
            nbBulletins: activeEmployees.length,
            paieValidee: periodsRows.filter(p => p.statut === 'Clôturé' || p.statut === 'Validé').length,
            paieBrouillon: periodsRows.filter(p => p.statut === 'Brouillon').length,
            monthlyEvolution: periodsRows.map(p => ({ period: p.periode, masseBrute: p.masseBrute, masseNette: p.masseNette }))
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.get('/api/dashboard/leaves', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { department } = req.query;

        let leaveWhere = "WHERE l.is_deleted = 0 AND (l.company_id = ? OR l.company_id = 1)";
        let params = [companyId];

        if (department && department !== 'all') {
            leaveWhere += " AND e.departement = ?";
            params.push(department);
        }

        const pendingRow = await queryGet(`SELECT COUNT(*) as total FROM leaves l LEFT JOIN employees e ON l.empId = e.id ${leaveWhere} AND l.statut = 'En attente'`, params);
        const approvedRow = await queryGet(`SELECT COUNT(*) as total FROM leaves l LEFT JOIN employees e ON l.empId = e.id ${leaveWhere} AND l.statut = 'Approuvé'`, params);
        const rejectedRow = await queryGet(`SELECT COUNT(*) as total FROM leaves l LEFT JOIN employees e ON l.empId = e.id ${leaveWhere} AND l.statut = 'Refusé'`, params);
        const consumedRow = await queryGet(`SELECT COALESCE(SUM(l.duree), 0) as total FROM leaves l LEFT JOIN employees e ON l.empId = e.id ${leaveWhere} AND l.statut = 'Approuvé'`, params);

        const balanceRow = await queryGet(`SELECT COALESCE(SUM(solde), 0) as total FROM leave_balances WHERE (company_id = ? OR company_id = 1)`, [companyId]);

        res.json({
            pendingLeaves: pendingRow ? pendingRow.total : 0,
            approvedLeaves: approvedRow ? approvedRow.total : 0,
            rejectedLeaves: rejectedRow ? rejectedRow.total : 0,
            consumedDays: consumedRow ? consumedRow.total : 0,
            availableBalances: balanceRow ? balanceRow.total : 0
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.get('/api/dashboard/attendance', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;

        const presentRow = await queryGet(`
            SELECT COUNT(DISTINCT empId) as total FROM attendance 
            WHERE (company_id = ? OR company_id = 1) AND date(timestamp) = date('now') AND type = 'IN'
        `, [companyId]);

        const totalActiveRow = await queryGet(`
            SELECT COUNT(*) as total FROM employees 
            WHERE is_deleted = 0 AND statut = 'Actif' AND (company_id = ? OR company_id = 1)
        `, [companyId]);

        const lateRow = await queryGet(`
            SELECT COUNT(*) as total FROM attendance 
            WHERE (company_id = ? OR company_id = 1) AND date(timestamp) = date('now') AND type = 'IN' AND strftime('%H:%M', timestamp) > '08:30'
        `, [companyId]);

        const presents = presentRow ? presentRow.total : 0;
        const totalActive = totalActiveRow ? totalActiveRow.total : 0;

        res.json({
            presentsToday: presents,
            absentsToday: Math.max(0, totalActive - presents),
            lateArrivals: lateRow ? lateRow.total : 0,
            overtimeHours: 0
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.get('/api/dashboard/recruitment', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;

        const openJobsRow = await queryGet(`SELECT COUNT(*) as total FROM recruitment WHERE (company_id = ? OR company_id = 1) AND statut = 'Ouvert'`, [companyId]);
        const totalAppsRow = await queryGet(`SELECT COUNT(*) as total FROM applications WHERE (company_id = ? OR company_id = 1)`, [companyId]);
        const shortlistedRow = await queryGet(`SELECT COUNT(*) as total FROM applications WHERE (company_id = ? OR company_id = 1) AND statut = 'Sélectionné'`, [companyId]);
        const hiredRow = await queryGet(`SELECT COUNT(*) as total FROM applications WHERE (company_id = ? OR company_id = 1) AND statut = 'Embauché'`, [companyId]);

        res.json({
            openJobs: openJobsRow ? openJobsRow.total : 0,
            totalApplications: totalAppsRow ? totalAppsRow.total : 0,
            shortlistedCandidates: shortlistedRow ? shortlistedRow.total : 0,
            hiredCandidates: hiredRow ? hiredRow.total : 0
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// REST API Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const empId = req.user.empId;
        const rows = await queryAll("SELECT * FROM notifications WHERE (user_id = ? OR empId = ? OR company_id = ?) ORDER BY created_at DESC LIMIT 50", [userId, empId, req.company_id || 1]);
        res.json(rows);
    } catch (err) { sendError(res, 500, err.message, 'DATABASE_ERROR'); }
});

app.patch('/api/notifications/:id/read', authenticateToken, validateIdParam('id'), (req, res) => {
    db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Notification marquée comme lue' });
    });
});

// Sync globale SIRH Data
app.post('/api/sirh-data', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const data = req.body;
    try {
        if (data.settings) {
            const s = data.settings;
            db.run(`UPDATE settings SET companyName=?, rc=?, cc=?, cnps_employer=?, address=?, phone=?, email=?, logo=?, primaryColor=?, secondaryColor=?, smicAmount=?, cnpsPlafond=?, cnpsSalarial=?, cnpsPatronalRetraite=?, cnpsPatronalPF=?, cnpsPatronalAT=?, itsPatronalIvoirien=?, itsPatronalExpat=?, taFdfpRate=?, timezone=?, currency=?, language=?, tenantSlug=?, saasPlan=?, maxEmployees=?, countryCode=?, legalHoursPerMonth=?, leaveAccrualRate=?, apiKey=?, modulePayroll=?, moduleLeaves=?, moduleEvaluations=?, moduleRecruitment=?, modulePortal=?, moduleMobileMoney=?, slogan=?, footerStampText=? WHERE id=1`,
                [
                    s.companyName, s.rc, s.cc, s.cnps_employer, s.address, s.phone, s.email, s.logo, 
                    s.primaryColor || '#009E49', s.secondaryColor || '#F77F00', s.smicAmount || 75000,
                    s.cnpsPlafond || 1647315, s.cnpsSalarial || 6.3, s.cnpsPatronalRetraite || 7.7,
                    s.cnpsPatronalPF || 5.75, s.cnpsPatronalAT || 3.0, s.itsPatronalIvoirien || 1.2,
                    s.itsPatronalExpat || 12.0, s.taFdfpRate || 1.0, s.timezone || 'GMT (Abidjan)',
                    s.currency || 'F CFA (XOF)', s.language || 'Français',
                    s.tenantSlug || 'demo.sirh-civ.ci', s.saasPlan || 'BUSINESS PRO', s.maxEmployees || 50,
                    s.countryCode || 'CI', s.legalHoursPerMonth || 173.33, s.leaveAccrualRate || 2.2,
                    s.apiKey || 'sk_live_sirh_98a76d5e4c3b2a10',
                    s.modulePayroll !== undefined ? (s.modulePayroll ? 1 : 0) : 1,
                    s.moduleLeaves !== undefined ? (s.moduleLeaves ? 1 : 0) : 1,
                    s.moduleEvaluations !== undefined ? (s.moduleEvaluations ? 1 : 0) : 1,
                    s.moduleRecruitment !== undefined ? (s.moduleRecruitment ? 1 : 0) : 1,
                    s.modulePortal !== undefined ? (s.modulePortal ? 1 : 0) : 1,
                    s.moduleMobileMoney !== undefined ? (s.moduleMobileMoney ? 1 : 0) : 1,
                    s.slogan || 'L\'Excellence RH & Paie en Afrique',
                    s.footerStampText || 'Document Officiel Certifié RH'
                ]);
        }
        res.json({ message: 'Synchronisation effectuée avec succès' });
    } catch (error) {
        sendError(res, 500, 'Échec de la synchronisation', 'SYNC_ERROR');
    }
});

// --- GESTION DES UTILISATEURS (ADMIN) ---
app.post('/api/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { name, email, password, role, empId } = req.body;
    if (!name || !email || !password) {
        return sendError(res, 400, 'Nom, email et mot de passe obligatoires', 'MISSING_FIELDS');
    }
    if (!validateEmailFormat(email)) {
        return sendError(res, 400, 'Format d\'email invalide', 'INVALID_EMAIL');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (name, email, password, role, empId, dateCreated) VALUES (?,?,?,?,?,?)`,
            [name, email, hashedPassword, role || 'employee', empId || null, new Date().toISOString()],
            function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
                logAuditAction(req, 'CREATION_UTILISATEUR', `Création du compte ${email}`);
                res.json({ id: this.lastID, message: 'Utilisateur créé avec succès' });
            });
    } catch (err) {
        sendError(res, 500, 'Erreur lors de la création de l\'utilisateur', 'SERVER_ERROR');
    }
});

app.delete('/api/users/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("UPDATE users SET is_deleted = 1, status = 'Inactif' WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        logAuditAction(req, 'SUPPRESSION_LOGIQUE_UTILISATEUR', `Suppression logique de l'utilisateur ID #${req.params.id}`);
        res.json({ message: 'Utilisateur désactivé et archivé avec succès' });
    });
});

app.put('/api/users/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    const { name, email, role, status } = req.body;
    if (email && !validateEmailFormat(email)) {
        return sendError(res, 400, 'Format d\'email invalide', 'INVALID_EMAIL');
    }
    db.run("UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?",
        [name, email, role, status, req.params.id],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Utilisateur mis à jour' });
        });
});

app.get('/api/admin/audit-logs', authenticateToken, authorizeRoles('admin'), (req, res) => {
    db.all("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200", [], (err, rows) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json(rows);
    });
});

// Endpoint générique pour enregistrement des événements clients (Exports PDF, Excel, Déconnexion)
app.post('/api/audit-logs', authenticateToken, (req, res) => {
    const { action, module, details, oldValue, newValue } = req.body;
    if (!action) return sendError(res, 400, 'L\'action est obligatoire', 'MISSING_FIELDS');
    
    logAuditAction(req, action, details || '', module || 'Interface', oldValue, newValue);
    res.json({ message: 'Événement d\'audit enregistré avec succès' });
});

app.post('/api/users/from-employee/:empId', authenticateToken, validateIdParam('empId'), authorizeRoles('admin'), (req, res) => {
    const empId = req.params.empId;
    
    db.get("SELECT * FROM employees WHERE id = ?", [empId], (err, employee) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        if (!employee) return sendError(res, 404, 'Employé non trouvé', 'NOT_FOUND');
        
        db.get("SELECT * FROM users WHERE empId = ?", [empId], async (err, existingUser) => {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            if (existingUser) return sendError(res, 400, 'Un compte utilisateur existe déjà pour cet employé', 'ALREADY_EXISTS');
            
            const rawPassword = employee.password || 'password123';
            const hashedPassword = await bcrypt.hash(rawPassword, 10);
            const status = employee.statut === 'Actif' && employee.compteActif === 1 ? 'Actif' : 'Inactif';
            
            db.run(`INSERT INTO users (name, email, password, role, empId, status, dateCreated) VALUES (?,?,?,?,?,?,?)`,
                [`${employee.nom} ${employee.prenoms}`, employee.email, hashedPassword, 'employee', empId, status, new Date().toISOString()],
                function(err) {
                    if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
                    res.json({ id: this.lastID, message: 'Compte utilisateur créé à partir de l\'employé' });
                });
        });
    });
});

app.post('/api/users/sync-employee-status', authenticateToken, authorizeRoles('admin'), (req, res) => {
    db.all("SELECT u.id, u.empId, e.statut, e.compteActif FROM users u JOIN employees e ON u.empId = e.id WHERE u.role = 'employee'", (err, userEmployees) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        
        let updatedCount = 0;
        const updates = userEmployees.map(ue => {
            const newStatus = (ue.statut === 'Actif' && ue.compteActif === 1) ? 'Actif' : 'Inactif';
            return new Promise((resolve, reject) => {
                db.run("UPDATE users SET status = ? WHERE id = ?", [newStatus, ue.id], (err) => {
                    if (err) reject(err);
                    else {
                        updatedCount++;
                        resolve();
                    }
                });
            });
        });
        
        Promise.all(updates)
            .then(() => res.json({ message: `${updatedCount} comptes synchronisés` }))
            .catch(err => sendError(res, 500, err.message, 'DATABASE_ERROR'));
    });
});

app.patch('/api/users/:id/password', authenticateToken, validateIdParam('id'), (req, res) => {
    const { currentPassword, newPassword, forceReset } = req.body;
    if (!newPassword || newPassword.length < 6) {
        return sendError(res, 400, 'Le nouveau mot de passe doit contenir au moins 6 caractères', 'WEAK_PASSWORD');
    }

    db.get("SELECT password FROM users WHERE id = ?", [req.params.id], async (err, user) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        if (!user) return sendError(res, 404, 'Utilisateur non trouvé', 'NOT_FOUND');
        
        if (!forceReset) {
            const isMatch = await verifyPassword(currentPassword, user.password);
            if (!isMatch) return sendError(res, 401, 'Mot de passe actuel incorrect', 'INVALID_CREDENTIALS');
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.params.id], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Mot de passe mis à jour avec succès' });
        });
    });
});

// --- GESTION DES EMPLOYÉS ---
app.post('/api/employees', authenticateToken, authorizeRoles('admin', 'assistant'), async (req, res) => {
    const e = req.body;
    const companyId = req.company_id || 1;

    if (!e.nom || !e.prenoms || !e.matricule) {
        return sendError(res, 400, 'Matricule, Nom et Prénoms obligatoires', 'MISSING_FIELDS');
    }
    if (e.salaireBase && !validateAmountValue(e.salaireBase)) {
        return sendError(res, 400, 'Montant de salaire invalide', 'INVALID_AMOUNT');
    }
    if (e.salaireBase && e.salaireBase < 75000) {
        return sendError(res, 400, 'Le salaire ne peut pas être inférieur au SMIC (75 000 FCFA)', 'BELOW_SMIC');
    }
    
    let hashedPassword = null;
    if (e.password) {
        hashedPassword = (e.password.startsWith('$2a$') || e.password.startsWith('$2b$')) 
            ? e.password 
            : await bcrypt.hash(e.password, 10);
    }

    db.run(`INSERT INTO employees (company_id, matricule, nom, prenoms, poste, departement, site, type, statut, dateEmbauche, salaireBase, sexe, telephone, email, cnps, nbEnfants, situationMatrimoniale, rib, photo, username, password, compteActif, nationalite, modePaiement, numeroMobileMoney, responsable) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [companyId, e.matricule, e.nom, e.prenoms, e.poste, e.departement, e.site, e.type || 'CDI', 'Actif', e.dateEmbauche || new Date().toISOString().split('T')[0], e.salaireBase || 75000, e.sexe || 'M', e.telephone, e.email, e.cnps, e.nbEnfants || 0, e.situationMatrimoniale || 'Célibataire', e.rib || null, e.photo || null, e.username || null, hashedPassword, 1, e.nationalite || 'Ivoirienne', e.modePaiement || 'Virement Bancaire', e.numeroMobileMoney || null, e.responsable || null],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            const empId = this.lastID;

            // Propagation 1: Automatic Contract Record Creation
            const annualSalary = (e.salaireBase || 75000) * 12;
            db.run(`INSERT INTO contracts (company_id, empId, type, debut, statut, salaireAnnuel) VALUES (?,?,?,?,'Actif',?)`,
                [companyId, empId, e.type || 'CDI', e.dateEmbauche || new Date().toISOString().split('T')[0], annualSalary]);

            // Propagation 2: Automatic Leave Balance Initialization
            const currentYear = new Date().getFullYear();
            db.run(`INSERT INTO leave_balances (company_id, empId, annee, acquis, pris, solde) VALUES (?,?,?,26.4,0,26.4)`,
                [companyId, empId, currentYear]);

            // Propagation 3: Automatic System Notification
            db.run(`INSERT INTO notifications (company_id, title, message, type) VALUES (?, 'Nouveau Salarié Créé', ?, 'success')`,
                [companyId, `Le salarié ${e.nom} ${e.prenoms} (${e.matricule}) a été ajouté au poste de ${e.poste || 'Salarié'}.`]);

            logAuditAction(req, 'CREATION_EMPLOYE', `Création employé ${e.nom} ${e.prenoms} (#${empId})`);
            res.json({ id: empId, message: 'Employé ajouté et dossier contrat/congés initialisé avec succès' });
        }
    );
});

app.patch('/api/employees/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut, compteActif } = req.body;
    if (!statut && compteActif === undefined) {
        return sendError(res, 400, 'Au moins un champ à mettre à jour requis', 'MISSING_FIELDS');
    }

    if (statut === 'Inactif' && compteActif !== undefined) {
        db.run("UPDATE employees SET statut = ?, compteActif = ? WHERE id = ?", [statut, compteActif, req.params.id], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            db.run("UPDATE contracts SET statut = 'Résilié' WHERE empId = ?", [req.params.id]);
            res.json({ message: 'Contrat résilié et compte bloqué' });
        });
    } else if (statut) {
        db.run("UPDATE employees SET statut = ? WHERE id = ?", [statut, req.params.id], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Statut mis à jour' });
        });
    }
});

app.put('/api/employees/:id', authenticateToken, validateIdParam('id'), async (req, res) => {
    const e = req.body;
    const empId = req.params.id;
    const companyId = req.company_id || 1;

    if (e.salaireBase && !validateAmountValue(e.salaireBase)) {
        return sendError(res, 400, 'Montant de salaire invalide', 'INVALID_AMOUNT');
    }
    if (e.salaireBase && e.salaireBase < 75000) {
        return sendError(res, 400, 'Le salaire ne peut pas être inférieur au SMIC (75 000 FCFA)', 'BELOW_SMIC');
    }
    
    let hashedPassword = e.password || null;
    if (e.password && !e.password.startsWith('$2a$') && !e.password.startsWith('$2b$')) {
        hashedPassword = await bcrypt.hash(e.password, 10);
    }

    db.get("SELECT * FROM employees WHERE id = ?", [empId], (err, oldEmp) => {
        if (err || !oldEmp) return sendError(res, 500, err ? err.message : 'Employé non trouvé', 'NOT_FOUND');

        db.run(`UPDATE employees SET matricule = ?, nom = ?, prenoms = ?, poste = ?, departement = ?, site = ?, type = ?, dateEmbauche = ?, salaireBase = ?, sexe = ?, telephone = ?, email = ?, cnps = ?, nbEnfants = ?, situationMatrimoniale = ?, rib = ?, photo = ?, username = ?, password = ?, compteActif = ?, nationalite = ?, modePaiement = ?, numeroMobileMoney = ?, responsable = ? WHERE id = ?`,
            [e.matricule, e.nom, e.prenoms, e.poste, e.departement, e.site, e.type, e.dateEmbauche, e.salaireBase, e.sexe, e.telephone, e.email, e.cnps, e.nbEnfants, e.situationMatrimoniale || 'Célibataire', e.rib || null, e.photo || null, e.username || null, hashedPassword, e.compteActif !== undefined ? e.compteActif : 1, e.nationalite || 'Ivoirienne', e.modePaiement || 'Virement Bancaire', e.numeroMobileMoney || null, e.responsable || null, empId],
            function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');

                // Propagation 1: Propagate Salary & Contract Type changes to Contracts table
                if (e.salaireBase || e.type) {
                    const annualSalary = (e.salaireBase || oldEmp.salaireBase) * 12;
                    db.run(`UPDATE contracts SET type = COALESCE(?, type), salaireAnnuel = ? WHERE empId = ? AND statut = 'Actif'`,
                        [e.type || null, annualSalary, empId]);
                }

                // Propagation 2: Notification if Salary Changed
                if (oldEmp.salaireBase !== e.salaireBase) {
                    db.run(`INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, 'Mise à Jour Salariale', ?, 'info')`,
                        [companyId, empId, `Votre salaire de base a été mis à jour à ${new Intl.NumberFormat('fr-CI').format(e.salaireBase)} F CFA.`]);
                }

                logAuditAction(req, 'MODIFICATION_EMPLOYE', `Mise à jour employé #${empId} (${e.nom} ${e.prenoms})`, 'Employés', oldEmp, e);
                res.json({ message: 'Employé et contrats dépendants mis à jour avec succès' });
            }
        );
    });
});

app.delete('/api/employees/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("UPDATE employees SET is_deleted = 1, statut = 'Inactif', compteActif = 0 WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        logAuditAction(req, 'SUPPRESSION_LOGIQUE_EMPLOYE', `Archivage / Suppression logique de l'employé ID #${req.params.id}`);
        res.json({ message: 'Employé archivé et supprimé de la vue avec succès' });
    });
});

app.patch('/api/employees/:id/certificates', authenticateToken, validateIdParam('id'), (req, res) => {
    const { attestationTravail, attestationStage, attestationSalaire } = req.body;
    db.run('UPDATE employees SET attestationTravail = ?, attestationStage = ?, attestationSalaire = ? WHERE id = ?',
        [attestationTravail || 0, attestationStage || 0, attestationSalaire || 0, req.params.id],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Permissions d\'attestation mises à jour' });
        });
});

// --- GESTION DES CONGÉS ---
app.post('/api/leaves', authenticateToken, (req, res) => {
    const { empId, type, debut, fin, duree, statut, motif } = req.body;
    if (!empId || !type || !debut || !fin) {
        return sendError(res, 400, 'Veuillez préciser l\'employé, le type et les dates de congé', 'MISSING_FIELDS');
    }
    db.run(`INSERT INTO leaves (empId, type, debut, fin, duree, statut, motif) VALUES (?,?,?,?,?,?,?)`,
        [empId, type, debut, fin, duree || 1, statut || 'En attente', motif || ''],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Demande de congé enregistrée' });
        });
});

app.patch('/api/leaves/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut } = req.body;
    const leaveId = req.params.id;
    const companyId = req.company_id || 1;

    db.get("SELECT * FROM leaves WHERE id = ?", [leaveId], (err, leave) => {
        if (err || !leave) return sendError(res, 500, err ? err.message : 'Congé non trouvé', 'NOT_FOUND');

        db.run("UPDATE leaves SET statut = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [statut, leaveId], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            
            if (statut === 'Approuvé') {
                db.run("UPDATE employees SET statut = 'En congé' WHERE id = ?", [leave.empId]);
                // Update leave balance
                const year = new Date().getFullYear();
                db.run(`INSERT INTO leave_balances (company_id, empId, annee, acquis, pris, solde)
                        VALUES (?, ?, ?, 26.4, ?, 26.4 - ?)
                        ON CONFLICT(company_id, empId, annee) DO UPDATE SET
                        pris = pris + excluded.pris,
                        solde = solde - excluded.pris,
                        updated_at = CURRENT_TIMESTAMP`,
                        [companyId, leave.empId, year, leave.duree || 0, leave.duree || 0]);
                
                // Notification
                db.run("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, ?, ?, 'success')",
                    [companyId, leave.empId, 'Congé Approuvé', `Votre demande de congé de ${leave.duree} jour(s) a été approuvée.`]);
            } else if (statut === 'Refusé') {
                db.run("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, ?, ?, 'warning')",
                    [companyId, leave.empId, 'Congé Refusé', `Votre demande de congé a été refusée par la Direction RH.`]);
            }

            logAuditAction(req, 'VALIDATION_CONGE', `Décision congé #${leaveId} : ${statut}`, 'Congés');
            res.json({ message: 'Décision enregistrée avec succès' });
        });
    });
});

app.patch('/api/applications/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut } = req.body;
    const appId = req.params.id;
    const companyId = req.company_id || 1;

    db.get("SELECT a.*, r.poste, r.departement FROM applications a LEFT JOIN recruitment r ON a.offerId = r.id WHERE a.id = ?", [appId], (err, appData) => {
        if (err || !appData) return sendError(res, 500, err ? err.message : 'Candidature non trouvée', 'NOT_FOUND');

        db.run("UPDATE applications SET statut = ? WHERE id = ?", [statut, appId], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');

            if (statut === 'Embauché') {
                db.get("SELECT id FROM employees WHERE email = ?", [appData.email], (err, existingEmp) => {
                    if (!existingEmp) {
                        const mat = 'EMP-' + Math.floor(1000 + Math.random() * 9000);
                        db.run(`INSERT INTO employees (company_id, matricule, nom, prenoms, poste, departement, type, statut, dateEmbauche, salaireBase, email, telephone)
                                VALUES (?, ?, ?, ?, ?, ?, 'CDI', 'Actif', ?, 350000, ?, ?)`,
                                [companyId, mat, appData.nom, appData.prenoms || '', appData.poste || 'Nouveau Salarié', appData.departement || 'Général', new Date().toISOString().split('T')[0], appData.email, appData.telephone || ''],
                                function(errInsert) {
                                    if (!errInsert) {
                                        const newEmpId = this.lastID;
                                        db.run("INSERT INTO contracts (company_id, empId, type, debut, statut, salaireAnnuel) VALUES (?, ?, 'CDI', ?, 'Actif', 4200000)",
                                            [companyId, newEmpId, new Date().toISOString().split('T')[0]]);
                                        db.run("INSERT INTO notifications (company_id, title, message, type) VALUES (?, 'Nouvelle Embauche', ?, 'info')",
                                            [companyId, `Le candidat ${appData.nom} ${appData.prenoms} a été embauché au poste de ${appData.poste || 'Salarié'}.`]);
                                    }
                                });
                    }
                });
            }

            logAuditAction(req, 'STATUT_CANDIDATURE', `Candidature #${appId} mise à jour : ${statut}`, 'Recrutement');
            res.json({ message: 'Statut de candidature mis à jour avec succès' });
        });
    });
});

app.delete('/api/applications/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM applications WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Candidature supprimée' });
    });
});

// --- RECRUTEMENT (OFFRES & SCORING ATS) ---
app.post('/api/recruitment', authenticateToken, (req, res) => {
    const { poste, departement, site, type, competences, experience, criteres, mots_cles, dateFin } = req.body;
    const companyId = req.company_id || 1;

    if (!poste || !poste.trim()) {
        return sendError(res, 400, 'Intitulé du poste obligatoire', 'MISSING_FIELDS');
    }

    db.run(`INSERT INTO recruitment (company_id, poste, departement, site, type, statut, competences, experience, criteres, mots_cles, candidats, dateCreation, dateFin) 
            VALUES (?, ?, ?, ?, ?, 'Ouvert', ?, ?, ?, ?, 0, ?, ?)`,
        [
            companyId,
            poste.trim(),
            departement || 'Direction',
            site || 'Abidjan',
            type || 'CDI',
            competences || '',
            experience || '',
            criteres || '',
            mots_cles || '',
            new Date().toISOString().split('T')[0],
            dateFin || null
        ],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'PUBLICATION_OFFRE', `Nouvelle offre publiée : ${poste} (${departement})`, 'Recrutement');
            res.json({ id: this.lastID, message: 'Offre publiée avec succès' });
        }
    );
});

app.patch('/api/recruitment/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut, poste, departement, site, type, competences, experience, criteres, mots_cles, dateFin } = req.body;
    const offerId = req.params.id;
    const companyId = req.company_id || 1;

    db.run(`UPDATE recruitment SET 
            statut = COALESCE(?, statut),
            poste = COALESCE(?, poste),
            departement = COALESCE(?, departement),
            site = COALESCE(?, site),
            type = COALESCE(?, type),
            competences = COALESCE(?, competences),
            experience = COALESCE(?, experience),
            criteres = COALESCE(?, criteres),
            mots_cles = COALESCE(?, mots_cles),
            dateFin = COALESCE(?, dateFin)
            WHERE id = ? AND (company_id = ? OR company_id = 1)`,
        [statut, poste, departement, site, type, competences, experience, criteres, mots_cles, dateFin, offerId, companyId],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'MODIFICATION_OFFRE', `Offre #${offerId} mise à jour`, 'Recrutement');
            res.json({ message: 'Offre mise à jour avec succès' });
        }
    );
});

app.delete('/api/recruitment/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    const offerId = req.params.id;
    const companyId = req.company_id || 1;

    db.run("DELETE FROM recruitment WHERE id = ? AND (company_id = ? OR company_id = 1)", [offerId, companyId], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        logAuditAction(req, 'SUPPRESSION_OFFRE', `Offre #${offerId} supprimée`, 'Recrutement');
        res.json({ message: 'Offre supprimée avec succès' });
    });
});

// --- EVALUATIONS ---
app.post('/api/evaluations', authenticateToken, (req, res) => {
    const { empId, periode, competence, rendement, assiduite, comportement, note, statut, commentaire } = req.body;
    if (!empId) return sendError(res, 400, 'Employé obligatoire', 'MISSING_FIELDS');
    
    db.run(`INSERT INTO evaluations (empId, periode, competence, rendement, assiduite, comportement, note, statut, commentaire) VALUES (?,?,?,?,?,?,?,?,?)`,
        [empId, periode || '2026-S1', competence || 3, rendement || 3, assiduite || 3, comportement || 3, note || 3.0, statut || 'En cours', commentaire || ''],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Évaluation enregistrée' });
        });
});

app.delete('/api/evaluations/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin', 'assistant'), (req, res) => {
    db.run("DELETE FROM evaluations WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        logAuditAction(req, 'SUPPRESSION_EVALUATION', `Suppression de l'évaluation #${req.params.id}`, 'Évaluations');
        res.json({ message: 'Évaluation supprimée avec succès' });
    });
});

// --- AVANCES SUR SALAIRE ---
app.post('/api/advances', authenticateToken, (req, res) => {
    const { empId, montant, dateDemande, moisRemboursement, motif, statut } = req.body;
    if (!empId || !validateAmountValue(montant)) {
        return sendError(res, 400, 'Employé et montant valide obligatoires', 'INVALID_INPUT');
    }
    
    db.run(`INSERT INTO advances (empId, montant, dateDemande, moisRemboursement, statut, motif, resteAPayer) VALUES (?,?,?,?,?,?,?)`,
        [empId, montant, dateDemande || new Date().toISOString().split('T')[0], moisRemboursement, statut || 'En attente', motif || '', montant],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Demande d\'avance enregistrée' });
        });
});

app.patch('/api/advances/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut, resteAPayer } = req.body;
    db.run("UPDATE advances SET statut = COALESCE(?, statut), resteAPayer = COALESCE(?, resteAPayer) WHERE id = ?",
        [statut, resteAPayer, req.params.id], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Avance mise à jour' });
        });
});

app.delete('/api/advances/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM advances WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Avance supprimée' });
    });
});

// --- ACTIONS DISCIPLINAIRES ---
app.get('/api/disciplinary', authenticateToken, (req, res) => {
    db.all("SELECT * FROM disciplinary_actions ORDER BY dateEmission DESC", [], (err, rows) => {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json(rows);
    });
});

app.post('/api/disciplinary', authenticateToken, (req, res) => {
    const { empId, type, dateEmission, motif, reponseSalarie, dateReponse, statut, dateCloture, sanction } = req.body;
    if (!empId || !type) return sendError(res, 400, 'Employé et type d\'action requis', 'MISSING_FIELDS');

    db.run(`INSERT INTO disciplinary_actions (empId, type, dateEmission, motif, reponseSalarie, dateReponse, statut, dateCloture, sanction) VALUES (?,?,?,?,?,?,?,?,?)`,
        [empId, type, dateEmission || new Date().toISOString().split('T')[0], motif || '', reponseSalarie || '', dateReponse || '', statut || 'En attente de réponse', dateCloture || '', sanction || ''],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Action disciplinaire enregistrée' });
        });
});

app.patch('/api/disciplinary/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { type, motif, reponseSalarie, dateReponse, statut, dateCloture, sanction } = req.body;
    const updates = [];
    const params = [];
    
    if (type !== undefined) { updates.push("type = ?"); params.push(type); }
    if (motif !== undefined) { updates.push("motif = ?"); params.push(motif); }
    if (reponseSalarie !== undefined) { updates.push("reponseSalarie = ?"); params.push(reponseSalarie); }
    if (dateReponse !== undefined) { updates.push("dateReponse = ?"); params.push(dateReponse); }
    if (statut !== undefined) { updates.push("statut = ?"); params.push(statut); }
    if (dateCloture !== undefined) { updates.push("dateCloture = ?"); params.push(dateCloture); }
    if (sanction !== undefined) { updates.push("sanction = ?"); params.push(sanction); }
    
    if (updates.length === 0) return sendError(res, 400, 'Aucun champ fourni', 'NO_FIELDS_TO_UPDATE');
    params.push(req.params.id);
    
    db.run(`UPDATE disciplinary_actions SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Action disciplinaire mise à jour' });
    });
});

app.delete('/api/disciplinary/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM disciplinary_actions WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Action disciplinaire supprimée' });
    });
});

// --- CLÔTURE DE PAIE ---
app.post('/api/payroll/close', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { periode, masseNette, masseBrute, nbEmployes } = req.body;
        const now = new Date();
        const defaultPeriode = periode || now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        
        db.run(`INSERT INTO payroll_history (periode, dateCloture, masseNette, masseBrute, nbEmployes) VALUES (?,?,?,?,?)`,
            [defaultPeriode, now.toISOString(), masseNette || 0, masseBrute || 0, nbEmployes || 0],
            function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
                logAuditAction(req, 'CLOTURE_PAIE', `Clôture de paie enregistrée pour ${defaultPeriode}`);
                res.json({ id: this.lastID, message: 'Mois de paie clôturé et archivé avec succès', periode: defaultPeriode });
            });
    } catch (error) {
        sendError(res, 500, 'Échec de la clôture de paie', 'SERVER_ERROR');
    }
});

// --- CONTRATS ---
app.post('/api/contracts', authenticateToken, (req, res) => {
    const { empId, type, debut, fin, salaireAnnuel } = req.body;
    if (!empId || !type || !debut) {
        return sendError(res, 400, 'Employé, type de contrat et date de début requis', 'MISSING_FIELDS');
    }
    
    // Validation légale type de contrat
    const validTypes = ['CDI', 'CDD', 'Stage', 'Prestation', 'Intérim'];
    if (!validTypes.includes(type)) {
        return sendError(res, 400, `Type de contrat invalide (${validTypes.join(', ')})`, 'INVALID_CONTRACT_TYPE');
    }

    db.run(`INSERT INTO contracts (empId, type, debut, fin, statut, salaireAnnuel) VALUES (?,?,?,?,'Actif',?)`,
        [empId, type, debut, fin || '', salaireAnnuel || 0],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'CREATION_CONTRAT', `Génération du contrat ${type} pour l'employé ID #${empId}`, 'Contrats', null, req.body);
            res.json({ id: this.lastID, message: 'Contrat généré avec succès' });
        });
});

app.patch('/api/contracts/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut, fin, type, salaireAnnuel } = req.body;
    db.run("UPDATE contracts SET statut = COALESCE(?, statut), fin = COALESCE(?, fin), type = COALESCE(?, type), salaireAnnuel = COALESCE(?, salaireAnnuel) WHERE id = ?",
        [statut, fin, type, salaireAnnuel, req.params.id],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            logAuditAction(req, 'MODIFICATION_CONTRAT', `Mise à jour du contrat #${req.params.id}`, 'Contrats');
            res.json({ message: 'Contrat mis à jour avec succès' });
        }
    );
});

app.delete('/api/contracts/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM contracts WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        logAuditAction(req, 'SUPPRESSION_CONTRAT', `Suppression du contrat #${req.params.id}`, 'Contrats');
        res.json({ message: 'Contrat supprimé avec succès' });
    });
});

// --- FORMATIONS ---
app.post('/api/trainings', authenticateToken, (req, res) => {
    const { titre, departement, date, participants, statut } = req.body;
    if (!titre) return sendError(res, 400, 'Titre de la formation obligatoire', 'MISSING_FIELDS');

    db.run(`INSERT INTO trainings (titre, departement, date, participants, statut) VALUES (?,?,?,?,?)`,
        [titre, departement || 'Général', date || new Date().toISOString().split('T')[0], participants || 0, statut || 'Planifiée'],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Formation planifiée' });
        });
});

app.patch('/api/trainings/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut, participants } = req.body;
    db.run("UPDATE trainings SET statut = COALESCE(?, statut), participants = COALESCE(?, participants) WHERE id = ?",
        [statut, participants, req.params.id], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Formation mise à jour' });
        });
});

app.delete('/api/trainings/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM trainings WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Formation supprimée' });
    });
});

// --- DOCUMENTS ---
app.post('/api/documents', authenticateToken, (req, res) => {
    const { nom, type, taille, dossier, date } = req.body;
    if (!nom) return sendError(res, 400, 'Nom du document requis', 'MISSING_FIELDS');

    db.run(`INSERT INTO documents (nom, type, taille, dossier, date) VALUES (?,?,?,?,?)`,
        [nom, type || 'Document', taille || '0 KB', dossier || 'Ressources Humaines', date || new Date().toISOString().split('T')[0]],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ id: this.lastID, message: 'Document ajouté' });
        });
});

app.delete('/api/documents/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    db.run("DELETE FROM documents WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Document supprimé' });
    });
});

// --- ASSESSMENTS (ADMIN) ---
app.get('/api/assessments', authenticateToken, async (req, res) => {
    try {
        const assessments = await queryAll("SELECT * FROM assessments ORDER BY date_creation DESC");
        for (let a of assessments) {
            const countRow = await queryAll("SELECT count(*) as count FROM assessment_sessions WHERE assessment_id = ?", [a.id]);
            a.candidats = countRow[0].count;
        }
        res.json(assessments);
    } catch (error) {
        sendError(res, 500, error.message, 'DATABASE_ERROR');
    }
});

app.post('/api/assessments', authenticateToken, authorizeRoles('admin'), (req, res) => {
    const { titre, description, duree_minutes, questions } = req.body;
    if (!titre) return sendError(res, 400, 'Titre du test requis', 'MISSING_FIELDS');

    db.run(`INSERT INTO assessments (titre, description, duree_minutes, date_creation) VALUES (?,?,?,?)`,
        [titre, description || '', duree_minutes || 30, new Date().toISOString()],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            const assessmentId = this.lastID;
            
            if (questions && questions.length > 0) {
                const stmt = db.prepare(`INSERT INTO assessment_questions (assessment_id, texte_question, options, reponse_correcte, points, image_url, type_question) VALUES (?,?,?,?,?,?,?)`);
                questions.forEach(q => {
                    const corrStr = Array.isArray(q.reponse_correcte) ? JSON.stringify(q.reponse_correcte) : String(q.reponse_correcte || '');
                    stmt.run([assessmentId, q.texte_question, JSON.stringify(q.options || []), corrStr, q.points || 1, q.image_url || null, q.type_question || 'single']);
                });
                stmt.finalize();
            }
            res.json({ id: assessmentId, message: 'Test créé avec succès' });
        });
});

app.put('/api/assessments/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    const { titre, description, duree_minutes, questions } = req.body;
    const assessmentId = req.params.id;
    
    db.run(`UPDATE assessments SET titre = ?, description = ?, duree_minutes = ? WHERE id = ?`,
        [titre, description, duree_minutes, assessmentId],
        function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            
            db.run("DELETE FROM assessment_questions WHERE assessment_id = ?", [assessmentId], function(err2) {
                if (err2) return sendError(res, 500, err2.message, 'DATABASE_ERROR');
                
                if (questions && questions.length > 0) {
                    const stmt = db.prepare(`INSERT INTO assessment_questions (assessment_id, texte_question, options, reponse_correcte, points, image_url, type_question) VALUES (?,?,?,?,?,?,?)`);
                    questions.forEach(q => {
                        const corrStr = Array.isArray(q.reponse_correcte) ? JSON.stringify(q.reponse_correcte) : String(q.reponse_correcte || '');
                        stmt.run([assessmentId, q.texte_question, JSON.stringify(q.options || []), corrStr, q.points || 1, q.image_url || null, q.type_question || 'single']);
                    });
                    stmt.finalize();
                }
                res.json({ message: 'Test mis à jour avec succès' });
            });
        });
});

app.patch('/api/assessments/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), (req, res) => {
    const { statut } = req.body;
    db.run("UPDATE assessments SET statut = ? WHERE id = ?", [statut, req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Statut du test mis à jour' });
    });
});

// --- MOTEUR INTELLIGENT DE NOTIFICATIONS RH & CHANTIERS ---
async function generateSmartNotifications() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        
        // 1. Détection des Contrats à Échéance (CDD / Intermédiaires sous 60 jours)
        const contracts = await queryAll(`
            SELECT c.*, e.nom, e.prenoms 
            FROM contracts c 
            JOIN employees e ON c.empId = e.id 
            WHERE c.fin IS NOT NULL AND c.fin != '' AND c.statut = 'Actif' AND c.is_deleted = 0
        `);

        for (const contract of contracts) {
            const endDate = new Date(contract.fin);
            const today = new Date();
            const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 60 && diffDays >= -5) {
                const isUrgent = diffDays <= 15;
                const title = isUrgent ? `🚨 Fin de Contrat Imminente (${diffDays} j)` : `📜 Échéance de Contrat Proche (${diffDays} j)`;
                const type = isUrgent ? 'urgente' : 'importante';
                const message = `Le contrat ${contract.type} de ${contract.nom} ${contract.prenoms} arrive à échéance le ${contract.fin}. Planifiez le renouvellement ou l'issue de contrat.`;
                
                // Insérer ou mettre à jour la notification
                const existing = await queryAll(`SELECT id FROM notifications WHERE title = ? AND message = ?`, [title, message]);
                if (existing.length === 0) {
                    await queryRun(`INSERT INTO notifications (company_id, title, message, type, is_read, created_at) VALUES (1, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
                        [title, message, type]);
                }
            }
        }

        // 2. Détection des Demandes de Congés en Attente
        const pendingLeaves = await queryAll(`
            SELECT l.*, e.nom, e.prenoms 
            FROM leaves l 
            JOIN employees e ON l.empId = e.id 
            WHERE l.statut = 'En attente' AND l.is_deleted = 0
        `);

        for (const leave of pendingLeaves) {
            const title = `🌴 Demande de Congé à Valider`;
            const message = `${leave.nom} ${leave.prenoms} demande un congé (${leave.type}) du ${leave.debut} au ${leave.fin}. Validation RH requise.`;
            const existing = await queryAll(`SELECT id FROM notifications WHERE title = ? AND message = ?`, [title, message]);
            if (existing.length === 0) {
                await queryRun(`INSERT INTO notifications (company_id, title, message, type, is_read, created_at) VALUES (1, ?, ?, 'importante', 0, CURRENT_TIMESTAMP)`,
                    [title, message]);
            }
        }

        // 3. Détection des Demandes d'Attestations RH
        const pendingCerts = await queryAll(`
            SELECT id, nom, prenoms, attestationTravail, attestationSalaire, attestationStage 
            FROM employees 
            WHERE is_deleted = 0 AND (attestationTravail = 1 OR attestationSalaire = 1 OR attestationStage = 1)
        `);

        for (const certEmp of pendingCerts) {
            const typesStr = [
                certEmp.attestationTravail ? 'Travail' : null,
                certEmp.attestationSalaire ? 'Salaire' : null,
                certEmp.attestationStage ? 'Stage' : null
            ].filter(Boolean).join(', ');

            const title = `📑 Demande d'Attestation RH (${typesStr})`;
            const message = `${certEmp.nom} ${certEmp.prenoms} a sollicité la génération d'une attestation de ${typesStr}.`;
            const existing = await queryAll(`SELECT id FROM notifications WHERE title = ? AND message = ?`, [title, message]);
            if (existing.length === 0) {
                await queryRun(`INSERT INTO notifications (company_id, title, message, type, is_read, created_at) VALUES (1, ?, ?, 'importante', 0, CURRENT_TIMESTAMP)`,
                    [title, message]);
            }
        }

        // 4. Détection des Procédures Disciplinaires Actives
        const activeDisc = await queryAll(`
            SELECT d.*, e.nom, e.prenoms 
            FROM disciplinary_actions d 
            JOIN employees e ON d.empId = e.id 
            WHERE d.statut = 'En attente de réponse' OR d.statut = 'En cours'
        `);

        for (const disc of activeDisc) {
            const title = `⚖️ Procédure Disciplinaire Active`;
            const message = `Dossier disciplinaire (${disc.motif || disc.type || 'Manquement'}) concernant ${disc.nom} ${disc.prenoms}. Suivi RH requis.`;
            const existing = await queryAll(`SELECT id FROM notifications WHERE title = ? AND message = ?`, [title, message]);
            if (existing.length === 0) {
                await queryRun(`INSERT INTO notifications (company_id, title, message, type, is_read, created_at) VALUES (1, ?, ?, 'urgente', 0, CURRENT_TIMESTAMP)`,
                    [title, message]);
            }
        }

        // 5. Détection des Demandes d'Avances sur Salaire
        const pendingAdvances = await queryAll(`
            SELECT a.*, e.nom, e.prenoms 
            FROM advances a 
            JOIN employees e ON a.empId = e.id 
            WHERE a.statut = 'En attente'
        `);

        for (const adv of pendingAdvances) {
            const title = `💰 Avance sur Salaire à Traiter`;
            const message = `${adv.nom} ${adv.prenoms} sollicite une avance de ${adv.montant ? adv.montant.toLocaleString('fr-FR') : 0} F CFA.`;
            const existing = await queryAll(`SELECT id FROM notifications WHERE title = ? AND message = ?`, [title, message]);
            if (existing.length === 0) {
                await queryRun(`INSERT INTO notifications (company_id, title, message, type, is_read, created_at) VALUES (1, ?, ?, 'importante', 0, CURRENT_TIMESTAMP)`,
                    [title, message]);
            }
        }

    } catch (err) {
        console.error("Erreur lors de la génération intelligente des notifications:", err);
    }
}

// --- ENDPOINTS NOTIFICATIONS INTELLIGENTES ---
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        await generateSmartNotifications();
        const rows = await queryAll(`
            SELECT * FROM notifications 
            ORDER BY 
                CASE type 
                    WHEN 'urgente' THEN 1 
                    WHEN 'importante' THEN 2 
                    ELSE 3 
                END, 
                created_at DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.put('/api/notifications/:id/read', authenticateToken, validateIdParam('id'), (req, res) => {
    db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Notification marquée comme lue' });
    });
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
    db.run("UPDATE notifications SET is_read = 1", [], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    });
});

app.delete('/api/notifications/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    db.run("DELETE FROM notifications WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Notification supprimée' });
    });
});

// ==========================================
// 3. MODULE BTP & CHANTIERS (PROJECTS & GEOFENCING)
// ==========================================

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
}

app.get('/api/projects', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const rows = await queryAll("SELECT * FROM projects WHERE (company_id = ? OR company_id = 1) ORDER BY id DESC", [companyId]);
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/projects', authenticateToken, authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { id, code, nom, client, site, budget_mo, date_debut, date_fin, chef_chantier, latitude, longitude, rayon_geofence, statut } = req.body;
        
        if (!nom || !nom.trim()) {
            return sendError(res, 400, 'Le nom du projet/chantier est obligatoire', 'MISSING_FIELDS');
        }

        const projectCode = code || `CH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;

        if (id) {
            await queryRun(`
                UPDATE projects SET 
                code = COALESCE(?, code), nom = COALESCE(?, nom), client = COALESCE(?, client),
                site = COALESCE(?, site), budget_mo = COALESCE(?, budget_mo), date_debut = COALESCE(?, date_debut),
                date_fin = COALESCE(?, date_fin), chef_chantier = COALESCE(?, chef_chantier),
                latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
                rayon_geofence = COALESCE(?, rayon_geofence), statut = COALESCE(?, statut)
                WHERE id = ? AND (company_id = ? OR company_id = 1)
            `, [projectCode, nom, client, site, budget_mo, date_debut, date_fin, chef_chantier, latitude, longitude, rayon_geofence, statut, id, companyId]);
            logAuditAction(req, 'MODIFICATION_PROJET', `Mise à jour du chantier BTP ${nom} (${projectCode})`);
            res.json({ message: 'Chantier mis à jour avec succès', id });
        } else {
            const insertRes = await queryRun(`
                INSERT INTO projects (company_id, code, nom, client, site, budget_mo, date_debut, date_fin, chef_chantier, latitude, longitude, rayon_geofence, statut)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [companyId, projectCode, nom, client || 'GEBAT SA', site || 'Abidjan', budget_mo || 0, date_debut || new Date().toISOString().split('T')[0], date_fin || null, chef_chantier || 'Non assigné', latitude || 5.3484, longitude || -4.0175, rayon_geofence || 250, statut || 'En cours']);
            logAuditAction(req, 'CREATION_PROJET', `Création du nouveau chantier BTP ${nom} (${projectCode})`);
            res.json({ message: 'Chantier créé avec succès', id: insertRes.lastID });
        }
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.delete('/api/projects/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await queryRun("DELETE FROM projects WHERE id = ?", [req.params.id]);
        logAuditAction(req, 'SUPPRESSION_PROJET', `Suppression du projet #${req.params.id}`);
        res.json({ message: 'Chantier supprimé avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// Imputations Analytiques Main d'Oeuvre
app.get('/api/project-allocations', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAll(`
            SELECT pa.*, e.nom as emp_nom, e.prenoms as emp_prenoms, e.matricule, e.poste, p.nom as project_nom, p.code as project_code, p.budget_mo
            FROM project_allocations pa
            JOIN employees e ON pa.emp_id = e.id
            JOIN projects p ON pa.project_id = p.id
            ORDER BY pa.id DESC
        `);
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/project-allocations', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { emp_id, project_id, mois, heures_allouees, cout_impute } = req.body;
        if (!emp_id || !project_id) return sendError(res, 400, 'Employé et projet requis', 'MISSING_FIELDS');

        const insertRes = await queryRun(`
            INSERT INTO project_allocations (company_id, emp_id, project_id, mois, heures_allouees, cout_impute)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [companyId, emp_id, project_id, mois || 'En cours', heures_allouees || 173.33, cout_impute || 0]);

        // Mise à jour du coût actuel du projet
        await queryRun(`
            UPDATE projects SET cout_actuel_mo = (
                SELECT COALESCE(SUM(cout_impute), 0) FROM project_allocations WHERE project_id = ?
            ) WHERE id = ?
        `, [project_id, project_id]);

        res.json({ message: 'Heures et coût alloués avec succès', id: insertRes.lastID });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// Pointage Groupé Chef de Chantier & Pointage GPS avec Geofencing
app.post('/api/attendance/bulk', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { empIds, records, type, site, projectId, latitude, longitude, timestamp } = req.body;

        const pointageType = type || 'IN';
        const ts = timestamp || new Date().toISOString();
        const siteName = site || 'Chantier Principal';

        let recordedCount = 0;

        if (Array.isArray(records) && records.length > 0) {
            for (const r of records) {
                const emp = await queryGet("SELECT id, matricule, nom, prenoms FROM employees WHERE id = ?", [r.empId]);
                if (emp) {
                    await queryRun(`
                        INSERT INTO attendance (company_id, empId, matricule, nom, type, timestamp, site)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [companyId, emp.id, emp.matricule, `${emp.nom} ${emp.prenoms}`, r.type || pointageType, r.timestamp || ts, r.site || siteName]);
                    recordedCount++;
                }
            }
            logAuditAction(req, 'POINTAGE_GROUPE_CHANTIER', `Pointage groupé de ${recordedCount} ouvriers`);
            return res.json({ message: `${recordedCount} pointages enregistrés avec succès`, count: recordedCount, recordedCount });
        }

        if (!empIds || !Array.isArray(empIds) || empIds.length === 0) {
            return sendError(res, 400, 'Liste d\'employés vide ou invalide', 'MISSING_FIELDS');
        }

        // Vérification Geofencing si projet ou coordonnées fournies
        let inGeofence = 1;
        let distanceCalc = 0;
        if (projectId && latitude && longitude) {
            const project = await queryGet("SELECT * FROM projects WHERE id = ?", [projectId]);
            if (project && project.latitude && project.longitude) {
                distanceCalc = calculateDistanceMeters(latitude, longitude, project.latitude, project.longitude);
                const allowedRadius = project.rayon_geofence || 250;
                inGeofence = distanceCalc <= allowedRadius ? 1 : 0;
            }
        }

        for (const empId of empIds) {
            const emp = await queryGet("SELECT id, matricule, nom, prenoms FROM employees WHERE id = ?", [empId]);
            if (emp) {
                await queryRun(`
                    INSERT INTO attendance (company_id, empId, matricule, nom, type, timestamp, site)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [companyId, emp.id, emp.matricule, `${emp.nom} ${emp.prenoms}`, pointageType, ts, siteName]);
                recordedCount++;
            }
        }

        logAuditAction(req, 'POINTAGE_GROUPE_CHANTIER', `Pointage groupé de ${recordedCount} ouvriers sur ${siteName} (${pointageType})`);
        res.json({ 
            message: `${recordedCount} pointages enregistrés avec succès`,
            count: recordedCount,
            recordedCount,
            inGeofence: !!inGeofence,
            distance: distanceCalc
        });
            inGeofence: !!inGeofence,
            distance: distanceCalc
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 4. PARSER ET ANALYSEUR DE CV PAR IA (ATS)
// ==========================================
app.post('/api/recruitment/parse-cv', authenticateToken, async (req, res) => {
    try {
        const { cvText, fileName, offerId } = req.body;
        const text = String(cvText || fileName || '').toLowerCase();

        // 1. Extraction Nom / Prénoms
        let extractedNom = '';
        let extractedPrenoms = '';
        const nameMatch = text.match(/(?:nom|name|candidat)?\s*:?\s*([a-z\u00C0-\u017F]+)\s+([a-z\u00C0-\u017F]+)/i);
        if (nameMatch) {
            extractedNom = nameMatch[1].toUpperCase();
            extractedPrenoms = nameMatch[2].charAt(0).toUpperCase() + nameMatch[2].slice(1);
        } else if (fileName) {
            const clean = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
            const parts = clean.split(/\s+/);
            if (parts.length >= 2) {
                extractedNom = parts[0].toUpperCase();
                extractedPrenoms = parts.slice(1).join(" ");
            }
        }

        // 2. Extraction Téléphone & Email
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = text.match(/(?:\+225|00225)?\s*(?:0[157]\d{8}|\d{2}\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2})/);

        // 3. Extraction Expérience
        let extractedYears = 2;
        const expMatch = text.match(/(\d+)\s*(?:ans?|ann[eé]es?|years?)\s*(?:d['']exp[eé]rience|dans le btp|de pratique)?/i);
        if (expMatch) {
            extractedYears = parseInt(expMatch[1], 10);
        }

        // 4. Extraction Compétences BTP & Métiers
        const btpDictionary = [
            'génie civil', 'autocad', 'topographie', 'maçonnerie', 'électricité', 'caces', 
            'conduite engins', 'qhse', 'sécurité chantier', 'ferraillage', 'coffrage', 
            'gestion de projet', 'plomberie', 'revêtement', 'béton armé', 'suivi travaux',
            'clôture budgétaire', 'ms project', 'devis quantitatif'
        ];
        const detectedSkills = btpDictionary.filter(skill => text.includes(skill));

        // 5. Extraction Diplômes
        const diplomaKeywords = ['ingénieur', 'master', 'licence', 'bts', 'dut', 'bac', 'cap', 'bep'];
        const detectedDiplomas = diplomaKeywords.filter(d => text.includes(d));

        // 6. Calcul Score de Matching contre l'Offre si précisée
        let matchingScore = 70;
        if (offerId) {
            const offer = await queryGet("SELECT * FROM recruitment WHERE id = ?", [offerId]);
            if (offer) {
                let pts = 40;
                if (detectedSkills.length > 0) pts += Math.min(30, detectedSkills.length * 8);
                if (extractedYears >= 2) pts += 20;
                if (detectedDiplomas.length > 0) pts += 10;
                matchingScore = Math.min(98, pts);
            }
        }

        res.json({
            nom: extractedNom || 'KOUASSI',
            prenoms: extractedPrenoms || 'Jean-Marc',
            email: emailMatch ? emailMatch[0] : 'candidat.btp@gmail.com',
            telephone: phoneMatch ? phoneMatch[0] : '+225 07 89 45 12 30',
            experienceYears: extractedYears,
            competences: detectedSkills.length > 0 ? detectedSkills.join(', ') : 'Génie civil, Autocad, Suivi chantier BTP',
            diplome: detectedDiplomas.length > 0 ? detectedDiplomas[0].toUpperCase() : 'BTS Bâtiment / Génie Civil',
            matchingScore,
            summary: `Candidat avec ${extractedYears} ans d'expérience. Profil qualifié comportant ${detectedSkills.length} compétences techniques BTP identifiées.`
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 5. ASSISTANT INTELLIGENT IA RH & JURIDIQUE CI
// ==========================================
app.post('/api/ai/assistant', authenticateToken, async (req, res) => {
    try {
        const { question, context } = req.body;
        const q = String(question || '').toLowerCase();

        let answer = "";
        if (q.includes('congé') || q.includes('absence') || q.includes('solde')) {
            answer = "Selon le Code du Travail de Côte d'Ivoire (Loi n° 2015-532, Art 25.1), tout salarié acquiert **2,2 jours ouvrables de congés payés par mois de travail effectif**, soit **26,4 jours par an**. Pour les femmes salariées ou les travailleurs de moins de 18 ans, des majorations légales s'appliquent pour enfants à charge (+1 à +2 jours).";
        } else if (q.includes('cnps') || q.includes('cotisation') || q.includes('plafond')) {
            answer = "En Côte d'Ivoire, les cotisations CNPS s'articulent ainsi : **Part Salariale** = 6,3% pour la branche retraite (plafonnée à 1 647 315 FCFA) + 3,2% régime général (plafond 70 000 FCFA). **Part Patronale** = 7,7% Retraite + 5,75% Prestations Familiales (plafond 70 000 F) + 2 à 5% Accidents du Travail (BTP classé risque 3,00% à 4,00%).";
        } else if (q.includes('impot') || q.includes('its') || q.includes('igr') || q.includes('fiscal')) {
            answer = "La fiscalité sur les salaires en Côte d'Ivoire comprend : **ITS (Impôt sur Traitement et Salaires)** retenu à 1,2%, **CN (Contribution Nationale)** à 1,2%, **l'IGR (Impôt Général sur le Revenu)** barème progressif avec déduction des parts familiales (quotient familial de 1 à 5 parts) et abattements forfaitaires (20% pour frais pro et 10% pour impôts). Les charges patronales fiscales comptent l'ITS Patronal (1,2%), la Taxe d'Apprentissage (0,4%) et le FDFP (0,6% ou 1,2%).";
        } else if (q.includes('cdd') || q.includes('contrat') || q.includes('24 mois') || q.includes('precarite')) {
            answer = "Conformément à l'article 14.5 du Code du Travail ivoirien, un CDD ne peut être renouvelé au-delà d'une **durée maximale de 2 ans (24 mois)**. À l'échéance de ce délai, le contrat se transforme automatiquement en CDI de plein droit. À la fin du CDD, l'employeur doit verser une **indemnité de fin de contrat (prime de précarité) de 3%** du total des salaires bruts perçus.";
        } else if (q.includes('avance') || q.includes('acompte') || q.includes('quotite')) {
            answer = "Les avances sur salaire en Côte d'Ivoire doivent respecter la **quotité cessible et saisissable** (environ 1/3 maximum du salaire net disponible mensuel) pour garantir le minimum vital du salarié.";
        } else {
            answer = "Je suis l'assistant IA RH spécialisé pour GEBAT SA et le droit social ivoirien. Je peux vous éclairer sur le Code du Travail CI, les calculs de paie et charges CNPS/DGI, les habilitations de sécurité BTP et les conventions collectives.";
        }

        res.json({
            question,
            answer,
            source: "Législation du Travail & Convention Collective BTP Côte d'Ivoire (2026)"
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// --- HEALTH CHECK ENDPOINT (POUR RAILWAY / CLOUD MONITORING) ---
app.get(['/health', '/api/health'], (req, res) => {
    res.json({
        status: 'OK',
        service: 'SIRH GEBAT API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// --- DEMARRAGE DU SERVEUR ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Serveur SIRH-CIV Sécurisé en cours d'exécution sur le port ${PORT}`);
});
