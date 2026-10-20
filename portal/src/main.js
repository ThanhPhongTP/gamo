/**
 * ========================================================
 * GAMO Portal — Main Application Logic
 * ========================================================
 * Implements:
 * - Game Catalog & Category Filter
 * - Studio: Preset Picker & Smart Text Parsing
 * - Auto-Detection (Vocab vs Sentence) & Game Recommendation
 * - 1-Click Launch with cross-port parameter transfer
 */

import {
  CURRICULUM_LIBRARY,
  createLessonPack,
  parseSmartText,
  saveLessonPack,
  setActiveLesson,
} from '@gamo/content';

// ─── DOM Elements ───────────────────────────────────────
const $ = id => document.getElementById(id);

const DOM = {
  // Tabs
  tabCatalog: $('tab-catalog'),
  tabStudio: $('tab-studio'),
  viewCatalog: $('view-catalog'),
  viewStudio: $('view-studio'),

  // Catalog
  categoryFilters: $('category-filters'),
  gamesGrid: $('games-grid'),
  selectPackBubble: $('select-pack-bubble'),
  selectPackBridge: $('select-pack-bridge'),
  btnLaunchBubble: $('btn-launch-bubble'),
  btnLaunchBridge: $('btn-launch-bridge'),

  // Studio
  presetChips: $('preset-chips'),
  inputLessonTitle: $('input-lesson-title'),
  inputRawText: $('input-raw-text'),
  btnSampleVocab: $('btn-sample-vocab'),
  btnSampleSentence: $('btn-sample-sentence'),
  btnClearText: $('btn-clear-text'),
  btnExampleToggle: $('btn-example-toggle'),

  // Match Settings Badges
  badgeDiffInfo: $('badge-diff-info'),
  badgePacingInfo: $('badge-pacing-info'),
  badgeTeamInfo: $('badge-team-info'),

  // Game Pick Cards
  cardPickBubble: $('card-pick-bubble'),
  cardPickBridge: $('card-pick-bridge'),

  // Detector Box
  detType: $('det-type'),
  detCount: $('det-count'),
  recIcon: $('rec-icon'),
  recCard: $('recommendation-card'),
  recGameTitle: $('rec-game-title'),
  recGameReason: $('rec-game-reason'),
  btnLaunchSmart: $('btn-launch-smart'),
  btnSmartTitle: $('btn-smart-title'),
  btnSmartSub: $('btn-smart-sub'),

  // Preview
  btnTogglePreview: $('btn-toggle-preview'),
  previewList: $('preview-list'),
  previewCount: $('preview-count'),
};

// ─── Studio State ───────────────────────────────────────
const StudioState = {
  currentPresetId: 'pack_primary_animals',
  detectedType: 'vocab', // 'vocab' | 'sentence'
  recommendedGame: 'bubble-pop', // 'bubble-pop' | 'sentence-bridge'
  targetGame: 'bubble-pop',
  userSelectedGame: false,
  parsedItems: [],
  previewExpanded: true,

  // Universal Classroom Match Settings
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  durationMode: 'standard', // 'fast' | 'standard' | 'extended' | 'all'
  timeLimit: 60,
  questionCount: 5,
  teamCount: 1, // 1 (cá nhân) | 2 | 3 | 4
};

// ─── Samples Data ───────────────────────────────────────
const SAMPLES = {
  vocab: `apple : quả táo
banana : quả chuối
orange : quả cam
watermelon : dưa hấu
grape : quả nho
strawberry : dâu tây
mango : quả xoài
pineapple : quả dứa`,

  sentence: `[I] [like] [reading books] : Tôi thích đọc sách | distractors: likes, read
[She] [is listening] [to music] : Cô ấy đang nghe nhạc | distractors: listens, are
[They] [play football] [after school] : Họ chơi bóng đá sau giờ học | distractors: plays, playing
[My father] [works] [in a hospital] : Bố tôi làm việc trong bệnh viện | distractors: work, working
[Where] [do you] [come from] : Bạn đến từ đâu? | distractors: does, are
[What time] [do you] [get up] : Mấy giờ bạn thức dậy? | distractors: does, getting`,
};

