// --- Collision Logic ---
function closestPointOnSegment(p, a, b) {
    const ab = b.sub(a);
    const ap = p.sub(a);
    let t = ap.dot(ab) / ab.dot(ab);
    t = Math.max(0, Math.min(1, t));
    return a.add(ab.mult(t));
}

function resolveBallLine(ball, line) {
    const closest = closestPointOnSegment(ball.pos, line.start, line.end);
    const distVec = ball.pos.sub(closest);
    const dist = distVec.mag();

    // Collision Check (Radius + Half Wall Thickness 5)
    // If the ball center is closer than Radius+5, it's hitting the "surface"
    const collisionDist = ball.radius + 5;

    if (dist < collisionDist) {
        // 1. Resolve Position (Push out)
        const overlap = collisionDist - dist;
        // Normal direction: Push away from closest point
        // If ball is exactly on line, use line normal
        let normal = distVec.norm();
        if (dist === 0) normal = line.normal;

        ball.pos = ball.pos.add(normal.mult(overlap));

        // 2. Resolve Velocity (Bounce)
        // Reflect velocity across normal
        // Only bounce if moving INTO the wall (dot product < 0)
        const velNormal = ball.vel.dot(normal);
        if (velNormal < 0) {
            // v_new = v_old - (1 + restitution) * (v_old . n) * n
            // v_new = v_old - (1 + restitution) * (v_old . n) * n
            const restitution = PHYSICS.restitution;
            const impulse = -(1 + restitution) * velNormal;
            ball.vel = ball.vel.add(normal.mult(impulse));
        }
    }
}

function resolveBallCircleConcave(ball, cx, cy, r) {
    // Only resolve collision if ball is in the top half (for the Roof)
    if (ball.pos.y > cy) return;

    const center = new Vec2(cx, cy);
    const distVec = ball.pos.sub(center);
    const dist = distVec.mag();

    // Collision if ball is touching or outside the radius
    // Inner boundary: dist + ball.radius > r
    if (dist + ball.radius > r) {
        // 1. Resolve Position
        const normal = distVec.mult(-1).norm(); // Inwards towards center
        const overlap = (dist + ball.radius) - r;

        // Push ball INWARDS
        ball.pos = ball.pos.add(normal.mult(overlap));

        // 2. Resolve Velocity
        // 2. Resolve Velocity
        const velNormal = ball.vel.dot(normal);
        if (velNormal < 0) {
            const restitution = PHYSICS.restitution;
            const impulse = -(1 + restitution) * velNormal;
            ball.vel = ball.vel.add(normal.mult(impulse));
        }
    }
}

function resolveBallFlipper(ball, flipper) {
    // Treat flipper as a line segment from pivot to tip
    const segmentVector = flipper.tip.sub(flipper.pivot);
    const pivotToBall = ball.pos.sub(flipper.pivot);

    // Project ball onto flipper line to find closest point
    let t = pivotToBall.dot(segmentVector) / segmentVector.dot(segmentVector);
    t = Math.max(0, Math.min(1, t)); // Clamp to segment

    const closest = flipper.pivot.add(segmentVector.mult(t));
    const distVec = ball.pos.sub(closest);
    const dist = distVec.mag();

    const collisionDist = ball.radius + 5; // Reverted to 5 to fix "floating" bounce

    if (dist < collisionDist) {
        // 1. Resolve Position
        let normal = distVec.norm();
        // Fallback normal if center is exactly on line
        if (dist === 0) {
            normal = new Vec2(-segmentVector.y, segmentVector.x).norm();
        }

        const overlap = collisionDist - dist;
        ball.pos = ball.pos.add(normal.mult(overlap));

        // 2. Resolve Velocity + Add Impulse from Flipper
        // Calculate collision point radius vector relative to pivot
        const radiusVec = closest.sub(flipper.pivot);

        // True tangential velocity: V = Omega x R
        // In 2D: V = (-omega * ry, omega * rx)
        // This naturally handles direction for both CW and CCW rotations
        const flipperVel = new Vec2(
            -flipper.angularVel * radiusVec.y,
            flipper.angularVel * radiusVec.x
        );

        // Relative velocity
        let relVel = ball.vel.sub(flipperVel);
        const velNormal = relVel.dot(normal);

        if (velNormal < 0) {
            const restitution = PHYSICS.restitution;
            let j = -(1 + restitution) * velNormal;
            let impulse = normal.mult(j);

            ball.vel = ball.vel.add(impulse);
            // Add portion of flipper velocity directly to ball (friction/grip effect)
            ball.vel = ball.vel.add(flipperVel.mult(0.5));

            // Only play sound on significant impact to prevent looping when holding
            if (velNormal < -2.0) {
                soundManager.playFlipper();
            }
        }
    }
}

