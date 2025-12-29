// --- STATE ---
let historyStack = [];

let state = JSON.parse(localStorage.getItem('flip7_v4_state')) || {
    players: [],
    gameStarted: false,
    round: 1,
    dealerIndex: 0 // Index du joueur qui distribue
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
    
    // 1. Panels Logic
    if (state.gameStarted) {
        setupPanel.classList.add('hidden');
        gamePanel.classList.remove('hidden');
        roundCountSpan.textContent = state.round;
    } else {
        setupPanel.classList.remove('hidden');
        gamePanel.classList.add('hidden');
    }

    // 2. Ranking Logic (Calcul seulement)
    const sortedForRanking = [...state.players].sort((a, b) => b.score - a.score);

    // 3. Render Cards (FIXED ORDER)
    state.players.forEach((player, index) => {
        
        const currentRank = sortedForRanking.findIndex(p => p.id === player.id) + 1;
        const isWinner = player.score >= 200;
        
        // Dealer Logic : Le dealer tourne selon le round ou l'index
        // Si le jeu a commencé, on affiche le badge DEALER sur le bon index
        const isDealer = state.gameStarted && (index === state.dealerIndex % state.players.length);
        const dealerBadge = isDealer ? `<div class="dealer-badge">DEALER</div>` : '';

        let ghostScore = '';
        if (player.lastAdded !== undefined) {
            const val = player.lastAdded;
            const styleClass = val > 0 ? 'last-added' : 'last-added bust-added';
            const sign = val > 0 ? '+' : '';
            ghostScore = `<span class="${styleClass}">(${sign}${val})</span>`;
        }

        const deleteBtn = !state.gameStarted ? 
            `<button class="delete-btn" onclick="removePlayer(${player.id})">×</button>` : '';

        const cardHTML = `
            <div class="card ${isWinner ? 'winner' : ''}" data-rank="${currentRank}">
                ${dealerBadge}
                ${deleteBtn}
                <div class="rank-badge">#${currentRank}</div>
                <div class="card-header">
                    <span class="player-name">${player.name}</span>
                    <span class="total-score">
                        ${player.score}
                        ${ghostScore}
                    </span>
                </div>
                <div class="input-group">
                    <input type="number" id="input-${player.id}" placeholder="Pts" onkeypress="handleEnter(event, ${player.id})">
                    
                    <label class="f7-label" title="Flip 7 (+15 Pts)">
                        <input type="checkbox" id="check-${player.id}">
                        <span>⚡F7</span>
                    </label>

                    <button onclick="updateScore(${player.id})">OK</button>
                    <button class="btn-crash" onclick="updateScore(${player.id}, 0, true)" title="Crash (0 pts)">☠</button>
                </div>
            </div>
        `;
        scoreboard.innerHTML += cardHTML;
    });

    updateStats();
    localStorage.setItem('flip7_v4_state', JSON.stringify(state));
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
        <span class="stat-item">Moyenne: <b>${avgScore}</b></span>
        <span class="stat-item">Écart Leader: <b>${gap}</b></span>
        <span class="stat-item">Manche: <b>${state.round}</b></span>
    `;
}

// --- ACTIONS ---

function saveStateToHistory() {
    historyStack.push(JSON.stringify(state));
    if(historyStack.length > 5) historyStack.shift(); 
}

function undoLastAction() {
    if(historyStack.length > 0) {
        state = JSON.parse(historyStack.pop());
        render();
    } else {
        alert("Impossible d'annuler plus loin.");
    }
}

function startGame() {
    if (state.players.length < 1) return alert("Besoin de joueurs !");
    saveStateToHistory();
    state.gameStarted = true;
    state.dealerIndex = 0; // Le 1er joueur commence dealer
    render();
}

function nextRound() {
    saveStateToHistory();
    state.round++;
    
    // Rotation du Dealer
    state.dealerIndex = (state.dealerIndex + 1) % state.players.length;
    render();
}

function addPlayer() {
    const name = inputName.value.trim();
    if (!name) return;
    if (state.players.length >= 12) return alert("Table pleine.");
    saveStateToHistory();
    // On ajoute lastAdded: undefined par défaut
    state.players.push({ id: Date.now(), name: name, score: 0, lastAdded: undefined });
    inputName.value = '';
    render();
}

function removePlayer(id) {
    saveStateToHistory();
    state.players = state.players.filter(p => p.id !== id);
    render();
}

// forceValue permet de passer 0 directement (bouton Crash)
function updateScore(id, forceValue = null, isCrash = false) {
    const input = document.getElementById(`input-${id}`);
    const checkbox = document.getElementById(`check-${id}`);
    
    let val = 0;
    
    if (isCrash) {
        val = 0;
    } else {
        val = parseInt(input.value);
        if (isNaN(val)) val = 0;
        // Si input vide et pas crash et pas checkbox, on sort
        if (val === 0 && !checkbox.checked && input.value === '') return;
    }

    saveStateToHistory();
    
    const player = state.players.find(p => p.id === id);
    
    let scoreToAdd = val;
    if (checkbox && checkbox.checked && !isCrash) {
        scoreToAdd += 15; 
    }

    player.score += scoreToAdd;
    player.lastAdded = scoreToAdd; // On stocke pour l'affichage "Ghost"

    render();
}

function resetAll() {
    if(confirm('CONFIRMER LE RESET TOTAL ?')) {
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

render();
