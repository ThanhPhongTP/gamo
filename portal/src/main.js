/**
 * ========================================================
 * GAMO Portal — Main Application Logic
 * ========================================================
 * Features:
 * - 3-View Architecture: Arcade (Homepage), Curriculum Vault, 3-Step Studio
 * - Real-time Game-First Quick Launchers with SGK Packs
 * - Dynamic Curriculum SGK Library Renderer with 1-Click Launch
 * - Universal 3-Step Setup Studio: Presets, 2-Column Table, Auto-Clean Text
 * - Smart AI-style Detector & Auto Game Recommendation
 * - Cross-Port Hand-off (Localhost & Production Deployments)
 */

import {
  CURRICULUM_LIBRARY,
  createLessonPack,
  parseSmartText,
  saveLessonPack,
  setActiveLesson,
} from '@gamo/content';

// ─── DOM Helper & Cache ─────────────────────────────────
const $ = id => document.getElementById(id);

const DOM = {
  // Navigation Tabs & Views
  tabArcade: $('tab-arcade'),
  tabCurriculum: $('tab-curriculum'),
  tabStudio: $('tab-studio'),
  viewArcade: $('view-arcade'),
  viewCurriculum: $('view-curriculum'),
  viewStudio: $('view-studio'),
  btnQuickCreate: $('btn-quick-create'),
  btnBackHome: $('btn-back-home'),
  btnGotoCurriculum: $('btn-goto-curriculum'),

  // Hero Actions
  btnHeroPlaySample: $('btn-hero-play-sample'),
  btnHeroCreateGame: $('btn-hero-create-game'),
  arcadeSection: $('arcade-cabinet-section'),

  // Arcade Catalog
  categoryFilters: $('category-filters'),
  gamesGrid: $('games-grid'),
  selectPackBubble: $('select-pack-bubble'),
  selectPackBridge: $('select-pack-bridge'),
  btnLaunchBubble: $('btn-launch-bubble'),
  btnLaunchBridge: $('btn-launch-bridge'),

  // Curriculum Vault
  curriculumCardsGrid: $('curriculum-cards-grid'),
  curriculumFilterTabs: $('curriculum-filter-tabs'),

  // Studio Presets & Inputs
  presetChips: $('preset-chips'),
  inputLessonTitle: $('input-lesson-title'),
  inputRawText: $('input-raw-text'),
  btnSampleVocab: $('btn-sample-vocab'),
  btnSampleSentence: $('btn-sample-sentence'),
  btnClearText: $('btn-clear-text'),
  btnExampleToggle: $('btn-example-toggle'),

  // Table Builder
  tabModeTable: $('tab-mode-table'),
  tabModeText: $('tab-mode-text'),
  containerModeTable: $('container-mode-table'),
  containerModeText: $('container-mode-text'),
  builderTableBody: $('builder-table-body'),
  btnAddTableRow: $('btn-add-table-row'),

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

  // Preview Drawer
  btnTogglePreview: $('btn-toggle-preview'),
  previewList: $('preview-list'),
  previewCount: $('preview-count'),
};

// ─── Application State ──────────────────────────────────
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

// ─── Sample Fallback Data ───────────────────────────────
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

// ─── Application Bootstrap ──────────────────────────────
export function initPortal() {
  initTabNavigation();
  initHeroActions();
  initArcadeFilters();
  initArcadeQuickLaunch();
  initArcadeSetupButtons();
  initCurriculumVault();
  initStudioPresets();
  initStudioInput();
  initMatchSettings();
  initStudioLaunchers();

  // Load default preset
  loadPreset('pack_primary_animals');

  // Start on Arcade View for maximum WOW & game-first experience
  switchTab('arcade');
}

