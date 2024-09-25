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

// Validate Kaspa address with proper format
function isValidKaspaAddress(address) {
    const regex = /^kaspa:[a-zA-Z0-9]{8,}$/;
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
    fetch(`https://kasper-flappy.herokuapp.com/get_highscore?wallet_address=${walletAddress}`)
        .then(response => response.json())
        .then(data => {
            if (data.highScore) {
                highScore = data.highScore;  // Set the high score if it exists
            }
            document.getElementById('walletForm').classList.add('hidden');
            document.getElementById('playScreen').classList.remove('hidden');
        })
        .catch(error => console.error('Error fetching high score:', error));
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
        velocity = lift;  // Trigger jump on touch
    }
    e.preventDefault();
});
canvas.addEventListener('click', function() {
    if (gameRunning) {
        velocity = lift;  // Trigger jump on click
    }
});

// Draw pipes with fixed sizes
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

// Generate pipes with fixed minimum and maximum sizes
function generatePipes() {
    let top = minPipeHeight + Math.random() * (maxPipeHeight - minPipeHeight);
    let bottom = canvas.height - (top + pipeGap);
    pipes.push({x: canvas.width, top: top, bottom: bottom});
}

// Start the game after clicking "Start Game"
function startGame() {
    kasperY = canvas.height / 2;
    pipes = [];
    score = 0;
    gameRunning = true;
    gameLoop();
    generatePipes();
    setInterval(generatePipes, 2500);
}

// Game loop with proper image loading, drawing, and jumping mechanics
function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#74ebd5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    velocity += gravity;
    kasperY += velocity;

    if (kasperY < 0) {
        kasperY = 0;  // Prevent Kasper from flying off the top
    } else if (kasperY + canvas.height / 10 > canvas.height) {
        kasperY = canvas.height - canvas.height / 10;  // Prevent Kasper from falling off the bottom
        endGame();  // End game if Kasper hits the ground
    }

    if (kasperLoaded) {
        // Only draw Kasper when the image is fully loaded
        ctx.drawImage(kasper, kasperX, kasperY, canvas.width / 10, canvas.height / 10);
    }

    drawPipes();

    // Display and update score and high score during gameplay
    ctx.fillStyle = "#000";
    ctx.font = "24px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);  // Display current score at top left
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 150, 30);  // Display high score at top right

    requestAnimationFrame(gameLoop);
}

// End the game and display the leaderboard
function endGame() {
    gameRunning = false;
    highScore = Math.max(score, highScore);  // Update high score if current score is higher

    // Save the new high score for the wallet address
    fetch('https://kasper-flappy.herokuapp.com/save_highscore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
            high_score: highScore
        }),
    })
    .then(() => submitScore())
    .catch(error => console.error('Error saving high score:', error));
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
