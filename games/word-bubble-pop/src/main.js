/**
 * Word Bubble Pop — Main Entry Point (Vite)
 *
 * This file is the single entry point bundled by Vite.
 * It imports the GameEngine from the shared @gamo/engine package,
 * the BubbleGame renderer, and the app controller.
 */

// Import shared engine from workspace package
import { GameEngine, AudioSystem } from '@gamo/engine';

// Import game-specific modules
import { BubbleGame } from './BubbleGame.js';
import { initApp }    from './app.js';

// Make engine available globally (BubbleGame and app use it directly)
// In a future refactor, these can accept engine as a constructor argument.
window.GameEngine  = GameEngine;
window.AudioSystem = AudioSystem;
window.BubbleGame  = BubbleGame;

// Route to root Hub on production (Vercel)
function patchHubLinks() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    document.querySelectorAll('a[href*="localhost:5173"]').forEach(a => {
      a.href = '/';
    });
  }
}

// Bootstrap the application safely after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    patchHubLinks();
    initApp();
  });
} else {
  patchHubLinks();
  initApp();
}
