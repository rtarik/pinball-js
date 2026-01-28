// --- Primitive Shapes ---
class Ball {
    constructor(x, y, radius) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, 0);
        this.radius = radius;
        this.mass = 1;
    }

    update(dt) {
        // Simple Semi-Implicit Euler Integration
        this.vel.y += PHYSICS.gravity * dt;
        this.vel = this.vel.mult(Math.pow(0.995, dt));
        this.pos = this.pos.add(this.vel.mult(dt));
    }

    draw(ctx) {
        // Metallic Gradient
        const grad = ctx.createRadialGradient(
            this.pos.x - this.radius * 0.3, this.pos.y - this.radius * 0.3, this.radius * 0.1,
            this.pos.x, this.pos.y, this.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, COLOR.BALL);
        grad.addColorStop(1, '#555555');

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;

        // Slight Glow
        ctx.shadowBlur = 5;
        ctx.shadowColor = COLOR.BALL_GLOW;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
        ctx.closePath();
    }
}

class LineSegment {
    constructor(x1, y1, x2, y2) {
        this.start = new Vec2(x1, y1);
        this.end = new Vec2(x2, y2);
        this.vec = this.end.sub(this.start);
        this.len = this.vec.mag();
        this.normal = new Vec2(this.vec.y, -this.vec.x).norm();
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = COLOR.WALL;
        ctx.lineWidth = STYLE.LINE_WIDTH;
        ctx.lineCap = 'round';

        // Neon Glow
        ctx.shadowBlur = STYLE.GLOW_STRENGTH;
        ctx.shadowColor = COLOR.WALL_GLOW;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.closePath();
    }
}

class Flipper {
    constructor(x, y, length, minAngle, maxAngle, side) {
        this.pivot = new Vec2(x, y);
        this.length = length;
        this.angle = minAngle; // Current angle
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.side = side;

        this.angularVel = 0;
        this.restAngle = minAngle;
        this.activeAngle = maxAngle;
        this.power = 0.25;

        // Tip position needs to be initialized
        this.updatePos();
    }

    updatePos() {
        this.tip = new Vec2(
            this.pivot.x + Math.cos(this.angle) * this.length,
            this.pivot.y + Math.sin(this.angle) * this.length
        );
    }

    update(isActive, dt) {
        const target = isActive ? this.activeAngle : this.restAngle;
        const diff = target - this.angle;
        this.angularVel = diff * PHYSICS.flipperStrength;
        this.angle += this.angularVel * dt;
        this.updatePos();
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.pivot.x, this.pivot.y);
        ctx.lineTo(this.tip.x, this.tip.y);
        ctx.strokeStyle = COLOR.FLIPPER;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLOR.FLIPPER;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // Pivot point
        ctx.beginPath();
        ctx.arc(this.pivot.x, this.pivot.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
    }
}

class Plunger {
    constructor(x, y, width, height) {
        this.basePos = new Vec2(x, y);
        this.width = width;
        this.height = height;
        this.y = y - height;
        this.maxDisplacement = 80;
        this.displacement = 0;
        this.speed = 0;
        this.launchSpeed = 0;
        this.state = 'resting';
    }

    update(isCharging, dt) {
        if (isCharging) {
            this.state = 'charging';
            if (this.displacement < this.maxDisplacement) {
                this.displacement += 2 * dt;
            }
            this.launchSpeed = 0;
        } else {
            if (this.displacement > 0) {
                this.state = 'releasing';
                if (this.launchSpeed === 0) {
                    this.launchSpeed = this.displacement * 0.3;
                    if (this.launchSpeed < 5) this.launchSpeed = 5;
                }
                this.displacement -= this.launchSpeed * dt;
                if (this.displacement < 0) this.displacement = 0;
            } else {
                this.state = 'resting';
                this.launchSpeed = 0;
            }
        }
        this.y = this.basePos.y - this.height + this.displacement;
    }

