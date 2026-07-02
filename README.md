# VictoryRoyaleDB

Dashboard interactivo para gestionar y visualizar un dataset de partidas del videojuego Fortnite. Muestra cards con la información de cada partida, permite buscar jugadores en tiempo real, filtrar por modo de juego, visualizar un gráfico de barras con Chart.js que se actualiza dinámicamente según los filtros aplicados, y cuenta con funcionalidades completas de CRUD (Crear, Leer, Actualizar, Eliminar) con persistencia en localStorage.

## Tecnologías utilizadas

- **HTML5 semántico**: estructura clara con `<header>`, `<main>`, `<section>`, `<article>`, `<footer>` y `<dialog>` para modales.
- **CSS3**: diseño responsive con variables CSS, Grid y Flexbox, tema cyberpunk oscuro con acentos neón, tipografía Google Fonts (Orbitron + Rajdhani) y animaciones.
- **JavaScript vanilla (ES Modules)**: separación en `data.js`, `filters.js` y `app.js`.
- **Chart.js v4.4.1**: gráfico de barras consumido desde CDN.
- **localStorage API**: persistencia de datos en el navegador.
- **CRUD completo**: Crear, Leer, Actualizar y Eliminar partidas con validación.

## Estructura del proyecto

```
/media/camper/Ventoy/VictoryRoyaleDB/
├── dataset.json        # Dataset original de 35 partidas (fuente de referencia)
├── index.html          # Estructura HTML semántica del dashboard con modal de creación
├── css/
│   └── styles.css      # Estilos: variables, layout, componentes, animaciones, modal, formulario
├── js/
│   ├── data.js         # Dataset embebido (30 registros) como módulo ES
│   ├── filters.js      # Funciones puras de búsqueda, filtrado y estadísticas
│   └── app.js          # Orquestación: DOM, render de cards, KPIs, Chart.js, CRUD, localStorage
├── assets/             # Reservado para íconos/imágenes futuras
└── README.md           # Documentación del proyecto
```

## Cómo ejecutar

El proyecto usa **ES Modules** (`type="module"`), por lo que requiere ser servido vía HTTP (no funciona abriendo el archivo directamente con `file://` debido a restricciones CORS del navegador).

```bash
python3 -m http.server 8080 --directory /media/camper/Ventoy/VictoryRoyaleDB
```

Y luego navegar a `http://localhost:8080`.

> **Nota:** el dashboard funciona completamente en el frontend. No requiere backend ni instalación de dependencias.

## Funcionalidades

### Visualización y Filtrado
- **Cards**: cada partida se muestra como una tarjeta con `match_id`, `player_name`, `kills`, `mode`, `match_date` y `victory_royale` (✔ o ❌), con animación de entrada y hover (scale + glow).
- **Búsqueda en tiempo real**: filtrar cards por nombre de jugador mientras se escribe.
- **Filtro por modo**: select dropdown con opciones `Todos`, `Solo`, `Dúos`, `Escuadrones`.
- **KPIs**: total de partidas, total de Victory Royales y promedio de kills, recalculados según el filtro actual.
- **Gráfico de barras**: muestra el conteo de partidas por modo y se actualiza automáticamente al filtrar.
- **Loading state**: spinner simulado al cargar la app por primera vez.
- **Empty state**: mensaje "No se encontraron partidas" cuando el filtro no arroja resultados.

### CRUD y Persistencia
- **Crear**: botón "Agregar partida" abre un modal con formulario validado para crear nuevos registros.
- **Leer**: las cards muestran todos los datos de cada partida.
- **Actualizar**: edición inline en campos `player_name`, `kills` y `match_date` (click para editar, blur/Enter para guardar).
- **Eliminar**: botón 🗑️ en cada card para eliminar el registro con confirmación.
- **Persistencia**: todos los datos se guardan en `localStorage` bajo la clave `fortnite_matches`; al recargar la página se restauran los datos persistentes.

### Validación de Datos
La función `validateMatch` en `js/app.js` valida cada registro según las siguientes reglas:
- `player_name`: requerido, string, entre 3 y 15 caracteres.
- `kills`: requerido, número, entre 0 y 20.
- `match_date`: requerido, formato YYYY-MM-DD.
- `mode`: requerido, debe ser uno de "Solo", "Dúos" o "Escuadrones".
- `victory_royale`: requerido, booleano (true o false).

La validación se aplica tanto al crear nuevas partidas como al actualizar existentes. Si hay errores, se muestran al usuario y no se guarda el cambio.

### Buenas Prácticas
- Separación estricta HTML / CSS / JS (nada de lógica ni estilos inline).
- No se usa `innerHTML`; se usa `createElement`, `appendChild` y `textContent`.
- Código modular en ES Modules (`data.js`, `filters.js`, `app.js`) con funciones puras y reutilizables.
- Nombres de variables y funciones descriptivos, JSDoc en funciones clave.
- Función validadora centralizada para consistencia de datos.

