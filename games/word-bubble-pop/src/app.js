/**
 * =============================================
 * app.js — Word Bubble Pop Application Controller
 * =============================================
 * Glues together: Teacher Dashboard UI ↔ GameEngine ↔ BubbleGame
 */

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
    { word: 'mother',    meaning: 'mẹ' },
    { word: 'father',    meaning: 'bố' },
    { word: 'sister',    meaning: 'em/chị gái' },
    { word: 'brother',   meaning: 'em/anh trai' },
    { word: 'grandmother', meaning: 'bà' },
    { word: 'grandfather', meaning: 'ông' },
    { word: 'uncle',     meaning: 'chú/bác' },
    { word: 'aunt',      meaning: 'cô/dì' },
    { word: 'baby',      meaning: 'em bé' },
    { word: 'family',    meaning: 'gia đình' },
  ],
  school: [
    { word: 'book',     meaning: 'quyển sách' },
    { word: 'pen',      meaning: 'bút mực' },
    { word: 'pencil',   meaning: 'bút chì' },
    { word: 'ruler',    meaning: 'thước kẻ' },
    { word: 'eraser',   meaning: 'cục tẩy' },
    { word: 'teacher',  meaning: 'giáo viên' },
    { word: 'student',  meaning: 'học sinh' },
    { word: 'class',    meaning: 'lớp học' },
    { word: 'desk',     meaning: 'bàn học' },
    { word: 'board',    meaning: 'bảng' },
  ],
};

// ─── App State ────────────────────────────────────
const AppState = {
  words: [],          // [{ word, meaning }]
  mode: 'meaning',   // 'meaning' | 'word' | 'both'
  difficulty: 'medium',
  timeLimit: 60,
  title: '',
  engine: null,
  bubbleGame: null,
  streak: 0,
  missedWords: [],
};

// ─── DOM Elements ─────────────────────────────────
const $ = id => document.getElementById(id);

const SCREENS = {
  dashboard: $('screen-dashboard'),
  game:      $('screen-game'),
  pause:     $('screen-pause'),
  results:   $('screen-results'),
};

// ─── Screen Manager ───────────────────────────────
function showScreen(name) {
  Object.entries(SCREENS).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

// ─── Dashboard Logic ──────────────────────────────
function initDashboard() {
  // Game title live preview
  $('game-title').addEventListener('input', e => {
    const val = e.target.value.trim();
    $('preview-title').textContent = val || 'Bài học của bạn';
  });

  // Add word on button click
  $('btn-add-word').addEventListener('click', addWordFromInputs);

  // Add word on Enter key
  $('input-meaning').addEventListener('keydown', e => {
    if (e.key === 'Enter') addWordFromInputs();
  });
  $('input-word').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('input-meaning').focus();
  });

  // Bulk toggle
  $('btn-bulk-toggle').addEventListener('click', () => {
    $('bulk-area').classList.toggle('hidden');
  });

  // Bulk import
  $('btn-bulk-import').addEventListener('click', () => {
    const raw = $('bulk-input').value.trim();
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
      $('bulk-input').value = '';
      $('bulk-area').classList.add('hidden');
      showToast(`✅ Đã thêm ${added} từ!`);
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

  // Launch
  $('btn-launch').addEventListener('click', launchGame);

  // Settings changes
  $('time-limit').addEventListener('change', e => {
    AppState.timeLimit = parseInt(e.target.value);
  });
  $('difficulty').addEventListener('change', e => {
    AppState.difficulty = e.target.value;
  });
  $('game-mode').addEventListener('change', e => {
    AppState.mode = e.target.value;
  });

  // Render initial empty state
  renderWordList();
}

function addWordFromInputs() {
  const word    = $('input-word').value.trim();
  const meaning = $('input-meaning').value.trim();
  if (!word || !meaning) {
    showToast('⚠️ Nhập cả từ tiếng Anh và nghĩa nhé!', 'warn');
    return;
  }
  if (addWord(word, meaning)) {
    $('input-word').value    = '';
    $('input-meaning').value = '';
    $('input-word').focus();
  } else {
    showToast('⚠️ Từ này đã có trong danh sách rồi!', 'warn');
  }
}

function addWord(word, meaning) {
  // Check duplicate
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

  count.textContent = AppState.words.length;

  if (AppState.words.length === 0) {
    empty.style.display = 'flex';
    // Remove all word items
    list.querySelectorAll('.word-item').forEach(el => el.remove());
    return;
  }

  empty.style.display = 'none';

  // Clear and re-render (simple approach for now)
  list.querySelectorAll('.word-item').forEach(el => el.remove());

  const BUBBLE_COLORS = [
    '#FF6B9D','#7C6FFF','#43E97B','#FFD93D',
    '#FF6348','#00CEC9','#A29BFE','#FD79A8',
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

    div.querySelector('.btn-delete').addEventListener('click', (e) => {
      removeWord(parseFloat(e.currentTarget.dataset.id));
    });

    list.appendChild(div);
  });
}

