-- ============================================================
-- SCHÉMA DE BASE DE DONNÉES MYSQL POUR GEBAT SA (SIRH-CIV)
-- La Générale du Bâtiment et des Travaux Publics
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS `companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `rc` VARCHAR(100),
    `cc` VARCHAR(100),
    `cnps_employer` VARCHAR(100),
    `address` TEXT,
    `phone` VARCHAR(100),
    `email` VARCHAR(150),
    `logo` VARCHAR(255) DEFAULT '/gebat_logo.png',
    `primaryColor` VARCHAR(50) DEFAULT '#2563EB',
    `secondaryColor` VARCHAR(50) DEFAULT '#E5A110',
    `tenantSlug` VARCHAR(100) UNIQUE DEFAULT 'gebat-sa.ci',
    `saasPlan` VARCHAR(50) DEFAULT 'BUSINESS PRO',
    `maxEmployees` INT DEFAULT 250,
    `status` VARCHAR(50) DEFAULT 'Actif',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. SETTINGS
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `companyName` VARCHAR(255),
    `rc` VARCHAR(100),
    `cc` VARCHAR(100),
    `cnps_employer` VARCHAR(100),
    `address` TEXT,
    `phone` VARCHAR(100),
    `email` VARCHAR(150),
    `logo` VARCHAR(255) DEFAULT '/gebat_logo.png',
    `primaryColor` VARCHAR(50) DEFAULT '#2563EB',
    `secondaryColor` VARCHAR(50) DEFAULT '#E5A110',
    `smicAmount` DECIMAL(15,2) DEFAULT 75000.00,
    `cnpsPlafond` DECIMAL(15,2) DEFAULT 1647315.00,
    `cnpsSalarial` DECIMAL(5,2) DEFAULT 6.30,
    `cnpsPatronalRetraite` DECIMAL(5,2) DEFAULT 7.70,
    `cnpsPatronalPF` DECIMAL(5,2) DEFAULT 5.75,
    `cnpsPatronalAT` DECIMAL(5,2) DEFAULT 3.00,
    `itsPatronalIvoirien` DECIMAL(5,2) DEFAULT 1.20,
    `itsPatronalExpat` DECIMAL(5,2) DEFAULT 12.00,
    `taFdfpRate` DECIMAL(5,2) DEFAULT 1.00,
    `timezone` VARCHAR(100) DEFAULT 'GMT (Abidjan)',
    `currency` VARCHAR(50) DEFAULT 'F CFA (XOF)',
    `language` VARCHAR(50) DEFAULT 'Français',
    `tenantSlug` VARCHAR(100) DEFAULT 'gebat-sa.ci',
    `saasPlan` VARCHAR(50) DEFAULT 'BUSINESS PRO',
    `maxEmployees` INT DEFAULT 250,
    `countryCode` VARCHAR(10) DEFAULT 'CI',
    `legalHoursPerMonth` DECIMAL(5,2) DEFAULT 173.33,
    `leaveAccrualRate` DECIMAL(5,2) DEFAULT 2.20,
    `apiKey` VARCHAR(255) DEFAULT 'sk_live_sirh_98a76d5e4c3b2a10',
    `modulePayroll` TINYINT DEFAULT 1,
    `moduleLeaves` TINYINT DEFAULT 1,
    `moduleEvaluations` TINYINT DEFAULT 1,
    `moduleRecruitment` TINYINT DEFAULT 1,
    `modulePortal` TINYINT DEFAULT 1,
    `moduleMobileMoney` TINYINT DEFAULT 1,
    `slogan` VARCHAR(255) DEFAULT 'Constructeur d\'Infrastructures & Capital Humain',
    `footerStampText` VARCHAR(255) DEFAULT 'Document Officiel Certifié RH',
    `smtp_host` VARCHAR(255) DEFAULT '',
    `smtp_port` INT DEFAULT 587,
    `smtp_user` VARCHAR(255) DEFAULT '',
    `smtp_pass` VARCHAR(255) DEFAULT '',
    `smtp_secure` TINYINT DEFAULT 0,
    `sender_email` VARCHAR(255) DEFAULT 'notifications@gebat-sa.com',
    `sender_name` VARCHAR(255) DEFAULT 'GEBAT SA - Notifications RH',
    `email_notif_leaves` TINYINT DEFAULT 1,
    `email_notif_advances` TINYINT DEFAULT 1,
    `email_notif_payroll` TINYINT DEFAULT 1,
    `email_notif_contracts` TINYINT DEFAULT 1,
    `email_notif_disciplinary` TINYINT DEFAULT 1,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. DEPARTMENTS
CREATE TABLE IF NOT EXISTS `departments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `code` VARCHAR(50) UNIQUE,
    `nom` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `responsable_id` INT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. POSITIONS