// ─── Initialize ─────────────────────────────────────────
export function initPortal() {
  initTabNavigation();
  initCatalogFilters();
  initCatalogQuickLaunch();
  initStudioPresets();
  initStudioInput();
  initMatchSettings();
  initStudioLaunchers();

  // Load default preset and start on Studio tab
  loadPreset('pack_primary_animals');
  switchTab('studio');
}

// ─── Tab Navigation ─────────────────────────────────────
function initTabNavigation() {
  DOM.tabCatalog?.addEventListener('click', () => switchTab('catalog'));
  DOM.tabStudio?.addEventListener('click', () => switchTab('studio'));
}

function switchTab(target) {
  const isCatalog = target === 'catalog';
  DOM.tabCatalog?.classList.toggle('active', isCatalog);
  DOM.tabStudio?.classList.toggle('active', !isCatalog);
  DOM.viewCatalog?.classList.toggle('active', isCatalog);
  DOM.viewStudio?.classList.toggle('active', !isCatalog);
}

// ─── Catalog Filters ────────────────────────────────────
function initCatalogFilters() {
  const buttons = DOM.categoryFilters?.querySelectorAll('.filter-btn');
  buttons?.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      filterCatalogGames(filter);
    });
  });
}

function filterCatalogGames(filter) {
  const cards = DOM.gamesGrid?.querySelectorAll('.game-card');
  cards?.forEach(card => {
    const cats = (card.dataset.category || '').split(' ');
    if (filter === 'all' || cats.includes(filter)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// ─── Catalog Quick Launch ───────────────────────────────
function initCatalogQuickLaunch() {
  function updateBubbleUrl() {
    const packId = DOM.selectPackBubble?.value || 'pack_primary_animals';
    if (DOM.btnLaunchBubble) {
      DOM.btnLaunchBubble.href = `http://localhost:3000/?packId=${encodeURIComponent(packId)}&autoplay=true&difficulty=medium&timeLimit=60`;
    }
  }

  function updateBridgeUrl() {
    const packId = DOM.selectPackBridge?.value || 'pack_sentence_daily';
    if (DOM.btnLaunchBridge) {
      DOM.btnLaunchBridge.href = `http://localhost:3001/?packId=${encodeURIComponent(packId)}&autoplay=true&difficulty=medium&count=5&teams=2`;
    }
  }

  DOM.selectPackBubble?.addEventListener('change', updateBubbleUrl);
  DOM.selectPackBridge?.addEventListener('change', updateBridgeUrl);

  updateBubbleUrl();
  updateBridgeUrl();
}

// ─── Studio Presets ─────────────────────────────────────
function initStudioPresets() {
  const chips = DOM.presetChips?.querySelectorAll('.preset-chip');
  chips?.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const packId = chip.dataset.pack;
      loadPreset(packId);
    });
  });
}

function loadPreset(packId) {
  StudioState.currentPresetId = packId;
  const pack = CURRICULUM_LIBRARY.find(p => p.id === packId);
  if (!pack) return;

  if (DOM.inputLessonTitle) DOM.inputLessonTitle.value = pack.title;

  // Format pack items to text
  const lines = pack.items.map(item => {
    const answer = item.fullSentence || item.answer || item.word || '';
    const prompt = item.prompt || item.meaning || '';
    const distractors = item.distractors?.length ? ` | distractors: ${item.distractors.join(', ')}` : '';
    return `${answer} : ${prompt}${distractors}`;
  });

  if (DOM.inputRawText) {
    DOM.inputRawText.value = lines.join('\n');
    triggerDetection();
  }
}

