const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'sirh_civ_encryption_key_2026_default', 'sirh_salt_key', 32);

/**
 * Chiffrement AES-256-GCM des champs sensibles
 */
function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

/**
 * Déchiffrement AES-256-GCM avec secours rétrocompatible
 */
function decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.includes(':')) return ciphertext;
    try {
        const parts = ciphertext.split(':');
        if (parts.length !== 3) return ciphertext;
        const [ivHex, tagHex, encryptedText] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        decipher.setAuthTag(tag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        return ciphertext; // En cas de texte non chiffré historique
    }
}

/**
 * Masquage du numéro de téléphone (Ex: +225 07 ** ** 11)
 */
function maskPhone(phone) {
    if (!phone) return 'N/A';
    const str = String(phone).trim();
    if (str.length <= 6) return '******';
    return str.substring(0, 4) + ' ** ** ' + str.substring(str.length - 2);
}

/**
 * Masquage du numéro CNPS (Ex: CNPS-****567)
 */
function maskCnps(cnps) {
    if (!cnps) return 'N/A';
    const str = String(cnps).trim();
    if (str.length <= 5) return '*****';
    return str.substring(0, 3) + '****' + str.substring(str.length - 3);
}

/**
 * Masquage de l'adresse email (Ex: k***e@sirh.ci)
 */
function maskEmail(email) {
    if (!email || !email.includes('@')) return '***@***';
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 ? name[0] + '***' + name[name.length - 1] : '***';
    return `${maskedName}@${domain}`;
}

/**
 * Anonymisation définitive pour la conformité RGPD / Droit à l'oubli
 */
function anonymizeData(record) {
    return {
        ...record,
        nom: 'ANONYME',
        prenoms: 'ANONYMISÉ',
        email: `anonyme_${Date.now()}@sirh.ci`,
        telephone: '+225 00 00 00 00',
        cnps: 'CNPS-00000',
        rib: 'CI00 0000 0000 0000 0000 0000',
        photo: null,
        statut: 'Archivé'
    };
}

module.exports = {
    encrypt,
    decrypt,
    maskPhone,
    maskCnps,
    maskEmail,
    anonymizeData
};
