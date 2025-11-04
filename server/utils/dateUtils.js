/**
 * Utilitaires pour la gestion des dates selon la période de prestation RH
 * Période de prestation: du 21 du mois précédent au 20 du mois en cours
 */

/**
 * Calcule les dates de début et de fin pour une période de prestation
 * basée sur le mois donné.
 * 
 * La période de prestation va du 21 du mois précédent au 20 du mois donné.
 * 
 * @param {number} year - Année (ex: 2025)
 * @param {number} month - Mois (1-12, où 1 = janvier, 12 = décembre)
 * @returns {Object} { startDate, endDate, totalDays }
 */
function getPrestationPeriod(year, month) {
  // Mois précédent (si month = 1, previousMonth = 12, previousYear = year - 1)
  let previousMonth = month - 1;
  let previousYear = year;
  
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = year - 1;
  }
  
  // Date de début: 21 du mois précédent
  const startDate = new Date(previousYear, previousMonth - 1, 21);
  startDate.setHours(0, 0, 0, 0);
  
  // Date de fin: 20 du mois en cours
  const endDate = new Date(year, month - 1, 20);
  endDate.setHours(23, 59, 59, 999);
  
  // Calculer le nombre total de jours dans la période
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    startDate,
    endDate,
    totalDays
  };
}

/**
 * Obtient la période de prestation actuelle basée sur la date du jour.
 * Si on est avant le 21, on est encore dans la période du mois précédent.
 * Si on est le 21 ou après, on est dans la période du mois en cours.
 * 
 * @param {Date} [referenceDate] - Date de référence (par défaut: aujourd'hui)
 * @returns {Object} { year, month, period }
 */
function getCurrentPrestationPeriod(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  const day = today.getDate();
  const month = today.getMonth() + 1; // getMonth() retourne 0-11
  const year = today.getFullYear();
  
  // Si on est avant le 21, on est dans la période du mois précédent
  if (day < 21) {
    let previousMonth = month - 1;
    let previousYear = year;
    
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = year - 1;
    }
    
    const period = getPrestationPeriod(previousYear, previousMonth);
    return {
      year: previousYear,
      month: previousMonth,
      period
    };
  } else {
    // Si on est le 21 ou après, on est dans la période du mois en cours
    const period = getPrestationPeriod(year, month);
    return {
      year,
      month,
      period
    };
  }
}

/**
 * Obtient le nom de la période de prestation (ex: "Novembre 2025")
 * basé sur le mois de fin de la période (le mois en cours)
 * 
 * @param {number} year - Année
 * @param {number} month - Mois (1-12)
 * @returns {string} Nom de la période (ex: "Novembre 2025")
 */
function getPrestationPeriodName(year, month) {
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${monthNames[month - 1]} ${year}`;
}

/**
 * Obtient une description complète de la période (ex: "21 Octobre 2025 - 20 Novembre 2025")
 * 
 * @param {number} year - Année
 * @param {number} month - Mois (1-12)
 * @returns {string} Description de la période
 */
function getPrestationPeriodDescription(year, month) {
  const { startDate, endDate } = getPrestationPeriod(year, month);
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  
  const startDay = startDate.getDate();
  const startMonth = monthNames[startDate.getMonth()];
  const startYear = startDate.getFullYear();
  
  const endDay = endDate.getDate();
  const endMonth = monthNames[endDate.getMonth()];
  const endYear = endDate.getFullYear();
  
  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

/**
 * Génère tous les jours dans une période de prestation
 * 
 * @param {number} year - Année
 * @param {number} month - Mois (1-12)
 * @returns {Array} Array of { date, day, month, year, isWeekend }
 */
function getDaysInPrestationPeriod(year, month) {
  const { startDate, endDate } = getPrestationPeriod(year, month);
  const days = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const day = currentDate.getDate();
    const monthIdx = currentDate.getMonth();
    const yearIdx = currentDate.getFullYear();
    const dayOfWeek = currentDate.getDay();
    
    days.push({
      date: new Date(currentDate),
      day,
      month: monthIdx + 1,
      year: yearIdx,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dateString: currentDate.toISOString().split('T')[0] // YYYY-MM-DD
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

module.exports = {
  getPrestationPeriod,
  getCurrentPrestationPeriod,
  getPrestationPeriodName,
  getPrestationPeriodDescription,
  getDaysInPrestationPeriod
};

