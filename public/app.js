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
  settings: {
    categories: [],
    rounds_count: 5,
    countdown_seconds: 10,
    review_duration_seconds: 35,
    allow_difficult_letters: false,
    bonus_sole_answer: true,
    language_mode: 'both',
  },
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

// Offline fallback dictionary subset (Spanish)
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

// Offline fallback dictionary subset (English)
const OFFLINE_DICT_EN = {
  A: { nombre: 'Alexander', apellido: 'Adams', pais_ciudad: 'Amsterdam', animal: 'Alligator', fruta_comida: 'Apple', cosa_objeto: 'Anchor', color: 'Amber', flor_planta: 'Azalea' },
  B: { nombre: 'Benjamin', apellido: 'Brown', pais_ciudad: 'Boston', animal: 'Bear', fruta_comida: 'Banana', cosa_objeto: 'Bottle', color: 'Blue', flor_planta: 'Begonia' },
  C: { nombre: 'Christopher', apellido: 'Clark', pais_ciudad: 'Chicago', animal: 'Camel', fruta_comida: 'Cherry', cosa_objeto: 'Clock', color: 'Cyan', flor_planta: 'Clover' },
  D: { nombre: 'David', apellido: 'Davis', pais_ciudad: 'Denver', animal: 'Dolphin', fruta_comida: 'Date', cosa_objeto: 'Desk', color: 'Dark blue', flor_planta: 'Daisy' },
  E: { nombre: 'Edward', apellido: 'Evans', pais_ciudad: 'Edinburgh', animal: 'Elephant', fruta_comida: 'Eggplant', cosa_objeto: 'Eraser', color: 'Emerald', flor_planta: 'Elderberry' },
  F: { nombre: 'Frank', apellido: 'Fisher', pais_ciudad: 'Florence', animal: 'Falcon', fruta_comida: 'Fig', cosa_objeto: 'Fork', color: 'Fuchsia', flor_planta: 'Fern' },
  G: { nombre: 'George', apellido: 'Garcia', pais_ciudad: 'Geneva', animal: 'Giraffe', fruta_comida: 'Grape', cosa_objeto: 'Guitar', color: 'Green', flor_planta: 'Geranium' },
  H: { nombre: 'Henry', apellido: 'Harris', pais_ciudad: 'Houston', animal: 'Hawk', fruta_comida: 'Hazelnut', cosa_objeto: 'Hammer', color: 'Hazel', flor_planta: 'Hydrangea' },
  I: { nombre: 'Ian', apellido: 'Ingram', pais_ciudad: 'Istanbul', animal: 'Iguana', fruta_comida: 'Ice cream', cosa_objeto: 'Iron', color: 'Indigo', flor_planta: 'Iris' },
  J: { nombre: 'James', apellido: 'Johnson', pais_ciudad: 'Jakarta', animal: 'Jaguar', fruta_comida: 'Jam', cosa_objeto: 'Jar', color: 'Jade', flor_planta: 'Jasmine' },
  L: { nombre: 'Lucas', apellido: 'Lewis', pais_ciudad: 'London', animal: 'Lion', fruta_comida: 'Lemon', cosa_objeto: 'Lamp', color: 'Lime', flor_planta: 'Lily' },
  M: { nombre: 'Michael', apellido: 'Miller', pais_ciudad: 'Madrid', animal: 'Monkey', fruta_comida: 'Mango', cosa_objeto: 'Mirror', color: 'Magenta', flor_planta: 'Magnolia' },
  N: { nombre: 'Noah', apellido: 'Nelson', pais_ciudad: 'New York', animal: 'Newt', fruta_comida: 'Nutmeg', cosa_objeto: 'Needle', color: 'Navy', flor_planta: 'Narcissus' },
  O: { nombre: 'Oliver', apellido: 'Owens', pais_ciudad: 'Orlando', animal: 'Owl', fruta_comida: 'Orange', cosa_objeto: 'Oven', color: 'Olive', flor_planta: 'Orchid' },
  P: { nombre: 'Peter', apellido: 'Parker', pais_ciudad: 'Paris', animal: 'Penguin', fruta_comida: 'Peach', cosa_objeto: 'Pencil', color: 'Pink', flor_planta: 'Poppy' },
  R: { nombre: 'Robert', apellido: 'Roberts', pais_ciudad: 'Rome', animal: 'Rabbit', fruta_comida: 'Raspberry', cosa_objeto: 'Ruler', color: 'Red', flor_planta: 'Rose' },
  S: { nombre: 'Samuel', apellido: 'Smith', pais_ciudad: 'Sydney', animal: 'Snake', fruta_comida: 'Strawberry', cosa_objeto: 'Spoon', color: 'Silver', flor_planta: 'Sunflower' },
  T: { nombre: 'Thomas', apellido: 'Taylor', pais_ciudad: 'Toronto', animal: 'Tiger', fruta_comida: 'Tomato', cosa_objeto: 'Table', color: 'Teal', flor_planta: 'Tulip' },
  V: { nombre: 'Victor', apellido: 'Vance', pais_ciudad: 'Vienna', animal: 'Vulture', fruta_comida: 'Vanilla', cosa_objeto: 'Vase', color: 'Violet', flor_planta: 'Verbena' },
};

