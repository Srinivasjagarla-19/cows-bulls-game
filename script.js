const wordLists = {
    4: ['CHAT', 'ZOOM', 'LOCK', 'OPEN', 'SAFE', 'FIRE', 'BLUE', 'LOVE', 'PLAN', 'MOVE', 'GRIT', 'RACE', 'BITE', 'RING', 'CLUE','GAME', 'PLAY', 'WORD', 'BULL', 'CODE', 'HINT', 'JUMP', 'QUIZ', 'TASK', 'WORK', 'MIND', 'FAST', 'SLOW', 'TEAM', 'RULE', 'LIFE'],
    5: ['BEACH', 'CLOUD', 'DREAM', 'EARTH', 'FLAME', 'GHOST', 'HEART', 'LIGHT', 'MUSIC', 'SPACE', 'BRAIN', 'SMART', 'QUICK', 'HAPPY', 'DANCE','STORM', 'PEACE', 'POWER', 'NIGHT', 'TRUST', 'GIANT', 'BRAVE', 'HUMAN', 'TRICK', 'SPEED', 'FAITH', 'SHINE', 'MIGHT', 'CLEAN', 'MAGIC']
};

const gameState = {
    isActive: false,
    wordLength: 0,
    targetWord: '',
    currentTeam: 'A',
    attempts: { A: 0, B: 0 },
    history: [],
    scores: { A: 0, B: 0 },
    round: 1,
    roundStarter: 'A'
};

