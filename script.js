let todayKey = "";
let todayPuzzle = null;
let paises = [];

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

// Carga de datos robusta
fetch('datos.json')
  .then(res => {
    if (!res.ok) throw new Error('No se pudo cargar el archivo JSON');
    return res.json();
  })
  .then(data => {
    iniciarJuego(data);
  })
  .catch(err => {
    console.warn("Fallo al cargar datos.json. Cargando datos de respaldo:", err);
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
  
  // Limpiar estilos de error si los hay al empezar a escribir de nuevo
  buscador.style.borderColor = "#000";
  buscador.style.backgroundColor = "#fff";

  if (!val) {
    autocompletarLista.classList.add('hidden');
    return;
  }
  
  // Buscar ignorando tildes para mayor comodidad
  const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtrados = paises.filter(p => normalizar(p.nombre.toLowerCase()).startsWith(normalizar(val)));
  
  if (filtrados.length > 0) {
    autocompletarLista.classList.remove('hidden');
    filtrados.forEach(p => {
      const div = document.createElement('div');
      div.className = 'item-lista';
      div.innerText = p.nombre;
      div.onclick = () => {
        buscador.value = p.nombre;
        autocompletarLista.classList.add('hidden');
        procesarIntento(); // Enviar automáticamente al hacer clic en la lista
      };
      autocompletarLista.appendChild(div);
    });
  } else {
    autocompletarLista.classList.add('hidden');
  }
});

// Cerrar lista si se hace clic fuera
document.addEventListener('click', (e) => {
  if (e.target !== buscador) autocompletarLista.classList.add('hidden');
});

// Enviar con la tecla ENTER
buscador.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        autocompletarLista.classList.add('hidden');
        procesarIntento();
    }
});

btnEnviar.onclick = procesarIntento;
btnPedirPista.onclick = () => {
    if (savedState.status !== 'playing' || savedState.cluesRevealed >= 5) return;
    desbloquearPista();
};

function procesarIntento() {
  if (savedState.status !== 'playing') return;
  const intentoStr = buscador.value.trim();
  
  if (!intentoStr) return; // Si está vacío, no hacer nada
  
  const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const paisIntento = paises.find(p => normalizar(p.nombre) === normalizar(intentoStr));
  
  // VALIDACIÓN: Si no es un país de la lista
  if (!paisIntento) {
    buscador.style.borderColor = "var(--danger)";
    buscador.style.backgroundColor = "#fecaca";
    
    // Animación de sacudida (requiere añadir la clase shake en el CSS)
    buscador.classList.add('shake-error');
    setTimeout(() => buscador.classList.remove('shake-error'), 400);
    
    // Cambiar temporalmente el placeholder
    const textoOriginal = buscador.value;
    buscador.value = "";
    buscador.placeholder = "¡Ese país no existe!";
    setTimeout(() => {
        buscador.placeholder = "Escribe un país...";
        buscador.value = textoOriginal;
        buscador.style.borderColor = "#000";
        buscador.style.backgroundColor = "#fff";
    }, 1500);
    return;
  }
  
  // Si el país es válido, procesarlo
  buscador.value = '';
  savedState.guessed.push(paisIntento.nombre);
  
  if (paisIntento.nombre.toLowerCase() === todayPuzzle.respuesta.toLowerCase()) {
    savedState.status = 'won';
    saveState();
    updateGameUI("¡Correcto!");
  } else {
    if (savedState.cluesRevealed < 5) {
        desbloquearPista(`❌ "${paisIntento.nombre}" no es correcto. ¡Siguiente pista!`);
    } else {
        savedState.score = 0;
        savedState.status = 'lost';
        saveState();
        updateGameUI(`💀 Era ${todayPuzzle.respuesta}`);
    }
  }
}

function desbloquearPista(mensajeOpcional = null) {
    savedState.cluesRevealed++;
    savedState.score -= 20;
    saveState();
    updateGameUI(mensajeOpcional);
}

function updateGameUI(feedbackMsg = null) {
  scoreDisplay.textContent = savedState.score;
  hintsContainer.innerHTML = '';
  
  for (let i = 0; i < 5; i++) {
      const div = document.createElement('div');
      if (i < savedState.cluesRevealed) {
          div.className = 'hint-item';
          div.innerText = todayPuzzle.pistas[i];
      } else {
          div.className = 'hint-item locked';
          div.innerText = "Contenido oculto";
      }
      hintsContainer.appendChild(div);
  }

  if (savedState.cluesRevealed >= 5 || savedState.status !== 'playing') {
      btnPedirPista.disabled = true;
  } else {
      btnPedirPista.disabled = false;
  }
  
  if (feedbackMsg) {
      feedbackContainer.classList.remove('hidden');
      mensajePista.innerText = feedbackMsg;
  }
  
  if (savedState.status !== 'playing') {
      btnEnviar.disabled = true;
      buscador.disabled = true;
      btnPedirPista.disabled = true;
      setTimeout(showReview, 2500);
  }
}