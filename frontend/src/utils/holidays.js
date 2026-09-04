/**
 * Jours Fériés de la République de Côte d'Ivoire (Fixes et Mobiles) pour 2026/2027.
 */

// Liste des fêtes fixes
const FIXED_HOLIDAYS = [
  { month: 0, day: 1, label: "Jour de l'An" },
  { month: 4, day: 1, label: "Fête du Travail" },
  { month: 7, day: 7, label: "Fête Nationale (Indépendance)" },
  { month: 7, day: 15, label: "Assomption" },
  { month: 10, day: 1, label: "Toussaint" },
  { month: 10, day: 15, label: "Journée Nationale de la Paix" },
  { month: 11, day: 25, label: "Noël" }
];

// Liste des fêtes mobiles pour l'année 2026
const MOBILE_HOLIDAYS_2026 = [
  { date: "2026-03-20", label: "Korité (Aïd al-Fitr)*" },
  { date: "2026-04-06", label: "Lundi de Pâques" },
  { date: "2026-04-14", label: "Nuit du Destin*" },
  { date: "2026-05-14", label: "Ascension" },
  { date: "2026-05-25", label: "Lundi de Pentecôte" },
  { date: "2026-05-27", label: "Tabaski (Aïd al-Adha)*" },
  { date: "2026-08-25", label: "Maouloud (Mawlid)*" }
];

// Liste des fêtes mobiles pour l'année 2027 (au cas où)
const MOBILE_HOLIDAYS_2027 = [
  { date: "2027-03-10", label: "Korité (Aïd al-Fitr)*" },
  { date: "2027-03-29", label: "Lundi de Pâques" },
  { date: "2027-04-04", label: "Nuit du Destin*" },
  { date: "2027-05-06", label: "Ascension" },
  { date: "2027-05-17", label: "Lundi de Pentecôte" },
  { date: "2027-05-16", label: "Tabaski (Aïd al-Adha)*" },
  { date: "2027-08-15", label: "Maouloud (Mawlid)*" }
];

/**
 * Détermine si une date donnée est un jour férié en Côte d'Ivoire.
 * @param {Date|string} inputDate - La date à vérifier
 * @returns {object|null} L'objet jour férié si trouvé, sinon null
 */
export const getIvorianHoliday = (inputDate) => {
  const date = new Date(inputDate);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // 1. Vérification des fêtes fixes
  const fixed = FIXED_HOLIDAYS.find(h => h.month === month && h.day === day);
  if (fixed) return fixed;

  // Format date YYYY-MM-DD
  const formattedDate = date.toISOString().split('T')[0];

  // 2. Vérification des fêtes mobiles selon l'année
  if (year === 2026) {
    const mobile = MOBILE_HOLIDAYS_2026.find(h => h.date === formattedDate);
    if (mobile) return mobile;
  } else if (year === 2027) {
    const mobile = MOBILE_HOLIDAYS_2027.find(h => h.date === formattedDate);
    if (mobile) return mobile;
  }

  return null;
};

/**
 * Calcule le nombre de jours de congés réels (jours ouvrables exclus les dimanches et jours fériés).
 * @param {string} debutStr - Date de début (YYYY-MM-DD)
 * @param {string} finStr - Date de fin (YYYY-MM-DD)
 * @returns {number} Nombre de jours de congés déduits
 */
export const calculateRealLeaveDays = (debutStr, finStr) => {
  if (!debutStr || !finStr) return 0;
  const start = new Date(debutStr);
  const end = new Date(finStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Dimanche, 6 = Samedi
    const holiday = getIvorianHoliday(current);

    // En Côte d'Ivoire, les jours de congés sont comptés en jours ouvrables (lundi-samedi).
    // Les dimanches et jours fériés payés ne sont pas décomptés du congé.
    if (dayOfWeek !== 0 && !holiday) {
      count++;
    }
    
    current.setDate(current.getDate() + 1);
  }

  return count;
};
