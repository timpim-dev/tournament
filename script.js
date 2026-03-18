
// State
let tournament = {
    settings: {
        format: 'single', // 'single' or 'double'
        criteria: [] // { id, name, weight }
    },
    players: [], // { id, name }
    matches: [], // { id, round, p1, p2, winner, scores: {}, nextMatchId, loserMatchId }
    status: 'setup' // 'setup', 'active', 'finished'
};

// DOM Elements
const elements = {
    playerInput: document.getElementById('player-input'),
    addPlayerBtn: document.getElementById('add-player-btn'),
    playersList: document.getElementById('players-list'),
    criteriaInput: document.getElementById('criteria-input'),
    addCriteriaBtn: document.getElementById('add-criteria-btn'),
    criteriaList: document.getElementById('criteria-list'),
    formatSelect: document.getElementById('format-select'),
    generateBtn: document.getElementById('generate-bracket-btn'),
    resetBtn: document.getElementById('reset-btn'),
    exportBtn: document.getElementById('export-btn'),
    importBtn: document.getElementById('import-btn'),
    welcomeScreen: document.getElementById('welcome-screen'),
    bracketView: document.getElementById('bracket-view'),
    scoreModal: document.getElementById('score-modal'),
    modalMatchTitle: document.getElementById('modal-match-title'),
    modalCriteriaInputs: document.getElementById('modal-criteria-inputs'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    saveScoreBtn: document.getElementById('save-score-btn'),
    importModal: document.getElementById('import-modal'),
    importArea: document.getElementById('import-area'),
    confirmImportBtn: document.getElementById('confirm-import-btn'),
    closeImportBtn: document.getElementById('close-import-btn'),
    playerImageInput: document.getElementById('player-image-input'),
    imagePreviewContainer: document.getElementById('image-preview-container'),
    imagePreviewImg: document.getElementById('image-preview-img'),
    imageFilename: document.getElementById('image-filename'),
    removeImageBtn: document.getElementById('remove-image-btn'),
    matchNotesInput: document.getElementById('match-notes-input')
};

let currentPlayerImage = null;

// --- IMAGE UPLOAD ---
elements.playerImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentPlayerImage = event.target.result;
            elements.imagePreviewImg.src = currentPlayerImage;
            elements.imageFilename.innerText = file.name;
            elements.imagePreviewContainer.style.display = 'flex';
        };
        reader.readAsDataURL(file);
    }
});

elements.removeImageBtn.addEventListener('click', () => {
    currentPlayerImage = null;
    elements.playerImageInput.value = '';
    elements.imagePreviewContainer.style.display = 'none';
});

// --- INITIALIZATION ---
function init() {
    loadState();
    renderSetup();
    if (tournament.status === 'active' || tournament.status === 'finished') {
        startTournamentView();
    }
}

// --- STATE MANAGEMENT ---
function saveState() {
    try {
        localStorage.setItem('tournament_data', JSON.stringify(tournament));
    } catch (e) {
        console.error("Failed to save state:", e);
        if (e.name === 'QuotaExceededError') {
            alert("Storage limit reached! Try removing some player images.");
        }
    }
}

function loadState() {
    const data = localStorage.getItem('tournament_data');
    if (data) {
        try {
            const loaded = JSON.parse(data);
            tournament = {
                ...tournament,
                ...loaded,
                settings: { ...tournament.settings, ...(loaded.settings || {}) },
                players: loaded.players || [],
                matches: loaded.matches || []
            };
        } catch (e) {
            console.error("Failed to load state:", e);
        }
    }
}

function resetState() {
    tournament = {
        settings: { format: 'single', criteria: [] },
        players: [],
        matches: [],
        status: 'setup'
    };
    saveState();
    location.reload();
}

// --- SETUP FUNCTIONS ---
elements.addPlayerBtn.addEventListener('click', () => addPlayer());
elements.playerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });

function addPlayer() {
    const name = elements.playerInput.value.trim();
    if (!name) return;
    
    // Unique Name Check
    const exists = tournament.players.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert("Player name must be unique!");
        elements.playerInput.classList.add('is-exhausted'); // Using existing class for error look
        setTimeout(() => elements.playerInput.classList.remove('is-exhausted'), 1000);
        return;
    }

    tournament.players.push({ 
        id: Date.now() + Math.random(), 
        name: name,
        image: currentPlayerImage
    });

    elements.playerInput.value = '';
    currentPlayerImage = null;
    elements.imagePreviewContainer.style.display = 'none';
    elements.playerImageInput.value = '';

    saveState();
    renderSetup();
}