// ─── 1. Navigation & View Switching ─────────────────────
function initTabNavigation() {
  DOM.tabArcade?.addEventListener('click', () => switchTab('arcade'));
  DOM.tabCurriculum?.addEventListener('click', () => switchTab('curriculum'));
  DOM.tabStudio?.addEventListener('click', () => switchTab('studio'));

  DOM.btnQuickCreate?.addEventListener('click', () => {
    switchTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  DOM.btnBackHome?.addEventListener('click', () => {
    switchTab('arcade');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  DOM.btnGotoCurriculum?.addEventListener('click', () => {
    switchTab('curriculum');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function switchTab(target) {
  // Update nav tabs
  DOM.tabArcade?.classList.toggle('active', target === 'arcade');
  DOM.tabCurriculum?.classList.toggle('active', target === 'curriculum');
  DOM.tabStudio?.classList.toggle('active', target === 'studio');

  // Update views
  DOM.viewArcade?.classList.toggle('active', target === 'arcade');
  DOM.viewCurriculum?.classList.toggle('active', target === 'curriculum');
  DOM.viewStudio?.classList.toggle('active', target === 'studio');
}

// ─── 2. Hero Action Buttons ─────────────────────────────
function initHeroActions() {
  DOM.btnHeroPlaySample?.addEventListener('click', () => {
    if (DOM.arcadeSection) {
      DOM.arcadeSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  DOM.btnHeroCreateGame?.addEventListener('click', () => {
    switchTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── 3. Arcade Catalog & Category Filter ────────────────
function initArcadeFilters() {
  const buttons = DOM.categoryFilters?.querySelectorAll('.filter-btn');
  buttons?.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      filterArcadeGames(filter);
    });
  });
}

function filterArcadeGames(filter) {
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

// ─── 4. Environment Game URL Resolver ───────────────────
function getGameBaseUrl(gameId) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return gameId === 'sentence-bridge' ? 'http://localhost:3001' : 'http://localhost:3000';
  }
  return `/games/${gameId}`;
}

// ─── 5. Arcade Quick Launch In Cards ────────────────────
function initArcadeQuickLaunch() {
  function updateBubbleUrl() {
    const packId = DOM.selectPackBubble?.value || 'pack_primary_animals';
    if (DOM.btnLaunchBubble) {
      DOM.btnLaunchBubble.href = `${getGameBaseUrl('word-bubble-pop')}/?packId=${encodeURIComponent(packId)}&autoplay=true&difficulty=medium&timeLimit=60`;
    }
  }

  function updateBridgeUrl() {
    const packId = DOM.selectPackBridge?.value || 'pack_sentence_daily';
    if (DOM.btnLaunchBridge) {
      DOM.btnLaunchBridge.href = `${getGameBaseUrl('sentence-bridge')}/?packId=${encodeURIComponent(packId)}&autoplay=true&difficulty=medium&count=5&teams=2`;
    }
  }

  DOM.selectPackBubble?.addEventListener('change', updateBubbleUrl);
  DOM.selectPackBridge?.addEventListener('change', updateBridgeUrl);

  updateBubbleUrl();
  updateBridgeUrl();
}

function initArcadeSetupButtons() {
  document.querySelectorAll('.btn-setup-for-game').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetGame = btn.dataset.targetGame;
      switchTab('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Automatically select this target game
      StudioState.targetGame = targetGame;
      StudioState.userSelectedGame = true;

      if (targetGame === 'bubble-pop') {
        loadPreset('pack_primary_animals');
      } else if (targetGame === 'sentence-bridge') {
        loadPreset('pack_sentence_daily');
      }

      updateLaunchButtonSubtext();
    });
  });
}

// ─── 6. Curriculum SGK Vault ────────────────────────────
function initCurriculumVault() {
  renderCurriculumCards('all');

  const filterBtns = DOM.curriculumFilterTabs?.querySelectorAll('.filter-btn');
  filterBtns?.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const grade = btn.dataset.grade;
      renderCurriculumCards(grade);
    });
  });
}

function renderCurriculumCards(filterGrade = 'all') {
  if (!DOM.curriculumCardsGrid) return;

  const packs = CURRICULUM_LIBRARY.filter(pack => {
    if (filterGrade === 'all') return true;
    return pack.grade === filterGrade;
  });

  DOM.curriculumCardsGrid.innerHTML = packs.map(pack => {
    const isVocab = pack.type === 'vocab';
    const sampleItems = pack.items.slice(0, 4).map(it => it.fullSentence || it.answer || it.word).join(', ');
    const countText = `${pack.items.length} ${isVocab ? 'từ' : 'câu'}`;

    return `
      <article class="curr-pack-card" data-pack-id="${pack.id}">
        <div class="curr-card-header">
          <span class="curr-unit-badge ${isVocab ? 'vocab' : 'sentence'}">
            ${isVocab ? '🔤 Từ Vựng' : '🌉 Mẫu Câu'} • ${pack.grade === 'primary' ? 'Tiểu Học' : 'THCS'}
          </span>
          <span style="font-size: 12px; font-weight: 700; color: #64748B;">${countText}</span>
        </div>
        <h3 class="curr-title">${escapeHtml(pack.title)}</h3>
        <p class="curr-desc">${escapeHtml(pack.description || 'Bài học tiếng Anh chuẩn hóa theo khung chương trình')}</p>
        
        <div class="curr-items-sample">
          <strong>Ví dụ:</strong> ${escapeHtml(sampleItems)}...
        </div>

        <div class="curr-actions-row">
          <a href="${getGameBaseUrl('word-bubble-pop')}/?packId=${encodeURIComponent(pack.id)}&autoplay=true&difficulty=medium" target="_blank" class="btn-curr-play bubble">
            <span>🫧 Chơi Bắn Bóng</span>
          </a>
          <a href="${getGameBaseUrl('sentence-bridge')}/?packId=${encodeURIComponent(pack.id)}&autoplay=true&difficulty=medium&teams=2" target="_blank" class="btn-curr-play bridge">
            <span>🐸 Chơi Xây Cầu</span>
          </a>
        </div>
      </article>
    `;
  }).join('');
}

// ─── 7. Studio Presets ──────────────────────────────────
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
    triggerDetection({ syncToTable: true });
  }
}

