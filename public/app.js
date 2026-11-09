// =============================================================================
// ✏️ Basta Mexicano Client Engine (Multiplayer WebSockets & Standalone Offline)
// =============================================================================

let useOfflineEngine = false;

// Application State
const state = {
  roomCode: '',
  playerId: '',
  playerName: '',
  playerAvatar: '🤠',
  isHost: false,
  phase: 'Lobby',
  currentRound: 0,
  totalRounds: 5,
  currentLetter: '',
  categories: [],
  players: [],
  answers: {},
  latestReview: null,
  history: [],
  countdownRemaining: null,
  reviewRemaining: null,
  ws: null,
  pingInterval: null,
};

// Default Mexican Categories
const DEFAULT_CATEGORIES = [
  { id: 'nombre', name: 'Nombre', icon: '👤', desc: 'Nombre de persona' },
  { id: 'apellido', name: 'Apellido', icon: '📜', desc: 'Apellido común' },
  { id: 'pais_ciudad', name: 'País o Ciudad', icon: '🌎', desc: 'País, estado o ciudad' },
  { id: 'animal', name: 'Animal', icon: '🐾', desc: 'Cualquier animal' },
  { id: 'fruta_comida', name: 'Fruta o Alimento', icon: '🥑', desc: 'Fruta, platillo o bebida' },
  { id: 'cosa_objeto', name: 'Cosa u Objeto', icon: '📦', desc: 'Objeto cotidiano' },
  { id: 'color', name: 'Color', icon: '🎨', desc: 'Color o tono' },
  { id: 'flor_planta', name: 'Flor o Planta', icon: '🌻', desc: 'Flor o hierba' },
];

// Offline fallback dictionary subset
const OFFLINE_DICT = {
  A: { nombre: 'Alejandro', apellido: 'Álvarez', pais_ciudad: 'Argentina', animal: 'Águila', fruta_comida: 'Aguacate', cosa_objeto: 'Anillo', color: 'Amarillo', flor_planta: 'Azucena' },
  B: { nombre: 'Beatriz', apellido: 'Benítez', pais_ciudad: 'Brasil', animal: 'Ballena', fruta_comida: 'Banana', cosa_objeto: 'Botella', color: 'Blanco', flor_planta: 'Begonia' },
  C: { nombre: 'Carlos', apellido: 'Castro', pais_ciudad: 'Colombia', animal: 'Caballo', fruta_comida: 'Cereza', cosa_objeto: 'Cuchara', color: 'Celeste', flor_planta: 'Clavel' },
  D: { nombre: 'Daniel', apellido: 'Díaz', pais_ciudad: 'Dinamarca', animal: 'Delfín', fruta_comida: 'Durazno', cosa_objeto: 'Dado', color: 'Dorado', flor_planta: 'Dalia' },
  E: { nombre: 'Elena', apellido: 'Estrada', pais_ciudad: 'España', animal: 'Elefante', fruta_comida: 'Enchilada', cosa_objeto: 'Espejo', color: 'Esmeralda', flor_planta: 'Eucalipto' },
  F: { nombre: 'Fernando', apellido: 'Flores', pais_ciudad: 'Francia', animal: 'Foca', fruta_comida: 'Fresa', cosa_objeto: 'Foco', color: 'Fucsia', flor_planta: 'Flor de Nochebuena' },
  G: { nombre: 'Gabriel', apellido: 'García', pais_ciudad: 'Guatemala', animal: 'Gato', fruta_comida: 'Guayaba', cosa_objeto: 'Guitarra', color: 'Gris', flor_planta: 'Girasol' },
  H: { nombre: 'Héctor', apellido: 'Hernández', pais_ciudad: 'Honduras', animal: 'Halcón', fruta_comida: 'Higo', cosa_objeto: 'Hacha', color: 'Hueso', flor_planta: 'Hortensia' },
  I: { nombre: 'Ignacio', apellido: 'Ibarra', pais_ciudad: 'Italia', animal: 'Iguana', fruta_comida: 'Infusión', cosa_objeto: 'Imán', color: 'Índigo', flor_planta: 'Iris' },
  J: { nombre: 'Javier', apellido: 'Jiménez', pais_ciudad: 'Japón', animal: 'Jirafa', fruta_comida: 'Jícama', cosa_objeto: 'Jarrón', color: 'Jazmín', flor_planta: 'Jazmín' },
  L: { nombre: 'Luis', apellido: 'López', pais_ciudad: 'Londres', animal: 'León', fruta_comida: 'Limón', cosa_objeto: 'Lápiz', color: 'Lila', flor_planta: 'Lirio' },
  M: { nombre: 'María', apellido: 'Martínez', pais_ciudad: 'México', animal: 'Mono', fruta_comida: 'Mango', cosa_objeto: 'Mesa', color: 'Morado', flor_planta: 'Margarita' },
  N: { nombre: 'Natalia', apellido: 'Navarro', pais_ciudad: 'Noruega', animal: 'Nutria', fruta_comida: 'Naranja', cosa_objeto: 'Navaja', color: 'Negro', flor_planta: 'Nardo' },
  O: { nombre: 'Oscar', apellido: 'Ortiz', pais_ciudad: 'Oaxaca', animal: 'Oso', fruta_comida: 'Orégano', cosa_objeto: 'Olla', color: 'Ocre', flor_planta: 'Orquídea' },
  P: { nombre: 'Pablo', apellido: 'Pérez', pais_ciudad: 'Perú', animal: 'Perro', fruta_comida: 'Piña', cosa_objeto: 'Pelota', color: 'Plateado', flor_planta: 'Petunia' },
  R: { nombre: 'Rodrigo', apellido: 'Rodríguez', pais_ciudad: 'Rusia', animal: 'Ratón', fruta_comida: 'Rábanos', cosa_objeto: 'Reloj', color: 'Rojo', flor_planta: 'Rosa' },
  S: { nombre: 'Sofía', apellido: 'Sánchez', pais_ciudad: 'Suiza', animal: 'Serpiente', fruta_comida: 'Sandía', cosa_objeto: 'Silla', color: 'Salmón', flor_planta: 'Salvia' },
  T: { nombre: 'Tomás', apellido: 'Torres', pais_ciudad: 'Tokio', animal: 'Tigre', fruta_comida: 'Taco', cosa_objeto: 'Taza', color: 'Turquesa', flor_planta: 'Tulipán' },
  V: { nombre: 'Valentina', apellido: 'Vázquez', pais_ciudad: 'Venezuela', animal: 'Vaca', fruta_comida: 'Vainilla', cosa_objeto: 'Vaso', color: 'Verde', flor_planta: 'Violeta' },
};

