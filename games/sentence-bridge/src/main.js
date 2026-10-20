/**
 * Sentence Bridge Builder — Main Entry Point (Vite)
 */

import { GameEngine, AudioSystem } from '@gamo/engine';
import { BridgeGame } from './BridgeGame.js';
import { initApp } from './app.js';

window.GameEngine = GameEngine;
window.AudioSystem = AudioSystem;
window.BridgeGame = BridgeGame;

// Route to root Hub on production (Vercel)
function patchHubLinks() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocal) {
    document.querySelectorAll('a[href*="localhost:5173"]').forEach(a => {
      a.href = '/';
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    patchHubLinks();
    initApp();
  });
} else {
  patchHubLinks();
  initApp();
}