function loadGameHistory() {
    const savedHistory = localStorage.getItem('cowsAndBullsHistory');
    if (savedHistory) {
        gameState.history = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
}

function saveGameHistory() {
    localStorage.setItem('cowsAndBullsHistory', JSON.stringify(gameState.history));
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = gameState.history
        .map((item, index) => `
            <div class="history-item">
                <div>Round ${item.round}</div>
                <div>Guess: ${item.guess}</div>
                <div>🐂 Bulls: ${item.bulls} | 🐄 Cows: ${item.cows}</div>
            </div>
        `)
        .join('');
}

let isRunning = false;
let timerInterval;
let seconds = 0, minutes = 0, hours = 0;

let elements = {};

function startNewGame(wordLength) {
    try {
        if (!wordLists[wordLength]) {
            showToast('Invalid word length!', 'error');
            return;
        }

        gameState.targetWord = wordLists[wordLength][Math.floor(Math.random() * wordLists[wordLength].length)];
        gameState.isActive = true;
        gameState.currentTeam = 'A';
        gameState.attempts = { A: 0, B: 0 };
        gameState.history = [];

        document.getElementById('gameSetup').style.display = 'none';
        
        elements.teamAInput.disabled = false;
        elements.teamAGuess.disabled = false;
        elements.teamBInput.disabled = true;
        elements.teamBGuess.disabled = true;

        elements.teamAInput.value = '';
        elements.teamBInput.value = '';
        document.getElementById('teamAHistory').innerHTML = '';
        document.getElementById('teamBHistory').innerHTML = '';

        elements.teamAInput.maxLength = wordLength;
        elements.teamBInput.maxLength = wordLength;

        console.log('Target word:', gameState.targetWord);
        showToast(`Game started! Team A goes first. Word is ${wordLength} letters long.`, 'success');
    } catch (error) {
        console.error('Error starting new game:', error);
        showToast('Error starting game', 'error');
    }
}

function updateTeamInputs() {
    const elements = ['A', 'B'].map(team => ({
        input: document.getElementById(`team${team}Input`),
        guess: document.getElementById(`team${team}Guess`),
        container: document.getElementById(`team${team}Container`)
    }));

    elements.forEach(({input, guess, container}, index) => {
        const team = ['A', 'B'][index];
        const isCurrentTeam = gameState.currentTeam === team;
        
        if (input && guess) {
            input.disabled = !isCurrentTeam;
            guess.disabled = !isCurrentTeam;
            
            if (!isCurrentTeam) {
                input.value = '';
            }
        }
        
        if (container) {
            container.classList.toggle('active-team', isCurrentTeam);
        }
    });

    const currentTeamDisplay = document.getElementById('currentTeam');
    if (currentTeamDisplay) {
        currentTeamDisplay.textContent = `Team : ${gameState.currentTeam}`;
        currentTeamDisplay.className = `current-team team-${gameState.currentTeam.toLowerCase()}`;
    }

    elements.forEach(({input}, index) => {
        const team = ['A', 'B'][index];
        if (input) {
            input.placeholder = gameState.currentTeam === team ? 
                `Enter ${gameState.wordLength}-letter word` : 'Wait for your turn';
        }
    });
}

function switchTeams() {
    gameState.currentTeam = gameState.currentTeam === 'A' ? 'B' : 'A';
    updateTeamInputs();
    showToast(`Team ${gameState.currentTeam}'s turn!`, 'info');
}

function checkGuess(guess) {
    const target = gameState.targetWord.toUpperCase();
    const guessUpper = guess.toUpperCase();
    let bulls = 0;
    let cows = 0;

        const usedTarget = new Array(target.length).fill(false);
    const usedGuess = new Array(guessUpper.length).fill(false);

        for (let i = 0; i < target.length; i++) {
        if (guessUpper[i] === target[i]) {
            bulls++;
            usedTarget[i] = true;
            usedGuess[i] = true;
        }
    }

        for (let i = 0; i < target.length; i++) {
        if (usedGuess[i]) continue;
        
        for (let j = 0; j < target.length; j++) {
            if (usedTarget[j]) continue;
            
            if (guessUpper[i] === target[j]) {
                cows++;
                usedTarget[j] = true;
                usedGuess[i] = true;
                break;
            }
        }
    }

    return { bulls, cows };
}

function handleGuess(team) {
    const input = document.getElementById(`team${team}Input`);
    const guess = input.value.trim().toUpperCase();

    if (!gameState.isActive) {
        showToast('Please start the game first!', 'error');
        return;
    }

    if (!guess) {
        showToast('Please enter a guess!', 'error');
        return;
    }

    if (guess.length !== gameState.targetWord.length) {
        showToast(`Guess must be ${gameState.targetWord.length} letters long!`, 'error');
        return;
    }

    if (gameState.currentTeam !== team) {
        showToast(`It's Team ${gameState.currentTeam}'s turn!`, 'error');
        return;
    }

    const result = checkGuess(guess);

    const historyDiv = document.getElementById(`team${team}History`);
    if (historyDiv) {
        const guessElement = document.createElement('div');
        guessElement.className = 'guess-item';
        guessElement.innerHTML = `
            <span class="guess-word">${guess}</span>
            <span class="guess-result">${result.bulls}🐂 ${result.cows}🐮</span>
        `;
        historyDiv.insertBefore(guessElement, historyDiv.firstChild);
    }

    input.value = '';

    if (result.bulls === 0 && result.cows === 0) {
        showToast('No matches!', 'error');
    } else {
        showToast(`${result.bulls} Bulls, ${result.cows} Cows`, 'info');
    }

    gameState.attempts[team]++;

    if (result.bulls === gameState.targetWord.length) {
        handleWin(team);
    } else {
        gameState.currentTeam = team === 'A' ? 'B' : 'A';
        updateTeamInputs();
        showToast(`${result.bulls} Bulls, ${result.cows} Cows - Team ${gameState.currentTeam}'s turn!`, 'info');
    }
}

function handleWin(team) {
    const modal = document.getElementById('winnerModal');
    const winnerMessage = document.getElementById('winnerMessage');
    const nextRoundBtn = document.getElementById('nextRoundBtn');

    gameState.scores[team]++;
    document.getElementById(`score${team}`).textContent = gameState.scores[team];

    
    if (modal && winnerMessage) {
        winnerMessage.innerHTML = `
            <div class="win-team">Team ${team} wins!</div>
            <div class="win-word">Found the word: ${gameState.targetWord}</div>
            <div class="win-attempts">in ${gameState.attempts[team]} attempts!</div>
            <div class="win-emoji">🏆</div>
        `;
        modal.style.display = 'flex';
    }
    
    if (nextRoundBtn) {
        nextRoundBtn.onclick = () => {
            modal.style.display = 'none';
            resetForNextRound();
            document.getElementById('gameSetup').style.display = 'flex';
            showToast('Select word length for next round!', 'info');
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
                const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-mode');
            const icon = document.querySelector('#themeToggle i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
        elements.startBtn = document.getElementById('startBtn');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.teamAInput = document.getElementById('teamAInput');
        elements.teamBInput = document.getElementById('teamBInput');
        elements.teamAGuess = document.getElementById('teamAGuess');
        elements.teamBGuess = document.getElementById('teamBGuess');
        elements.teamAHistory = document.getElementById('teamAHistory');
        elements.teamBHistory = document.getElementById('teamBHistory');
        elements.themeToggle = document.getElementById('themeToggle');
        elements.displayTimer = document.getElementById('displayTimer');

        elements.startBtn.addEventListener('click', () => {
            if (!isRunning) {
                startStopwatch();
                isRunning = true;
                elements.startBtn.textContent = 'Stop Game';
                elements.startBtn.style.background = '#ff4444';
                elements.resetBtn.disabled = false;
                document.getElementById('gameSetup').style.display = 'flex';
                showToast('Select word length to start!', 'info');
            } else {
                stopStopwatch();
                isRunning = false;
                elements.startBtn.textContent = 'Start Game';
                elements.startBtn.style.background = '';
                elements.resetBtn.disabled = true;
                document.getElementById('gameSetup').style.display = 'none';
                showToast('Game stopped', 'info');
            }
        });

        elements.resetBtn.addEventListener('click', resetGame);

        document.querySelectorAll('.word-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.word-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const length = parseInt(btn.dataset.length);
                startNewGame(length);
            });
        });

        elements.teamAGuess.addEventListener('click', () => handleGuess('A'));
        elements.teamBGuess.addEventListener('click', () => handleGuess('B'));

        elements.themeToggle.addEventListener('click', toggleTheme);

        elements.teamAInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        elements.teamAInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGuess('A');
            }
        });

        elements.teamBInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        elements.teamBInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGuess('B');
            }
        });

        updateClock();
        setInterval(updateClock, 1000);

        elements.teamAInput.disabled = true;
        elements.teamBInput.disabled = true;
        elements.teamAGuess.disabled = true;
        elements.teamBGuess.disabled = true;

        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
        showToast('Error initializing game', 'error');
    }
});

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const icon = elements.themeToggle.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-sun');
        icon.classList.toggle('fa-moon');
    }
    localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function resetGame() {
    stopStopwatch();
    isRunning = false;
    gameState.isActive = false;
    gameState.targetWord = '';
    gameState.attempts = { A: 0, B: 0 };
    gameState.scores = { A: 0, B: 0 };
    gameState.lastWinner = null;
    gameState.round = 1;
    gameState.history = [];

    document.getElementById('gameSetup').style.display = 'block';

    document.getElementById('teamAHistory').innerHTML = '';
    document.getElementById('teamBHistory').innerHTML = '';

    elements.teamAInput.value = '';
    elements.teamBInput.value = '';
    elements.teamAInput.disabled = true;
    elements.teamBInput.disabled = true;
    elements.teamAGuess.disabled = true;
    elements.teamBGuess.disabled = true;

    elements.startBtn.textContent = 'Start Game';
    elements.startBtn.style.background = '';
    elements.resetBtn.disabled = true;

    resetStopwatch();

    showToast('Game has been reset', 'info');
}

