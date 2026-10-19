/**
 * =========================================================
 * app.js — Sentence Bridge Builder Application Controller
 * =========================================================
 * Connects: Teacher UI ↔ GameEngine ↔ BridgeGame Canvas ↔ @gamo/content
 */

import { GameEngine, AudioSystem } from '@gamo/engine';
import {
  CURRICULUM_LIBRARY,
  toSentenceBridgeQuestions,
  parseSmartText,
  createLessonPack,
} from '@gamo/content';
import { BridgeGame } from './BridgeGame.js';

// ─── App State ──────────────────────────────────────────
export const AppState = {
  currentPack: null,
  questions: [],
  currentQuestionIndex: 0,
  engine: null,
  bridgeGame: null,
  streak: 0,
  maxStreak: 0,
  lives: 3,
  score: 0,
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  timeLimit: 120,
  timerInterval: null,
  timeLeft: 120,
};

// ─── DOM Helpers ────────────────────────────────────────
const $ = id => document.getElementById(id);

function getScreens() {
  return {
    dashboard: $('screen-dashboard'),
    game:      $('screen-game'),
    summary:   $('screen-summary'),
    modal:     $('modal-custom'),
  };
}

function showScreen(screenId) {
  const screens = getScreens();
  Object.entries(screens).forEach(([key, el]) => {
    if (key === 'modal') return;
    if (el) el.classList.toggle('active', key === screenId);
  });
}

// ─── Text-to-Speech Helper ──────────────────────────────
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // clear, learner-friendly pace
  window.speechSynthesis.speak(utterance);
}

// ─── Initialization ─────────────────────────────────────
export function initApp() {
  // Pre-load default sentence pack (Daily Actions)
  const defaultPack = CURRICULUM_LIBRARY.find(p => p.id === 'pack_sentence_daily') || CURRICULUM_LIBRARY[0];
  AppState.currentPack = defaultPack;

  _renderCurriculumPacks();
  _setupEventListeners();
  _updatePackPreview(defaultPack);
}

