# Pinball 🕹️

A retro-style arcade pinball game built from scratch using **Vanilla JavaScript** and **HTML5 Canvas**.  
Features a custom 2D physics engine, procedural audio generation (Web Audio API), and a neon cyberpunk aesthetic.

👉 **[Play Live Demo](https://rtarik.github.io/pinball-js/)**


## ✨ Features

*   **Custom Physics Engine**: Real-time collision detection, continuous physics substeps, and impulse resolution.
*   **Procedural Audio**: No asset files! All sound effects (bumpers, flippers) and the dynamic music sequencer are generated in real-time using the **Web Audio API**.
*   **Neon Visuals**: Glowing particle effects and cyberpunk color palette drawn purely via Canvas API.
*   **Dynamic Controls**: Rebindable keys and settings panel.

## 🎮 Controls

| Action | Default Key |
| :--- | :--- |
| **Left Flipper** | `X` (or Left Arrow) |
| **Right Flipper** | `N` (or Right Arrow) |
| **Plunger** | `Space` (Hold to charge) |
| **Pause** | `P` |
| **Restart** | `Space` (When Game Over) |

*You can rebind the flipper keys by clicking the buttons in the settings panel.*

## 🚀 Running Locally

No build step required! This is pure vanilla JS.

1.  Clone the repository:
    ```bash
    git clone https://github.com/rtarik/pinball-js.git
    ```
2.  Open `index.html` in your browser.
    *   *Tip: Use a local server (like `Live Server` in VS Code or `python3 -m http.server`) to avoid CORS issues with modules if applicable, though strictly this project uses script tags.*

## 🛠️ Tech Stack

*   **HTML5 Canvas**: Rendering
*   **JavaScript (ES6+)**: Game Logic & Physics
*   **Web Audio API**: FX & Music
*   **CSS3**: UI Overlay & Styling

