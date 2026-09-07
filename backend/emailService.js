const nodemailer = require('nodemailer');
const db = require('./database');

// Configuration par défaut issue des variables d'environnement
const DEFAULT_SMTP_HOST = process.env.SMTP_HOST || '';
const DEFAULT_SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const DEFAULT_SMTP_USER = process.env.SMTP_USER || '';
const DEFAULT_SMTP_PASS = process.env.SMTP_PASS || '';
const DEFAULT_SMTP_SECURE = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
const DEFAULT_SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'notifications@gebat-sa.com';
const DEFAULT_SENDER_NAME = process.env.SENDER_NAME || 'GEBAT SA - Notifications RH';
const APP_URL = process.env.APP_URL || 'https://gebat-rh.vercel.app';

/**
 * Récupère les paramètres SMTP enregistrés en base ou variables d'environnement
 */
async function getSmtpConfig(companyId = 1) {
    return new Promise((resolve) => {
        db.get("SELECT * FROM settings WHERE id = 1 OR company_id = ?", [companyId], (err, row) => {
            if (err || !row) {
                return resolve({
                    host: DEFAULT_SMTP_HOST,
                    port: DEFAULT_SMTP_PORT,
                    user: DEFAULT_SMTP_USER,
                    pass: DEFAULT_SMTP_PASS,
                    secure: DEFAULT_SMTP_SECURE,
                    senderEmail: DEFAULT_SENDER_EMAIL,
                    senderName: DEFAULT_SENDER_NAME,
                    emailNotifLeaves: 1,
                    emailNotifAdvances: 1,
                    emailNotifPayroll: 1,
                    emailNotifContracts: 1,
                    emailNotifDisciplinary: 1
                });
            }

            resolve({
                host: row.smtp_host || DEFAULT_SMTP_HOST,
                port: row.smtp_port ? parseInt(row.smtp_port, 10) : DEFAULT_SMTP_PORT,
                user: row.smtp_user || DEFAULT_SMTP_USER,
                pass: row.smtp_pass || DEFAULT_SMTP_PASS,
                secure: row.smtp_secure === 1 || row.smtp_secure === '1' || row.smtp_secure === true || DEFAULT_SMTP_SECURE,
                senderEmail: row.sender_email || row.smtp_user || DEFAULT_SENDER_EMAIL,
                senderName: row.sender_name || DEFAULT_SENDER_NAME,
                emailNotifLeaves: row.email_notif_leaves !== undefined ? row.email_notif_leaves : 1,
                emailNotifAdvances: row.email_notif_advances !== undefined ? row.email_notif_advances : 1,
                emailNotifPayroll: row.email_notif_payroll !== undefined ? row.email_notif_payroll : 1,
                emailNotifContracts: row.email_notif_contracts !== undefined ? row.email_notif_contracts : 1,
                emailNotifDisciplinary: row.email_notif_disciplinary !== undefined ? row.email_notif_disciplinary : 1
            });
        });
    });
}

/**
 * Crée un transporteur Nodemailer avec la configuration fournie ou dynamique
 */
function createTransporter(config) {
    if (!config || !config.host) {
        return null;
    }

    const transportOpts = {
        host: config.host,
        port: config.port,
        secure: config.secure || (config.port === 465),
        auth: (config.user && config.pass) ? {
            user: config.user,
            pass: config.pass
        } : undefined,
        tls: {
            rejectUnauthorized: false // Tolérant pour serveurs d'entreprise avec certificats auto-signés
        }
    };

    return nodemailer.createTransport(transportOpts);
}

/**
 * Générateur de gabarit HTML élégant aux couleurs de GEBAT SA
 */
