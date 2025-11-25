// =============================================================
//                      FINAL GAME VERSION
//            Random Wall Colors + Scoring System
// =============================================================

// Variabel Global
// 0 = Initial Screen
// 1 = Game Screen
// 2 = Game Over Screen
int gameScreen = 0;

// Ball
float ballX, ballY;
int ballSize = 20;
color ballColor = color(0);
float gravity = 1;
float ballSpeedVert = 0;
float airfriction = 0.0001;
float friction = 0.1;
float ballSpeedHorizon = 0;

// Racket
color racketColor = color(0);
float racketWidth = 100;
float racketHeight = 10;
int racketBounceRate = 20;

// Wall Properties
int wallSpeed = 5;
int wallInterval = 1200;
float lastAddTime = 0;
int minGapHeight = 200;
int maxGapHeight = 300;
int wallWidth = 80;

// Walls: [x, y, width, height, scoredFlag, color]
ArrayList<int[]> walls = new ArrayList<int[]>();

// Health
int maxHealth = 100;
float health = 100;
float healthDecrease = 1;
int healthBarWidth = 60;

// Score
int score = 0;

void setup() {
  size(500, 500);
  ballX = width/4;
  ballY = height/5;
}

void draw() {
  if (gameScreen == 0) initScreen();
  else if (gameScreen == 1) gameScreen();
  else if (gameScreen == 2) gameOverScreen();
}


// ========================= SCREEN ==============================

void initScreen() {
  background(0);
  textAlign(CENTER);
  fill(255);
  textSize(20);
  text("Klik untuk memulai", width/2, height/2);
}

void gameScreen() {
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
  printScore();   // TAMPILKAN SCORE
}

void gameOverScreen() {
  background(0);
  textAlign(CENTER);
  fill(255);
  textSize(30);
  text("Game Over", width/2, height/2 - 20);
  textSize(15);
  text("Click to Restart", width/2, height/2 + 20);
}


// ========================= BALL ==============================

void drawBall() {
  fill(ballColor);
  ellipse(ballX, ballY, ballSize, ballSize);
}

void applyGravity() {
  ballSpeedVert += gravity;
  ballY += ballSpeedVert;
  ballSpeedVert -= (ballSpeedVert * airfriction);
}

void makeBounceBottom(float surface) {
  ballY = surface - (ballSize/2);
  ballSpeedVert *= -1;
  ballSpeedVert -= (ballSpeedVert * friction);
}

void makeBounceTop(float surface) {
  ballY = surface + (ballSize/2);
  ballSpeedVert *= -1;
  ballSpeedVert -= (ballSpeedVert * friction);
}

void makeBounceLeft(float surface) {
  ballX = surface + (ballSize/2);
  ballSpeedHorizon *= -1;
  ballSpeedHorizon -= (ballSpeedHorizon * friction);
}

void makeBounceRight(float surface) {
  ballX = surface - (ballSize/2);
  ballSpeedHorizon *= -1;
  ballSpeedHorizon -= (ballSpeedHorizon * friction);
}

void keepInScreen() {
  if (ballY+(ballSize/2) > height) makeBounceBottom(height);
  if (ballY-(ballSize/2) < 0)      makeBounceTop(0);
  if (ballX-(ballSize/2) < 0)      makeBounceLeft(0);
  if (ballX+(ballSize/2) > width)  makeBounceRight(width);
}


// ========================= RACKET ==============================

void drawRacket() {
  fill(racketColor);
  rectMode(CENTER);
  rect(mouseX, mouseY, racketWidth, racketHeight);
}

void watchRacketBounce() {
  float overhead = mouseY - pmouseY;

  if ((ballX+(ballSize/2) > mouseX - (racketWidth/2)) &&
      (ballX-(ballSize/2) < mouseX + (racketWidth/2))) {

    if (dist(ballX, ballY, ballX, mouseY) <= (ballSize/2)+abs(overhead)) {
      makeBounceBottom(mouseY);
      ballSpeedHorizon = (ballX-mouseX)/5;

      if (overhead < 0) {
        ballY += overhead;
        ballSpeedVert += overhead;
      }
    }
  }
}