// DOM References
const views = {
  welcome: document.getElementById('view-welcome'),
  lobby: document.getElementById('view-lobby'),
  playing: document.getElementById('view-playing'),
  review: document.getElementById('view-review'),
  gameover: document.getElementById('view-gameover'),
};

function initApp() {
  bindUIEvents();
  setupURLParameters();
  initTheme();
  renderQuipChips();
  showView('welcome');
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

  function requirePlayerName() {
    const input = document.getElementById('input-player-name');
    const errorEl = document.getElementById('player-name-error');
    const name = input ? input.value.trim() : '';

    if (!name) {
      if (input) {
        input.classList.remove('shake');
        void input.offsetWidth; // trigger reflow
        input.classList.add('input-error', 'shake');
        input.focus();
      }
      if (errorEl) {
        errorEl.style.display = 'flex';
      }
      if (window.soundFX && soundFX.playVoteChime) {
        soundFX.playVoteChime(false);
      }
      return null;
    }

    if (input) {
      input.classList.remove('input-error', 'shake');
    }
    if (errorEl) {
      errorEl.style.display = 'none';
    }
    return name;
  }

  const inputPlayerName = document.getElementById('input-player-name');
  if (inputPlayerName) {
    inputPlayerName.addEventListener('input', () => {
      if (inputPlayerName.value.trim()) {
        inputPlayerName.classList.remove('input-error', 'shake');
        const errorEl = document.getElementById('player-name-error');
        if (errorEl) errorEl.style.display = 'none';
      }
    });
    inputPlayerName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const tabCreate = document.getElementById('tab-create');
        if (tabCreate && tabCreate.classList.contains('active')) {
          document.getElementById('btn-create-room')?.click();
        } else {
          document.getElementById('input-room-code')?.focus();
        }
      }
    });
  }

  // Welcome Tabs: Crear Sala vs Unirse a Sala
  const tabCreate = document.getElementById('tab-create');
  const tabJoin = document.getElementById('tab-join');
  const panelCreate = document.getElementById('panel-create');
  const panelJoin = document.getElementById('panel-join');

  if (tabCreate && tabJoin) {
    tabCreate.addEventListener('click', () => {
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
      if (panelCreate) panelCreate.style.display = 'block';
      if (panelJoin) panelJoin.style.display = 'none';
    });

    tabJoin.addEventListener('click', () => {
      tabJoin.classList.add('active');
      tabCreate.classList.remove('active');
      if (panelCreate) panelCreate.style.display = 'none';
      if (panelJoin) panelJoin.style.display = 'block';
      document.getElementById('input-room-code')?.focus();
    });
  }

  // Room Code Input Validation
  const inputRoomCode = document.getElementById('input-room-code');
  if (inputRoomCode) {
    inputRoomCode.addEventListener('input', () => {
      if (inputRoomCode.value.trim()) {
        inputRoomCode.classList.remove('input-error', 'shake');
        const codeError = document.getElementById('room-code-error');
        if (codeError) codeError.style.display = 'none';
      }
    });
    inputRoomCode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-join-room')?.click();
      }
    });
  }

  // Create Room
  document.getElementById('btn-create-room').addEventListener('click', () => {
    const name = requirePlayerName();
    if (!name) return;
    state.playerName = name;

    const langSelect = document.getElementById('select-language-mode');
    if (langSelect) state.settings.language_mode = langSelect.value;
    const roundsSelect = document.getElementById('select-rounds-count');
    if (roundsSelect) {
      state.settings.rounds_count = parseInt(roundsSelect.value, 10);
      state.totalRounds = state.settings.rounds_count;
    }
    const countdownSelect = document.getElementById('select-countdown');
    if (countdownSelect) state.settings.countdown_seconds = parseInt(countdownSelect.value, 10);

    createOrJoinRoom(null);
  });

  // Join Room
  document.getElementById('btn-join-room').addEventListener('click', () => {
    const name = requirePlayerName();
    if (!name) return;
    const code = inputRoomCode ? inputRoomCode.value.trim().toUpperCase() : '';
    const codeError = document.getElementById('room-code-error');

    if (!code) {
      if (inputRoomCode) {
        inputRoomCode.classList.remove('shake');
        void inputRoomCode.offsetWidth;
        inputRoomCode.classList.add('input-error', 'shake');
        inputRoomCode.focus();
      }
      if (codeError) codeError.style.display = 'flex';
      if (window.soundFX && soundFX.playVoteChime) soundFX.playVoteChime(false);
      return;
    }

    if (inputRoomCode) inputRoomCode.classList.remove('input-error', 'shake');
    if (codeError) codeError.style.display = 'none';

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
  const btnCopyLink = document.getElementById('btn-copy-link');
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', copyRoomLink);
  }

  // Copy Room Code
  const btnCopyCode = document.getElementById('btn-copy-code');
  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', copyRoomCode);
  }

  // Leave Lobby
  const btnLeaveLobby = document.getElementById('btn-leave-lobby');
  if (btnLeaveLobby) {
    btnLeaveLobby.addEventListener('click', () => {
      if (confirm('¿Deseas salir de la sala de espera y volver al inicio?')) {
        if (state.ws) {
          state.ws.close();
          state.ws = null;
        }
        state.roomCode = '';
        state.isHost = false;
        state.players = [];
        showView('welcome');
      }
    });
  }

  // Language Mode Selector
  const selectLang = document.getElementById('select-language-mode');
  if (selectLang) {
    selectLang.addEventListener('change', (e) => {
      const mode = e.target.value;
      state.settings.language_mode = mode;
      if (useOfflineEngine) {
        console.log('Language mode updated (offline):', mode);
      } else if (state.isHost) {
        sendWSMessage({
          type: 'update_settings',
          settings: state.settings,
        });
      }
    });
  }

  // QR Code Modal
  document.getElementById('btn-qr-invite').addEventListener('click', showQRModal);
  document.getElementById('btn-close-qr').addEventListener('click', () => {
    document.getElementById('modal-qr').classList.add('hidden');
  });

  // Download Trophy Image
  document.getElementById('btn-download-trophy').addEventListener('click', generateTrophyImage);

  // Initialize funny yell quip chips
  renderQuipChips();
}

