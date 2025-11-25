// Bouncy Ball — Enhanced Version (p5.js)
// Fitur utama:
// - Smooth racket following (easing)
// - Lebih realistis: perbaikan gravitasi, damping, skid
// - Visual upgrade: glow, motion blur, rounded walls, gradient buffer
// - Partikel saat bounce / hit wall
// - Health & Score yang halus
// - Optimisasi update menggunakan deltaTime

// =============================
// Variabel Global
// =============================
let gameScreen = 0; // 0 = start, 1 = game, 2 = game over

let ballX, ballY;
let ballSize = 22;

let gravity = 0.6;
let ballSpeedVert = 0;
let airfriction = 0.00005;
let bounceDamping = 0.92; // energi setelah memantul vertikal
let horizontalDamping = 0.98; // gesekan horizontal saat menyentuh lantai

let racketWidth = 120;
let racketHeight = 14;
let racketBounceRate = 20;

let racketX = 0;
let racketY = 0;
let racketSmooth = 0.18; // easing untuk mengikuti mouse
let racketPrevY = 0;

let ballSpeedHorizon = 0;

let wallSpeed = 4.5;
let wallInterval = 1200; // ms
let lastAddTime = 0;
let minGapHeight = 160;
let maxGapHeight = 260;
let wallBaseWidth = 84;

// Wall array: objects {x, y, w, gh, scored}
let walls = [];

let maxHealth = 100;
let health = 100;
let targetHealth = 100; // untuk interpolasi halus
let healthDecrease = 12; // decrease per hit
let healthBarWidth = 72;

let scoreValue = 0;

let bgTop, bgBottom;
let ballColorBright;
let racketColorBright;
let wallColorBright;
let wallAccentColor;

let gradientBuffer;

let particles = []; // for bounce + hit effects

// timing
let lastFrameTime = 0;

// =============================
// SETUP
// =============================
function setup() {
  createCanvas(700, 500);
  pixelDensity(1);

  // Theme
  bgTop = color(40, 130, 210);     // biru
  bgBottom = color(115, 65, 180);  // ungu

  ballColorBright = color(255, 204, 0); // kuning hangat
  racketColorBright = color(72, 201, 176); // teal/hijau
  wallColorBright = color(236, 112, 99); // coral
  wallAccentColor = color(192, 57, 43);

  // initial ball
  ballX = width / 4;
  ballY = height / 5;

  racketX = width / 2 - racketWidth / 2;
  racketY = height - 80;

  health = maxHealth;
  targetHealth = maxHealth;

  // gradient buffer to avoid banding (generate once)
  gradientBuffer = createGraphics(width, height);
  drawGradientToBuffer();

  textFont('Verdana');
  textAlign(CENTER, CENTER);
  lastFrameTime = millis();
  frameRate(60);
}

// draw gradient once
function drawGradientToBuffer() {
  let g = gradientBuffer;
  g.noFill();
  for (let y = 0; y < g.height; y++) {
    let inter = map(y, 0, g.height, 0, 1);
    let col = lerpColor(bgTop, bgBottom, inter);
    g.stroke(col);
    g.line(0, y, g.width, y);
  }
  // subtle vignette
  g.noStroke();
  g.fill(0, 0, 0, 25);
  g.ellipse(g.width / 2, g.height / 2 + 40, g.width * 1.2, g.height * 1.3);
}

// =============================
// MAIN DRAW
// =============================
function draw() {
  // delta time for frame-rate independent physics
  let now = millis();
  let dt = constrain((now - lastFrameTime) / 16.6667, 0.1, 4); // scaled to ~60fps units
  lastFrameTime = now;

  if (gameScreen === 0) initScreen(dt);
  else if (gameScreen === 1) gameScreenDraw(dt);
  else if (gameScreen === 2) gameOverScreen(dt);
}

// =============================
// BACKGROUND
// =============================
function gradientBackground() {
  image(gradientBuffer, 0, 0);
  // animated subtle overlay lines
  push();
  noFill();
  stroke(255, 255, 255, 8);
  strokeWeight(1);
  let t = millis() / 1000;
  for (let i = 0; i < 6; i++) {
    let offset = sin(t * 0.4 + i) * 20;
    rect(-20 + offset + i * 40, i * 60, width + 40, 40, 20);
  }
  pop();
}

