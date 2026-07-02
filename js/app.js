// app.js
// Lógica principal de la aplicación: orquesta datos, filtros, renderizado del DOM, el gráfico, CRUD y localStorage.

import { matchesData } from "./data.js";
import { applyFilters, countByMode, computeStats } from "./filters.js";

// --- Clave de localStorage ---
const STORAGE_KEY = "fortnite_matches";

// --- Estado de la aplicación ---
let currentMatches = [];

// --- Referencias al DOM ---
const searchInput = document.getElementById("search-input");
const modeSelect = document.getElementById("mode-select");
const cardsContainer = document.getElementById("cards-container");
const loadingState = document.getElementById("loading-state");
const emptyState = document.getElementById("empty-state");
const statTotal = document.getElementById("stat-total");
const statWins = document.getElementById("stat-wins");
const statAvgKills = document.getElementById("stat-avg-kills");
const chartCanvas = document.getElementById("mode-chart");
const createModal = document.getElementById("create-modal");
const createForm = document.getElementById("create-form");
const openCreateModalBtn = document.getElementById("open-create-modal");
const closeCreateModalBtn = document.getElementById("close-create-modal");

// --- Estado del gráfico ---
let modeChart = null;

// Paleta de colores neón por modo
const MODE_COLORS = {
  Solo: "#00f0ff",
  "Dúos": "#b967ff",
  Escuadrones: "#ff2a6d",
};

/**
 * Carga los datos desde localStorage o usa el dataset inicial.
 * @returns {Array} Array de partidas.
 */
function loadMatches() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error al leer localStorage:", e);
      return matchesData;
    }
  }
  return matchesData;
}

/**
 * Guarda los datos en localStorage.
 * @param {Array} matches - Array de partidas a guardar.
 */
function saveMatches(matches) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

/**
 * Valida un registro de partida según las reglas del negocio.
 * @param {Object} match - Registro a validar.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateMatch(match) {
  const errors = [];

  if (!match.player_name || typeof match.player_name !== "string") {
    errors.push("player_name es requerido y debe ser texto.");
  } else if (match.player_name.length < 3 || match.player_name.length > 15) {
    errors.push("player_name debe tener entre 3 y 15 caracteres.");
  }

  if (typeof match.kills !== "number" || match.kills < 0 || match.kills > 20) {
    errors.push("kills debe ser un número entre 0 y 20.");
  }

  if (!match.match_date || !/^\d{4}-\d{2}-\d{2}$/.test(match.match_date)) {
    errors.push("match_date debe tener formato YYYY-MM-DD.");
  }

  const validModes = ["Solo", "Dúos", "Escuadrones"];
  if (!match.mode || !validModes.includes(match.mode)) {
    errors.push(`mode debe ser uno de: ${validModes.join(", ")}.`);
  }

  if (typeof match.victory_royale !== "boolean") {
    errors.push("victory_royale debe ser true o false.");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Genera el siguiente match_id secuencial basado en los registros existentes.
 * @param {Array} matches - Array de partidas.
 * @returns {string} Nuevo match_id en formato M-XXXX.
 */
function generateNextMatchId(matches) {
  if (matches.length === 0) return "M-0001";
  const maxId = matches.reduce((max, match) => {
    const num = parseInt(match.match_id.split("-")[1], 10);
    return num > max ? num : max;
  }, 0);
  return `M-${String(maxId + 1).padStart(4, "0")}`;
}

/**
 * Crea una nueva partida y la persiste.
 * @param {Object} match - Registro a crear (sin match_id).
 * @returns {{ success: boolean, error?: string, match?: Object }}
 */
function createMatch(match) {
  const validation = validateMatch(match);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(" ") };
  }

  const newMatch = {
    ...match,
    match_id: generateNextMatchId(currentMatches),
  };

  currentMatches.push(newMatch);
  saveMatches(currentMatches);
  return { success: true, match: newMatch };
}

/**
 * Elimina una partida por su match_id.
 * @param {string} matchId - ID de la partida a eliminar.
 * @returns {boolean} true si se eliminó, false si no se encontró.
 */
function deleteMatch(matchId) {
  const index = currentMatches.findIndex((m) => m.match_id === matchId);
  if (index === -1) return false;

  currentMatches.splice(index, 1);
  saveMatches(currentMatches);
  return true;
}

/**
 * Actualiza una partida existente.
 * @param {string} matchId - ID de la partida a actualizar.
 * @param {Object} updates - Campos a actualizar.
 * @returns {{ success: boolean, error?: string }}
 */
