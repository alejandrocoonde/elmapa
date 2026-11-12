let todayKey = "";
let todayPuzzle = null;
let paises = [];

let savedState = JSON.parse(localStorage.getItem('elmapaTodayState')) || {
  date: "", guessed: [], fails: 0, status: 'playing' 
};

const archiveView = document.getElementById('archive-view');
const gameView = document.getElementById('game-view');
const reviewView = document.getElementById('review-view');
const dailyActionContainer = document.getElementById('daily-action-container');
const buscador = document.getElementById('buscador');
const autocompletarLista = document.getElementById('autocompletar-lista');
const btnEnviar = document.getElementById('btn-enviar');
const feedbackContainer = document.getElementById('feedback-container');
const mensajePista = document.getElementById('mensaje-pista');
const brujula = document.getElementById('brujula');
const flecha = document.getElementById('flecha');
const livesDisplay = document.getElementById('lives-display');

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
      savedState = { date: todayKey, guessed: [], fails: 0, status: 'playing' };
      saveState();
    }
    
    document.getElementById('pregunta-texto').innerText = todayPuzzle.pregunta;
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
        updateUI();
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
      <p style="font-size:1.8rem; font-weight:bold; color: ${isWon ? 'var(--success)' : 'var(--danger)'};">${isWon ? '✨ ¡ACERTASTE!' : '💀 SIN VIDAS'}</p>
      <p style="font-size:3rem; font-weight:bold; margin: 10px 0; text-transform:uppercase; color: var(--text);">${todayPuzzle.respuesta}</p>
      <p style="font-size:1.3rem; text-transform:none; color: var(--text);"><strong>Pregunta:</strong> ${todayPuzzle.pregunta}</p>
      
      <div style="background: var(--bg); padding: 10px; border: 2px solid #000; border-radius: 4px; color: var(--text); margin-top: 15px;">
        <p style="font-size:1.3rem; margin-top:5px;">Fallos cometidos: <strong>${savedState.fails} / 3</strong></p>
      </div>
    </div>
  `;
}

document.getElementById('btn-share').onclick = () => {
  const isWon = savedState.status === 'won';
  const vidas = 3 - savedState.fails;
  const text = `EL MAPA - RETO DE HOY ${isWon ? '🏆' : '💀'}\n\n` +
               `Vidas restantes: ${'💚'.repeat(Math.max(0, vidas))}${'🖤'.repeat(savedState.fails)}\n\n` +
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
  } else {
    savedState.fails++;
    if (savedState.fails >= 3) {
      savedState.status = 'lost';
    }
  }
  saveState();
  updateUI(paisIntento);
};

function updateUI(ultimoIntento = null) {
  const vidas = Math.max(0, 3 - savedState.fails);
  livesDisplay.textContent = '💚'.repeat(vidas) + '🖤'.repeat(3 - vidas);
  
  if (savedState.status !== 'playing') {
    if(ultimoIntento) {
        feedbackContainer.classList.remove('hidden');
        brujula.classList.add('hidden');
        if(savedState.status === 'won') {
            mensajePista.innerHTML = `🎉 ¡CORRECTO! Era <strong>${todayPuzzle.respuesta}</strong>.`;
        } else {
            mensajePista.innerHTML = `💀 Sin vidas. Era <strong>${todayPuzzle.respuesta}</strong>.`;
        }
    }
    setTimeout(showReview, 2000);
    return;
  }
  
  if (ultimoIntento && savedState.status === 'playing') {
    const correcto = paises.find(p => p.nombre.toLowerCase() === todayPuzzle.respuesta.toLowerCase());
    feedbackContainer.classList.remove('hidden');
    brujula.classList.add('hidden');
    
    if (savedState.fails === 1) {
      if (ultimoIntento.continente === correcto.continente) {
        mensajePista.innerHTML = `❌ Fallo. Pero vas bien: ¡está en <strong>${ultimoIntento.continente}</strong>!`;
      } else {
        mensajePista.innerHTML = `❌ Fallo. No está en <strong>${ultimoIntento.continente}</strong>.`;
      }
    } else if (savedState.fails === 2) {
      const angulo = calcularRumbo(ultimoIntento.lat, ultimoIntento.lon, correcto.lat, correcto.lon);
      const dir = obtenerDireccion(angulo);
      mensajePista.innerHTML = `❌ Fallo 2. El país correcto está al <strong>${dir}</strong> de ${ultimoIntento.nombre}.`;
      brujula.classList.remove('hidden');
      
      flecha.style.transform = `rotate(0deg)`;
      setTimeout(() => {
          flecha.style.transform = `rotate(${angulo}deg)`;
      }, 50);
    }
  }
}

function calcularRumbo(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const toDeg = x => x * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  lat1 = toRad(lat1); lat2 = toRad(lat2);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function obtenerDireccion(grados) {
  const dirs = ["Norte", "Noreste", "Este", "Sureste", "Sur", "Suroeste", "Oeste", "Noroeste"];
  return dirs[Math.round(grados / 45) % 8];
}