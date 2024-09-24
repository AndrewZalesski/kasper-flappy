
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Fullscreen canvas and proportional resizing
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

// Load assets
const backgroundGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
backgroundGradient.addColorStop(0, "#87CEFA");
backgroundGradient.addColorStop(1, "#FFFFFF");

const kasper = new Image();
kasper.src = 'assets/kasperghostflappy.png';

const flapSound = new Audio('assets/flap.wav');
const gameOverSound = new Audio('assets/gameover.wav');
const bgMusic = new Audio('assets/background.mp3');
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

let gameOver = false;

// Ask the user for their wallet address and then show a "Start Game" button
document.getElementById('walletForm').addEventListener('submit', function(event) {
  event.preventDefault();
  walletAddress = document.getElementById('walletAddress').value;
  if (walletAddress) {
    document.getElementById('playScreen').classList.remove('hidden');
    document.getElementById('walletForm').classList.add('hidden');
  }
});

// Show game instructions and the "Start Game" button
document.getElementById('startGameButton').addEventListener('click', function() {
  document.getElementById('playScreen').classList.add('hidden');
  document.getElementById('scoreDisplay').classList.remove('hidden');  // Show score
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

    ctx.fillStyle = "#228B22"; // Pipe color
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipeWidth, pipe.bottom);

    if (pipe.x + pipeWidth < 0) {
      pipes.splice(i, 1);
      score += 1;  // Increment score when pipe passes
    }
  }
}

// Generate pipes
function generatePipes() {
  let top = Math.random() * (canvas.height / 2);
  let bottom = canvas.height - (top + pipeGap);
  pipes.push({x: canvas.width, top: top, bottom: bottom});
}

function startGame() {
  kasperY = canvas.height / 2;
  pipes = [];
  score = 0;
  gameRunning = true;
  bgMusic.play();
  gameLoop();
  generatePipes();
  setInterval(generatePipes, 2500);  // Generate pipes every 2.5 seconds
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw background
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw Kasper
  velocity += gravity;
  kasperY += velocity;
  ctx.drawImage(kasper, kasperX, kasperY, canvas.width / 10, canvas.height / 10);

  // Draw pipes
  drawPipes();

  // Update score display
  document.getElementById('scoreDisplay').textContent = `Score: ${score}`;

  requestAnimationFrame(gameLoop);
}

function restartGame() {
  gameOver = false;
  gameRunning = false;
  bgMusic.pause();
  bgMusic.currentTime = 0;
  document.getElementById('gameOver').classList.remove('hidden');
}

// Submit the score and show the leaderboard after the game ends
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
      document.getElementById('leaderboard').classList.remove('hidden');
    });
}
