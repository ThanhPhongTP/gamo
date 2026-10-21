/**
 * ========================================================
 * GAMO Portal — Main Application Logic
 * ========================================================
 * - Clean Game Arena Homepage (Focused on Game Grid)
 * - Teacher Portal Modal (Cổng Quản Trị Giáo Viên)
 *   + Tab 1: Ngân Hàng Từ Vựng & Mẫu Câu (Quản lý, tìm kiếm, xuất file Excel)
 *   + Tab 2: Nhập File Excel / CSV (Local-First, Preview dữ liệu trước khi nạp)
 *   + Tab 3: Thêm Bằng Biểu Mẫu (2 Cột với Live Preview Card trên Game học sinh)
 * - Tự động đồng bộ ngân hàng dữ liệu với các Game Cards
 */

import {
  CURRICULUM_LIBRARY,
  createLessonPack,
  getAllLessons,
  saveLessonPack,
  deleteLesson,
  setActiveLesson,
  downloadSampleCSV,
  exportLessonsToCSV,
  readExcelOrCSVFile,
} from '@gamo/content';

// ─── DOM Selector Helper ─────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Portal Global State ────────────────────────────────
const PortalState = {
  currentModalTab: 'form', // 'bank' | 'excel' | 'form'
  importedPacksTemp: null, // Temporary storage for uploaded Excel file preview
  activeEntryType: 'vocab', // 'vocab' | 'sentence'
};

// ─── Environment Game URL Resolver ───────────────────────
function getGameBaseUrl(gameId) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return gameId === 'sentence-bridge' ? 'http://localhost:3001' : 'http://localhost:3000';
  }
  return `/games/${gameId}`;
}

// ─── Application Bootstrap ──────────────────────────────
export function initPortal() {
  initArcadeFilters();
  refreshGamePacksDropdowns();
  initArcadeLaunchers();
  initTeacherPortalModal();
  initFormBuilderTab();
  initExcelImportTab();
  initBankTab();
  updateBankCountBadge();
}

