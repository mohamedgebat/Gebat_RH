/**
 * Outils de calcul de la Paie aux normes de la République de Côte d'Ivoire (DGI & CNPS 2024)
 */

/**
 * Calcule l'ancienneté en années à partir de la date d'embauche.
 * @param {string} dateEmbauche - Date au format 'YYYY-MM-DD'
 * @returns {number} Nombre d'années complètes d'ancienneté
 */
export const calculateSeniority = (dateEmbauche) => {
  if (!dateEmbauche) return 0;
  const embauche = new Date(dateEmbauche);
  const now = new Date();
  
  // Validation de la date
  if (isNaN(embauche.getTime())) return 0;

  let diffYears = now.getFullYear() - embauche.getFullYear();
  const diffMonths = now.getMonth() - embauche.getMonth();
  if (diffMonths < 0 || (diffMonths === 0 && now.getDate() < embauche.getDate())) {
    diffYears--;
  }
  return Math.max(0, diffYears);
};

/**
 * Calcule le nombre de parts pour le quotient familial Ivoirien (limité à 5 parts max).
 * @param {string} situationMatrimoniale - 'Célibataire', 'Marié', 'Divorcé', 'Veuf'
 * @param {number} nbEnfants - Nombre d'enfants à charge
 * @returns {number} Nombre de parts
 */
export const calculateParts = (situationMatrimoniale, nbEnfants) => {
  const enfants = Math.max(0, parseInt(nbEnfants) || 0);
  const situation = situationMatrimoniale || 'Célibataire';
  let parts = 1;

  if (situation === 'Marié') {
    parts = 2 + (enfants * 0.5);
  } else if (situation === 'Veuf') {
    if (enfants > 0) {
      parts = 2 + (enfants * 0.5); // Équivalent aux parts d'un couple marié s'il y a des enfants
    } else {
      parts = 1;
    }
  } else { // Célibataire ou Divorcé
    if (enfants > 0) {
      // 1.5 parts pour le parent célibataire + 0.5 part par enfant à charge (donc 2 parts pour 1 enfant)
      parts = 1.5 + (enfants * 0.5);
    } else {
      parts = 1;
    }
  }
  
  // Limite légale en Côte d'Ivoire de 5 parts max
  return Math.min(5, parts);
};

/**
 * Calcule la Réduction d'Impôt pour Charges de Famille (RICF).
 * @param {number} parts - Nombre de parts
 * @returns {number} Montant de la réduction en FCFA
 */
export const calculateRICF = (parts) => {
  // En Côte d'Ivoire, depuis 2024, la RICF est de 5 500 FCFA par demi-part au-delà de la 1ère part.
  // Ce qui donne 11 000 FCFA par part entière au-delà de 1.
  return Math.max(0, Math.round((parts - 1) * 11000));
};

/**
 * Calcule l'impôt ITS (Impôt unique sur les Traitements et Salaires) brut progressif par tranches mensuelles.
 * @param {number} salaireBrutImposable - Assiette de l'impôt
 * @returns {number} Impôt brut en FCFA
 */
export const calculateITSBrut = (salaireBrutImposable) => {
  const base = Math.max(0, Math.round(salaireBrutImposable));
  let tax = 0;

  if (base <= 75000) {
    tax = 0;
  } else if (base <= 240000) {
    tax = (base - 75000) * 0.16;
  } else if (base <= 800000) {
    tax = (240000 - 75000) * 0.16 + (base - 240000) * 0.21;
  } else if (base <= 2400000) {
    tax = (240000 - 75000) * 0.16 + (800000 - 240000) * 0.21 + (base - 800000) * 0.24;
  } else if (base <= 8000000) {
    tax = (240000 - 75000) * 0.16 + (800000 - 240000) * 0.21 + (2400000 - 800000) * 0.24 + (base - 2400000) * 0.28;
  } else {
    tax = (240000 - 75000) * 0.16 + (800000 - 240000) * 0.21 + (2400000 - 800000) * 0.24 + (8000000 - 2400000) * 0.28 + (base - 8000000) * 0.32;
  }

  return Math.round(tax);
};

