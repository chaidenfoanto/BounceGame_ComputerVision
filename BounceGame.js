// ===========================================================
//                 BOUNCY BALL — FINAL VERSION
//           Smooth, Realistic, Colorful, Aesthetic
// ===========================================================

// -------------------------------
// GLOBAL VARIABLES
// -------------------------------
let ballX, ballY;
let ballSpeedVert = 0;
let ballSpeedHorizon = 0;
let ballSize = 35;

let gravity = 0.6;
let friction = 0.05;
let airfriction = 0.00005;

let racketWidth = 90;
let racketHeight = 18;
let racketX = 0;
let racketY = 0;
let racketSmooth = 0.15;

let walls = [];
let wallSpeed = 3.2;
let wallTimer = 0;

let gameScreen = 0;
let score = 0;
let health = 3;

let floatingTexts = [];

let bgTop, bgBottom;

let niceColors = [
  '#FF7675',
  '#74B9FF',
  '#55EFC4',
  '#A29BFE',
  '#FFEAA7',
  '#FAB1A0',
  '#81ECEC'
];


// -------------------------------
// SETUP
// -------------------------------
function setup() {
  createCanvas(500, 500);

  ballX = width / 3;
  ballY = height / 2;

  racketX = ballX;
  racketY = ballY + 100;

  bgTop = color(0, 80, 200);
  bgBottom = color(100, 20, 200);
}


// -------------------------------
// DRAW LOOP
// -------------------------------
function draw() {
  if (gameScreen === 0) drawStart();
  else if (gameScreen === 1) drawGame();
  else if (gameScreen === 2) drawGameOver();
}


// ===========================================================
// START SCREEN
// ===========================================================
function drawStart() {
  gradientBackground();

  textAlign(CENTER);
  textSize(40);
  fill(255);
  text('BOUNCY BALL', width/2, height/2 - 40);

  textSize(20);
  fill(255, 180);
  text('Klik untuk mulai', width/2, height/2 + 20);
}


// ===========================================================
// GAME OVER
// ===========================================================
function drawGameOver() {
  gradientBackground();

  textAlign(CENTER);
  textSize(40);
  fill(255);
  text('GAME OVER', width/2, height/2 - 30);

  textSize(22);
  text('Score: ' + score, width/2, height/2 + 15);

  textSize(18);
  fill(255, 180);
  text('Klik untuk restart', width/2, height/2 + 60);
}


// ===========================================================
// MAIN GAME
// ===========================================================
function drawGame() {
  gradientBackground();

  applyGravity();
  moveBall();
  drawBallGlow();
  drawBall();
  applyHorizontalSpeed();
  drawRacket();
  wallProcessor();
  watchWallCollision();
  drawHUD();
  drawFloatingTexts();

  healthCheck();
}


// ===========================================================
// BACKGROUND GRADIENT
// ===========================================================
function gradientBackground() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(bgTop, bgBottom, inter);
    stroke(c);
    line(0, y, width, y);
  }
}


// ===========================================================
// BALL PHYSICS
// ===========================================================
function applyGravity() {
  ballSpeedVert += gravity;
  ballSpeedVert -= ballSpeedVert * airfriction;
}

function applyHorizontalSpeed() {
  ballSpeedHorizon *= (1 - friction);
  ballX += ballSpeedHorizon;
}

function moveBall() {
  ballY += ballSpeedVert;

  if (ballY + ballSize/2 >= height) {
    makeBounceBottom(height);
  }
}

function makeBounceBottom(surface) {
  ballY = surface - ballSize / 2;
  ballSpeedVert *= -0.9;
  ballSpeedHorizon *= 0.98;
}

function drawBallGlow() {
  noStroke();
  for (let i = 30; i > 0; i -= 5) {
    fill(255, 255, 255, i);
    ellipse(ballX, ballY, ballSize + i);
  }
}

function drawBall() {
  noStroke();
  fill(255);
  ellipse(ballX, ballY, ballSize);
}