// =============================
// SCREENS
// =============================
function initScreen(dt) {
  gradientBackground();

  // Title with shadow
  push();
  textAlign(CENTER);
  textSize(46);
  fill(0, 120);
  text("Bouncy Ball", width / 2 + 3, height / 2 - 86 + 3);
  fill(255);
  text("Bouncy Ball", width / 2, height / 2 - 86);

  textSize(18);
  fill(255, 200);
  text("Klik layar untuk memulai • Gunakan mouse untuk menggerakkan racket", width / 2, height / 2 - 38);
  pop();

  // show sample ball + racket
  push();
  // sample glow
  drawBallGlow(width / 2, height / 2 + 10, 26);
  fill(ballColorBright);
  noStroke();
  ellipse(width / 2, height / 2 + 10, 22);

  // racket
  fill(racketColorBright);
  rectMode(CENTER);
  rect(width / 2, height / 2 + 80, racketWidth, racketHeight, 10);
  pop();
}

function gameScreenDraw(dt) {
  gradientBackground();

  // update racket smooth
  updateRacket(dt);

  // draw elements (order matters for visuals)
  handleWalls(dt);
  applyGravity(dt);
  applyHorizontalSpeed(dt);
  keepInScreen();

  // particles behind ball
  updateParticles(dt);

  // ball visuals
  drawBallGlow(ballX, ballY, ballSize);
  drawBallMotionBlur(ballX, ballY, ballSize);
  drawBall();

  drawRacket();

  drawHealthBar(dt);
  drawScore();

  watchRacketBounce();
  watchAllWallCollision();

  // spawn walls periodically
  wallAdder();

  // auto game over if ball fell off very low (extra safety)
  if (ballY > height + 200) {
    gameOver();
  }
}

function gameOverScreen(dt) {
  gradientBackground();

  push();
  textAlign(CENTER);
  fill(255);
  textSize(48);
  text("GAME OVER", width / 2, height / 2 - 60);

  textSize(20);
  fill(255, 220);
  text("Skor Kamu: " + scoreValue, width / 2, height / 2 - 10);

  textSize(16);
  text("Klik layar untuk restart", width / 2, height / 2 + 36);
  pop();

  // faded background ball + particles for aesthetics
  updateParticles(dt);
  drawScore();
}

// =============================
// SCORE UI
// =============================
function drawScore() {
  push();
  textAlign(LEFT, TOP);
  textSize(20);
  // shadow
  fill(0, 140);
  text("Score: " + scoreValue, 24 + 2, 18 + 2);
  fill(255);
  text("Score: " + scoreValue, 24, 18);
  pop();
}

// =============================
// BALL VISUALS & PHYSICS
// =============================
function drawBall() {
  noStroke();
  fill(255, 255, 255, 12);
  ellipse(ballX + 2, ballY + 2, ballSize + 6); // subtle specular

  // core
  fill(ballColorBright);
  noStroke();
  ellipse(ballX, ballY, ballSize);

  // small highlight
  fill(255, 255, 255, 180);
  ellipse(ballX - ballSize * 0.18, ballY - ballSize * 0.18, ballSize * 0.28);
}

// glow function (can be reused)
function drawBallGlow(x, y, s) {
  noStroke();
  for (let i = 28; i > 0; i -= 4) {
    let alpha = map(i, 28, 4, 6, 120);
    fill(red(ballColorBright), green(ballColorBright), blue(ballColorBright), alpha);
    ellipse(x, y, s + i * 1.6);
  }
}

// motion blur for faster horizontal/vertical movement
function drawBallMotionBlur(x, y, s) {
  noStroke();
  // blur behind based on velocities
  for (let i = 1; i <= 3; i++) {
    let fx = x - ballSpeedHorizon * i * 0.6;
    let fy = y - ballSpeedVert * i * 0.6;
    fill(red(ballColorBright), green(ballColorBright), blue(ballColorBright), 28 / i);
    ellipse(fx, fy, s + i * 4);
  }
}

function applyGravity(dt) {
  ballSpeedVert += gravity * dt;
  ballY += ballSpeedVert * dt;
  ballSpeedVert -= ballSpeedVert * airfriction * dt;
}

function makeBounceBottom(surface) {
  ballY = surface - ballSize / 2;
  ballSpeedVert *= -bounceDamping;
  // reduce horizontal a bit to simulate skid/friction
  ballSpeedHorizon *= horizontalDamping;
  spawnBounceParticles(ballX, ballY + ballSize / 2, min(10, abs(ballSpeedVert) * 0.8));
}

function makeBounceTop(surface) {
  ballY = surface + ballSize / 2;
  ballSpeedVert *= -bounceDamping;
  spawnBounceParticles(ballX, ballY - ballSize / 2, 6);
}

function makeBounceLeft(surface) {
  ballX = surface + ballSize / 2;
  ballSpeedHorizon *= -bounceDamping;
  spawnBounceParticles(ballX, ballY, 6);
}

function makeBounceRight(surface) {
  ballX = surface - ballSize / 2;
  ballSpeedHorizon *= -bounceDamping;
  spawnBounceParticles(ballX, ballY, 6);
}

