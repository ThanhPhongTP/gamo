/**
 * Sentence Bridge Builder — Main Entry Point (Vite)
 */

import { GameEngine, AudioSystem } from '@gamo/engine';
import { BridgeGame } from './BridgeGame.js';
import { initApp } from './app.js';

window.GameEngine = GameEngine;
window.AudioSystem = AudioSystem;
window.BridgeGame = BridgeGame;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
