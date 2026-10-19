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
  btnForceBubble: $('btn-force-bubble'),
  btnForceBridge: $('btn-force-bridge'),

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
  parsedItems: [],
  previewExpanded: true,
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
  initStudioLaunchers();

  // Load default preset
  loadPreset('pack_primary_animals');
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
      DOM.btnLaunchBubble.href = `http://localhost:3000/?packId=${packId}`;
    }
  }

  function updateBridgeUrl() {
    const packId = DOM.selectPackBridge?.value || 'pack_sentence_daily';
    if (DOM.btnLaunchBridge) {
      DOM.btnLaunchBridge.href = `http://localhost:3001/?packId=${packId}`;
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

  renderDetectorUI(isSentence, count);
  renderPreviewList(parsed);
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
    if (DOM.btnLaunchSmart) DOM.btnLaunchSmart.classList.add('sentence-mode');
    if (DOM.btnSmartTitle) DOM.btnSmartTitle.textContent = 'Bắt Đầu Chơi Trên Sentence Bridge Builder';
    if (DOM.btnSmartSub) DOM.btnSmartSub.textContent = `Tự động mở port :3001 với ${count} câu hỏi`;
  } else {
    if (DOM.detType) DOM.detType.textContent = '🔤 Từ Vựng (Vocabulary)';
    if (DOM.recIcon) DOM.recIcon.textContent = '🫧';
    if (DOM.recCard) DOM.recCard.classList.remove('sentence-mode');
    if (DOM.recGameTitle) DOM.recGameTitle.textContent = 'Word Bubble Pop';
    if (DOM.recGameReason) {
      DOM.recGameReason.textContent =
        'Nội dung gồm các từ vựng súc tích ➔ Hoàn hảo cho game Bắn Bóng Nước rèn luyện phản xạ nhanh và ghi nhớ từ!';
    }
    if (DOM.btnLaunchSmart) DOM.btnLaunchSmart.classList.remove('sentence-mode');
    if (DOM.btnSmartTitle) DOM.btnSmartTitle.textContent = 'Bắt Đầu Chơi Trên Word Bubble Pop';
    if (DOM.btnSmartSub) DOM.btnSmartSub.textContent = `Tự động mở port :3000 với ${count} từ vựng`;
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
    launchGame(StudioState.recommendedGame);
  });

  DOM.btnForceBubble?.addEventListener('click', () => {
    launchGame('bubble-pop');
  });

  DOM.btnForceBridge?.addEventListener('click', () => {
    launchGame('sentence-bridge');
  });
}

function launchGame(gameId) {
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
  const baseUrl = gameId === 'sentence-bridge' ? 'http://localhost:3001' : 'http://localhost:3000';

  let launchUrl = '';
  if (StudioState.currentPresetId) {
    // Standard preset by ID
    launchUrl = `${baseUrl}/?packId=${encodeURIComponent(StudioState.currentPresetId)}`;
  } else {
    // Custom teacher input: pass encoded JSON payload for seamless cross-port transfer
    const jsonStr = JSON.stringify(pack);
    const b64 = btoa(encodeURIComponent(jsonStr));
    launchUrl = `${baseUrl}/?customPack=${encodeURIComponent(b64)}`;
  }

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