elements.addCriteriaBtn.addEventListener('click', () => addCriteria());
elements.criteriaInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addCriteria(); });

function addCriteria() {
    const name = elements.criteriaInput.value.trim();
    if (!name) return;
    tournament.settings.criteria.push({ id: Date.now(), name: name, weight: 1 });
    elements.criteriaInput.value = '';
    saveState();
    renderSetup();
}

function removePlayer(id) {
    tournament.players = tournament.players.filter(p => p.id !== id);
    saveState();
    renderSetup();
}

function removeCriteria(id) {
    tournament.settings.criteria = tournament.settings.criteria.filter(c => c.id !== id);
    saveState();
    renderSetup();
}

function renderSetup() {
    // Render Players
    elements.playersList.innerHTML = tournament.players.map(p => `
        <div class="history-item">
            <div style="display: flex; align-items: center; gap: 8px;">
                ${p.image ? `<img src="${p.image}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover; border: 1px solid var(--orange-dim);">` : `<div style="width: 24px; height: 24px; background: var(--surface2); border: 1px solid var(--border); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--orange2);">${p.name[0]}</div>`}
                <span class="history-item-title">${p.name}</span>
            </div>
            <div class="history-actions">
                <button onclick="removePlayer(${p.id})" style="color: var(--danger)">×</button>
            </div>
        </div>
    `).join('');

    // Render Criteria
    elements.criteriaList.innerHTML = tournament.settings.criteria.map(c => `
        <div class="history-item">
            <span class="history-item-title">${c.name}</span>
            <div class="history-actions">
                <button onclick="removeCriteria(${c.id})" style="color: var(--danger)">×</button>
            </div>
        </div>
    `).join('');
    
    // Format Select
    elements.formatSelect.value = tournament.settings.format;
}

elements.formatSelect.addEventListener('change', (e) => {
    tournament.settings.format = e.target.value;
    saveState();
});

// --- BRACKET GENERATION ---
elements.generateBtn.addEventListener('click', () => {
    if (tournament.players.length < 2) {
        alert("Need at least 2 players!");
        return;
    }
    generateBracket();
});

