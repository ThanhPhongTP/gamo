/**
 * =============================================
 * app.js — Word Bubble Pop Application Controller
 * =============================================
 * Glues together: Teacher Studio ↔ @gamo/content ↔ GameEngine ↔ BubbleGame
 */

import { GameEngine, AudioSystem } from '@gamo/engine';
import {
  createLessonPack,
  parseSmartText,
  getCurriculumByGrade,
  getAllLessons,
  saveLessonPack,
  deleteLesson,
  exportLessonsToJSON,
  importLessonsFromJSON,
  toBubblePopQuestions,
} from '@gamo/content';
import { BubbleGame } from './BubbleGame.js';

// ─── App State ────────────────────────────────────
const AppState = {
  activePackId: null,
  title: 'Thế Giới Động Vật',
  words: [],          // [{ word, meaning, id }]
  mode: 'meaning',   // 'meaning' | 'word' | 'both'
  difficulty: 'medium',
  timeLimit: 60,
  selectedGame: 'bubble-pop',
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
    openCurriculumModal();
  });

  $('nav-results')?.addEventListener('click', () => {
    openMyLessonsModal();
  });

  // Modal close buttons
  $('btn-close-curriculum')?.addEventListener('click', closeCurriculumModal);
  $('btn-close-my-lessons')?.addEventListener('click', closeMyLessonsModal);

  // Lesson Save & Manage Buttons
  $('btn-save-lesson')?.addEventListener('click', handleSaveCurrentLesson);
  $('btn-open-my-lessons')?.addEventListener('click', openMyLessonsModal);
  $('btn-export-lessons')?.addEventListener('click', handleExportLessons);
  $('input-import-json')?.addEventListener('change', handleImportLessons);

  // Curriculum Filter Tabs
  document.querySelectorAll('#modal-curriculum .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modal-curriculum .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCurriculumList(btn.dataset.grade || 'all');
    });
  });

  // Game Selector Cards
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const gameId = card.dataset.game;
      if (card.classList.contains('disabled')) {
        showToast('🚀 Trò chơi này đang được tích hợp vào kho GAMO! Dữ liệu bài học của bạn sẽ chơi được ngay khi ra mắt.', 'warn');
        return;
      }
      document.querySelectorAll('.game-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      AppState.selectedGame = gameId;
    });
  });

  // Game title live preview
  $('game-title')?.addEventListener('input', e => {
    const val = e.target.value.trim();
    AppState.title = val || 'Bài học của bạn';
    const preview = $('preview-title');
    if (preview) preview.textContent = AppState.title;
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

  // SMART TEXT IMPORT (Phân tích text tự do từ Word, Excel, Zalo)
  $('btn-bulk-import')?.addEventListener('click', () => {
    const raw = $('bulk-input')?.value.trim() || '';
    if (!raw) {
      showToast('⚠️ Vui lòng dán danh sách từ vựng vào khung trước nhé!', 'warn');
      return;
    }

    const parsed = parseSmartText(raw);
    let added = 0;

    parsed.forEach(item => {
      if (addWord(item.answer, item.prompt)) added++;
    });

    if (added > 0) {
      if ($('bulk-input')) $('bulk-input').value = '';
      $('bulk-area')?.classList.add('hidden');
      showToast(`✅ Đã nhận diện & thêm ${added} từ vựng thông minh!`);
    } else {
      showToast('❌ Không tách được từ. Bạn có thể dán định dạng tự do: apple: quả táo hoặc apple, quả táo', 'error');
    }
  });

  // Quick Template Chips
  document.querySelectorAll('.chip[data-template]').forEach(chip => {
    chip.addEventListener('click', () => {
      const templateMap = {
        animals: 'pack_primary_animals',
        school:  'pack_primary_school',
        food:    'pack_primary_food',
      };
      const packId = templateMap[chip.dataset.template];
      if (packId) {
        applyCurriculumPack(packId);
      }
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
  updateSavedLessonsCount();
}

function setActiveNav(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(id)?.classList.add('active');
}

// ─── Word Management ──────────────────────────────
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
    showToast('⚠️ Tối đa 50 từ trong 1 bài học!', 'warn');
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

// ─── Curriculum Library Modal ─────────────────────
function openCurriculumModal() {
  const modal = $('modal-curriculum');
  if (modal) {
    modal.classList.remove('hidden');
    renderCurriculumList('all');
  }
}

function closeCurriculumModal() {
  $('modal-curriculum')?.classList.add('hidden');
}

function renderCurriculumList(grade = 'all') {
  const container = $('curriculum-list');
  if (!container) return;
  container.innerHTML = '';

  const packs = getCurriculumByGrade(grade);

  packs.forEach(pack => {
    const card = document.createElement('div');
    card.className = 'curriculum-card';

    const gradeLabels = {
      primary: '🎒 Cấp 1',
      secondary: '🏫 Cấp 2',
      high: '🎓 Cấp 3',
    };

    const sampleWords = (pack.items || []).slice(0, 4).map(i => i.answer).join(', ');

    card.innerHTML = `
      <div class="card-top">
        <span class="unit-tag">${gradeLabels[pack.grade] || 'SGK'} • ${escapeHtml(pack.unit || 'Chủ đề')}</span>
        <span class="words-badge">${pack.itemCount || pack.items?.length || 0} từ</span>
      </div>
      <div class="curriculum-title">${escapeHtml(pack.title)}</div>
      <div class="curriculum-desc">${escapeHtml(pack.description || '')}</div>
      <div class="sample-words">Mẫu: ${escapeHtml(sampleWords)}...</div>
      <button class="btn-apply-curriculum">Áp Dụng Vào Bài Học</button>
    `;

    card.querySelector('.btn-apply-curriculum')?.addEventListener('click', () => {
      loadPackIntoCurrentLesson(pack);
      closeCurriculumModal();
      showToast(`🎉 Đã áp dụng bài học "${pack.title}" thành công!`);
    });

    container.appendChild(card);
  });
}

function applyCurriculumPack(packId) {
  const packs = getCurriculumByGrade('all');
  const found = packs.find(p => p.id === packId);
  if (found) {
    loadPackIntoCurrentLesson(found);
    showToast(`🎉 Đã áp dụng "${found.title}"!`);
  }
}

function loadPackIntoCurrentLesson(pack) {
  AppState.activePackId = pack.id;
  AppState.title = pack.title;
  AppState.words = (pack.items || []).map((item, idx) => ({
    id: Date.now() + idx + Math.random(),
    word: item.answer,
    meaning: item.prompt,
  }));

  // Update input title
  if ($('game-title')) $('game-title').value = AppState.title;
  if ($('preview-title')) $('preview-title').textContent = AppState.title;

  renderWordList();
  updateLaunchButton();
}

// ─── My Lessons Modal & Storage ───────────────────
function openMyLessonsModal() {
  const modal = $('modal-my-lessons');
  if (modal) {
    modal.classList.remove('hidden');
    renderMyLessonsList();
  }
}

function closeMyLessonsModal() {
  $('modal-my-lessons')?.classList.add('hidden');
}

function renderMyLessonsList() {
  const container = $('saved-lessons-list');
  if (!container) return;
  container.innerHTML = '';

  const lessons = getAllLessons();

  if (lessons.length === 0) {
    container.innerHTML = `
      <div class="word-list-empty">
        <div class="empty-icon">📁</div>
        <p>Chưa có bài giảng nào được lưu</p>
        <span class="empty-sub">Hãy soạn một bài và bấm "Lưu vào kho bài giảng" để dùng lại sau!</span>
      </div>
    `;
    return;
  }

  lessons.forEach(lesson => {
    const item = document.createElement('div');
    item.className = 'saved-lesson-item';

    const count = lesson.items?.length || 0;
    const dateStr = lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString('vi-VN') : 'Gần đây';

    item.innerHTML = `
      <div class="saved-lesson-meta">
        <span class="saved-lesson-title">${escapeHtml(lesson.title)}</span>
        <span class="saved-lesson-sub">📅 ${dateStr} • ${count} từ vựng</span>
      </div>
      <div class="saved-lesson-actions">
        <button class="btn-load-lesson">Mở Bài Này</button>
        <button class="btn-delete-lesson" title="Xóa bài">🗑️</button>
      </div>
    `;

    item.querySelector('.btn-load-lesson')?.addEventListener('click', () => {
      loadPackIntoCurrentLesson(lesson);
      closeMyLessonsModal();
      showToast(`📂 Đã mở bài giảng "${lesson.title}"!`);
    });

    item.querySelector('.btn-delete-lesson')?.addEventListener('click', () => {
      if (confirm(`Bạn có chắc muốn xóa bài "${lesson.title}" không?`)) {
        deleteLesson(lesson.id);
        renderMyLessonsList();
        updateSavedLessonsCount();
        showToast('🗑️ Đã xóa bài giảng');
      }
    });

    container.appendChild(item);
  });
}

function handleSaveCurrentLesson() {
  if (AppState.words.length === 0) {
    showToast('⚠️ Vui lòng thêm từ vựng trước khi lưu bài học!', 'warn');
    return;
  }

  const title = $('game-title')?.value.trim() || AppState.title || 'Bài học tiếng Anh';

  const pack = createLessonPack({
    id: AppState.activePackId || null,
    title,
    grade: 'primary',
    items: AppState.words.map(w => ({ prompt: w.meaning, answer: w.word })),
  });

  saveLessonPack(pack);
  AppState.activePackId = pack.id;
  updateSavedLessonsCount();
  showToast(`💾 Đã lưu bài giảng "${pack.title}" vào kho thành công!`);
}

function updateSavedLessonsCount() {
  const countEl = $('saved-lessons-count');
  if (countEl) {
    const lessons = getAllLessons();
    countEl.textContent = lessons.length;
  }
}

function handleExportLessons() {
  const jsonStr = exportLessonsToJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gamo_lessons_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 Đã tải file bài giảng JSON về máy!');
}

function handleImportLessons(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const result = importLessonsFromJSON(event.target.result);
    if (result.success) {
      renderMyLessonsList();
      updateSavedLessonsCount();
      showToast(`📥 Đã nhập thành công ${result.count} bài giảng mới!`);
    } else {
      showToast(`❌ Lỗi khi đọc file JSON: ${result.error}`, 'error');
    }
  };
  reader.readAsText(file);
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

  // Tạo Universal Lesson Pack từ dữ liệu hiện tại
  const currentPack = createLessonPack({
    title: AppState.title,
    items: AppState.words.map(w => ({ prompt: w.meaning, answer: w.word })),
  });

  // Sử dụng Content Adapter chuyển đổi dữ liệu sang định dạng câu hỏi của Bubble Pop
  const questions = toBubblePopQuestions(currentPack, { mode: AppState.mode });

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

// ─── Bootstrap Init ───────────────────────────────
export function initApp() {
  initDashboard();
  showScreen('dashboard');

  // Check URL params from GAMO Portal or external link
  const urlParams = new URLSearchParams(window.location.search);
  const packId = urlParams.get('packId');
  const customPackParam = urlParams.get('customPack');

  let chosenPack = null;
  if (customPackParam) {
    try {
      const decoded = decodeURIComponent(escape(atob(customPackParam)));
      chosenPack = JSON.parse(decoded);
      saveLessonPack(chosenPack);
    } catch (e) {
      console.warn('Failed to parse customPack from URL', e);
    }
  } else if (packId) {
    const all = getAllLessons();
    chosenPack = all.find(p => p.id === packId);
  }

  if (chosenPack) {
    loadPackIntoCurrentLesson(chosenPack);
    showToast(`✨ Đã nạp bài học: ${chosenPack.title}`, 'success');
  } else {
    // Nạp mặc định bài học đầu tiên từ Thư viện giáo trình
    const defaultPacks = getCurriculumByGrade('primary');
    if (defaultPacks && defaultPacks[0]) {
      loadPackIntoCurrentLesson(defaultPacks[0]);
    }
  }
}