function setupURLParameters() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) {
    const tabJoin = document.getElementById('tab-join');
    if (tabJoin) tabJoin.click();
    const inputCode = document.getElementById('input-room-code');
    if (inputCode) inputCode.value = room.toUpperCase();
    document.getElementById('input-player-name')?.focus();
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
    case 'chat_quip':
      if (msg.player_name !== state.playerName) {
        showQuipToast(msg.player_name, msg.avatar || '🤠', msg.message);
      }
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
  if (serverState.settings) {
    state.settings = serverState.settings;
  }

  // Determine host status
  const me = state.players.find(p => p.name === state.playerName && !p.is_bot);
  if (me) {
    state.playerId = me.id;
    state.isHost = me.is_host;
  }

  // Update Language Mode selector
  const selectLang = document.getElementById('select-language-mode');
  if (selectLang && state.settings && state.settings.language_mode) {
    selectLang.value = state.settings.language_mode;
    selectLang.disabled = !state.isHost;
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
  const codeEl = document.getElementById('lobby-room-code');
  if (codeEl) codeEl.textContent = state.roomCode || '------';

  const countEl = document.getElementById('lobby-player-count');
  if (countEl) countEl.textContent = state.players.length;

  const listEl = document.getElementById('lobby-players-list');
  if (listEl) {
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
  }

  // Update room settings badges
  const langLabel = document.getElementById('lobby-lang-label');
  if (langLabel && state.settings) {
    const mode = state.settings.language_mode;
    langLabel.textContent = mode === 'es' ? 'Solo Español 🇲🇽' : mode === 'en' ? 'Only English 🇺🇸' : 'Español & English 🇲🇽 🇺🇸';
  }
  const roundsLabel = document.getElementById('lobby-rounds-label');
  if (roundsLabel && state.settings) {
    roundsLabel.textContent = `${state.settings.rounds_count || 5} Rondas`;
  }

  const btnStart = document.getElementById('btn-start-game');
  if (btnStart) {
    btnStart.style.display = state.isHost ? 'flex' : 'none';
  }
  const waitingHint = document.getElementById('lobby-waiting-hint');
  if (waitingHint) {
    waitingHint.style.display = state.isHost ? 'none' : 'block';
  }
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

    input.addEventListener('focus', () => {
      setTimeout(() => {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        focusNextInput(cat.id);
      }
    });
  });

  // Dedicated bottom spacer to ensure the last input is 100% visible and unblocked
  const spacer = document.createElement('div');
  spacer.className = 'sheet-bottom-spacer';
  container.appendChild(spacer);

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
      const ptsClass = pEval.points === 200 ? 'p200' : pEval.points === 100 ? 'p100' : pEval.points === 50 ? 'p50' : pEval.points === 25 ? 'p25' : pEval.points === 10 ? 'p10' : 'p0';

      let statusBadge = '';
      if (pEval.status === 'duplicate') {
        statusBadge = `<span class="status-badge duplicate" title="Palabra repetida con otros jugadores">Repetida (${pEval.points} pts)</span>`;
      } else if (pEval.status === 'sole_survivor') {
        statusBadge = '<span class="status-badge sole" title="Única respuesta válida en toda la sala">¡Única! (+200 pts)</span>';
      } else if (pEval.status === 'fuzzy') {
        statusBadge = `<span class="status-badge fuzzy" title="Aceptada por similitud con ${escapeHTML(pEval.matched || '')}">Ortografía aceptada (${escapeHTML(pEval.matched || '')})</span>`;
      } else if (pEval.status === 'invalid') {
        statusBadge = '<span class="status-badge invalid" title="Palabra no reconocida o inventada">Palabra no válida (0 pts)</span>';
      } else if (pEval.status === 'rejected') {
        statusBadge = '<span class="status-badge invalid" title="Palabra rechazada por votación">Rechazada (0 pts)</span>';
      } else if (pEval.status === 'disputed') {
        statusBadge = '<span class="status-badge disputed" title="Palabra en votación">En votación</span>';
      }

      answersHTML += `
        <div class="review-answer-row">
          <div class="player-word-box">
            <span class="player-avatar">${p.avatar}</span>
            <div>
              <div class="review-word ${!pEval.word ? 'empty' : ''}">${pEval.word ? escapeHTML(pEval.word) : '(en blanco)'} ${statusBadge}</div>
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
  const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(state.roomCode)}`;
  const btn = document.getElementById('btn-copy-link');
  navigator.clipboard.writeText(url).then(() => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ ¡Copiado!';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    } else {
      alert('¡Enlace de la sala copiado al portapapeles!');
    }
  }).catch(() => {
    prompt('Copia este enlace de sala:', url);
  });
}

