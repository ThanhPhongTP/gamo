import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

console.log('🚀 GAMO — Starting Unified Production Build for Vercel...');

// 1. Clean root dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Build portal
console.log('\n📦 [1/3] Building Portal (Hub)...');
execSync('npm run build -w portal', { stdio: 'inherit', cwd: rootDir });
const portalDist = path.resolve(rootDir, 'portal', 'dist');
fs.cpSync(portalDist, distDir, { recursive: true });

// 3. Build Word Bubble Pop with subpath base
console.log('\n📦 [2/3] Building Word Bubble Pop (/games/word-bubble-pop/)...');
const bubbleDistTarget = path.resolve(distDir, 'games', 'word-bubble-pop');
fs.mkdirSync(bubbleDistTarget, { recursive: true });
execSync('npm run build -w games/word-bubble-pop', {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, VITE_BASE: '/games/word-bubble-pop/' }
});
const bubbleDist = path.resolve(rootDir, 'games', 'word-bubble-pop', 'dist');
fs.cpSync(bubbleDist, bubbleDistTarget, { recursive: true });

// 4. Build Sentence Bridge with subpath base
console.log('\n📦 [3/3] Building Sentence Bridge (/games/sentence-bridge/)...');
const bridgeDistTarget = path.resolve(distDir, 'games', 'sentence-bridge');
fs.mkdirSync(bridgeDistTarget, { recursive: true });
execSync('npm run build -w games/sentence-bridge', {
  stdio: 'inherit',
  cwd: rootDir,
  env: { ...process.env, VITE_BASE: '/games/sentence-bridge/' }
});
const bridgeDist = path.resolve(rootDir, 'games', 'sentence-bridge', 'dist');
fs.cpSync(bridgeDist, bridgeDistTarget, { recursive: true });

console.log('\n✨ Unified build complete! All artifacts assembled in /dist:');
console.log('   ├── / (Portal Hub)');
console.log('   ├── /games/word-bubble-pop/ (Word Bubble Pop)');
console.log('   └── /games/sentence-bridge/ (Sentence Bridge Builder)\n');
