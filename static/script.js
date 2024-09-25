
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
kasper.src = 'assets/kasperghostflappy.png';  // Ensure correct path for ghost image
kasper.onload = function() {
    kasperLoaded = true;
    console.log("Kasper image loaded successfully");
};
kasper.onerror = function() {
    console.error("Error: Kasper image failed to load!");
};

let kasperX = canvas.width / 10;
let kasperY = canvas.height / 2;
let gravity = 0.08;
let lift = -4;
let velocity = 0;

let pipes = [];
let pipeWidth = canvas.width / 10;
let pipeGap = canvas.height / 3;
let pipeSpeed = 2;
let minPipeHeight = canvas.height / 8;  // Minimum pipe height to avoid tiny pipes
let maxPipeHeight = canvas.height / 2;  // Maximum pipe height to avoid pipes blocking the screen

// Improved validation for Kaspa address
function isValidKaspaAddress(address) {
    const regex = /^kaspa:[a-zA-Z0-9]{40,50}$/;
    return regex.test(address);
}

// Handle wallet form submission without refreshing the page
document.getElementById('walletForm').addEventListener('submit', function(event) {
    event.preventDefault();  // Prevent page refresh
    walletAddress = document.getElementById('walletAddress').value;

    if (!isValidKaspaAddress(walletAddress)) {
        alert('Please enter a valid Kaspa address starting with "kaspa:" and followed by letters and numbers.');
        return;
    }

    // Fetch the high score for the wallet address
    fetch(`https://kasper-flappy.herokuapp.com/get_highscore?wallet=${walletAddress}`)
    .then(response => response.json())
    .then(data => {
        highScore = data.highScore || 0;
        console.log('High score:', highScore);
        document.getElementById('playScreen').classList.remove('hidden');
        document.getElementById('walletForm').classList.add('hidden');
    })
    .catch(error => console.error('Error fetching high score:', error));
});

// Mobile and Desktop support for "flapping" (tapping or clicking)
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

// Optimized game loop using requestAnimationFrame
function gameLoop() {
    if (gameRunning) {
        updateGameState();
        drawGame();
        requestAnimationFrame(gameLoop);  // Smooth rendering
    }
}

function startGame() {
    gameRunning = true;
    velocity = 0;
    kasperY = canvas.height / 2;
    score = 0;
    pipes = [];
    gameLoop();
}

function updateGameState() {
    // Gravity and lift for Kasper
    velocity += gravity;
    kasperY += velocity;

    // Add your pipe update logic and collision detection here
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Kasper
    ctx.drawImage(kasper, kasperX, kasperY, 50, 50);

    // Add your pipe drawing logic here
}