## Paso a paso del desarrollo

1. **Definición del dataset**: se partió de un dataset inicial de 5 registros base en formato JSON. A través de un script en Python, se generaron y validaron 25 registros adicionales (`M-0016` a `M-0040`), resultando en un total de 35 partidas. Los registros se validaron para cumplir: `match_id` único, `kills` entre 0 y 20, `player_name` de 3 a 15 caracteres, `mode` en `Solo`, `Dúos` o `Escuadrones`, fechas dentro de 2026 y `victory_royale` booleano.

2. **Primera versión del dashboard (archivo único)**: se creó un `index.html` autocontenido con HTML semántico, CSS embebido y JavaScript embebido, junto con Chart.js desde CDN y un tema oscuro gamer con acentos neón.

3. **Refactorización a arquitectura modular**: a petición de mejorar la organización y aplicar buenas prácticas de arquitectura frontend, el proyecto se dividió en:
   - `index.html`: solo estructura semántica, sin lógica ni estilos inline.
   - `css/styles.css`: todos los estilos, con variables CSS, tipografía Google Fonts (Orbitron/Rajdhani) y animaciones.
   - `js/data.js`: dataset de 30 partidas como módulo ES (`export const matchesData`).
   - `js/filters.js`: funciones puras (`filterByName`, `filterByMode`, `applyFilters`, `countByMode`, `computeStats`) sin dependencias del DOM.
   - `js/app.js`: orquestación — importa datos y filtros, maneja el DOM, renderiza cards, KPIs, loading/empty states y el gráfico de Chart.js.

4. **Mejora del diseño visual**: se rediseñó el CSS con un enfoque cyberpunk más elaborado — fondo con glow radial, tipografía display para títulos, bordes con gradiente animado en hover, badges de color por modo, y animación de entrada escalonada para las cards.

5. **Funcionalidades bonus**: se añadió un estado de carga inicial simulado (spinner), un estado vacío ("No se encontraron partidas") y KPIs de resumen (total de partidas, Victory Royales y promedio de kills) que se recalculan con cada filtro.

6. **Validación**: se verificó la sintaxis de los módulos JS con `node --check`, y se sirvió el proyecto con un servidor HTTP local (`python3 -m http.server`) para probar los ES Modules, ya que requieren protocolo HTTP y no funcionan con `file://`.

7. **Documentación**: se actualizó este `README.md` reflejando la nueva estructura de archivos, instrucciones de ejecución y el historial completo de prompts utilizados.

8. **CRUD y localStorage**: se implementó funcionalidad completa de Crear, Leer, Actualizar y Eliminar partidas con persistencia en localStorage, incluyendo:
   - Función `validateMatch` para validación de datos.
   - Modal de creación con formulario validado.
   - Botón de eliminación en cada card.
   - Edición inline de campos clave (player_name, kills, match_date).
   - Funciones `loadMatches`, `saveMatches`, `createMatch`, `deleteMatch`, `updateMatch`.
   - Actualización automática de UI, KPIs y gráfico tras cada operación CRUD.

## Prompts utilizados

### Prompt 1: Generación del dataset

```
Eres un generador de datasets estructurados.

Tu tarea es expandir un dataset de partidas del videojuego Fortnite.

Debes generar registros en formato JSON siguiendo exactamente esta estructura:

{
  "match_id": "M-XXXX" (string único incremental),
  "player_name": string (entre 3 y 15 caracteres),
  "kills": integer (0 a 20),
  "match_date": string en formato YYYY-MM-DD (entre 2026-01-01 y 2026-12-31),
  "mode": "Solo" | "Dúos" | "Escuadrones",
  "victory_royale": boolean
}

REGLAS IMPORTANTES:
- No repetir match_id.
- kills nunca puede ser menor a 0 ni mayor a 20.
- player_name debe tener entre 3 y 15 caracteres.
- mode solo puede ser: Solo, Dúos, Escuadrones (respetar acentos).
- match_date solo dentro del año 2026.
- victory_royale solo true o false.
- Devuelve SOLO JSON válido (sin texto extra).

DATASET BASE (NO MODIFICAR):

[... 5 registros base ...]

TAREA:
Genera exactamente 25 registros adicionales siguiendo la misma estructura y reglas.
Asegúrate de que el dataset final tenga coherencia, sin errores y listo para validación en JavaScript.
Devuelve únicamente el JSON completo.

lo tengo en dataset.json
```

### Prompt 2: Dashboard interactivo

