// =============================================================
//                      FINAL GAME VERSION (p5.js)
//            Random Wall Colors + Scoring System
// =============================================================

// Game Screens
// 0 = Initial Screen
// 1 = Game Screen
// 2 = Game Over Screen
let gameScreen = 0;

// Ball
let ballX, ballY;
let ballSize = 20;
let ballColor;
let gravity = 1;
let ballSpeedVert = 0;
let airfriction = 0.0001;
let friction = 0.1;
let ballSpeedHorizon = 0;

// Racket
let racketColor;
let racketWidth = 100;
let racketHeight = 10;
let racketBounceRate = 20;

// Walls
let wallSpeed = 5;
let wallInterval = 1200;
let lastAddTime = 0;
let minGapHeight = 200;
let maxGapHeight = 300;
let wallWidth = 80;

// Walls: [x, y, width, height, scoredFlag, color]
let walls = [];

// Health
let maxHealth = 100;
let health = 100;
let healthDecrease = 1;
let healthBarWidth = 60;

// Score
let score = 0;


// ========================= SETUP ==============================

function setup() {
  createCanvas(500, 500);

  ballColor = color(0);
  racketColor = color(0);

  ballX = width / 4;
  ballY = height / 5;
}

function draw() {
  if (gameScreen === 0) initScreen();
  else if (gameScreen === 1) gameScreenFunc();
  else if (gameScreen === 2) gameOverScreen();
}


// ========================= SCREENS ==============================

function initScreen() {
  background(0);
  textAlign(CENTER);
  fill(255);
  textSize(20);
  text("Klik untuk memulai", width / 2, height / 2);
}

function gameScreenFunc() {
  background(255);

  drawBall();
  applyGravity();
  keepInScreen();

  drawRacket();
  watchRacketBounce();
  applyHorizontalSpeed();

  wallAdder();
  wallHandler();

  drawHealthBar();
  printScore();
}

function gameOverScreen() {
  background(0);
  textAlign(CENTER);
  fill(255);
  textSize(30);
  text("Game Over", width / 2, height / 2 - 20);
  textSize(15);
  text("Click to Restart", width / 2, height / 2 + 20);
}


// ========================= BALL ==============================

function drawBall() {
  fill(ballColor);
  ellipse(ballX, ballY, ballSize, ballSize);
}

function applyGravity() {
  ballSpeedVert += gravity;
  ballY += ballSpeedVert;
  ballSpeedVert -= (ballSpeedVert * airfriction);
}

function makeBounceBottom(surface) {
  ballY = surface - (ballSize / 2);
  ballSpeedVert *= -1;
  ballSpeedVert -= ballSpeedVert * friction;
}

function makeBounceTop(surface) {
  ballY = surface + (ballSize / 2);
  ballSpeedVert *= -1;
  ballSpeedVert -= ballSpeedVert * friction;
}

function makeBounceLeft(surface) {
  ballX = surface + (ballSize / 2);
  ballSpeedHorizon *= -1;
  ballSpeedHorizon -= ballSpeedHorizon * friction;
}

function makeBounceRight(surface) {
  ballX = surface - (ballSize / 2);
  ballSpeedHorizon *= -1;
  ballSpeedHorizon -= ballSpeedHorizon * friction;
}

function keepInScreen() {
  if (ballY + ballSize / 2 > height) makeBounceBottom(height);
  if (ballY - ballSize / 2 < 0) makeBounceTop(0);
  if (ballX - ballSize / 2 < 0) makeBounceLeft(0);
  if (ballX + ballSize / 2 > width) makeBounceRight(width);
}


// ========================= RACKET ==============================

function drawRacket() {
  fill(racketColor);
  rectMode(CENTER);
  rect(mouseX, mouseY, racketWidth, racketHeight);
}

function watchRacketBounce() {
  let overhead = mouseY - pmouseY;

  if (
    ballX + ballSize / 2 > mouseX - racketWidth / 2 &&
    ballX - ballSize / 2 < mouseX + racketWidth / 2
  ) {
    if (dist(ballX, ballY, ballX, mouseY) <= ballSize / 2 + abs(overhead)) {
      makeBounceBottom(mouseY);
      ballSpeedHorizon = (ballX - mouseX) / 5;

      if (overhead < 0) {
        ballY += overhead;
        ballSpeedVert += overhead;
      }
    }
  }
}

function applyHorizontalSpeed() {
  ballX += ballSpeedHorizon;
  ballSpeedHorizon -= ballSpeedHorizon * airfriction;
}


// ========================= WALL ==============================

function wallAdder() {
  if (millis() - lastAddTime > wallInterval) {
    let randHeight = round(random(minGapHeight, maxGapHeight));
    let randY = round(random(0, height - randHeight));

    let randomCol = color(random(255), random(255), random(255));

    let randWall = [width, randY, wallWidth, randHeight, 0, randomCol];
    walls.push(randWall);

    lastAddTime = millis();
  }
}

function wallHandler() {
  for (let i = walls.length - 1; i >= 0; i--) {
    wallMover(i);
    wallDrawer(i);
    watchWallCollision(i);
    wallRemover(i);
  }
}

function wallDrawer(i) {
  let wall = walls[i];

  let x = wall[0];
  let y = wall[1];
  let w = wall[2];
  let h = wall[3];
  let col = wall[5];

  rectMode(CORNER);
  fill(col);

  rect(x, 0, w, y);
  rect(x, y + h, w, height - (y + h));
}

function wallMover(i) {
  walls[i][0] -= wallSpeed;
}

function wallRemover(i) {
  if (walls[i][0] + walls[i][2] <= 0) walls.splice(i, 1);
}

function watchWallCollision(i) {
  let wall = walls[i];
  let x = wall[0];
  let y = wall[1];
  let w = wall[2];
  let h = wall[3];
  let scored = wall[4];

  if (
    ballX + ballSize / 2 > x &&
    ballX - ballSize / 2 < x + w &&
    ballY - ballSize / 2 < y
  ) {
    decreaseHealth();
  }

  if (
    ballX + ballSize / 2 > x &&
    ballX - ballSize / 2 < x + w &&
    ballY + ballSize / 2 > y + h
  ) {
    decreaseHealth();
  }

  if (ballX > x + w / 2 && scored === 0) {
    wall[4] = 1;
    score++;
  }
}


// ========================= HEALTH & SCORE ==============================

function drawHealthBar() {
  noStroke();
  fill(220);
  rect(ballX - healthBarWidth / 2, ballY - 30, healthBarWidth, 5);

  if (health > 60) fill(46, 204, 113);
  else if (health > 30) fill(230, 126, 34);
  else fill(231, 76, 60);

  rect(
    ballX - healthBarWidth / 2,
    ballY - 30,
    healthBarWidth * (health / maxHealth),
    5
  );
}

function decreaseHealth() {
  health -= healthDecrease;
  if (health <= 0) gameOver();
}

function printScore() {
  textAlign(LEFT);
  fill(0);
  textSize(20);
  text("Score: " + score, 10, 25);
}


// ========================= GAME CONTROL ==============================

function mousePressed() {
  if (gameScreen === 0) startGame();
  if (gameScreen === 2) restart();
}

function startGame() {
  gameScreen = 1;
}

function restart() {
  score = 0;
  health = maxHealth;
  ballX = width / 4;
  ballY = height / 5;
  lastAddTime = 0;
  walls = [];
  ballSpeedVert = 0;
  ballSpeedHorizon = 0;
  gameScreen = 0;
}

function gameOver() {
  gameScreen = 2;
}