// DOM References
const views = {
  lobby: document.getElementById('view-lobby'),
  playing: document.getElementById('view-playing'),
  review: document.getElementById('view-review'),
  gameover: document.getElementById('view-gameover'),
};

function initApp() {
  bindUIEvents();
  setupURLParameters();
  initTheme();
}

function bindUIEvents() {
  // Theme Toggle
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);

  // Audio Toggle
  const btnAudio = document.getElementById('btn-audio');
  btnAudio.addEventListener('click', () => {
    const isMuted = window.soundFX.toggleMute();
    btnAudio.textContent = isMuted ? '🔇' : '🔊';
  });

  // Avatar Picker
  document.querySelectorAll('.avatar-choice').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.avatar-choice').forEach(c => c.classList.remove('selected'));
      el.classList.add('selected');
      state.playerAvatar = el.dataset.avatar;
    });
  });

  // Create Room
  document.getElementById('btn-create-room').addEventListener('click', () => {
    const name = document.getElementById('input-player-name').value.trim() || 'Jugador 1';
    state.playerName = name;
    createOrJoinRoom(null);
  });

  // Join Room
  document.getElementById('btn-join-room').addEventListener('click', () => {
    const name = document.getElementById('input-player-name').value.trim() || 'Invitado';
    const code = document.getElementById('input-room-code').value.trim().toUpperCase();
    if (!code) {
      alert('Por favor ingresa un código de sala');
      return;
    }
    state.playerName = name;
    createOrJoinRoom(code);
  });

  // Add Bot
  document.getElementById('btn-add-bot').addEventListener('click', () => {
    if (useOfflineEngine) {
      offlineAddBot();
    } else {
      sendWSMessage({ type: 'add_bot' });
    }
  });

  // Start Game
  document.getElementById('btn-start-game').addEventListener('click', () => {
    if (useOfflineEngine) {
      offlineStartGame();
    } else {
      sendWSMessage({ type: 'start_game' });
    }
  });

  // Call Basta Button
  const btnBasta = document.getElementById('btn-basta-action');
  btnBasta.addEventListener('click', () => {
    triggerBastaCall();
  });

  // Next Round
  document.getElementById('btn-next-round').addEventListener('click', () => {
    if (useOfflineEngine) {
      offlineNextRound();
    } else {
      sendWSMessage({ type: 'next_round' });
    }
  });

  // Restart Game
  document.getElementById('btn-restart-game').addEventListener('click', () => {
    if (useOfflineEngine) {
      offlineRestart();
    } else {
      sendWSMessage({ type: 'restart_game' });
    }
  });

  // Copy Room Link
  document.getElementById('btn-copy-link').addEventListener('click', copyRoomLink);

  // QR Code Modal
  document.getElementById('btn-qr-invite').addEventListener('click', showQRModal);
  document.getElementById('btn-close-qr').addEventListener('click', () => {
    document.getElementById('modal-qr').classList.add('hidden');
  });

  // Download Trophy Image
  document.getElementById('btn-download-trophy').addEventListener('click', generateTrophyImage);
}