function buildHtmlTemplate({ badgeText, badgeColor = '#2563EB', title, subtitle, details = [], actionUrl, actionText, footerNote }) {
    const appBaseUrl = actionUrl || APP_URL;
    
    const detailsHtml = details.map(item => `
        <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #64748b; width: 38%;">${item.label}</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 800; color: #0f172a;">${item.value}</td>
        </tr>
    `).join('');

    const actionButtonHtml = actionText ? `
        <div style="text-align: center; margin: 30px 0 20px 0;">
            <a href="${appBaseUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 800; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(37,99,235,0.35);">
                ${actionText} &rarr;
            </a>
        </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 30px 15px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(15,23,42,0.06); border: 1px solid #e2e8f0;">
                        
                        <!-- Header GEBAT SA -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 30px; text-align: left; border-bottom: 3px solid #E5A110;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td>
                                            <div style="font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: 1px;">GEBAT <span style="color: #E5A110;">SA</span></div>
                                            <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px;">Système d'Information RH & Capital Humain</div>
                                        </td>
                                        <td align="right">
                                            <span style="display: inline-block; background-color: rgba(229, 161, 16, 0.15); border: 1px solid rgba(229, 161, 16, 0.4); color: #E5A110; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 4px 10px; border-radius: 8px;">
                                                Notification Officielle
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 32px 30px;">
                                
                                ${badgeText ? `
                                    <div style="margin-bottom: 16px;">
                                        <span style="display: inline-block; background-color: ${badgeColor}15; border: 1px solid ${badgeColor}35; color: ${badgeColor}; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px;">
                                            ${badgeText}
                                        </span>
                                    </div>
                                ` : ''}

                                <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                                    ${title}
                                </h1>

                                ${subtitle ? `
                                    <p style="margin: 0 0 24px 0; font-size: 14px; font-weight: 500; color: #475569; line-height: 1.5;">
                                        ${subtitle}
                                    </p>
                                ` : ''}

                                <!-- Tableau Récapitulatif -->
                                ${details.length > 0 ? `
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                                        ${detailsHtml}
                                    </table>
                                ` : ''}

                                ${actionButtonHtml}

                                ${footerNote ? `
                                    <div style="padding: 12px 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; font-size: 12px; font-weight: 600; color: #92400e; margin-top: 20px;">
                                        ${footerNote}
                                    </div>
                                ` : ''}

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f1f5f9; padding: 22px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
                                <div style="font-weight: 800; color: #334155; margin-bottom: 4px;">La Générale du Bâtiment et des Travaux Publics (GEBAT SA)</div>
                                <div>Cocody II Plateaux 7e Tranche, Rue L139, Abidjan - Côte d'Ivoire | Tel : +225 27 22 52 34 23</div>
                                <div style="margin-top: 8px; font-size: 10px; color: #94a3b8;">Ce message automatique est émis par le module de notification SIRH GEBAT. Merci de ne pas répondre directement à cet email.</div>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

/**
 * Envoie un email avec gestion résiliente
 */
async function sendMail({ to, subject, html, text, companyId = 1, customConfig = null }) {
    if (!to) {
        console.warn('[EMAIL SERVICE] Aucun destinataire fourni, envoi ignoré.');
        return { success: false, reason: 'NO_RECIPIENT' };
    }

    try {
        const config = customConfig || await getSmtpConfig(companyId);
        
        // Si aucun serveur SMTP n'est renseigné, simuler l'envoi de façon sécurisée
        if (!config.host || !config.user) {
            console.log(`[EMAIL SERVICE - SIMULATION ACTIVE] Destinataire: ${to} | Objet: "${subject}"`);
            console.log(`[EMAIL SERVICE - SIMULATION INFO] Veuillez configurer vos identifiants SMTP dans les Paramètres pour activer les envois réels.`);
            return {
                success: true,
                simulated: true,
                message: `Email simulé avec succès pour ${to}. Configurer le SMTP pour l'envoi réel.`,
                preview: { to, subject }
            };
        }

        const transporter = createTransporter(config);
        if (!transporter) {
            return { success: false, reason: 'TRANSPORTER_CREATION_FAILED' };
        }

        const senderAddress = `"${config.senderName}" <${config.senderEmail}>`;

        const info = await transporter.sendMail({
            from: senderAddress,
            to,
            subject,
            text: text || subject,
            html
        });

        console.log(`[EMAIL SERVICE] Email envoyé avec succès à ${to} [MessageId: ${info.messageId}]`);
        return { success: true, messageId: info.messageId, simulated: false };

    } catch (err) {
        console.error(`[EMAIL SERVICE ERREUR] Échec de l'envoi à ${to} :`, err.message);
        return {
            success: false,
            error: err.message,
            simulated: false
        };
    }
}