function updateMatch(matchId, updates) {
  const index = currentMatches.findIndex((m) => m.match_id === matchId);
  if (index === -1) {
    return { success: false, error: "Partida no encontrada." };
  }

  const updatedMatch = { ...currentMatches[index], ...updates };
  const validation = validateMatch(updatedMatch);
  if (!validation.valid) {
    return { success: false, error: validation.errors.join(" ") };
  }

  currentMatches[index] = updatedMatch;
  saveMatches(currentMatches);
  return { success: true };
}

/**
 * Crea un elemento DOM con clase y texto opcional.
 * Evita el uso de innerHTML para prevenir inyección insegura.
 * @param {string} tag - Etiqueta HTML.
 * @param {string} [className] - Clase CSS.
 * @param {string} [text] - Contenido de texto.
 * @returns {HTMLElement}
 */
function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

/**
 * Construye una card de partida como elemento DOM con botón de eliminación y campos editables.
 * @param {Object} match - Registro de partida.
 * @returns {HTMLElement}
 */
function buildMatchCard(match) {
  const card = createElement("article", "match-card");
  card.setAttribute("tabindex", "0");
  card.dataset.matchId = match.match_id;

  const header = createElement("div", "match-card__header");
  header.appendChild(createElement("span", "match-card__id", match.match_id));
  const modeBadge = createElement("span", "mode-badge", match.mode);
  modeBadge.dataset.mode = match.mode;
  header.appendChild(modeBadge);

  // Botón de eliminación
  const deleteBtn = createElement("button", "match-card__delete", "🗑️");
  deleteBtn.setAttribute("aria-label", "Eliminar partida");
  deleteBtn.addEventListener("click", () => {
    if (confirm(`¿Eliminar partida ${match.match_id}?`)) {
      deleteMatch(match.match_id);
      updateUI();
    }
  });
  header.appendChild(deleteBtn);

  const playerName = createElement("h3", "match-card__player", match.player_name);
  playerName.dataset.editable = "true";
  playerName.dataset.field = "player_name";
  playerName.addEventListener("click", () => makeEditable(playerName, match, "player_name"));

  const statsRow = createElement("div", "match-card__stats");

  const killsBlock = createElement("div", "match-card__stat");
  killsBlock.appendChild(createElement("span", "match-card__stat-label", "Kills"));
  const killsValue = createElement("span", "match-card__stat-value", String(match.kills));
  killsValue.dataset.editable = "true";
  killsValue.dataset.field = "kills";
  killsValue.addEventListener("click", () => makeEditable(killsValue, match, "kills"));
  killsBlock.appendChild(killsValue);

  const dateBlock = createElement("div", "match-card__stat");
  dateBlock.appendChild(createElement("span", "match-card__stat-label", "Fecha"));
  const dateValue = createElement("span", "match-card__stat-value", match.match_date);
  dateValue.dataset.editable = "true";
  dateValue.dataset.field = "match_date";
  dateValue.addEventListener("click", () => makeEditable(dateValue, match, "match_date"));
  dateBlock.appendChild(dateValue);

  statsRow.appendChild(killsBlock);
  statsRow.appendChild(dateBlock);

  const victoryRow = createElement("div", "match-card__victory");
  const victoryIcon = createElement(
    "span",
    match.victory_royale ? "victory-badge victory-badge--win" : "victory-badge victory-badge--loss",
    match.victory_royale ? "✔ Victory Royale" : "❌ Eliminado"
  );
  victoryRow.appendChild(victoryIcon);

  card.appendChild(header);
  card.appendChild(playerName);
  card.appendChild(statsRow);
  card.appendChild(victoryRow);

  return card;
}

/**
 * Convierte un elemento de texto en un input editable.
 * @param {HTMLElement} element - Elemento a convertir.
 * @param {Object} match - Registro de partida.
 * @param {string} field - Campo a editar.
 */
function makeEditable(element, match, field) {
  const currentValue = element.textContent;
  const input = document.createElement(field === "kills" ? "input" : field === "match_date" ? "input" : "input");
  input.type = field === "match_date" ? "date" : field === "kills" ? "number" : "text";
  input.value = currentValue;
  input.className = "inline-edit-input";

  if (field === "kills") {
    input.min = 0;
    input.max = 20;
  }

  const saveEdit = () => {
    let newValue = input.value;
    if (field === "kills") newValue = parseInt(newValue, 10);

    const result = updateMatch(match.match_id, { [field]: newValue });
    if (result.success) {
      updateUI();
    } else {
      alert(result.error);
      element.textContent = currentValue;
    }
  };

  input.addEventListener("blur", saveEdit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      input.blur();
    } else if (e.key === "Escape") {
      element.textContent = currentValue;
    }
  });

  element.textContent = "";
  element.appendChild(input);
  input.focus();
}