// ─── 1. Home Arcade: Filters & Game Cards ───────────────
function initArcadeFilters() {
  const filterBtns = document.querySelectorAll('#category-filters .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      const cards = document.querySelectorAll('#games-grid .game-card');
      cards.forEach(card => {
        const cats = (card.dataset.category || '').split(' ');
        if (filter === 'all' || cats.includes(filter)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/**
 * Nạp danh sách bài học (SGK + Thầy cô tự tạo) vào dropdown của từng Game Card
 */
export function refreshGamePacksDropdowns() {
  const allLessons = getAllLessons();

  const bubbleSelect = $('select-pack-bubble');
  const bridgeSelect = $('select-pack-bridge');

  // Lọc bài phù hợp cho Bubble Pop (từ vựng) và Bridge (câu)
  const vocabPacks = allLessons.filter(p => p.type !== 'sentence');
  const sentencePacks = allLessons.filter(p => p.type === 'sentence' || p.items?.some(i => i.fullSentence && i.fullSentence.includes(' ')));

  if (bubbleSelect) {
    const currentVal = bubbleSelect.value;
    bubbleSelect.innerHTML = '';
    
    // Group: Bài của Giáo Viên (nếu có)
    const customPacks = vocabPacks.filter(p => !p.id.startsWith('pack_primary') && !p.id.startsWith('pack_sec'));
    if (customPacks.length > 0) {
      const optgroupCustom = document.createElement('optgroup');
      optgroupCustom.label = '⭐ Bài Của Giáo Viên (Tự nạp)';
      customPacks.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `📝 ${p.title} (${p.items?.length || 0} từ)`;
        optgroupCustom.appendChild(opt);
      });
      bubbleSelect.appendChild(optgroupCustom);
    }

    // Group: SGK Chuẩn
    const optgroupSGK = document.createElement('optgroup');
    optgroupSGK.label = '📚 Kho Bài SGK Chuẩn';
    vocabPacks.forEach(p => {
      if (p.id.startsWith('pack_primary') || p.id.startsWith('pack_sec')) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.title} (${p.items?.length || 0} từ)`;
        optgroupSGK.appendChild(opt);
      }
    });
    bubbleSelect.appendChild(optgroupSGK);

    if (currentVal && bubbleSelect.querySelector(`option[value="${currentVal}"]`)) {
      bubbleSelect.value = currentVal;
    }
  }

  if (bridgeSelect) {
    const currentVal = bridgeSelect.value;
    bridgeSelect.innerHTML = '';

    const customPacks = sentencePacks.filter(p => !p.id.startsWith('pack_sentence'));
    if (customPacks.length > 0) {
      const optgroupCustom = document.createElement('optgroup');
      optgroupCustom.label = '⭐ Mẫu Câu Của Giáo Viên';
      customPacks.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `📝 ${p.title} (${p.items?.length || 0} câu)`;
        optgroupCustom.appendChild(opt);
      });
      bridgeSelect.appendChild(optgroupCustom);
    }

    const optgroupSGK = document.createElement('optgroup');
    optgroupSGK.label = '📚 Mẫu Câu SGK Chuẩn';
    allLessons.forEach(p => {
      if (p.id.startsWith('pack_sentence')) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.title} (${p.items?.length || 0} câu)`;
        optgroupSGK.appendChild(opt);
      }
    });
    bridgeSelect.appendChild(optgroupSGK);

    if (currentVal && bridgeSelect.querySelector(`option[value="${currentVal}"]`)) {
      bridgeSelect.value = currentVal;
    }
  }

  updateLaunchUrls();
}

function updateLaunchUrls() {
  const bubbleSelect = $('select-pack-bubble');
  const bridgeSelect = $('select-pack-bridge');
  const btnBubble = $('btn-launch-bubble');
  const btnBridge = $('btn-launch-bridge');

  if (btnBubble && bubbleSelect) {
    const packId = bubbleSelect.value || 'pack_primary_animals';
    btnBubble.href = `${getGameBaseUrl('word-bubble-pop')}/?packId=${encodeURIComponent(packId)}&autoplay=true&difficulty=medium&timeLimit=60`;
  }

  if (btnBridge && bridgeSelect) {
    const packId = bridgeSelect.value || 'pack_sentence_daily';
    btnBridge.href = `${getGameBaseUrl('sentence-bridge')}/?packId=${encodeURIComponent(packId)}&autoplay=true&difficulty=medium&count=5&teams=2`;
  }
}

function initArcadeLaunchers() {
  $('select-pack-bubble')?.addEventListener('change', updateLaunchUrls);
  $('select-pack-bridge')?.addEventListener('change', updateLaunchUrls);

  // Nút mở nhanh Cổng Giáo Viên từ từng thẻ Game Card
  $('btn-quick-manage-bubble')?.addEventListener('click', () => {
    openTeacherPortalModal('form');
    // Set form to vocab mode
    const radioVocab = $('radio-type-vocab');
    if (radioVocab) {
      radioVocab.checked = true;
      handleTypeSwitch('vocab');
    }
  });

  $('btn-quick-manage-bridge')?.addEventListener('click', () => {
    openTeacherPortalModal('form');
    // Set form to sentence mode
    const radioSentence = $('radio-type-sentence');
    if (radioSentence) {
      radioSentence.checked = true;
      handleTypeSwitch('sentence');
    }
  });
}

// ─── 2. Cổng Quản Trị Giáo Viên: Modal Management ────────
function initTeacherPortalModal() {
  const modal = $('modal-teacher-portal');
  const btnOpen = $('btn-open-teacher-portal');
  const btnClose = $('btn-close-teacher-portal');

  btnOpen?.addEventListener('click', () => {
    openTeacherPortalModal('form');
  });

  btnClose?.addEventListener('click', () => {
    closeTeacherPortalModal();
  });

  // Đóng khi click ngoài backdrop
  modal?.addEventListener('click', e => {
    if (e.target === modal) {
      closeTeacherPortalModal();
    }
  });

  // Phím ESC đóng modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal?.classList.contains('hidden')) {
      closeTeacherPortalModal();
    }
  });

  // Switch tabs trong modal
  const tabBtns = document.querySelectorAll('.portal-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPane = btn.dataset.target;
      switchModalTab(targetPane);
    });
  });
}

