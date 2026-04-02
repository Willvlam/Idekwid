const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const waveEl = document.getElementById('wave');
const healthEl = document.getElementById('health');

// Game state
let gameState = 'playing'; // 'playing', 'gameOver', 'paused'
let score = 0;
let lives = 3;
let wave = 1;
let waveProgress = 0;
let gameTime = 0;
let playerHealth = 100;

// Player
let player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 8,
    vx: 0,
    vy: 0,
    shields: 0,
    maxSpeed: 6
};

// Game objects
let bullets = [];
let enemies = [];
let explosions = [];
let powerUps = [];
let particles = [];

// Controls
let keys = {};

// Enemy spawning
let enemySpawnCounter = 0;
let enemySpawnRate = 0;
let waveTimer = 0;
const waveLength = 15000; // 15 seconds per wave

// Difficulty scaling
function getDifficulty() {
    return 1 + (wave - 1) * 0.3 + (gameTime / 60000) * 0.5;
}

class Bullet {
    constructor(x, y, vx, vy, damage = 1) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 3;
        this.damage = damage;
        this.life = 300;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw() {
        ctx.fillStyle = '#FF6B6B';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    isOutOfBounds() {
        return this.x < -10 || this.x > canvas.width + 10 || this.y < -10 || this.y > canvas.height + 10 || this.life <= 0;
    }
}

class BasicEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 1 + 0.5;
        this.radius = 12;
        this.health = 20;
        this.maxHealth = 20;
        this.shootCounter = 0;
        this.shootRate = 60 - getDifficulty() * 10;
        this.pattern = Math.floor(Math.random() * 2);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.shootCounter++;

        // Wrap around edges
        if (this.x < -20) this.x = canvas.width + 20;
        if (this.x > canvas.width + 20) this.x = -20;
        if (this.y > canvas.height + 20) {
            return 'remove';
        }

        if (this.shootCounter >= this.shootRate) {
            this.shoot();
            this.shootCounter = 0;
        }
    }

    shoot() {
        if (this.pattern === 0) {
            // Spread shot
            for (let i = -1; i <= 1; i++) {
                let angle = Math.atan2(player.y - this.y, player.x - this.x) + i * 0.4;
                let speed = 3 + getDifficulty() * 0.5;
                bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed));
            }
        } else {
            // Aimed shot
            let angle = Math.atan2(player.y - this.y, player.x - this.x);
            let speed = 3.5 + getDifficulty() * 0.6;
            bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
    }

    draw() {
        ctx.fillStyle = '#FF8C42';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.health / this.maxHealth), 3);
        ctx.strokeStyle = '#00AA00';
        ctx.strokeRect(this.x - 15, this.y - 25, 30, 3);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            createExplosion(this.x, this.y, 15);
            return true;
        }
        return false;
    }
}

class SpiralEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0.5;
        this.radius = 14;
        this.health = 30;
        this.maxHealth = 30;
        this.shootCounter = 0;
        this.shootRate = 40 - getDifficulty() * 8;
        this.angle = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.shootCounter++;
        this.angle += 0.1;

        if (this.y > canvas.height + 20) {
            return 'remove';
        }

        if (this.shootCounter >= this.shootRate) {
            this.shoot();
            this.shootCounter = 0;
        }
    }

    shoot() {
        // Spiral pattern - 8 bullets in a circle
        for (let i = 0; i < 8; i++) {
            let angle = (i / 8) * Math.PI * 2 + this.angle;
            let speed = 2.5 + getDifficulty() * 0.3;
            bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed));
        }
    }

    draw() {
        ctx.fillStyle = '#9D4EDD';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - 18, this.y - 25, 36 * (this.health / this.maxHealth), 3);
        ctx.strokeStyle = '#00AA00';
        ctx.strokeRect(this.x - 18, this.y - 25, 36, 3);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            createExplosion(this.x, this.y, 20);
            return true;
        }
        return false;
    }
}

class BossEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 20;
        this.health = 150 * getDifficulty();
        this.maxHealth = this.health;
        this.shootCounter = 0;
        this.shootRate = 20;
        this.pattern = 0;
        this.patternTimer = 0;
    }

    update() {
        // Hover
        this.y = Math.sin(gameTime / 1000) * 30 + 80;

        this.shootCounter++;
        this.patternTimer++;

        if (this.patternTimer > 200) {
            this.pattern = (this.pattern + 1) % 3;
            this.patternTimer = 0;
        }

        if (this.shootCounter >= this.shootRate) {
            this.shoot();
            this.shootCounter = 0;
        }
    }

    shoot() {
        if (this.pattern === 0) {
            // Spread pattern
            for (let i = 0; i < 5; i++) {
                let angle = (i / 5) * Math.PI - Math.PI / 2;
                let speed = 4;
                bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1));
            }
        } else if (this.pattern === 1) {
            // Rain pattern
            for (let i = 0; i < 3; i++) {
                bullets.push(new Bullet(this.x - 20 + i * 20, this.y, 0, 4, 1));
            }
        } else {
            // Aimed burst
            for (let i = 0; i < 3; i++) {
                let angle = Math.atan2(player.y - this.y, player.x - this.x) + (Math.random() - 0.5) * 0.6;
                let speed = 4.5;
                bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, 1));
            }
        }
    }

    draw() {
        ctx.fillStyle = '#FFD60A';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFC300';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Health bar
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x - 50, this.y - 35, 100 * (this.health / this.maxHealth), 5);
        ctx.strokeStyle = '#00AA00';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - 50, this.y - 35, 100, 5);

        // Boss label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, this.y - 45);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            createExplosion(this.x, this.y, 40);
            createBossDeathExplosion();
            return true;
        }
        return false;
    }
}

function createExplosion(x, y, size) {
    for (let i = 0; i < size; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 4 + 2;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30 + Math.random() * 20,
            maxLife: 30 + Math.random() * 20,
            size: Math.random() * 3 + 1,
            color: '#FF' + Math.floor(Math.random() * 256).toString(16).padStart(2, '0') + Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
        });
    }
}

function createBossDeathExplosion() {
    for (let i = 0; i < 60; i++) {
        let angle = Math.random() * Math.PI * 2;
        let speed = Math.random() * 6 + 3;
        particles.push({
            x: player.x + 100,
            y: 80,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 40 + Math.random() * 30,
            maxLife: 40 + Math.random() * 30,
            size: Math.random() * 4 + 2,
            color: '#FFD60A'
        });
    }
}

function spawnWave() {
    let difficulty = getDifficulty();
    let enemyCount = Math.floor(3 + wave * 1.5 + difficulty * 2);

    if (waveProgress < enemyCount) {
        enemySpawnRate = Math.max(10, 60 - difficulty * 15);

        if (enemySpawnCounter >= enemySpawnRate) {
            let type = Math.random();
            let x = Math.random() * (canvas.width - 40) + 20;

            if (waveProgress % 8 === 0 && wave >= 3 && Math.random() < difficulty * 0.1) {
                enemies.push(new SpiralEnemy(x, -30));
            } else {
                enemies.push(new BasicEnemy(x, -30));
            }

            waveProgress++;
            enemySpawnCounter = 0;
        } else {
            enemySpawnCounter++;
        }
    }

    // Spawn boss every 5 waves
    if (waveProgress >= enemyCount && wave % 5 === 0 && enemies.length === 0) {
        enemies.push(new BossEnemy(canvas.width / 2, 80));
    }
}

