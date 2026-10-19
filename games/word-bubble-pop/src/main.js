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

// Bootstrap the application
initApp();