function openTeacherPortalModal(tab = 'form') {
  const modal = $('modal-teacher-portal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    switchModalTab(`pane-${tab}`);
  }
}

function closeTeacherPortalModal() {
  const modal = $('modal-teacher-portal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function switchModalTab(paneId) {
  // Update buttons
  document.querySelectorAll('.portal-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.target === paneId);
  });

  // Update panes
  document.querySelectorAll('.portal-pane').forEach(p => {
    p.classList.toggle('active', p.id === paneId);
  });

  if (paneId === 'pane-bank') {
    renderBankPacksList();
  }
}

// ─── 3. TAB 3: Thêm Bằng Biểu Mẫu (Layout 2 cột + Live Preview) ──
function initFormBuilderTab() {
  const form = $('form-add-vocab');
  const inputEn = $('form-word-en');
  const inputIpa = $('form-word-ipa');
  const selectType = $('form-word-type');
  const inputVi = $('form-word-vi');
  const selectGrade = $('form-word-grade');
  const inputTopic = $('form-word-topic');
  const inputExEn = $('form-example-en');
  const inputExVi = $('form-example-vi');
  const inputHint = $('form-word-hint');
  const btnSave = $('btn-save-form-item');
  const btnSpeech = $('btn-preview-speech');

  // Radio switch type
  $('radio-type-vocab')?.addEventListener('change', () => handleTypeSwitch('vocab'));
  $('radio-type-sentence')?.addEventListener('change', () => handleTypeSwitch('sentence'));

  // Live input binding to preview card
  const inputsToListen = [
    inputEn,
    inputIpa,
    selectType,
    inputVi,
    selectGrade,
    inputTopic,
    inputExEn,
    inputExVi,
    inputHint,
  ];

  inputsToListen.forEach(input => {
    input?.addEventListener('input', updateLivePreviewCard);
    input?.addEventListener('change', updateLivePreviewCard);
  });

  // Phát âm thử qua Web Speech API
  btnSpeech?.addEventListener('click', () => {
    const word = inputEn?.value?.trim() || $('preview-en-text')?.textContent || '';
    if (word) {
      speakWord(word.replace(/\[|\]/g, ''));
    }
  });

  // Lưu vào ngân hàng
  btnSave?.addEventListener('click', handleSaveFormItem);

  // Initialize preview card
  updateLivePreviewCard();
}

function handleTypeSwitch(type) {
  PortalState.activeEntryType = type;
  const labelEn = $('label-field-en');
  const inputEn = $('form-word-en');
  const inputTopic = $('form-word-topic');
  const selectType = $('form-word-type');

  if (type === 'sentence') {
    if (labelEn) labelEn.textContent = 'Mẫu câu tiếng Anh (dùng ngoặc vuông [] để tách mảnh ghép)';
    if (inputEn) inputEn.placeholder = 'VD: [She] [is reading] [a book]';
    if (selectType) selectType.value = 'Mẫu câu (Sentence)';
    if (inputTopic) inputTopic.value = 'daily routines';
  } else {
    if (labelEn) labelEn.textContent = 'Từ vựng tiếng Anh';
    if (inputEn) inputEn.placeholder = 'VD: bee';
    if (selectType) selectType.value = 'Danh từ (Noun)';
    if (inputTopic) inputTopic.value = 'animals';
  }

  updateLivePreviewCard();
}

