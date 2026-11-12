let todayKey = "";
let todayPuzzle = null;
let paises = [];

// Estado inicial: 1 pista desvelada, 100 puntos
let savedState = JSON.parse(localStorage.getItem('elmapaTodayState')) || {
  date: "", guessed: [], cluesRevealed: 1, score: 100, status: 'playing' 
};

const archiveView = document.getElementById('archive-view');
const gameView = document.getElementById('game-view');
const reviewView = document.getElementById('review-view');
const dailyActionContainer = document.getElementById('daily-action-container');

const buscador = document.getElementById('buscador');
const autocompletarLista = document.getElementById('autocompletar-lista');
const btnEnviar = document.getElementById('btn-enviar');
const btnPedirPista = document.getElementById('btn-pedir-pista');
const hintsContainer = document.getElementById('hints-container');
const scoreDisplay = document.getElementById('score-display');
const feedbackContainer = document.getElementById('feedback-container');
const mensajePista = document.getElementById('mensaje-pista');

// Carga de datos robusta con red de seguridad
fetch('datos.json')
  .then(res => {
    if (!res.ok) throw new Error('No se pudo cargar el archivo JSON');
    return res.json();
  })
  .then(data => {
    iniciarJuego(data);
  })
  .catch(err => {
    console.warn("Fallo al cargar datos.json. Cargando datos de respaldo (¿estás abriendo el HTML en local?):", err);
    // Estos datos se cargan si estás probando en local sin servidor o si falla GitHub
    const fallbackData = {
      "fecha_inicio": "2026-11-12",
      "paises": [{"nombre": "Senegal"}, {"nombre": "Japón"}, {"nombre": "España"}, {"nombre": "Brasil"}],
      "retos": [{
        "dia": 0,
        "respuesta": "Senegal",
        "pistas": [
          "🌍 Es un país del continente africano.",
          "🌊 Tiene costa bañada por el océano Atlántico.",
          "🏙️ Su capital es una de las ciudades más pobladas de África occidental.",
          "🗣️ Su idioma oficial es el francés.",
          "🚩 Su bandera tiene tres franjas verticales: verde, amarilla y roja con una estrella."
        ]
      }]
    };
    iniciarJuego(fallbackData);
  });
  
function iniciarJuego(data) {
    paises = data.paises;
    const retos = data.retos;
    const fechaInicio = data.fecha_inicio;
    
    const startDate = new Date(fechaInicio + "T00:00:00").getTime();
    const today = new Date();
    today.setHours(0,0,0,0);
    const dayDiff = Math.floor((today.getTime() - startDate) / (1000 * 60 * 60 * 24));
    const dayIndex = Math.max(0, dayDiff);
    todayKey = today.toISOString().split('T')[0];
    
    todayPuzzle = retos[dayIndex % retos.length];
    
    // Si es un día nuevo, resetear estado
    if (savedState.date !== todayKey) {
      savedState = { date: todayKey, guessed: [], cluesRevealed: 1, score: 100, status: 'playing' };
      saveState();
    }
    
    renderMenuUI();
    initCountdown();
}
  
function saveState() {
  localStorage.setItem('elmapaTodayState', JSON.stringify(savedState));
}

function initCountdown() {
  function update() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const h = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
    const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, '0');
    const s = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
    const el = document.getElementById('countdown-timer');
    if(el) el.textContent = `${h}:${m}:${s}`;
  }
  update();
  setInterval(update, 1000);
}

function renderMenuUI() {
  dailyActionContainer.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'btn-pixel';
  
  if (savedState.status === 'playing') {
    btn.textContent = '▶ JUGAR';
    btn.style.padding = '20px';
    btn.style.fontSize = '2rem';
    btn.onclick = () => {
        archiveView.classList.replace('show', 'hidden');
        gameView.classList.replace('hidden', 'show');
        updateGameUI();
    };
  } else {
    btn.style.background = savedState.status === 'won' ? 'var(--success)' : 'var(--danger)';
    btn.style.color = '#fff';
    btn.style.padding = '20px';
    btn.style.fontSize = '2rem';
    btn.textContent = 'HOY: JUGADO (REVISIÓN)';
    btn.onclick = showReview;
  }
  dailyActionContainer.appendChild(btn);
}

document.getElementById('btn-archive').onclick = () => {
    gameView.classList.replace('show', 'hidden');
    archiveView.classList.replace('hidden', 'show');
    renderMenuUI();
};
document.getElementById('btn-back-archive').onclick = () => {
    reviewView.classList.replace('show', 'hidden');
    archiveView.classList.replace('hidden', 'show');
    renderMenuUI();
};

function showReview() {
  archiveView.classList.replace('show', 'hidden');
  gameView.classList.replace('show', 'hidden');
  reviewView.classList.replace('hidden', 'show');
  
  const isWon = savedState.status === 'won';
  document.getElementById('review-content').innerHTML = `
    <div class="review-item ${isWon ? 'correct' : 'incorrect'}">
      <p style="font-size:1.8rem; font-weight:bold; color: ${isWon ? 'var(--success)' : 'var(--danger)'};">${isWon ? '✨ ¡DESCUBIERTO!' : '💀 SIN PUNTOS'}</p>
      <p style="font-size:3rem; font-weight:bold; margin: 10px 0; text-transform:uppercase; color: var(--text);">${todayPuzzle.respuesta}</p>
      
      <div style="background: var(--bg); padding: 10px; border: 2px solid #000; border-radius: 4px; color: var(--text); margin-top: 15px;">
        <p style="font-size:1.3rem; margin-top:5px;">Puntuación final: <strong>${savedState.score} pts</strong></p>
        <p style="font-size:1.3rem; margin-top:5px;">Pistas necesitadas: <strong>${savedState.cluesRevealed} / 5</strong></p>
      </div>
    </div>
  `;
}

document.getElementById('btn-share').onclick = () => {
  const isWon = savedState.status === '