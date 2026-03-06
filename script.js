// --- SETTINGS ---
let settings = JSON.parse(localStorage.getItem('flip7_settings')) || {
    winThreshold: 200,
    f7Bonus: 15,
    cols: 2
};

function saveSettings() {
    localStorage.setItem('flip7_settings', JSON.stringify(settings));
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    // Sync sliders to current values
    const threshold = document.getElementById('settingWinThreshold');
    const bonus = document.getElementById('settingF7Bonus');
    const cols = document.getElementById('settingCols');
    threshold.value = settings.winThreshold;
    bonus.value = settings.f7Bonus;
    cols.value = settings.cols;
    document.getElementById('settingWinThresholdVal').textContent = settings.winThreshold;
    document.getElementById('settingF7BonusVal').textContent = settings.f7Bonus;
    document.getElementById('settingColsVal').textContent = settings.cols;
    modal.classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.add('hidden');
    saveSettings();
    render();
}

function handleOverlayClick(e) {
    if (e.target === e.currentTarget) closeSettings();
}

function syncSetting(key, value) {
    settings[key] = parseInt(value);
    document.getElementById('setting' + key.charAt(0).toUpperCase() + key.slice(1) + 'Val').textContent = value;
}

// --- STATE ---
let historyStack = [];

let state = JSON.parse(localStorage.getItem('flip7_V3.5_state')) || {
    players: [],
    gameStarted: false,
    round: 1,
    dealerIndex: 0
};

// --- DOM ---
const scoreboard = document.getElementById('scoreboard');
const setupPanel = document.getElementById('setupPanel');
const gamePanel = document.getElementById('gamePanel');
const roundCountSpan = document.getElementById('roundCount');
const statsFooter = document.getElementById('statsFooter');
const inputName = document.getElementById('newPlayerName');

// --- RENDER ENGINE ---
function render() {
    scoreboard.innerHTML = '';

    // Apply column setting
    scoreboard.className = 'grid';
    if (settings.cols === 1) scoreboard.classList.add('cols-1');
    else if (settings.cols === 3) scoreboard.classList.add('cols-3');

    // 1. Panels Logic (Ajout du bouton Revanche)
    if (state.gameStarted) {
        setupPanel.classList.add('hidden');
        gamePanel.innerHTML = `
            <div class="round-badge">MANCHE <span id="roundCount">${state.round}</span></div>
            <button class="start-btn" onclick="nextRound()">Manche Suivante >></button>
            <button class="btn-restart" onclick="restartGameKeepRoster()">🏆 Revanche</button>
            <button class="undo" onclick="undoLastAction()">◀️</button>
            <button class="danger" onclick="resetAll()">☠️ Reset Total</button>
        `;
        gamePanel.classList.remove('hidden');
    } else {
        setupPanel.classList.remove('hidden');
        gamePanel.classList.add('hidden');
    }

    // 2. Ranking Logic
    const sortedForRanking = [...state.players].sort((a, b) => b.score - a.score);

    // 3. Render Cards
    state.players.forEach((player, index) => {
        // Init wins if undefined (pour compatibilité)
        if (typeof player.wins === 'undefined') player.wins = 0;

        const currentRank = sortedForRanking.findIndex(p => p.id === player.id) + 1;
        const isWinner = player.score >= settings.winThreshold;

        // Dealer Logic
        const isDealer = state.gameStarted && (index === state.dealerIndex % state.players.length);
        const dealerBadge = isDealer ? `<div class="dealer-badge">DEALER</div>` : '';

        // Ghost Score
        let ghostScore = '';
        if (player.lastAdded !== undefined && player.lastAdded !== 0) {
            const val = player.lastAdded;
            const styleClass = val > 0 ? 'last-added' : 'last-added bust-added';
            const sign = val > 0 ? '+' : '';
            ghostScore = `<span class="${styleClass}">(${sign}${val})</span>`;
        } else if (player.lastAdded === 0) {
            ghostScore = `<span class="last-added bust-added">(CRASH)</span>`;
        }

        const deleteBtn = !state.gameStarted ?
            `<button class="delete-btn" onclick="removePlayer(${player.id})">x</button>` : '';

        // Trophées (N'affiche rien si 0 victoires)
        const trophyDisplay = player.wins > 0 ? `🏆 ${player.wins}` : '';

        // Progress bar
        const pct = Math.min(100, Math.round((player.score / settings.winThreshold) * 100));
        const fillClass = isWinner ? 'progress-fill full-win' : pct >= 75 ? 'progress-fill near-win' : 'progress-fill';

        // Points to win label
        let ptsLabel = '';
        if (state.gameStarted) {
            if (isWinner) {
                ptsLabel = `<div class="pts-to-win won">🎯 OBJECTIF ATTEINT</div>`;
            } else {
                const needed = settings.winThreshold - player.score;
                const closeClass = pct >= 75 ? 'close' : '';
                ptsLabel = `<div class="pts-to-win ${closeClass}">🎯 ${needed} pts pour gagner</div>`;
            }
        }

        const cardHTML = `
            <div class="card ${isWinner ? 'winner' : ''}" data-rank="${currentRank}">
                ${dealerBadge}
                ${deleteBtn}

                <div class="rank-badge">#${currentRank}</div>
                <div class="win-badge">${trophyDisplay}</div>

                <div class="card-header">
                    <span class="player-name">${player.name}</span>
                    <span class="total-score">
                        ${player.score}
                        ${ghostScore}
                    </span>
                </div>

                <div class="progress-wrap">
                    <div class="${fillClass}" style="width:${pct}%"></div>
                </div>
                ${ptsLabel}

                <div class="input-group">
                    <input type="number" id="input-${player.id}" placeholder="Pts" min="0"
                        onkeypress="handleEnter(event, ${player.id})">
                    <button class="btn-crash" onclick="updateScore(${player.id}, 0, true)" title="Crash">☠️</button>
                    <label class="f7-label" title="Flip 7 (+${settings.f7Bonus} Pts)">
                        <input type="checkbox" id="check-${player.id}">
                        <span>⚡F7</span>
                    </label>
                    <button class="btn-add" onclick="updateScore(${player.id})">+</button>
                </div>
            </div>
        `;
        scoreboard.innerHTML += cardHTML;
    });

    updateStats();
    localStorage.setItem('flip7_V3.5_state', JSON.stringify(state));
}

