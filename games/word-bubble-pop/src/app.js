/**
 * =============================================
 * app.js — Word Bubble Pop Application Controller
 * =============================================
 * Glues together: Teacher Dashboard UI ↔ GameEngine ↔ BubbleGame
 */

import { GameEngine, AudioSystem } from '@gamo/engine';
import { BubbleGame } from './BubbleGame.js';

// ─── Word Templates ───────────────────────────────
const WORD_TEMPLATES = {
  animals: [
    { word: 'cat',      meaning: 'con mèo' },
    { word: 'dog',      meaning: 'con chó' },
    { word: 'bird',     meaning: 'con chim' },
    { word: 'fish',     meaning: 'con cá' },
    { word: 'rabbit',   meaning: 'con thỏ' },
    { word: 'elephant', meaning: 'con voi' },
    { word: 'tiger',    meaning: 'con hổ' },
    { word: 'monkey',   meaning: 'con khỉ' },
    { word: 'snake',    meaning: 'con rắn' },
    { word: 'duck',     meaning: 'con vịt' },
  ],
  colors: [
    { word: 'red',    meaning: 'màu đỏ' },
    { word: 'blue',   meaning: 'màu xanh dương' },
    { word: 'green',  meaning: 'màu xanh lá' },
    { word: 'yellow', meaning: 'màu vàng' },
    { word: 'purple', meaning: 'màu tím' },
    { word: 'orange', meaning: 'màu cam' },
    { word: 'pink',   meaning: 'màu hồng' },
    { word: 'black',  meaning: 'màu đen' },
    { word: 'white',  meaning: 'màu trắng' },
    { word: 'brown',  meaning: 'màu nâu' },
  ],
  food: [
    { word: 'apple',  meaning: 'quả táo' },
    { word: 'banana', meaning: 'quả chuối' },
    { word: 'rice',   meaning: 'cơm / gạo' },
    { word: 'bread',  meaning: 'bánh mì' },
    { word: 'milk',   meaning: 'sữa' },
    { word: 'egg',    meaning: 'quả trứng' },
    { word: 'cake',   meaning: 'bánh kem' },
    { word: 'soup',   meaning: 'súp / canh' },
    { word: 'pizza',  meaning: 'bánh pizza' },
    { word: 'water',  meaning: 'nước' },
  ],
  numbers: [
    { word: 'one',    meaning: 'một' },
    { word: 'two',    meaning: 'hai' },
    { word: 'three',  meaning: 'ba' },
    { word: 'four',   meaning: 'bốn' },
    { word: 'five',   meaning: 'năm' },
    { word: 'six',    meaning: 'sáu' },
    { word: 'seven',  meaning: 'bảy' },
    { word: 'eight',  meaning: 'tám' },
    { word: 'nine',   meaning: 'chín' },
    { word: 'ten',    meaning: 'mười' },
  ],
  family: [
    { word: 'father',   meaning: 'bố / cha' },
    { word: 'mother',   meaning: 'mẹ' },
    { word: 'brother',  meaning: 'anh / em trai' },
    { word: 'sister',   meaning: 'chị / em gái' },
    { word: 'baby',     meaning: 'em bé' },
    { word: 'grandpa',  meaning: 'ông' },
    { word: 'grandma',  meaning: 'bà' },
  ],
  school: [
    { word: 'book',     meaning: 'quyển sách' },
    { word: 'pen',      meaning: 'cây bút' },
    { word: 'pencil',   meaning: 'bút chì' },
    { word: 'ruler',    meaning: 'thước kẻ' },
    { word: 'eraser',   meaning: 'cục tẩy' },
    { word: 'bag',      meaning: 'cặp sách' },
    { word: 'teacher',  meaning: 'giáo viên' },
    { word: 'desk',     meaning: 'bàn học' },
    { word: 'chair',    meaning: 'cái ghế' },
    { word: 'board',    meaning: 'bảng' },
  ],
};