function resolveBallBumper(ball, bumper) {
    const distVec = ball.pos.sub(bumper.pos);
    const dist = distVec.mag();
    const collisionDist = ball.radius + bumper.radius;

    if (dist < collisionDist) {
        // 1. Resolve Position
        const normal = distVec.norm();
        const overlap = collisionDist - dist;
        ball.pos = ball.pos.add(normal.mult(overlap));

        // 2. Resolve Velocity (Active Kick)
        const velNormal = ball.vel.dot(normal);
        if (velNormal < 0) {
            // Standard bounce
            const restitution = PHYSICS.restitution;
            let j = -(1 + restitution) * velNormal;

            // Active Kick: Add fixed velocity
            ball.vel = ball.vel.add(normal.mult(j)); // Normal bounce
            ball.vel = ball.vel.add(normal.mult(5)); // Active Kick! (Reduced from 15)
        }
        soundManager.playBumper();
        return 100; // Hit!
    }
    return 0; // No hit
}

function resolveBallSlingshot(ball, slingshot) {
    // Similar to line segment but with kick
    const closest = closestPointOnSegment(ball.pos, slingshot.start, slingshot.end);
    const distVec = ball.pos.sub(closest);
    const dist = distVec.mag();
    const collisionDist = ball.radius + 5;

    if (dist < collisionDist) {
        // 1. Resolve Position
        let normal = distVec.norm();
        if (dist === 0) normal = slingshot.normal;

        const overlap = collisionDist - dist;
        ball.pos = ball.pos.add(normal.mult(overlap));

        // 2. Resolve Velocity
        const velNormal = ball.vel.dot(normal);
        if (velNormal < 0) {
            const restitution = PHYSICS.restitution;
            let j = -(1 + restitution) * velNormal;

            ball.vel = ball.vel.add(normal.mult(j)); // Normal bounce

            // Active Kick CHECK:
            // Only kick if the collision normal is aligned with the slingshot's "front" normal.
            // If dot > 0, they face the same general direction.
            if (normal.dot(slingshot.normal) > 0) {
                ball.vel = ball.vel.add(normal.mult(5)); // Active Kick!
                soundManager.playBumper();
                return 50; // Active Hit!
            }
        }
    }
    return 0;
}

function resolveBallTarget(ball, target) {
    // Treat as Line Segment for collision
    const line = target;
    const closest = closestPointOnSegment(ball.pos, line.start, line.end);
    const distVec = ball.pos.sub(closest);
    const dist = distVec.mag();
    const collisionDist = ball.radius + 5; // Thickness

    if (dist < collisionDist) {
        // 1. Resolve Position
        let normal = distVec.norm();
        if (dist === 0) normal = line.normal;

        const overlap = collisionDist - dist;
        ball.pos = ball.pos.add(normal.mult(overlap));

        // 2. Resolve Velocity
        const velNormal = ball.vel.dot(normal);
        if (velNormal < 0) {
            const restitution = PHYSICS.restitution;
            let j = -(1 + restitution) * velNormal;
            ball.vel = ball.vel.add(normal.mult(j)); // Normal bounce

            // 3. Game Logic Check
            if (target.isLit) {
                target.isLit = false; // Turn off
                soundManager.playTarget();
                return 200; // Points for dimming
            }
        }
    }
    return 0;
}

function checkBallSensor(ball, sensor) {
    const distSq = Vec2.distSq(ball.pos, sensor.pos);
    const r = sensor.radius + ball.radius;
    if (distSq < r * r) {
        return true; // Overlap detected
    }
    return false;
}
