// =============================
// Variabel Global
// =============================

let gameScreen = 0; // 0 = start, 1 = game, 2 = game over

let ballX, ballY;
let ballSize = 20;

let gravity = 1;
let ballSpeedVert = 0;
let airfriction = 0.0001;
let friction = 0.1;

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

// Wall array: [x, y, width, gapheight, scored]
let walls = [];

let maxHealth = 100;
let health = 100;
let healthDecrease = 1;
let healthBarWidth = 60;

let scoreValue = 0;

// color theme
let bgTop, bgBottom;
let ballColorBright;
let racketColorBright;
let wallColorBright;


// =============================
// SETUP
// =============================
function setup() {
  createCanvas(500, 500);

  // Background gradient
  bgTop = color(52, 152, 219);     // biru muda
  bgBottom = color(155, 89, 182);  // ungu

  ballX = width / 4;
  ballY = height / 5;

  ballColorBright = color(241, 196, 15); // kuning
  racketColorBright = color(46, 204, 113); // hijau
  wallColorBright = color(231, 76, 60); // merah
}


// =============================
// MAIN DRAW
// =============================
function draw() {
  if (gameScreen === 0) initScreen();
  else if (gameScreen === 1) gameScreenDraw();
  else if (gameScreen === 2) gameOverScreen();
}


// =============================
// BACKGROUND GRADIENT
// =============================
function gradientBackground() {
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let col = lerpColor(bgTop, bgBottom, inter);
    stroke(col);
    line(0, y, width, y);
  }
}


// =============================
// SCREEN CONTENT
// =============================
function initScreen() {
  gradientBackground();

  textAlign(CENTER);
  fill(255);
  textSize(36);
  text("Bouncy Ball Game", width / 2, height / 2 - 40);

  textSize(18);
  text("Klik untuk memulai", width / 2, height / 2 + 10);
}

function gameScreenDraw() {
  gradientBackground();

  drawBall();
  applyGravity();
  keepInScreen();
  drawRacket();
  watchRacketBounce();
  applyHorizontalSpeed();

  wallAdder();
  wallHandler();

  drawHealthBar();

  drawScore();
}

function gameOverScreen() {
  gradientBackground();

  textAlign(CENTER);
  fill(255);
  textSize(40);
  text("GAME OVER", width / 2, height / 2 - 40);

  textSize(20);
  text("Skor Kamu: " + scoreValue, width / 2, height / 2);

  textSize(16);
  text("Klik untuk restart", width / 2, height / 2 + 40);
}


// =============================
// SCORE UI
// =============================
function drawScore() {
  textAlign(LEFT);
  fill(255);
  textSize(20);
  text("Score: " + scoreValue, 20, 30);
}


// =============================
// BALL
// =============================
function drawBall() {
  noStroke();

  fill(0, 50);
  ellipse(ballX + 5, ballY + 5, ballSize + 5);

  fill(ballColorBright);
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
  noStroke();

  // Shadow
  fill(0, 80);
  rect(mouseX + 3, mouseY + 3, racketWidth, racketHeight, 8);

  // Racket
  fill(racketColorBright);
  rect(mouseX, mouseY, racketWidth, racketHeight, 8);
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

  noStroke();

  fill(0, 60);
  rect(x + 5, 0 + 5, ww, y);
  rect(x + 5, y + gh + 5, ww, height - (y + gh));

  fill(wallColorBright);
  rect(x, 0, ww, y, 6);
  rect(x, y + gh, ww, height - (y + gh), 6);
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
// HEALTH BAR
// =============================
function drawHealthBar() {
  noStroke();
  rectMode(CORNER);

  fill(255, 255, 255, 80);
  rect(ballX - healthBarWidth / 2, ballY - 35, healthBarWidth, 8, 5);

  let col;
  if (health > 60) col = color(46, 204, 113);
  else if (health > 30) col = color(241, 196, 15);
  else col = color(231, 76, 60);

  // glow
  fill(red(col), green(col), blue(col), 150);
  rect(ballX - healthBarWidth / 2, ballY - 35, (health / maxHealth) * healthBarWidth, 8, 5);

  fill(col);
  rect(ballX - healthBarWidth / 2, ballY - 35, (health / maxHealth) * healthBarWidth, 8, 5);
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
function gameOver() {
  gameScreen = 2;
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


// =============================
// INPUT HANDLER
// =============================
function mousePressed() {
  if (gameScreen === 0) gameScreen = 1;
  else if (gameScreen === 2) restart();
}
