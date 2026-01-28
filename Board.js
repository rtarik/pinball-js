// Board Layout Definition
// Separate file for easy editing of walls, bumpers, and targets.

function createBoard() {
    return {
        // --- Walls ---
        walls: [
            // --- Left Walls ---
            // Top Left Vertical Wall (Square Corner)
            // Extended down to 560 to match new funnel start
            new LineSegment(10, 10, 10, 560),

            // Top Horizontal Ceiling (Extended Flat Roof)
            // From x=10 to x=420 (Squared off Top Right)
            new LineSegment(10, 10, 420, 10),

            // --- Top Right Corner (Bevel) ---
            // Replaces the Arch. Deflects ball from shooter lane into playfield.
            new LineSegment(420, 10, 490, 80),

            // --- Right Walls ---
            // Inner Shooter Lane Wall: x=458
            // Extended to 850
            new LineSegment(458, 320, 458, 850),

            // Outer Right Wall (Shooter Lane Outer): x=490
            // Extended up to 80 (Bevel start) and down to 850
            new LineSegment(490, 80, 490, 850),

            // Funnel Walls (V-Shape) - Continuous (Background)
            // Shifted Down +60px to maintain angle with lower start
            // Left Funnel: (10, 560) -> (175, 740)
            new LineSegment(10, 560, 175, 740),

            // Right Funnel: (458, 560) -> (325, 740)
            new LineSegment(458, 560, 325, 740),

            // --- Left Cove Barrier (Vertical Drop) ---
            // Shifted Down +40px
            new LineSegment(150, 360, 180, 400), // Top Arm (Angled)
            new LineSegment(180, 400, 180, 460)  // Bottom Arm (Vertical & Longer)
        ],

        // --- Roof Logic ---
        // Arch Removed (Custom Walls used instead)
        arch: null,

        // --- Flippers ---
        // Shifted Down to y=740
        flippers: [
            // Left Flipper
            new Flipper(175, 740, 60, 0.52, -0.52, 'left'),

            // Right Flipper
            new Flipper(325, 740, 60, Math.PI - 0.52, Math.PI + 0.52, 'right')
        ],

        // --- Plunger ---
        // Extended/Shifted
        plunger: new Plunger(474, 800, 30, 70),

        // --- Active Elements ---

        // Zone 1: Inverted Bumper Triangle (2 Top, 1 Bottom) + Corner Bumper
        bumpers: [
            // New Corner Bumper (Top Left)
            new Bumper(60, 80, 14),

            // Triangle - Top Left
            new Bumper(220, 130, 14),
            // Triangle - Top Right
            new Bumper(280, 130, 14),
            // Triangle - Bottom Center
            new Bumper(250, 180, 14),

            // --- Left Cove Bumper ---
            // Single central bumper
            new Bumper(60, 460, 14)
            // Right Side Bumper Removed
        ],

        slingshots: [
            // Left Slingshot (Shifted Down +60px)
            // 530+60 = 590, 600+60 = 660
            new Slingshot(120, 590, 160, 660),
            // Right Slingshot (Shifted Down +60px)
            new Slingshot(340, 660, 380, 590)
        ],

        // Zone 2: Targets
        targetBanks: [
            // --- Top Bank (Slanted Up-Right /) ---
            new TargetBank([
                new Target(170, 110, 188, 98),
                new Target(192, 95, 210, 83),
                new Target(214, 80, 232, 68)
            ]),

            // --- Bottom Bank (Slanted Down-Right \) ---
            new TargetBank([
                new Target(215, 200, 233, 212),
                new Target(237, 215, 255, 227),
                new Target(259, 230, 277, 242)
            ]),

            // --- Left Cove Bank (Slanted /) ---
            // Shifted Down +40px
            new TargetBank([
                new Target(40, 330, 70, 345),
                new Target(75, 347, 105, 362)
            ])
        ]
    };
}