/**
 * Récupère les emails des administrateurs et gestionnaires RH
 */
async function getAdminEmails(companyId = 1) {
    return new Promise((resolve) => {
        db.all("SELECT email FROM users WHERE (role = 'admin' OR role = 'assistant') AND is_deleted = 0 AND email IS NOT NULL", [], (err, rows) => {
            if (err || !rows || rows.length === 0) {
                return resolve([DEFAULT_SENDER_EMAIL]);
            }
            const emails = rows.map(r => r.email).filter(e => e && e.includes('@'));
            resolve(emails.length > 0 ? emails : [DEFAULT_SENDER_EMAIL]);
        });
    });
}

// ====================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS MÉTIER (TRIGGERS)
// ====================================================================

/**
 * 1. Notification Demande de Congé (Salarié -> RH)
 */
async function sendLeaveRequestEmail({ leave, employee, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifLeaves === 0 || config.emailNotifLeaves === false) return;

        const adminEmails = await getAdminEmails();
        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const subject = `🌴 Nouvelle Demande de Congé : ${empName} (${leave.type || 'Congé Annuel'})`;

        const html = buildHtmlTemplate({
            badgeText: 'Demande de Congé',
            badgeColor: '#2563EB',
            title: `Nouvelle demande de congé déposée`,
            subtitle: `Le collaborateur <strong>${empName}</strong> a soumis une demande d'absence nécessitant votre validation.`,
            details: [
                { label: 'Collaborateur', value: `${empName} (${employee?.matricule || 'N/A'})` },
                { label: 'Poste & Département', value: `${employee?.poste || 'N/A'} - ${employee?.departement || 'N/A'}` },
                { label: 'Type de congé', value: leave.type || 'Congé Payé' },
                { label: 'Période demandée', value: `Du ${leave.debut} au ${leave.fin}` },
                { label: 'Durée', value: `${leave.duree || 1} jour(s)` },
                { label: 'Motif', value: leave.motif || 'Non précisé' }
            ],
            actionUrl: `${originUrl || APP_URL}/leaves`,
            actionText: 'Consulter et Valider sur le SIRH',
            footerNote: 'Rappel légal : Conformément au Code du Travail ivoirien, la décision doit être notifiée au salarié avant son départ effectif.'
        });

        for (const adminEmail of adminEmails) {
            await sendMail({ to: adminEmail, subject, html });
        }
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendLeaveRequestEmail:', err);
    }
}

/**
 * 2. Notification Décision sur Congé (RH -> Salarié)
 */
async function sendLeaveDecisionEmail({ leave, employee, status, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifLeaves === 0 || config.emailNotifLeaves === false) return;

        const empEmail = employee?.email;
        if (!empEmail) return;

        const isApproved = status === 'Approuvé';
        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const subject = isApproved 
            ? `✅ Demande de Congé Approuvée - GEBAT SA`
            : `❌ Décision sur votre Demande de Congé - GEBAT SA`;

        const html = buildHtmlTemplate({
            badgeText: isApproved ? 'Congé Validé' : 'Demande Refusée',
            badgeColor: isApproved ? '#009E49' : '#e11d48',
            title: isApproved ? 'Votre demande de congé a été validée !' : 'Mise à jour de votre demande de congé',
            subtitle: `Bonjour <strong>${empName}</strong>, votre demande d'absence a fait l'objet d'une décision par la Direction RH.`,
            details: [
                { label: 'Statut de la demande', value: isApproved ? 'ACCORDÉE / VALIDÉE' : 'REFUSÉE' },
                { label: 'Type de congé', value: leave.type || 'Congé' },
                { label: 'Période accordée', value: `Du ${leave.debut} au ${leave.fin}` },
                { label: 'Durée', value: `${leave.duree || 1} jour(s)` }
            ],
            actionUrl: `${originUrl || APP_URL}/portal`,
            actionText: 'Consulter mon Espace Collaborateur',
            footerNote: isApproved 
                ? 'Pensez à organiser le passage de consignes sur vos chantiers/dossiers avant votre départ.'
                : 'Vous pouvez vous rapprocher du département Ressources Humaines pour plus de détails.'
        });

        await sendMail({ to: empEmail, subject, html });
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendLeaveDecisionEmail:', err);
    }
}

