// =============================
// Variabel Global
// =============================

let gameScreen = 0; // 0 = start, 1 = game, 2 = game over

let ballX, ballY;
let ballSize = 20;
let ballColor;

let gravity = 1;
let ballSpeedVert = 0;
let airfriction = 0.0001;
let friction = 0.1;

let racketColor;
let racketWidth = 100;
let racketHeight = 10;
let racketBounceRate = 20;

let ballSpeedHorizon = 10;

let wallSpeed = 5;
let wallInterval = 1000;
let lastAddTime = 0;
let minGapHeight = 200;
let maxGapHeight = 300;
let wallWidth = 80;
let wallColors;

// Wall array: [x, y, width, gapheight, scored]
let walls = [];

let maxHealth = 100;
let health = 100;
let healthDecrease = 1;
let healthBarWidth = 60;

let scoreValue = 0;


// =============================
// SETUP
// =============================
function setup() {
  createCanvas(500, 500);
  ballX = width / 4;
  ballY = height / 5;

  ballColor = color(0);
  racketColor = color(0);
  wallColors = color(0);
}


// =============================
// DRAW (main loop)
// =============================
function draw() {
  if (gameScreen === 0) {
    initScreen();
  } else if (gameScreen === 1) {
    gameScreenDraw();
  } else if (gameScreen === 2) {
    gameOverScreen();
  }
}


// =============================
// SCREEN CONTENT
// =============================
function initScreen() {
  background(0);
  textAlign(CENTER);
  fill(255);
  text("Klik untuk memulai", width / 2, height / 2);
}

function gameScreenDraw() {
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
}


// =============================
// BALL
// =============================
function drawBall() {
  fill(ballColor);
  ellipse(ballX, ballY, ballSize);
}

function applyGravity() {
  ballSpeedVert += gravity;
  ballY += ballSpeedVert;
  ballSpeedVert -= ballSpeedVert * airfriction;
}

function makeBounceBottom(surface) {
  ballY = surface - ballSize / 2;
  ballSpeedVert *= -1;
  ballSpeedVert -= ballSpeedVert * friction;
}

function makeBounceTop(surface) {
  ballY = surface + ballSize / 2;
  ballSpeedVert *= -1;
  ballSpeedVert -= ballSpeedVert * friction;
}

function makeBounceLeft(surface) {
  ballX = surface + ballSize / 2;
  ballSpeedHorizon *= -1;
  ballSpeedHorizon -= ballSpeedHorizon * friction;
}

function makeBounceRight(surface) {
  ballX = surface - ballSize / 2;
  ballSpeedHorizon *= -1;
  ballSpeedHorizon -= ballSpeedHorizon * friction;
}

function keepInScreen() {
  if (ballY + ballSize / 2 > height) makeBounceBottom(height);
  if (ballY - ballSize / 2 < 0) makeBounceTop(0);
  if (ballX - ballSize / 2 < 0) makeBounceLeft(0);
  if (ballX + ballSize / 2 > width) makeBounceRight(width);
}

function applyHorizontalSpeed() {
  ballX += ballSpeedHorizon;
  ballSpeedHorizon -= ballSpeedHorizon * airfriction;
}


// =============================
// RACKET
// =============================
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


// =============================
// WALLS
// =============================
function wallAdder() {
  if (millis() - lastAddTime > wallInterval) {
    let randHeight = round(random(minGapHeight, maxGapHeight));
    let randY = round(random(0, height - randHeight));

    let wall = [width, randY, wallWidth, randHeight, 0];
    walls.push(wall);

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

function wallDrawer(index) {
  let w = walls[index];
  let x = w[0];
  let y = w[1];
  let ww = w[2];
  let gh = w[3];

  fill(wallColors);
  rectMode(CORNER);

  rect(x, 0, ww, y); // top
  rect(x, y + gh, ww, height - (y + gh)); // bottom
}

function wallMover(index) {
  walls[index][0] -= wallSpeed;
}

function wallRemover(index) {
  if (walls[index][0] + walls[index][2] < 0) {
    walls.splice(index, 1);
  }
}

function watchWallCollision(index) {
  let w = walls[index];
  let x = w[0];
  let y = w[1];
  let ww = w[2];
  let gh = w[3];
  let scored = w[4];

  let topWall = { x: x, y: 0, w: ww, h: y };
  let bottomWall = { x: x, y: y + gh, w: ww, h: height - (y + gh) };

  let hitTop =
    ballX + ballSize / 2 > topWall.x &&
    ballX - ballSize / 2 < topWall.x + topWall.w &&
    ballY + ballSize / 2 > topWall.y &&
    ballY - ballSize / 2 < topWall.y + topWall.h;

  let hitBottom =
    ballX + ballSize / 2 > bottomWall.x &&
    ballX - ballSize / 2 < bottomWall.x + bottomWall.w &&
    ballY + ballSize / 2 > bottomWall.y &&
    ballY - ballSize / 2 < bottomWall.y + bottomWall.h;

  if (hitTop || hitBottom) decreaseHealth();

  if (ballX > x + ww / 2 && scored === 0) {
    w[4] = 1;
    score();
  }
}


// =============================
// HEALTH & SCORE
// =============================
function drawHealthBar() {
  noStroke();

  rectMode(CORNER);

  fill(236, 240, 241);
  rect(ballX - healthBarWidth / 2, ballY - 30, healthBarWidth, 5);

  if (health > 60) fill(46, 204, 113);
  else if (health > 30) fill(230, 126, 34);
  else fill(231, 76, 60);

  rect(ballX - healthBarWidth / 2, ballY - 30, healthBarWidth * (health / maxHealth), 5);
}

function decreaseHealth() {
  health -= healthDecrease;
  if (health <= 0) gameOver();
}

function score() {
  scoreValue++;
}


// =============================
// GAME STATE
// =============================
function gameOverScreen() {
  background(0);
  textAlign(CENTER);
  fill(255);
  textSize(30);
  text("Game Over", width / 2, height / 2 - 20);
  textSize(15);
  text("Click to Restart", width / 2, height / 2 + 10);
}

function restart() {
  scoreValue = 0;
  health = maxHealth;
  ballX = width / 4;
  ballY = height / 5;
  lastAddTime = 0;
  walls = [];
  ballSpeedHorizon = 0;
  ballSpeedVert = 0;
  gameScreen = 0;
}

function gameOver() {
  gameScreen = 2;
}


// =============================
// INPUT
// =============================
function mousePressed() {
  if (gameScreen === 0) gameScreen = 1;
  else if (gameScreen === 2) restart();
}