function resetForNextRound() {
    gameState.targetWord = '';
    gameState.isActive = false;
    gameState.attempts = { A: 0, B: 0 };
    gameState.history = [];
    gameState.currentTeam = 'A';

    document.getElementById('teamAHistory').innerHTML = '';
    document.getElementById('teamBHistory').innerHTML = '';

    document.getElementById('teamAInput').value = '';
    document.getElementById('teamBInput').value = '';

    resetStopwatch();
    updateTeamInputs();

    const currentTeamSpan = document.getElementById('currentTeam');
    if (currentTeamSpan) {
        currentTeamSpan.textContent = 'Team A';
    }
}

function startStopwatch() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(updateStopwatch, 1000);
    }
}

function stopStopwatch() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
    }
}

function resetStopwatch() {
    stopStopwatch();
    seconds = 0;
    minutes = 0;
    hours = 0;
    document.getElementById('displayTimer').textContent = '00:00:00';
}

function updateStopwatch() {
    seconds++;
    if (seconds === 60) {
        seconds = 0;
        minutes++;
        if (minutes === 60) {
            minutes = 0;
            hours++;
        }
    }
    
    const display = document.getElementById('displayTimer');
    display.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    document.getElementById('p-time').textContent = 
        `${pad(hours)}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) {
        console.error('Toast element not found');
        return;
    }

    toast.style.animation = 'none';
    toast.offsetHeight;
    toast.style.animation = null;

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.visibility = 'visible';

    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.visibility = 'hidden';
        }, 300);
    }, 3000);
}