/**
 * 3. Notification Demande d'Avance sur Salaire (Salarié -> RH/Compta)
 */
async function sendAdvanceRequestEmail({ advance, employee, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifAdvances === 0 || config.emailNotifAdvances === false) return;

        const adminEmails = await getAdminEmails();
        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const amountFormatted = new Intl.NumberFormat('fr-CI').format(advance.montant || 0);
        const subject = `💰 Nouvelle Demande d'Avance : ${empName} (${amountFormatted} F CFA)`;

        const html = buildHtmlTemplate({
            badgeText: 'Demande d\'Avance',
            badgeColor: '#E5A110',
            title: `Demande d'avance sur salaire soumise`,
            subtitle: `Le collaborateur <strong>${empName}</strong> a sollicité un acompte/avance sur son prochain salaire.`,
            details: [
                { label: 'Collaborateur', value: `${empName} (${employee?.matricule || 'N/A'})` },
                { label: 'Montant sollicité', value: `${amountFormatted} F CFA` },
                { label: 'Mois de remboursement', value: advance.moisRemboursement || 'Prochaine paie' },
                { label: 'Motif', value: advance.motif || 'Non précisé' }
            ],
            actionUrl: `${originUrl || APP_URL}/payroll`,
            actionText: 'Traiter l\'Avance dans le Module Paie',
            footerNote: 'Rappel politique interne : Les avances sont déduites directement lors du calcul du Net à Payer du mois cible.'
        });

        for (const adminEmail of adminEmails) {
            await sendMail({ to: adminEmail, subject, html });
        }
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendAdvanceRequestEmail:', err);
    }
}

/**
 * 4. Notification Décision sur Avance (RH -> Salarié)
 */
async function sendAdvanceDecisionEmail({ advance, employee, status, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifAdvances === 0 || config.emailNotifAdvances === false) return;

        const empEmail = employee?.email;
        if (!empEmail) return;

        const isApproved = status === 'Accordée' || status === 'Approuvée' || status === 'En cours';
        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const amountFormatted = new Intl.NumberFormat('fr-CI').format(advance.montant || 0);
        const subject = isApproved 
            ? `✅ Avance sur Salaire Accordée (${amountFormatted} F CFA) - GEBAT SA`
            : `❌ Décision sur votre Demande d'Avance - GEBAT SA`;

        const html = buildHtmlTemplate({
            badgeText: isApproved ? 'Avance Accordée' : 'Avance Non Retenue',
            badgeColor: isApproved ? '#009E49' : '#e11d48',
            title: isApproved ? 'Votre demande d\'avance a été acceptée' : 'Information concernant votre demande d\'avance',
            subtitle: `Bonjour <strong>${empName}</strong>, votre demande d'avance sur salaire a été traitée par la Direction Financière & RH.`,
            details: [
                { label: 'Statut', value: isApproved ? 'ACCORDÉE' : 'REFUSÉE' },
                { label: 'Montant', value: `${amountFormatted} F CFA` },
                { label: 'Mois d\'imputation', value: advance.moisRemboursement || 'Prochaine paie' }
            ],
            actionUrl: `${originUrl || APP_URL}/portal`,
            actionText: 'Consulter mon Historique Financier',
            footerNote: isApproved ? 'Le règlement sera opéré selon votre mode de paiement habituel (Virement / Mobile Money / Caisse).' : ''
        });

        await sendMail({ to: empEmail, subject, html });
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendAdvanceDecisionEmail:', err);
    }
}