function copyRoomCode() {
  if (!state.roomCode) return;
  const btn = document.getElementById('btn-copy-code');
  navigator.clipboard.writeText(state.roomCode).then(() => {
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ ¡Copiado!';
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    } else {
      alert('¡Código de sala copiado al portapapeles!');
    }
  }).catch(() => {
    prompt('Copia este código de sala:', state.roomCode);
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
  state.settings = {
    categories: DEFAULT_CATEGORIES,
    rounds_count: 5,
    countdown_seconds: 10,
    review_duration_seconds: 35,
    allow_difficult_letters: false,
    bonus_sole_answer: true,
    language_mode: document.getElementById('select-language-mode')?.value || 'both',
  };
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
  const botNames = ['🤖 La Chilindrina', '🤖 Quico', '🤖 Bob Smith', '🤖 Cantinflas'];
  const botAvatars = ['👧', '⚓', '🎩', '🎭'];
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

  // Bots wait 45 to 65 seconds before calling Basta, giving human players ample time!
  if (state.botBastaTimer) clearTimeout(state.botBastaTimer);
  const botDelay = 45000 + Math.floor(Math.random() * 20000);
  state.botBastaTimer = setTimeout(() => {
    if (state.phase === 'Playing') {
      const bots = state.players.filter(p => p.is_bot);
      const caller = bots.length > 0 ? bots[Math.floor(Math.random() * bots.length)].name : '🤖 El Chavo';
      offlineCallBasta(caller);
    }
  }, botDelay);
}

function offlineCallBasta(callerName = 'Tú') {
  if (state.phase !== 'Playing') return;
  if (state.botBastaTimer) clearTimeout(state.botBastaTimer);
  state.phase = 'BastaCountdown';
  window.soundFX.playBastaAlarm();
  showBastaNotification(callerName);

  // Show a funny quip shout from the caller
  const callerObj = state.players.find(p => p.name === callerName);
  const avatar = callerObj ? callerObj.avatar : (callerName === 'Tú' ? (state.players.find(p => p.id === state.playerId)?.avatar || '🤠') : '🗣️');
  showQuipToast(callerName, avatar, '¡Basta para mí, basta para todos! 🛑');

  // Bots react to the basta call!
  if (state.players.some(p => p.is_bot)) {
    triggerBotQuipReaction();
  }

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

// ==========================================
// FUNNY YELLS & PRE-WRITTEN QUIPS (GRITOS)
// ==========================================
const BASTA_QUIPS = [
  { label: '🏃 ¡Córranle!', text: '¡Córranle que ya acabé! 🏃💨' },
  { label: '✏️ ¡Lápiz arriba!', text: '¡Lápiz arriba, manos a la cabeza! ✏️🙌' },
  { label: '🛑 ¡Basta para todos!', text: '¡Basta para mí, basta para todos! 🛑' },
  { label: '🙈 ¡No supe una!', text: '¡En una no supe qué poner! 🙈😅' },
  { label: '🧠 ¡Mente en blanco!', text: '¡Se me fue la mente en blanco! 🧠💨' },
  { label: '🤞 ¡A ver si pasa!', text: '¡A ver si no me la cancelan! 🤞😂' },
  { label: '🤨 ¡Ni existe!', text: '¡Esa palabra ni existe! 🤨🔍' },
  { label: '📜 ¡No inventes!', text: '¡El que inventa no gana! 📜❌' },
  { label: '🧐 ¡Con lupa!', text: '¡Con lupa te la vamos a revisar! 🧐' },
  { label: '⏰ ¡Tic tac!', text: '¡Tic tac, se les acaba el tiempo! ⏰🔥' },
  { label: '💅 ¡Pura calidad!', text: '¡Puras respuestas de calidad aquí! 💅✨' },
  { label: '⏳ Hurry up!', text: '¡Hurry up, time is ticking! ⏳⚡' },
  { label: '🙃 I blanked!', text: '¡I totally blanked on one! 🙃' },
];

const BOT_QUIP_REACTIONS = {
  'Don Ramón': [
    '¡No te doy otra nomás porque...! 🥊',
    '¡Con permisito, dijo Monchito! 🧢',
    '¡Yo le voy al Necaxa! ⚽',
    '¡Tenía que ser el Chavo del 8! 🙄',
  ],
  'El Chavo': [
    '¡Fue sin querer queriendo! 📦',
    '¡Se me chispoteó! 🙈',
    '¡Es que no me tienen paciencia! 🥺',
    '¡Eso, eso, eso! 👍',
  ],
  'Cantinflas': [
    '¡Ahí está el detalle, chato! 🎩',
    '¡Ni hablar, mujer, traes puñal! 🎭',
    '¡Estamos en lo dicho o qué fue! 🥸',
    '¡Por ahí hubieras empezado! 🗣️',
  ],
  'Sor Juana': [
    'Hombres necios que acusáis a la mujer sin razón... 📜',
    '¡Que con ingenio y gracia las palabras fluyan! ✨',
    '¡Esa rima ni en el convento la aceptan! 🪶',
  ],
  'Frida Kahlo': [
    '¡Pies para qué los quiero si tengo alas pa\' volar! 🌺',
    '¡Viva la vida y viva el Basta! 🎨',
    '¡Puro color y nada de trampa! 🖌️',
  ],
  'El Chapulín': [
    '¡Que no cunda el pánico! 🪓',
    '¡No contaban con mi astucia! 🦗',
    '¡Mis antenitas de vinil detectan presión! 📡',
  ],
  'default': [
    '¡Ay caramba, qué rápido! ⚡',
    '¡Esa palabra está muy sospechosa! 🤨',
    '¡Apúrense que se va el tren! 🚂',
    '¡Revisen bien esa respuesta! 🔍',
  ],
};

function renderQuipChips() {
  const containers = [
    document.getElementById('quips-chips-playing'),
    document.getElementById('quips-chips-review'),
  ];

  containers.forEach(container => {
    if (!container) return;
    container.innerHTML = '';
    BASTA_QUIPS.forEach(q => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'quip-chip';
      chip.innerText = q.label;
      chip.title = q.text;
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        sendQuip(q.text);
      });
      container.appendChild(chip);
    });
  });
}

