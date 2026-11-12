let todayKey = "";
let todayPuzzle = null;
let paises = [];

// Estado: cluesRevealed va de 1 a 5. Puntuación de 100 a 20.
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

fetch('datos.json')
  .then(res => res.json())
  .then(data => {
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
    
    if (savedState.date !== todayKey) {
      savedState = { date: todayKey, guessed: [], cluesRevealed: 1, score: 100, status: 'playing' };
      saveState();
    }
    
    renderMenuUI();
    initCountdown();
  });
  
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
  const isWon = savedState.status === 'won';
  const text = `EL MAPA - RETO DE HOY ${isWon ? '🏆' : '💀'}\n` +
               `País descubierto con ${savedState.cluesRevealed}/5 pistas.\n` +
               `Puntuación: ${savedState.score} pts 🌍\n\n` +
               `Juega en: https://alejandrocoonde.github.io/elmapa/`;
  
  navigator.clipboard.writeText(text).then(() => {
    const t = document.getElementById('toast');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  });
};

// Autocompletar
buscador.addEventListener('input', function() {
  const val = this.value.toLowerCase();
  autocompletarLista.innerHTML = '';
  if (!val) {
    autocompletarLista.classList.add('hidden');
    return;
  }
  const filtrados = paises.filter(p => p.nombre.toLowerCase().startsWith(val));
  if (filtrados.length > 0) {
    autocompletarLista.classList.remove('hidden');
    filtrados.forEach(p => {
      const div = document.createElement('div');
      div.className = 'item-lista';
      div.innerText = p.nombre;
      div.onclick = () => {
        buscador.value = p.nombre;
        autocompletarLista.classList.add('hidden');
      };
      autocompletarLista.appendChild(div);
    });
  } else {
    autocompletarLista.classList.add('hidden');
  }
});

document.addEventListener('click', (e) => {
  if (e.target !== buscador) autocompletarLista.classList.add('hidden');
});

// Botón pedir pista manualmente
btnPedirPista.onclick = () => {
    if (savedState.status !== 'playing' || savedState.cluesRevealed >= 5) return;
    desbloquearPista();
};

btnEnviar.onclick = () => {
  if (savedState.status !== 'playing') return;
  const intentoStr = buscador.value.trim();
  const paisIntento = paises.find(p => p.nombre.toLowerCase() === intentoStr.toLowerCase());
  
  if (!paisIntento) {
    alert("País no encontrado. Usa la lista desplegable.");
    return;
  }
  
  buscador.value = '';
  savedState.guessed.push(paisIntento.nombre);
  
  if (paisIntento.nombre.toLowerCase() === todayPuzzle.respuesta.toLowerCase()) {
    savedState.status = 'won';
    saveState();
    updateGameUI("¡Correcto!");
  } else {
    // Fallar cuesta una pista automáticamente
    if (savedState.cluesRevealed < 5) {
        desbloquearPista(`❌ ${paisIntento.nombre} no es correcto. ¡Siguiente pista!`);
    } else {
        savedState.score = 0;
        savedState.status = 'lost';
        saveState();
        updateGameUI(`💀 Era ${todayPuzzle.respuesta}`);
    }
  }
};

function desbloquearPista(mensajeOpcional = null) {
    savedState.cluesRevealed++;
    savedState.score -= 20;
    saveState();
    updateGameUI(mensajeOpcional);
}

function updateGameUI(feedbackMsg = null) {
  scoreDisplay.textContent = savedState.score;
  hintsContainer.innerHTML = '';
  
  // Renderizar las 5 pistas
  for (let i = 0; i < 5; i++) {
      const div = document.createElement('div');
      if (i < savedState.cluesRevealed) {
          div.className = 'hint-item';
          div.innerText = todayPuzzle.pistas[i];
      } else {
          div.className = 'hint-item locked';
          div.innerText = "Contenido oculto para proteger el layout";
      }
      hintsContainer.appendChild(div);
  }

  // Estado del botón de pedir pista
  if (savedState.cluesRevealed >= 5 || savedState.status !== 'playing') {
      btnPedirPista.disabled = true;
  } else {
      btnPedirPista.disabled = false;
  }
  
  // Mensaje de feedback si has fallado o ganado
  if (feedbackMsg) {
      feedbackContainer.classList.remove('hidden');
      mensajePista.innerText = feedbackMsg;
  }
  
  // Fin del juego
  if (savedState.status !== 'playing') {
      btnEnviar.disabled = true;
      buscador.disabled = true;
      setTimeout(showReview, 2000);
  }
}