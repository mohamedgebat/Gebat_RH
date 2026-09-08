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
const emailService = require('./emailService');

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
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, '../frontend/public')));


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

function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET || 'sirh_civ_super_secret_key_2026_change_in_production', (err, user) => {
            if (!err && user) {
                req.user = user;
                req.company_id = user.company_id || 1;
            }
            next();
        });
    } else {
        next();
    }
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
                            type: pointageType,
                            photo: emp.photo || null
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
            queryAll("SELECT id, name, email, role, empId, status, dateCreated, photo, telephone FROM users WHERE is_deleted = 0 AND (company_id = ? OR company_id = 1)", [companyId]),
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

// Fonction centrale pour dispatcher une notification In-App + Email au Salarié concerné
async function dispatchNotification({ companyId = 1, empId = null, user_id = null, title, message, type = 'info', actionUrl = null, details = [] }) {
    return new Promise((resolve) => {
        db.run(
            `INSERT INTO notifications (company_id, user_id, empId, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
            [companyId, user_id, empId, title, message, type],
            async function(err) {
                if (err) {
                    console.error('[NOTIFICATION DISPATCH ERREUR]', err);
                    return resolve({ success: false, error: err.message });
                }
                const notifId = this.lastID;

                // Chercher l'employé concerné pour lui envoyer la notification par email
                if (empId) {
                    db.get("SELECT * FROM employees WHERE id = ?", [empId], (errEmp, emp) => {
                        if (!errEmp && emp) {
                            emailService.sendEmployeeNotificationEmail({
                                employee: emp,
                                title,
                                message,
                                type,
                                actionUrl,
                                details
                            }).catch(e => console.error('[EMAIL DISPATCH ERROR]', e.message));
                        }
                    });
                } else if (user_id) {
                    db.get("SELECT u.*, e.telephone, e.matricule, e.poste, e.departement FROM users u LEFT JOIN employees e ON u.empId = e.id WHERE u.id = ?", [user_id], (errU, u) => {
                        if (!errU && u) {
                            emailService.sendEmployeeNotificationEmail({
                                employee: u,
                                title,
                                message,
                                type,
                                actionUrl,
                                details
                            }).catch(e => console.error('[EMAIL DISPATCH ERROR]', e.message));
                        }
                    });
                }

                resolve({ success: true, id: notifId });
            }
        );
    });
}

// REST API Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const empId = req.user.empId;
        const role = req.user.role;
        const companyId = req.company_id || 1;

        let rows = [];
        if (role === 'employee') {
            // Collaborateur : reçoit ses notifications ciblées ou les annonces générales
            rows = await queryAll(
                `SELECT * FROM notifications 
                 WHERE (empId = ? OR user_id = ? OR (empId IS NULL AND user_id IS NULL AND (company_id = ? OR company_id = 1))) 
                 ORDER BY created_at DESC LIMIT 50`,
                [empId || 0, userId, companyId]
            );
        } else {
            // Admin / Assistant : voit l'ensemble des notifications de l'organisation
            rows = await queryAll(
                `SELECT * FROM notifications 
                 WHERE (company_id = ? OR company_id = 1) 
                 ORDER BY created_at DESC LIMIT 50`,
                [companyId]
            );
        }

        res.json(rows);
    } catch (err) { 
        sendError(res, 500, err.message, 'DATABASE_ERROR'); 
    }
});

app.patch('/api/notifications/:id/read', authenticateToken, validateIdParam('id'), (req, res) => {
    db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Notification marquée comme lue' });
    });
});

app.put('/api/notifications/:id/read', authenticateToken, validateIdParam('id'), (req, res) => {
    db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        res.json({ message: 'Notification marquée comme lue' });
    });
});

app.post('/api/notifications/read-all', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const empId = req.user.empId;
    const role = req.user.role;

    if (role === 'employee') {
        db.run("UPDATE notifications SET is_read = 1 WHERE empId = ? OR user_id = ?", [empId || 0, userId], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Toutes vos notifications ont été marquées comme lues' });
        });
    } else {
        db.run("UPDATE notifications SET is_read = 1 WHERE company_id = ? OR company_id = 1", [req.company_id || 1], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
        });
    }
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const empId = req.user.empId;
    const role = req.user.role;

    if (role === 'employee') {
        db.run("UPDATE notifications SET is_read = 1 WHERE empId = ? OR user_id = ?", [empId || 0, userId], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Toutes vos notifications ont été marquées comme lues' });
        });
    } else {
        db.run("UPDATE notifications SET is_read = 1 WHERE company_id = ? OR company_id = 1", [req.company_id || 1], function(err) {
            if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
            res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
        });
    }
});

app.post('/api/notifications', authenticateToken, async (req, res) => {
    const { empId, user_id, title, message, type, actionUrl, details } = req.body;
    if (!title || !message) {
        return sendError(res, 400, 'Titre et message obligatoires', 'MISSING_FIELDS');
    }

    const result = await dispatchNotification({
        companyId: req.company_id || 1,
        empId,
        user_id,
        title,
        message,
        type: type || 'info',
        actionUrl,
        details
    });

    if (!result.success) {
        return sendError(res, 500, result.error || 'Erreur création notification', 'DATABASE_ERROR');
    }

    res.json({ success: true, message: 'Notification envoyée avec succès (In-App & Email)', id: result.id });
});

// Sync globale SIRH Data
app.post('/api/sirh-data', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const data = req.body;
    try {
        if (data.settings) {
            const s = data.settings;
            db.run(`UPDATE settings SET companyName=?, rc=?, cc=?, cnps_employer=?, address=?, phone=?, email=?, logo=?, primaryColor=?, secondaryColor=?, smicAmount=?, cnpsPlafond=?, cnpsSalarial=?, cnpsPatronalRetraite=?, cnpsPatronalPF=?, cnpsPatronalAT=?, itsPatronalIvoirien=?, itsPatronalExpat=?, taFdfpRate=?, timezone=?, currency=?, language=?, tenantSlug=?, saasPlan=?, maxEmployees=?, countryCode=?, legalHoursPerMonth=?, leaveAccrualRate=?, apiKey=?, modulePayroll=?, moduleLeaves=?, moduleEvaluations=?, moduleRecruitment=?, modulePortal=?, moduleMobileMoney=?, slogan=?, footerStampText=?, smtp_host=?, smtp_port=?, smtp_user=?, smtp_pass=?, smtp_secure=?, sender_email=?, sender_name=?, email_notif_leaves=?, email_notif_advances=?, email_notif_payroll=?, email_notif_contracts=?, email_notif_disciplinary=? WHERE id=1`,
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
                    s.footerStampText || 'Document Officiel Certifié RH',
                    s.smtp_host || '',
                    s.smtp_port ? parseInt(s.smtp_port, 10) : 587,
                    s.smtp_user || '',
                    s.smtp_pass || '',
                    s.smtp_secure ? 1 : 0,
                    s.sender_email || 'notifications@gebat-sa.com',
                    s.sender_name || 'GEBAT SA - Notifications RH',
                    s.email_notif_leaves !== undefined ? (s.email_notif_leaves ? 1 : 0) : 1,
                    s.email_notif_advances !== undefined ? (s.email_notif_advances ? 1 : 0) : 1,
                    s.email_notif_payroll !== undefined ? (s.email_notif_payroll ? 1 : 0) : 1,
                    s.email_notif_contracts !== undefined ? (s.email_notif_contracts ? 1 : 0) : 1,
                    s.email_notif_disciplinary !== undefined ? (s.email_notif_disciplinary ? 1 : 0) : 1
                ]);
        }
        res.json({ message: 'Synchronisation effectuée avec succès' });
    } catch (error) {
        sendError(res, 500, 'Échec de la synchronisation', 'SYNC_ERROR');
    }
});

// --- CONFIGURATION SMTP & ENVOI D'EMAILS DE TEST ---
app.post('/api/settings/email-config', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, sender_email, sender_name, email_notif_leaves, email_notif_advances, email_notif_payroll, email_notif_contracts, email_notif_disciplinary } = req.body;

        db.run(`UPDATE settings SET 
            smtp_host = COALESCE(?, smtp_host),
            smtp_port = COALESCE(?, smtp_port),
            smtp_user = COALESCE(?, smtp_user),
            smtp_pass = COALESCE(?, smtp_pass),
            smtp_secure = COALESCE(?, smtp_secure),
            sender_email = COALESCE(?, sender_email),
            sender_name = COALESCE(?, sender_name),
            email_notif_leaves = COALESCE(?, email_notif_leaves),
            email_notif_advances = COALESCE(?, email_notif_advances),
            email_notif_payroll = COALESCE(?, email_notif_payroll),
            email_notif_contracts = COALESCE(?, email_notif_contracts),
            email_notif_disciplinary = COALESCE(?, email_notif_disciplinary)
            WHERE id = 1`,
            [
                smtp_host, smtp_port, smtp_user, smtp_pass, 
                smtp_secure !== undefined ? (smtp_secure ? 1 : 0) : null,
                sender_email, sender_name,
                email_notif_leaves !== undefined ? (email_notif_leaves ? 1 : 0) : null,
                email_notif_advances !== undefined ? (email_notif_advances ? 1 : 0) : null,
                email_notif_payroll !== undefined ? (email_notif_payroll ? 1 : 0) : null,
                email_notif_contracts !== undefined ? (email_notif_contracts ? 1 : 0) : null,
                email_notif_disciplinary !== undefined ? (email_notif_disciplinary ? 1 : 0) : null
            ],
            function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
                logAuditAction(req, 'CONFIG_EMAIL_MAJ', 'Mise à jour des paramètres SMTP et notifications emails', 'Paramètres');
                res.json({ message: 'Configuration email mise à jour avec succès' });
            }
        );
    } catch (err) {
        sendError(res, 500, err.message, 'SERVER_ERROR');
    }
});

app.post('/api/settings/test-email', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { to, smtpConfig, senderEmail, senderName } = req.body;
        if (!to || !to.includes('@')) {
            return sendError(res, 400, 'Adresse email destinataire valide obligatoire', 'INVALID_EMAIL');
        }

        const result = await emailService.sendTestEmail({
            to,
            smtpConfig,
            senderEmail,
            senderName
        });

        if (result.success) {
            logAuditAction(req, 'TEST_EMAIL_REUSSI', `Email de test envoyé à ${to} (${result.simulated ? 'Mode Simulation' : 'Envoi Réel'})`, 'Paramètres');
            res.json({
                success: true,
                simulated: result.simulated || false,
                message: result.simulated 
                    ? `Mode simulation : Votre système est configuré. Renseignez vos identifiants SMTP réels pour expédier les emails.`
                    : `Email de test transmis avec succès à ${to} !`
            });
        } else {
            logAuditAction(req, 'TEST_EMAIL_ECHEC', `Échec envoi test à ${to} : ${result.error}`, 'Paramètres');
            res.status(400).json({
                success: false,
                error: result.error || 'Impossible d\'envoyer l\'email avec les paramètres fournis.',
                code: 'SMTP_ERROR'
            });
        }
    } catch (err) {
        sendError(res, 500, err.message, 'SERVER_ERROR');
    }
});

// --- TRANSMISSION DU BULLETIN DE PAIE PAR EMAIL ---
app.post('/api/payroll/send-payslip-email', authenticateToken, authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        const { empId, periode, netAPayer, totalBrut, datePaiement } = req.body;
        if (!empId) {
            return sendError(res, 400, 'Identifiant employé requis', 'MISSING_FIELDS');
        }

        const employee = await queryGet("SELECT * FROM employees WHERE id = ?", [empId]);
        if (!employee) {
            return sendError(res, 404, 'Employé introuvable', 'NOT_FOUND');
        }

        if (!employee.email) {
            return sendError(res, 400, 'Cet employé n\'a pas d\'adresse email enregistrée', 'NO_EMAIL');
        }

        const result = await emailService.sendPayslipEmail({
            employee,
            payslipData: { netAPayer, totalBrut, datePaiement },
            period: periode,
            originUrl: req.headers.origin
        });

        if (result.success) {
            // Créer une notification in-app pour l'employé
            await queryRun("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, ?, ?, 'success')",
                [req.company_id || 1, empId, `Bulletin de Paie (${periode})`, `Votre bulletin de paie pour la période de ${periode} a été transmis à votre adresse email.`]);

            logAuditAction(req, 'TRANSMISSION_BULLETIN_EMAIL', `Bulletin de paie (${periode}) envoyé par email à ${employee.nom} ${employee.prenoms} (${employee.email})`, 'Paie');
            res.json({ success: true, message: `Bulletin de paie transmis par email à ${employee.email}` });
        } else {
            res.status(400).json({ success: false, error: result.error || 'Erreur lors de l\'envoi du bulletin' });
        }
    } catch (err) {
        sendError(res, 500, err.message, 'SERVER_ERROR');
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

// --- GESTION DU PROFIL UTILISATEUR & COMPTE PERSONNEL ---
app.get('/api/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const empId = req.user.empId;
    const role = req.user.role;

    try {
        if (role === 'employee' || empId) {
            const targetEmpId = empId || userId;
            const employee = await queryGet("SELECT * FROM employees WHERE id = ?", [targetEmpId]);
            const user = await queryGet("SELECT id, company_id, name, email, role, empId, status, dateCreated, photo, telephone FROM users WHERE empId = ? OR id = ?", [targetEmpId, userId]);
            return res.json({ user: user || { id: userId, role: 'employee', empId: targetEmpId, name: employee ? `${employee.nom} ${employee.prenoms}` : 'Salarié', email: employee?.email, photo: employee?.photo }, employee });
        }

        const user = await queryGet("SELECT id, company_id, name, email, role, empId, status, dateCreated, photo, telephone FROM users WHERE id = ?", [userId]);
        if (!user) return sendError(res, 404, 'Utilisateur non trouvé', 'NOT_FOUND');

        if (user.empId) {
            const employee = await queryGet("SELECT * FROM employees WHERE id = ?", [user.empId]);
            return res.json({ user, employee });
        } else {
            return res.json({ user, employee: null });
        }
    } catch (err) {
        return sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const empId = req.user.empId;
    const role = req.user.role;
    const { 
        name, email, photo, telephone, 
        adresse, emailPerso, situationMatrimoniale, nbEnfants, rib, 
        contactUrgenceNom, contactUrgenceTelephone, contactUrgenceLien, bio 
    } = req.body;

    try {
        if (email && !validateEmailFormat(email)) {
            return sendError(res, 400, 'Format d\'adresse email invalide', 'INVALID_EMAIL');
        }

        const targetEmpId = empId || (role === 'employee' ? userId : null);

        if (targetEmpId) {
            const currentEmp = await queryGet("SELECT * FROM employees WHERE id = ?", [targetEmpId]);
            if (!currentEmp) return sendError(res, 404, 'Employé non trouvé', 'NOT_FOUND');

            let updatedNom = currentEmp.nom;
            let updatedPrenoms = currentEmp.prenoms;
            if (name && name !== `${currentEmp.nom} ${currentEmp.prenoms}`.trim()) {
                const parts = name.trim().split(' ');
                updatedNom = parts[0] || currentEmp.nom;
                updatedPrenoms = parts.slice(1).join(' ') || currentEmp.prenoms;
            }

            await queryRun(`UPDATE employees SET 
                nom = COALESCE(?, nom), 
                prenoms = COALESCE(?, prenoms), 
                email = COALESCE(?, email), 
                telephone = COALESCE(?, telephone), 
                photo = COALESCE(?, photo),
                adresse = COALESCE(?, adresse),
                emailPerso = COALESCE(?, emailPerso),
                situationMatrimoniale = COALESCE(?, situationMatrimoniale),
                nbEnfants = COALESCE(?, nbEnfants),
                rib = COALESCE(?, rib),
                contactUrgenceNom = COALESCE(?, contactUrgenceNom),
                contactUrgenceTelephone = COALESCE(?, contactUrgenceTelephone),
                contactUrgenceLien = COALESCE(?, contactUrgenceLien),
                bio = COALESCE(?, bio)
            WHERE id = ?`,
            [
                updatedNom, updatedPrenoms,
                email !== undefined ? email.trim() : null,
                telephone !== undefined ? telephone.trim() : null,
                photo !== undefined ? photo : null,
                adresse !== undefined ? adresse : null,
                emailPerso !== undefined ? emailPerso : null,
                situationMatrimoniale !== undefined ? situationMatrimoniale : null,
                nbEnfants !== undefined ? parseInt(nbEnfants, 10) : null,
                rib !== undefined ? rib : null,
                contactUrgenceNom !== undefined ? contactUrgenceNom : null,
                contactUrgenceTelephone !== undefined ? contactUrgenceTelephone : null,
                contactUrgenceLien !== undefined ? contactUrgenceLien : null,
                bio !== undefined ? bio : null,
                targetEmpId
            ]);

            // Synchroniser avec la table users si le compte utilisateur existe
            await queryRun(`UPDATE users SET 
                name = COALESCE(?, name), 
                email = COALESCE(?, email), 
                photo = COALESCE(?, photo), 
                telephone = COALESCE(?, telephone) 
            WHERE empId = ? OR id = ?`,
            [
                name ? name.trim() : null,
                email ? email.trim() : null,
                photo !== undefined ? photo : null,
                telephone ? telephone.trim() : null,
                targetEmpId, userId
            ]);

            logAuditAction(req, 'PROFIL_MODIFIE', `Mise à jour profil employé #${targetEmpId}`, 'Sécurité / Profil');

            const updatedUserPayload = {
                id: userId,
                name: name || `${updatedNom} ${updatedPrenoms}`.trim(),
                email: email || currentEmp.email,
                role: role,
                empId: targetEmpId,
                photo: photo !== undefined ? photo : currentEmp.photo,
                telephone: telephone !== undefined ? telephone : currentEmp.telephone
            };

            const token = jwt.sign(
                updatedUserPayload,
                process.env.JWT_SECRET || 'sirh_civ_super_secret_key_2026_change_in_production',
                { expiresIn: '24h' }
            );

            return res.json({
                message: 'Profil mis à jour avec succès',
                user: { ...updatedUserPayload, token }
            });
        } else {
            // Utilisateur standard / Admin
            const currentUser = await queryGet("SELECT * FROM users WHERE id = ?", [userId]);
            if (!currentUser) return sendError(res, 404, 'Utilisateur non trouvé', 'NOT_FOUND');

            const newName = name !== undefined ? name.trim() : currentUser.name;
            const newEmail = email !== undefined ? email.trim() : currentUser.email;
            const newPhoto = photo !== undefined ? photo : currentUser.photo;
            const newTelephone = telephone !== undefined ? telephone.trim() : currentUser.telephone;

            await queryRun("UPDATE users SET name = ?, email = ?, photo = ?, telephone = ? WHERE id = ?",
                [newName, newEmail, newPhoto, newTelephone, userId]);

            logAuditAction(req, 'PROFIL_MODIFIE', `Mise à jour profil utilisateur #${userId}`, 'Sécurité / Profil');

            const updatedUserPayload = {
                id: currentUser.id,
                name: newName,
                email: newEmail,
                role: currentUser.role,
                empId: currentUser.empId,
                status: currentUser.status,
                company_id: currentUser.company_id || 1,
                photo: newPhoto,
                telephone: newTelephone
            };

            const token = jwt.sign(
                updatedUserPayload,
                process.env.JWT_SECRET || 'sirh_civ_super_secret_key_2026_change_in_production',
                { expiresIn: '24h' }
            );

            return res.json({
                message: 'Profil mis à jour avec succès',
                user: { ...updatedUserPayload, token }
            });
        }
    } catch (err) {
        return sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.patch('/api/profile/password', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const empId = req.user.empId;
    const role = req.user.role;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return sendError(res, 400, 'Le mot de passe actuel et le nouveau mot de passe sont obligatoires', 'MISSING_FIELDS');
    }
    if (newPassword.length < 6) {
        return sendError(res, 400, 'Le nouveau mot de passe doit contenir au moins 6 caractères', 'WEAK_PASSWORD');
    }

    try {
        let currentHash = null;
        const targetEmpId = empId || (role === 'employee' ? userId : null);

        if (targetEmpId) {
            const emp = await queryGet("SELECT id, password FROM employees WHERE id = ?", [targetEmpId]);
            if (emp && emp.password) {
                currentHash = emp.password;
            } else {
                const u = await queryGet("SELECT id, password FROM users WHERE id = ? OR empId = ?", [userId, targetEmpId]);
                if (u) currentHash = u.password;
            }
        } else {
            const u = await queryGet("SELECT id, password FROM users WHERE id = ?", [userId]);
            if (u) currentHash = u.password;
        }

        if (!currentHash) {
            return sendError(res, 404, 'Compte introuvable', 'NOT_FOUND');
        }

        const isMatch = await verifyPassword(currentPassword, currentHash);
        if (!isMatch) {
            return sendError(res, 401, 'Le mot de passe actuel est incorrect', 'INVALID_CREDENTIALS');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (targetEmpId) {
            await queryRun("UPDATE employees SET password = ?, must_change_password = 0 WHERE id = ?", [hashedPassword, targetEmpId]);
            await queryRun("UPDATE users SET password = ?, must_change_password = 0 WHERE empId = ? OR id = ?", [hashedPassword, targetEmpId, userId]);
        } else {
            await queryRun("UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?", [hashedPassword, userId]);
        }

        logAuditAction(req, 'MOT_DE_PASSE_MODIFIE', `Changement de mot de passe utilisateur #${userId}`, 'Sécurité / Profil');
        res.json({ success: true, message: 'Mot de passe modifié avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.patch('/api/profile/photo', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const empId = req.user.empId;
    const role = req.user.role;
    const { photo } = req.body;

    try {
        if (role === 'employee' || empId) {
            const targetEmpId = empId || userId;
            await queryRun("UPDATE employees SET photo = ? WHERE id = ?", [photo || null, targetEmpId]);
            await queryRun("UPDATE users SET photo = ? WHERE empId = ? OR id = ?", [photo || null, targetEmpId, userId]);

            logAuditAction(req, 'PHOTO_PROFIL_MODIFIEE', `Changement de photo de profil employé #${targetEmpId}`, 'Sécurité / Profil');
            return res.json({ success: true, message: 'Photo de profil mise à jour avec succès', photo: photo || null });
        } else {
            await queryRun("UPDATE users SET photo = ? WHERE id = ?", [photo || null, userId]);
            if (empId) {
                await queryRun("UPDATE employees SET photo = ? WHERE id = ?", [photo || null, empId]);
            }
            logAuditAction(req, 'PHOTO_PROFIL_MODIFIEE', `Changement de photo de profil utilisateur #${userId}`, 'Sécurité / Profil');
            return res.json({ success: true, message: 'Photo de profil mise à jour avec succès', photo: photo || null });
        }
    } catch (err) {
        return sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
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

app.patch('/api/employees/:id/photo', authenticateToken, validateIdParam('id'), (req, res) => {
    const { photo } = req.body;
    db.run("UPDATE employees SET photo = ? WHERE id = ?", [photo || null, req.params.id], function(err) {
        if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');
        logAuditAction(req, 'PHOTO_EMPLOYE_MAJ', `Mise à jour photo de profil employé #${req.params.id}`, 'Employés');
        res.json({ success: true, message: 'Photo de profil mise à jour avec succès', photo: photo || null });
    });
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
            const newLeaveId = this.lastID;

            // Notification In-App & Email
            db.get("SELECT * FROM employees WHERE id = ?", [empId], (errEmp, employee) => {
                if (!errEmp && employee) {
                    const empName = `${employee.nom} ${employee.prenoms}`;
                    db.run(`INSERT INTO notifications (company_id, title, message, type) VALUES (1, '🌴 Demande de Congé', ?, 'importante')`,
                        [`${empName} sollicite un congé (${type}) du ${debut} au ${fin}.`]);

                    emailService.sendLeaveRequestEmail({
                        leave: { id: newLeaveId, type, debut, fin, duree: duree || 1, motif },
                        employee,
                        originUrl: req.headers.origin
                    }).catch(() => {});
                }
            });

            res.json({ id: newLeaveId, message: 'Demande de congé enregistrée' });
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
            
            db.get("SELECT * FROM employees WHERE id = ?", [leave.empId], (errEmp, employee) => {
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
                    
                    // Notification In-App
                    db.run("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, ?, ?, 'success')",
                        [companyId, leave.empId, 'Congé Approuvé', `Votre demande de congé de ${leave.duree} jour(s) a été approuvée.`]);
                } else if (statut === 'Refusé') {
                    db.run("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, ?, ?, 'warning')",
                        [companyId, leave.empId, 'Congé Refusé', `Votre demande de congé a été refusée par la Direction RH.`]);
                }

                // Notification Email au Salarié
                if (employee) {
                    emailService.sendLeaveDecisionEmail({
                        leave,
                        employee,
                        status: statut,
                        originUrl: req.headers.origin
                    }).catch(() => {});
                }
            });

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
            const newAdvId = this.lastID;

            // Notification In-App & Email
            db.get("SELECT * FROM employees WHERE id = ?", [empId], (errEmp, employee) => {
                if (!errEmp && employee) {
                    const empName = `${employee.nom} ${employee.prenoms}`;
                    const formattedMontant = new Intl.NumberFormat('fr-CI').format(montant);
                    db.run(`INSERT INTO notifications (company_id, title, message, type) VALUES (1, '💰 Demande d\\'Avance', ?, 'importante')`,
                        [`${empName} sollicite une avance de ${formattedMontant} F CFA.`]);

                    emailService.sendAdvanceRequestEmail({
                        advance: { id: newAdvId, montant, moisRemboursement, motif },
                        employee,
                        originUrl: req.headers.origin
                    }).catch(() => {});
                }
            });

            res.json({ id: newAdvId, message: 'Demande d\'avance enregistrée' });
        });
});

app.patch('/api/advances/:id', authenticateToken, validateIdParam('id'), (req, res) => {
    const { statut, resteAPayer } = req.body;
    const advId = req.params.id;

    db.get("SELECT a.*, e.nom, e.prenoms, e.email, e.matricule FROM advances a JOIN employees e ON a.empId = e.id WHERE a.id = ?", [advId], (errAdv, adv) => {
        db.run("UPDATE advances SET statut = COALESCE(?, statut), resteAPayer = COALESCE(?, resteAPayer) WHERE id = ?",
            [statut, resteAPayer, advId], function(err) {
                if (err) return sendError(res, 500, err.message, 'DATABASE_ERROR');

                if (statut && adv) {
                    const isApproved = statut === 'Accordée' || statut === 'Approuvée' || statut === 'En cours';
                    db.run("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (?, ?, ?, ?, ?)",
                        [1, adv.empId, isApproved ? 'Avance Accordée' : 'Avance Refusée',
                         isApproved ? `Votre avance de ${new Intl.NumberFormat('fr-CI').format(adv.montant)} F CFA a été accordée.` : `Votre demande d'avance a été refusée.`,
                         isApproved ? 'success' : 'warning']);

                    emailService.sendAdvanceDecisionEmail({
                        advance: adv,
                        employee: adv,
                        status: statut,
                        originUrl: req.headers.origin
                    }).catch(() => {});
                }

                res.json({ message: 'Avance mise à jour' });
            });
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
            const newDiscId = this.lastID;

            // Notification In-App & Email
            db.get("SELECT * FROM employees WHERE id = ?", [empId], (errEmp, employee) => {
                if (!errEmp && employee) {
                    db.run("INSERT INTO notifications (company_id, empId, title, message, type) VALUES (1, ?, '⚠️ Procédure RH / Discipline', ?, 'urgente')",
                        [empId, `Un document disciplinaire (${type}) a été émis à votre attention. Une réponse écrite est requise.`]);

                    emailService.sendDisciplinaryEmail({
                        action: { id: newDiscId, type, dateEmission, motif, statut: 'En attente de réponse' },
                        employee,
                        originUrl: req.headers.origin
                    }).catch(() => {});
                }
            });

            res.json({ id: newDiscId, message: 'Action disciplinaire enregistrée' });
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

                    // Alerte email envoyée aux gestionnaires RH à J-30 et J-15
                    if (diffDays <= 30 && diffDays >= 0) {
                        emailService.sendContractExpiryAlertEmail({
                            contract,
                            employee: { nom: contract.nom, prenoms: contract.prenoms, matricule: contract.matricule, poste: contract.poste },
                            daysLeft: diffDays
                        }).catch(() => {});
                    }
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
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 4. PARSER ET ANALYSEUR DE CV PAR IA (ATS)
// ==========================================
app.post('/api/recruitment/parse-cv', optionalAuthenticateToken, async (req, res) => {
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
app.post('/api/ai/assistant', optionalAuthenticateToken, async (req, res) => {
    try {
        const { question, prompt, text, context } = req.body;
        const rawQuery = String(prompt || question || text || '').trim();
        const q = rawQuery.toLowerCase();

        if (!rawQuery) {
            return res.json({
                success: true,
                question: "",
                answer: "Bonjour ! Je suis votre Assistant IA RH & BTP GEBAT. Posez-moi une question sur le Code du Travail CI, la paie, la CNPS, les impôts ou les règles de chantier.",
                reply: "Bonjour ! Je suis votre Assistant IA RH & BTP GEBAT. Posez-moi une question sur le Code du Travail CI, la paie, la CNPS, les impôts ou les règles de chantier.",
                response: "Bonjour ! Je suis votre Assistant IA RH & BTP GEBAT. Posez-moi une question sur le Code du Travail CI, la paie, la CNPS, les impôts ou les règles de chantier.",
                source: "SIRH GEBAT CI"
            });
        }

        let answer = "";

        if (q.includes('heure') && (q.includes('sup') || q.includes('majoration') || q.includes('40h') || q.includes('48h') || q.includes('nuit'))) {
            answer = "En Côte d'Ivoire et selon la Convention Collective BTP, les heures supplémentaires se décomptent au-delà de **40h par semaine** avec les majorations légales suivantes :\n\n" +
                "• **De la 41ème à la 46ème heure** : majoration de **+15%** sur le taux horaire de base.\n" +
                "• **De la 47ème à la 55ème heure** : majoration de **+50%**.\n" +
                "• **Heures de nuit en semaine (21h à 5h)** : majoration de **+50%**.\n" +
                "• **Dimanche et jours fériés de jour** : majoration de **+50%**.\n" +
                "• **Dimanche et jours fériés de nuit** : majoration de **+100%**.\n\n" +
                "💡 *Sur les chantiers GEBAT, les heures supplémentaires sont automatiquement comptabilisées et valorisées sur le bulletin de paie.*";
        } else if (q.includes('disa') || (q.includes('cnps') && (q.includes('annuel') || q.includes('déclaration') || q.includes('mars')))) {
            answer = "La **DISA (Déclaration Individuelle des Salaires Annuels)** est l'obligation déclarative annuelle CNPS en Côte d'Ivoire :\n\n" +
                "• **Date limite de dépôt** : au plus tard le **31 mars** de chaque année pour l'exercice précédent.\n" +
                "• **Contenu officiel** : Matricules CNPS, identités, périodes travaillées, total des salaires bruts et assiettes plafonnées.\n" +
                "• **Plafonds applicables** : Plafond Retraite = **1 647 315 FCFA / mois** ; Plafond Régime Général (Prestations Familiales & AT) = **70 000 FCFA / mois**.\n" +
                "• **Cotisations** : Retraite Salarié 6,3% / Retraite Patronal 7,7% ; Prestations Familiales 5,75% ; Risque AT/MP BTP 3,00% à 4,00%.\n\n" +
                "💡 *Le module Paie GEBAT génère l'export DISA normalisé en un clic.*";
        } else if (q.includes('epi') || q.includes('équipement') || q.includes('sécurité') || q.includes('casque') || q.includes('harnais') || q.includes('protection')) {
            answer = "Les obligations légales et de sécurité chantier (**EPI**) pour les ouvriers et encadrants BTP comprennent :\n\n" +
                "• **Casque de sécurité NF EN 397** avec jugulaire obligatoire en permanence sur chantier.\n" +
                "• **Chaussures de sécurité S3** montantes avec semelle anti-perforation et embout acier 200J.\n" +
                "• **Gilet haute visibilité classe 2 (EN ISO 20471)** de jour comme de nuit.\n" +
                "• **Gants de manutention et anti-coupure (EN 388)** adaptés aux tâches (coffrage, ferraillage).\n" +
                "• **Harnais anti-chute (EN 361) avec longe absorbante** dès que le travail en hauteur dépasse **2 mètres**.\n" +
                "• **Lunettes de protection et protections auditives** selon les zones bruyantes ou de meulage.\n\n" +
                "💡 *Toute dotation doit être consignée sur la fiche collaborateur avec accusé de réception.*";
        } else if (q.includes('licenciement') || q.includes('indemnité') || q.includes('rupture') || q.includes('préavis') || q.includes('solde de tout compte')) {
            answer = "Selon l'article 16.12 du Code du Travail de Côte d'Ivoire, l'**indemnité de licenciement** (hors faute lourde) se calcule sur le salaire global mensuel moyen des 12 derniers mois :\n\n" +
                "• **De 1 an à 5 ans d'ancienneté** : **30%** du salaire mensuel moyen par année de présence.\n" +
                "• **De 6 ans à 10 ans d'ancienneté** : **35%** par an.\n" +
                "• **Au-delà de 10 ans d'ancienneté** : **40%** par an.\n\n" +
                "**Préavis légal** : Ouvriers payés à l'heure (8 à 15 jours) ; Employés & Agents de maîtrise (1 mois) ; Cadres et assimilés (3 mois).\n" +
                "Le solde de tout compte inclut également l'indemnité compensatrice de congés payés non pris.";
        } else if (q.includes('its') || q.includes('igr') || q.includes('fiscal') || q.includes('impot') || q.includes('dgi') || q.includes('barème') || q.includes('cn')) {
            answer = "La fiscalité sur les salaires en Côte d'Ivoire (Réforme DGI) s'établit comme suit :\n\n" +
                "• **ITS (Impôt sur Traitements et Salaires)** : retenue salariale de **1,2%** sur le brut imposable.\n" +
                "• **CN (Contribution Nationale)** : retenue salariale de **1,2%**.\n" +
                "• **IGR (Impôt Général sur le Revenu)** : calcul progressif par tranches après abattement de 20% (frais pro), 10% (impôts) et division par le nombre de **parts familiales (1 à 5 parts)**.\n" +
                "• **Charges Patronales DGI** : ITS Patronal (1,2%), Taxe d'Apprentissage (0,4%), FDFP formation continue (0,6% à 1,2%).";
        } else if (q.includes('congé') || q.includes('absence') || q.includes('maternité') || q.includes('mariage') || q.includes('décès')) {
            answer = "En Côte d'Ivoire (Code du Travail Art. 25.1) :\n\n" +
                "• **Congés payés ordinaires** : **2,2 jours ouvrables** par mois de travail effectif, soit **26,4 jours ouvrables par an**.\n" +
                "• **Majoration d'ancienneté** : +1 jour après 5 ans, +2 jours après 10 ans, +3 jours après 15 ans.\n" +
                "• **Congé de maternité** : **14 semaines** consécutives indemnisées par la CNPS.\n" +
                "• **Permissions exceptionnelles payées** : Mariage du travailleur (4 jours), Mariage d'un enfant (2 jours), Naissance d'un enfant (2 jours), Décès du conjoint ou ascendant/descendant direct (4 jours).";
        } else if (q.includes('cdd') || q.includes('24 mois') || q.includes('essai') || q.includes('contrat') || q.includes('cdi') || q.includes('précarité')) {
            answer = "Réglementation des contrats de travail en Côte d'Ivoire :\n\n" +
                "• **Durée maximale du CDD** : **24 mois consécutifs** (renouvellements inclus). Au-delà, requalification automatique en **CDI**.\n" +
                "• **Indemnité de fin de contrat (Prime de précarité)** : **3%** du total des rémunérations brutes perçues pendant la durée du CDD.\n" +
                "• **Période d'essai légale** : Ouvriers et manœuvres = 8 jours ; Employés mensualisés = 1 mois ; Cadres et ingénieurs = 3 mois renouvelable 1 fois.";
        } else if (q.includes('sanction') || q.includes('discipline') || q.includes('mise à pied') || q.includes('blâme') || q.includes('avertissement') || q.includes('faute')) {
            answer = "La procédure disciplinaire légale en Côte d'Ivoire exige le respect strict des droits de la défense :\n\n" +
                "• **Échelle des sanctions** : 1. Avertissement écrit • 2. Blâme avec inscription au dossier • 3. Mise à pied temporaire sans salaire (**1 à 8 jours maximum**) • 4. Licenciement.\n" +
                "• **Procédure obligatoire** : Notification d'une demande d'explications écrites laissant au moins 48 heures au salarié pour répondre avant toute décision.\n" +
                "• **Délai de prescription** : Les sanctions doivent être notifiées dans un délai de 3 mois maximum suivant la connaissance des faits.";
        } else if (q.includes('smig') || q.includes('smic') || q.includes('salaire minimum') || q.includes('75000') || q.includes('grille')) {
            answer = "En Côte d'Ivoire, le **SMIG (Salaire Minimum Interprofessionnel Garanti)** est fixé à **75 000 FCFA net / mois**.\n\n" +
                "Dans le secteur du BTP, les salaires minima conventionnels sont fixés par la grille catégorielle :\n" +
                "• Ouvriers et Manœuvres (Catégories 1 à 3)\n" +
                "• Ouvriers Spécialisés et Qualifiés (Catégories 4 à 6 - Coffreurs, Ferrailleurs, Grutiers)\n" +
                "• Chefs d'équipe et Conducteurs de travaux (Catégories 7 à 9)\n" +
                "• Cadres et Ingénieurs BTP (Catégories 10 à 12).";
        } else if (q.includes('pointage') || q.includes('gps') || q.includes('géolocalisation') || q.includes('chantier') || q.includes('haversine')) {
            answer = "Le module **Pointage Mobile GEBAT** intègre :\n\n" +
                "• **Pointage GPS Satellite** : Détection des coordonnées latitude/longitude avec calcul de conformité géographique par formule de Haversine.\n" +
                "• **Périmètre Geofencing** : Rayon de tolérance configurable par chantier (ex: 250 mètres).\n" +
                "• **Pointage d'équipe groupé** : Permet au chef de chantier d'effectuer l'appel de son équipe en un clic pour synchronisation instantanée avec la paie.";
        } else {
            answer = "Bonjour ! En tant qu'Assistant IA RH & BTP pour GEBAT SA, je peux vous renseigner avec précision sur :\n\n" +
                "• **Le Code du Travail CI & Conventions BTP** (Congés, CDD/CDI, Essai, Sanctions).\n" +
                "• **La Paie & Charges Sociales** (Heures sup 15%/50%/100%, Cotisations CNPS, DISA annuelle).\n" +
                "• **La Fiscalité des Salaires** (ITS 1.2%, CN 1.2%, IGR barème progressif, DGI e-Impôts).\n" +
                "• **La Sécurité Chantier** (Dotations EPI conformes, Habilitations B2V/CACES).\n\n" +
                "Quelle est votre question précise ?";
        }

        return res.json({
            success: true,
            question: rawQuery,
            answer: answer,
            reply: answer,
            response: answer,
            source: "Législation du Travail & Convention Collective BTP Côte d'Ivoire (2026)"
        });
    } catch (err) {
        console.error("Erreur AI Assistant:", err);
        return res.json({
            success: true,
            question: req.body?.prompt || req.body?.question || "",
            answer: "Je suis à votre service pour toute question relative au Droit du travail ivoirien, aux calculs de paie BTP, cotisations CNPS ou déclarations fiscales DGI.",
            reply: "Je suis à votre service pour toute question relative au Droit du travail ivoirien, aux calculs de paie BTP, cotisations CNPS ou déclarations fiscales DGI.",
            response: "Je suis à votre service pour toute question relative au Droit du travail ivoirien, aux calculs de paie BTP, cotisations CNPS ou déclarations fiscales DGI.",
            source: "SIRH GEBAT CI"
        });
    }
});

// ==========================================
// 6. MODULE ORDRES DE MISSION & NOTES DE FRAIS
// ==========================================
app.get('/api/missions', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const role = req.user.role;
        const empId = req.user.empId;

        let sql = `SELECT m.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, e.telephone, e.photo
                   FROM missions m
                   JOIN employees e ON m.empId = e.id
                   WHERE (m.company_id = ? OR m.company_id = 1)`;
        const params = [companyId];

        if (role === 'employee' && empId) {
            sql += ` AND m.empId = ?`;
            params.push(empId);
        }

        sql += ` ORDER BY m.date_debut DESC, m.created_at DESC`;
        const rows = await queryAll(sql, params);
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/missions', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { empId, titre, motif, destination, site, date_debut, date_fin, moyen_transport, vehicule, avance_frais, commentaires } = req.body;
        const targetEmpId = empId || req.user.empId || req.user.id;

        if (!titre || !destination || !date_debut || !date_fin) {
            return sendError(res, 400, 'Titre, destination et dates obligatoires', 'MISSING_FIELDS');
        }

        const result = await queryRun(
            `INSERT INTO missions (company_id, empId, titre, motif, destination, site, date_debut, date_fin, moyen_transport, vehicule, avance_frais, statut, commentaires)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'En attente N+1', ?)`,
            [companyId, targetEmpId, titre, motif || '', destination, site || '', date_debut, date_fin, moyen_transport || 'Véhicule de Société', vehicule || '', avance_frais || 0, commentaires || '']
        );

        dispatchNotification({
            companyId,
            empId: targetEmpId,
            title: '🚗 Nouvel Ordre de Mission',
            message: `Ordre de mission enregistré vers ${destination} (${date_debut} au ${date_fin}). En attente de validation N+1.`,
            type: 'info'
        }).catch(() => {});

        logAuditAction(req, 'CREATION_MISSION', `Ordre de mission créé pour employé #${targetEmpId} (${destination})`, 'Missions & Frais');
        res.json({ success: true, id: result.lastID, message: 'Ordre de mission enregistré avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.patch('/api/missions/:id', authenticateToken, validateIdParam('id'), async (req, res) => {
    try {
        const id = req.params.id;
        const { statut, validation_n1, validation_rh, commentaires, avance_frais } = req.body;
        const mission = await queryGet("SELECT m.*, e.nom, e.prenoms, e.email FROM missions m JOIN employees e ON m.empId = e.id WHERE m.id = ?", [id]);
        if (!mission) return sendError(res, 404, 'Ordre de mission non trouvé', 'NOT_FOUND');

        await queryRun(
            `UPDATE missions SET 
                statut = COALESCE(?, statut),
                validation_n1 = COALESCE(?, validation_n1),
                validation_rh = COALESCE(?, validation_rh),
                commentaires = COALESCE(?, commentaires),
                avance_frais = COALESCE(?, avance_frais)
             WHERE id = ?`,
            [statut, validation_n1, validation_rh, commentaires, avance_frais, id]
        );

        if (statut) {
            const isApproved = statut === 'Approuvée' || statut === 'Validée';
            dispatchNotification({
                companyId: mission.company_id || 1,
                empId: mission.empId,
                title: isApproved ? '✅ Mission Validée' : '⚠️ Mission Mise à Jour',
                message: `Votre ordre de mission pour "${mission.destination}" est désormais : ${statut}.`,
                type: isApproved ? 'success' : 'warning'
            }).catch(() => {});
        }

        logAuditAction(req, 'MODIFICATION_MISSION', `Mission #${id} mise à jour (${statut || 'Modification'})`, 'Missions & Frais');
        res.json({ success: true, message: 'Mission mise à jour avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.delete('/api/missions/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        await queryRun("DELETE FROM missions WHERE id = ?", [req.params.id]);
        logAuditAction(req, 'SUPPRESSION_MISSION', `Suppression mission #${req.params.id}`, 'Missions & Frais');
        res.json({ success: true, message: 'Ordre de mission supprimé' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.get('/api/expenses', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const role = req.user.role;
        const empId = req.user.empId;

        let sql = `SELECT exp.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, m.titre as mission_titre, m.destination as mission_destination
                   FROM expense_reports exp
                   JOIN employees e ON exp.empId = e.id
                   LEFT JOIN missions m ON exp.mission_id = m.id
                   WHERE (exp.company_id = ? OR exp.company_id = 1)`;
        const params = [companyId];

        if (role === 'employee' && empId) {
            sql += ` AND exp.empId = ?`;
            params.push(empId);
        }

        sql += ` ORDER BY exp.date_depense DESC, exp.created_at DESC`;
        const rows = await queryAll(sql, params);
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/expenses', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { empId, mission_id, date_depense, categorie, montant, description, justificatif } = req.body;
        const targetEmpId = empId || req.user.empId || req.user.id;

        if (!date_depense || !categorie || !montant) {
            return sendError(res, 400, 'Date, catégorie et montant obligatoires', 'MISSING_FIELDS');
        }

        const result = await queryRun(
            `INSERT INTO expense_reports (company_id, empId, mission_id, date_depense, categorie, montant, description, justificatif, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Soumis')`,
            [companyId, targetEmpId, mission_id || null, date_depense, categorie, montant, description || '', justificatif || null]
        );

        dispatchNotification({
            companyId,
            empId: targetEmpId,
            title: '🧾 Note de Frais Enregistrée',
            message: `Votre note de frais de ${new Intl.NumberFormat('fr-CI').format(montant)} FCFA (${categorie}) a été soumise pour validation.`,
            type: 'info'
        }).catch(() => {});

        logAuditAction(req, 'CREATION_NOTE_FRAIS', `Note de frais créée pour employé #${targetEmpId} (${montant} FCFA)`, 'Missions & Frais');
        res.json({ success: true, id: result.lastID, message: 'Note de frais enregistrée avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.patch('/api/expenses/:id', authenticateToken, validateIdParam('id'), async (req, res) => {
    try {
        const id = req.params.id;
        const { statut, validation_n1, validation_rh, inclus_paie, mois_paie } = req.body;
        const expense = await queryGet("SELECT exp.*, e.nom, e.prenoms, e.email FROM expense_reports exp JOIN employees e ON exp.empId = e.id WHERE exp.id = ?", [id]);
        if (!expense) return sendError(res, 404, 'Note de frais non trouvée', 'NOT_FOUND');

        await queryRun(
            `UPDATE expense_reports SET 
                statut = COALESCE(?, statut),
                validation_n1 = COALESCE(?, validation_n1),
                validation_rh = COALESCE(?, validation_rh),
                inclus_paie = COALESCE(?, inclus_paie),
                mois_paie = COALESCE(?, mois_paie)
             WHERE id = ?`,
            [statut, validation_n1, validation_rh, inclus_paie !== undefined ? inclus_paie : null, mois_paie !== undefined ? mois_paie : null, id]
        );

        if (statut) {
            const isApproved = statut === 'Approuvée' || statut === 'Remboursée';
            dispatchNotification({
                companyId: expense.company_id || 1,
                empId: expense.empId,
                title: isApproved ? '💰 Note de Frais Approuvée' : '⚠️ Note de Frais Modifiée',
                message: `Votre note de frais (${new Intl.NumberFormat('fr-CI').format(expense.montant)} F CFA) a été marquée : ${statut}.`,
                type: isApproved ? 'success' : 'warning'
            }).catch(() => {});
        }

        logAuditAction(req, 'MODIFICATION_NOTE_FRAIS', `Note de frais #${id} mise à jour (${statut || 'Modification'})`, 'Missions & Frais');
        res.json({ success: true, message: 'Note de frais mise à jour avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.delete('/api/expenses/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        await queryRun("DELETE FROM expense_reports WHERE id = ?", [req.params.id]);
        logAuditAction(req, 'SUPPRESSION_NOTE_FRAIS', `Suppression note de frais #${req.params.id}`, 'Missions & Frais');
        res.json({ success: true, message: 'Note de frais supprimée' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 7. MODULE CYCLE DE VIE : ONBOARDING & OFFBOARDING (STC)
// ==========================================
app.get('/api/lifecycle/onboarding', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const rows = await queryAll(
            `SELECT t.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, e.dateEmbauche, e.photo
             FROM onboarding_tasks t
             JOIN employees e ON t.empId = e.id
             WHERE (t.company_id = ? OR t.company_id = 1)
             ORDER BY t.statut ASC, t.echeance ASC`,
            [companyId]
        );
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/lifecycle/onboarding', authenticateToken, authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { empId, titre, categorie, description, echeance, responsable_action } = req.body;
        if (!empId || !titre) {
            return sendError(res, 400, 'Employé et titre de la tâche obligatoires', 'MISSING_FIELDS');
        }

        const result = await queryRun(
            `INSERT INTO onboarding_tasks (company_id, empId, titre, categorie, description, echeance, responsable_action, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'À faire')`,
            [companyId, empId, titre, categorie || 'EPI & Sécurité', description || '', echeance || null, responsable_action || 'RH']
        );

        logAuditAction(req, 'CREATION_TACHE_ONBOARDING', `Tâche onboarding "${titre}" assignée à employé #${empId}`, 'Cycle de Vie');
        res.json({ success: true, id: result.lastID, message: 'Tâche d\'intégration créée avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.patch('/api/lifecycle/onboarding/:id', authenticateToken, validateIdParam('id'), async (req, res) => {
    try {
        const id = req.params.id;
        const { statut, date_realisation, description } = req.body;
        await queryRun(
            `UPDATE onboarding_tasks SET 
                statut = COALESCE(?, statut),
                date_realisation = COALESCE(?, date_realisation),
                description = COALESCE(?, description)
             WHERE id = ?`,
            [statut, statut === 'Fait' ? (date_realisation || new Date().toISOString().split('T')[0]) : null, description, id]
        );

        logAuditAction(req, 'MODIFICATION_TACHE_ONBOARDING', `Tâche onboarding #${id} mise à jour : ${statut}`, 'Cycle de Vie');
        res.json({ success: true, message: 'Tâche mise à jour' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.delete('/api/lifecycle/onboarding/:id', authenticateToken, validateIdParam('id'), authorizeRoles('admin'), async (req, res) => {
    try {
        await queryRun("DELETE FROM onboarding_tasks WHERE id = ?", [req.params.id]);
        res.json({ success: true, message: 'Tâche supprimée' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.get('/api/lifecycle/offboarding', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const rows = await queryAll(
            `SELECT off.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, e.dateEmbauche, e.salaireBase, e.photo, e.email
             FROM offboarding_records off
             JOIN employees e ON off.empId = e.id
             WHERE (off.company_id = ? OR off.company_id = 1)
             ORDER BY off.date_depart DESC, off.created_at DESC`,
            [companyId]
        );
        res.json(rows);
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/lifecycle/stc-calculate', authenticateToken, async (req, res) => {
    try {
        const { empId, dateDepart, motifDepart, preavisEffectue, joursPresenceMois, deductions } = req.body;
        const employee = await queryGet("SELECT * FROM employees WHERE id = ?", [empId]);
        if (!employee) return sendError(res, 404, 'Employé non trouvé', 'NOT_FOUND');

        const salaireBase = employee.salaireBase || 75000;
        const dateEmbauche = new Date(employee.dateEmbauche || Date.now());
        const dateFin = new Date(dateDepart || Date.now());
        
        const diffYears = Math.max(0, (dateFin - dateEmbauche) / (1000 * 60 * 60 * 24 * 365.25));
        const seniorityYears = Math.floor(diffYears);

        const presenceDays = parseInt(joursPresenceMois || 30, 10);
        const stc_salaire_presence = Math.round((salaireBase / 30) * Math.min(30, Math.max(0, presenceDays)));

        const leaveBalanceRow = await queryGet("SELECT solde FROM leave_balances WHERE empId = ? ORDER BY annee DESC LIMIT 1", [empId]);
        const soldeConges = leaveBalanceRow ? leaveBalanceRow.solde : 15;
        const tauxJournalierConge = salaireBase / 30;
        const stc_conges_payes = Math.round(soldeConges * tauxJournalierConge);

        let moisPreavis = 1;
        if (employee.poste && (employee.poste.toLowerCase().includes('cadre') || employee.poste.toLowerCase().includes('directeur') || employee.poste.toLowerCase().includes('ingénieur'))) {
            moisPreavis = 3;
        }
        const stc_preavis = preavisEffectue ? 0 : Math.round(salaireBase * moisPreavis);

        let stc_indemnite_rupture = 0;
        if (motifDepart !== 'Démission' && motifDepart !== 'Faute Lourde' && seniorityYears >= 1) {
            let totalTaux = 0;
            for (let y = 1; y <= seniorityYears; y++) {
                if (y <= 5) totalTaux += 0.30;
                else if (y <= 10) totalTaux += 0.35;
                else totalTaux += 0.40;
            }
            stc_indemnite_rupture = Math.round(salaireBase * totalTaux);
        }

        const monthIndex = dateFin.getMonth() + 1;
        const stc_prorata_gratification = Math.round((salaireBase / 12) * monthIndex * 0.75);

        const totalBrut = stc_salaire_presence + stc_conges_payes + stc_preavis + stc_indemnite_rupture + stc_prorata_gratification;
        const ded = parseFloat(deductions || 0);
        const stc_total_net = Math.max(0, Math.round(totalBrut - ded));

        res.json({
            success: true,
            calculation: {
                seniorityYears,
                seniorityExact: diffYears.toFixed(1),
                salaireBase,
                stc_salaire_presence,
                stc_conges_payes,
                soldeConges,
                stc_preavis,
                moisPreavis,
                stc_indemnite_rupture,
                stc_prorata_gratification,
                stc_deductions: ded,
                totalBrut,
                stc_total_net
            }
        });
    } catch (err) {
        sendError(res, 500, err.message, 'CALCULATION_ERROR');
    }
});

app.post('/api/lifecycle/offboarding', authenticateToken, authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const { 
            empId, date_notification, date_depart, motif_depart, 
            preavis_effectue, mois_preavis, stc_salaire_presence, 
            stc_conges_payes, stc_preavis, stc_indemnite_rupture, 
            stc_prorata_gratification, stc_deductions, stc_total_net, 
            restitution_materiel, entretien_depart, certificat_emis, notes 
        } = req.body;

        if (!empId || !date_depart || !motif_depart) {
            return sendError(res, 400, 'Employé, date et motif de départ obligatoires', 'MISSING_FIELDS');
        }

        const result = await queryRun(
            `INSERT INTO offboarding_records (
                company_id, empId, date_notification, date_depart, motif_depart, statut,
                preavis_effectue, mois_preavis, stc_salaire_presence, stc_conges_payes,
                stc_preavis, stc_indemnite_rupture, stc_prorata_gratification, stc_deductions,
                stc_total_net, restitution_materiel, entretien_depart, certificat_emis, notes
             ) VALUES (?, ?, ?, ?, ?, 'Clôturé', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId, empId, date_notification || null, date_depart, motif_depart,
                preavis_effectue ? 1 : 0, mois_preavis || 1, stc_salaire_presence || 0,
                stc_conges_payes || 0, stc_preavis || 0, stc_indemnite_rupture || 0,
                stc_prorata_gratification || 0, stc_deductions || 0, stc_total_net || 0,
                restitution_materiel ? 1 : 0, entretien_depart ? 1 : 0, certificat_emis ? 1 : 0, notes || ''
            ]
        );

        await queryRun("UPDATE employees SET statut = 'Inactif', compteActif = 0 WHERE id = ?", [empId]);

        logAuditAction(req, 'CLOTURE_OFFBOARDING', `Dossier de départ & STC clôturé pour employé #${empId} (${motif_depart})`, 'Cycle de Vie');
        res.json({ success: true, id: result.lastID, message: 'Dossier de départ et STC enregistrés avec succès' });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 8. MODULE ESPACE MANAGER (MSS) & APPROBATIONS
// ==========================================
app.get('/api/manager/overview', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const currentUserId = req.user.id;
        const currentEmpId = req.user.empId;
        const currentUserRole = req.user.role;

        const allEmployees = await queryAll("SELECT id, nom, prenoms, matricule, poste, departement, site, telephone, email, photo, responsable, statut FROM employees WHERE (company_id = ? OR company_id = 1) AND statut = 'Actif'", [companyId]);
        
        let team = allEmployees;
        if (currentUserRole === 'employee' && currentEmpId) {
            const myEmp = allEmployees.find(e => e.id === currentEmpId);
            const myFullName = myEmp ? `${myEmp.nom} ${myEmp.prenoms}`.trim() : '';
            team = allEmployees.filter(e => e.id === currentEmpId || (myFullName && e.responsable && e.responsable.toLowerCase().includes(myFullName.toLowerCase())));
        }

        const teamIds = team.map(t => t.id);
        const teamPlaceholders = teamIds.length > 0 ? teamIds.map(() => '?').join(',') : '0';

        const pendingLeaves = teamIds.length > 0 ? await queryAll(
            `SELECT l.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, e.photo
             FROM leaves l JOIN employees e ON l.empId = e.id
             WHERE l.empId IN (${teamPlaceholders}) AND l.statut = 'En attente'
             ORDER BY l.debut ASC`,
            teamIds
        ) : [];

        const pendingAdvances = teamIds.length > 0 ? await queryAll(
            `SELECT a.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, e.photo
             FROM advances a JOIN employees e ON a.empId = e.id
             WHERE a.empId IN (${teamPlaceholders}) AND a.statut = 'En attente'
             ORDER BY a.dateDemande DESC`,
            teamIds
        ) : [];

        const pendingMissions = teamIds.length > 0 ? await queryAll(
            `SELECT m.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, e.photo
             FROM missions m JOIN employees e ON m.empId = e.id
             WHERE m.empId IN (${teamPlaceholders}) AND m.statut LIKE '%attente%'
             ORDER BY m.date_debut ASC`,
            teamIds
        ) : [];

        const pendingExpenses = teamIds.length > 0 ? await queryAll(
            `SELECT exp.*, e.nom, e.prenoms, e.matricule, e.poste, e.departement, exp.montant
             FROM expense_reports exp JOIN employees e ON exp.empId = e.id
             WHERE exp.empId IN (${teamPlaceholders}) AND exp.statut = 'Soumis'
             ORDER BY exp.date_depense DESC`,
            teamIds
        ) : [];

        const today = new Date().toISOString().split('T')[0];
        const todayAttendances = teamIds.length > 0 ? await queryAll(
            `SELECT a.*, e.nom, e.prenoms, e.matricule
             FROM attendances a JOIN employees e ON a.empId = e.id
             WHERE a.date = ? AND a.empId IN (${teamPlaceholders})`,
            [today, ...teamIds]
        ) : [];

        res.json({
            team,
            teamCount: team.length,
            presentCount: todayAttendances.filter(a => a.statut === 'Présent' || a.heureArrivee).length,
            pendingLeaves,
            pendingAdvances,
            pendingMissions,
            pendingExpenses,
            todayAttendances
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

// ==========================================
// 9. MODULE PEOPLE ANALYTICS & EXPORT BANCAIRE
// ==========================================
app.get('/api/analytics/kpis', authenticateToken, async (req, res) => {
    try {
        const companyId = req.company_id || 1;
        const employees = await queryAll("SELECT id, nom, prenoms, matricule, poste, departement, site, sexe, dateEmbauche, dateNaissance, salaireBase, statut, type FROM employees WHERE company_id = ? OR company_id = 1", [companyId]);
        const leaves = await queryAll("SELECT * FROM leaves WHERE (statut = 'Approuvé' OR statut = 'Validé')", []);
        
        const currentYear = new Date().getFullYear();
        const bradfordScores = employees.map(emp => {
            const empLeaves = leaves.filter(l => l.empId === emp.id && new Date(l.debut).getFullYear() === currentYear);
            const S = empLeaves.length;
            const D = empLeaves.reduce((acc, l) => acc + (parseFloat(l.duree) || 1), 0);
            const score = S * S * D;
            return {
                id: emp.id,
                nom: `${emp.nom} ${emp.prenoms}`,
                matricule: emp.matricule,
                departement: emp.departement,
                occurrences: S,
                totalJours: D,
                score,
                risque: score > 200 ? 'Élevé' : score > 50 ? 'Modéré' : 'Faible'
            };
        }).sort((a, b) => b.score - a.score);

        const agePyramid = {
            '< 25 ans': { M: 0, F: 0 },
            '25-34 ans': { M: 0, F: 0 },
            '35-44 ans': { M: 0, F: 0 },
            '45-54 ans': { M: 0, F: 0 },
            '55+ ans': { M: 0, F: 0 }
        };

        const now = new Date();
        employees.forEach(emp => {
            let age = 32;
            if (emp.dateNaissance) {
                age = Math.floor((now - new Date(emp.dateNaissance)) / (1000 * 60 * 60 * 24 * 365.25));
            }
            const gender = (emp.sexe === 'F' || emp.sexe === 'Femme') ? 'F' : 'M';
            if (age < 25) agePyramid['< 25 ans'][gender]++;
            else if (age <= 34) agePyramid['25-34 ans'][gender]++;
            else if (age <= 44) agePyramid['35-44 ans'][gender]++;
            else if (age <= 54) agePyramid['45-54 ans'][gender]++;
            else agePyramid['55+ ans'][gender]++;
        });

        const deptStats = {};
        let masseSalarialeTotale = 0;
        employees.forEach(emp => {
            const dept = emp.departement || 'Non affecté';
            if (!deptStats[dept]) {
                deptStats[dept] = { count: 0, masseSalariale: 0 };
            }
            deptStats[dept].count++;
            const sal = parseFloat(emp.salaireBase) || 0;
            deptStats[dept].masseSalariale += sal;
            masseSalarialeTotale += sal;
        });

        const contractStats = { CDI: 0, CDD: 0, Stage: 0, Prestation: 0 };
        employees.forEach(emp => {
            const t = emp.type || 'CDI';
            if (contractStats[t] !== undefined) contractStats[t]++;
            else contractStats['CDI']++;
        });

        res.json({
            totalEmployees: employees.length,
            activeEmployees: employees.filter(e => e.statut === 'Actif').length,
            masseSalarialeTotale,
            bradfordScores: bradfordScores.slice(0, 10),
            agePyramid,
            deptStats,
            contractStats
        });
    } catch (err) {
        sendError(res, 500, err.message, 'DATABASE_ERROR');
    }
});

app.post('/api/analytics/bank-transfer-file', authenticateToken, authorizeRoles('admin', 'assistant'), async (req, res) => {
    try {
        const { mois, format = 'UEMOA_STANDARD' } = req.body;
        const employees = await queryAll("SELECT * FROM employees WHERE statut = 'Actif' AND rib IS NOT NULL AND rib != ''", []);
        const settings = await queryGet("SELECT * FROM settings WHERE id = 1") || {};

        const companyName = settings.companyName || 'GEBAT SA';
        const dateStr = new Date().toISOString().split('T')[0];
        
        let fileContent = `HEADER|VIR_SALAIRES|${companyName}|${mois || dateStr}|DEV=XOF\n`;
        let totalMontant = 0;

        employees.forEach((emp, index) => {
            const salNet = Math.round((emp.salaireBase || 150000) * 0.85);
            totalMontant += salNet;
            fileContent += `LINE|${index + 1}|${emp.matricule}|${emp.nom} ${emp.prenoms}|${emp.rib || 'CI0000000000'}|${salNet}|SALAIRE_${mois || dateStr}\n`;
        });

        fileContent += `FOOTER|COUNT=${employees.length}|TOTAL=${totalMontant}\n`;

        res.json({
            success: true,
            format,
            filename: `VIREMENT_SALAIRES_${companyName.replace(/\s+/g, '_')}_${mois || dateStr}.txt`,
            fileContent,
            totalEmployees: employees.length,
            totalAmount: totalMontant
        });
    } catch (err) {
        sendError(res, 500, err.message, 'EXPORT_ERROR');
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

// --- ROUTAGE SPA REACT (FALLBACK POUR TOUTES LES PAGES CLIENT) ---
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'Endpoint introuvable', code: 'NOT_FOUND' });
    }
    const fs = require('fs');
    const distIndex = path.join(__dirname, '../dist/index.html');
    const frontendDistIndex = path.join(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(frontendDistIndex)) {
        res.sendFile(frontendDistIndex);
    } else if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
    } else {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    }
});

// --- DEMARRAGE DU SERVEUR ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Serveur SIRH-CIV Sécurisé en cours d'exécution sur le port ${PORT}`);
});