/**
 * Calcule tous les éléments de la fiche de paie d'un employé.
 * @param {object} emp - Employé avec ses informations de salaire et familiales
 * @returns {object} Éléments détaillés de paie
 */
/**
 * Calcule tous les éléments de la fiche de paie d'un employé.
 * @param {object} emp - Employé avec ses informations de salaire et familiales
 * @param {number} advanceDeduction - Montant des avances ou retenues à déduire ce mois
 * @returns {object} Éléments détaillés de paie
 */
/**
 * Calcule tous les éléments de la fiche de paie d'un employé selon le Moteur de Rubriques Sage 100c.
 * @param {object} emp - Employé avec ses informations de salaire et familiales
 * @param {number} advanceDeduction - Montant des avances ou retenues à déduire ce mois
 * @param {object} variables - Éléments variables du mois (heures supp, primes, absences)
 * @returns {object} Éléments détaillés de paie avec tableau de rubriques Sage
 */
export const calculateDetailedPaie = (emp, advanceDeduction = 0, variables = {}, settings = null, rubriquesConfig = null) => {
  const base = emp.salaireBase || 0;
  
  // Custom or Default settings extract
  const cfg = settings || {};
  const transportCap = cfg.transport_exonere !== undefined && cfg.transport_exonere !== null ? parseFloat(cfg.transport_exonere) : 30000;
  const logementPct = cfg.logement_pct !== undefined && cfg.logement_pct !== null ? parseFloat(cfg.logement_pct) : 15;
  const senThreshold = cfg.seniority_threshold_years !== undefined && cfg.seniority_threshold_years !== null ? parseInt(cfg.seniority_threshold_years) : 2;
  const senPctPerYear = cfg.seniority_pct_per_year !== undefined && cfg.seniority_pct_per_year !== null ? parseFloat(cfg.seniority_pct_per_year) : 1.0;
  
  const cmuSal = cfg.cmu_salarial !== undefined && cfg.cmu_salarial !== null ? parseFloat(cfg.cmu_salarial) : 1000;
  const cmuPat = cfg.cmu_patronal !== undefined && cfg.cmu_patronal !== null ? parseFloat(cfg.cmu_patronal) : 1000;
  
  const cnpsSalRate = cfg.cnps_sal_rate !== undefined && cfg.cnps_sal_rate !== null ? parseFloat(cfg.cnps_sal_rate) / 100 : 0.063;
  const cnpsSalCap = cfg.cnps_sal_cap !== undefined && cfg.cnps_sal_cap !== null ? parseFloat(cfg.cnps_sal_cap) : 3375000;
  
  const cnpsPatRetraiteRate = cfg.cnps_pat_retraite_rate !== undefined && cfg.cnps_pat_retraite_rate !== null ? parseFloat(cfg.cnps_pat_retraite_rate) / 100 : 0.077;
  const cnpsPatPfRate = cfg.cnps_pat_pf_rate !== undefined && cfg.cnps_pat_pf_rate !== null ? parseFloat(cfg.cnps_pat_pf_rate) / 100 : 0.0575;
  const cnpsPatAmRate = cfg.cnps_pat_am_rate !== undefined && cfg.cnps_pat_am_rate !== null ? parseFloat(cfg.cnps_pat_am_rate) / 100 : 0.0075;
  const cnpsPatAtRate = cfg.cnps_pat_at_rate !== undefined && cfg.cnps_pat_at_rate !== null ? parseFloat(cfg.cnps_pat_at_rate) / 100 : 0.03;
  const cnpsPatCapPf = cfg.cnps_pat_cap_pf !== undefined && cfg.cnps_pat_cap_pf !== null ? parseFloat(cfg.cnps_pat_cap_pf) : 70000;
  
  const isExpat = emp.nationalite === 'Expatrié';
  const itsPatRateVal = isExpat 
    ? (cfg.its_patronal_expat_rate !== undefined ? parseFloat(cfg.its_patronal_expat_rate) : 12.0)
    : (cfg.its_patronal_rate !== undefined ? parseFloat(cfg.its_patronal_rate) : 1.2);
  const itsPatronalRate = itsPatRateVal / 100;
  const tauxItsPatronal = itsPatronalRate;
  const taRate = (cfg.ta_rate !== undefined && cfg.ta_rate !== null ? parseFloat(cfg.ta_rate) : 0.4) / 100;
  const fdfpRate = (cfg.fdfp_rate !== undefined && cfg.fdfp_rate !== null ? parseFloat(cfg.fdfp_rate) : 0.6) / 100;

  // Rubriques helper map
  const rubMap = {};
  if (Array.isArray(rubriquesConfig)) {
    rubriquesConfig.forEach(r => { rubMap[r.code] = r; });
  } else if (rubriquesConfig && typeof rubriquesConfig === 'object') {
    Object.assign(rubMap, rubriquesConfig);
  }

  const getRubMeta = (code, defaultDesig) => {
    const item = rubMap[code];
    return {
      enabled: item ? (item.enabled !== undefined ? !!item.enabled : item.is_enabled !== 0) : true,
      designation: (item && item.designation) ? item.designation : defaultDesig
    };
  };

  // Éléments variables mensuels
  const h15 = parseFloat(variables.h15) || 0;
  const h50 = parseFloat(variables.h50) || 0;
  const h75 = parseFloat(variables.h75) || 0;
  const h100 = parseFloat(variables.h100) || 0;
  const primeBtp = parseFloat(variables.primeBtp || variables.prime_btp) || 0;
  const joursAbsence = parseFloat(variables.joursAbsence || variables.jours_absence) || 0;

  // 1. Déduction Absences non payées
  const retenueAbsence = joursAbsence > 0 ? Math.round((base / 30) * joursAbsence) : 0;
  const baseApresAbsence = Math.max(0, base - retenueAbsence);

  // 2. Heures Supplémentaires
  const overtimeDetails = calculateOvertimePay(base, h15, h50, h75, h100);

  // 3. Prime d'Ancienneté (CCI Côte d'Ivoire : configurable, ex: 1% par an après 2 ans)
  const seniorityYears = calculateSeniority(emp.dateEmbauche);
  const primeAnc = seniorityYears >= senThreshold ? Math.round(base * (seniorityYears * (senPctPerYear / 100))) : 0;
  
  // 4. Indemnités et Primes
  const transport = transportCap; // Indemnité de transport obligatoire / paramétrable
  const logement = Math.round(base * (logementPct / 100)); // Indemnité de logement (ex 15%)
  const risque = (emp.departement === 'Sécurité' || emp.departement === 'BTP' || cfg.sector_activity === 'BTP') ? 25000 : 0;
  
  // 5. Salaire Brut Total
  const brutTotal = baseApresAbsence + overtimeDetails.totalPay + primeAnc + primeBtp + transport + logement + risque;
  
  // Exemption Transport en Côte d'Ivoire (non imposable & non cotisable jusqu'au plafond)
  const transportExempte = Math.min(transport, transportCap);
  
  // 6. Assiette Fiscale et Sociale (Salaire Brut Imposable)
  const brutImposable = Math.max(0, brutTotal - transportExempte);
  
  // 7. CNPS Salariale
  const cnpsBase = Math.min(brutImposable, cnpsSalCap);
  const cnpsSalarial = Math.round(cnpsBase * cnpsSalRate);
  const cmuSalarial = cmuSal;
  const cmuPatronal = cmuPat;
  
  // 8. CNPS Patronale
  const cnpsPatronalRetraite = cnpsBase * cnpsPatRetraiteRate;
  const cnpsPatronalPF = Math.min(brutImposable, cnpsPatCapPf) * cnpsPatPfRate;
  const cnpsPatronalAM = Math.min(brutImposable, cnpsPatCapPf) * cnpsPatAmRate;
  const cnpsPatronalAT = Math.min(brutImposable, cnpsPatCapPf) * cnpsPatAtRate;
  const cnpsPatronal = Math.round(cnpsPatronalRetraite + cnpsPatronalPF + cnpsPatronalAM + cnpsPatronalAT);
  
  // 9. Taxes Patronales Directes (DGI Côte d'Ivoire)
  const itsPatronal = Math.round(brutImposable * itsPatronalRate);
  const taxeApprentissage = Math.round(brutImposable * taRate);
  const fdfp = Math.round(brutImposable * fdfpRate);
  const totalTaxesPatronales = itsPatronal + taxeApprentissage + fdfp;
  
  // 10. Impôts sur Salaires (ITS Salarial 2024)
  const itsBrut = calculateITSBrut(brutImposable);
  const parts = calculateParts(emp.situationMatrimoniale, emp.nbEnfants);
  const ricf = calculateRICF(parts);
  const itsNet = Math.max(0, itsBrut - ricf);
  
  // 11. Retenues Avances & Prêts
  const avanceSurSalaire = Math.max(0, Math.round(advanceDeduction));

  // 12. Net à Payer
  const totalRetenuesSalariales = cnpsSalarial + cmuSalarial + itsNet + avanceSurSalaire;
  const netAPayer = Math.max(0, brutTotal - totalRetenuesSalariales);

  // --- CONSTRUCTION DE LA GRILLE DES RUBRIQUES DU PLAN DE PAIE SAGE 100c ---
  const rubriques = [];

  const mR100 = getRubMeta('R100', 'SALAIRE DE BASE');
  if (mR100.enabled) rubriques.push({ code: 'R100', designation: mR100.designation, nombre: 173.33, base, tauxSalarial: null, gain: base, retenue: null, tauxPatronal: null, patronal: null });

  const mR105 = getRubMeta('R105', `ABSENCES NON PAYÉES (${joursAbsence} j)`);
  if (retenueAbsence > 0 && mR105.enabled) {
    rubriques.push({ code: 'R105', designation: mR105.designation, nombre: joursAbsence, base, tauxSalarial: null, gain: null, retenue: retenueAbsence, tauxPatronal: null, patronal: null });
  }

  if (overtimeDetails.totalPay > 0) {
    const mR141 = getRubMeta('R141', 'HEURES SUPP. 15%');
    const mR142 = getRubMeta('R142', 'HEURES SUPP. 50%');
    const mR143 = getRubMeta('R143', 'HEURES SUPP. 75%');
    const mR144 = getRubMeta('R144', 'HEURES SUPP. 100%');
    if (h15 > 0 && mR141.enabled) rubriques.push({ code: 'R141', designation: mR141.designation, nombre: h15, base: overtimeDetails.tauxHoraire, tauxSalarial: 115, gain: overtimeDetails.pay15, retenue: null, tauxPatronal: null, patronal: null });
    if (h50 > 0 && mR142.enabled) rubriques.push({ code: 'R142', designation: mR142.designation, nombre: h50, base: overtimeDetails.tauxHoraire, tauxSalarial: 150, gain: overtimeDetails.pay50, retenue: null, tauxPatronal: null, patronal: null });
    if (h75 > 0 && mR143.enabled) rubriques.push({ code: 'R143', designation: mR143.designation, nombre: h75, base: overtimeDetails.tauxHoraire, tauxSalarial: 175, gain: overtimeDetails.pay75, retenue: null, tauxPatronal: null, patronal: null });
    if (h100 > 0 && mR144.enabled) rubriques.push({ code: 'R144', designation: mR144.designation, nombre: h100, base: overtimeDetails.tauxHoraire, tauxSalarial: 200, gain: overtimeDetails.pay100, retenue: null, tauxPatronal: null, patronal: null });
  }

  const mR120 = getRubMeta('R120', "PRIME D'ANCIENNETÉ");
  if (primeAnc > 0 && mR120.enabled) {
    rubriques.push({ code: 'R120', designation: mR120.designation, nombre: seniorityYears, base, tauxSalarial: seniorityYears * senPctPerYear, gain: primeAnc, retenue: null, tauxPatronal: null, patronal: null });
  }

  const mR130 = getRubMeta('R130', 'PRIMES CHANTIER BTP / PANIER');
  if (primeBtp > 0 && mR130.enabled) {
    rubriques.push({ code: 'R130', designation: mR130.designation, nombre: null, base: primeBtp, tauxSalarial: null, gain: primeBtp, retenue: null, tauxPatronal: null, patronal: null });
  }

  const mR210 = getRubMeta('R210', `INDEMNITÉ DE LOGEMENT (${logementPct}%)`);
  if (logement > 0 && mR210.enabled) {
    rubriques.push({ code: 'R210', designation: mR210.designation, nombre: null, base, tauxSalarial: logementPct, gain: logement, retenue: null, tauxPatronal: null, patronal: null });
  }

  const mR135 = getRubMeta('R135', 'INDEMNITÉ DE RISQUE BTP');
  if (risque > 0 && mR135.enabled) {
    rubriques.push({ code: 'R135', designation: mR135.designation, nombre: null, base: risque, tauxSalarial: null, gain: risque, retenue: null, tauxPatronal: null, patronal: null });
  }

  const mR200 = getRubMeta('R200', 'INDEMNITÉ DE TRANSPORT (EXONÉRÉE)');
  if (mR200.enabled) {
    rubriques.push({ code: 'R200', designation: mR200.designation, nombre: null, base: transport, tauxSalarial: null, gain: transport, retenue: null, tauxPatronal: null, patronal: null });
  }

  // Totaux Bruts
  rubriques.push({ code: 'R300', designation: 'TOTAL SALAIRE BRUT', nombre: null, base: brutTotal, tauxSalarial: null, gain: brutTotal, retenue: null, tauxPatronal: null, patronal: null, isTotal: true });

  // Retenues Fiscales & Sociales Salariales
  const mR414 = getRubMeta('R414', 'IMPÔT SALARIAL (ITS NET DGI)');
  if (mR414.enabled) rubriques.push({ code: 'R414', designation: mR414.designation, nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: itsNet, tauxPatronal: null, patronal: null });
  
  const mR415 = getRubMeta('R415', 'CMU (COUVERTURE MALADIE UNIVERSELLE)');
  if (mR415.enabled) rubriques.push({ code: 'R415', designation: mR415.designation, nombre: null, base: cmuSal, tauxSalarial: null, gain: null, retenue: cmuSalarial, tauxPatronal: null, patronal: cmuPatronal });
  
  const mR452 = getRubMeta('R452', 'CNPS RETRAITE SALARIÉ');
  if (mR452.enabled) rubriques.push({ code: 'R452', designation: mR452.designation, nombre: null, base: cnpsBase, tauxSalarial: cnpsSalRate * 100, gain: null, retenue: cnpsSalarial, tauxPatronal: null, patronal: null });

  // Cotisations Patronales
  const mR470 = getRubMeta('R470', 'CNPS RETRAITE PATRONALE');
  if (mR470.enabled) rubriques.push({ code: 'R470', designation: mR470.designation, nombre: null, base: cnpsBase, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: cnpsPatRetraiteRate * 100, patronal: Math.round(cnpsPatronalRetraite) });
  
  const mR480 = getRubMeta('R480', 'CNPS PRESTATIONS FAMILIALES (PF)');
  if (mR480.enabled) rubriques.push({ code: 'R480', designation: mR480.designation, nombre: null, base: Math.min(brutImposable, cnpsPatCapPf), tauxSalarial: null, gain: null, retenue: null, tauxPatronal: cnpsPatPfRate * 100, patronal: Math.round(cnpsPatronalPF) });
  
  const mR481 = getRubMeta('R481', 'CNPS ASSURANCE MATERNITÉ');
  if (mR481.enabled) rubriques.push({ code: 'R481', designation: mR481.designation, nombre: null, base: Math.min(brutImposable, cnpsPatCapPf), tauxSalarial: null, gain: null, retenue: null, tauxPatronal: cnpsPatAmRate * 100, patronal: Math.round(cnpsPatronalAM) });
  
  const mR490 = getRubMeta('R490', 'CNPS ACCIDENT DU TRAVAIL (AT)');
  if (mR490.enabled) rubriques.push({ code: 'R490', designation: mR490.designation, nombre: null, base: Math.min(brutImposable, cnpsPatCapPf), tauxSalarial: null, gain: null, retenue: null, tauxPatronal: cnpsPatAtRate * 100, patronal: Math.round(cnpsPatronalAT) });
  
  const mR500 = getRubMeta('R500', 'ITS PATRONAL DGI');
  if (mR500.enabled) rubriques.push({ code: 'R500', designation: mR500.designation, nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: itsPatronalRate * 100, patronal: itsPatronal });
  
  const mR520 = getRubMeta('R520', "TAXE D'APPRENTISSAGE (TA DGI)");
  if (mR520.enabled) rubriques.push({ code: 'R520', designation: mR520.designation, nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: taRate * 100, patronal: taxeApprentissage });
  
  const mR530 = getRubMeta('R530', 'TAXE FORMATION CONTINUE (FDFP)');
  if (mR530.enabled) rubriques.push({ code: 'R530', designation: mR530.designation, nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: fdfpRate * 100, patronal: fdfp });

  const mR750 = getRubMeta('R750', 'RETENUE AVANCE SUR SALAIRE');
  if (avanceSurSalaire > 0 && mR750.enabled) {
    rubriques.push({ code: 'R750', designation: mR750.designation, nombre: null, base: avanceSurSalaire, tauxSalarial: null, gain: null, retenue: avanceSurSalaire, tauxPatronal: null, patronal: null });
  }

  return {
    base,
    seniorityYears,
    primeAnc,
    primeBtp,
    joursAbsence,
    retenueAbsence,
    overtimeDetails,
    transport,
    transportExempte,
    logement,
    risque,
    brutTotal,
    brutImposable,
    cnpsBase,
    cnpsSalarial,
    cmuSalarial,
    cmuPatronal,
    cnpsPatronal,
    cnpsPatronalDetails: {
      retraite: Math.round(cnpsPatronalRetraite),
      prestationsFamiliales: Math.round(cnpsPatronalPF),
      assuranceMaternite: Math.round(cnpsPatronalAM),
      accidentTravail: Math.round(cnpsPatronalAT)
    },
    taxesPatronalesDetails: {
      itsPatronal,
      tauxItsPatronal,
      taxeApprentissage,
      fdfp,
      totalTaxesPatronales
    },
    parts,
    itsBrut,
    ricf,
    itsNet,
    avanceSurSalaire,
    totalRetenuesSalariales,
    totalChargesPatronales: cnpsPatronal + totalTaxesPatronales + cmuPatronal,
    netAPayer,
    rubriques
  };
};

