
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



// Simulated high score data (for demonstration purposes)

    { wallet: "kaspa:example1", score: 500 },
    { wallet: "kaspa:example2", score: 450 },
    // Additional dummy data for demo
    { wallet: "kaspa:example3", score: 400 },
    { wallet: "kaspa:example4", score: 350 },
    { wallet: "kaspa:example5", score: 300 },
    { wallet: "kaspa:example6", score: 250 },
    { wallet: "kaspa:example7", score: 200 },
    { wallet: "kaspa:example8", score: 150 },
    { wallet: "kaspa:example9", score: 100 },
    // Add enough to simulate multiple pages
];

// Preload Kasper image
const kasper = new Image();
kasper.src = 'assets/kasperghostflappy.png';
kasper.onload = function() {
    console.log("Kasper image loaded successfully");
};

// Wallet validation: Must start with "kaspa:"
function isValidKaspaAddress(address) {
    return address.startsWith("kaspa:");
}

// Handle form submission for wallet
document.getElementById('walletForm').addEventListener('submit', function(event) {
    event.preventDefault();
    walletAddress = document.getElementById('walletAddress').value.trim();
    if (!isValidKaspaAddress(walletAddress)) {
        alert('Invalid wallet address. Must start with "kaspa:".');
        return;
    }
    // Hide form, show play button
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

// End game, show leaderboard and final score
function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    
    // Submit score to backend
    fetch('/submit_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
            score: score
        })
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showLeaderboard();
        } else {
            alert('Error submitting score: ' + data.message);
        }
    }).catch(error => {
        alert('An error occurred while submitting the score: ' + error.message);
    });

    document.getElementById('playAgainButton').classList.remove('hidden');
}
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    showLeaderboard();
    document.getElementById('playAgainButton').classList.remove('hidden');
}

// Show leaderboard, paginated to 25 entries at a time
function showLeaderboard() {
    const start = leaderboardPage * leaderboardPageSize;
    const end = start + leaderboardPageSize;
    const currentPageScores = highScores.slice(start, end);

    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';  // Clear previous content

    currentPageScores.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.textContent = `${entry.wallet}: ${entry.score}`;
        leaderboardElement.appendChild(entryElement);
    });

    // Update navigation buttons
    document.getElementById('prevButton').style.display = leaderboardPage > 0 ? 'inline' : 'none';
    document.getElementById('nextButton').style.display = end < highScores.length ? 'inline' : 'none';
}

// Navigate to the previous page of the leaderboard
document.getElementById('prevButton').addEventListener('click', function() {
    if (leaderboardPage > 0) {
        leaderboardPage--;
        showLeaderboard();
    }
});

// Navigate to the next page of the leaderboard
document.getElementById('nextButton').addEventListener('click', function() {
    if ((leaderboardPage + 1) * leaderboardPageSize < highScores.length) {
        leaderboardPage++;
        showLeaderboard();
    }
});

// Restart game when "Play Again" is clicked
document.getElementById('playAgainButton').addEventListener('click', function() {
    document.getElementById('playAgainButton').classList.add('hidden');
    document.getElementById('leaderboard').innerHTML = '';  // Clear leaderboard
    leaderboardPage = 0;  // Reset leaderboard page
    startGame();
});

// Event listeners for flapping (click and touch)
canvas.addEventListener('click', function() {
    if (gameRunning) velocity = lift;
});
canvas.addEventListener('touchstart', function() {
    if (gameRunning) velocity = lift;
});

// Leaderboard functionality and pagination

let leaderboardPage = 0;
const leaderboardPageSize = 25;

// Simulated high score data for testing
let highScores = [
    { wallet: "kaspa:example1", score: 500 },
    { wallet: "kaspa:example2", score: 450 },
    { wallet: "kaspa:example3", score: 400 },
    { wallet: "kaspa:example4", score: 350 },
    { wallet: "kaspa:example5", score: 300 },
    { wallet: "kaspa:example6", score: 250 },
    { wallet: "kaspa:example7", score: 200 },
    { wallet: "kaspa:example8", score: 150 },
    { wallet: "kaspa:example9", score: 100 }
];
    { wallet: "kaspa:example1", score: 500 },
    { wallet: "kaspa:example2", score: 450 },
    { wallet: "kaspa:example3", score: 400 },
    // Additional dummy data for demo
    // Fill more to test pagination if needed
];

// Function to show the leaderboard at the end of the game
function showLeaderboard() {
    const start = leaderboardPage * leaderboardPageSize;
    const end = start + leaderboardPageSize;
    const currentPageScores = highScores.slice(start, end);

    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';  // Clear previous content

    currentPageScores.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.textContent = `${entry.wallet}: ${entry.score}`;
        leaderboardElement.appendChild(entryElement);
    });

    // Update navigation buttons
    document.getElementById('prevButton').style.display = leaderboardPage > 0 ? 'inline' : 'none';
    document.getElementById('nextButton').style.display = end < highScores.length ? 'inline' : 'none';
}

// Navigate to the previous page of the leaderboard
document.getElementById('prevButton').addEventListener('click', function() {
    if (leaderboardPage > 0) {
        leaderboardPage--;
        showLeaderboard();
    }
});

// Navigate to the next page of the leaderboard
document.getElementById('nextButton').addEventListener('click', function() {
    if ((leaderboardPage + 1) * leaderboardPageSize < highScores.length) {
        leaderboardPage++;
        showLeaderboard();
    }
});

// Show the leaderboard at the end of the game
function endGame() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    
    // Submit score to backend
    fetch('/submit_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            wallet_address: walletAddress,
            score: score
        })
    }).then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showLeaderboard();
        } else {
            alert('Error submitting score: ' + data.message);
        }
    }).catch(error => {
        alert('An error occurred while submitting the score: ' + error.message);
    });

    document.getElementById('playAgainButton').classList.remove('hidden');
}
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Final Score: ${score}`;
    showLeaderboard();
    document.getElementById('playAgainButton').classList.remove('hidden');
}