function updateStats() {
    if (state.players.length === 0) {
        statsFooter.innerHTML = '<span class="stat-item">En attente de joueurs...</span>';
        return;
    }
    const totalPoints = state.players.reduce((sum, p) => sum + p.score, 0);
    const avgScore = Math.floor(totalPoints / state.players.length);
    let gap = 0;
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    if (sorted.length > 1) gap = sorted[0].score - sorted[1].score;

    statsFooter.innerHTML = `
        <span class="stat-item">Total: <b>${totalPoints}</b></span>
        <span class="stat-item">Moy: <b>${avgScore}</b></span>
        <span class="stat-item">Gap: <b>${gap}</b></span>
        <span class="stat-item">Manche: <b>${state.round}</b></span>
        <span class="stat-item target">🏆 Objectif: <b>${settings.winThreshold}</b></span>
    `;
}

// --- ACTIONS ---

function saveStateToHistory() {
    historyStack.push(JSON.stringify(state));
    if (historyStack.length > 5) historyStack.shift();
}

function undoLastAction() {
    if (historyStack.length > 0) {
        state = JSON.parse(historyStack.pop());
        render();
    }
}

function startGame() {
    if (state.players.length < 1) return alert("Besoin de joueurs !");
    saveStateToHistory();
    state.gameStarted = true;
    state.dealerIndex = 0;
    render();
}

// --- REVANCHE ---
function restartGameKeepRoster() {
    if (!confirm("Démarrer une nouvelle partie ? (Les scores actuels seront effacés, les victoires comptabilisées)")) return;

    saveStateToHistory();

    // 1. Identifier le(s) vainqueur(s) : Score >= winThreshold et Score Max
    // On peut avoir plusieurs vainqueurs si égalité au dessus du seuil
    const currentMaxScore = Math.max(...state.players.map(p => p.score));

    state.players.forEach(p => {
        // Condition de victoire : Avoir atteint le seuil ET avoir le meilleur score
        if (p.score >= settings.winThreshold && p.score === currentMaxScore) {
            p.wins = (p.wins || 0) + 1;
        }
        // Reset des scores
        p.score = 0;
        p.lastAdded = undefined;
    });

    // Reset du jeu
    state.round = 1;
    state.dealerIndex = (state.dealerIndex + 1) % state.players.length; // On change quand même de dealer

    render();
}

function nextRound() {
    saveStateToHistory();
    state.round++;
    state.dealerIndex = (state.dealerIndex + 1) % state.players.length;
    render();
}

function addPlayer() {
    const name = inputName.value.trim();
    if (!name) return;
    saveStateToHistory();
    // Init avec 0 victoires
    state.players.push({ id: Date.now(), name: name, score: 0, wins: 0, lastAdded: undefined });
    inputName.value = '';
    render();
}

function removePlayer(id) {
    saveStateToHistory();
    state.players = state.players.filter(p => p.id !== id);
    render();
}

function updateScore(id, forceValue = null, isCrash = false) {
    const input = document.getElementById(`input-${id}`);
    const checkbox = document.getElementById(`check-${id}`);
    let val = 0;

    if (isCrash) val = 0;
    else {
        val = parseInt(input.value);
        if (isNaN(val)) val = 0;
        if (val === 0 && !checkbox.checked && input.value === '') return;
    }

    saveStateToHistory();
    const player = state.players.find(p => p.id === id);
    let scoreToAdd = val;
    if (checkbox && checkbox.checked && !isCrash) scoreToAdd += settings.f7Bonus;

    player.score += scoreToAdd;
    player.lastAdded = isCrash ? 0 : scoreToAdd;
    render();
}

function resetAll() {
    if (confirm('ATTENTION : Ceci effacera TOUT (Joueurs, Scores, Victoires).')) {
        saveStateToHistory();
        state = { players: [], gameStarted: false, round: 1, dealerIndex: 0 };
        render();
    }
}

function handleEnter(e, id) {
    if (e.key === 'Enter') updateScore(id);
}

inputName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
});

/* --- FULLSCREEN MANAGER --- */
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        // --- ENTRER EN PLEIN ÉCRAN ---
        // On essaie toutes les méthodes (Chrome, Safari, Firefox, IE)
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            document.documentElement.msRequestFullscreen();
        }
    } else {
        // --- QUITTER LE PLEIN ÉCRAN ---
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

render();