/**
 * Calcule la Gratification (13ème mois) selon la convention collective ivoirienne (75% du salaire de base).
 */
export const calculateGratification = (salaireBase, tauxPercentage = 75) => {
  return Math.round((salaireBase || 0) * (tauxPercentage / 100));
};

/**
 * Calcule l'Indemnité de Fin de CDD / Précarité (3% de la masse brute totale).
 */
export const calculateIndemnitePrecariteCDD = (totalSalairesBrutsAccumules) => {
  return Math.round((totalSalairesBrutsAccumules || 0) * 0.03);
};

/**
 * Calcule les Heures Supplémentaires selon le Code du Travail Ivoirien (Base 173.33h/mois).
 * - Taux 15% : 41e à 46e heure hebdomadaire
 * - Taux 50% : 47e à 55e heure hebdomadaire
 * - Taux 75% : Heures de nuit (21h-5h) ou Dimanches & jours fériés de jour
 * - Taux 100% : Heures de nuit les Dimanches & jours fériés
 */
export const calculateOvertimePay = (salaireBase, h15 = 0, h50 = 0, h75 = 0, h100 = 0) => {
  const tauxHoraire = (salaireBase || 0) / 173.33;
  const pay15 = h15 * tauxHoraire * 1.15;
  const pay50 = h50 * tauxHoraire * 1.50;
  const pay75 = h75 * tauxHoraire * 1.75;
  const pay100 = h100 * tauxHoraire * 2.00;

  const totalPay = Math.round(pay15 + pay50 + pay75 + pay100);
  return {
    tauxHoraire: Math.round(tauxHoraire),
    pay15: Math.round(pay15),
    pay50: Math.round(pay50),
    pay75: Math.round(pay75),
    pay100: Math.round(pay100),
    totalPay
  };
};

