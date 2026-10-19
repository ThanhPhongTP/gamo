/**
 * =========================================================
 * app.js — Sentence Bridge Builder Application Controller
 * =========================================================
 * Connects: Teacher UI ↔ GameEngine ↔ BridgeGame Canvas ↔ @gamo/content
 * Features:
 * - Classroom Team/Turn Management (Đội 1, Đội 2...)
 * - Select which team plays first, turn-by-turn progression
 * - Non-repeating Question Pool (Mỗi đội chơi bộ câu mới, không trùng lặp)
 * - Selectable Question Count per Round (3, 5, 10, Tất cả)
 * - Retry on Wrong Choice without losing bricks
 * - Difficulty Settings (Dễ, Vừa, Khó)
 * - Tournament Podium & Grand Finale when all teams finish
 * - Practice Mode & Complete Reset for testing
 */

import { GameEngine } from '@gamo/engine';
import {
  CURRICULUM_LIBRARY,
  toSentenceBridgeQuestions,
  parseSmartText,
  createLessonPack,
  saveLessonPack,
  getAllLessons,
} from '@gamo/content';
import { BridgeGame } from './BridgeGame.js';

// ─── App State ──────────────────────────────────────────
export const AppState = {
  currentPack: null,
  allPackQuestions: [],        // Toàn bộ câu hỏi của bài học hiện tại
  remainingQuestionPool: [],   // Kho câu CHƯA CHƠI trong bài học
  usedQuestions: [],           // Các câu ĐÃ CHƠI qua các lượt của các đội
  questions: [],               // Các câu cho vòng chơi HIỆN TẠI
  currentQuestionIndex: 0,
  engine: null,
  bridgeGame: null,
  streak: 0,
  maxStreak: 0,
  lives: 3,
  score: 0,
  difficulty: 'medium',        // 'easy' | 'medium' | 'hard'
  questionCountMode: 5,        // 3 | 5 | 10 | 'all'
  timeLimit: 120,
  timerInterval: null,
  timeLeft: 120,

  // ── Team & Tournament Management ──
  isPracticeMode: false,
  teams: [
    { id: 'team_1', name: 'Đội 1', score: 0, accuracy: '0%', stars: '', status: 'pending' },
    { id: 'team_2', name: 'Đội 2', score: 0, accuracy: '0%', stars: '', status: 'pending' },
  ],
  activeTeamId: 'team_1',         // Đội được chọn ra sân ở lượt tiếp theo
  currentPlayingTeamId: 'team_1',  // Đội đang chơi trong hiệp
  selectedNextTeamId: null,       // Đội được chọn trong summary để chơi tiếp
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

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Text-to-Speech Helper ──────────────────────────────
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

// ─── Initialization ─────────────────────────────────────
export function initApp() {
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
    chosenPack = all.find(p => p.id === packId) || CURRICULUM_LIBRARY.find(p => p.id === packId);
  }

  const defaultPack = chosenPack || CURRICULUM_LIBRARY.find(p => p.id === 'pack_sentence_daily') || CURRICULUM_LIBRARY[0];
  AppState.currentPack = defaultPack;

  _renderCurriculumPacks();
  _setupEventListeners();
  _selectPack(defaultPack);
  _renderTeamsManager();
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
      _selectPack(pack);
    });

    container.appendChild(card);
  });
}

function _selectPack(pack) {
  AppState.currentPack = pack;
  _initPoolForPack(pack);
  _updatePackPreview(pack);
}

function _initPoolForPack(pack) {
  if (!pack) return;
  AppState.allPackQuestions = toSentenceBridgeQuestions(pack, {
    difficulty: AppState.difficulty,
  });
  AppState.remainingQuestionPool = shuffleArray([...AppState.allPackQuestions]);
  AppState.usedQuestions = [];
  _updatePoolUI();
}

function _updatePoolUI() {
  const remainingEl = $('pool-remaining-count');
  const usedEl = $('pool-used-count');
  if (remainingEl) remainingEl.textContent = AppState.remainingQuestionPool.length;
  if (usedEl) usedEl.textContent = AppState.usedQuestions.length;
}

function _updatePackPreview(pack) {
  if (!pack) return;
  const previewTitle = $('preview-pack-title');
  const previewCount = $('preview-pack-count');
  const previewList = $('preview-pack-samples');

  if (previewTitle) previewTitle.textContent = pack.title;
  if (previewCount) previewCount.textContent = `${pack.items.length} câu trong kho`;

  if (previewList) {
    previewList.innerHTML = pack.items.slice(0, 5).map(item => `
      <li class="sample-item">
        <span class="sample-en">${item.fullSentence || item.answer}</span>
        <span class="sample-vi">${item.prompt}</span>
      </li>
    `).join('');
  }
}

