// filters.js
// Funciones puras de búsqueda y filtrado sobre el dataset de partidas.
// No manipulan el DOM: reciben datos y devuelven datos filtrados.

/**
 * Filtra partidas por nombre de jugador (búsqueda case-insensitive).
 * @param {Array} matches - Array de partidas.
 * @param {string} query - Texto de búsqueda.
 * @returns {Array} Partidas cuyo player_name incluye el query.
 */
export function filterByName(matches, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return matches;
  return matches.filter((match) =>
    match.player_name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Filtra partidas por modo de juego.
 * @param {Array} matches - Array de partidas.
 * @param {string} mode - Modo seleccionado ("all" para no filtrar).
 * @returns {Array} Partidas que coinciden con el modo.
 */
export function filterByMode(matches, mode) {
  if (!mode || mode === "all") return matches;
  return matches.filter((match) => match.mode === mode);
}

/**
 * Combina búsqueda por nombre y filtro por modo.
 * @param {Array} matches - Array de partidas original.
 * @param {Object} criteria - { query, mode }
 * @returns {Array} Partidas filtradas.
 */
export function applyFilters(matches, { query, mode }) {
  const byMode = filterByMode(matches, mode);
  return filterByName(byMode, query);
}

/**
 * Cuenta partidas agrupadas por modo.
 * @param {Array} matches - Array de partidas.
 * @returns {Object} Conteo por modo, ej: { Solo: 5, Dúos: 3, Escuadrones: 2 }
 */
export function countByMode(matches) {
  const counts = { Solo: 0, "Dúos": 0, Escuadrones: 0 };
  matches.forEach((match) => {
    if (counts[match.mode] !== undefined) {
      counts[match.mode] += 1;
    }
  });
  return counts;
}

/**
 * Calcula estadísticas resumen sobre un conjunto de partidas.
 * @param {Array} matches - Array de partidas.
 * @returns {Object} { total, victories, avgKills }
 */
export function computeStats(matches) {
  const total = matches.length;
  const victories = matches.filter((match) => match.victory_royale).length;
  const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
  const avgKills = total > 0 ? totalKills / total : 0;
  return { total, victories, avgKills };
}