function updateLivePreviewCard() {
  const enVal = $('form-word-en')?.value?.trim();
  const ipaVal = $('form-word-ipa')?.value?.trim();
  const typeVal = $('form-word-type')?.value;
  const viVal = $('form-word-vi')?.value?.trim();
  const gradeVal = $('form-word-grade')?.value;
  const exEnVal = $('form-example-en')?.value?.trim();
  const exViVal = $('form-example-vi')?.value?.trim();
  const hintVal = $('form-word-hint')?.value?.trim();

  // 1. Grade Badge
  const gradeBadge = $('preview-grade-badge');
  if (gradeBadge) {
    if (gradeVal === 'secondary') gradeBadge.textContent = 'Cấp 2 (THCS)';
    else if (gradeVal === 'high') gradeBadge.textContent = 'Cấp 3 (THPT)';
    else gradeBadge.textContent = 'Tiểu Học';
  }

  // 2. English Text (Clean brackets if sentence)
  const previewEn = $('preview-en-text');
  if (previewEn) {
    const raw = enVal || (PortalState.activeEntryType === 'sentence' ? '[She] [is reading] [a book]' : 'bee');
    previewEn.textContent = raw.replace(/\[(.*?)\]/g, '$1');
  }

  // 3. IPA & Type
  const previewIpa = $('preview-ipa-val');
  if (previewIpa) {
    previewIpa.textContent = ipaVal || '/.../';
  }

  const previewType = $('preview-type-val');
  if (previewType) {
    const typeLabel = typeVal ? `(${typeVal.split(' ')[0].toLowerCase()})` : '(noun)';
    previewType.textContent = typeLabel;
  }

  // 4. Vietnamese Meaning
  const previewVi = $('preview-vi-text');
  if (previewVi) {
    previewVi.textContent = viVal || (PortalState.activeEntryType === 'sentence' ? 'Cô ấy đang đọc sách' : 'con ong');
  }

  // 5. Example Box
  const exampleContainer = $('preview-example-container');
  const exEnSpan = $('preview-example-en-val');
  const exViSpan = $('preview-example-vi-val');

  if (exEnVal || exViVal) {
    if (exampleContainer) exampleContainer.style.display = 'block';
    if (exEnSpan) exEnSpan.textContent = exEnVal || '';
    if (exViSpan) exViSpan.textContent = exViVal || '';
  } else {
    if (exampleContainer) exampleContainer.style.display = 'none';
  }

  // 6. Hint Box
  const hintContainer = $('preview-hint-container');
  const hintSpan = $('preview-hint-val');
  if (hintVal) {
    if (hintContainer) hintContainer.style.display = 'flex';
    if (hintSpan) hintSpan.textContent = hintVal;
  } else {
    if (hintContainer) hintContainer.style.display = 'none';
  }
}