function updateLaunchButton() {
  const btn  = $('btn-launch');
  const hint = $('launch-hint');
  const count = AppState.words.length;

  if (count < 4) {
    btn.disabled = true;
    hint.textContent = `Thêm ít nhất ${4 - count} từ nữa để bắt đầu`;
  } else {
    btn.disabled = false;
    hint.textContent = `${count} từ sẵn sàng — Nhấn để chiếu lên màn hình!`;
  }
}

// ─── Game Launch ──────────────────────────────────
function launchGame() {
  if (AppState.words.length < 4) return;

  AppState.title      = $('game-title').value.trim() || 'Word Bubble Pop';
  AppState.timeLimit  = parseInt($('time-limit').value);
  AppState.difficulty = $('difficulty').value;
  AppState.mode       = $('game-mode').value;
  AppState.streak     = 0;
  AppState.missedWords = [];

  // Build questions from word list
  const questions = buildQuestions(AppState.words, AppState.mode, AppState.words);

  // Create engine
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

// ─── Engine Event Handlers ───────────────────────
function onGameStart(state) {
  updateHUD(state.score, state.timeLeft, state.lives);
}

function onQuestionNew({ question, round, total }) {
  // Update question display
  const label = AppState.mode === 'word'
    ? 'Nghĩa của từ:'
    : 'Từ tiếng Anh nghĩa là:';

  $('question-label').textContent = label;
  $('question-text').textContent  = question.question;

  // Animate question text
  const qText = $('question-text');
  qText.style.animation = 'none';
  requestAnimationFrame(() => {
    qText.style.animation = 'questionPop 0.4s cubic-bezier(0.34,1.56,0.64,1)';
  });

  // Inject animation if needed
  if (!document.getElementById('q-anim-style')) {
    const style = document.createElement('style');
    style.id = 'q-anim-style';
    style.textContent = `@keyframes questionPop {
      0%   { transform: scale(0.7); opacity: 0; }
      100% { transform: scale(1);   opacity: 1; }
    }`;
    document.head.appendChild(style);
  }

  // Tell renderer about new question
  AppState.bubbleGame.loadQuestion(question);
}

function onAnswerCorrect({ score, timeBonus }) {
  AppState.streak++;

  // HUD score bump
  const scoreEl = $('hud-score');
  scoreEl.textContent = score;
  scoreEl.classList.remove('bump');
  requestAnimationFrame(() => scoreEl.classList.add('bump'));

  AppState.bubbleGame.flashScreen(true);

  // Show streak
  if (AppState.streak >= 3) {
    const streakEl = $('streak-display');
    $('streak-count').textContent = AppState.streak;
    streakEl.classList.remove('hidden');
    clearTimeout(streakEl._hideTimer);
    streakEl._hideTimer = setTimeout(() => streakEl.classList.add('hidden'), 2000);
  }

  // Time bonus popup
  if (timeBonus > 0) showFloatingText(`+${10 + timeBonus}`, 'accent');
}

function onAnswerWrong({ correctAnswer, livesLeft, question }) {
  AppState.streak = 0;
  $('streak-display').classList.add('hidden');

  // Track missed word
  AppState.missedWords.push(question);

  // Update lives display
  updateLives(livesLeft);

  AppState.bubbleGame.flashScreen(false);
  showFloatingText(`✕ ${correctAnswer}`, 'danger');
}

function onTimerTick({ timeLeft }) {
  $('timer-text').textContent = timeLeft;
  updateTimerRing(timeLeft, AppState.timeLimit);

  const timerEl = $('hud-timer');
  if (timeLeft <= 10) {
    timerEl.classList.add('timer-urgent');
    if (timeLeft <= 5) AppState.engine.audio.play('tick');
  }
}

function onGameEnd(summary) {
  setTimeout(() => showResults(summary), 500);
}

// ─── HUD Updates ─────────────────────────────────
function updateHUD(score, timeLeft, lives) {
  $('hud-score').textContent = score;
  $('timer-text').textContent = timeLeft;
  updateTimerRing(timeLeft, AppState.timeLimit);
  updateLives(lives);
}

function updateLives(livesLeft) {
  const lifeEls = $('lives-display').querySelectorAll('.life');
  lifeEls.forEach((el, i) => {
    el.classList.toggle('active', i < livesLeft);
  });
}

function updateTimerRing(timeLeft, total) {
  const circumference = 150.8; // 2 * pi * 24
  const fill = $('timer-ring-fill');
  const ratio = timeLeft / total;
  fill.style.strokeDashoffset = circumference * (1 - ratio);
}

function showFloatingText(text, type) {
  const div = document.createElement('div');
  const colors = { accent: '#43E97B', danger: '#FF4757', warn: '#FFD93D' };
  div.style.cssText = `
    position:fixed;
    left:50%;top:50%;
    transform:translate(-50%,-50%);
    font-family:'Baloo 2',cursive;
    font-size:36px;font-weight:800;
    color:${colors[type] || 'white'};
    pointer-events:none;z-index:300;
    text-shadow:0 2px 20px rgba(0,0,0,0.5);
    animation:floatUp 0.8s ease forwards;
  `;
  div.textContent = text;
  document.body.appendChild(div);

  if (!document.getElementById('float-style')) {
    const style = document.createElement('style');
    style.id = 'float-style';
    style.textContent = `@keyframes floatUp {
      0%   { opacity:1; transform:translate(-50%,-50%); }
      100% { opacity:0; transform:translate(-50%,-120%); }
    }`;
    document.head.appendChild(style);
  }

  setTimeout(() => div.remove(), 800);
}

// ─── Results Screen ───────────────────────────────
function showResults(summary) {
  AppState.bubbleGame.destroy();
  AppState.bubbleGame = null;
  window.removeEventListener('keydown', onKeyDown);

  // Trophy / title based on accuracy
  const { accuracy, score, correctAnswers, totalAnswered, timeUsed } = summary;
  let trophy, title, subtitle;
  if (accuracy >= 90) { trophy = '🏆'; title = 'Xuất Sắc!'; subtitle = 'Học sinh giỏi lắm! 🌟'; }
  else if (accuracy >= 70) { trophy = '🥇'; title = 'Tốt Lắm!'; subtitle = 'Tiếp tục phát huy nhé! 💪'; }
  else if (accuracy >= 50) { trophy = '🥈'; title = 'Cố Lên!'; subtitle = 'Ôn lại rồi chơi tiếp nhé! 📚'; }
  else { trophy = '🌱'; title = 'Cần Ôn Thêm'; subtitle = 'Thực hành thêm là giỏi thôi! 🌟'; }

  $('results-trophy').textContent  = trophy;
  $('results-title').textContent   = title;
  $('results-subtitle').textContent = subtitle;
  $('rs-score').textContent    = score;
  $('rs-correct').textContent  = correctAnswers;
  $('rs-accuracy').textContent = accuracy + '%';
  $('rs-time').textContent     = timeUsed + 's';

  // Missed words
  const missedSection = $('missed-words-section');
  const missedList    = $('missed-list');
  missedList.innerHTML = '';

  if (AppState.missedWords.length > 0) {
    missedSection.style.display = 'block';
    AppState.missedWords.forEach(q => {
      const chip = document.createElement('span');
      chip.className = 'missed-word-chip';
      chip.textContent = `${q.question} → ${q.answer}`;
      missedList.appendChild(chip);
    });
  } else {
    missedSection.style.display = 'none';
  }

  showScreen('results');

  // Confetti for good results
  if (accuracy >= 70) launchConfetti();

  // Buttons
  $('btn-play-again').onclick  = playAgain;
  $('btn-new-game').onclick    = goToDashboard;
  $('btn-share').onclick       = shareResults;
}

// ─── Confetti ─────────────────────────────────────
function launchConfetti() {
  const canvas = $('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 100 }, () => ({
    x:  Math.random() * canvas.width,
    y: -20 - Math.random() * 100,
    r:  4 + Math.random() * 6,
    color: ['#FF6B9D','#7C6FFF','#43E97B','#FFD93D','#FF6348','#00CEC9'][Math.floor(Math.random()*6)],
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
  setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0,0,canvas.width,canvas.height); }, 4000);
}