```
Eres un desarrollador frontend experto en HTML, CSS y JavaScript.

Tu tarea es construir una interfaz web interactiva para visualizar un dataset de partidas del videojuego Fortnite.

CONTEXTO:
Tengo un dataset de 50 registros en formato JSON con esta estructura:

{
  match_id: string,
  player_name: string,
  kills: number,
  match_date: string (YYYY-MM-DD),
  mode: "Solo" | "Dúos" | "Escuadrones",
  victory_royale: boolean
}

REQUISITOS DEL PROYECTO:

1. HTML
- Crear un archivo index.html.
- Cargar el dataset directamente como un array JavaScript dentro del script.

2. VISUALIZACIÓN
- Renderizar cada registro como una CARD.
- Cada card debe mostrar: Match ID, Player Name, Kills, Mode, Fecha, Victory Royale (✔ o ❌).

3. ESTILO (CSS)
- Diseño moderno tipo dashboard gamer.
- Cards con hover effect.
- Colores inspirados en videojuegos (oscuro + neón).
- Layout responsive (grid o flexbox).

4. BÚSQUEDA EN TIEMPO REAL
- Input de búsqueda.
- Filtrar por player_name mientras el usuario escribe.

5. FILTRO POR CATEGORÍA
- Un select dropdown para filtrar por mode: Todos, Solo, Dúos, Escuadrones.

6. BONUS (OBLIGATORIO SI QUIERES NOTA ALTA)
- Usar Chart.js (CDN).
- Crear un gráfico de barras que muestre: Conteo de partidas por mode.
- El gráfico debe actualizarse automáticamente al filtrar datos.

REGLAS IMPORTANTES:
- No usar frameworks (solo HTML, CSS, JS puro).
- No usar backend.
- No usar librerías excepto Chart.js.
- Código limpio y comentado.
- No usar innerHTML inseguro; usar createElement o textContent.
- Todo debe funcionar en un solo archivo index.html.

RESULTADO:
Devuélveme únicamente el código completo listo para ejecutar.
```

### Prompt 3: Semántica, buenas prácticas y README

```
Tambien toma en cuenta la semantica, que vaya bien estructurado el proyecto con buenas practicas y haz un readme expliicando el paso a paso sobre como lo hemos trabajado y que promt usaste
```

### Prompt 4: Refactorización profesional y arquitectura modular

```
Eres un desarrollador senior frontend especializado en arquitectura web, buenas prácticas y diseño UI moderno.

Tengo un proyecto en HTML, CSS y JavaScript puro que visualiza un dataset de Fortnite con cards, filtros y búsqueda.

Tu tarea es realizar una revisión completa, refactorización y mejora del proyecto.

OBJETIVO GENERAL:
1. Validarlo funcional y estructuralmente
2. Organizarlo correctamente en archivos separados
3. Aplicar buenas prácticas de desarrollo frontend
4. Mejorar el diseño a un nivel profesional (moderno y visualmente atractivo)
5. Mantener SOLO HTML + CSS + JS puro (sin frameworks)

ESTRUCTURA OBLIGATORIA:
/project-root
├── index.html
├── /css
│   └── styles.css
├── /js
│   ├── data.js
│   ├── app.js
│   └── filters.js
└── /assets (opcional)

El dataset debe estar en data.js como un array de 30 registros.

FUNCIONALIDAD OBLIGATORIA: render de cards dinámicas, búsqueda en tiempo real, filtro por modo, actualización automática de UI.

DISEÑO: tema gamer oscuro + neon (cyberpunk), cards con hover animado (scale + glow), tipografía moderna (Google Fonts opcional), layout responsive, animaciones suaves.

BUENAS PRÁCTICAS: separación de responsabilidades, nada de lógica en HTML, no innerHTML inseguro, createElement/appendChild/textContent, código limpio y comentado, funciones reutilizables.

BONUS: contador de estadísticas (total partidas, Victory Royales, promedio de kills), animación al filtrar, estado "No results found", loading inicial simulado, Chart.js para distribución de modos.

RESTRICCIONES: no frameworks, no backend, solo HTML+CSS+JS puro, no librerías externas excepto Chart.js.

El objetivo es que este proyecto parezca un dashboard real de videojuego tipo eSports, no un ejercicio escolar básico.
```

## Notas adicionales

- El dataset en `js/data.js` contiene **30 registros** (`M-0006` a `M-0035`), tomados del dataset original de 35 partidas.
- El archivo `dataset.json` se conserva como fuente de referencia histórica del proyecto.
- El dashboard usa **ES Modules**, por lo que debe servirse vía HTTP (no `file://`) para funcionar correctamente en el navegador.
- El dashboard está optimizado para navegadores modernos y utiliza Chart.js desde una CDN estable.
- Los datos se persisten en `localStorage` bajo la clave `fortnite_matches`; si no hay datos persistentes, se carga el dataset inicial de `js/data.js`.
- La función `validateMatch` garantiza la integridad de los datos en todas las operaciones CRUD.