void applyHorizontalSpeed() {
  ballX += ballSpeedHorizon;
  ballSpeedHorizon -= (ballSpeedHorizon * airfriction);
}


// ========================= WALL ==============================

void wallAdder() {
  if (millis() - lastAddTime > wallInterval) {
    int randHeight = round(random(minGapHeight, maxGapHeight));
    int randY = round(random(0, height - randHeight));

    // WARNA RANDOM
    int randomCol = color(random(255), random(255), random(255));

    // Wall data
    int[] randWall = { width, randY, wallWidth, randHeight, 0, randomCol };
    walls.add(randWall);

    lastAddTime = millis();
  }
}

void wallHandler() {
  for (int i = walls.size()-1; i >= 0; i--) {
    wallMover(i);
    wallDrawer(i);
    watchWallCollision(i);
    wallRemover(i);
  }
}

void wallDrawer(int index) {
  int[] wall = walls.get(index);

  int gapWallX = wall[0];
  int gapWallY = wall[1];
  int gapWallWidth = wall[2];
  int gapWallHeight = wall[3];
  int gapColor = wall[5];

  rectMode(CORNER);
  fill(gapColor);

  // Top part
  rect(gapWallX, 0, gapWallWidth, gapWallY);

  // Bottom part
  rect(gapWallX, gapWallY + gapWallHeight, 
       gapWallWidth, height - (gapWallY + gapWallHeight));
}

void wallMover(int index) {
  walls.get(index)[0] -= wallSpeed;
}

void wallRemover(int index) {
  int[] wall = walls.get(index);
  if (wall[0] + wall[2] <= 0) walls.remove(index);
}

void watchWallCollision(int index) {
  int[] wall = walls.get(index);
  int x = wall[0];
  int y = wall[1];
  int w = wall[2];
  int h = wall[3];
  int scored = wall[4];

  // Tabrak top wall
  if (ballX+(ballSize/2)>x && ballX-(ballSize/2)<x+w &&
      ballY-(ballSize/2)<y) {
    decreaseHealth();
  }

  // Tabrak bottom wall
  if (ballX+(ballSize/2)>x && ballX-(ballSize/2)<x+w &&
      ballY+(ballSize/2)>y+h) {
    decreaseHealth();
  }

  // SCORE: Jika bola melewati tengah wall
  if (ballX > x + w/2 && scored == 0) {
    wall[4] = 1;
    score++;
  }
}


// ========================= HEALTH & SCORE ==============================

void drawHealthBar() {
  noStroke();
  fill(220);
  rect(ballX-(healthBarWidth/2), ballY - 30, healthBarWidth, 5);

  if (health > 60) fill(46,204,113);
  else if (health > 30) fill(230,126,34);
  else fill(231,76,60);

  rect(ballX-(healthBarWidth/2), ballY - 30, 
       healthBarWidth*(health/maxHealth), 5);
}

void decreaseHealth() {
  health -= healthDecrease;
  if (health <= 0) gameOver();
}

void printScore() {
  textAlign(LEFT);
  fill(0);
  textSize(20);
  text("Score: " + score, 10, 25);
}


// ========================= GAME CONTROL ==============================

void mousePressed() {
  if (gameScreen == 0) startGame();
  if (gameScreen == 2) restart();
}

void startGame() {
  gameScreen = 1;
}

void restart() {
  score = 0;
  health = maxHealth;
  ballX = width/4;
  ballY = height/5;
  lastAddTime = 0;
  walls.clear();
  ballSpeedVert = 0;
  ballSpeedHorizon = 0;
  gameScreen = 0;
}

void gameOver() {
  gameScreen = 2;
}