// ─── Universal Match Settings ───────────────────────────
function initMatchSettings() {
  // 1. Difficulty buttons
  const diffButtons = document.querySelectorAll('.setting-diff');
  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      StudioState.difficulty = btn.dataset.diff;

      const diffLabels = {
        easy: 'Độ khó dễ, ít bẫy',
        medium: 'Độ khó tiêu chuẩn cho cả lớp',
        hard: 'Thử thách cao, nhiều bẫy nhiễu',
      };
      if (DOM.badgeDiffInfo) DOM.badgeDiffInfo.textContent = diffLabels[StudioState.difficulty] || '';
      updateLaunchButtonSubtext();
    });
  });

  // 2. Duration / Pacing buttons
  const durButtons = document.querySelectorAll('.setting-dur');
  durButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      durButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      StudioState.durationMode = btn.dataset.dur;
      StudioState.timeLimit = parseInt(btn.dataset.time, 10);
      StudioState.questionCount = btn.dataset.count === 'all' ? 'all' : parseInt(btn.dataset.count, 10);

      const pacingLabels = {
        fast: '⚡ 30s / 3 câu khởi động',
        standard: '⏱️ 60s / 5 câu chuẩn tiết học',
        extended: '🎯 90s / 10 câu rèn luyện sâu',
        all: '🏆 120s / Toàn bộ bài học',
      };
      if (DOM.badgePacingInfo) DOM.badgePacingInfo.textContent = pacingLabels[StudioState.durationMode] || '';
      updateLaunchButtonSubtext();
    });
  });

  // 3. Teams buttons
  const teamButtons = document.querySelectorAll('.setting-team');
  teamButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      teamButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      StudioState.teamCount = parseInt(btn.dataset.teams, 10);
      const teamLabels = {
        1: 'Cả lớp chơi chung / cá nhân',
        2: 'Chia 2 đội thi đấu so điểm',
        3: 'Chia 3 đội thi đấu lần lượt',
        4: 'Chia 4 đội thi đấu giải đấu',
      };
      if (DOM.badgeTeamInfo) DOM.badgeTeamInfo.textContent = teamLabels[StudioState.teamCount] || '';
      updateLaunchButtonSubtext();
    });
  });

  // 4. Game Selector Cards
  const gameCards = document.querySelectorAll('.game-pick-card');
  gameCards.forEach(card => {
    card.addEventListener('click', () => {
      gameCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      StudioState.targetGame = card.dataset.targetGame;
      StudioState.userSelectedGame = true;
      updateLaunchButtonSubtext();
    });
  });
}

function updateLaunchButtonSubtext() {
  const isSentence = StudioState.targetGame === 'sentence-bridge';
  const gameName = isSentence ? 'Sentence Bridge Builder' : 'Word Bubble Pop';

  const diffLabels = { easy: '🟢 Dễ', medium: '🟡 Vừa', hard: '🔴 Thử Thách' };
  const durLabels = { fast: '⚡ 30s (3 câu)', standard: '⏱️ 60s (5 câu)', extended: '🎯 90s (10 câu)', all: '🏆 120s (Tất cả)' };
  const teamLabels = { 1: '👤 Cá nhân', 2: '🚩 2 Đội', 3: '🚩 3 Đội', 4: '🚩 4 Đội' };

  if (DOM.btnSmartTitle) {
    DOM.btnSmartTitle.textContent = `Bắt Đầu Chơi Trên ${gameName}`;
  }

  if (DOM.btnSmartSub) {
    DOM.btnSmartSub.textContent = `Vào thẳng sàn đấu: ${diffLabels[StudioState.difficulty] || 'Vừa'} • ${durLabels[StudioState.durationMode] || '60s'} • ${teamLabels[StudioState.teamCount] || 'Cá nhân'}`;
  }

  if (DOM.btnLaunchSmart) {
    DOM.btnLaunchSmart.classList.toggle('sentence-mode', isSentence);
  }

  // Synchronize visual state of game pick cards
  document.querySelectorAll('.game-pick-card').forEach(card => {
    const isThisCard = card.dataset.targetGame === StudioState.targetGame;
    card.classList.toggle('active', isThisCard);
    if (isThisCard && isSentence) {
      card.classList.add('sentence-mode');
    } else {
      card.classList.remove('sentence-mode');
    }
  });
}