// ─── Play Again ───────────────────────────────────
function playAgain() {
  showScreen('game');

  AppState.streak      = 0;
  AppState.missedWords = [];

  const questions = buildQuestions(AppState.words, AppState.mode, AppState.words);

  AppState.engine = new GameEngine({
    timeLimit:    AppState.timeLimit,
    lives:        3,
    pointsCorrect: 10,
    pointsWrong:  -2,
    pointsTimeBonus: true,
  });

  AppState.engine.loadQuestions(questions);

  const canvas = $('game-canvas');
  AppState.bubbleGame = new BubbleGame(canvas, AppState.engine);
  AppState.bubbleGame.setup(AppState.difficulty);

  AppState.engine.on('game:start', onGameStart);
  AppState.engine.on('question:new', onQuestionNew);
  AppState.engine.on('answer:correct', onAnswerCorrect);
  AppState.engine.on('answer:wrong', onAnswerWrong);
  AppState.engine.on('timer:tick', onTimerTick);
  AppState.engine.on('game:end', onGameEnd);

  // Reset HUD
  $('hud-timer').classList.remove('timer-urgent');
  $('hud-score').textContent = '0';
  $('streak-display').classList.add('hidden');

  AppState.engine.start();
  window.addEventListener('keydown', onKeyDown);
}