function keepInScreen() {
  if (ballY + ballSize / 2 > height) makeBounceBottom(height);
  if (ballY - ballSize / 2 < 0) makeBounceTop(0);
  if (ballX - ballSize / 2 < 0) makeBounceLeft(0);
  if (ballX + ballSize / 2 > width) makeBounceRight(width);
}

function applyHorizontalSpeed(dt) {
  ballX += ballSpeedHorizon * dt;
  ballSpeedHorizon -= ballSpeedHorizon * airfriction * dt;
}

// =============================
// RACKET (smooth)
// =============================
function updateRacket(dt) {
  // smooth follow mouse (top-left coordinates)
  let targetX = constrain(mouseX - racketWidth / 2, 12, width - racketWidth - 12);
  let targetY = constrain(mouseY - racketHeight / 2, 12, height - racketHeight - 12);

  racketX += (targetX - racketX) * racketSmooth * dt;
  racketY += (targetY - racketY) * racketSmooth * dt;
}

function drawRacket() {
  noStroke();
  // shadow
  fill(0, 110);
  rect(racketX + 6, racketY + 6, racketWidth, racketHeight, 12);

  // body
  fill(racketColorBright);
  rect(racketX, racketY, racketWidth, racketHeight, 12);

  // accent stripe
  fill(255, 255, 255, 24);
  rect(racketX, racketY + 2, racketWidth * 0.6, racketHeight * 0.4, 10);
}

function watchRacketBounce() {
  // collision rectangle for racket
  let rx = racketX;
  let ry = racketY;
  let rw = racketWidth;
  let rh = racketHeight;

  // ball centre vs racket rect overlap test
  let closestX = constrain(ballX, rx, rx + rw);
  let closestY = constrain(ballY, ry, ry + rh);

  let dx = ballX - closestX;
  let dy = ballY - closestY;
  let distSq = dx * dx + dy * dy;

  if (distSq <= (ballSize / 2) * (ballSize / 2)) {
    // Collision: bounce as if hitting a surface at racketY
    // Determine vertical bounce surface slightly above racket to avoid penetrating
    makeBounceBottom(ry);
    // Give horizontal speed based on where it hit relative to racket center
    let center = rx + rw / 2;
    ballSpeedHorizon = (ballX - center) / 4 + ballSpeedHorizon * 0.2;

    // If racket is moving upward fast, add extra vertical kick
    let overhead = (racketY - racketPrevY);
    if (overhead < -1) {
      ballY += overhead;
      ballSpeedVert += overhead * 0.6;
    }

    // small camera-like nudge
    spawnBounceParticles(ballX, ballY + ballSize / 2, 10);
  }

  // store previous Y for next frame
  racketPrevY = racketY;
}

// =============================
// WALLS
// =============================
function wallAdder() {
  if (millis() - lastAddTime > wallInterval) {
    let randGap = round(random(minGapHeight, maxGapHeight));
    let randY = round(random(60, height - randGap - 60));
    let w = {
      x: width + 20,
      y: randY,
      w: wallBaseWidth,
      gh: randGap,
      scored: false
    };
    walls.push(w);
    lastAddTime = millis();
  }
}

function handleWalls(dt) {
  // move + draw + remove
  for (let i = walls.length - 1; i >= 0; i--) {
    walls[i].x -= wallSpeed * dt;
    drawWall(walls[i]);
    if (walls[i].x + walls[i].w < -40) {
      walls.splice(i, 1);
    }
  }
}

function drawWall(w) {
  push();
  noStroke();
  let x = w.x, y = w.y, ww = w.w, gh = w.gh;

  // shadow
  fill(0, 80);
  rect(x + 8, 0 + 8, ww, y, 16);
  rect(x + 8, y + gh + 8, ww, height - (y + gh), 16);

  // main wall top
  fill(wallColorBright);
  rect(x, 0, ww, y, 16);
  // accent line
  fill(wallAccentColor);
  rect(x + 8, max(8, y - 18), ww - 16, 8, 8);

  // main wall bottom
  fill(wallColorBright);
  rect(x, y + gh, ww, height - (y + gh), 16);
  fill(wallAccentColor);
  rect(x + 8, y + gh + 6, ww - 16, 8, 8);

  // subtle highlight on edges
  fill(255, 255, 255, 18);
  rect(x + 4, 0, 6, y, 8);
  rect(x + 4, y + gh, 6, height - (y + gh), 8);

  pop();
}