function speakWord(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function handleSaveFormItem() {
  const en = $('form-word-en')?.value?.trim();
  const vi = $('form-word-vi')?.value?.trim();
  const topic = $('form-word-topic')?.value?.trim() || 'Chủ đề chung';
  const ipa = $('form-word-ipa')?.value?.trim() || '';
  const wordType = $('form-word-type')?.value || '';
  const grade = $('form-word-grade')?.value || 'primary';
  const exEn = $('form-example-en')?.value?.trim() || '';
  const exVi = $('form-example-vi')?.value?.trim() || '';
  const hint = $('form-word-hint')?.value?.trim() || '';

  const statusMsg = $('form-save-status');

  if (!en || !vi) {
    if (statusMsg) {
      statusMsg.textContent = '⚠️ Vui lòng nhập từ/câu tiếng Anh và nghĩa tiếng Việt!';
      statusMsg.className = 'save-status-msg error';
    }
    return;
  }

  const allLessons = getAllLessons();
  const unitId = `unit_${topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  // Tìm bài học tương ứng hoặc tạo mới
  let targetPack = allLessons.find(p => p.unit?.toLowerCase() === topic.toLowerCase() || p.title?.toLowerCase() === topic.toLowerCase());

  if (!targetPack) {
    targetPack = createLessonPack({
      id: unitId,
      title: `Unit: ${topic.toUpperCase()}`,
      unit: topic,
      grade,
      type: PortalState.activeEntryType,
      items: [],
    });
  }

  // Thêm mục mới
  const newItem = {
    word: en,
    answer: en,
    fullSentence: en,
    meaning: vi,
    prompt: vi,
    ipa,
    wordType,
    example: exEn,
    exampleMeaning: exVi,
    hint,
  };

  targetPack.items = targetPack.items || [];
  targetPack.items.push(newItem);
  targetPack.itemCount = targetPack.items.length;
  targetPack.updatedAt = new Date().toISOString();

  saveLessonPack(targetPack);
  setActiveLesson(targetPack);

  // Hiển thị thông báo thành công
  if (statusMsg) {
    statusMsg.textContent = `✅ Đã lưu "${en}" vào bộ [${targetPack.title}]!`;
    statusMsg.className = 'save-status-msg success';
    setTimeout(() => {
      statusMsg.textContent = '';
    }, 3500);
  }

  // Reset input form
  $('form-word-en').value = '';
  $('form-word-vi').value = '';
  $('form-word-ipa').value = '';
  $('form-example-en').value = '';
  $('form-example-vi').value = '';
  $('form-word-hint').value = '';
  $('form-word-en').focus();

  updateLivePreviewCard();
  updateBankCountBadge();
  refreshGamePacksDropdowns();
}

// ─── 4. TAB 2: Nhập File Excel / CSV ────────────────────
function initExcelImportTab() {
  const dropzone = $('excel-dropzone');
  const fileInput = $('input-excel-file');
  const btnBrowse = $('btn-browse-file');
  const btnDownloadTemplate = $('btn-download-excel-template');
  const btnCancel = $('btn-cancel-import');
  const btnConfirm = $('btn-confirm-import');

  btnBrowse?.addEventListener('click', () => {
    fileInput?.click();
  });

  btnDownloadTemplate?.addEventListener('click', () => {
    downloadSampleCSV();
  });

  fileInput?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) handleExcelFileUpload(file);
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone?.addEventListener('drop', e => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleExcelFileUpload(files[0]);
    }
  });

  btnCancel?.addEventListener('click', () => {
    $('excel-preview-section')?.classList.add('hidden');
    $('excel-dropzone')?.classList.remove('hidden');
    if (fileInput) fileInput.value = '';
    PortalState.importedPacksTemp = null;
  });

  btnConfirm?.addEventListener('click', handleConfirmImport);
}

async function handleExcelFileUpload(file) {
  try {
    const dropzone = $('excel-dropzone');
    const previewSection = $('excel-preview-section');

    const result = await readExcelOrCSVFile(file);
    PortalState.importedPacksTemp = result.packs;

    // Hiển thị Preview
    dropzone?.classList.add('hidden');
    previewSection?.classList.remove('hidden');

    if ($('preview-file-name')) $('preview-file-name').textContent = file.name;
    if ($('preview-file-count')) $('preview-file-count').textContent = `${result.rawCount} từ/câu hợp lệ`;

    renderExcelPreviewTable(result.items);
  } catch (err) {
    alert(`Lỗi khi đọc file: ${err.message}`);
  }
}

function renderExcelPreviewTable(items) {
  const tbody = $('preview-data-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const displayList = items.slice(0, 10);
  displayList.forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color: #64748b;">${idx + 1}</td>
      <td><strong>${escapeHtml(row.unit || 'Chung')}</strong></td>
      <td class="font-bold text-primary">${escapeHtml(row.english || '')}</td>
      <td>${escapeHtml(row.vietnamese || '')}</td>
      <td class="text-subtle font-mono">${escapeHtml(row.ipa || '-')}</td>
      <td><span class="type-pill">${escapeHtml(row.wordType || 'Từ vựng')}</span></td>
      <td class="text-subtle">${escapeHtml(row.example || '-')}</td>
    `;
    tbody.appendChild(tr);
  });

  if (items.length > 10) {
    const trMore = document.createElement('tr');
    trMore.innerHTML = `
      <td colspan="7" style="text-align: center; color: #64748b; font-style: italic; padding: 10px;">
        ... và ${items.length - 10} mục nữa sẵn sàng nạp vào ngân hàng
      </td>
    `;
    tbody.appendChild(trMore);
  }
}