function update() {
    if (gameOver || paused) return;

    // Decrement time
    timeLeft -= 1 / 60;
    if (timeLeft <= 0) {
        lives--;
        if (lives <= 0) gameOver = true;
        else initLevel();
        return;
    }

    // Player input
    if (keys['ArrowLeft'] || keys['a']) player.vx = -speed;
    else if (keys['ArrowRight'] || keys['d']) player.vx = speed;
    else player.vx *= friction;

    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
        player.vy = jumpStrength;
        player.onGround = false;
    }

    // Gravity
    player.vy += gravity;

    // Update position
    player.x += player.vx;
    player.y += player.vy;

    // Collision with platforms
    player.onGround = false;
    for (let p of platforms) {
        if (p.vx !== undefined) {
            p.x += p.vx * p.direction;
            if (p.x <= p.minX || p.x >= p.maxX) p.direction *= -1;
        }
        if (player.x < p.x + p.width && player.x + player.width > p.x &&
            player.y < p.y + p.height && player.y + player.height > p.y) {
            if (player.vy > 0 && player.y < p.y) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.onGround = true;
            } else if (player.vy < 0 && player.y > p.y) {
                player.y = p.y + p.height;
                player.vy = 0;
            } else if (player.vx > 0 && player.x < p.x) {
                player.x = p.x - player.width;
                player.vx = 0;
            } else if (player.vx < 0 && player.x > p.x) {
                player.x = p.x + p.width;
                player.vx = 0;
            }
        }
    }

    // Collision with enemies
    for (let e of enemies) {
        e.x += e.vx * e.direction;
        if (e.x <= 0 || e.x >= canvas.width - e.width) e.direction *= -1;
        if (player.x < e.x + e.width && player.x + player.width > e.x &&
            player.y < e.y + e.height && player.y + player.height > e.y) {
            lives--;
            if (lives <= 0) gameOver = true;
            else initLevel();
        }
    }

    // Collision with traps
    for (let t of traps) {
        if (player.x < t.x + t.width && player.x + player.width > t.x &&
            player.y < t.y + t.height && player.y + player.height > t.y) {
            lives--;
            if (lives <= 0) gameOver = true;
            else initLevel();
        }
    }

    // Collect collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        let c = collectibles[i];
        if (player.x < c.x + c.width && player.x + player.width > c.x &&
            player.y < c.y + c.height && player.y + player.height > c.y) {
            collectibles.splice(i, 1);
            score += 100;
        }
    }

    // Goal check: requires all collectibles to be gathered first
    if (goal && player.x < goal.x + goal.width && player.x + player.width > goal.x &&
        player.y < goal.y + goal.height && player.y + player.height > goal.y) {
        if (collectibles.length === 0) {
            score += 500; // bonus for reaching goal
            level++;
            initLevel();
            return;
        }
    }

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y > canvas.height) {
        lives--;
        if (lives <= 0) gameOver = true;
        else initLevel();
    }

    // Update UI
    scoreEl.textContent = `Score: ${score}`;
    livesEl.textContent = `Lives: ${lives}`;
    levelEl.textContent = `Level: ${level}`;
    timeEl.textContent = `Time: ${Math.ceil(timeLeft)}`;
    if (collectibles.length === 0) {
        objectiveEl.textContent = 'Objective: All collected! Reach the purple goal.';
    } else {
        objectiveEl.textContent = `Objective: Collect remaining ${collectibles.length} and then reach the purple goal.`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    ctx.fillStyle = 'green';
    for (let p of platforms) {
        ctx.fillRect(p.x, p.y, p.width, p.height);
    }

    // Draw enemies
    ctx.fillStyle = 'red';
    for (let e of enemies) {
        ctx.fillRect(e.x, e.y, e.width, e.height);
    }

    // Draw traps
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    for (let t of traps) {
        ctx.fillRect(t.x, t.y, t.width, t.height);
    }

    // Draw collectibles
    ctx.fillStyle = 'yellow';
    for (let c of collectibles) {
        ctx.fillRect(c.x, c.y, c.width, c.height);
    }

    // Draw goal (finish flag) - must reach after collecting all items
    if (goal) {
        ctx.fillStyle = 'purple';
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', goal.x + goal.width / 2, goal.y - 5);
    }

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'p') paused = !paused;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

initLevel();
gameLoop();