// ─── Team Tournament Manager ────────────────────────────
function _renderTeamsManager() {
  const container = $('teams-list');
  if (!container) return;

  container.innerHTML = '';

  AppState.teams.forEach((team) => {
    const card = document.createElement('div');
    const isActive = team.id === AppState.activeTeamId;
    const isCompleted = team.status === 'completed';

    card.className = `team-setup-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

    let statusBadge = '⏳ Chưa chơi';
    if (isCompleted) {
      statusBadge = `✅ ${team.score} điểm`;
    } else if (isActive) {
      statusBadge = '🎮 Ra sân lượt này';
    }

    card.innerHTML = `
      <div class="team-card-header">
        <span class="team-card-badge">${statusBadge}</span>
        ${AppState.teams.length > 2 ? `<button class="btn-remove-team" data-id="${team.id}" title="Xóa đội này">✕</button>` : ''}
      </div>
      <input type="text" class="team-name-field" value="${team.name}" placeholder="Tên đội..." data-id="${team.id}" />
      ${!isCompleted ? `
        <button class="btn-select-team" data-id="${team.id}">
          ${isActive ? '★ Đang chọn ra sân' : 'Chọn đội này ra sân'}
        </button>
      ` : `
        <button class="btn-select-team" data-id="${team.id}" style="color: #059669; background: #ECFDF5;">
          🔄 Chơi lại đội này
        </button>
      `}
    `;

    // Rename team handler
    const inputField = card.querySelector('.team-name-field');
    inputField.addEventListener('input', (e) => {
      team.name = e.target.value.trim() || `Đội ${team.id.replace('team_', '')}`;
      _updateLaunchButtonLabel();
    });

    // Select active team button
    const selectBtn = card.querySelector('.btn-select-team');
    selectBtn.addEventListener('click', () => {
      AppState.activeTeamId = team.id;
      _renderTeamsManager();
      _updateLaunchButtonLabel();
    });

    // Remove team button
    const removeBtn = card.querySelector('.btn-remove-team');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        AppState.teams = AppState.teams.filter(t => t.id !== team.id);
        if (AppState.activeTeamId === team.id) {
          AppState.activeTeamId = AppState.teams[0]?.id || null;
        }
        _renderTeamsManager();
        _updateLaunchButtonLabel();
      });
    }

    container.appendChild(card);
  });

  _updateLaunchButtonLabel();
}

function _updateLaunchButtonLabel() {
  const activeTeam = AppState.teams.find(t => t.id === AppState.activeTeamId) || AppState.teams[0];
  const label = $('btn-launch-label');
  if (label) {
    if (AppState.isPracticeMode) {
      label.textContent = '🧪 Bắt Đầu Chơi Thử';
    } else if (activeTeam) {
      label.textContent = `🚀 Bắt Đầu Lượt Của ${activeTeam.name}`;
    } else {
      label.textContent = '🚀 Bắt Đầu Xây Cầu';
    }
  }
}

function _resetTournament() {
  // Reset all teams
  AppState.teams.forEach(t => {
    t.score = 0;
    t.accuracy = '0%';
    t.stars = '';
    t.status = 'pending';
  });
  AppState.activeTeamId = AppState.teams[0]?.id || 'team_1';
  _initPoolForPack(AppState.currentPack);
  _renderTeamsManager();
  _showToast('🔄 Đã đặt lại toàn bộ giải đấu từ đầu!', 2000);
}

// ─── Setup Event Listeners ──────────────────────────────
function _setupEventListeners() {
  // Launch button
  $('btn-launch')?.addEventListener('click', () => startGame());

  // Practice mode toggle
  $('chk-practice-mode')?.addEventListener('change', (e) => {
    AppState.isPracticeMode = e.target.checked;
    _updateLaunchButtonLabel();
    if (AppState.isPracticeMode) {
      _showToast('🧪 Đã bật chế độ chơi thử (không tính điểm xếp hạng)', 2000);
    }
  });

  // Team presets (2, 3, 4 teams)
  document.querySelectorAll('.btn-preset-team').forEach(btn => {
    btn.addEventListener('click', () => {
      const count = parseInt(btn.dataset.teams, 10);
      const newTeams = [];
      for (let i = 1; i <= count; i++) {
        newTeams.push({
          id: `team_${i}`,
          name: `Đội ${i}`,
          score: 0,
          accuracy: '0%',
          stars: '',
          status: 'pending',
        });
      }
      AppState.teams = newTeams;
      AppState.activeTeamId = 'team_1';
      _renderTeamsManager();
      _showToast(`🚩 Đã tạo ${count} đội thi đấu!`, 1500);
    });
  });

  // Add team button
  $('btn-add-team')?.addEventListener('click', () => {
    const newIdx = AppState.teams.length + 1;
    AppState.teams.push({
      id: `team_${Date.now()}`,
      name: `Đội ${newIdx}`,
      score: 0,
      accuracy: '0%',
      stars: '',
      status: 'pending',
    });
    _renderTeamsManager();
  });

  // Reset tournament button
  $('btn-reset-tournament')?.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa điểm và bắt đầu lại giải đấu từ đầu không?')) {
      _resetTournament();
    }
  });

  // Custom lesson modal buttons
  $('btn-open-custom')?.addEventListener('click', () => {
    $('modal-custom')?.classList.add('active');
  });

  $('btn-close-modal')?.addEventListener('click', () => {
    $('modal-custom')?.classList.remove('active');
  });

  $('btn-parse-custom')?.addEventListener('click', _handleParseCustom);

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.difficulty = btn.dataset.diff || 'medium';
      _initPoolForPack(AppState.currentPack);
    });
  });

  // Question Count buttons (Số câu mỗi lượt thi)
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const count = btn.dataset.count;
      AppState.questionCountMode = count === 'all' ? 'all' : parseInt(count, 10);
    });
  });

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
      _renderTeamsManager();
      showScreen('dashboard');
    }
  });

  // Summary buttons
  // 1. Next team button
  $('btn-start-next-team')?.addEventListener('click', () => {
    if (AppState.selectedNextTeamId) {
      AppState.activeTeamId = AppState.selectedNextTeamId;
    }
    startGame({ reuseRound: false });
  });

  // 2. Replay current round
  $('btn-replay-round')?.addEventListener('click', () => {
    startGame({ reuseRound: true });
  });

  // 3. Change lesson
  $('btn-change-lesson')?.addEventListener('click', () => {
    _renderTeamsManager();
    showScreen('dashboard');
  });

  // 4. Finale actions
  $('btn-new-tournament')?.addEventListener('click', () => {
    _resetTournament();
    showScreen('dashboard');
  });

  $('btn-finale-change-lesson')?.addEventListener('click', () => {
    _renderTeamsManager();
    showScreen('dashboard');
  });
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

  $('modal-custom')?.classList.remove('active');
  _selectPack(customPack);
  _showToast(`✅ Đã nạp thành công ${items.length} câu!`, 2500);
}

// ─── Game Flow ──────────────────────────────────────────
export function startGame({ reuseRound = false } = {}) {
  if (!AppState.currentPack) {
    alert('Vui lòng chọn một bài học trước!');
    return;
  }

  // Active team setup
  const currentTeam = AppState.teams.find(t => t.id === AppState.activeTeamId) || AppState.teams[0];
  AppState.currentPlayingTeamId = currentTeam ? currentTeam.id : 'team_1';

  // Time limits per difficulty
  const timeLimits = { easy: 150, medium: 120, hard: 90 };
  AppState.timeLimit = timeLimits[AppState.difficulty] || 120;
  AppState.timeLeft = AppState.timeLimit;

  if (reuseRound) {
    if (!AppState.questions || AppState.questions.length === 0) {
      alert('Không có câu hỏi để chơi lại!');
      return;
    }
  } else {
    // Check if the remaining question pool is empty
    if (!AppState.remainingQuestionPool || AppState.remainingQuestionPool.length === 0) {
      // Auto reset pool
      AppState.remainingQuestionPool = shuffleArray([...AppState.allPackQuestions]);
      AppState.usedQuestions = [];
      _showToast('🔄 Đã hết kho câu! Tự động làm mới kho câu cho vòng mới.', 2500);
    }

    let pickCount = AppState.questionCountMode === 'all'
      ? AppState.remainingQuestionPool.length
      : Math.min(AppState.questionCountMode, AppState.remainingQuestionPool.length);

    if (pickCount === 0) {
      alert('Bài học không có câu hỏi hợp lệ!');
      return;
    }

    // Pick K questions from remaining pool (non-repeating!)
    AppState.remainingQuestionPool = shuffleArray(AppState.remainingQuestionPool);
    AppState.questions = AppState.remainingQuestionPool.splice(0, pickCount);
    AppState.usedQuestions.push(...AppState.questions);
    _updatePoolUI();
  }

  // Reset in-round state
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

  // Update Team name in HUD
  const teamHud = $('hud-team-name');
  if (teamHud) {
    teamHud.textContent = AppState.isPracticeMode ? '🧪 Chơi thử' : (currentTeam ? currentTeam.name : 'Đội 1');
  }

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
      AppState.score += 15 + AppState.streak * 5;
      _updateHUD();
      _showToast('🎉 Xây cầu thành công!', 1500);

      const q = AppState.questions[AppState.currentQuestionIndex];
      if (q) speakText(q.fullSentence);

      setTimeout(() => {
        _nextQuestion();
      }, 1800);
    }
  };

  AppState.bridgeGame.onWrongStep = (wrongChunk) => {
    AppState.lives = Math.max(0, AppState.lives - 1);
    AppState.streak = 0;
    _updateHUD();
    _showToast(`❌ Không phải "${wrongChunk}". Bấm chọn lại nhé!`, 1800);

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

  const promptEl = $('prompt-vietnamese');
  if (promptEl) promptEl.textContent = q.prompt;

  const hintBadge = $('prompt-pattern-hint');
  if (hintBadge) {
    hintBadge.textContent = q.pattern ? `📌 ${q.pattern}` : '';
    hintBadge.style.display = q.pattern ? 'inline-block' : 'none';
  }

  _updateHUD();
  AppState.bridgeGame.loadQuestion(q);
}

function _nextQuestion() {
  AppState.currentQuestionIndex++;
  _loadCurrentQuestion();
}

function _updateHUD() {
  const scoreEl = $('hud-score');
  if (scoreEl) scoreEl.textContent = AppState.score;

  const streakEl = $('hud-streak');
  const streakContainer = $('hud-streak-container');
  if (streakEl) streakEl.textContent = AppState.streak;
  if (streakContainer) {
    streakContainer.classList.toggle('active', AppState.streak >= 2);
  }

  const livesEl = $('hud-lives');
  if (livesEl) {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < AppState.lives ? '❤️' : '🖤';
    }
    livesEl.textContent = hearts;
  }

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
  const accuracy = total > 0 ? Math.round((completed / total) * 100) : 0;

  let stars = '⭐';
  if (AppState.lives >= 3 && accuracy >= 80) stars = '⭐⭐⭐';
  else if (AppState.lives >= 2 || accuracy >= 60) stars = '⭐⭐';

  // Find team that just played
  const currentTeam = AppState.teams.find(t => t.id === AppState.currentPlayingTeamId);

  if (!AppState.isPracticeMode && currentTeam) {
    currentTeam.score = AppState.score;
    currentTeam.accuracy = `${accuracy}% (${completed}/${total})`;
    currentTeam.stars = stars;
    currentTeam.status = 'completed';
  }

  // Check if all teams have completed
  const pendingTeams = AppState.teams.filter(t => t.status === 'pending');
  const allTeamsFinished = !AppState.isPracticeMode && pendingTeams.length === 0;

  if (allTeamsFinished) {
    // 🏆 SHOW TOURNAMENT GRAND FINALE
    $('round-summary-content').style.display = 'none';
    $('tournament-finale-content').style.display = 'block';
    _renderPodium();
  } else {
    // NORMAL ROUND SUMMARY
    $('round-summary-content').style.display = 'block';
    $('tournament-finale-content').style.display = 'none';

    $('summary-team-badge').textContent = AppState.isPracticeMode ? '🧪 Chơi Thử Nghiệm' : `🚩 ${currentTeam ? currentTeam.name : 'Đội 1'}`;
    $('summary-stars').textContent = stars;
    $('summary-title').textContent = reason === 'completed' ? 'Tuyệt Vời! Đã Xây Xong Cầu! 🎉' : 'Cố Gắng Lần Sau Nhé! 💪';
    $('summary-score').textContent = AppState.score;
    $('summary-accuracy').textContent = `${accuracy}% (${completed}/${total} câu)`;
    $('summary-streak').textContent = AppState.maxStreak;

    // Remaining pool notice
    const poolNotice = $('summary-pool-remaining');
    if (poolNotice) poolNotice.textContent = AppState.remainingQuestionPool.length;

    // Next Team Selection box
    const nextTeamBox = $('next-team-box');
    if (AppState.isPracticeMode) {
      if (nextTeamBox) nextTeamBox.style.display = 'none';
    } else if (pendingTeams.length > 0) {
      if (nextTeamBox) nextTeamBox.style.display = 'block';
      AppState.selectedNextTeamId = pendingTeams[0].id;
      _renderNextTeamChips(pendingTeams);
    } else {
      if (nextTeamBox) nextTeamBox.style.display = 'none';
    }

    _renderLeaderboard();
  }

  showScreen('summary');
}

function _renderNextTeamChips(pendingTeams) {
  const container = $('next-team-chips');
  if (!container) return;

  container.innerHTML = '';
  pendingTeams.forEach(team => {
    const chip = document.createElement('button');
    const isSelected = team.id === AppState.selectedNextTeamId;
    chip.className = `team-chip ${isSelected ? 'selected' : ''}`;
    chip.textContent = `🚩 ${team.name}`;

    chip.addEventListener('click', () => {
      AppState.selectedNextTeamId = team.id;
      document.querySelectorAll('.team-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');

      const label = $('btn-start-next-label');
      if (label) label.textContent = `🚀 Bắt Đầu Lượt Của ${team.name} (Câu Không Trùng)`;
    });

    container.appendChild(chip);
  });

  const selectedTeam = AppState.teams.find(t => t.id === AppState.selectedNextTeamId) || pendingTeams[0];
  const label = $('btn-start-next-label');
  if (label && selectedTeam) {
    label.textContent = `🚀 Bắt Đầu Lượt Của ${selectedTeam.name} (Câu Không Trùng)`;
  }
}

function _renderLeaderboard() {
  const cardEl = $('summary-leaderboard-card');
  const listEl = $('summary-leaderboard-list');
  if (!cardEl || !listEl) return;

  const playedTeams = AppState.teams.filter(t => t.status === 'completed');
  if (playedTeams.length === 0) {
    cardEl.style.display = 'none';
    return;
  }

  cardEl.style.display = 'block';
  const sorted = [...playedTeams].sort((a, b) => b.score - a.score);
  const medalIcons = ['🥇', '🥈', '🥉'];

  listEl.innerHTML = sorted.map((t, idx) => `
    <li class="leaderboard-item">
      <span class="leaderboard-team">${medalIcons[idx] || '🔹'} ${t.name}</span>
      <span class="leaderboard-score">${t.score} điểm • ${t.accuracy}</span>
    </li>
  `).join('');
}

function _renderPodium() {
  const podiumContainer = $('podium-container');
  const fullList = $('finale-rankings-list');
  if (!podiumContainer || !fullList) return;

  // Sort all teams descending by score
  const sorted = [...AppState.teams].sort((a, b) => b.score - a.score);

  // Render Podium for Top 3
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  podiumContainer.innerHTML = `
    ${top2 ? `
      <div class="podium-step podium-rank-2">
        <span style="font-size: 1.5rem; margin-bottom: 2px;">🥈</span>
        <div class="podium-team-name">${top2.name}</div>
        <div class="podium-team-score">${top2.score} điểm</div>
        <div class="podium-pillar">2</div>
      </div>
    ` : ''}

    ${top1 ? `
      <div class="podium-step podium-rank-1">
        <span style="font-size: 1.8rem; margin-bottom: 2px;">👑 🥇</span>
        <div class="podium-team-name">${top1.name}</div>
        <div class="podium-team-score">${top1.score} điểm</div>
        <div class="podium-pillar">1</div>
      </div>
    ` : ''}

    ${top3 ? `
      <div class="podium-step podium-rank-3">
        <span style="font-size: 1.3rem; margin-bottom: 2px;">🥉</span>
        <div class="podium-team-name">${top3.name}</div>
        <div class="podium-team-score">${top3.score} điểm</div>
        <div class="podium-pillar">3</div>
      </div>
    ` : ''}
  `;

  // Full rankings
  const medals = ['🥇', '🥈', '🥉'];
  fullList.innerHTML = sorted.map((t, idx) => `
    <li class="leaderboard-item">
      <span class="leaderboard-team">${medals[idx] || `${idx + 1}.`} ${t.name}</span>
      <span class="leaderboard-score">${t.score} điểm • ${t.accuracy}</span>
    </li>
  `).join('');
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