function setupURLParameters() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) {
    document.getElementById('input-room-code').value = room.toUpperCase();
  }
}

function initTheme() {
  const saved = localStorage.getItem('basta_theme') || 'cuaderno';
  document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
  const themes = ['cuaderno', 'feria', 'talavera'];
  const cur = document.documentElement.getAttribute('data-theme') || 'cuaderno';
  const next = themes[(themes.indexOf(cur) + 1) % themes.length];
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('basta_theme', next);
}

// Switch UI Views
function showView(viewName) {
  Object.values(views).forEach(v => v.classList.remove('active'));
  if (views[viewName]) {
    views[viewName].classList.add('active');
  }
}

// WebSocket Connection
function createOrJoinRoom(code) {
  if (useOfflineEngine) {
    offlineInitRoom(code);
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws?room=${encodeURIComponent(code || '')}&name=${encodeURIComponent(state.playerName)}&avatar=${encodeURIComponent(state.playerAvatar)}`;

  try {
    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
      console.log('Connected to Basta server');
      if (state.pingInterval) clearInterval(state.pingInterval);
      state.pingInterval = setInterval(() => sendWSMessage({ type: 'ping' }), 15000);
    };

    state.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (err) {
        console.error('Error parsing message', err);
      }
    };

    state.ws.onerror = () => {
      console.warn('WebSocket error, falling back to offline engine');
      switchToOffline();
    };

    state.ws.onclose = () => {
      console.log('WebSocket closed');
    };
  } catch (_) {
    switchToOffline();
  }
}

function sendWSMessage(msg) {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify(msg));
  }
}

function handleServerMessage(msg) {
  switch (msg.type) {
    case 'state':
      syncState(msg.data || msg);
      break;
    case 'basta_triggered':
      window.soundFX.playBastaAlarm();
      showBastaNotification(msg.caller_name);
      break;
    case 'timer_tick':
      updateTimerDisplay(msg.seconds_remaining, msg.phase);
      break;
    case 'error':
      alert(`Aviso: ${msg.message}`);
      break;
  }
}

function syncState(serverState) {
  state.roomCode = serverState.room_code;
  state.phase = serverState.phase;
  state.currentRound = serverState.current_round;
  state.totalRounds = serverState.total_rounds;
  state.currentLetter = serverState.current_letter || '';
  state.players = serverState.players || [];
  state.categories = serverState.settings?.categories || DEFAULT_CATEGORIES;
  state.latestReview = serverState.latest_round_review;
  state.history = serverState.history || [];

  // Determine host status
  const me = state.players.find(p => p.name === state.playerName && !p.is_bot);
  if (me) {
    state.playerId = me.id;
    state.isHost = me.is_host;
  }

  // Update Room Header
  document.getElementById('header-room-pill').textContent = `Sala: ${state.roomCode}`;

  // Update UI according to Phase
  switch (state.phase) {
    case 'Lobby':
      renderLobby();
      showView('lobby');
      break;
    case 'Playing':
    case 'BastaCountdown':
      renderActiveRound();
      showView('playing');
      break;
    case 'Reviewing':
      renderReview();
      showView('review');
      break;
    case 'GameOver':
      renderGameOver();
      showView('gameover');
      break;
  }
}

// Renderers
function renderLobby() {
  document.getElementById('lobby-room-code').textContent = state.roomCode;
  const listEl = document.getElementById('lobby-players-list');
  listEl.innerHTML = '';

  state.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-item';
    row.innerHTML = `
      <div class="player-info">
        <span class="player-avatar">${p.avatar}</span>
        <span class="player-name">${escapeHTML(p.name)}</span>
        ${p.is_bot ? '<span class="player-badge">BOT</span>' : ''}
        ${p.is_host ? '<span class="player-badge" style="background:#f59e0b">ANFITRIÓN</span>' : ''}
      </div>
      <div>
        <strong>${p.total_score} pts</strong>
      </div>
    `;
    listEl.appendChild(row);
  });

  const btnStart = document.getElementById('btn-start-game');
  btnStart.style.display = state.isHost ? 'flex' : 'none';
}

function renderActiveRound() {
  document.getElementById('hud-letter-stamp').textContent = state.currentLetter;
  document.getElementById('hud-round-label').textContent = `Ronda ${state.currentRound} de ${state.totalRounds}`;
  
  const container = document.getElementById('notebook-fields-container');
  container.innerHTML = '';

  state.categories.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'category-row';

    const val = state.answers[cat.id] || '';
    const hasValidLetter = val.length > 0 && normalizeLetter(val[0]) === normalizeLetter(state.currentLetter);

    row.innerHTML = `
      <div class="category-row-label">
        <span class="cat-title">${cat.icon} ${escapeHTML(cat.name)}</span>
        <span class="cat-check ${hasValidLetter ? 'visible' : ''}" id="check-${cat.id}">✓ Correcta</span>
      </div>
      <div class="category-input-wrap">
        <span class="cat-letter-prefix">${state.currentLetter}</span>
        <input 
          type="text" 
          class="category-input" 
          id="input-cat-${cat.id}" 
          data-cat="${cat.id}"
          placeholder="${cat.desc}..." 
          value="${escapeHTML(val)}"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
    `;
    container.appendChild(row);

    const input = row.querySelector('input');
    input.addEventListener('input', (e) => {
      window.soundFX.playPencilStroke();
      const text = e.target.value.trim();
      state.answers[cat.id] = text;

      // Update check indicator
      const checkEl = document.getElementById(`check-${cat.id}`);
      if (text.length > 0 && normalizeLetter(text[0]) === normalizeLetter(state.currentLetter)) {
        checkEl.classList.add('visible');
      } else {
        checkEl.classList.remove('visible');
      }

      // Live sync to server
      if (!useOfflineEngine) {
        sendWSMessage({
          type: 'submit_field',
          category_id: cat.id,
          text: text,
        });
      }

      checkBastaButtonState();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        focusNextInput(cat.id);
      }
    });
  });

  checkBastaButtonState();
}

function focusNextInput(currentCatId) {
  const index = state.categories.findIndex(c => c.id === currentCatId);
  if (index !== -1 && index + 1 < state.categories.length) {
    const nextCat = state.categories[index + 1];
    const nextEl = document.getElementById(`input-cat-${nextCat.id}`);
    if (nextEl) nextEl.focus();
  }
}

function checkBastaButtonState() {
  const filledCount = state.categories.filter(c => {
    const val = state.answers[c.id];
    return val && val.trim().length > 0;
  }).length;

  const btn = document.getElementById('btn-basta-action');
  if (filledCount >= state.categories.length) {
    btn.classList.add('ready-pulse');
    btn.innerHTML = '🔥 ¡¡BASTA PARA MÍ, BASTA PARA TODOS!!';
  } else {
    btn.classList.remove('ready-pulse');
    btn.innerHTML = `✏️ ¡¡BASTA!! (${filledCount}/${state.categories.length})`;
  }
}

function triggerBastaCall() {
  if (useOfflineEngine) {
    offlineCallBasta();
  } else {
    sendWSMessage({ type: 'call_basta' });
  }
}

function showBastaNotification(callerName) {
  const hud = document.getElementById('basta-alert-banner');
  hud.textContent = `🛑 ¡${callerName} HA GRITADO BASTA! TIEMPO CORRIENDO...`;
  hud.classList.remove('hidden');
  setTimeout(() => hud.classList.add('hidden'), 4000);
}

function updateTimerDisplay(seconds, phase) {
  const timerEl = document.getElementById('hud-timer-display');
  timerEl.textContent = `00:${seconds < 10 ? '0' : ''}${seconds}`;
  if (seconds <= 5) {
    timerEl.classList.add('urgent');
    window.soundFX.playClockTick(true);
  } else {
    timerEl.classList.remove('urgent');
    window.soundFX.playClockTick(false);
  }
}

// REVIEW & VOTING TABLE
function renderReview() {
  if (!state.latestReview) return;

  const rev = state.latestReview;
  document.getElementById('review-round-title').textContent = `Revisión: Ronda ${rev.round_number} (Letra "${rev.letter}")`;
  document.getElementById('review-caller-name').textContent = rev.caller_name ? `Gritó Basta: ${rev.caller_name}` : '';

  const grid = document.getElementById('review-grid-container');
  grid.innerHTML = '';

  state.categories.forEach(cat => {
    const catCard = document.createElement('div');
    catCard.className = 'review-category-card';

    let answersHTML = '';
    state.players.forEach(p => {
      const pEval = rev.evaluations[p.id]?.[cat.id] || {
        word: '',
        points: 0,
        status: 'empty',
        approvals: 0,
        voters: {},
      };

      const myVote = pEval.voters[state.playerId] || 0;
      const ptsClass = pEval.points === 200 ? 'p200' : pEval.points === 100 ? 'p100' : pEval.points === 50 ? 'p50' : 'p0';

      answersHTML += `
        <div class="review-answer-row">
          <div class="player-word-box">
            <span class="player-avatar">${p.avatar}</span>
            <div>
              <div class="review-word ${!pEval.word ? 'empty' : ''}">${pEval.word ? escapeHTML(pEval.word) : '(en blanco)'}</div>
              <small style="color:var(--text-muted)">${escapeHTML(p.name)}</small>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <span class="points-pill ${ptsClass}">+${pEval.points} pts</span>
            ${p.id !== state.playerId ? `
              <div class="vote-buttons">
                <button class="btn-vote ${myVote === 1 ? 'active-up' : ''}" onclick="voteAnswer('${p.id}', '${cat.id}', true)">👍</button>
                <button class="btn-vote ${myVote === -1 ? 'active-down' : ''}" onclick="voteAnswer('${p.id}', '${cat.id}', false)">👎</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    catCard.innerHTML = `
      <div class="review-cat-title">${cat.icon} ${escapeHTML(cat.name)}</div>
      <div class="review-answers-list">${answersHTML}</div>
    `;
    grid.appendChild(catCard);
  });

  const btnNext = document.getElementById('btn-next-round');
  btnNext.style.display = state.isHost ? 'flex' : 'none';
}

window.voteAnswer = function(targetPlayerId, categoryId, approve) {
  window.soundFX.playVoteChime(approve);
  if (useOfflineEngine) {
    offlineVote(targetPlayerId, categoryId, approve);
  } else {
    sendWSMessage({
      type: 'vote_answer',
      target_player_id: targetPlayerId,
      category_id: categoryId,
      approve: approve,
    });
  }
};

// PODIUM & GAME OVER
function renderGameOver() {
  window.soundFX.playVictoryFanfare();
  const sorted = [...state.players].sort((a, b) => b.total_score - a.total_score);

  const podiumEl = document.getElementById('podium-view-container');
  podiumEl.innerHTML = `
    <div class="podium-container">
      ${sorted[1] ? `
        <div class="podium-step p2">
          <div class="podium-player">
            <div class="podium-avatar">${sorted[1].avatar}</div>
            <div class="podium-name">${escapeHTML(sorted[1].name)}</div>
            <div class="podium-pts">${sorted[1].total_score} pts</div>
          </div>
          <div class="podium-block">2</div>
        </div>
      ` : ''}
      ${sorted[0] ? `
        <div class="podium-step p1">
          <div class="podium-player">
            <div class="podium-avatar">${sorted[0].avatar}</div>
            <div class="podium-name">${escapeHTML(sorted[0].name)} 👑</div>
            <div class="podium-pts">${sorted[0].total_score} pts</div>
          </div>
          <div class="podium-block">1</div>
        </div>
      ` : ''}
      ${sorted[2] ? `
        <div class="podium-step p3">
          <div class="podium-player">
            <div class="podium-avatar">${sorted[2].avatar}</div>
            <div class="podium-name">${escapeHTML(sorted[2].name)}</div>
            <div class="podium-pts">${sorted[2].total_score} pts</div>
          </div>
          <div class="podium-block">3</div>
        </div>
      ` : ''}
    </div>
  `;

  const btnRestart = document.getElementById('btn-restart-game');
  btnRestart.style.display = state.isHost ? 'flex' : 'none';
}

// Generate Canvas Trophy Card (800x1000 PNG)
function generateTrophyImage() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, 800, 1000);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#1e293b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 1000);

  // Decorative Mexican border
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, 760, 960);

  // Ribbon top
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  for (let i = 0; i < 800; i += 40) {
    ctx.fillStyle = colors[(i / 40) % colors.length];
    ctx.fillRect(i, 20, 40, 12);
  }

  // Header Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✏️ BASTA MEXICANO 🇲🇽', 400, 100);

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('TROFEO OFICIAL DE PALABRAS Y DESTREZA', 400, 140);

  // Podium Winners
  const sorted = [...state.players].sort((a, b) => b.total_score - a.total_score);
  let yPos = 240;

  sorted.slice(0, 5).forEach((p, idx) => {
    ctx.fillStyle = idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(80, yPos, 640, 90, 14);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${idx + 1}º ${p.avatar} ${p.name}`, 110, yPos + 55);

    ctx.textAlign = 'right';
    ctx.fillText(`${p.total_score} pts`, 690, yPos + 55);
    yPos += 115;
  });

  // Footer stamp
  ctx.fillStyle = '#64748b';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Sala: ${state.roomCode} • ${new Date().toLocaleDateString('es-MX')} • ¡Lápiz Quieto!`, 400, 920);

  // Trigger download
  const link = document.createElement('a');
  link.download = `Basta_Trofeo_${state.roomCode}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// QR Code and Share Links