function handleConfirmImport() {
  if (!PortalState.importedPacksTemp || PortalState.importedPacksTemp.length === 0) {
    alert('Không có dữ liệu hợp lệ để lưu!');
    return;
  }

  // Lưu từng pack vào localStorage
  PortalState.importedPacksTemp.forEach(pack => {
    saveLessonPack(pack);
  });

  alert(`🎉 Thành công! Đã nạp ${PortalState.importedPacksTemp.length} bài học vào Ngân Hàng Giáo Viên!`);

  // Reset tab excel
  $('excel-preview-section')?.classList.add('hidden');
  $('excel-dropzone')?.classList.remove('hidden');
  const fileInput = $('input-excel-file');
  if (fileInput) fileInput.value = '';
  PortalState.importedPacksTemp = null;

  // Cập nhật UI
  updateBankCountBadge();
  refreshGamePacksDropdowns();

  // Chuyển sang Tab 1 xem ngân hàng
  switchModalTab('pane-bank');
}

// ─── 5. TAB 1: Ngân Hàng Từ Vựng & Mẫu Câu ────────────────
function initBankTab() {
  const searchInput = $('input-bank-search');
  const gradeFilter = $('select-bank-filter-grade');
  const typeFilter = $('select-bank-filter-type');
  const btnExport = $('btn-export-excel-file');
  const btnQuickAdd = $('btn-bank-quick-add');

  searchInput?.addEventListener('input', renderBankPacksList);
  gradeFilter?.addEventListener('change', renderBankPacksList);
  typeFilter?.addEventListener('change', renderBankPacksList);

  btnExport?.addEventListener('click', () => {
    exportLessonsToCSV();
  });

  btnQuickAdd?.addEventListener('click', () => {
    switchModalTab('pane-form');
    $('form-word-en')?.focus();
  });
}