CREATE TABLE IF NOT EXISTS `positions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `titre` VARCHAR(255) NOT NULL,
    `departement` VARCHAR(255),
    `salaireMin` DECIMAL(15,2) DEFAULT 0.00,
    `salaireMax` DECIMAL(15,2) DEFAULT 0.00,
    `description` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. EMPLOYEES
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `matricule` VARCHAR(50) UNIQUE,
    `nom` VARCHAR(150),
    `prenoms` VARCHAR(150),
    `poste` VARCHAR(150),
    `departement` VARCHAR(150),
    `site` VARCHAR(100),
    `type` VARCHAR(50),
    `statut` VARCHAR(50) DEFAULT 'Actif',
    `dateEmbauche` VARCHAR(50),
    `salaireBase` DECIMAL(15,2) DEFAULT 0.00,
    `sexe` VARCHAR(10),
    `telephone` VARCHAR(50),
    `email` VARCHAR(150),
    `cnps` VARCHAR(100),
    `nbEnfants` INT DEFAULT 0,
    `situationMatrimoniale` VARCHAR(100) DEFAULT 'Célibataire',
    `rib` VARCHAR(100),
    `attestationTravail` TINYINT DEFAULT 0,
    `attestationStage` TINYINT DEFAULT 0,
    `attestationSalaire` TINYINT DEFAULT 0,
    `photo` TEXT,
    `username` VARCHAR(150) UNIQUE,
    `password` VARCHAR(255),
    `compteActif` TINYINT DEFAULT 1,
    `responsable` VARCHAR(150),
    `nationalite` VARCHAR(100) DEFAULT 'Ivoirienne',
    `modePaiement` VARCHAR(100) DEFAULT 'Virement Bancaire',
    `numeroMobileMoney` VARCHAR(50),
    `is_deleted` TINYINT DEFAULT 0,
    `must_change_password` TINYINT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. USERS
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `name` VARCHAR(150),
    `email` VARCHAR(150) UNIQUE,
    `password` VARCHAR(255),
    `role` VARCHAR(50) DEFAULT 'employee',
    `empId` INT NULL,
    `status` VARCHAR(50) DEFAULT 'Actif',
    `dateCreated` VARCHAR(100),
    `is_deleted` TINYINT DEFAULT 0,
    `must_change_password` TINYINT DEFAULT 0,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. LEAVES
CREATE TABLE IF NOT EXISTS `leaves` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT,
    `type` VARCHAR(100),
    `debut` VARCHAR(50),
    `fin` VARCHAR(50),
    `duree` INT,
    `statut` VARCHAR(50) DEFAULT 'En attente',
    `motif` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. LEAVE BALANCES
CREATE TABLE IF NOT EXISTS `leave_balances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT NOT NULL,
    `annee` INT NOT NULL,
    `acquis` DECIMAL(10,2) DEFAULT 26.40,
    `pris` DECIMAL(10,2) DEFAULT 0.00,
    `solde` DECIMAL(10,2) DEFAULT 26.40,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_leave_balance` (`company_id`, `empId`, `annee`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. RECRUITMENT
CREATE TABLE IF NOT EXISTS `recruitment` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `poste` VARCHAR(255),
    `departement` VARCHAR(255),
    `site` VARCHAR(100),
    `type` VARCHAR(50),
    `statut` VARCHAR(50) DEFAULT 'Ouvert',
    `competences` TEXT,
    `experience` TEXT,
    `criteres` TEXT,
    `mots_cles` TEXT,
    `candidats` INT DEFAULT 0,
    `dateCreation` VARCHAR(50),
    `dateFin` VARCHAR(50),
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. APPLICATIONS
CREATE TABLE IF NOT EXISTS `applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `offer_id` INT,
    `nom` VARCHAR(150),
    `email` VARCHAR(150),
    `telephone` VARCHAR(50),
    `cv_url` TEXT,
    `statut` VARCHAR(50) DEFAULT 'Reçu',
    `score` INT DEFAULT 0,
    `score_detail` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`offer_id`) REFERENCES `recruitment`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. ATTENDANCE
