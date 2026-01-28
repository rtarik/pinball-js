class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true; // SFX
        this.musicEnabled = false;
        this.masterGain = null;
    }

    init() {
        if (this.ctx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // Master Volume
        this.masterGain.connect(this.ctx.destination);
    }

    playBumper() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playFlipper() {
        if (!this.enabled || !this.ctx) return;

        // Simple Low Thud (Tri-wave for now, noise is complex to generate purely without buffer)
        // actually let's use a low frequency triangle wave
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playTarget() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'square'; // 8-bit feel
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.05); // Arpeggio up

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playDrain() {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + 1.0);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);

        osc.start();
        osc.stop(this.ctx.currentTime + 1.0);
    }
}

const soundManager = new SoundManager();

// --- Music Extension ---
soundManager.musicInterval = null;
soundManager.isPlayingMusic = false;
soundManager.noteIndex = 0;

soundManager.startMusic = function () {
    if (!this.musicEnabled || !this.ctx || this.isPlayingMusic) return;
    this.isPlayingMusic = true;
    this.noteIndex = 0;

    const bpm = 110;
    const stepTime = (60 / bpm) / 4; // 16th notes

    // Frequencies
    const E2 = 82.4, G2 = 98.0, A2 = 110.0, B2 = 123.5, D3 = 146.8, E3 = 164.8;
    const B1 = 61.7, D2 = 73.4;
    const E4 = 329.6, G4 = 392.0, A4 = 440.0, B4 = 493.9, D5 = 587.3;

    // 8 Bar Loop (128 Steps)

    // Chord Progressions (Root Frequencies)
    // E2=82.4, G2=98.0, A2=110.0, B2=123.5
    const progression = [
        82.4, 82.4, 98.0, 110.0 // E - E - G - A
    ];

    // Scale Intervals (Minor Pentatonic relative to root)
    // Root(1), b3(1.2), 4(1.33), 5(1.5), b7(1.78), Oct(2)
    const scaleRatios = [1, 1.2, 1.33, 1.5, 1.78, 2, 2.4, 3, 3.56, 4];

    const playStep = () => {
        if (!this.isPlayingMusic) return;
        const now = this.ctx.currentTime;

        // Time
        const step = this.noteIndex;
        const barOfLoop = Math.floor(step / 64) % 4; // 4-Bar progression
        const stepInBar = step % 16;

        // Determine Current Chord Root
        const rootFreq = progression[barOfLoop];

        // --- 1. Driving Bass (8th Notes) ---
        // Plays on even steps: 0, 2, 4...
        // Pattern: Root - Octave - Root - Fifth
        if (step % 2 === 0) {
            const beat = (step / 2) % 4;
            let bassFreq = rootFreq;
            if (beat === 1) bassFreq = rootFreq * 2; // Octave
            if (beat === 3) bassFreq = rootFreq * 1.5; // Fifth

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.type = 'sawtooth';
            osc.frequency.value = bassFreq;

            // Tight pluck
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        }

        // --- 2. Rolling Lead (Continuous 16ths) ---
        // Arpeggio Pattern: Up and Down scale
        // Index: 0, 1, 2, 3, 4, 5, 4, 3, 2, 5, 4, 6, 5, 7, 8, 9];
        const arpPattern = [0, 1, 2, 3, 4, 5, 4, 3, 2, 5, 4, 6, 5, 7, 8, 9];
        const scaleIdx = arpPattern[stepInBar % 16];
        const noteFreq = rootFreq * 2 * scaleRatios[scaleIdx % scaleRatios.length]; // Base octave up

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.type = 'square';
        osc.frequency.value = noteFreq;

        // Sustain for continuous feel, slightly detached
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);

        this.noteIndex++;
        this.musicInterval = setTimeout(playStep, stepTime * 1000);
    };

    playStep();
};

soundManager.stopMusic = function () {
    this.isPlayingMusic = false;
    if (this.musicInterval) {
        clearTimeout(this.musicInterval);
        this.musicInterval = null;
    }
};