// ─── Studio Input & Smart Detector ──────────────────────
function initStudioInput() {
  DOM.inputRawText?.addEventListener('input', () => {
    StudioState.currentPresetId = null; // User typed custom text
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection();
  });

  DOM.inputLessonTitle?.addEventListener('input', () => {
    StudioState.currentPresetId = null;
  });

  DOM.btnSampleVocab?.addEventListener('click', () => {
    if (DOM.inputLessonTitle) DOM.inputLessonTitle.value = 'Từ Vựng: Trái Cây & Hoa Quả (Fruits)';
    if (DOM.inputRawText) DOM.inputRawText.value = SAMPLES.vocab;
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection();
  });

  DOM.btnSampleSentence?.addEventListener('click', () => {
    if (DOM.inputLessonTitle) DOM.inputLessonTitle.value = 'Mẫu Câu: Các Hoạt Động Hằng Ngày';
    if (DOM.inputRawText) DOM.inputRawText.value = SAMPLES.sentence;
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection();
  });

  DOM.btnClearText?.addEventListener('click', () => {
    if (DOM.inputRawText) DOM.inputRawText.value = '';
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection();
  });

  DOM.btnExampleToggle?.addEventListener('click', () => {
    alert(
      "Định dạng nhập liệu thông minh:\n\n" +
      "1. Từ vựng:\n   cat : con mèo\n   dog : con chó\n\n" +
      "2. Mẫu câu (tùy chọn chia khối gạch với ngoặc []):\n   [She] [is reading] [a book] : Cô ấy đang đọc sách\n\n" +
      "3. Thêm phương án gây nhiễu:\n   cat : con mèo | distractors: dog, bird\n\n" +
      "Hệ thống sẽ tự động nhận diện từ vựng hay mẫu câu để khuyên dùng game phù hợp!"
    );
  });

  DOM.btnTogglePreview?.addEventListener('click', () => {
    StudioState.previewExpanded = !StudioState.previewExpanded;
    if (DOM.previewList) {
      DOM.previewList.style.display = StudioState.previewExpanded ? 'flex' : 'none';
    }
  });
}

/**
 * Real-time Auto-Detection Logic
 */
function triggerDetection() {
  const rawText = DOM.inputRawText?.value || '';
  const parsed = parseSmartText(rawText);
  StudioState.parsedItems = parsed;

  const count = parsed.length;
  if (DOM.detCount) DOM.detCount.textContent = `${count} ${count > 1 ? 'mục' : 'mục'}`;
  if (DOM.previewCount) DOM.previewCount.textContent = count;

  // Analyze structure to detect Vocab vs Sentence
  let sentenceScore = 0;
  let vocabScore = 0;

  parsed.forEach(item => {
    const text = (item.fullSentence || item.answer || '').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Indicators of sentences:
    // 1. Bracket chunks syntax
    if (item.chunks && item.chunks.length >= 3) sentenceScore += 2;
    // 2. Contains 3 or more words
    if (wordCount >= 3) sentenceScore += 2;
    // 3. Has question mark or period
    if (/[?!]$/.test(text)) sentenceScore += 1;
    // 4. Short single or double words -> Vocab
    if (wordCount <= 2) vocabScore += 1;
  });

  const isSentence = sentenceScore > vocabScore;
  StudioState.detectedType = isSentence ? 'sentence' : 'vocab';
  StudioState.recommendedGame = isSentence ? 'sentence-bridge' : 'bubble-pop';

  if (!StudioState.userSelectedGame) {
    StudioState.targetGame = StudioState.recommendedGame;
  }

  renderDetectorUI(isSentence, count);
  renderPreviewList(parsed);
  updateLaunchButtonSubtext();
}