function generateBracket() {
    const players = [...tournament.players];
    // Shuffle players
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }

    const powerOfTwo = Math.pow(2, Math.ceil(Math.log2(players.length)));
    const bracketSize = powerOfTwo;
    let seededPlayers = [];
    
    for(let i=0; i<bracketSize; i++) {
        if(i < players.length) seededPlayers.push(players[i]);
        else seededPlayers.push({ id: 'BYE', name: 'BYE' });
    }

    tournament.matches = [];
    let matchIdCounter = 1;
    const wbRounds = Math.log2(bracketSize);

    // 1. WINNERS BRACKET
    let wbMatchesByRound = [];
    let currentWBMatches = [];
    for (let i = 0; i < bracketSize / 2; i++) {
        let p1 = seededPlayers[i];
        let p2 = seededPlayers[bracketSize - 1 - i];
        let match = {
            id: matchIdCounter++,
            round: 1,
            bracket: 'winners',
            p1: p1,
            p2: p2,
            winner: null,
            scores: {},
            nextMatchId: null,
            loserMatchId: null,
            feedSlot: null
        };
        if (p2.id === 'BYE') { match.winner = p1.id; match.p2 = null; match.completed = true; }
        else if (p1.id === 'BYE') { match.winner = p2.id; match.p1 = null; match.completed = true; }
        tournament.matches.push(match);
        currentWBMatches.push(match);
    }
    wbMatchesByRound.push(currentWBMatches);

    for (let r = 2; r <= wbRounds; r++) {
        let nextWBMatches = [];
        for (let i = 0; i < currentWBMatches.length; i += 2) {
            let m1 = currentWBMatches[i];
            let m2 = currentWBMatches[i+1];
            let newMatch = {
                id: matchIdCounter++,
                round: r,
                bracket: 'winners',
                p1: null, p2: null,
                winner: null, scores: {},
                nextMatchId: null, loserMatchId: null
            };
            m1.nextMatchId = newMatch.id; m1.feedSlot = 'p1';
            m2.nextMatchId = newMatch.id; m2.feedSlot = 'p2';
            tournament.matches.push(newMatch);
            nextWBMatches.push(newMatch);
        }
        wbMatchesByRound.push(nextWBMatches);
        currentWBMatches = nextWBMatches;
    }

    if (tournament.settings.format === 'double') {
        // 2. LOSERS BRACKET
        // LB Round 1: Losers from WB Round 1
        let lbRoundsCount = (wbRounds - 1) * 2;
        let currentLBMatches = [];
        
        // LB Round 1: Losers of WB Round 1 face off
        for (let i = 0; i < wbMatchesByRound[0].length; i += 2) {
            let m1 = wbMatchesByRound[0][i];
            let m2 = wbMatchesByRound[0][i+1];
            let newMatch = {
                id: matchIdCounter++,
                round: 1,
                bracket: 'losers',
                p1: null, p2: null,
                winner: null, scores: {},
                nextMatchId: null
            };
            m1.loserMatchId = newMatch.id; m1.loserFeedSlot = 'p1';
            m2.loserMatchId = newMatch.id; m2.loserFeedSlot = 'p2';
            tournament.matches.push(newMatch);
            currentLBMatches.push(newMatch);
        }

        // Subsequent LB Rounds
        for (let r = 2; r <= lbRoundsCount; r++) {
            let nextLBMatches = [];
            if (r % 2 === 0) {
                // LB Even Round: Winners of previous LB round face Losers from WB
                let wbRoundIdx = r / 2; // WB losers from round 2, 3...
                let wbLosers = wbMatchesByRound[wbRoundIdx];
                if (!wbLosers) break; 

                for (let i = 0; i < currentLBMatches.length; i++) {
                    let m_prev = currentLBMatches[i];
                    let m_wb = wbLosers[i];
                    let newMatch = {
                        id: matchIdCounter++,
                        round: r,
                        bracket: 'losers',
                        p1: null, p2: null,
                        winner: null, scores: {},
                        nextMatchId: null
                    };
                    m_prev.nextMatchId = newMatch.id; m_prev.feedSlot = 'p1';
                    m_wb.loserMatchId = newMatch.id; m_wb.loserFeedSlot = 'p2';
                    tournament.matches.push(newMatch);
                    nextLBMatches.push(newMatch);
                }
            } else {
                // LB Odd Round: Winners of previous LB round face each other
                for (let i = 0; i < currentLBMatches.length; i += 2) {
                    let m1 = currentLBMatches[i];
                    let m2 = currentLBMatches[i+1];
                    let newMatch = {
                        id: matchIdCounter++,
                        round: r,
                        bracket: 'losers',
                        p1: null, p2: null,
                        winner: null, scores: {},
                        nextMatchId: null
                    };
                    m1.nextMatchId = newMatch.id; m1.feedSlot = 'p1';
                    m2.nextMatchId = newMatch.id; m2.feedSlot = 'p2';
                    tournament.matches.push(newMatch);
                    nextLBMatches.push(newMatch);
                }
            }
            currentLBMatches = nextLBMatches;
        }

        // 3. GRAND FINAL
        let wbWinnerMatch = wbMatchesByRound[wbRounds - 1][0];
        let lbWinnerMatch = currentLBMatches[0];
        let grandFinal = {
            id: matchIdCounter++,
            round: wbRounds + 1, // Visual placement
            bracket: 'final',
            p1: null, p2: null,
            winner: null, scores: {},
            nextMatchId: null
        };
        wbWinnerMatch.nextMatchId = grandFinal.id; wbWinnerMatch.feedSlot = 'p1';
        lbWinnerMatch.nextMatchId = grandFinal.id; lbWinnerMatch.feedSlot = 'p2';
        tournament.matches.push(grandFinal);
    }

    // Process initial Byes to advance winners
    tournament.matches.filter(m => m.completed).forEach(m => advanceWinner(m));

    tournament.status = 'active';
    saveState();
    startTournamentView();
}

function startTournamentView() {
    elements.welcomeScreen.style.display = 'none';
    elements.bracketView.style.display = 'flex';
    renderBracket();
}

