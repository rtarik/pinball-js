// --- Vector Math --
class Vec2 {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vec2(this.x * n, this.y * n); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    norm() {
        const m = this.mag();
        return m === 0 ? new Vec2(0, 0) : new Vec2(this.x / m, this.y / m);
    }
    dist(v) { return this.sub(v).mag(); }
    static distSq(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return dx * dx + dy * dy;
    }
}