// ===========================================================
// RACKET (FOLLOW MOUSE SMOOTH)
// ===========================================================
function drawRacket() {
  racketX += (mouseX - racketX) * racketSmooth;
  racketY += (mouseY - racketY) * racketSmooth;

  let left = racketX - racketWidth/2;
  let right = racketX + racketWidth/2;
  let top = racketY - racketHeight/2;
  let bottom = racketY + racketHeight/2;

  if (ballX > left &&
      ballX < right &&
      ballY + ballSize/2 > top &&
      ballY - ballSize/2 < bottom &&
      ballSpeedVert > 0) {

    ballY = top - ballSize/2;
    ballSpeedVert *= -0.9;
    ballSpeedHorizon += (mouseX - pmouseX) * 0.35;
  }

  noStroke();
  fill(0, 60);
  rect(left + 4, top + 4, racketWidth, racketHeight, 10);

  fill(255);
  rect(left, top, racketWidth, racketHeight, 10);
}


// ===========================================================
// WALL SYSTEM
// ===========================================================
function wallProcessor() {
  wallTimer++;
  if (wallTimer > 110) {
    createWall();
    wallTimer = 0;
  }

  for (let i = 0; i < walls.length; i++) {
    walls[i][0] -= wallSpeed;
    wallDrawer(i);
  }

  walls = walls.filter(w => w[0] + w[2] > 0);
}

function createWall() {
  let gapHeight = 140;
  let gapY = random(80, height - 200);
  let w = 70;

  let color = niceColors[int(random(niceColors.length))];

  walls.push([width, gapY, w, gapHeight, false, color]);
}

function wallDrawer(i) {
  let w = walls[i];
  let x = w[0];
  let gapY = w[1];
  let ww = w[2];
  let gapH = w[3];
  let col = w[5];

  noStroke();

  fill(0, 40);
  rect(x + 5, 0 + 5, ww, gapY, 12);
  rect(x + 5, gapY + gapH + 5, ww, height - (gapY + gapH), 12);

  fill(col);
  rect(x, 0, ww, gapY, 12);
  rect(x, gapY + gapH, ww, height - (gapY + gapH), 12);
}


// ===========================================================
// COLLISION + SCORING
// ===========================================================
function watchWallCollision() {
  for (let w of walls) {
    let x = w[0];
    let gapY = w[1];
    let gapH = w[3];
    let blockW = w[2];

    if (!w[4] && ballX > x + blockW) {
      w[4] = true;
      score++;

      floatingTexts.push({
        x: ballX,
        y: ballY,
        alpha: 255
      });
    }

    let hitTop =
      ballX + ballSize/2 > x &&
      ballX - ballSize/2 < x + blockW &&
      ballY - ballSize/2 < gapY;

    let hitBottom =
      ballX + ballSize/2 > x &&
      ballX - ballSize/2 < x + blockW &&
      ballY + ballSize/2 > gapY + gapH;

    if (hitTop || hitBottom) {
      decreaseHealth();
      shakeBall();
    }
  }
}

function shakeBall() {
  ballX += random(-2, 2);
  ballY += random(-2, 2);
}

function decreaseHealth() {
  health--;
}


// ===========================================================
// FLOATING TEXT +1
// ===========================================================
function drawFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let t = floatingTexts[i];

    fill(255, t.alpha);
    textSize(26);
    text("+1", t.x, t.y);

    t.y -= 1;
    t.alpha -= 4;

    if (t.alpha <= 0) floatingTexts.splice(i, 1);
  }
}


// ===========================================================
// HUD (Score & Health)
// ===========================================================
function drawHUD() {
  textSize(24);
  fill(255);
  textAlign(LEFT);
  text('Score: ' + score, 20, 40);

  text('Health: ' + health, 20, 70);
}

function healthCheck() {
  if (health <= 0) {
    gameScreen = 2;
  }
}


// ===========================================================
// INPUT
// ===========================================================
function mousePressed() {
  if (gameScreen === 0) {
    gameScreen = 1;
    restartGame();
  } else if (gameScreen === 2) {
    gameScreen = 0;
  }
}

function restartGame() {
  score = 0;
  health = 3;

  ballX = width / 3;
  ballY = height / 2;
  ballSpeedVert = 0;
  ballSpeedHorizon = 0;

  walls = [];
}