// ─── 8. Universal Match Settings ────────────────────────
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

// ─── 9. Studio Input, Table Builder & Smart Detector ────
function initStudioInput() {
  // 1. Input Mode Switcher (Table vs Raw Text)
  DOM.tabModeTable?.addEventListener('click', () => switchInputMode('table'));
  DOM.tabModeText?.addEventListener('click', () => switchInputMode('text'));

  // 2. Table Builder Events
  DOM.btnAddTableRow?.addEventListener('click', () => {
    const tr = addTableRow('', '', (DOM.builderTableBody?.children.length || 0) + 1);
    tr?.querySelector('.builder-en')?.focus();
  });

  DOM.builderTableBody?.addEventListener('input', (e) => {
    if (e.target.classList.contains('builder-en') || e.target.classList.contains('builder-vi')) {
      syncTableToRawText();
    }
  });

  DOM.builderTableBody?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tr = addTableRow('', '', (DOM.builderTableBody?.children.length || 0) + 1);
      tr?.querySelector('.builder-en')?.focus();
      syncTableToRawText();
    }
  });

  DOM.builderTableBody?.addEventListener('click', (e) => {
    const delBtn = e.target.closest('.btn-del-row');
    if (delBtn) {
      const row = delBtn.closest('tr');
      row?.remove();
      reindexTableRows();
      if (!DOM.builderTableBody?.children.length) {
        addTableRow('', '', 1);
      }
      syncTableToRawText();
    }
  });

  // 3. Raw Textarea Input & Sample buttons
  DOM.inputRawText?.addEventListener('input', () => {
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection({ syncToTable: true });
  });

  DOM.inputLessonTitle?.addEventListener('input', () => {
    StudioState.currentPresetId = null;
  });

  DOM.btnSampleVocab?.addEventListener('click', () => {
    if (DOM.inputLessonTitle) DOM.inputLessonTitle.value = 'Từ Vựng: Trái Cây & Hoa Quả (Fruits)';
    if (DOM.inputRawText) DOM.inputRawText.value = SAMPLES.vocab;
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection({ syncToTable: true });
  });

  DOM.btnSampleSentence?.addEventListener('click', () => {
    if (DOM.inputLessonTitle) DOM.inputLessonTitle.value = 'Mẫu Câu: Các Hoạt Động Hằng Ngày';
    if (DOM.inputRawText) DOM.inputRawText.value = SAMPLES.sentence;
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection({ syncToTable: true });
  });

  DOM.btnClearText?.addEventListener('click', () => {
    if (DOM.inputRawText) DOM.inputRawText.value = '';
    StudioState.currentPresetId = null;
    DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
    triggerDetection({ syncToTable: true });
  });

  DOM.btnExampleToggle?.addEventListener('click', () => {
    alert(
      "💡 HỆ THỐNG TỰ LÀM SẠCH VĂN BẢN (AUTO CLEAN):\n\n" +
      "Bạn có thể dán bất kỳ văn bản nào từ Zalo, Word hay Excel:\n" +
      "• 1. Apple: quả táo (tự bỏ số thứ tự)\n" +
      "• Banana - quả chuối\n" +
      "• Orange = quả cam\n" +
      "• Cat -> con mèo (tự nhận diện mũi tên)\n" +
      "• Dog (con chó) (tự nhận diện ngoặc đơn)\n" +
      "• [She] [is reading] [a book] : Cô ấy đang đọc sách\n\n" +
      "Hệ thống sẽ tự động làm sạch và điền đầy đủ vào Bảng Nhập Liệu!"
    );
  });

  DOM.btnTogglePreview?.addEventListener('click', () => {
    StudioState.previewExpanded = !StudioState.previewExpanded;
    if (DOM.previewList) {
      DOM.previewList.style.display = StudioState.previewExpanded ? 'flex' : 'none';
    }
  });
}