function renderBankPacksList() {
  const container = $('bank-packs-list');
  if (!container) return;

  const searchQuery = ($('input-bank-search')?.value || '').toLowerCase().trim();
  const gradeFilter = $('select-bank-filter-grade')?.value || 'all';
  const typeFilter = $('select-bank-filter-type')?.value || 'all';

  const allLessons = getAllLessons();

  let filtered = allLessons.filter(pack => {
    if (gradeFilter !== 'all' && pack.grade !== gradeFilter) return false;
    if (typeFilter !== 'all') {
      if (typeFilter === 'vocab' && pack.type === 'sentence') return false;
      if (typeFilter === 'sentence' && pack.type !== 'sentence') return false;
    }
    if (searchQuery) {
      const matchTitle = (pack.title || '').toLowerCase().includes(searchQuery);
      const matchUnit = (pack.unit || '').toLowerCase().includes(searchQuery);
      const matchItems = (pack.items || []).some(
        i =>
          (i.answer || i.word || '').toLowerCase().includes(searchQuery) ||
          (i.prompt || i.meaning || '').toLowerCase().includes(searchQuery)
      );
      if (!matchTitle && !matchUnit && !matchItems) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bank-empty-state">
        <div class="empty-state-icon">📂</div>
        <h3>Không tìm thấy bài học nào phù hợp</h3>
        <p>Thầy cô có thể nhập file Excel hoặc bấm "Thêm Từ Mới" để bắt đầu tạo ngân hàng đề!</p>
        <button type="button" class="btn-create-first" id="btn-empty-add-now">+ Thêm Từ Đầu Tiên</button>
      </div>
    `;
    $('btn-empty-add-now')?.addEventListener('click', () => {
      switchModalTab('pane-form');
      $('form-word-en')?.focus();
    });
    return;
  }

  container.innerHTML = '';

  filtered.forEach(pack => {
    const packCard = document.createElement('div');
    packCard.className = 'bank-pack-card';

    const isSentence = pack.type === 'sentence';
    const typeLabel = isSentence ? '🌉 Mẫu Câu' : '🔤 Từ Vựng';
    const isCustom = !pack.id.startsWith('pack_primary') && !pack.id.startsWith('pack_sec') && !pack.id.startsWith('pack_sentence');

    const sampleWords = (pack.items || [])
      .slice(0, 5)
      .map(i => i.answer || i.word || '')
      .join(', ');

    packCard.innerHTML = `
      <div class="pack-card-header">
        <div class="pack-title-col">
          <div class="pack-tag-row">
            <span class="pack-pill ${isSentence ? 'sentence' : 'vocab'}">${typeLabel}</span>
            <span class="pack-pill grade">${pack.grade === 'secondary' ? 'Cấp 2' : pack.grade === 'high' ? 'Cấp 3' : 'Tiểu Học'}</span>
            ${isCustom ? '<span class="pack-pill custom">⭐ Đề Của Thầy Cô</span>' : '<span class="pack-pill sgk">Chuẩn SGK</span>'}
          </div>
          <h4 class="pack-name">${escapeHtml(pack.title)}</h4>
          <span class="pack-meta">${pack.items?.length || 0} từ / câu hỏi · Mẫu: ${escapeHtml(sampleWords)}${pack.items?.length > 5 ? '...' : ''}</span>
        </div>

        <div class="pack-actions-col">
          <button type="button" class="btn-pack-play" data-pack-id="${pack.id}" data-type="${pack.type || 'vocab'}">
            <span>▶️ Chơi Với Game</span>
          </button>
          ${
            isCustom
              ? `<button type="button" class="btn-pack-delete" data-delete-id="${pack.id}" title="Xóa bài này">🗑️</button>`
              : ''
          }
        </div>
      </div>
    `;

    // Nút chơi bài này
    packCard.querySelector('.btn-pack-play')?.addEventListener('click', () => {
      launchPackInGame(pack);
    });

    // Nút xóa bài
    packCard.querySelector('.btn-pack-delete')?.addEventListener('click', () => {
      if (confirm(`Bạn có chắc muốn xóa bài học "${pack.title}" không?`)) {
        deleteLesson(pack.id);
        renderBankPacksList();
        updateBankCountBadge();
        refreshGamePacksDropdowns();
      }
    });

    container.appendChild(packCard);
  });
}

function launchPackInGame(pack) {
  setActiveLesson(pack);
  closeTeacherPortalModal();

  const isSentence = pack.type === 'sentence';
  const targetGame = isSentence ? 'sentence-bridge' : 'word-bubble-pop';

  const baseUrl = getGameBaseUrl(targetGame);
  const launchUrl = `${baseUrl}/?packId=${encodeURIComponent(pack.id)}&autoplay=true&difficulty=medium`;
  window.open(launchUrl, '_blank');
}

function updateBankCountBadge() {
  const allLessons = getAllLessons();
  let totalItems = 0;
  allLessons.forEach(p => {
    totalItems += p.items?.length || 0;
  });

  const badge = $('portal-bank-total-badge');
  if (badge) badge.textContent = totalItems;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Auto Bootstrap On Load ─────────────────────────────
document.addEventListener('DOMContentLoaded', initPortal);