/**
 * 5. Notification Transmission du Bulletin de Paie (RH -> Salarié)
 */
async function sendPayslipEmail({ employee, payslipData, period, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifPayroll === 0 || config.emailNotifPayroll === false) return { success: false, reason: 'DISABLED' };

        const empEmail = employee?.email;
        if (!empEmail) return { success: false, reason: 'NO_EMPLOYEE_EMAIL' };

        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const periodeLabel = period || new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const netFormatted = payslipData?.netAPayer ? new Intl.NumberFormat('fr-CI').format(payslipData.netAPayer) : 'Consulter en ligne';
        const subject = `📄 Bulletin de Paie disponible : ${periodeLabel} - GEBAT SA`;

        const html = buildHtmlTemplate({
            badgeText: 'Bulletin de Paie',
            badgeColor: '#2563EB',
            title: `Votre bulletin de paie de ${periodeLabel} est disponible`,
            subtitle: `Bonjour <strong>${empName}</strong>, votre fiche de paie pour la période de <strong>${periodeLabel}</strong> a été éditée et validée par le service Paie.`,
            details: [
                { label: 'Salarié', value: `${empName} (Mat. ${employee?.matricule || 'N/A'})` },
                { label: 'Période', value: periodeLabel },
                { label: 'Net à Payer', value: `${netFormatted} F CFA` },
                { label: 'Mode de Règlement', value: employee?.modePaiement || 'Virement Bancaire' }
            ],
            actionUrl: `${originUrl || APP_URL}/portal`,
            actionText: 'Télécharger mon Bulletin Officiel (PDF)',
            footerNote: 'Document confidentiel et strictement personnel. Conservez vos bulletins sans limitation de durée.'
        });

        return await sendMail({ to: empEmail, subject, html });
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendPayslipEmail:', err);
        return { success: false, error: err.message };
    }
}

/**
 * 6. Alerte Échéance de Contrat CDD (Système -> RH)
 */
async function sendContractExpiryAlertEmail({ contract, employee, daysLeft, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifContracts === 0 || config.emailNotifContracts === false) return;

        const adminEmails = await getAdminEmails();
        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const isUrgent = daysLeft <= 15;
        const subject = `${isUrgent ? '🚨 URGENT' : '📜 ALERTE'} : Échéance Contrat ${contract.type} (${daysLeft} jours) - ${empName}`;

        const html = buildHtmlTemplate({
            badgeText: isUrgent ? 'Échéance Imminente' : 'Suivi des Contrats',
            badgeColor: isUrgent ? '#e11d48' : '#f59e0b',
            title: `Contrat CDD arrivant à échéance dans ${daysLeft} jour(s)`,
            subtitle: `Le contrat de travail de <strong>${empName}</strong> arrive à son terme légal le <strong>${contract.fin}</strong>.`,
            details: [
                { label: 'Collaborateur', value: `${empName} (Mat. ${employee?.matricule || 'N/A'})` },
                { label: 'Type de Contrat', value: contract.type || 'CDD' },
                { label: 'Date d\'échéance', value: contract.fin },
                { label: 'Délai restant', value: `${daysLeft} jour(s)` },
                { label: 'Poste / Chantier', value: `${employee?.poste || 'N/A'} (${employee?.site || 'Siège'})` }
            ],
            actionUrl: `${originUrl || APP_URL}/contracts`,
            actionText: 'Gérer le Renouvellement ou Fin de Contrat',
            footerNote: 'Code du Travail CI : Veillez à notifier le préavis ou la proposition de renouvellement dans les délais légaux.'
        });

        for (const adminEmail of adminEmails) {
            await sendMail({ to: adminEmail, subject, html });
        }
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendContractExpiryAlertEmail:', err);
    }
}

/**
 * 7. Notification Procédure Disciplinaire (RH -> Salarié)
 */