CREATE TABLE IF NOT EXISTS `attendance` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT,
    `date` VARCHAR(50),
    `heure_arrivee` VARCHAR(50),
    `heure_depart` VARCHAR(50),
    `statut` VARCHAR(50),
    `retard_minutes` INT DEFAULT 0,
    `heures_supplementaires` DECIMAL(5,2) DEFAULT 0.00,
    `note` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. ATTENDANCE SETTINGS
CREATE TABLE IF NOT EXISTS `attendance_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT UNIQUE DEFAULT 1,
    `heure_arrivee_officielle` VARCHAR(10) DEFAULT '08:00',
    `heure_depart_officiel` VARCHAR(10) DEFAULT '17:00',
    `marge_tolerance_minutes` INT DEFAULT 15,
    `taux_horaire_base` DECIMAL(15,2) DEFAULT 2500.00,
    `taux_journalier_base` DECIMAL(15,2) DEFAULT 20000.00,
    `taux_majoration_heures_sup` DECIMAL(5,2) DEFAULT 25.00,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. EVALUATIONS
CREATE TABLE IF NOT EXISTS `evaluations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT,
    `periode` VARCHAR(50),
    `competence` INT,
    `rendement` INT,
    `assiduite` INT,
    `comportement` INT,
    `note` DECIMAL(5,2),
    `statut` VARCHAR(50),
    `commentaire` TEXT,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. CONTRACTS
CREATE TABLE IF NOT EXISTS `contracts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT,
    `type` VARCHAR(50),
    `debut` VARCHAR(50),
    `fin` VARCHAR(50),
    `statut` VARCHAR(50),
    `salaireAnnuel` DECIMAL(15,2),
    `is_deleted` TINYINT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. TRAININGS
CREATE TABLE IF NOT EXISTS `trainings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `titre` VARCHAR(255),
    `departement` VARCHAR(255),
    `date` VARCHAR(50),
    `participants` INT DEFAULT 0,
    `statut` VARCHAR(50) DEFAULT 'Planifiée',
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. DOCUMENTS
CREATE TABLE IF NOT EXISTS `documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `nom` VARCHAR(255),
    `type` VARCHAR(50),
    `taille` VARCHAR(50),
    `dossier` VARCHAR(150) DEFAULT 'Ressources Humaines',
    `date` VARCHAR(50),
    `url_content` LONGTEXT,
    `is_deleted` TINYINT DEFAULT 0,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. PAYROLL HISTORY & PERIODS
CREATE TABLE IF NOT EXISTS `payroll_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `periode` VARCHAR(50),
    `dateCloture` VARCHAR(50),
    `masseNette` DECIMAL(15,2),
    `masseBrute` DECIMAL(15,2),
    `nbEmployes` INT,
    `statut` VARCHAR(50) DEFAULT 'Clôturé',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payroll_periods` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `periode` VARCHAR(50),
    `dateDebut` VARCHAR(50),
    `dateFin` VARCHAR(50),
    `masseNette` DECIMAL(15,2),
    `masseBrute` DECIMAL(15,2),
    `nbEmployes` INT,
    `statut` VARCHAR(50) DEFAULT 'Clôturé',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. PAYROLL RECORDS
CREATE TABLE IF NOT EXISTS `payroll_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `period_id` INT,
    `empId` INT NOT NULL,
    `periode` VARCHAR(50) NOT NULL,
    `base` DECIMAL(15,2) DEFAULT 0.00,
    `seniorityYears` INT DEFAULT 0,
    `primeAnc` DECIMAL(15,2) DEFAULT 0.00,
    `transport` DECIMAL(15,2) DEFAULT 30000.00,
    `logement` DECIMAL(15,2) DEFAULT 0.00,
    `risque` DECIMAL(15,2) DEFAULT 0.00,
    `sursalaire` DECIMAL(15,2) DEFAULT 0.00,
    `brutTotal` DECIMAL(15,2) DEFAULT 0.00,
    `brutImposable` DECIMAL(15,2) DEFAULT 0.00,
    `cnpsBase` DECIMAL(15,2) DEFAULT 0.00,
    `cnpsSalarial` DECIMAL(15,2) DEFAULT 0.00,
    `cnpsPatronal` DECIMAL(15,2) DEFAULT 0.00,
    `cnpsRetraitePatronal` DECIMAL(15,2) DEFAULT 0.00,
    `cnpsPFPatronal` DECIMAL(15,2) DEFAULT 0.00,
    `cnpsATPatronal` DECIMAL(15,2) DEFAULT 0.00,
    `itsNet` DECIMAL(15,2) DEFAULT 0.00,
    `itsPatronal` DECIMAL(15,2) DEFAULT 0.00,
    `taxeApprentissage` DECIMAL(15,2) DEFAULT 0.00,
    `fdfp` DECIMAL(15,2) DEFAULT 0.00,
    `totalTaxesPatronales` DECIMAL(15,2) DEFAULT 0.00,
    `avanceSurSalaire` DECIMAL(15,2) DEFAULT 0.00,
    `netAPayer` DECIMAL(15,2) DEFAULT 0.00,
    `totalEmployerCost` DECIMAL(15,2) DEFAULT 0.00,
    `statut` VARCHAR(50) DEFAULT 'Validé',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. PAYROLL ITEMS