function goToDashboard() {
  if (AppState.bubbleGame) {
    AppState.bubbleGame.destroy();
    AppState.bubbleGame = null;
  }
  window.removeEventListener('keydown', onKeyDown);
  showScreen('dashboard');
}

function shareResults() {
  const score = $('rs-score').textContent;
  const acc   = $('rs-accuracy').textContent;
  const text  = `🎮 GAMO — Word Bubble Pop\n🏆 Điểm: ${score} | Độ chính xác: ${acc}\n🔗 Thử ngay tại: gamo.edu.vn`;
  if (navigator.share) {
    navigator.share({ title: 'GAMO Game Results', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text)
      .then(() => showToast('✅ Đã copy kết quả!'))
      .catch(() => showToast('📋 Chia sẻ kết quả với học sinh nhé!'));
  }
}

// ─── Pause Logic ──────────────────────────────────
$('btn-pause').addEventListener('click', pauseGame);
$('btn-back').addEventListener('click', () => {
  if (AppState.engine) AppState.engine.pause();
  if (confirm('Bạn có muốn thoát game về dashboard không?')) {
    goToDashboard();
    showScreen('dashboard');
  } else {
    AppState.engine?.resume();
  }
});

$('btn-resume').addEventListener('click', resumeGame);
$('btn-quit').addEventListener('click', () => { goToDashboard(); showScreen('dashboard'); });

function pauseGame() {
  if (!AppState.engine || !AppState.engine.state.isRunning) return;
  AppState.engine.pause();
  $('pause-score').textContent = AppState.engine.state.score;
  showScreen('pause');
}

function resumeGame() {
  AppState.engine?.resume();
  showScreen('game');
}

function onKeyDown(e) {
  if (e.code === 'Space') {
    e.preventDefault();
    const gamScreen = SCREENS.game.classList.contains('active');
    const pauseScr  = SCREENS.pause.classList.contains('active');
    if (gamScreen)  pauseGame();
    else if (pauseScr) resumeGame();
  }
  if (e.key.toLowerCase() === 'r' && SCREENS.game.classList.contains('active')) {
    // Quick restart hint
  }
}

// ─── Toast Notifications ──────────────────────────
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  const colors = { success: '#43E97B', error: '#FF4757', warn: '#FFD93D' };
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(100px);
    background:${colors[type] || colors.success};
    color:#0F0F23;padding:10px 20px;border-radius:999px;
    font-weight:700;font-size:14px;font-family:'Nunito',sans-serif;
    z-index:9999;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,0.4);
    transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
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

// ─── Init (exported so main.js can call after imports) ───────────
export function initApp() {
  initDashboard();
  showScreen('dashboard');
  updateLaunchButton();

  // Demo: Auto-load animals template so teacher can see it immediately
  const animals = WORD_TEMPLATES.animals.slice(0, 6);
  animals.forEach(({ word, meaning }) => addWord(word, meaning));
}