async function sendDisciplinaryEmail({ action, employee, originUrl }) {
    try {
        const config = await getSmtpConfig();
        if (config.emailNotifDisciplinary === 0 || config.emailNotifDisciplinary === false) return;

        const empEmail = employee?.email;
        if (!empEmail) return;

        const empName = `${employee?.nom || ''} ${employee?.prenoms || 'Salarié'}`.trim();
        const subject = `⚠️ Notification RH : Demande d'Explications / Procédure - GEBAT SA`;

        const html = buildHtmlTemplate({
            badgeText: 'Ressources Humaines & Discipline',
            badgeColor: '#e11d48',
            title: `Notification relative à une procédure RH`,
            subtitle: `Bonjour <strong>${empName}</strong>, un document formel a été émis à votre attention concernant votre contrat de travail.`,
            details: [
                { label: 'Type de procédure', value: action.type || 'Demande d\'explications' },
                { label: 'Date d\'émission', value: action.dateEmission || new Date().toISOString().split('T')[0] },
                { label: 'Motif / Objet', value: action.motif || 'Consulter le détail dans l\'espace RH' },
                { label: 'Statut actuel', value: action.statut || 'En attente de réponse' }
            ],
            actionUrl: `${originUrl || APP_URL}/portal`,
            actionText: 'Accéder à mon Espace Collaborateur & Répondre',
            footerNote: 'Ce document requiert votre attention et votre réponse écrite dans le délai imparti par le règlement intérieur.'
        });

        await sendMail({ to: empEmail, subject, html });
    } catch (err) {
        console.error('[EMAIL SERVICE] Erreur sendDisciplinaryEmail:', err);
    }
}

/**
 * 8. Test d'envoi d'Email SMTP
 */
async function sendTestEmail({ to, smtpConfig, senderEmail, senderName }) {
    const configToTest = {
        host: smtpConfig?.host,
        port: parseInt(smtpConfig?.port || '587', 10),
        user: smtpConfig?.user,
        pass: smtpConfig?.pass,
        secure: smtpConfig?.secure === 1 || smtpConfig?.secure === true || smtpConfig?.secure === '1',
        senderEmail: senderEmail || smtpConfig?.user || 'notifications@gebat-sa.com',
        senderName: senderName || 'GEBAT SA - Test Notificateur'
    };

    const subject = `🚀 Test de Configuration Email SMTP Réussi - GEBAT SA`;
    const html = buildHtmlTemplate({
        badgeText: 'Test Technique SMTP',
        badgeColor: '#009E49',
        title: 'Votre passerelle d\'envoi d\'emails est opérationnelle !',
        subtitle: `Félicitations, la liaison SMTP de **GEBAT RH** avec votre serveur d'envoi a été vérifiée avec succès.`,
        details: [
            { label: 'Serveur SMTP (Host)', value: configToTest.host || 'Mode Simulation' },
            { label: 'Port d\'écoute', value: `${configToTest.port} (${configToTest.secure ? 'SSL/TLS' : 'STARTTLS'})` },
            { label: 'Compte Utilisateur', value: configToTest.user || 'N/A' },
            { label: 'Email Expéditeur', value: configToTest.senderEmail },
            { label: 'Horodatage du test', value: new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' }) + ' (GMT)' }
        ],
        actionUrl: APP_URL,
        actionText: 'Retourner sur la Plateforme GEBAT RH',
        footerNote: 'Votre SIRH est désormais prêt à délivrer en temps réel les notifications d\'approbations, fiches de paie et alertes RH par email.'
    });

    return await sendMail({
        to,
        subject,
        html,
        customConfig: configToTest
    });
}

module.exports = {
    getSmtpConfig,
    createTransporter,
    sendMail,
    sendTestEmail,
    sendLeaveRequestEmail,
    sendLeaveDecisionEmail,
    sendAdvanceRequestEmail,
    sendAdvanceDecisionEmail,
    sendPayslipEmail,
    sendContractExpiryAlertEmail,
    sendDisciplinaryEmail
};