function sendQuip(text) {
  if (!text) return;
  const myPlayer = state.players.find(p => p.id === state.playerId);
  const myAvatar = myPlayer?.avatar || '🤠';
  const myName = state.playerName || 'Tú';

  if (!useOfflineEngine && state.ws && state.ws.readyState === WebSocket.OPEN) {
    sendWSMessage({
      type: 'send_quip',
      message: text,
    });
  }

  showQuipToast(myName, myAvatar, text);

  // In offline mode, bots react to quips
  if (useOfflineEngine && state.players.some(p => p.is_bot)) {
    triggerBotQuipReaction();
  }
}

function triggerBotQuipReaction() {
  const bots = state.players.filter(p => p.is_bot);
  if (bots.length === 0) return;
  const bot = bots[Math.floor(Math.random() * bots.length)];
  const delay = 1200 + Math.random() * 1800;
  setTimeout(() => {
    if (state.phase !== 'Playing' && state.phase !== 'BastaCountdown' && state.phase !== 'Review') return;
    const pool = BOT_QUIP_REACTIONS[bot.name] || BOT_QUIP_REACTIONS['default'];
    const reaction = pool[Math.floor(Math.random() * pool.length)];
    showQuipToast(bot.name, bot.avatar, reaction);
  }, delay);
}

