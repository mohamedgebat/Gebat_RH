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
export const calculateDetailedPaie = (emp, advanceDeduction = 0, variables = {}) => {
  const base = emp.salaireBase || 0;
  
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

  // 3. Prime d'Ancienneté (CCI Côte d'Ivoire : 1% par an après 2 ans)
  const seniorityYears = calculateSeniority(emp.dateEmbauche);
  const primeAnc = seniorityYears >= 2 ? Math.round(base * (seniorityYears / 100)) : 0;
  
  // 4. Indemnités et Primes
  const transport = 30000; // Indemnité de transport obligatoire (Abidjan)
  const logement = Math.round(base * 0.15); // Indemnité de logement standard (15%)
  const risque = (emp.departement === 'Sécurité' || emp.departement === 'BTP') ? 25000 : 0;
  
  // 5. Salaire Brut Total
  const brutTotal = baseApresAbsence + overtimeDetails.totalPay + primeAnc + primeBtp + transport + logement + risque;
  
  // Exemption Transport en Côte d'Ivoire (non imposable & non cotisable jusqu'à 30 000 FCFA)
  const transportExempte = Math.min(transport, 30000);
  
  // 6. Assiette Fiscale et Sociale (Salaire Brut Imposable)
  const brutImposable = Math.max(0, brutTotal - transportExempte);
  
  // 7. CNPS Salariale (6.3% Retraite, Plafond mensuel de 3 375 000 FCFA depuis 2023)
  const cnpsBase = Math.min(brutImposable, 3375000);
  const cnpsSalarial = Math.round(cnpsBase * 0.063);
  const cmuSalarial = 1000; // CMU Salariale forfaitaire 1 000 FCFA
  const cmuPatronal = 1000; // CMU Patronale forfaitaire 1 000 FCFA
  
  // 8. CNPS Patronale
  // - Retraite Régime Général : 7.7% (plafond 3 375 000 FCFA)
  // - Prestations Familiales : 5.75% (plafond 70 000 FCFA)
  // - Assurance Maternité : 0.75% (plafond 70 000 FCFA)
  // - Accidents du Travail : 3% (plafond 70 000 FCFA, taux standard BTP)
  const cnpsPatronalRetraite = cnpsBase * 0.077;
  const cnpsPatronalPF = Math.min(brutImposable, 70000) * 0.0575;
  const cnpsPatronalAM = Math.min(brutImposable, 70000) * 0.0075;
  const cnpsPatronalAT = Math.min(brutImposable, 70000) * 0.03;
  const cnpsPatronal = Math.round(cnpsPatronalRetraite + cnpsPatronalPF + cnpsPatronalAM + cnpsPatronalAT);
  
  // 9. Taxes Patronales Directes (DGI Côte d'Ivoire)
  const isExpat = emp.nationalite === 'Expatrié';
  const tauxItsPatronal = isExpat ? 0.12 : 0.012;
  const itsPatronal = Math.round(brutImposable * tauxItsPatronal);
  const taxeApprentissage = Math.round(brutImposable * 0.004); // TA 0.4%
  const fdfp = Math.round(brutImposable * 0.006); // FDFP 0.6%
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

  rubriques.push({ code: 'R100', designation: 'SALAIRE DE BASE', nombre: 173.33, base, tauxSalarial: null, gain: base, retenue: null, tauxPatronal: null, patronal: null });

  if (retenueAbsence > 0) {
    rubriques.push({ code: 'R105', designation: `ABSENCES NON PAYÉES (${joursAbsence} j)`, nombre: joursAbsence, base, tauxSalarial: null, gain: null, retenue: retenueAbsence, tauxPatronal: null, patronal: null });
  }

  if (overtimeDetails.totalPay > 0) {
    if (h15 > 0) rubriques.push({ code: 'R141', designation: 'HEURES SUPP. 15%', nombre: h15, base: overtimeDetails.tauxHoraire, tauxSalarial: 115, gain: overtimeDetails.pay15, retenue: null, tauxPatronal: null, patronal: null });
    if (h50 > 0) rubriques.push({ code: 'R142', designation: 'HEURES SUPP. 50%', nombre: h50, base: overtimeDetails.tauxHoraire, tauxSalarial: 150, gain: overtimeDetails.pay50, retenue: null, tauxPatronal: null, patronal: null });
    if (h75 > 0) rubriques.push({ code: 'R143', designation: 'HEURES SUPP. 75%', nombre: h75, base: overtimeDetails.tauxHoraire, tauxSalarial: 175, gain: overtimeDetails.pay75, retenue: null, tauxPatronal: null, patronal: null });
    if (h100 > 0) rubriques.push({ code: 'R144', designation: 'HEURES SUPP. 100%', nombre: h100, base: overtimeDetails.tauxHoraire, tauxSalarial: 200, gain: overtimeDetails.pay100, retenue: null, tauxPatronal: null, patronal: null });
  }

  if (primeAnc > 0) {
    rubriques.push({ code: 'R120', designation: "PRIME D'ANCIENNETÉ", nombre: seniorityYears, base, tauxSalarial: seniorityYears, gain: primeAnc, retenue: null, tauxPatronal: null, patronal: null });
  }

  if (primeBtp > 0) {
    rubriques.push({ code: 'R130', designation: 'PRIMES CHANTIER BTP / PANIER', nombre: null, base: primeBtp, tauxSalarial: null, gain: primeBtp, retenue: null, tauxPatronal: null, patronal: null });
  }

  if (logement > 0) {
    rubriques.push({ code: 'R210', designation: 'INDEMNITÉ DE LOGEMENT (15%)', nombre: null, base, tauxSalarial: 15, gain: logement, retenue: null, tauxPatronal: null, patronal: null });
  }

  if (risque > 0) {
    rubriques.push({ code: 'R135', designation: 'INDEMNITÉ DE RISQUE BTP', nombre: null, base: risque, tauxSalarial: null, gain: risque, retenue: null, tauxPatronal: null, patronal: null });
  }

  rubriques.push({ code: 'R200', designation: 'INDEMNITÉ DE TRANSPORT (EXONÉRÉE)', nombre: null, base: transport, tauxSalarial: null, gain: transport, retenue: null, tauxPatronal: null, patronal: null });

  // Totaux Bruts
  rubriques.push({ code: 'R300', designation: 'TOTAL SALAIRE BRUT', nombre: null, base: brutTotal, tauxSalarial: null, gain: brutTotal, retenue: null, tauxPatronal: null, patronal: null, isTotal: true });

  // Retenues Fiscales & Sociales Salariales
  rubriques.push({ code: 'R414', designation: 'IMPÔT SALARIAL (ITS NET DGI)', nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: itsNet, tauxPatronal: null, patronal: null });
  rubriques.push({ code: 'R415', designation: 'CMU (COUVERTURE MALADIE UNIVERSELLE)', nombre: null, base: 1000, tauxSalarial: null, gain: null, retenue: cmuSalarial, tauxPatronal: null, patronal: cmuPatronal });
  rubriques.push({ code: 'R452', designation: 'CNPS RETRAITE SALARIÉ', nombre: null, base: cnpsBase, tauxSalarial: 6.30, gain: null, retenue: cnpsSalarial, tauxPatronal: null, patronal: null });

  // Cotisations Patronales
  rubriques.push({ code: 'R470', designation: 'CNPS RETRAITE PATRONALE', nombre: null, base: cnpsBase, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: 7.70, patronal: Math.round(cnpsPatronalRetraite) });
  rubriques.push({ code: 'R480', designation: 'CNPS PRESTATIONS FAMILIALES (PF)', nombre: null, base: Math.min(brutImposable, 70000), tauxSalarial: null, gain: null, retenue: null, tauxPatronal: 5.75, patronal: Math.round(cnpsPatronalPF) });
  rubriques.push({ code: 'R481', designation: 'CNPS ASSURANCE MATERNITÉ', nombre: null, base: Math.min(brutImposable, 70000), tauxSalarial: null, gain: null, retenue: null, tauxPatronal: 0.75, patronal: Math.round(cnpsPatronalAM) });
  rubriques.push({ code: 'R490', designation: 'CNPS ACCIDENT DU TRAVAIL (AT BTP)', nombre: null, base: Math.min(brutImposable, 70000), tauxSalarial: null, gain: null, retenue: null, tauxPatronal: 3.00, patronal: Math.round(cnpsPatronalAT) });
  rubriques.push({ code: 'R500', designation: 'ITS PATRONAL DGI', nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: tauxItsPatronal * 100, patronal: itsPatronal });
  rubriques.push({ code: 'R520', designation: "TAXE D'APPRENTISSAGE (TA DGI)", nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: 0.40, patronal: taxeApprentissage });
  rubriques.push({ code: 'R530', designation: 'TAXE FORMATION CONTINUE (FDFP)', nombre: null, base: brutImposable, tauxSalarial: null, gain: null, retenue: null, tauxPatronal: 0.60, patronal: fdfp });

  if (avanceSurSalaire > 0) {
    rubriques.push({ code: 'R750', designation: 'RETENUE AVANCE SUR SALAIRE', nombre: null, base: avanceSurSalaire, tauxSalarial: null, gain: null, retenue: avanceSurSalaire, tauxPatronal: null, patronal: null });
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