// ─── App State ────────────────────────────────────
const AppState = {
  words: [],          // [{ word, meaning, id }]
  mode: 'meaning',   // 'meaning' | 'word' | 'both'
  difficulty: 'medium',
  timeLimit: 60,
  title: '',
  engine: null,
  bubbleGame: null,
  streak: 0,
  missedWords: [],
};

// ─── DOM Helpers ──────────────────────────────────
const $ = id => document.getElementById(id);

function getScreens() {
  return {
    dashboard: $('screen-dashboard'),
    game:      $('screen-game'),
    pause:     $('screen-pause'),
    results:   $('screen-results'),
  };
}

// ─── Screen Manager ───────────────────────────────
function showScreen(name) {
  const screens = getScreens();
  Object.entries(screens).forEach(([key, el]) => {
    if (el) {
      el.classList.toggle('active', key === name);
    }
  });
}

// ─── Dashboard Logic ──────────────────────────────
function initDashboard() {
  // Navigation tabs
  $('nav-create')?.addEventListener('click', () => {
    setActiveNav('nav-create');
    showScreen('dashboard');
  });

  $('nav-library')?.addEventListener('click', () => {
    setActiveNav('nav-library');
    showToast('📚 Hãy chọn một chủ đề mẫu bên dưới để áp dụng vào bài!');
    const el = document.querySelector('.quick-templates');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.style.outline = '2px solid var(--color-primary)';
      setTimeout(() => el.style.outline = '', 1500);
    }
  });

  $('nav-results')?.addEventListener('click', () => {
    setActiveNav('nav-results');
    showToast('📊 Bạn có thể xem kết quả chi tiết sau khi học sinh hoàn thành trò chơi!');
  });

  // Game title live preview
  $('game-title')?.addEventListener('input', e => {
    const val = e.target.value.trim();
    const preview = $('preview-title');
    if (preview) preview.textContent = val || 'Bài học của bạn';
  });

  // Add word on button click
  $('btn-add-word')?.addEventListener('click', addWordFromInputs);

  // Add word on Enter key
  $('input-meaning')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addWordFromInputs();
  });
  $('input-word')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') $('input-meaning')?.focus();
  });

  // Bulk toggle
  $('btn-bulk-toggle')?.addEventListener('click', () => {
    $('bulk-area')?.classList.toggle('hidden');
  });

  // Bulk import
  $('btn-bulk-import')?.addEventListener('click', () => {
    const raw = $('bulk-input')?.value.trim() || '';
    const lines = raw.split('\n').filter(l => l.trim());
    let added = 0;

    lines.forEach(line => {
      const parts = line.split(/[,\t]+/).map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const word    = parts[0];
        const meaning = parts.slice(1).join(', ');
        if (addWord(word, meaning)) added++;
      }
    });

    if (added > 0) {
      if ($('bulk-input')) $('bulk-input').value = '';
      $('bulk-area')?.classList.add('hidden');
      showToast(`✅ Đã thêm ${added} từ vựng!`);
    } else {
      showToast('❌ Không tìm thấy từ hợp lệ. Dùng định dạng: từ, nghĩa', 'error');
    }
  });

  // Template chips
  document.querySelectorAll('.chip[data-template]').forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.template;
      const template = WORD_TEMPLATES[key] || [];
      let added = 0;
      template.forEach(({ word, meaning }) => {
        if (addWord(word, meaning)) added++;
      });
      if (added > 0) showToast(`✅ Đã thêm ${added} từ "${chip.textContent}"`);
      else showToast('ℹ️ Các từ đã có trong danh sách rồi');
    });
  });

  // Launch button
  $('btn-launch')?.addEventListener('click', launchGame);

  // Settings changes
  $('time-limit')?.addEventListener('change', e => {
    AppState.timeLimit = parseInt(e.target.value);
  });
  $('difficulty')?.addEventListener('change', e => {
    AppState.difficulty = e.target.value;
  });
  $('game-mode')?.addEventListener('change', e => {
    AppState.mode = e.target.value;
  });

  // Game Controls (Pause / Back / Resume / Quit)
  $('btn-pause')?.addEventListener('click', pauseGame);
  $('btn-back')?.addEventListener('click', () => {
    if (AppState.engine) AppState.engine.pause();
    if (confirm('Bạn có muốn thoát về màn hình soạn bài không?')) {
      goToDashboard();
    } else {
      AppState.engine?.resume();
    }
  });

  $('btn-resume')?.addEventListener('click', resumeGame);
  $('btn-quit')?.addEventListener('click', goToDashboard);

  // Results screen buttons
  $('btn-play-again')?.addEventListener('click', playAgain);
  $('btn-new-game')?.addEventListener('click', goToDashboard);
  $('btn-share')?.addEventListener('click', shareResults);

  // Render initial state
  renderWordList();
  updateLaunchButton();
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(id)?.classList.add('active');
}

