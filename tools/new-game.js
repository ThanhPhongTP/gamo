#!/usr/bin/env node
/**
 * GAMO — New Game Generator
 * Usage: npm run new:game
 *        node tools/new-game.js [game-id] [--title="Game Title"] [--icon=🎮]
 *
 * Creates a new game from template in games/<game-id>/
 */

import { execSync }              from 'child_process';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname }      from 'path';
import { fileURLToPath }         from 'url';
import readline                  from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

// ── Parse CLI args ────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
const positional = [];

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    flags[k] = v ?? true;
  } else {
    positional.push(arg);
  }
});

// ── Interactive prompt if no args ─────────────────
async function prompt(question, fallback = '') {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim() || fallback);
    });
  });
}

async function main() {
  console.log('\n🎮 GAMO — New Game Generator\n' + '─'.repeat(40));

  const gameId = positional[0]
    || await prompt('Game ID (kebab-case, e.g. spelling-bee): ');

  if (!gameId || !/^[a-z][a-z0-9-]+$/.test(gameId)) {
    console.error('❌ Invalid game ID. Use lowercase letters, numbers, hyphens. (e.g. word-match)');
    process.exit(1);
  }

  const gameDir = resolve(ROOT, 'games', gameId);

  if (existsSync(gameDir)) {
    console.error(`❌ Game "${gameId}" already exists at games/${gameId}/`);
    process.exit(1);
  }

  const title    = flags.title    || await prompt(`Game title (e.g. Spelling Bee Battle): `, toTitle(gameId));
  const icon     = flags.icon     || await prompt(`Icon emoji (e.g. 🐝): `, '🎮');
  const category = flags.category || await prompt(`Category (vocabulary/grammar/listening/speaking): `, 'vocabulary');
  const port     = flags.port     || await prompt(`Dev server port (default: ${await nextPort()}): `, String(await nextPort()));

  console.log(`\n✨ Creating game: ${icon} ${title} (${gameId})\n`);

  // ── Create directory structure ─────────────────
  const dirs = [
    gameDir,
    `${gameDir}/src`,
    `${gameDir}/public`,
  ];
  dirs.forEach(d => mkdirSync(d, { recursive: true }));

  // ── Generate files ─────────────────────────────
  const files = generateFiles(gameId, title, icon, category, port);
  Object.entries(files).forEach(([relPath, content]) => {
    const absPath = resolve(gameDir, relPath);
    writeFileSync(absPath, content, 'utf8');
    console.log(`  ✅ Created ${relPath}`);
  });

  // ── Install dependencies ───────────────────────
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  } catch (e) {
    console.warn('⚠️  npm install failed — run it manually');
  }

  console.log(`
✅ Done! Game created at games/${gameId}/

Next steps:
  cd games/${gameId}
  npm run dev      ← start dev server on port ${port}

Or from root:
  npm run dev --workspace=games/${gameId}
`);
}

// ── File Templates ────────────────────────────────
function generateFiles(id, title, icon, category, port) {
  const className = toPascalCase(id) + 'Game';

  return {
    'package.json': JSON.stringify({
      name: `@gamo/${id}`,
      version: '1.0.0',
      description: `GAMO Game: ${title}`,
      private: true,
      type: 'module',
      scripts: {
        dev:     `vite --port ${port}`,
        build:   'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        '@gamo/engine': '*',
        '@gamo/ui':     '*',
      },
      devDependencies: {
        vite: '^6.3.5',
      },
      gamo: {
        gameId:   id,
        title,
        icon,
        category,
        levels:   ['primary', 'secondary', 'high-school'],
        skills:   ['vocabulary'],
        minWords: 4,
        maxWords: 50,
      },
    }, null, 2),

    'vite.config.js': `import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@gamo/engine': resolve(__dirname, '../../packages/engine/src/index.js'),
      '@gamo/ui':     resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: { port: ${port}, open: true, host: true },
  build:  { outDir: 'dist', emptyOutDir: true },
  base: process.env.VITE_BASE || '/',
});
`,

    'index.html': `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GAMO</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body>

  <!-- SCREEN: Dashboard -->
  <div id="screen-dashboard" class="screen active">
    <h1>${icon} ${title}</h1>
    <button id="btn-launch">🚀 Bắt Đầu</button>
  </div>

  <!-- SCREEN: Game -->
  <div id="screen-game" class="screen">
    <canvas id="game-canvas"></canvas>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
`,

    'src/style.css': `@import '../../../packages/ui/src/styles/main.css';

/* ── ${title} game-specific styles ── */
.screen {
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--t-med);
}

.screen.active {
  opacity: 1;
  pointer-events: all;
}

#screen-dashboard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-5);
  background: var(--gamo-bg);
}

#screen-dashboard h1 {
  font-family: var(--gamo-font-game);
  font-size: 48px;
  font-weight: 800;
}

#btn-launch {
  /* extend shared gamo-btn-primary */
  font-family: var(--gamo-font-ui);
  font-weight: 700;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, var(--gamo-primary), var(--gamo-secondary));
  color: white;
  padding: var(--s-4) var(--s-7);
  font-size: 18px;
  border-radius: var(--r-full);
  box-shadow: var(--glow-primary);
  transition: transform var(--t-fast);
}
#btn-launch:hover { transform: translateY(-3px); }

#screen-game { background: var(--gamo-bg); }
#game-canvas { width: 100%; height: 100%; display: block; }
`,

    'src/main.js': `/**
 * ${title} — Main entry point
 * Replace the template code below with your game logic.
 */
import { GameEngine } from '@gamo/engine';

// ── Screen Manager ──────────────────────
const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(s => s.classList.toggle('active', s.id === id));
}

// ── Game Setup ──────────────────────────
document.getElementById('btn-launch').addEventListener('click', () => {
  const engine = new GameEngine({ timeLimit: 60, lives: 3 });

  engine.loadQuestions([
    { id: 1, question: 'Example?', answer: 'yes', distractors: ['no', 'maybe'] },
  ]);

  engine.on('game:end', summary => {
    alert(\`Game over! Score: \${summary.score}\`);
    showScreen('screen-dashboard');
  });

  showScreen('screen-game');
  engine.start();
});
`,

    'README.md': `# ${icon} ${title}

**Category:** ${category}  
**Game ID:** \`${id}\`

## Development

\`\`\`bash
# From repo root:
npm run dev --workspace=games/${id}

# Or from game directory:
cd games/${id}
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build --workspace=games/${id}
\`\`\`

## Game Design

<!-- Describe game mechanics, rules, and learning objectives here -->

### How to Play
1. ...

### Learning Objectives
- ...
`,
  };
}

// ── Helpers ───────────────────────────────────────
function toPascalCase(str) {
  return str.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
}

function toTitle(str) {
  return str.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join(' ');
}

async function nextPort() {
  // Scan existing games and pick next available port starting at 3001
  const { readdirSync } = await import('fs');
  const gamesDir = resolve(ROOT, 'games');
  const games = existsSync(gamesDir) ? readdirSync(gamesDir) : [];
  return 3001 + games.length;
}

main().catch(err => { console.error(err); process.exit(1); });