/**
 * Calcule le droit annuel aux congés payés selon le Code du Travail Ivoirien (Art. 25.1).
 * - Base légale : 2.2 jours ouvrables par mois effectif (26.4 jours/an)
 * - Majoration ancienneté : +1j à 15ans, +2j à 20ans, +3j à 25ans, +6j à 30ans
 * - Majoration mère de famille : +2j par enfant de moins de 14 ans
 */
export const calculateLegalLeaveDays = (seniorityYears = 0, sexe = 'M', nbEnfantsMoins14 = 0) => {
  let joursBase = 26.4; // 2.2 jours * 12 mois

  // Majoration Ancienneté (Code du Travail CI)
  let bonusAnciennete = 0;
  if (seniorityYears >= 30) bonusAnciennete = 6;
  else if (seniorityYears >= 25) bonusAnciennete = 3;
  else if (seniorityYears >= 20) bonusAnciennete = 2;
  else if (seniorityYears >= 15) bonusAnciennete = 1;

  // Majoration Mère de famille
  let bonusMaternite = 0;
  if (sexe === 'F' && nbEnfantsMoins14 > 0) {
    bonusMaternite = nbEnfantsMoins14 * 2;
  }

  const totalJoursOuvrables = Math.round((joursBase + bonusAnciennete + bonusMaternite) * 10) / 10;
  return {
    joursBase,
    bonusAnciennete,
    bonusMaternite,
    totalJoursOuvrables
  };
};