    draw(ctx) {
        // Draw main block with fixed height (Sliding window effect)
        // logic: this.y moves down. height stays constant.

        // Main Plunger Body
        ctx.fillStyle = COLOR.PLUNGER;
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLOR.PLUNGER;
        ctx.fillRect(this.basePos.x - this.width / 2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;

        // Spring Logic (Visual Only)
        // Draw zigzag line from basePos.y up to this.y + height?
        // Let's just keep the block for now.
    }
}

class Bumper {
    constructor(x, y, radius) {
        this.pos = new Vec2(x, y);
        this.radius = radius;
        this.power = 1.5;
    }

    draw(ctx) {
        // Glowing Center
        const grad = ctx.createRadialGradient(
            this.pos.x, this.pos.y, this.radius * 0.2,
            this.pos.x, this.pos.y, this.radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, COLOR.BUMPER);
        grad.addColorStop(1, '#004400');

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowBlur = 15;
        ctx.shadowColor = COLOR.BUMPER;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Ring
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
}

class Slingshot {
    constructor(x1, y1, x2, y2) {
        this.start = new Vec2(x1, y1);
        this.end = new Vec2(x2, y2);
        this.vec = this.end.sub(this.start);
        this.len = this.vec.mag();
        this.normal = new Vec2(this.vec.y, -this.vec.x).norm();
        this.power = 1.5;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.start.x, this.start.y);
        ctx.lineTo(this.end.x, this.end.y);
        ctx.strokeStyle = COLOR.SLINGSHOT;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Energy Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLOR.SLINGSHOT;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.closePath();
    }
}

class Target {
    constructor(x1, y1, x2, y2) {
        // Defined by Start and End points
        this.start = new Vec2(x1, y1);
        this.end = new Vec2(x2, y2);

        this.vec = this.end.sub(this.start);
        this.len = this.vec.mag();
        // Calculate angle for drawing
        this.angle = Math.atan2(this.vec.y, this.vec.x);

        this.normal = new Vec2(this.vec.y, -this.vec.x).norm();

        this.isLit = true;
        this.thickness = 10;
    }

    draw(ctx) {
        // Draw using transformation to handle arbitrary angles easily
        ctx.save();
        ctx.translate(this.start.x, this.start.y);
        ctx.rotate(this.angle);

        ctx.fillStyle = this.isLit ? COLOR.TARGET : '#550000';
        ctx.shadowBlur = this.isLit ? 10 : 0;
        ctx.shadowColor = COLOR.TARGET;

        // Draw a rect: x=0, y=0, w=len, h=thickness
        ctx.fillRect(0, -this.thickness / 2, this.len, this.thickness);

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -this.thickness / 2, this.len, this.thickness);

        ctx.restore();
    }
}

class TargetBank {
    constructor(targets) {
        this.targets = targets;
    }

    update(ball, resolveCollisionFunc) {
        let score = 0;
        let allUnlit = true;

        for (const target of this.targets) {
            // Check collision
            score += resolveCollisionFunc(ball, target);
            // Check state
            if (target.isLit) {
                allUnlit = false;
            }
        }

        // Reset if all are unlit
        if (allUnlit) {
            score += 1000; // Bank Completion Bonus
            this.reset();
        }

        return score;
    }

    reset() {
        for (const target of this.targets) {
            target.isLit = true;
        }
    }

    draw(ctx) {
        for (const target of this.targets) {
            target.draw(ctx);
        }
    }
}

class Passage {
    constructor(x, y, radius, id, linkedId) {
        this.pos = new Vec2(x, y);
        this.radius = radius;
        this.id = id;
        this.linkedId = linkedId;
        this.cooldown = 0;
    }

    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;
    }

    draw(ctx) {
        // Simple Hole Visual
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);

        // Cooldown visual: Dim if disabled
        ctx.fillStyle = this.cooldown > 0 ? '#333' : '#000'; // Dark hole
        ctx.fill();

        // Rim
        ctx.strokeStyle = this.cooldown > 0 ? '#555' : COLOR.PORTAL;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }
}