function copyRoomLink() {
  const url = `${window.location.origin}${window.location.pathname}?room=${state.roomCode}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('¡Enlace de la sala copiado al portapapeles!');
  });
}

function showQRModal() {
  const url = `${window.location.origin}${window.location.pathname}?room=${state.roomCode}`;
  const frame = document.getElementById('qr-code-canvas-container');
  frame.innerHTML = '';
  if (window.QRCode) {
    new window.QRCode(frame, {
      text: url,
      width: 200,
      height: 200,
      colorDark: '#0f172a',
      colorLight: '#ffffff',
    });
  }
  document.getElementById('modal-qr').classList.remove('hidden');
}

// OFFLINE CLIENT ENGINE (FALLBACK / STANDALONE PREVIEW)
function switchToOffline() {
  useOfflineEngine = true;
  console.log('Switched to Standalone Offline Basta Engine');
  offlineInitRoom('SOLO1');
}

function offlineInitRoom(code) {
  state.roomCode = code || 'SOLO1';
  state.isHost = true;
  state.phase = 'Lobby';
  state.currentRound = 0;
  state.players = [
    {
      id: 'usr_me',
      name: state.playerName || 'Tú',
      avatar: state.playerAvatar,
      is_host: true,
      is_bot: false,
      total_score: 0,
    },
    {
      id: 'bot_chavo',
      name: '🤖 El Chavo',
      avatar: '🧢',
      is_host: false,
      is_bot: true,
      total_score: 0,
    },
    {
      id: 'bot_monchito',
      name: '🤖 Don Ramón',
      avatar: '🤠',
      is_host: false,
      is_bot: true,
      total_score: 0,
    },
  ];
  state.categories = DEFAULT_CATEGORIES;
  renderLobby();
  showView('lobby');
}

function offlineAddBot() {
  const botNames = ['🤖 La Chilindrina', '🤖 Quico', '🤖 Cantinflas', '🤖 El Santo'];
  const botAvatars = ['👧', '⚓', '🎭', '🦸‍♂️'];
  const curBots = state.players.filter(p => p.is_bot).length;
  if (curBots < botNames.length) {
    state.players.push({
      id: `bot_${Date.now()}`,
      name: botNames[curBots],
      avatar: botAvatars[curBots],
      is_host: false,
      is_bot: true,
      total_score: 0,
    });
    renderLobby();
  }
}

function offlineStartGame() {
  state.currentRound = 1;
  state.history = [];
  state.players.forEach(p => p.total_score = 0);
  offlineStartRound();
}

function offlineStartRound() {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'M', 'P', 'R', 'S', 'T'];
  state.currentLetter = letters[Math.floor(Math.random() * letters.length)];
  state.phase = 'Playing';
  state.answers = {};
  renderActiveRound();
  showView('playing');

  // Simulate bot typing delay
  setTimeout(() => {
    if (state.phase === 'Playing') {
      offlineCallBasta('🤖 El Chavo');
    }
  }, 22000);
}

function offlineCallBasta(callerName = 'Tú') {
  if (state.phase !== 'Playing') return;
  state.phase = 'BastaCountdown';
  window.soundFX.playBastaAlarm();
  showBastaNotification(callerName);

  let seconds = 10;
  updateTimerDisplay(seconds, 'BastaCountdown');
  const timer = setInterval(() => {
    seconds--;
    updateTimerDisplay(seconds, 'BastaCountdown');
    if (seconds <= 0) {
      clearInterval(timer);
      offlineTriggerReview(callerName);
    }
  }, 1000);
}

function offlineTriggerReview(callerName) {
  state.phase = 'Reviewing';
  const evaluations = {};

  state.players.forEach(p => {
    evaluations[p.id] = {};
    state.categories.forEach(cat => {
      let word = '';
      if (p.is_bot) {
        word = OFFLINE_DICT[state.currentLetter]?.[cat.id] || '';
      } else {
        word = state.answers[cat.id] || '';
      }

      const isValidLetter = word.length > 0 && normalizeLetter(word[0]) === normalizeLetter(state.currentLetter);
      const points = isValidLetter ? 100 : 0;

      evaluations[p.id][cat.id] = {
        word: word,
        points: points,
        status: isValidLetter ? 'valid' : 'empty',
        approvals: 0,
        voters: {},
      };
    });
  });

  const roundPoints = {};
  state.players.forEach(p => {
    const total = Object.values(evaluations[p.id]).reduce((sum, e) => sum + e.points, 0);
    roundPoints[p.id] = total;
  });

  state.latestReview = {
    round_number: state.currentRound,
    letter: state.currentLetter,
    caller_name: callerName,
    round_points: roundPoints,
    evaluations: evaluations,
  };

  renderReview();
  showView('review');
}

function offlineVote(targetPlayerId, categoryId, approve) {
  const pEval = state.latestReview.evaluations[targetPlayerId]?.[categoryId];
  if (!pEval) return;

  pEval.voters[state.playerId] = approve ? 1 : -1;
  pEval.approvals = approve ? 1 : -1;
  if (pEval.approvals < 0) {
    pEval.status = 'rejected';
    pEval.points = 0;
  } else {
    pEval.status = 'valid';
    pEval.points = 100;
  }
  renderReview();
}

function offlineNextRound() {
  if (state.latestReview) {
    state.players.forEach(p => {
      p.total_score += state.latestReview.round_points[p.id] || 0;
    });
  }

  if (state.currentRound >= state.totalRounds) {
    state.phase = 'GameOver';
    renderGameOver();
    showView('gameover');
  } else {
    state.currentRound++;
    offlineStartRound();
  }
}

function offlineRestart() {
  state.phase = 'Lobby';
  state.currentRound = 0;
  state.players.forEach(p => p.total_score = 0);
  renderLobby();
  showView('lobby');
}

// Helpers
function normalizeLetter(c) {
  if (!c) return '';
  const map = { 'á':'a', 'é':'e', 'í':'i', 'ó':'o', 'ú':'u', 'ü':'u' };
  const lower = c.toLowerCase();
  return map[lower] || lower;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[tag] || tag));
}

// Initialize on load
window.addEventListener('DOMContentLoaded', initApp);