/**
 * Calcule l'indemnité légale de licenciement selon la Convention Collective Interprofessionnelle de Côte d'Ivoire (CCI CI).
 * - 1 à 5 ans : 30% du salaire moyen mensuel par année
 * - 6 à 10 ans : 35% du salaire moyen mensuel par année
 * - Plus de 10 ans : 40% du salaire moyen mensuel par année
 */
export const calculateSeverancePay = (salaireMoyenMensuel, seniorityYears) => {
  if (seniorityYears < 1 || !salaireMoyenMensuel) return 0;
  
  let totalIndemnite = 0;
  
  if (seniorityYears <= 5) {
    totalIndemnite = (salaireMoyenMensuel * 0.30) * seniorityYears;
  } else if (seniorityYears <= 10) {
    const tranche1 = (salaireMoyenMensuel * 0.30) * 5;
    const tranche2 = (salaireMoyenMensuel * 0.35) * (seniorityYears - 5);
    totalIndemnite = tranche1 + tranche2;
  } else {
    const tranche1 = (salaireMoyenMensuel * 0.30) * 5;
    const tranche2 = (salaireMoyenMensuel * 0.35) * 5;
    const tranche3 = (salaireMoyenMensuel * 0.40) * (seniorityYears - 10);
    totalIndemnite = tranche1 + tranche2 + tranche3;
  }

  return Math.round(totalIndemnite);
};