function addWordFromInputs() {
  const wordInput    = $('input-word');
  const meaningInput = $('input-meaning');
  if (!wordInput || !meaningInput) return;

  const word    = wordInput.value.trim();
  const meaning = meaningInput.value.trim();

  if (!word || !meaning) {
    showToast('⚠️ Nhập cả từ tiếng Anh và nghĩa tiếng Việt nhé!', 'warn');
    return;
  }
  if (addWord(word, meaning)) {
    wordInput.value    = '';
    meaningInput.value = '';
    wordInput.focus();
  } else {
    showToast('⚠️ Từ này đã có trong danh sách rồi!', 'warn');
  }
}

function addWord(word, meaning) {
  if (AppState.words.some(w => w.word.toLowerCase() === word.toLowerCase())) return false;
  if (AppState.words.length >= 50) {
    showToast('⚠️ Tối đa 50 từ!', 'warn');
    return false;
  }
  AppState.words.push({ word, meaning, id: Date.now() + Math.random() });
  renderWordList();
  updateLaunchButton();
  return true;
}

function removeWord(id) {
  AppState.words = AppState.words.filter(w => w.id !== id);
  renderWordList();
  updateLaunchButton();
}

function renderWordList() {
  const list  = $('word-list');
  const empty = $('word-list-empty');
  const count = $('word-count-num');
  if (!list) return;

  if (count) count.textContent = AppState.words.length;

  if (AppState.words.length === 0) {
    if (empty) empty.style.display = 'flex';
    list.querySelectorAll('.word-item').forEach(el => el.remove());
    return;
  }

  if (empty) empty.style.display = 'none';
  list.querySelectorAll('.word-item').forEach(el => el.remove());

  const BUBBLE_COLORS = [
    '#2563EB', '#0D9488', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#0284C7', '#EA580C',
  ];

  AppState.words.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.dataset.id = item.id;

    const color = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
    div.innerHTML = `
      <div class="word-item-num" style="background:${color}">${i + 1}</div>
      <div class="word-item-word">${escapeHtml(item.word)}</div>
      <div class="word-item-meaning">${escapeHtml(item.meaning)}</div>
      <button class="btn-delete" data-id="${item.id}" title="Xóa">✕</button>
    `;

    div.querySelector('.btn-delete')?.addEventListener('click', (e) => {
      removeWord(parseFloat(e.currentTarget.dataset.id));
    });

    list.appendChild(div);
  });
}

function updateLaunchButton() {
  const btn  = $('btn-launch');
  const hint = $('launch-hint');
  if (!btn || !hint) return;

  const count = AppState.words.length;

  if (count < 4) {
    btn.disabled = true;
    hint.textContent = `Thêm ít nhất ${4 - count} từ nữa để bắt đầu`;
  } else {
    btn.disabled = false;
    hint.textContent = `${count} từ sẵn sàng — Nhấn để bắt đầu tiết học!`;
  }
}