// ─── Render Lesson Packs ────────────────────────────────
function _renderCurriculumPacks() {
  const container = $('preset-packs-list');
  if (!container) return;

  container.innerHTML = '';

  CURRICULUM_LIBRARY.forEach(pack => {
    const card = document.createElement('div');
    card.className = `pack-card ${pack.id === AppState.currentPack?.id ? 'selected' : ''}`;
    card.dataset.id = pack.id;

    const icon = pack.type === 'sentence' ? '🌉' : '📚';
    const tag = pack.type === 'sentence' ? 'Mẫu Câu' : 'Từ Vựng';

    card.innerHTML = `
      <div class="pack-badge">${tag}</div>
      <div class="pack-icon">${icon}</div>
      <div class="pack-info">
        <h4 class="pack-title">${pack.title}</h4>
        <p class="pack-desc">${pack.description || pack.items.length + ' câu hỏi'}</p>
        <span class="pack-count">🔹 ${pack.items.length} câu</span>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.pack-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      AppState.currentPack = pack;
      _updatePackPreview(pack);
    });

    container.appendChild(card);
  });
}

function _updatePackPreview(pack) {
  if (!pack) return;
  const previewTitle = $('preview-pack-title');
  const previewCount = $('preview-pack-count');
  const previewList = $('preview-pack-samples');

  if (previewTitle) previewTitle.textContent = pack.title;
  if (previewCount) previewCount.textContent = `${pack.items.length} câu mẫu`;

  if (previewList) {
    previewList.innerHTML = pack.items.slice(0, 4).map(item => `
      <li class="sample-item">
        <span class="sample-en">${item.fullSentence || item.answer}</span>
        <span class="sample-vi">${item.prompt}</span>
      </li>
    `).join('');
  }
}

// ─── Setup Event Listeners ──────────────────────────────
function _setupEventListeners() {
  // Launch button
  $('btn-launch')?.addEventListener('click', startGame);

  // Custom lesson modal buttons
  $('btn-open-custom')?.addEventListener('click', () => {
    $('modal-custom')?.classList.add('active');
  });

  $('btn-close-modal')?.addEventListener('click', () => {
    $('modal-custom')?.classList.remove('active');
  });

  $('btn-parse-custom')?.addEventListener('click', _handleParseCustom);

  // In-Game HUD buttons
  $('btn-audio')?.addEventListener('click', () => {
    const currentQ = AppState.questions[AppState.currentQuestionIndex];
    if (currentQ) {
      speakText(currentQ.fullSentence);
    }
  });

  $('btn-hint')?.addEventListener('click', () => {
    const currentQ = AppState.questions[AppState.currentQuestionIndex];
    if (currentQ) {
      const hintMsg = currentQ.hint || currentQ.pattern || `Gợi ý từ tiếp theo: "${currentQ.chunks[AppState.bridgeGame?.currentStep || 0]}"`;
      _showToast(`💡 ${hintMsg}`, 3500);
    }
  });

  $('btn-exit-game')?.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn thoát về màn hình chọn bài không?')) {
      _stopGame();
      showScreen('dashboard');
    }
  });

  // Difficulty selector buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.difficulty = btn.dataset.diff || 'medium';
    });
  });

  // Summary buttons
  $('btn-replay')?.addEventListener('click', startGame);
  $('btn-change-lesson')?.addEventListener('click', () => showScreen('dashboard'));
}

// ─── Custom Lesson Parser ───────────────────────────────
function _handleParseCustom() {
  const textarea = $('custom-input-text');
  const rawText = textarea ? textarea.value.trim() : '';

  if (!rawText) {
    alert('Vui lòng dán danh sách câu vào ô văn bản!');
    return;
  }

  const items = parseSmartText(rawText);
  if (items.length === 0) {
    alert('Không thể nhận diện câu nào. Hãy kiểm tra định dạng mẫu: \n"She is reading a book : Cô ấy đang đọc sách"');
    return;
  }

  const customPack = createLessonPack({
    id: `custom_${Date.now()}`,
    title: 'Bài Học Tùy Chỉnh Của Thầy Cô',
    type: 'sentence',
    description: `Gồm ${items.length} câu tự soạn`,
    items,
  });

  AppState.currentPack = customPack;
  $('modal-custom')?.classList.remove('active');
  _updatePackPreview(customPack);
  _showToast(`✅ Đã nạp thành công ${items.length} câu!`, 2500);
}

// ─── Game Flow ──────────────────────────────────────────
export function startGame() {
  if (!AppState.currentPack) {
    alert('Vui lòng chọn một bài học trước!');
    return;
  }

  // Time limits per difficulty
  const timeLimits = { easy: 150, medium: 120, hard: 90 };
  AppState.timeLimit = timeLimits[AppState.difficulty] || 120;
  AppState.timeLeft = AppState.timeLimit;

  // Convert pack items into bridge questions with difficulty setting
  AppState.questions = toSentenceBridgeQuestions(AppState.currentPack, {
    difficulty: AppState.difficulty,
  });

  if (AppState.questions.length === 0) {
    alert('Bài học không có câu hỏi hợp lệ!');
    return;
  }

  // Reset state
  AppState.currentQuestionIndex = 0;
  AppState.score = 0;
  AppState.lives = 3;
  AppState.streak = 0;
  AppState.maxStreak = 0;

  // Initialize or re-use GameEngine
  if (!AppState.engine) {
    AppState.engine = new GameEngine({
      lives: 3,
      timeLimit: AppState.timeLimit,
      pointsCorrect: 20,
      pointsWrong: -5,
    });
  }

  showScreen('game');

  // Initialize Canvas BridgeGame
  const canvas = $('game-canvas');
  if (!AppState.bridgeGame) {
    AppState.bridgeGame = new BridgeGame(canvas, AppState.engine);
    AppState.bridgeGame.setup();
  } else {
    AppState.bridgeGame._resize();
  }

  // Hook BridgeGame events
  AppState.bridgeGame.onCorrectStep = (chunkText, stepIndex, isComplete) => {
    AppState.score += 5;
    _updateHUD();

    if (isComplete) {
      AppState.streak++;
      if (AppState.streak > AppState.maxStreak) AppState.maxStreak = AppState.streak;
      AppState.score += 15 + AppState.streak * 5; // Bonus for completing full bridge
      _updateHUD();
      _showToast('🎉 Xây cầu thành công!', 1500);

      // Auto speak sentence
      const q = AppState.questions[AppState.currentQuestionIndex];
      if (q) speakText(q.fullSentence);

      // Next question after victory animation
      setTimeout(() => {
        _nextQuestion();
      }, 1800);
    }
  };

  AppState.bridgeGame.onWrongStep = (wrongChunk) => {
    AppState.lives = Math.max(0, AppState.lives - 1);
    AppState.streak = 0;
    _updateHUD();
    _showToast(`❌ Không phải "${wrongChunk}". Thử lại nhé!`, 1800);

    if (AppState.lives <= 0) {
      setTimeout(() => {
        _endGame('out_of_lives');
      }, 900);
    }
  };

  _startTimer();
  _loadCurrentQuestion();
}

function _loadCurrentQuestion() {
  if (AppState.currentQuestionIndex >= AppState.questions.length) {
    _endGame('completed');
    return;
  }

  const q = AppState.questions[AppState.currentQuestionIndex];

  // Update HUD prompt banner
  const promptEl = $('prompt-vietnamese');
  if (promptEl) promptEl.textContent = q.prompt;

  const hintBadge = $('prompt-pattern-hint');
  if (hintBadge) {
    hintBadge.textContent = q.pattern ? `📌 ${q.pattern}` : '';
    hintBadge.style.display = q.pattern ? 'inline-block' : 'none';
  }

  _updateHUD();

  // Load question into Canvas BridgeGame
  AppState.bridgeGame.loadQuestion(q);
}

function _nextQuestion() {
  AppState.currentQuestionIndex++;
  _loadCurrentQuestion();
}

function _updateHUD() {
  // Score
  const scoreEl = $('hud-score');
  if (scoreEl) scoreEl.textContent = AppState.score;

  // Streak
  const streakEl = $('hud-streak');
  const streakContainer = $('hud-streak-container');
  if (streakEl) streakEl.textContent = AppState.streak;
  if (streakContainer) {
    streakContainer.classList.toggle('active', AppState.streak >= 2);
  }

  // Lives (Hearts)
  const livesEl = $('hud-lives');
  if (livesEl) {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < AppState.lives ? '❤️' : '🖤';
    }
    livesEl.textContent = hearts;
  }

  // Progress
  const progressEl = $('hud-progress');
  if (progressEl) {
    progressEl.textContent = `${AppState.currentQuestionIndex + 1} / ${AppState.questions.length}`;
  }
}

function _startTimer() {
  clearInterval(AppState.timerInterval);
  AppState.timerInterval = setInterval(() => {
    AppState.timeLeft--;
    const timerEl = $('hud-timer');
    if (timerEl) {
      const mins = Math.floor(AppState.timeLeft / 60);
      const secs = AppState.timeLeft % 60;
      timerEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    if (AppState.timeLeft <= 0) {
      clearInterval(AppState.timerInterval);
      _endGame('timeout');
    }
  }, 1000);
}

function _stopGame() {
  clearInterval(AppState.timerInterval);
}

function _endGame(reason) {
  _stopGame();

  const total = AppState.questions.length;
  const completed = Math.min(AppState.currentQuestionIndex, total);
  const accuracy = Math.round((completed / total) * 100);

  // Star Rating
  let stars = '⭐';
  if (AppState.lives >= 3 && accuracy >= 80) stars = '⭐⭐⭐';
  else if (AppState.lives >= 2 || accuracy >= 60) stars = '⭐⭐';

  $('summary-stars').textContent = stars;
  $('summary-title').textContent = reason === 'completed' ? 'Tuyệt Vời! Đã Xây Xong Cầu! 🎉' : 'Cố Gắng Lần Sau Nhé! 💪';
  $('summary-score').textContent = AppState.score;
  $('summary-accuracy').textContent = `${accuracy}% (${completed}/${total} câu)`;
  $('summary-streak').textContent = AppState.maxStreak;

  showScreen('summary');
}

// ─── Toast Notification ─────────────────────────────────
function _showToast(message, duration = 2000) {
  let toast = $('game-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'game-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}