// --- RENDERING BRACKET ---
function renderBracket() {
    elements.bracketView.innerHTML = '<svg id="bracket-svg" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 0;"></svg>';
    
    if (tournament.settings.format === 'double') {
        const wb = tournament.matches.filter(m => m.bracket === 'winners');
        const lb = tournament.matches.filter(m => m.bracket === 'losers');
        const final = tournament.matches.filter(m => m.bracket === 'final');
        
        elements.bracketView.innerHTML += `<div class="bracket-section-title">Winners Bracket</div>`;
        const wbContainer = document.createElement('div');
        wbContainer.className = 'bracket-row';
        renderBracketSection(wb, wbContainer);
        elements.bracketView.appendChild(wbContainer);

        elements.bracketView.innerHTML += `<div class="bracket-section-title">Losers Bracket</div>`;
        const lbContainer = document.createElement('div');
        lbContainer.className = 'bracket-row';
        renderBracketSection(lb, lbContainer);
        elements.bracketView.appendChild(lbContainer);

        elements.bracketView.innerHTML += `<div class="bracket-section-title">Grand Final</div>`;
        const finalContainer = document.createElement('div');
        finalContainer.className = 'bracket-row';
        renderBracketSection(final, finalContainer);
        elements.bracketView.appendChild(finalContainer);
    } else {
        renderBracketSection(tournament.matches, elements.bracketView);
    }

    // Draw lines after layout
    setTimeout(drawLines, 100);
}

function renderBracketSection(matches, container) {
    const rounds = {};
    matches.forEach(m => {
        if (!rounds[m.round]) rounds[m.round] = [];
        rounds[m.round].push(m);
    });

    const roundKeys = Object.keys(rounds).sort((a,b) => a-b);
    roundKeys.forEach((rKey, rIdx) => {
        const roundMatches = rounds[rKey];
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round-column pixelate-in';
        roundDiv.style.animationDelay = `${rIdx * 0.2}s`;
        roundDiv.innerHTML = `<div class="round-title">Round ${rKey}</div>`;

        roundMatches.sort((a,b) => a.id - b.id);
        roundMatches.forEach(match => {
            const el = createMatchElement(match);
            el.id = `match-${match.id}`;
            roundDiv.appendChild(el);
        });

        container.appendChild(roundDiv);
    });
}

function drawLines() {
    const svg = document.getElementById('bracket-svg');
    if (!svg) return;
    
    // Resize SVG to full scrollable area
    svg.style.width = elements.bracketView.scrollWidth + 'px';
    svg.style.height = elements.bracketView.scrollHeight + 'px';
    
    // Clear paths
    svg.innerHTML = '';

    tournament.matches.forEach(match => {
        const el = document.getElementById(`match-${match.id}`);
        const containerRect = elements.bracketView.getBoundingClientRect();

        // 1. Next Match Line
        if (match.nextMatchId) {
            const nextEl = document.getElementById(`match-${match.nextMatchId}`);
            if (el && nextEl) {
                drawElbowPath(svg, el, nextEl, containerRect, 'var(--border)', false, match.winner !== null);
            }
        }

        // 2. Loser Match Line (Double Elim)
        if (match.loserMatchId) {
            const loserEl = document.getElementById(`match-${match.loserMatchId}`);
            if (el && loserEl) {
                drawElbowPath(svg, el, loserEl, containerRect, 'var(--text-muted)', true, match.winner !== null);
            }
        }
    });
}

