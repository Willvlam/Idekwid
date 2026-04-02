const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const timeEl = document.getElementById('time');
const objectiveEl = document.getElementById('objective');

let player = { x: 50, y: 500, width: 20, height: 20, vx: 0, vy: 0, onGround: false };
let keys = {};
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;
let paused = false;
let timeLeft = 60;

const gravity = 0.5;
const friction = 0.8;
const jumpStrength = -4;
const speed = 3;

let platforms = [];
let enemies = [];
let collectibles = [];
let traps = [];
let goal = null;

function initLevel() {
    platforms = [];
    enemies = [];
    collectibles = [];
    traps = [];
    goal = null;
    player.x = 50;
    player.y = 500;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    timeLeft = 60 + level * 5; // more time for higher levels

    if (level === 1) {
        // Basic platforms - closer for playability
        platforms.push({ x: 0, y: 550, width: 150, height: 50 });
        platforms.push({ x: 200, y: 480, width: 60, height: 20 });
        platforms.push({ x: 300, y: 410, width: 80, height: 20 });
        platforms.push({ x: 450, y: 340, width: 100, height: 20 });
        platforms.push({ x: 600, y: 270, width: 150, height: 20 });
        collectibles.push({ x: 720, y: 240, width: 20, height: 20 });
    } else if (level === 2) {
        // With enemies - faster and more
        platforms.push({ x: 0, y: 550, width: 120, height: 50 });
        platforms.push({ x: 150, y: 450, width: 50, height: 20 });
        platforms.push({ x: 250, y: 350, width: 50, height: 20 });
        platforms.push({ x: 350, y: 250, width: 50, height: 20 });
        platforms.push({ x: 450, y: 150, width: 50, height: 20 });
        platforms.push({ x: 550, y: 50, width: 200, height: 20 });
        enemies.push({ x: 200, y: 420, width: 20, height: 20, vx: 3, direction: 1 });
        enemies.push({ x: 400, y: 220, width: 20, height: 20, vx: -2.5, direction: -1 });
        enemies.push({ x: 600, y: 20, width: 20, height: 20, vx: 4, direction: 1 });
        collectibles.push({ x: 720, y: 20, width: 20, height: 20 });
    } else if (level === 3) {
        // Puzzles and traps - invisible traps
        platforms.push({ x: 0, y: 550, width: 80, height: 50 });
        platforms.push({ x: 120, y: 450, width: 40, height: 20 });
        platforms.push({ x: 200, y: 350, width: 40, height: 20 });
        platforms.push({ x: 280, y: 250, width: 40, height: 20 });
        platforms.push({ x: 360, y: 150, width: 40, height: 20 });
        platforms.push({ x: 440, y: 50, width: 200, height: 20 });
        traps.push({ x: 160, y: 520, width: 40, height: 30 });
        traps.push({ x: 240, y: 320, width: 40, height: 30 });
        traps.push({ x: 320, y: 220, width: 40, height: 30 });
        traps.push({ x: 400, y: 120, width: 40, height: 30 });
        collectibles.push({ x: 600, y: 20, width: 20, height: 20 });
        // Moving platform
        platforms.push({ x: 80, y: 400, width: 60, height: 20, vx: 1.5, direction: 1, minX: 80, maxX: 250 });
    } else if (level === 4) {
        // More enemies and moving
        platforms.push({ x: 0, y: 550, width: 100, height: 50 });
        platforms.push({ x: 130, y: 450, width: 50, height: 20 });
        platforms.push({ x: 210, y: 350, width: 50, height: 20 });
        platforms.push({ x: 290, y: 250, width: 50, height: 20 });
        platforms.push({ x: 370, y: 150, width: 50, height: 20 });
        platforms.push({ x: 450, y: 50, width: 150, height: 20 });
        enemies.push({ x: 150, y: 420, width: 20, height: 20, vx: 4, direction: 1 });
        enemies.push({ x: 230, y: 320, width: 20, height: 20, vx: -3, direction: -1 });
        enemies.push({ x: 310, y: 220, width: 20, height: 20, vx: 3.5, direction: 1 });
        enemies.push({ x: 390, y: 120, width: 20, height: 20, vx: -4, direction: -1 });
        traps.push({ x: 180, y: 520, width: 30, height: 30 });
        traps.push({ x: 260, y: 320, width: 30, height: 30 });
        collectibles.push({ x: 550, y: 20, width: 20, height: 20 });
        platforms.push({ x: 50, y: 300, width: 50, height: 20, vx: 2, direction: 1, minX: 50, maxX: 200 });
    } else if (level === 5) {
        // Vertical challenges
        platforms.push({ x: 0, y: 550, width: 80, height: 50 });
        platforms.push({ x: 100, y: 450, width: 30, height: 20 });
        platforms.push({ x: 160, y: 350, width: 30, height: 20 });
        platforms.push({ x: 220, y: 250, width: 30, height: 20 });
        platforms.push({ x: 280, y: 150, width: 30, height: 20 });
        platforms.push({ x: 340, y: 50, width: 150, height: 20 });
        enemies.push({ x: 120, y: 420, width: 20, height: 20, vx: 5, direction: 1 });
        enemies.push({ x: 180, y: 320, width: 20, height: 20, vx: -4, direction: -1 });
        enemies.push({ x: 240, y: 220, width: 20, height: 20, vx: 4.5, direction: 1 });
        enemies.push({ x: 300, y: 120, width: 20, height: 20, vx: -5, direction: -1 });
        traps.push({ x: 130, y: 520, width: 20, height: 30 });
        traps.push({ x: 190, y: 320, width: 20, height: 30 });
        traps.push({ x: 250, y: 220, width: 20, height: 30 });
        traps.push({ x: 310, y: 120, width: 20, height: 30 });
        collectibles.push({ x: 450, y: 20, width: 20, height: 20 });
        platforms.push({ x: 50, y: 200, width: 40, height: 20, vx: 3, direction: 1, minX: 50, maxX: 150 });
    } else if (level >= 6) {
        // Endless harder levels
        let numPlatforms = 8 + level;
        let y = 550;
        for (let i = 0; i < numPlatforms; i++) {
            let width = Math.max(20, 60 - level * 2);
            platforms.push({ x: Math.random() * (canvas.width - width), y: y, width: width, height: 20 });
            y -= 80 + Math.random() * 20;
            if (y < 0) break;
        }
        let numEnemies = 2 + level;
        for (let i = 0; i < numEnemies; i++) {
            enemies.push({ x: Math.random() * (canvas.width - 20), y: 400 - i * 100, width: 20, height: 20, vx: 3 + level * 0.5, direction: Math.random() > 0.5 ? 1 : -1 });
        }
        let numTraps = level;
        for (let i = 0; i < numTraps; i++) {
            traps.push({ x: Math.random() * (canvas.width - 30), y: 500 - i * 50, width: 30, height: 30 });
        }
        collectibles.push({ x: Math.random() * (canvas.width - 20), y: 20, width: 20, height: 20 });
    }

    // new goal: reach this flag after collecting all collectibles
    if (level === 1) goal = { x: 740, y: 210, width: 20, height: 30 };
    else if (level === 2) goal = { x: 740, y: 30, width: 20, height: 30 };
    else if (level === 3) goal = { x: 640, y: 30, width: 20, height: 30 };
    else if (level === 4) goal = { x: 620, y: 30, width: 20, height: 30 };
    else if (level === 5) goal = { x: 340, y: 20, width: 20, height: 30 };
    else if (level >= 6) goal = { x: Math.min(760, canvas.width - 30), y: 20, width: 20, height: 30 };

    if (!goal) goal = { x: 740, y: 30, width: 20, height: 30 };
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

    // Draw traps (invisible)
    // ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    // for (let t of traps) {
    //     ctx.fillRect(t.x, t.y, t.width, t.height);
    // }

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