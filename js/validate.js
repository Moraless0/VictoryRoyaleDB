// validate.js
// Script de validación del dataset de partidas de Fortnite.
// Ejecutar con: node js/validate.js

import { matchesData } from "./data.js";

/**
 * Valida el dataset completo según reglas de negocio.
 * @param {Array} dataset - Array de partidas a validar.
 * @returns {{ valid: boolean, errors: Array<{ match_id: string, errors: string[] }> }}
 */
function validarDataset(dataset) {
  const errors = [];
  const matchIds = new Set();

  dataset.forEach((match, index) => {
    const matchErrors = [];

    // Regla 1: match_id único
    if (matchIds.has(match.match_id)) {
      matchErrors.push(`match_id duplicado: ${match.match_id}`);
    } else {
      matchIds.add(match.match_id);
    }

    // Regla 2: match_id formato válido (M-XXXX)
    if (!/^M-\d{4}$/.test(match.match_id)) {
      matchErrors.push(`match_id formato inválido: ${match.match_id} (debe ser M-XXXX)`);
    }

    // Regla 3: player_name entre 3 y 15 caracteres
    if (!match.player_name || typeof match.player_name !== "string") {
      matchErrors.push("player_name es requerido y debe ser texto");
    } else if (match.player_name.length < 3 || match.player_name.length > 15) {
      matchErrors.push(`player_name longitud inválida: ${match.player_name.length} (debe ser 3-15)`);
    }

    // Regla 4: kills entre 0 y 20
    if (typeof match.kills !== "number" || match.kills < 0 || match.kills > 20) {
      matchErrors.push(`kills inválido: ${match.kills} (debe ser 0-20)`);
    }

    // Regla 5: match_date formato YYYY-MM-DD y año 2026
    if (!match.match_date || !/^\d{4}-\d{2}-\d{2}$/.test(match.match_date)) {
      matchErrors.push(`match_date formato inválido: ${match.match_date} (debe ser YYYY-MM-DD)`);
    } else {
      const year = parseInt(match.match_date.split("-")[0], 10);
      if (year !== 2026) {
        matchErrors.push(`match_date año inválido: ${year} (debe ser 2026)`);
      }
    }

    // Regla 6: mode válido
    const validModes = ["Solo", "Dúos", "Escuadrones"];
    if (!match.mode || !validModes.includes(match.mode)) {
      matchErrors.push(`mode inválido: ${match.mode} (debe ser Solo, Dúos o Escuadrones)`);
    }

    // Regla 7: victory_royale booleano
    if (typeof match.victory_royale !== "boolean") {
      matchErrors.push(`victory_royale inválido: ${match.victory_royale} (debe ser true o false)`);
    }

    if (matchErrors.length > 0) {
      errors.push({
        match_id: match.match_id,
        index: index + 1,
        errors: matchErrors,
      });
    }
  });

  return {
    valid: errors.length === 0,
    total: dataset.length,
    validCount: dataset.length - errors.length,
    errorCount: errors.length,
    errors,
  };
}

// Ejecutar validación
console.log("=== Validación del Dataset de Fortnite ===\n");
const result = validarDataset(matchesData);

console.log(`Total de registros: ${result.total}`);
console.log(`Registros válidos: ${result.validCount}`);
console.log(`Registros con errores: ${result.errorCount}`);
console.log(`Estado general: ${result.valid ? "✅ VÁLIDO" : "❌ INVÁLIDO"}\n`);

if (result.errors.length > 0) {
  console.log("=== Errores encontrados ===\n");
  result.errors.forEach((error) => {
    console.log(`Registro #${error.index} (${error.match_id}):`);
    error.errors.forEach((err) => console.log(`  - ${err}`));
    console.log("");
  });
} else {
  console.log("✅ No se encontraron errores. El dataset cumple todas las reglas de negocio.");
}