// ─── Game Launch ──────────────────────────────────
function launchGame() {
  if (AppState.words.length < 4) {
    showToast('⚠️ Cần ít nhất 4 từ vựng để bắt đầu trò chơi!', 'warn');
    return;
  }

  AppState.title      = $('game-title')?.value.trim() || 'Word Bubble Pop';
  AppState.timeLimit  = parseInt($('time-limit')?.value || '60');
  AppState.difficulty = $('difficulty')?.value || 'medium';
  AppState.mode       = $('game-mode')?.value || 'meaning';
  AppState.streak     = 0;
  AppState.missedWords = [];

  // Build questions from word list
  const questions = buildQuestions(AppState.words, AppState.mode, AppState.words);

  // Create core engine
  AppState.engine = new GameEngine({
    timeLimit:    AppState.timeLimit,
    lives:        3,
    pointsCorrect: 10,
    pointsWrong:  -2,
    pointsTimeBonus: true,
  });

  AppState.engine.loadQuestions(questions);

  // Create renderer
  const canvas = $('game-canvas');
  if (!canvas) {
    console.error('Cannot find game-canvas');
    return;
  }

  AppState.bubbleGame = new BubbleGame(canvas, AppState.engine);
  AppState.bubbleGame.setup(AppState.difficulty);

  // Wire engine events
  AppState.engine.on('game:start', onGameStart);
  AppState.engine.on('question:new', onQuestionNew);
  AppState.engine.on('answer:correct', onAnswerCorrect);
  AppState.engine.on('answer:wrong', onAnswerWrong);
  AppState.engine.on('timer:tick', onTimerTick);
  AppState.engine.on('game:end', onGameEnd);

  // Show game screen
  showScreen('game');
  AppState.engine.start();

  // Keyboard shortcuts
  window.removeEventListener('keydown', onKeyDown);
  window.addEventListener('keydown', onKeyDown);
}

function buildQuestions(words, mode, allWords) {
  return words.map(item => {
    const isWordToMeaning = mode === 'word'
      ? true
      : mode === 'meaning'
        ? false
        : Math.random() > 0.5;

    const question = isWordToMeaning ? item.word : item.meaning;
    const answer   = isWordToMeaning ? item.meaning : item.word;

    // Build distractors from other words
    const pool = allWords
      .filter(w => w !== item)
      .map(w => isWordToMeaning ? w.meaning : w.word);

    const distractors = shuffle(pool).slice(0, 7);

    return {
      id: item.id,
      question,
      answer,
      distractors,
      originalItem: item,
    };
  });
}

// ─── Game Event Handlers ──────────────────────────
function onGameStart({ score, lives, timeLeft }) {
  updateHUD(score, timeLeft, lives);
  $('streak-display')?.classList.add('hidden');
}

function onQuestionNew({ question, round, total }) {
  const qText = $('question-text');
  if (!qText) return;

  qText.textContent = question.question;
  qText.style.animation = 'none';
  requestAnimationFrame(() => {
    qText.style.animation = 'questionPop 0.35s cubic-bezier(0.34,1.56,0.64,1)';
  });

  // Inject animation style if needed
  if (!document.getElementById('q-anim-style')) {
    const style = document.createElement('style');
    style.id = 'q-anim-style';
    style.textContent = `@keyframes questionPop {
      0%   { transform: scale(0.85); opacity: 0; }
      100% { transform: scale(1);   opacity: 1; }
    }`;
    document.head.appendChild(style);
  }

  // Tell renderer about new question
  AppState.bubbleGame?.loadQuestion(question);
}

function onAnswerCorrect({ score, timeBonus }) {
  AppState.streak++;

  const scoreEl = $('hud-score');
  if (scoreEl) {
    scoreEl.textContent = score;
    scoreEl.classList.remove('bump');
    requestAnimationFrame(() => scoreEl.classList.add('bump'));
  }

  AppState.bubbleGame?.flashScreen(true);

  if (AppState.streak >= 3) {
    const streakEl = $('streak-display');
    if (streakEl) {
      const countEl = $('streak-count');
      if (countEl) countEl.textContent = AppState.streak;
      streakEl.classList.remove('hidden');
      clearTimeout(streakEl._hideTimer);
      streakEl._hideTimer = setTimeout(() => streakEl.classList.add('hidden'), 2000);
    }
  }

  if (timeBonus > 0) showFloatingText(`+${10 + timeBonus}`, 'accent');
}

