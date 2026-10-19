# GAMO — Educational English Game Platform

> **"1 ruột nhiều vỏ"** — Một core engine dùng chung, vô số game khác nhau.

---

## 📁 Cấu Trúc Dự Án

```
Gamo/
├── packages/                    ← Shared code (dùng chung mọi game)
│   ├── engine/                  ← @gamo/engine — "Ruột" (GameEngine, AudioSystem)
│   │   ├── src/
│   │   │   ├── index.js         ← Public API
│   │   │   └── GameEngine.js    ← Core engine
│   │   └── package.json
│   │
│   ├── ui/                      ← @gamo/ui — Shared design system
│   │   ├── src/
│   │   │   └── styles/
│   │   │       ├── tokens.css   ← CSS variables & animations
│   │   │       └── main.css     ← Reset + shared components
│   │   └── package.json
│   │
│   ├── content/                 ← @gamo/content — Universal Content Hub & Smart Parser
│   │   ├── src/
│   │   │   ├── schema.js        ← LessonPack data contracts
│   │   │   ├── parser.js        ← Smart Text Parser (Word, Excel, Zalo)
│   │   │   ├── curriculum.js    ← Thư viện bài mẫu SGK (Lớp 1-12)
│   │   │   ├── storage.js       ← LocalStorage & Export/Import JSON
│   │   │   └── adapter.js       ← Biến đổi dữ liệu cho từng game
│   │   └── package.json
│   │
│   └── assets/                  ← @gamo/assets — Characters, sounds, fonts
│       └── ...
│
├── games/                       ← Mỗi game là 1 package độc lập
│   ├── word-bubble-pop/         ← Game 1 (Từ vựng bong bóng) ✅
│   │   ├── src/
│   │   │   ├── main.js          ← Entry point (Vite)
│   │   │   ├── BubbleGame.js    ← Canvas renderer ("Vỏ")
│   │   │   ├── app.js           ← UI controller
│   │   │   └── style.css        ← Game-specific styles
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   ├── sentence-bridge/         ← Game 2 (Mẫu câu xếp gạch xây cầu vượt sông) ✅
│   │   ├── src/
│   │   │   ├── main.js
│   │   │   ├── BridgeGame.js    ← Canvas renderer (Dòng sông, cầu đá, ếch Froggy)
│   │   │   ├── app.js           ← UI controller & Speech audio
│   │   │   └── style.css
│   │   ├── index.html
│   │   ├── vite.config.js
│   │   └── package.json
│   │
│   ├── spelling-bee/            ← Game 3 (sắp tới)
│   └── ...
│
├── tools/
│   └── new-game.js              ← CLI: npm run new:game → tạo game mới
│
├── docs/                        ← Tài liệu
├── .github/
│   └── workflows/
│       └── deploy.yml           ← CI/CD tự động deploy lên Firebase
│
├── package.json                 ← Root (npm workspaces)
├── .gitignore
└── README.md
```

---

## ⚡ Lệnh Hàng Ngày

```bash
# Chạy dev server cho game
npm run dev                            # → word-bubble-pop (port 3000)
npm run dev:bridge                     # → sentence-bridge (port 3001)
npm run dev:all                        # → chạy song song cả 2 game
npm run dev -w games/<game-name>       # → game khác

# Tạo game mới (scaffold tự động)
npm run new:game
# → Interactive: nhập tên, icon, category, port
# → Tự tạo đủ files + install deps

# Build 1 game để deploy
npm run build -w games/word-bubble-pop

# Build tất cả
npm run build
```

---

## 🔗 Quy Tắc Import

```js
// ✅ Đúng — import từ package
import { GameEngine } from '@gamo/engine';
import '@gamo/ui/styles/main.css';

// ❌ Sai — không dùng relative path qua nhiều folder
import { GameEngine } from '../../packages/engine/src/GameEngine.js';
```

---

## 🎮 Thêm Game Mới

```bash
# 1. Scaffold tự động
npm run new:game spelling-bee --title="Spelling Bee Battle" --icon=🐝

# 2. Phát triển game trong games/spelling-bee/src/
# 3. Import engine:
import { GameEngine } from '@gamo/engine';

# 4. Deploy khi xong
git push origin main   # → GitHub Actions tự deploy Firebase
```

---

## 🌿 Git Branch Convention

| Branch | Mục đích |
|--------|---------|
| `main` | Production — chỉ merge khi game xong |
| `dev`  | Development — làm việc hàng ngày |
| `feat/[game-id]` | Một game đang phát triển |
| `fix/[issue]`    | Bug fix |

```bash
# Workflow hàng ngày
git checkout -b feat/spelling-bee   # Tạo branch mới
# ... làm game ...
git add .
git commit -m "feat(spelling-bee): add bubble renderer"
git push origin feat/spelling-bee
# Khi xong: merge vào dev, test, rồi merge vào main để deploy
```

---

## 📦 Package Registry

| Package | Mô tả | Import |
|---------|-------|--------|
| `@gamo/engine` | GameEngine, AudioSystem | `import { GameEngine } from '@gamo/engine'` |
| `@gamo/ui` | Design tokens, shared CSS | `@import '@gamo/ui/styles/main.css'` |
| `@gamo/assets` | Characters, sounds *(sắp tới)* | `import fox from '@gamo/assets/characters/fox'` |

---

## 🚀 Deploy Flow

```
code push → GitHub → Actions CI
                         ↓
              Detect changed games
                         ↓
              npm run build (chỉ game thay đổi)
                         ↓
              Firebase Hosting deploy
                         ↓
              gamo.edu.vn/games/[game-id]/
```