function switchInputMode(mode) {
  const isTable = mode === 'table';
  DOM.tabModeTable?.classList.toggle('active', isTable);
  DOM.tabModeText?.classList.toggle('active', !isTable);
  if (DOM.containerModeTable) DOM.containerModeTable.style.display = isTable ? 'flex' : 'none';
  if (DOM.containerModeText) DOM.containerModeText.style.display = !isTable ? 'flex' : 'none';
}

function addTableRow(en = '', vi = '', index = 1) {
  if (!DOM.builderTableBody) return null;
  const tr = document.createElement('tr');
  tr.dataset.index = index;
  tr.innerHTML = `
    <td class="builder-idx">${index}</td>
    <td>
      <input type="text" class="builder-input builder-en" value="${escapeHtml(en)}" placeholder="VD: apple" />
    </td>
    <td>
      <input type="text" class="builder-input builder-vi" value="${escapeHtml(vi)}" placeholder="VD: quả táo" />
    </td>
    <td style="text-align: center;">
      <button type="button" class="btn-del-row" title="Xóa dòng này">🗑️</button>
    </td>
  `;
  DOM.builderTableBody.appendChild(tr);
  return tr;
}

function reindexTableRows() {
  if (!DOM.builderTableBody) return;
  DOM.builderTableBody.querySelectorAll('tr').forEach((tr, idx) => {
    const idxCell = tr.querySelector('.builder-idx');
    if (idxCell) idxCell.textContent = idx + 1;
  });
}

function renderTableFromParsed(items) {
  if (!DOM.builderTableBody) return;
  DOM.builderTableBody.innerHTML = '';

  const list = items && items.length > 0 ? items : [{ fullSentence: '', prompt: '' }];
  list.forEach((item, idx) => {
    const en = item.fullSentence || item.answer || item.word || '';
    const vi = item.prompt || item.meaning || '';
    addTableRow(en, vi, idx + 1);
  });
}

function syncTableToRawText() {
  if (!DOM.builderTableBody) return;
  const rows = DOM.builderTableBody.querySelectorAll('tr');
  const lines = [];

  rows.forEach(tr => {
    const en = tr.querySelector('.builder-en')?.value.trim() || '';
    const vi = tr.querySelector('.builder-vi')?.value.trim() || '';
    if (en || vi) {
      lines.push(`${en} : ${vi}`);
    }
  });

  if (DOM.inputRawText) {
    DOM.inputRawText.value = lines.join('\n');
  }
  StudioState.currentPresetId = null;
  DOM.presetChips?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  triggerDetection({ syncToTable: false });
}

function triggerDetection(options = { syncToTable: true }) {
  const rawText = DOM.inputRawText?.value || '';
  const parsed = parseSmartText(rawText);
  StudioState.parsedItems = parsed;

  const count = parsed.length;
  if (DOM.detCount) DOM.detCount.textContent = `${count} ${count > 1 ? 'mục' : 'mục'}`;
  if (DOM.previewCount) DOM.previewCount.textContent = count;

  if (options.syncToTable) {
    renderTableFromParsed(parsed);
  }

  // Analyze structure to detect Vocab vs Sentence
  let sentenceScore = 0;
  let vocabScore = 0;

  parsed.forEach(item => {
    const text = (item.fullSentence || item.answer || '').trim();
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (item.chunks && item.chunks.length >= 3) sentenceScore += 2;
    if (wordCount >= 3) sentenceScore += 2;
    if (/[?!]$/.test(text)) sentenceScore += 1;
    if (wordCount <= 2) vocabScore += 1;
  });

  const isSentence = sentenceScore > vocabScore;
  StudioState.detectedType = isSentence ? 'sentence' : 'vocab';
  StudioState.recommendedGame = isSentence ? 'sentence-bridge' : 'bubble-pop';

  if (!StudioState.userSelectedGame) {
    StudioState.targetGame = StudioState.recommendedGame;
  }

  renderDetectorUI(isSentence);
  renderPreviewList(parsed);
  updateLaunchButtonSubtext();
}

function renderDetectorUI(isSentence) {
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
        ? `<span class="chunks-badge">${item.chunks.length} khối</span>`
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

// ─── 10. Launchers & Cross-Port Hand-off ────────────────
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

  const pack = createLessonPack({
    id: StudioState.currentPresetId || `custom_${Date.now()}`,
    title,
    type: StudioState.detectedType,
    items,
  });

  saveLessonPack(pack);
  setActiveLesson(pack);

  const baseUrl = getGameBaseUrl(targetId);
  const params = new URLSearchParams();

  if (StudioState.currentPresetId) {
    params.set('packId', StudioState.currentPresetId);
  } else {
    const jsonStr = JSON.stringify(pack);
    const b64 = btoa(encodeURIComponent(jsonStr));
    params.set('customPack', b64);
  }

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