function onAnswerWrong({ correctAnswer, livesLeft, question }) {
  AppState.streak = 0;
  $('streak-display')?.classList.add('hidden');

  if (question) AppState.missedWords.push(question);

  updateLives(livesLeft);
  AppState.bubbleGame?.flashScreen(false);
  showFloatingText(`✕ ${correctAnswer}`, 'danger');
}

function onTimerTick({ timeLeft }) {
  const timerText = $('timer-text');
  if (timerText) timerText.textContent = timeLeft;

  updateTimerRing(timeLeft, AppState.timeLimit);

  const timerEl = $('hud-timer');
  if (timerEl) {
    if (timeLeft <= 10) {
      timerEl.classList.add('timer-urgent');
      if (timeLeft <= 5) AppState.engine?.audio.play('tick');
    } else {
      timerEl.classList.remove('timer-urgent');
    }
  }
}

function onGameEnd(summary) {
  setTimeout(() => showResults(summary), 500);
}

// ─── HUD Updates ─────────────────────────────────
function updateHUD(score, timeLeft, lives) {
  if ($('hud-score')) $('hud-score').textContent = score;
  if ($('timer-text')) $('timer-text').textContent = timeLeft;
  updateTimerRing(timeLeft, AppState.timeLimit);
  updateLives(lives);
}

function updateLives(livesLeft) {
  const lifeContainer = $('lives-display');
  if (!lifeContainer) return;
  const lifeEls = lifeContainer.querySelectorAll('.life');
  lifeEls.forEach((el, i) => {
    el.classList.toggle('active', i < livesLeft);
  });
}

function updateTimerRing(timeLeft, totalTime) {
  const ring = $('timer-ring-fill');
  if (!ring) return;
  const totalDash = 150.8;
  const fraction  = Math.max(0, timeLeft / totalTime);
  const offset    = totalDash * (1 - fraction);
  ring.style.strokeDashoffset = offset;
}

function showFloatingText(text, type = 'accent') {
  const el = document.createElement('div');
  const colors = {
    accent: '#10B981',
    danger: '#EF4444',
  };
  el.style.cssText = `
    position: fixed;
    top: 38%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Lexend', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: ${colors[type] || '#2563EB'};
    pointer-events: none;
    z-index: 100;
    text-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: floatUp 0.8s ease forwards;
  `;
  el.textContent = text;
  document.body.appendChild(el);

  if (!document.getElementById('float-anim-style')) {
    const s = document.createElement('style');
    s.id = 'float-anim-style';
    s.textContent = `@keyframes floatUp {
      0%   { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
      100% { transform: translate(-50%, -120%) scale(1.1); opacity: 0; }
    }`;
    document.head.appendChild(s);
  }

  setTimeout(() => el.remove(), 800);
}

// ─── Results Screen ───────────────────────────────
function showResults(summary) {
  const { score, correctAnswers, wrongAnswers, accuracy, timeUsed } = summary;

  if ($('rs-score'))    $('rs-score').textContent    = score;
  if ($('rs-correct'))  $('rs-correct').textContent  = correctAnswers;
  if ($('rs-accuracy')) $('rs-accuracy').textContent = accuracy + '%';
  if ($('rs-time'))     $('rs-time').textContent     = timeUsed + 's';

  // Trophy and Title
  const trophy   = $('results-trophy');
  const title    = $('results-title');
  const subtitle = $('results-subtitle');

  if (accuracy >= 80) {
    if (trophy) trophy.textContent = '🏆';
    if (title) title.textContent = 'Xuất Sắc!';
    if (subtitle) subtitle.textContent = 'Học sinh làm rất tốt, bài giảng thành công!';
  } else if (accuracy >= 50) {
    if (trophy) trophy.textContent = '⭐';
    if (title) title.textContent = 'Rất Tốt!';
    if (subtitle) subtitle.textContent = 'Cố gắng thêm một chút nữa nhé!';
  } else {
    if (trophy) trophy.textContent = '📖';
    if (title) title.textContent = 'Cùng Ôn Lại Nào!';
    if (subtitle) subtitle.textContent = 'Cần rèn luyện thêm các từ vựng này nhé.';
  }

  // Missed words section
  const missedSection = $('missed-words-section');
  const missedList    = $('missed-list');

  if (missedList) {
    missedList.innerHTML = '';
    if (AppState.missedWords.length > 0) {
      if (missedSection) missedSection.style.display = 'block';
      AppState.missedWords.forEach(q => {
        const chip = document.createElement('span');
        chip.className = 'missed-chip';
        chip.textContent = `${q.question} → ${q.answer}`;
        missedList.appendChild(chip);
      });
    } else {
      if (missedSection) missedSection.style.display = 'none';
    }
  }

  showScreen('results');
  if (accuracy >= 70) launchConfetti();
}