function watchAllWallCollision() {
  for (let i = 0; i < walls.length; i++) {
    let w = walls[i];
    // top rectangle
    let hitTop =
      ballX + ballSize / 2 > w.x &&
      ballX - ballSize / 2 < w.x + w.w &&
      ballY + ballSize / 2 > 0 &&
      ballY - ballSize / 2 < w.y;

    // bottom rectangle
    let hitBottom =
      ballX + ballSize / 2 > w.x &&
      ballX - ballSize / 2 < w.x + w.w &&
      ballY + ballSize / 2 > w.y + w.gh &&
      ballY - ballSize / 2 < height;

    if (hitTop) {
      decreaseHealth();
      makeBounceTop(w.y);
      // knock ball a bit horizontally away
      ballSpeedHorizon = -abs(ballSpeedHorizon) - 2;
      spawnHitParticles(ballX, ballY, 10);
    } else if (hitBottom) {
      decreaseHealth();
      makeBounceBottom(w.y + w.gh);
      ballSpeedHorizon = abs(ballSpeedHorizon) + 2;
      spawnHitParticles(ballX, ballY, 10);
    }

    // scoring: crossing middle of wall
    if (!w.scored && ballX > w.x + w.w / 2) {
      w.scored = true;
      score();
      spawnScoreParticles(w.x + w.w / 2, height / 2, 12);
    }
  }
}

// =============================
// PARTICLES
// =============================
function spawnBounceParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    let angle = random(-PI, 0);
    let speed = random(1, 6);
    particles.push({
      x: x + random(-6, 6),
      y: y + random(-4, 4),
      vx: cos(angle) * speed + random(-1, 1),
      vy: sin(angle) * speed + random(-1, 1),
      life: random(400, 900),
      born: millis(),
      size: random(2, 6)
    });
  }
}

function spawnHitParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    let angle = random(0, TWO_PI);
    let speed = random(1.5, 5.5);
    particles.push({
      x: x + random(-4, 4),
      y: y + random(-4, 4),
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(500, 1100),
      born: millis(),
      size: random(2, 5)
    });
  }
}

function spawnScoreParticles(x, y, count) {
  for (let i = 0; i < count; i++) {
    let angle = map(i, 0, count, -PI / 2 - 0.6, -PI / 2 + 0.6) + random(-0.1, 0.1);
    let speed = random(2, 5);
    particles.push({
      x: x + random(-10, 10),
      y: y + random(-40, 40),
      vx: cos(angle) * speed,
      vy: sin(angle) * speed,
      life: random(700, 1300),
      born: millis(),
      size: random(3, 6)
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    // simple physics
    p.vy += 0.06 * dt; // gravity on particles
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    let age = millis() - p.born;
    let life = p.life;
    let alpha = map(age, 0, life, 255, 0);
    if (alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    noStroke();
    fill(255, alpha * 0.9);
    ellipse(p.x, p.y, p.size);
  }
}

// =============================
// HEALTH BAR
// =============================
function drawHealthBar(dt) {
  // smooth interpolation for visible bar
  targetHealth = constrain(health, 0, maxHealth);
  health = lerp(health, targetHealth, 0.12 * dt);

  push();
  rectMode(CENTER);
  let barX = ballX;
  let barY = ballY - 44;
  // background
  noStroke();
  fill(255, 255, 255, 60);
  rect(barX, barY + 1, healthBarWidth + 6, 12, 6);

  // colour based on percent
  let pct = health / maxHealth;
  let col;
  if (pct > 0.6) col = color(72, 201, 176);
  else if (pct > 0.3) col = color(241, 196, 15);
  else col = color(231, 76, 60);

  // glow behind bar
  fill(red(col), green(col), blue(col), 120);
  rect(barX, barY + 1, (healthBarWidth) * pct, 12, 6);

  // solid top
  fill(col);
  rect(barX, barY, (healthBarWidth) * pct, 8, 6);

  // tiny border
  noFill();
  stroke(0, 30);
  rect(barX, barY + 1, healthBarWidth + 6, 12, 6);

  pop();
}

function decreaseHealth() {
  targetHealth -= healthDecrease;
  if (targetHealth <= 0) {
    targetHealth = 0;
    gameOver();
  }
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
  targetHealth = maxHealth;
  ballX = width / 4;
  ballY = height / 5;
  lastAddTime = 0;
  walls = [];
  particles = [];
  ballSpeedHorizon = 0;
  ballSpeedVert = 0;
  gameScreen = 0;
}

// =============================
// INPUT
// =============================
function mousePressed() {
  if (gameScreen === 0) {
    // start game; give a small nudge so first interactions feel dynamic
    ballSpeedHorizon = 0;
    ballSpeedVert = 2;
    gameScreen = 1;
    lastAddTime = millis() - 400;
  } else if (gameScreen === 2) {
    restart();
  }
}

// OPTIONAL: keyboard for quick testing
function keyPressed() {
  if (key === 'r' || key === 'R') restart();
  if (key === ' ' && gameScreen === 1) {
    // small jump for testing
    ballSpeedVert -= 8;
  }
}