function renderDetectorUI(isSentence, count) {
  if (isSentence) {
    if (DOM.detType) DOM.detType.textContent = '🌉 Mẫu Câu & Cú Pháp (Sentence)';
    if (DOM.recIcon) DOM.recIcon.textContent = '🐸';
    if (DOM.recCard) DOM.recCard.classList.add('sentence-mode');
    if (DOM.recGameTitle) DOM.recGameTitle.textContent = 'Sentence Bridge Builder';
    if (DOM.recGameReason) {
      DOM.recGameReason.textContent =
        'Nội dung gồm các mẫu câu & ngữ pháp hoàn chỉnh ➔ Hoàn hảo cho game Xây Cầu Đấu Đội rèn luyện cấu trúc ngữ pháp!';
    }
  } else {
    if (DOM.detType) DOM.detType.textContent = '🔤 Từ Vựng (Vocabulary)';
    if (DOM.recIcon) DOM.recIcon.textContent = '🫧';
    if (DOM.recCard) DOM.recCard.classList.remove('sentence-mode');
    if (DOM.recGameTitle) DOM.recGameTitle.textContent = 'Word Bubble Pop';
    if (DOM.recGameReason) {
      DOM.recGameReason.textContent =
        'Nội dung gồm các từ vựng súc tích ➔ Hoàn hảo cho game Bắn Bóng Nước rèn luyện phản xạ nhanh và ghi nhớ từ!';
    }
  }
}

function renderPreviewList(items) {
  if (!DOM.previewList) return;
  if (!items || items.length === 0) {
    DOM.previewList.innerHTML = `<div style="color: #64748b; font-size: 13px; padding: 8px;">Chưa có nội dung hợp lệ nào được phân tích. Hãy nhập theo mẫu từ : nghĩa.</div>`;
    return;
  }

  DOM.previewList.innerHTML = items
    .slice(0, 8)
    .map((item, idx) => {
      const chunksTag = item.chunks && item.chunks.length > 1
        ? `<span class="chunks-badge">${item.chunks.length} khối: ${escapeHtml(item.chunks.join(' | '))}</span>`
        : '';

      return `
        <div class="preview-item">
          <div>
            <span style="color: #64748b; margin-right: 6px;">#${idx + 1}</span>
            <span class="answer">${escapeHtml(item.fullSentence || item.answer || '')}</span>
            ${chunksTag}
          </div>
          <div class="prompt">${escapeHtml(item.prompt || '')}</div>
        </div>
      `;
    })
    .join('');

  if (items.length > 8) {
    DOM.previewList.innerHTML += `<div style="color: #64748b; font-size: 12px; text-align: center; padding: 4px;">... và ${items.length - 8} mục nữa</div>`;
  }
}

// ─── Launchers & Cross-Port Hand-off ────────────────────
function initStudioLaunchers() {
  DOM.btnLaunchSmart?.addEventListener('click', () => {
    launchGame(StudioState.targetGame);
  });
}

function launchGame(gameId) {
  const targetId = gameId || StudioState.targetGame || StudioState.recommendedGame;
  const title = (DOM.inputLessonTitle?.value || 'Bài Học Tự Tạo').trim();
  const items = StudioState.parsedItems;

  if (!items || items.length === 0) {
    alert('Vui lòng nhập hoặc chọn ít nhất 1 từ vựng/mẫu câu trước khi bắt đầu chơi!');
    return;
  }

  // Create standardized LessonPack
  const pack = createLessonPack({
    id: StudioState.currentPresetId || `custom_${Date.now()}`,
    title,
    type: StudioState.detectedType,
    items,
  });

  // Save to shared localStorage (accessible if on same domain/origin)
  saveLessonPack(pack);
  setActiveLesson(pack);

  // Determine target game URL
  const baseUrl = targetId === 'sentence-bridge' ? 'http://localhost:3001' : 'http://localhost:3000';
  const params = new URLSearchParams();

  if (StudioState.currentPresetId) {
    // Standard preset by ID
    params.set('packId', StudioState.currentPresetId);
  } else {
    // Custom teacher input: pass encoded JSON payload for seamless cross-port transfer
    const jsonStr = JSON.stringify(pack);
    const b64 = btoa(encodeURIComponent(jsonStr));
    params.set('customPack', b64);
  }

  // Forward universal match setup parameters for instant autoplay
  params.set('autoplay', 'true');
  params.set('difficulty', StudioState.difficulty);
  params.set('timeLimit', String(StudioState.timeLimit));
  params.set('count', String(StudioState.questionCount));
  params.set('teams', String(StudioState.teamCount));

  const launchUrl = `${baseUrl}/?${params.toString()}`;
  window.open(launchUrl, '_blank');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Auto Bootstrap ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', initPortal);
