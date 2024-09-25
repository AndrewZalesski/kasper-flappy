
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen canvas and responsiveness
function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let gameRunning = false;
let walletAddress = '';
let score = 0;

// Load assets from the root assets folder
const kasper = new Image();
kasper.src = 'assets/kasperghostflappy.png';  // Correct path for the ghost in the root assets folder

kasper.onload = function() {
    console.log("Kasper image loaded successfully");
};

const flapSound = new Audio('assets/flap.wav');
const gameOverSound = new Audio('assets/gameover.wav');
const bgMusic = new Audio('assets/background_compressed.wav');  // Compressed background sound from root assets
bgMusic.loop = true;

let kasperX = canvas.width / 10;
let kasperY = canvas.height / 2;
let gravity = 0.08;
let lift = -4;
let velocity = 0;

let pipes = [];
let pipeWidth = canvas.width / 10;
let pipeGap = canvas.height / 3;
let pipeSpeed = 2;

// Handle wallet form submission without refreshing the page
document.getElementById('walletForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent page refresh
    walletAddress = document.getElementById('walletAddress').value;
    if (walletAddress) {
        document.getElementById('walletForm').classList.add('hidden');
        document.getElementById('playScreen').classList.remove('hidden');
    }
});

// Show the "Start Game" button after wallet submission
document.getElementById('startGameButton').addEventListener('click', function() {
    document.getElementById('playScreen').classList.add('hidden');
    document.getElementById('gameCanvas').classList.remove('hidden');
    document.getElementById('scoreDisplay').classList.remove('hidden');
    startGame();
});

// Mobile and Desktop support
canvas.addEventListener('touchstart', function(e) {
    if (gameRunning) {
        velocity = lift;
        flapSound.play();
    }
    e.preventDefault();
});
canvas.addEventListener('click', function() {
    if (gameRunning) {
        velocity = lift;
        flapSound.play();
    }
});

// Draw pipes
function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        let pipe = pipes[i];
        pipe.x -= pipeSpeed;

        ctx.fillStyle = "#228B22";
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1);
            score += 1;
        }
    }
}

function generatePipes() {
    let top = Math.random() * (canvas.height / 2);
    let bottom = canvas.height - (top + pipeGap);
    pipes.push({x: canvas.width, top: top, bottom: bottom});
}

// Start the game after clicking "Start Game"
function startGame() {
    kasperY = canvas.height / 2;
    pipes = [];
    score = 0;
    gameRunning = true;
    bgMusic.play();
    gameLoop();
    generatePipes();
    setInterval(generatePipes, 2500);
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#74ebd5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    velocity += gravity;
    kasperY += velocity;

    // Draw Kasper ghost on the canvas
    ctx.drawImage(kasper, kasperX, kasperY, canvas.width / 10, canvas.height / 10);

    drawPipes();

    document.getElementById('scoreDisplay').textContent = `Score: ${score}`;

    requestAnimationFrame(gameLoop);
}

// End the game and display the leaderboard
function endGame() {
    gameRunning = false;
    bgMusic.pause();
    submitScore();
    document.getElementById('leaderboard').classList.remove('hidden');
    document.getElementById('playAgainButton').classList.remove('hidden');
}

// Submit the score to the leaderboard
function submitScore() {
    if (!walletAddress) return;

    fetch('https://kasper-flappy.herokuapp.com/submit_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
            score: score
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fetchLeaderboard();
        } else {
            alert('Error submitting score!');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Fetch leaderboard
function fetchLeaderboard() {
    fetch('https://kasper-flappy.herokuapp.com/get_leaderboard')
    .then(response => response.json())
    .then(leaderboard => {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        leaderboard.forEach(entry => {
            let listItem = document.createElement('li');
            listItem.textContent = `Wallet: ${entry.wallet_address} - Score: ${entry.score}`;
            leaderboardList.appendChild(listItem);
        });
    });
}

// Handle "Play Again" button to restart the game
document.getElementById('playAgainButton').addEventListener('click', function() {
    document.getElementById('leaderboard').classList.add('hidden');
    document.getElementById('playAgainButton').classList.add('hidden');
    startGame();
});