// ─── Confetti ─────────────────────────────────────
function launchConfetti() {
  const canvas = $('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 90 }, () => ({
    x:  Math.random() * canvas.width,
    y: -20 - Math.random() * 100,
    r:  4 + Math.random() * 6,
    color: ['#2563EB','#0D9488','#10B981','#F59E0B','#EC4899','#0284C7'][Math.floor(Math.random()*6)],
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 4,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.2,
  }));

  let frame;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    pieces.forEach(p => {
      p.x     += p.vx;
      p.y     += p.vy;
      p.angle += p.spin;
      p.vy    *= 1.01;

      if (p.y < canvas.height + 20) {
        alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r);
        ctx.restore();
      }
    });
    if (alive > 0) frame = requestAnimationFrame(animate);
  }
  animate();
  setTimeout(() => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, 4000);
}

// ─── Play Again & Reset ───────────────────────────
function playAgain() {
  launchGame();
}

function goToDashboard() {
  if (AppState.bubbleGame) {
    AppState.bubbleGame.destroy();
    AppState.bubbleGame = null;
  }
  window.removeEventListener('keydown', onKeyDown);
  showScreen('dashboard');
  setActiveNav('nav-create');
}

function shareResults() {
  const score = $('rs-score')?.textContent || '0';
  const acc   = $('rs-accuracy')?.textContent || '0%';
  const text  = `🎓 GAMO Edu — Word Bubble Pop\n🏆 Điểm bài học: ${score} | Độ chính xác: ${acc}`;
  if (navigator.share) {
    navigator.share({ title: 'GAMO Edu — Kết Quả Học Tập', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text)
      .then(() => showToast('✅ Đã sao chép kết quả bài giảng!'))
      .catch(() => showToast('📋 Hãy chia sẻ kết quả với cả lớp nhé!'));
  }
}

// ─── Pause & Controls ─────────────────────────────
function pauseGame() {
  if (!AppState.engine || !AppState.engine.state.isRunning) return;
  AppState.engine.pause();
  const pauseScore = $('pause-score');
  if (pauseScore) pauseScore.textContent = AppState.engine.state.score;
  showScreen('pause');
}

function resumeGame() {
  AppState.engine?.resume();
  showScreen('game');
}

function onKeyDown(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    const screens = getScreens();
    const isGameActive  = screens.game?.classList.contains('active');
    const isPauseActive = screens.pause?.classList.contains('active');
    if (isGameActive)  pauseGame();
    else if (isPauseActive) resumeGame();
  }
}

// ─── Toast Notifications ──────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  const colors = { success: '#10B981', error: '#EF4444', warn: '#F59E0B' };
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: ${colors[type] || colors.success};
    color: white;
    padding: 10px 22px;
    border-radius: 999px;
    font-weight: 700;
    font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    z-index: 9999;
    pointer-events: none;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ─── Utils ────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Bootstrap Init ───────────────────────────────
export function initApp() {
  initDashboard();
  showScreen('dashboard');

  // Tự động nạp bộ từ vựng mẫu Động vật (Animals) để giáo viên có thể thử bấm "Bắt Đầu Tiết Học" ngay
  const animals = WORD_TEMPLATES.animals.slice(0, 6);
  animals.forEach(({ word, meaning }) => addWord(word, meaning));
}