CREATE TABLE IF NOT EXISTS `payroll_items` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `record_id` INT NOT NULL,
    `codeRubrique` INT,
    `designation` VARCHAR(255) NOT NULL,
    `base` DECIMAL(15,2) DEFAULT 0.00,
    `tauxSalarial` DECIMAL(5,2) DEFAULT 0.00,
    `gainSalarial` DECIMAL(15,2) DEFAULT 0.00,
    `retenueSalariale` DECIMAL(15,2) DEFAULT 0.00,
    `tauxPatronal` DECIMAL(5,2) DEFAULT 0.00,
    `retenuePatronale` DECIMAL(15,2) DEFAULT 0.00,
    FOREIGN KEY (`record_id`) REFERENCES `payroll_records`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `user_id` INT NULL,
    `empId` INT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) DEFAULT 'info',
    `is_read` TINYINT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21. ADVANCES
CREATE TABLE IF NOT EXISTS `advances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT,
    `montant` DECIMAL(15,2),
    `dateDemande` VARCHAR(50),
    `moisRemboursement` VARCHAR(50),
    `statut` VARCHAR(50) DEFAULT 'En attente',
    `motif` TEXT,
    `resteAPayer` DECIMAL(15,2),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 22. DISCIPLINARY ACTIONS
CREATE TABLE IF NOT EXISTS `disciplinary_actions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `empId` INT,
    `type` VARCHAR(100),
    `dateEmission` VARCHAR(50),
    `motif` TEXT,
    `reponseSalarie` TEXT,
    `dateReponse` VARCHAR(50),
    `statut` VARCHAR(100) DEFAULT 'En attente de réponse',
    `dateCloture` VARCHAR(50),
    `sanction` VARCHAR(150),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`empId`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 23. ASSESSMENTS
