// --- STATE & HISTORY ---
let historyStack = [];

let state = JSON.parse(localStorage.getItem('flip7_v3_state')) || {
    players: [], // L'ordre ici sera l'ordre d'affichage (ordre d'ajout)
    gameStarted: false,
    round: 1
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

    // 2. Ranking Calculation (Logic Only)
    // On crée une copie triée juste pour savoir qui est 1er, 2eme, etc.
    const sortedForRanking = [...state.players].sort((a, b) => b.score - a.score);

    // 3. Render Cards (FIXED ORDER)
    // On itère sur state.players directement (ordre d'ajout)
    state.players.forEach(player => {
        
        // Calcul du rang actuel de ce joueur
        // +1 car l'index commence à 0
        const currentRank = sortedForRanking.findIndex(p => p.id === player.id) + 1;
        const isWinner = player.score >= 200;

        const deleteBtn = !state.gameStarted ? 
            `<button class="delete-btn" onclick="removePlayer(${player.id})">×</button>` : '';

        // Injection HTML
        // Note l'ajout de data-rank="${currentRank}" pour le CSS
        // Note l'ajout de <div class="rank-badge">#${currentRank}</div>
        const cardHTML = `
            <div class="card ${isWinner ? 'winner' : ''}" data-rank="${currentRank}">
                ${deleteBtn}
                <div class="rank-badge">#${currentRank}</div>
                <div class="card-header">
                    <span class="player-name">${player.name}</span>
                    <span class="total-score">${player.score}</span>
                </div>
                <div class="input-group">
                    <input type="number" id="input-${player.id}" placeholder="Pts" onkeypress="handleEnter(event, ${player.id})">
                    
                    <label class="f7-label" title="Flip 7 (+15 Pts)">
                        <input type="checkbox" id="check-${player.id}">
                        <span>⚡F7</span>
                    </label>

                    <button onclick="updateScore(${player.id})">OK</button>
                </div>
            </div>
        `;
        scoreboard.innerHTML += cardHTML;
    });

    // 4. Update Stats
    updateStats();
    
    // 5. Persist
    localStorage.setItem('flip7_v3_state', JSON.stringify(state));
}

function updateStats() {
    if (state.players.length === 0) {
        statsFooter.innerHTML = '<span class="stat-item">En attente de joueurs...</span>';
        return;
    }

    const totalPoints = state.players.reduce((sum, p) => sum + p.score, 0);
    const avgScore = Math.floor(totalPoints / state.players.length);
    
    // Calcul de l'écart Leader
    let gap = 0;
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    if (sorted.length > 1) {
        gap = sorted[0].score - sorted[1].score;
    }

    statsFooter.innerHTML = `
        <span class="stat-item">Total: <b>${totalPoints}</b></span>
        <span class="stat-item">Moyenne: <b>${avgScore}</b></span>
        <span class="stat-item">Écart Leader: <b>${gap}</b></span>
        <span class="stat-item">Cible: <b>200</b></span>
    `;
}

// --- ACTIONS (Identiques à la V3) ---

function saveStateToHistory() {
    historyStack.push(JSON.stringify(state));
    if(historyStack.length > 5) historyStack.shift(); 
}

function undoLastAction() {
    if(historyStack.length > 0) {
        const previousState = historyStack.pop();
        state = JSON.parse(previousState);
        render();
    } else {
        alert("Impossible d'annuler plus loin.");
    }
}

function startGame() {
    if (state.players.length < 1) return alert("Besoin de joueurs !");
    saveStateToHistory();
    state.gameStarted = true;
    render();
}

function nextRound() {
    saveStateToHistory();
    state.round++;
    render();
}

function addPlayer() {
    const name = inputName.value.trim();
    if (!name) return;
    if (state.players.length >= 12) return alert("Table pleine.");

    saveStateToHistory();
    state.players.push({ id: Date.now(), name: name, score: 0 });
    inputName.value = '';
    render();
}

function removePlayer(id) {
    saveStateToHistory();
    state.players = state.players.filter(p => p.id !== id);
    render();
}

function updateScore(id) {
    const input = document.getElementById(`input-${id}`);
    const checkbox = document.getElementById(`check-${id}`);
    
    let val = parseInt(input.value);
    if (isNaN(val)) val = 0; 

    if (val === 0 && !checkbox.checked && input.value === '') return;

    saveStateToHistory();
    
    const player = state.players.find(p => p.id === id);
    
    let scoreToAdd = val;
    if (checkbox.checked) {
        scoreToAdd += 15; 
    }

    player.score += scoreToAdd;
    render();
}

function resetAll() {
    if(confirm('CONFIRMER LE RESET TOTAL ?')) {
        saveStateToHistory();
        state = { players: [], gameStarted: false, round: 1 };
        render();
    }
}

function handleEnter(e, id) {
    if (e.key === 'Enter') updateScore(id);
}

// Event Listeners
inputName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addPlayer();
});

// Init
render();
