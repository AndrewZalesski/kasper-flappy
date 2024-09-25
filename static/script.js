
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen canvas and responsiveness
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game variables
let gameRunning = false;
let walletAddress = '';
let score = 0;
let highScore = 0;
let velocity = 0;
let gravity = 0.08;
let lift = -4;
let kasperX = canvas.width / 10;
let kasperY = canvas.height / 2;
let pipes = [];
let pipeWidth = 60;
let pipeGap = 150;
let pipeSpeed = 2;

// Preload Kasper image
const kasper = new Image();
kasper.src = 'assets/kasperghostflappy.png';
kasper.onload = function() {
    console.log("Kasper image loaded successfully");
};

// Kaspa wallet validation (simple regex for kaspa address format)
function isValidKaspaAddress(address) {
    const regex = /^kaspa:[a-z0-9]{59}$/i;
    return regex.test(address);
}

// Handle form submission for wallet
document.getElementById('walletForm').addEventListener('submit', function(event) {
    event.preventDefault();
    walletAddress = document.getElementById('walletAddress').value;
    if (!isValidKaspaAddress(walletAddress)) {
        alert('Invalid Kaspa wallet address. Please check the format.');
        return;
    }
    // Fetch high score (simulated)
    highScore = 0;  // Reset high score to 0 for simplicity in this example
    document.getElementById('playScreen').classList.remove('hidden');
    document.getElementById('walletForm').classList.add('hidden');
});

// Start game and initialize variables
function startGame() {
    gameRunning = true;
    velocity = 0;
    score = 0;
    kasperY = canvas.height / 2;
    pipes = [];
    gameLoop();
}

// Main game loop using requestAnimationFrame
function gameLoop() {
    if (!gameRunning) return;
    updateGameState();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Update game state (gravity, movement, pipe generation)
function updateGameState() {
    velocity += gravity;
    kasperY += velocity;

    // Pipe movement and generation
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
    });

    // Add pipes if needed
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 300) {
        const pipeHeight = Math.random() * (canvas.height - pipeGap);
        pipes.push({ x: canvas.width, height: pipeHeight });
    }

    // Remove pipes that go off-screen
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    // Collision detection (simple bounds check)
    checkCollisions();
}

// Check for collisions with pipes or screen boundaries
function checkCollisions() {
    if (kasperY < 0 || kasperY + 50 > canvas.height) {
        endGame();
    }
    pipes.forEach(pipe => {
        if (kasperX + 50 > pipe.x && kasperX < pipe.x + pipeWidth) {
            if (kasperY < pipe.height || kasperY + 50 > pipe.height + pipeGap) {
                endGame();
            }
        }
    });
}

// Draw the game elements on canvas
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(kasper, kasperX, kasperY, 50, 50);

    // Draw pipes
    pipes.forEach(pipe => {
        ctx.fillStyle = 'green';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.height);
        ctx.fillRect(pipe.x, pipe.height + pipeGap, pipeWidth, canvas.height - pipe.height - pipeGap);
    });

    // Display score
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    ctx.fillText(`Score: ${score}`, 20, 50);
}

// End game, show final score, and reset
function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    document.getElementById('playAgainButton').classList.remove('hidden');
}

// Restart game when "Play Again" is clicked
document.getElementById('playAgainButton').addEventListener('click', function() {
    document.getElementById('playAgainButton').classList.add('hidden');
    startGame();
});

// Event listeners for flapping (click and touch)
canvas.addEventListener('click', function() {
    if (gameRunning) velocity = lift;
});
canvas.addEventListener('touchstart', function() {
    if (gameRunning) velocity = lift;
});
