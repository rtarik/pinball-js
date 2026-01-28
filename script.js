// Configuration
const CONFIG = {
    width: 500,
    height: 800,
    backgroundColor: '#111111' // Matches COLOR.BACKGROUND
};

// Physics Config
const PHYSICS = {
    restitution: 0.4,
    gravity: 0.05,
    flipperStrength: 0.3
};

// Setup Canvas
const canvas = document.getElementById('game-container');
const ctx = canvas.getContext('2d');

// Set dimensions
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

// Controls Config
const CONTROLS = {
    leftFlipper: 'KeyX',
    rightFlipper: 'KeyN',
    plunger: 'Space',
    pause: 'KeyP'
};

// Input State
const keys = {
    leftFlipper: false,
    rightFlipper: false,
    plunger: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === CONTROLS.leftFlipper || e.code === 'ArrowLeft') keys.leftFlipper = true;
    if (e.code === CONTROLS.rightFlipper || e.code === 'ArrowRight') keys.rightFlipper = true;

    // Plunger (Space or Down)
    if (e.code === CONTROLS.plunger || e.code === 'ArrowDown') {
        if (state.gameOver) {
            // Restart Game
            state.score = 0;
            state.lives = 3;
            state.gameOver = false;
            state.ball.pos = new Vec2(474, 600);
            state.ball.vel = new Vec2(0, 0);
            // Reset Targets via Banks
            state.targetBanks.forEach(bank => bank.reset());
        } else {
            keys.plunger = true;
        }
    }

    // Pause
    if (e.code === CONTROLS.pause) {
        state.paused = !state.paused;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === CONTROLS.leftFlipper || e.code === 'ArrowLeft') keys.leftFlipper = false;
    if (e.code === CONTROLS.rightFlipper || e.code === 'ArrowRight') keys.rightFlipper = false;
    if (e.code === CONTROLS.plunger || e.code === 'ArrowDown') keys.plunger = false;
});

// --- Classes and Collision Logic moved to separate files (Vec2.js, Entities.js, Collision.js) ---

// Game State
// Load Layout from Board.js
const board = createBoard();

const state = {
    paused: false,
    gameOver: false,
    score: 0,
    lives: 3,
    frameCount: 0,
    ball: new Ball(474, 600, 10), // Start in Shooter Lane

    // Board Elements from Board.js
    walls: board.walls,
    arch: board.arch,
    flippers: board.flippers,
    plunger: board.plunger,
    bumpers: board.bumpers,
    slingshots: board.slingshots,
    targetBanks: board.targetBanks,

    // Zone 3: Lower Zone
    portal: null // Deprecated
};

// Update function (Physics / Logic)
function update() {
    state.frameCount++;

    // Hack: Give ball initial velocity on first frame to test side walls
    /* Removed initial auto-launch hack */

    if (state.gameOver) return;

    const SUBSTEPS = 8;
    const dt = 1 / SUBSTEPS;

    for (let i = 0; i < SUBSTEPS; i++) {
        state.ball.update(dt);

        // Auto-Respawn / Drain Logic
        if (state.ball.pos.y > CONFIG.height + 100) {
            // Ball lost!
            state.lives--;
            soundManager.playDrain();
            if (state.lives > 0) {
                // Respawn
                state.ball.pos = new Vec2(474, 600);
                state.ball.vel = new Vec2(0, 0);
            } else {
                // Game Over
                state.gameOver = true;
                // Move ball away so it doesn't trigger loop
                state.ball.pos = new Vec2(-1000, -1000);
                state.ball.vel = new Vec2(0, 0);
            }

            // Break substep loop to avoid multiple decrements in one frame 
            break;
        }

        // Check Collisions
        for (const wall of state.walls) {
            resolveBallLine(state.ball, wall);
        }
        // Check Arch (Right Side Only)
        // Logic: Only resolve circle collision if ball is on the right side (x > cx)
        if (state.arch && state.ball.pos.x >= state.arch.cx) {
            resolveBallCircleConcave(state.ball, state.arch.cx, state.arch.cy, state.arch.r);
        }

        // Check Bumpers
        for (const bumper of state.bumpers) {
            state.score += resolveBallBumper(state.ball, bumper);
        }

        // Check Slingshots
        for (const sling of state.slingshots) {
            state.score += resolveBallSlingshot(state.ball, sling);
        }

        // Check Target Banks (Delegated Logic)
        for (const bank of state.targetBanks) {
            state.score += bank.update(state.ball, resolveBallTarget);
        }

        // Update and Check Flippers
        state.flippers[0].update(keys.leftFlipper, dt);
        state.flippers[1].update(keys.rightFlipper, dt);

        for (const flipper of state.flippers) {
            resolveBallFlipper(state.ball, flipper);
        }

        // Update Plunger
        state.plunger.update(keys.plunger, dt);

        // Resolve Plunger Collision
        const p = state.plunger;
        const ball = state.ball;
        // Simple bounding box check for shooter lane width
        if (ball.pos.x > 458 && ball.pos.x < 490) {
            // Check vertical collision
            const plungerTop = p.y;
            if (ball.pos.y + ball.radius > plungerTop) {
                // Penetration
                ball.pos.y = plungerTop - ball.radius;

                if (p.state === 'releasing') {
                    // Impulse!
                    ball.vel.y = -p.launchSpeed;
                } else {
                    // Resting behavior
                    if (ball.vel.y > 0) {
                        ball.vel.y *= -0.5;
                    }
                }
            }
        }
    }

    // Update HUD (Outside Substeps)
    updateHUD();
}