function drawElbowPath(svg, el, nextEl, containerRect, color, isDashed = false, hasWinner = false) {
    const startRect = el.getBoundingClientRect();
    const endRect = nextEl.getBoundingClientRect();

    const x1 = (startRect.left - containerRect.left) + startRect.width + elements.bracketView.scrollLeft;
    const y1 = (startRect.top - containerRect.top) + startRect.height / 2 + elements.bracketView.scrollTop;
    const x2 = (endRect.left - containerRect.left) + elements.bracketView.scrollLeft;
    const y2 = (endRect.top - containerRect.top) + endRect.height / 2 + elements.bracketView.scrollTop;

    const midX = x1 + (x2 - x1) / 2;
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`);
    path.setAttribute('stroke', hasWinner ? 'var(--orange)' : color);
    path.setAttribute('stroke-width', hasWinner ? '3' : '2');
    path.setAttribute('fill', 'none');
    if (isDashed) path.setAttribute('stroke-dasharray', '4,4');
    
    svg.appendChild(path);
}


window.addEventListener('resize', drawLines);


function createMatchElement(match) {
    const el = document.createElement('div');
    const isReady = match.p1 && match.p2 && !match.completed;
    el.className = `match-card ${match.completed ? 'completed' : ''} ${isReady ? 'active' : ''}`;
    el.onclick = () => openScoreModal(match.id);

    let p1Name = match.p1 ? match.p1.name : 'TBD';
    let p2Name = match.p2 ? match.p2.name : 'TBD';
    
    let p1Class = match.winner === (match.p1?.id) ? 'winner' : (match.winner ? 'loser' : '');
    let p2Class = match.winner === (match.p2?.id) ? 'winner' : (match.winner ? 'loser' : '');

    let p1Score = calculateTotalScore(match, match.p1?.id);
    let p2Score = calculateTotalScore(match, match.p2?.id);

    const p1Img = match.p1?.image ? `<img src="${match.p1.image}" class="player-avatar">` : `<div class="player-avatar" style="display:flex;align-items:center;justify-content:center;font-size:10px;background:var(--surface2)">${p1Name[0]}</div>`;
    const p2Img = match.p2?.image ? `<img src="${match.p2.image}" class="player-avatar">` : `<div class="player-avatar" style="display:flex;align-items:center;justify-content:center;font-size:10px;background:var(--surface2)">${p2Name[0]}</div>`;

    el.innerHTML = `
        ${match.notes ? '<div class="note-indicator">Note</div>' : ''}
        <div class="player-row ${p1Class}">
            <div class="player-info">
                ${p1Img}
                <span class="player-name">${p1Name}</span>
            </div>
            <span class="player-score">${p1Score !== 0 ? p1Score : ''}</span>
        </div>
        <div class="player-row ${p2Class}">
            <div class="player-info">
                ${p2Img}
                <span class="player-name">${p2Name}</span>
            </div>
            <span class="player-score">${p2Score !== 0 ? p2Score : ''}</span>
        </div>
        ${match.notes ? `<div class="match-card-notes-preview">${match.notes}</div>` : ''}
    `;

    return el;
}

function calculateTotalScore(match, playerId) {
    if (!match.scores || !playerId || !match.scores[playerId]) return 0;
    // Sum all criteria values
    return Object.values(match.scores[playerId]).reduce((a, b) => Number(a) + Number(b), 0);
}

// --- SCORING ---
let currentMatchId = null;

function openScoreModal(matchId) {
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match.p1 || !match.p2) return; // Can't score incomplete match
    if (match.completed && confirm("Match finished. Edit scores?") === false) return;

    currentMatchId = matchId;
    elements.modalMatchTitle.innerText = `${match.p1.name} vs ${match.p2.name}`;
    elements.matchNotesInput.value = match.notes || '';
    elements.scoreModal.style.display = 'flex';

    // Generate Inputs
    elements.modalCriteriaInputs.innerHTML = '';
    
    // Header
    elements.modalCriteriaInputs.innerHTML += `
        <div class="scorecard-row scorecard-header">
            <span>Criterion</span>
            <span>${match.p1.name}</span>
            <span>${match.p2.name}</span>
        </div>
    `;

    const criteria = tournament.settings.criteria.length > 0 ? tournament.settings.criteria : [{id: 'default', name: 'Points'}];

    criteria.forEach(c => {
        let val1 = match.scores[match.p1.id]?.[c.id] || 0;
        let val2 = match.scores[match.p2.id]?.[c.id] || 0;

        elements.modalCriteriaInputs.innerHTML += `
            <div class="scorecard-row">
                <label>${c.name}</label>
                <input type="number" class="scorecard-input score-input" data-pid="${match.p1.id}" data-cid="${c.id}" value="${val1}">
                <input type="number" class="scorecard-input score-input" data-pid="${match.p2.id}" data-cid="${c.id}" value="${val2}">
            </div>
        `;
    });
    
    // Total Preview Row
    elements.modalCriteriaInputs.innerHTML += `
        <div class="scorecard-row scorecard-total-row">
            <span>TOTAL SCORE</span>
            <span id="modal-p1-total">0</span>
            <span id="modal-p2-total">0</span>
        </div>
    `;

    // Update Totals Real-time
    const updateTotals = () => {
        let p1Total = 0;
        let p2Total = 0;
        document.querySelectorAll(`.score-input[data-pid="${match.p1.id}"]`).forEach(input => p1Total += Number(input.value));
        document.querySelectorAll(`.score-input[data-pid="${match.p2.id}"]`).forEach(input => p2Total += Number(input.value));
        document.getElementById('modal-p1-total').innerText = p1Total;
        document.getElementById('modal-p2-total').innerText = p2Total;
    };
    
    document.querySelectorAll('.score-input').forEach(input => input.oninput = updateTotals);
    updateTotals();

    // Manual Winner Override
    elements.modalCriteriaInputs.innerHTML += `
        <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 10px;">
            <label style="color:var(--text-dim); font-size:12px; text-transform:uppercase;">Force Winner (Optional)</label>
            <select id="force-winner" style="width: 100%; background: var(--surface2); color: white; border: 1px solid var(--border); padding: 8px; margin-top:5px; border-radius:4px;">
                <option value="">Auto-Calculate</option>
                <option value="${match.p1.id}" ${match.winner === match.p1.id ? 'selected' : ''}>${match.p1.name}</option>
                <option value="${match.p2.id}" ${match.winner === match.p2.id ? 'selected' : ''}>${match.p2.name}</option>
            </select>
        </div>
    `;
}

elements.closeModalBtn.addEventListener('click', () => {
    elements.scoreModal.style.display = 'none';
});

elements.saveScoreBtn.addEventListener('click', () => {
    const inputs = document.querySelectorAll('.score-input');
    const match = tournament.matches.find(m => m.id === currentMatchId);
    
    // Save Scores
    if (!match.scores[match.p1.id]) match.scores[match.p1.id] = {};
    if (!match.scores[match.p2.id]) match.scores[match.p2.id] = {};

    inputs.forEach(input => {
        const pid = input.dataset.pid;
        const cid = input.dataset.cid;
        match.scores[pid][cid] = input.value;
    });

    // Save Notes
    match.notes = elements.matchNotesInput.value.trim();

    // Determine Winner
    const forcedWinner = document.getElementById('force-winner').value;
    if (forcedWinner) {
        match.winner = isNaN(forcedWinner) ? forcedWinner : Number(forcedWinner);
    } else {
        const s1 = calculateTotalScore(match, match.p1.id);
        const s2 = calculateTotalScore(match, match.p2.id);
        if (s1 > s2) match.winner = match.p1.id;
        else if (s2 > s1) match.winner = match.p2.id;
        else match.winner = null; // Draw
    }

    if (match.winner) {
        match.completed = true;
        advanceWinner(match);
    }

    elements.scoreModal.style.display = 'none';
    saveState();
    renderBracket();
});

function advanceWinner(match) {
    const winnerObj = match.winner === (match.p1?.id) ? match.p1 : match.p2;
    const loserObj = match.winner === (match.p1?.id) ? match.p2 : match.p1;

    // Advance Winner
    if (match.nextMatchId) {
        const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
        if (nextMatch) {
            if (match.feedSlot) nextMatch[match.feedSlot] = winnerObj;
            
            // Add animation class to next match element
            setTimeout(() => {
                const nextEl = document.getElementById(`match-${nextMatch.id}`);
                if (nextEl) {
                    nextEl.classList.add('loading-glow');
                    setTimeout(() => nextEl.classList.remove('loading-glow'), 2000);
                }
            }, 100);
        }
    }

    // Advance Loser (for Double Elimination)
    if (match.loserMatchId && loserObj) {
        const loserMatch = tournament.matches.find(m => m.id === match.loserMatchId);
        if (loserMatch) {
            if (match.loserFeedSlot) loserMatch[match.loserFeedSlot] = loserObj;
        }
    }
}

// --- UTILS ---
elements.resetBtn.addEventListener('click', () => {
    if(confirm('Reset everything?')) resetState();
});

elements.exportBtn.addEventListener('click', () => {
    const code = btoa(JSON.stringify(tournament));
    navigator.clipboard.writeText(code);
    alert('Save code copied to clipboard!');
});

elements.importBtn.addEventListener('click', () => {
    elements.importModal.style.display = 'flex';
});

elements.closeImportBtn.addEventListener('click', () => {
    elements.importModal.style.display = 'none';
});

elements.confirmImportBtn.addEventListener('click', () => {
    try {
        const code = atob(elements.importArea.value.trim());
        tournament = JSON.parse(code);
        saveState();
        location.reload();
    } catch (e) {
        alert('Invalid save code!');
    }
});

// Start
init();