CREATE TABLE IF NOT EXISTS `assessments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `titre` VARCHAR(255),
    `description` TEXT,
    `duree_minutes` INT,
    `statut` VARCHAR(50) DEFAULT 'Actif',
    `date_creation` VARCHAR(50),
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assessment_questions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `assessment_id` INT,
    `texte_question` TEXT,
    `options` TEXT,
    `reponse_correcte` TEXT,
    `points` INT DEFAULT 1,
    `image_url` LONGTEXT,
    `type_question` VARCHAR(50) DEFAULT 'single',
    FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `assessment_sessions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `assessment_id` INT,
    `nom` VARCHAR(150),
    `prenoms` VARCHAR(150),
    `email` VARCHAR(150),
    `telephone` VARCHAR(50),
    `score` INT,
    `total_points` INT,
    `date_passage` VARCHAR(50),
    `temps_ecoule` INT,
    `statut` VARCHAR(50) DEFAULT 'Terminé',
    FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 24. AUDIT LOGS
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT DEFAULT 1,
    `user_id` INT NULL,
    `user_email` VARCHAR(150),
    `user_name` VARCHAR(150),
    `user_role` VARCHAR(50),
    `action` VARCHAR(100),
    `module` VARCHAR(100),
    `details` TEXT,
    `old_value` TEXT,
    `new_value` TEXT,
    `ip_address` VARCHAR(50),
    `user_agent` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEEDING INITIAL : GEBAT SA CORPORATE PROFILE & DATA
-- ============================================================

INSERT INTO `companies` (`id`, `name`, `rc`, `cc`, `cnps_employer`, `address`, `phone`, `email`, `logo`, `primaryColor`, `secondaryColor`, `tenantSlug`, `saasPlan`, `maxEmployees`) 
VALUES (1, 'La Générale du Bâtiment et des Travaux Publics (GEBAT SA)', 'CI-ABJ-2008-B-5234', '0815234 G', '235890', 'Cocody II Plateaux 7e Tranche, Rue L139, 06 BP 235 Abidjan 06', '+225 27 22 52 34 23', 'gebat@gebat-sa.com', '/gebat_logo.png', '#2563EB', '#E5A110', 'gebat-sa.ci', 'BUSINESS PRO', 250)
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `address` = VALUES(`address`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `settings` (`id`, `company_id`, `companyName`, `rc`, `cc`, `cnps_employer`, `address`, `phone`, `email`, `logo`, `primaryColor`, `secondaryColor`, `slogan`) 
VALUES (1, 1, 'La Générale du Bâtiment et des Travaux Publics (GEBAT SA)', 'CI-ABJ-2008-B-5234', '0815234 G', '235890', 'Cocody II Plateaux 7e Tranche, Rue L139, 06 BP 235 Abidjan 06', '+225 27 22 52 34 23', 'gebat@gebat-sa.com', '/gebat_logo.png', '#2563EB', '#E5A110', 'Constructeur d\'Infrastructures & Capital Humain')
ON DUPLICATE KEY UPDATE `companyName` = VALUES(`companyName`), `address` = VALUES(`address`), `phone` = VALUES(`phone`), `email` = VALUES(`email`);

INSERT INTO `departments` (`company_id`, `code`, `nom`, `description`) VALUES
(1, 'DIR-01', 'Direction Générale', 'Gouvernance, pilotage stratégique et relations institutionnelles GEBAT'),
(1, 'DIR-02', 'Direction Administrative et des Ressources Humaines', 'Capital humain, recrutement, paie, contrats et administration du personnel'),
(1, 'DIR-03', 'Direction Technique', 'Bureau d\'études intégré, ingénierie, conception et suivi de travaux BTP'),
(1, 'DIR-04', 'Direction des Achats', 'Sourcing, approvisionnement en matériaux et gestion fournisseurs'),
(1, 'DIR-05', 'Direction de la Logistique', 'Parc d\'engins, gestion du carburant et maintenance du matériel'),
(1, 'DIR-06', 'Direction Contrôle QHSE', 'Qualité, Hygiène, Sécurité et respect des normes environnementales'),
(1, 'DIR-07', 'Direction Comptabilité et Facturation', 'Comptabilité générale, facturation travaux, décomptes et fiscalité')
ON DUPLICATE KEY UPDATE `nom` = VALUES(`nom`);

INSERT INTO `users` (`company_id`, `name`, `email`, `password`, `role`, `status`, `dateCreated`)
VALUES (1, 'Administrateur GEBAT RH', 'admin@gebat-sa.com', 'admin123', 'admin', 'Actif', NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