function updateHUD() {
    // Update Score
    document.getElementById('score-display').innerText = 'SCORE: ' + state.score;

    // Update Lives (Visuals)
    const container = document.getElementById('lives-display');
    container.innerHTML = ''; // Clear

    // Draw Max Lives (3)
    const MAX_LIVES = 3;
    for (let i = 0; i < MAX_LIVES; i++) {
        const dot = document.createElement('div');
        dot.className = 'life-dot';
        // If index is greater than or equal to current lives, it's lost
        // e.g. Lives = 2. i=0 (Active), i=1 (Active), i=2 (Lost)
        // Lives are 1-based count.
        if (i >= state.lives) {
            dot.classList.add('lost');
        }
        container.appendChild(dot);
    }
}

// Helper: Draw Retro Grid
function drawGrid(ctx) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    const step = 50;

    // Vertical Lines
    for (let x = 0; x <= canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal Lines
    for (let y = 0; y <= canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw function (Rendering)
function draw() {
    // Clear screen
    ctx.fillStyle = CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Retro Grid
    drawGrid(ctx);

    // Draw Static Walls
    ctx.strokeStyle = COLOR.WALL;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (const wall of state.walls) {
        ctx.moveTo(wall.start.x, wall.start.y);
        ctx.lineTo(wall.end.x, wall.end.y);
    }
    ctx.stroke();

    // Draw Arch (Right Side)
    if (state.arch) {
        ctx.beginPath();
        // Quarter circle: -90deg (Top) to 0deg (Right)
        // cx, cy, r, startAngle, endAngle
        ctx.arc(state.arch.cx, state.arch.cy, state.arch.r, -Math.PI / 2, 0);
        ctx.stroke();
    }


    // Draw Bumpers
    for (const bumper of state.bumpers) bumper.draw(ctx);

    // Draw Slingshots
    for (const sling of state.slingshots) sling.draw(ctx);

    // Draw Target Banks
    for (const bank of state.targetBanks) bank.draw(ctx);

    // Draw Flippers
    for (const flipper of state.flippers) flipper.draw(ctx);

    // Draw Plunger
    state.plunger.draw(ctx);

    // Draw Ball
    state.ball.draw(ctx);

    // Draw Frame Count (Debug)
    // ctx.fillStyle = '#fff';
    // ctx.font = '10px Arial';
    // ctx.fillText('Frame: ' + state.frameCount, 20, 10);

    // --- Overlays ---
    if (state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff0000';
        ctx.font = '50px "Courier New", monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText('Press SPACE to Restart', canvas.width / 2, canvas.height / 2 + 30);
        ctx.shadowBlur = 0;
    } else if (state.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = '40px "Courier New", monospace';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

// Main Loop
function loop() {
    if (!state.paused) update();
    draw();
    requestAnimationFrame(loop);
}

// --- UI Logic (Menu & Controls) ---
function setupControlBinder(btnId, controlKey) {
    const btn = document.getElementById(btnId);

    btn.addEventListener('click', () => {
        // Prevent re-entry
        if (btn.classList.contains('listening')) return;

        btn.classList.add('listening');
        btn.innerText = 'Pres Key...';

        // One-time listener
        const finalize = (e) => {
            e.preventDefault();
            // Update Config
            CONTROLS[controlKey] = e.code;

            // Update UI
            btn.innerText = e.code;
            btn.classList.remove('listening');

            // Remove listener
            window.removeEventListener('keydown', finalize);
        };

        window.addEventListener('keydown', finalize);
    });
}

// Init Binders
setupControlBinder('btn-bind-left', 'leftFlipper');
setupControlBinder('btn-bind-right', 'rightFlipper');

// --- Audio Logic ---
const chkMusic = document.getElementById('chk-music');
const chkSound = document.getElementById('chk-sound');

// Init Audio Context on first interaction
function initAudio() {
    soundManager.init();

    // Start Music if confirmed by UI
    if (soundManager.musicEnabled) {
        soundManager.startMusic();
    }

    window.removeEventListener('keydown', initAudio);
    window.removeEventListener('click', initAudio);
}
window.addEventListener('keydown', initAudio);
window.addEventListener('click', initAudio);

// Settings Listeners
chkSound.addEventListener('change', (e) => {
    soundManager.enabled = e.target.checked;
    e.target.blur(); // Release focus
});

// Music Listener
chkMusic.addEventListener('change', (e) => {
    soundManager.musicEnabled = e.target.checked;
    if (soundManager.musicEnabled) {
        if (soundManager.ctx) soundManager.startMusic();
    } else {
        soundManager.stopMusic();
    }
    e.target.blur(); // Release focus
});

// Sync initial state
soundManager.enabled = chkSound.checked;
soundManager.musicEnabled = chkMusic.checked;

// Start
console.log('Starting Game Loop...');
loop();
