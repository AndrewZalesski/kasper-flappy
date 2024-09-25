
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
let highScore = 0;  // Initial high score

// Preload the Kasper ghost image before starting the game
let kasperLoaded = false;
const kasper = new Image();
kasper.src = 'assets/kasperghostflappy.png';
kasper.onload = function() {
    kasperLoaded = true;
};
kasper.onerror = function() {
    console.error("Error: Kasper image failed to load!");
};

// Variables for Kasper's movement and gravity mechanics
let kasperX = canvas.width / 10;
let kasperY = canvas.height / 2;
let gravity = 0.08;
let lift = -4;
let velocity = 0;

// Pipes and obstacles
let pipes = [];
let pipeWidth = canvas.width / 10;
let pipeGap = canvas.height / 3;
let pipeSpeed = 2;
let minPipeHeight = canvas.height / 8;
let maxPipeHeight = canvas.height / 2;

// Validation for Kaspa wallet address (correct format and length)
function isValidKaspaAddress(address) {
    const regex = /^kaspa:[a-z0-9]{59}$/i;  // Ensures correct case and length
    return regex.test(address);
}

// Handle form submission for wallet address
document.getElementById('walletForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent page refresh
    walletAddress = document.getElementById('walletAddress').value;

    if (!isValidKaspaAddress(walletAddress)) {
        alert('Please enter a valid Kaspa address starting with "kaspa:" and followed by letters and numbers.');
        return;
    }

    // Fetch high score from backend and display start game button
    fetch(`https://kasper-flappy.herokuapp.com/get_highscore?wallet=${walletAddress}`)
    .then(response => response.json())
    .then(data => {
        highScore = data.highScore || 0;
        document.getElementById('playScreen').classList.remove('hidden');
        document.getElementById('walletForm').classList.add('hidden');
    })
    .catch(error => console.error('Error fetching high score:', error));
});

// Click or touch to flap, mobile and desktop support
canvas.addEventListener('touchstart', function(e) {
    if (gameRunning) {
        velocity = lift;
    }
});
canvas.addEventListener('click', function(e) {
    if (gameRunning) {
        velocity = lift;
    }
});

// Game loop for rendering and updating game state
function gameLoop() {
    if (!gameRunning) return;
    updateGameState();
    drawGame();
    requestAnimationFrame(gameLoop);  // Use requestAnimationFrame for smooth animation
}

// Start game function, resets game state and runs game loop
function startGame() {
    gameRunning = true;
    velocity = 0;
    kasperY = canvas.height / 2;
    score = 0;
    pipes = [];
    gameLoop();
}

// Update Kasper's movement and handle gravity
function updateGameState() {
    velocity += gravity;
    kasperY += velocity;

    // Update pipes and check for collisions here
    updatePipes();
    checkCollisions();
}

// Draw Kasper and game elements
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Kasper
    ctx.drawImage(kasper, kasperX, kasperY, 50, 50);

    // Draw pipes and other game elements
    drawPipes();
}

// Pipe update function: move pipes and generate new ones
function updatePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }

    // Add new pipes periodically
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - pipeGap) {
        const pipeHeight = Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight;
        pipes.push({ x: canvas.width, height: pipeHeight });
    }
}

// Draw pipes on the canvas
function drawPipes() {
    pipes.forEach(pipe => {
        ctx.fillStyle = 'green';
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.height);  // Upper pipe
        ctx.fillRect(pipe.x, pipe.height + pipeGap, pipeWidth, canvas.height);  // Lower pipe
    });
}

// Check for collisions between Kasper and pipes or screen bounds
function checkCollisions() {
    if (kasperY + 50 > canvas.height || kasperY < 0) {
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

// End game, show final score, and reset
function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Score: ${score}`;
    document.getElementById('highScore').textContent = `High Score: ${highScore}`;
    document.getElementById('playAgainButton').classList.remove('hidden');
}

// Function to restart the game when "Play Again" is clicked
document.getElementById('playAgainButton').addEventListener('click', function() {
    document.getElementById('playAgainButton').classList.add('hidden');
    startGame();
});