/**
 * Limpia todos los hijos de un contenedor.
 * @param {HTMLElement} container
 */
function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Renderiza las cards en el contenedor principal con animación de entrada.
 * @param {Array} matches - Partidas filtradas a mostrar.
 */
function renderCards(matches) {
  clearContainer(cardsContainer);

  const hasResults = matches.length > 0;
  emptyState.hidden = hasResults;
  cardsContainer.hidden = !hasResults;

  if (!hasResults) return;

  matches.forEach((match, index) => {
    const card = buildMatchCard(match);
    card.style.animationDelay = `${index * 30}ms`;
    cardsContainer.appendChild(card);
  });
}

/**
 * Actualiza los contadores de estadísticas (KPIs).
 * @param {Array} matches - Partidas filtradas.
 */
function renderStats(matches) {
  const { total, victories, avgKills } = computeStats(matches);
  statTotal.textContent = total;
  statWins.textContent = victories;
  statAvgKills.textContent = avgKills.toFixed(1);
}

/**
 * Crea o actualiza el gráfico de barras de Chart.js según el modo.
 * @param {Array} matches - Partidas filtradas.
 */
function renderChart(matches) {
  const counts = countByMode(matches);
  const labels = Object.keys(counts);
  const values = Object.values(counts);
  const colors = labels.map((mode) => MODE_COLORS[mode]);

  const chartConfig = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Partidas",
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 10,
          hoverBackgroundColor: "#fcee0a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 15, 26, 0.95)",
          titleColor: "#00f0ff",
          bodyColor: "#e2e8f0",
          borderColor: "#00f0ff",
          borderWidth: 1,
          padding: 10,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#94a3b8", stepSize: 1, precision: 0 },
          grid: { color: "rgba(0, 240, 255, 0.08)" },
        },
        x: {
          ticks: { color: "#e2e8f0", font: { family: "Rajdhani", size: 13 } },
          grid: { display: false },
        },
      },
    },
  };

  if (modeChart) {
    modeChart.data = chartConfig.data;
    modeChart.update();
  } else {
    modeChart = new Chart(chartCanvas, chartConfig);
  }
}

/**
 * Punto central de actualización de la UI: aplica filtros y refresca
 * cards, estadísticas y gráfico en conjunto.
 */
function updateUI() {
  const criteria = {
    query: searchInput.value,
    mode: modeSelect.value,
  };

  const filtered = applyFilters(currentMatches, criteria);

  renderCards(filtered);
  renderStats(filtered);
  renderChart(filtered);
}

/**
 * Maneja el envío del formulario de creación.
 * @param {Event} e - Evento de submit.
 */
function handleCreateSubmit(e) {
  e.preventDefault();

  const formData = new FormData(createForm);
  const newMatch = {
    player_name: formData.get("player_name"),
    kills: parseInt(formData.get("kills"), 10),
    match_date: formData.get("match_date"),
    mode: formData.get("mode"),
    victory_royale: formData.get("victory_royale") === "true",
  };

  const result = createMatch(newMatch);
  if (result.success) {
    createForm.reset();
    createModal.close();
    updateUI();
  } else {
    alert(result.error);
  }
}

/**
 * Simula un breve estado de carga inicial antes de mostrar el dashboard.
 * Mejora la percepción de "app real" cargando datos.
 */
function simulateInitialLoad() {
  return new Promise((resolve) => {
    setTimeout(resolve, 600);
  });
}

/**
 * Inicializa la aplicación: listeners de eventos y primer render.
 */
async function init() {
  currentMatches = loadMatches();
  loadingState.hidden = false;
  cardsContainer.hidden = true;
  emptyState.hidden = true;

  await simulateInitialLoad();

  loadingState.hidden = true;

  searchInput.addEventListener("input", updateUI);
  modeSelect.addEventListener("change", updateUI);

  // Event listeners del modal de creación
  openCreateModalBtn.addEventListener("click", () => createModal.showModal());
  closeCreateModalBtn.addEventListener("click", () => createModal.close());
  createForm.addEventListener("submit", handleCreateSubmit);

  updateUI();
}

init();