function showQuipToast(sender, avatar, text) {
  const container = document.getElementById('quip-toast-container');
  if (!container) return;

  if (window.soundFX && soundFX.playLetterTick) {
    soundFX.playLetterTick();
  }

  while (container.children.length >= 3) {
    container.removeChild(container.firstChild);
  }

  const toast = document.createElement('div');
  toast.className = 'quip-toast';
  toast.innerHTML = `
    <span class="quip-avatar">${escapeHTML(avatar || '🗣️')}</span>
    <div class="quip-body">
      <span class="quip-sender">${escapeHTML(sender)}</span>
      <span class="quip-text">${escapeHTML(text)}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 320);
  }, 3800);
}

// Levenshtein distance algorithm for fuzzy matching
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

// Gibberish detector: rejects consecutive identical characters (e.g. "fff") or vowel-less strings
function isGibberish(clean) {
  if (!clean || clean.length < 2) return true;

  // 3 or more identical consecutive characters (e.g. "fff", "aaa", "zzz")
  if (/([a-z])\1\1/i.test(clean)) return true;

  // Words of length >= 4 with no vowels at all (e.g. "sdfg", "qwrty")
  if (clean.length >= 4 && !/[aeiouyáéíóúü]/i.test(clean)) return true;

  return false;
}

// Client-side dictionary validation with fuzzy matching
function validateWordClient(categoryId, rawWord, letter, langMode = 'both') {
  const clean = normalizeWord(rawWord);
  if (!clean || clean.length < 2) {
    return { valid: false, status: 'empty', reason: 'Palabra vacía' };
  }

  if (normalizeLetter(clean[0]) !== normalizeLetter(letter)) {
    return { valid: false, status: 'wrong_letter', reason: 'Letra incorrecta' };
  }

  if (isGibberish(clean)) {
    return { valid: false, status: 'invalid', reason: 'Palabra no válida' };
  }

  if (categoryId.startsWith('custom_')) {
    return { valid: true, status: 'valid', matched: rawWord };
  }

  const dictObj = typeof BASTA_DICTIONARY !== 'undefined' ? BASTA_DICTIONARY : null;
  let wordList = [];
  if (dictObj) {
    if (langMode === 'es' || langMode === 'both') {
      wordList = wordList.concat(dictObj.es?.[categoryId] || []);
    }
    if (langMode === 'en' || langMode === 'both') {
      wordList = wordList.concat(dictObj.en?.[categoryId] || []);
    }
  }

  // Fallback to offline dict subsets if needed
  if (wordList.length === 0) {
    const esSingle = OFFLINE_DICT[letter]?.[categoryId];
    const enSingle = OFFLINE_DICT_EN[letter]?.[categoryId];
    if (esSingle) wordList.push(esSingle);
    if (enSingle) wordList.push(enSingle);
  }

  // Filter candidates starting with the letter
  const candidates = wordList.filter(w => normalizeLetter(w[0]) === normalizeLetter(letter));

  // 1. Exact match
  for (const dictWord of candidates) {
    if (normalizeWord(dictWord) === clean) {
      return { valid: true, status: 'valid', matched: dictWord, distance: 0 };
    }
  }

  // 2. Fuzzy match
  let bestMatch = null;
  let bestDist = 999;
  for (const dictWord of candidates) {
    const normDict = normalizeWord(dictWord);
    const dist = levenshteinDistance(clean, normDict);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = dictWord;
    }
  }

  // Strict fuzzy matching: only allow distance 1 for words >= 4 letters with matching length (+/- 1)
  // Eliminates false matches like "armando" to "armario" or "amanda"
  if (bestMatch && clean.length >= 4 && bestDist === 1 && Math.abs(clean.length - normalizeWord(bestMatch).length) <= 1) {
    return { valid: true, status: 'valid', matched: bestMatch, distance: 1, fuzzy: true };
  }

  // Not in dictionary and no fuzzy match -> Gibberish / invalid! 0 points!
  return { valid: false, status: 'invalid', reason: 'Palabra no encontrada' };
}

function offlineTriggerReview(callerName) {
  state.phase = 'Reviewing';
  const evaluations = {};
  const langMode = state.settings?.language_mode || 'both';

  // 1. Gather all words for all players
  const playerWords = {};
  state.players.forEach((p, idx) => {
    playerWords[p.id] = {};
    state.categories.forEach(cat => {
      let word = '';
      if (p.is_bot) {
        const dict = typeof BASTA_DICTIONARY !== 'undefined' ? BASTA_DICTIONARY : null;
        let esList = (dict?.es?.[cat.id] || []).filter(w => normalizeLetter(w[0]) === normalizeLetter(state.currentLetter));
        let enList = (dict?.en?.[cat.id] || []).filter(w => normalizeLetter(w[0]) === normalizeLetter(state.currentLetter));

        if (esList.length === 0 && OFFLINE_DICT[state.currentLetter]?.[cat.id]) {
          esList = [OFFLINE_DICT[state.currentLetter][cat.id]];
        }
        if (enList.length === 0 && OFFLINE_DICT_EN[state.currentLetter]?.[cat.id]) {
          enList = [OFFLINE_DICT_EN[state.currentLetter][cat.id]];
        }

        if (langMode === 'en' && enList.length > 0) {
          word = enList[Math.floor(Math.random() * enList.length)];
        } else if (langMode === 'es' && esList.length > 0) {
          word = esList[Math.floor(Math.random() * esList.length)];
        } else {
          const list = (idx % 2 === 0 && esList.length > 0) ? esList : (enList.length > 0 ? enList : esList);
          word = list.length > 0 ? list[Math.floor(Math.random() * list.length)] : '';
        }
      } else {
        word = state.answers[cat.id] || '';
      }
      playerWords[p.id][cat.id] = word.trim();
    });
  });

  // 2. Validate all words and count occurrences of valid words
  state.categories.forEach(cat => {
    const wordCounts = {};
    const validationResults = {};
    let validCount = 0;

    state.players.forEach(p => {
      const raw = playerWords[p.id][cat.id] || '';
      const v = validateWordClient(cat.id, raw, state.currentLetter, langMode);
      validationResults[p.id] = v;

      if (v.valid) {
        // Group by the actual normalized entered word so distinct words (e.g. "Armando" and "Amanda") are never merged!
        const key = normalizeWord(raw);
        wordCounts[key] = (wordCounts[key] || 0) + 1;
        validCount++;
      }
    });

    state.players.forEach(p => {
      if (!evaluations[p.id]) evaluations[p.id] = {};
      const raw = playerWords[p.id][cat.id] || '';
      const v = validationResults[p.id];

      let status = 'empty';
      let points = 0;

      if (!raw || raw.length === 0) {
        status = 'empty';
        points = 0;
      } else if (!v.valid) {
        // Gibberish like "fff" gets 0 points!
        status = v.status; // 'invalid' or 'wrong_letter'
        points = 0;
      } else {
        // Tiered duplicate scoring:
        // 1 person = 100 pts, 2 persons = 50 pts, 3 persons = 25 pts, 4+ persons = 10 pts!
        const key = normalizeWord(raw);
        const count = wordCounts[key] || 1;

        if (count === 1) {
          if (validCount === 1 && state.players.length > 1 && state.settings.bonus_sole_answer) {
            status = 'sole_survivor';
            points = 200;
          } else {
            status = v.fuzzy ? 'fuzzy' : 'valid';
            points = 100;
          }
        } else if (count === 2) {
          status = 'duplicate';
          points = 50;
        } else if (count === 3) {
          status = 'duplicate';
          points = 25;
        } else {
          status = 'duplicate';
          points = 10;
        }
      }

      evaluations[p.id][cat.id] = {
        word: raw,
        points: points,
        status: status,
        matched: v.matched || raw,
        fuzzy: !!v.fuzzy,
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
    pEval.points = pEval.points > 0 ? pEval.points : 100;
  }

  // Recalculate round points
  state.players.forEach(p => {
    const total = Object.values(state.latestReview.evaluations[p.id]).reduce((sum, e) => sum + e.points, 0);
    state.latestReview.round_points[p.id] = total;
  });

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
function normalizeWord(s) {
  if (!s) return '';
  return s.trim().toLowerCase().split('').map(normalizeLetter).join('');
}

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
