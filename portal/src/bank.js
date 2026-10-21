/**
 * ========================================================
 * GAMO Teacher Bank — Full-Page Management Controller
 * ========================================================
 * - Data table with comprehensive search & multi-level filters
 * - Tag chip filters (Presets + Dynamic tags from user packs)
 * - Dedicated focus modal for Add / Edit word & sentence
 * - Dedicated modal for Excel / CSV bulk import
 * - Real-time audio pronunciation via SpeechSynthesis
 * - Shared local-first storage with Game Arcade via @gamo/content
 */

import {
  createLessonPack,
  getAllLessons,
  saveLessonPack,
  deleteLesson,
  setActiveLesson,
  downloadSampleCSV,
  exportLessonsToCSV,
  readExcelOrCSVFile,
} from '@gamo/content';

// ─── DOM Helper ──────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Bank Controller State ───────────────────────────────
const BankState = {
  currentTagFilter: 'all',  // 'all' | 'animals' | 'school' | etc.
  editingTarget: null,      // { packId, itemIndex } when in edit mode
  importedPacksTemp: null, // Temporary storage for uploaded Excel file preview
  activeEntryType: 'vocab', // 'vocab' | 'sentence'
};

// ─── Application Bootstrap ──────────────────────────────
export function initBankPage() {
  parseQueryParams();
  initBankToolbar();
  initWordFormModal();
  initExcelImportModal();
  updateBankStats();
  renderBankTagChips();
  renderBankTable();
}

/**
 * Đọc query params từ URL (VD: bank.html?type=vocab hoặc ?type=sentence)
 */
function parseQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const typeParam = urlParams.get('type');
  const actionParam = urlParams.get('action');

  if (typeParam && (typeParam === 'vocab' || typeParam === 'sentence')) {
    const typeSelect = $('select-bank-filter-type');
    if (typeSelect) typeSelect.value = typeParam;
  }

  if (actionParam === 'add') {
    setTimeout(() => openWordFormModal(false), 200);
  }
}

// ─── 1. Thống Kê Tổng Quan (Stats Header) ────────────────
export function updateBankStats() {
  const allLessons = getAllLessons();
  let totalItems = 0;
  const tagSet = new Set();

  allLessons.forEach(p => {
    totalItems += p.items?.length || 0;
    (p.tags || []).forEach(t => tagSet.add(t));
    (p.items || []).forEach(item => {
      (item.tags || []).forEach(t => tagSet.add(t));
    });
  });

  if ($('stat-total-items')) $('stat-total-items').textContent = totalItems;
  if ($('stat-total-packs')) $('stat-total-packs').textContent = allLessons.length;
  if ($('stat-total-tags')) $('stat-total-tags').textContent = tagSet.size;
}

// ─── 2. Thanh Công Cụ Lọc & Tìm Kiếm ────────────────────
function initBankToolbar() {
  const searchInput = $('input-bank-search');
  const gradeFilter = $('select-bank-filter-grade');
  const typeFilter = $('select-bank-filter-type');
  const btnExport = $('btn-export-excel-file');
  const btnPageOpenExcel = $('btn-page-open-excel');
  const btnPageQuickAdd = $('btn-page-quick-add');
  const btnHeaderAdd = $('btn-header-add-word');
  const btnHeaderImport = $('btn-header-import-excel');

  searchInput?.addEventListener('input', renderBankTable);
  gradeFilter?.addEventListener('change', renderBankTable);
  typeFilter?.addEventListener('change', renderBankTable);

  btnExport?.addEventListener('click', () => {
    exportLessonsToCSV();
  });

  btnPageOpenExcel?.addEventListener('click', openExcelImportModal);
  btnHeaderImport?.addEventListener('click', openExcelImportModal);

  btnPageQuickAdd?.addEventListener('click', () => openWordFormModal(false));
  btnHeaderAdd?.addEventListener('click', () => openWordFormModal(false));
}

// ─── 3. Thanh Lọc Nhanh Theo Thẻ Tags (Dynamic Tag Chips) ──
export function renderBankTagChips() {
  const tagListContainer = $('bank-tags-filter-list');
  if (!tagListContainer) return;

  const defaultPresets = [
    { tag: 'all', label: 'Tất cả (All)' },
    { tag: 'animals', label: '🐾 Animals' },
    { tag: 'school', label: '🎒 School' },
    { tag: 'food', label: '🍎 Food & Drink' },
    { tag: 'family', label: '👨‍👩‍👧 Family' },
    { tag: 'daily', label: '☀️ Daily Routine' },
    { tag: 'hobbies', label: '🧭 Hobbies' },
    { tag: 'jobs', label: '💼 Jobs' },
  ];

  const allLessons = getAllLessons();
  const knownTags = new Set(defaultPresets.map(p => p.tag));
  const dynamicChips = [...defaultPresets];

  allLessons.forEach(pack => {
    (pack.tags || []).forEach(t => {
      const lower = t.toLowerCase().trim();
      if (lower && !knownTags.has(lower)) {
        knownTags.add(lower);
        dynamicChips.push({ tag: lower, label: `#${t}` });
      }
    });
    (pack.items || []).forEach(item => {
      (item.tags || []).forEach(t => {
        const lower = t.toLowerCase().trim();
        if (lower && !knownTags.has(lower)) {
          knownTags.add(lower);
          dynamicChips.push({ tag: lower, label: `#${t}` });
        }
      });
    });
  });

  tagListContainer.innerHTML = '';
  dynamicChips.forEach(chip => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-chip-btn ${BankState.currentTagFilter === chip.tag ? 'active' : ''}`;
    btn.textContent = chip.label;
    btn.dataset.tag = chip.tag;

    btn.addEventListener('click', () => {
      BankState.currentTagFilter = chip.tag;
      document.querySelectorAll('.tag-chip-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tag === chip.tag);
      });
      renderBankTable();
    });

    tagListContainer.appendChild(btn);
  });
}

// ─── 4. Render Bảng Dữ Liệu Ngân Hàng (9 Cột Thoáng Đãng) ──
export function renderBankTable() {
  const tbody = $('bank-table-tbody');
  const table = $('table-bank-data');
  const emptyState = $('bank-empty-state');
  if (!tbody) return;

  const searchQuery = ($('input-bank-search')?.value || '').toLowerCase().trim();
  const gradeFilter = $('select-bank-filter-grade')?.value || 'all';
  const typeFilter = $('select-bank-filter-type')?.value || 'all';
  const tagFilter = BankState.currentTagFilter;

  const allLessons = getAllLessons();
  const flatRows = [];
  let totalCount = 0;

  allLessons.forEach(pack => {
    const items = pack.items || [];
    items.forEach((item, itemIndex) => {
      totalCount++;
      flatRows.push({
        packId: pack.id,
        packTitle: pack.title,
        packUnit: pack.unit || pack.title || 'Chung',
        packGrade: pack.grade || 'primary',
        packType: pack.type || 'vocab',
        packTags: pack.tags || [],
        item,
        itemIndex,
      });
    });
  });

  // Lọc dữ liệu theo các điều kiện
  const filtered = flatRows.filter(row => {
    // 1. Lọc theo cấp học
    if (gradeFilter !== 'all' && row.packGrade !== gradeFilter) return false;

    // 2. Lọc theo thể loại
    if (typeFilter !== 'all') {
      const isSentence = row.packType === 'sentence' || (row.item.wordType && row.item.wordType.includes('Sentence'));
      if (typeFilter === 'sentence' && !isSentence) return false;
      if (typeFilter === 'vocab' && isSentence) return false;
    }

    // 3. Lọc theo Tag Chip
    if (tagFilter !== 'all') {
      const rowTags = [...(row.packTags || []), ...(row.item.tags || [])].map(t => t.toLowerCase());
      if (row.packUnit) rowTags.push(row.packUnit.toLowerCase());
      if (!rowTags.includes(tagFilter.toLowerCase())) return false;
    }

    // 4. Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const en = (row.item.word || row.item.answer || row.item.fullSentence || '').toLowerCase();
      const vi = (row.item.meaning || row.item.prompt || '').toLowerCase();
      const unit = (row.packUnit || '').toLowerCase();
      const tags = (row.item.tags || []).join(' ').toLowerCase();
      const example = (row.item.example || '').toLowerCase();

      const matched =
        en.includes(searchQuery) ||
        vi.includes(searchQuery) ||
        unit.includes(searchQuery) ||
        tags.includes(searchQuery) ||
        example.includes(searchQuery);

      if (!matched) return false;
    }

    return true;
  });

  // Cập nhật số lượng
  if ($('bank-count-filtered')) $('bank-count-filtered').textContent = filtered.length;
  if ($('bank-count-total')) $('bank-count-total').textContent = totalCount;

  // Empty state
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    table?.classList.add('hidden');
    emptyState?.classList.remove('hidden');

    $('btn-empty-reset-filter')?.addEventListener('click', () => {
      BankState.currentTagFilter = 'all';
      if ($('input-bank-search')) $('input-bank-search').value = '';
      if ($('select-bank-filter-grade')) $('select-bank-filter-grade').value = 'all';
      if ($('select-bank-filter-type')) $('select-bank-filter-type').value = 'all';
      renderBankTagChips();
      renderBankTable();
    });

    $('btn-empty-add-now')?.addEventListener('click', () => {
      openWordFormModal(false);
    });
    return;
  }

  table?.classList.remove('hidden');
  emptyState?.classList.add('hidden');
  tbody.innerHTML = '';

  filtered.forEach((row, idx) => {
    const tr = document.createElement('tr');

    const enText = row.item.word || row.item.answer || row.item.fullSentence || '';
    const viText = row.item.meaning || row.item.prompt || '';
    const wordType = row.item.wordType || (row.packType === 'sentence' ? 'Mẫu câu' : 'Từ vựng');
    const gradeLabel = row.packGrade === 'secondary' ? 'Cấp 2' : row.packGrade === 'high' ? 'Cấp 3' : 'Tiểu Học';
    const tags = row.item.tags && row.item.tags.length > 0 ? row.item.tags : (row.packUnit ? [row.packUnit.toLowerCase()] : []);

    const tagsHtml = tags.map(t => `<span class="bank-row-tag">#${escapeHtml(t)}</span>`).join('');

    tr.innerHTML = `
      <td style="text-align: center; color: #64748B; font-weight: 600;">${idx + 1}</td>
      <td class="bank-col-en">
        <span>${escapeHtml(enText.replace(/\[(.*?)\]/g, '$1'))}</span>
        <button type="button" class="mini-speak-btn" data-speak="${escapeHtml(enText)}" title="Nghe phát âm">🔊</button>
      </td>
      <td class="bank-col-vi">${escapeHtml(viText)}</td>
      <td><span class="type-pill">${escapeHtml(wordType)}</span></td>
      <td><span class="bank-col-unit">${escapeHtml(row.packUnit)}</span></td>
      <td><span class="bank-col-grade">${gradeLabel}</span></td>
      <td><div class="bank-col-tags">${tagsHtml}</div></td>
      <td class="text-subtle" style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(row.item.example || '-')}">
        ${escapeHtml(row.item.example || '-')}
      </td>
      <td>
        <div class="bank-row-actions">
          <button type="button" class="btn-row-edit" data-pack-id="${row.packId}" data-item-idx="${row.itemIndex}" title="Chỉnh sửa từ này">
            <span>✏️ Sửa</span>
          </button>
          <button type="button" class="btn-row-delete" data-pack-id="${row.packId}" data-item-idx="${row.itemIndex}" data-word="${escapeHtml(enText)}" title="Xóa từ này">
            <span>🗑️ Xóa</span>
          </button>
        </div>
      </td>
    `;

    // Loa phát âm tiếng Anh
    tr.querySelector('.mini-speak-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      speakWord(enText.replace(/\[|\]/g, ''));
    });

    // Nút Sửa
    tr.querySelector('.btn-row-edit')?.addEventListener('click', () => {
      openWordFormModal(true, row.packId, row.itemIndex);
    });

    // Nút Xóa
    tr.querySelector('.btn-row-delete')?.addEventListener('click', () => {
      deleteBankItem(row.packId, row.itemIndex, enText);
    });

    tbody.appendChild(tr);
  });
}

/**
 * Xóa 1 từ / mẫu câu khỏi ngân hàng
 */
function deleteBankItem(packId, itemIndex, word) {
  if (!confirm(`Bạn có chắc muốn xóa "${word}" khỏi ngân hàng không?`)) return;

  const allLessons = getAllLessons();
  const pack = allLessons.find(p => p.id === packId);
  if (!pack || !pack.items) return;

  pack.items.splice(itemIndex, 1);
  pack.itemCount = pack.items.length;
  pack.updatedAt = new Date().toISOString();

  saveLessonPack(pack);

  renderBankTagChips();
  renderBankTable();
  updateBankStats();
}

// ─── 5. MODAL 1: Thêm / Sửa Bằng Biểu Mẫu (Word Form Modal) ─
function initWordFormModal() {
  const modal = $('modal-word-form');
  const btnClose = $('btn-close-word-modal');
  const btnCancel = $('btn-cancel-word-modal');
  const btnSave = $('btn-save-form-item');
  const btnCancelEdit = $('btn-cancel-form-edit');
  const btnSpeech = $('btn-preview-speech');

  btnClose?.addEventListener('click', closeWordFormModal);
  btnCancel?.addEventListener('click', closeWordFormModal);
  modal?.addEventListener('click', e => {
    if (e.target === modal) closeWordFormModal();
  });

  btnCancelEdit?.addEventListener('click', cancelFormEditMode);
  btnSave?.addEventListener('click', handleSaveFormItem);

  btnSpeech?.addEventListener('click', () => {
    const word = $('form-word-en')?.value || 'bee';
    speakWord(word.replace(/\[|\]/g, ''));
  });

  // Switch type vocab vs sentence
  $('radio-type-vocab')?.addEventListener('change', () => handleTypeSwitch('vocab'));
  $('radio-type-sentence')?.addEventListener('change', () => handleTypeSwitch('sentence'));

  // Quick tag chips buttons
  document.querySelectorAll('.btn-quick-tag').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      const inputTags = $('form-word-tags');
      if (!inputTags) return;
      const current = inputTags.value.split(',').map(s => s.trim()).filter(Boolean);
      if (!current.includes(tag)) {
        current.push(tag);
        inputTags.value = current.join(', ');
        updateLivePreviewCard();
      }
    });
  });

  // Live input binding to preview card
  const inputsToListen = [
    'form-word-en',
    'form-word-type',
    'form-word-vi',
    'form-word-grade',
    'form-word-topic',
    'form-word-tags',
    'form-example-en',
    'form-example-vi',
    'form-word-hint',
  ];

  inputsToListen.forEach(id => {
    const el = $(id);
    el?.addEventListener('input', updateLivePreviewCard);
    el?.addEventListener('change', updateLivePreviewCard);
  });
}

export function openWordFormModal(isEdit = false, packId = null, itemIndex = null) {
  const modal = $('modal-word-form');
  if (!modal) return;

  if (isEdit && packId && itemIndex !== null) {
    populateEditForm(packId, itemIndex);
  } else {
    resetFormForNewItem();
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('form-word-en')?.focus(), 60);
}

export function closeWordFormModal() {
  const modal = $('modal-word-form');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  cancelFormEditMode();
}

function handleTypeSwitch(type) {
  BankState.activeEntryType = type;
  const isSentence = type === 'sentence';

  const labelEn = $('label-field-en');
  const inputEn = $('form-word-en');
  const hintEn = $('hint-field-en');
  const typeSelect = $('form-word-type');

  if (isSentence) {
    if (labelEn) labelEn.textContent = 'Mẫu câu tiếng Anh (kèm [từ khóa])';
    if (inputEn) inputEn.placeholder = 'VD: She [likes] playing badminton.';
    if (hintEn) hintEn.textContent = 'Đặt từ quan trọng trong ngoặc vuông [ ] để tạo viên gạch xây cầu';
    if (typeSelect) typeSelect.value = 'Mẫu câu (Sentence)';
  } else {
    if (labelEn) labelEn.textContent = 'Từ vựng tiếng Anh';
    if (inputEn) inputEn.placeholder = 'VD: bee';
    if (hintEn) hintEn.textContent = 'Gõ từ tiếng Anh cần học sinh luyện tập';
    if (typeSelect) typeSelect.value = 'Danh từ (Noun)';
  }

  updateLivePreviewCard();
}

function updateLivePreviewCard() {
  const en = $('form-word-en')?.value.trim() || (BankState.activeEntryType === 'sentence' ? 'She [likes] playing badminton.' : 'bee');
  const vi = $('form-word-vi')?.value.trim() || (BankState.activeEntryType === 'sentence' ? 'Cô ấy thích chơi cầu lông.' : 'con ong');
  const wordType = $('form-word-type')?.value || 'Danh từ (Noun)';
  const grade = $('form-word-grade')?.value || 'primary';
  const topic = $('form-word-topic')?.value.trim() || 'Animals';
  const tagsStr = $('form-word-tags')?.value.trim() || 'animals';
  const exEn = $('form-example-en')?.value.trim();
  const exVi = $('form-example-vi')?.value.trim();
  const hint = $('form-word-hint')?.value.trim();

  const previewEn = $('preview-en-text');
  const previewVi = $('preview-vi-text');
  const previewType = $('preview-type-badge');
  const previewGrade = $('preview-grade-badge');
  const previewUnit = $('preview-unit-name');
  const previewGame = $('preview-game-target');
  const previewTagsContainer = $('preview-tags-container');

  if (previewEn) {
    if (BankState.activeEntryType === 'sentence') {
      previewEn.innerHTML = escapeHtml(en).replace(/\[(.*?)\]/g, '<span class="highlight-target">$1</span>');
    } else {
      previewEn.textContent = en;
    }
  }

  if (previewVi) previewVi.textContent = vi;
  if (previewType) previewType.textContent = wordType;

  if (previewGrade) {
    const gradeLabels = { primary: 'Tiểu Học', secondary: 'Cấp 2', high: 'Cấp 3' };
    previewGrade.textContent = gradeLabels[grade] || 'Tiểu Học';
  }

  if (previewUnit) previewUnit.textContent = topic;

  if (previewGame) {
    previewGame.textContent = BankState.activeEntryType === 'sentence' ? '🌉 Sentence Bridge' : '🫧 Word Bubble Pop';
  }

  // Tags
  if (previewTagsContainer) {
    const tagList = tagsStr.split(',').map(s => s.trim()).filter(Boolean);
    previewTagsContainer.innerHTML = tagList.map(t => `<span class="preview-tag-pill">#${escapeHtml(t)}</span>`).join('');
  }

  // Example Box
  const exampleBox = $('preview-example-container');
  if (exampleBox) {
    if (exEn) {
      exampleBox.style.display = 'block';
      if ($('preview-example-en-val')) $('preview-example-en-val').textContent = `"${exEn}"`;
      if ($('preview-example-vi-val')) $('preview-example-vi-val').textContent = exVi || '';
    } else {
      exampleBox.style.display = 'none';
    }
  }

  // Hint Box
  const hintBox = $('preview-hint-container');
  if (hintBox) {
    if (hint) {
      hintBox.style.display = 'flex';
      if ($('preview-hint-val')) $('preview-hint-val').textContent = hint;
    } else {
      hintBox.style.display = 'none';
    }
  }
}

function resetFormForNewItem() {
  BankState.editingTarget = null;

  if ($('word-modal-title')) $('word-modal-title').textContent = 'Thêm Từ Vựng / Mẫu Câu Mới';
  if ($('word-modal-desc')) $('word-modal-desc').textContent = 'Nhập từ tiếng Anh, nghĩa tiếng Việt và gắn thẻ để tự động nạp vào game';

  const banner = $('form-edit-banner');
  if (banner) banner.classList.add('hidden');

  const btnSave = $('btn-save-form-item');
  if (btnSave) {
    btnSave.innerHTML = '<span class="btn-icon">💾</span><span>Lưu Vào Ngân Hàng</span>';
  }

  if ($('form-word-en')) $('form-word-en').value = '';
  if ($('form-word-vi')) $('form-word-vi').value = '';
  if ($('form-example-en')) $('form-example-en').value = '';
  if ($('form-example-vi')) $('form-example-vi').value = '';
  if ($('form-word-hint')) $('form-word-hint').value = '';

  updateLivePreviewCard();
}

function populateEditForm(packId, itemIndex) {
  const allLessons = getAllLessons();
  const pack = allLessons.find(p => p.id === packId);
  if (!pack || !pack.items || !pack.items[itemIndex]) return;

  const item = pack.items[itemIndex];
  BankState.editingTarget = { packId, itemIndex };

  const enVal = item.word || item.answer || item.fullSentence || '';
  const viVal = item.meaning || item.prompt || '';

  if ($('word-modal-title')) $('word-modal-title').textContent = 'Chỉnh Sửa Từ Vựng / Mẫu Câu';
  if ($('word-modal-desc')) $('word-modal-desc').textContent = 'Cập nhật lại thông tin đã lưu trong ngân hàng dữ liệu';

  if ($('form-word-en')) $('form-word-en').value = enVal;
  if ($('form-word-vi')) $('form-word-vi').value = viVal;
  if ($('form-word-type')) $('form-word-type').value = item.wordType || (pack.type === 'sentence' ? 'Mẫu câu (Sentence)' : 'Danh từ (Noun)');
  if ($('form-word-grade')) $('form-word-grade').value = pack.grade || 'primary';
  if ($('form-word-topic')) $('form-word-topic').value = pack.unit || pack.title || '';
  if ($('form-word-tags')) $('form-word-tags').value = (item.tags || pack.tags || []).join(', ');
  if ($('form-example-en')) $('form-example-en').value = item.example || '';
  if ($('form-example-vi')) $('form-example-vi').value = item.exampleMeaning || '';
  if ($('form-word-hint')) $('form-word-hint').value = item.hint || '';

  // Đồng bộ loại câu / từ
  if (pack.type === 'sentence') {
    if ($('radio-type-sentence')) $('radio-type-sentence').checked = true;
    handleTypeSwitch('sentence');
  } else {
    if ($('radio-type-vocab')) $('radio-type-vocab').checked = true;
    handleTypeSwitch('vocab');
  }

  // Hiển thị banner Chế độ chỉnh sửa
  const banner = $('form-edit-banner');
  if (banner) banner.classList.remove('hidden');
  if ($('edit-banner-word')) $('edit-banner-word').textContent = enVal;

  // Đổi nút Lưu thành Cập Nhật
  const btnSave = $('btn-save-form-item');
  if (btnSave) {
    btnSave.innerHTML = '<span class="btn-icon">💾</span><span>Cập Nhật Dữ Liệu</span>';
  }

  updateLivePreviewCard();
}

function cancelFormEditMode() {
  BankState.editingTarget = null;
  const banner = $('form-edit-banner');
  if (banner) banner.classList.add('hidden');

  const btnSave = $('btn-save-form-item');
  if (btnSave) {
    btnSave.innerHTML = '<span class="btn-icon">💾</span><span>Lưu Vào Ngân Hàng</span>';
  }
}

function handleSaveFormItem() {
  const en = $('form-word-en')?.value.trim();
  const vi = $('form-word-vi')?.value.trim();
  const wordType = $('form-word-type')?.value;
  const grade = $('form-word-grade')?.value;
  const topic = $('form-word-topic')?.value.trim() || 'Custom Topic';
  const tagsStr = $('form-word-tags')?.value.trim();
  const exEn = $('form-example-en')?.value.trim();
  const exVi = $('form-example-vi')?.value.trim();
  const hint = $('form-word-hint')?.value.trim();
  const statusMsg = $('form-save-status');

  if (!en) {
    alert('Vui lòng nhập từ hoặc câu tiếng Anh!');
    $('form-word-en')?.focus();
    return;
  }
  if (!vi) {
    alert('Vui lòng nhập nghĩa tiếng Việt!');
    $('form-word-vi')?.focus();
    return;
  }

  const tags = tagsStr
    ? tagsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [topic.toLowerCase()];

  const allLessons = getAllLessons();

  // Case 1: Chế độ Sửa (Edit Existing Item)
  if (BankState.editingTarget) {
    const { packId, itemIndex } = BankState.editingTarget;
    const targetPack = allLessons.find(p => p.id === packId);

    if (targetPack && targetPack.items && targetPack.items[itemIndex]) {
      targetPack.items[itemIndex] = {
        ...targetPack.items[itemIndex],
        word: en,
        answer: en,
        fullSentence: en,
        meaning: vi,
        prompt: vi,
        wordType,
        tags,
        example: exEn,
        exampleMeaning: exVi,
        hint,
      };

      targetPack.tags = [...new Set([...(targetPack.tags || []), ...tags])];
      targetPack.grade = grade;
      if (topic) targetPack.unit = topic;
      targetPack.updatedAt = new Date().toISOString();

      saveLessonPack(targetPack);

      if (statusMsg) {
        statusMsg.textContent = `✅ Đã cập nhật "${en}" thành công!`;
        statusMsg.className = 'save-status-msg success';
      }

      cancelFormEditMode();
      renderBankTagChips();
      renderBankTable();
      updateBankStats();

      setTimeout(() => {
        closeWordFormModal();
        if (statusMsg) statusMsg.textContent = '';
      }, 400);
      return;
    }
  }

  // Case 2: Thêm mới (Create New Item)
  const unitId = `unit_${topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  let targetPack = allLessons.find(
    p => p.unit?.toLowerCase() === topic.toLowerCase() || p.title?.toLowerCase() === topic.toLowerCase()
  );

  if (!targetPack) {
    targetPack = createLessonPack({
      id: unitId,
      title: `Unit: ${topic.toUpperCase()}`,
      unit: topic,
      grade,
      type: BankState.activeEntryType,
      items: [],
    });
  }

  targetPack.tags = [...new Set([...(targetPack.tags || []), ...tags])];

  const newItem = {
    word: en,
    answer: en,
    fullSentence: en,
    meaning: vi,
    prompt: vi,
    wordType,
    tags,
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

  if (statusMsg) {
    statusMsg.textContent = `✅ Đã lưu "${en}" vào bộ [${targetPack.title}]!`;
    statusMsg.className = 'save-status-msg success';
    setTimeout(() => {
      statusMsg.textContent = '';
    }, 3000);
  }

  // Reset inputs for next word
  if ($('form-word-en')) $('form-word-en').value = '';
  if ($('form-word-vi')) $('form-word-vi').value = '';
  if ($('form-example-en')) $('form-example-en').value = '';
  if ($('form-example-vi')) $('form-example-vi').value = '';
  if ($('form-word-hint')) $('form-word-hint').value = '';
  $('form-word-en')?.focus();

  updateLivePreviewCard();
  updateBankStats();
  renderBankTagChips();
  renderBankTable();
}

// ─── 6. MODAL 2: Nhập File Excel / CSV ───────────────────
function initExcelImportModal() {
  const modal = $('modal-excel-import');
  const btnClose = $('btn-close-excel-modal');
  const dropzone = $('excel-dropzone');
  const fileInput = $('input-excel-file');
  const btnBrowse = $('btn-choose-excel-file');
  const btnDownloadTemplate = $('btn-download-excel-template');
  const btnCancel = $('btn-cancel-import');
  const btnConfirm = $('btn-confirm-import');

  btnClose?.addEventListener('click', closeExcelImportModal);
  modal?.addEventListener('click', e => {
    if (e.target === modal) closeExcelImportModal();
  });

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
    BankState.importedPacksTemp = null;
  });

  btnConfirm?.addEventListener('click', handleConfirmImport);

  // Global ESC key closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('modal-word-form')?.classList.contains('hidden')) {
        closeWordFormModal();
      } else if (!$('modal-excel-import')?.classList.contains('hidden')) {
        closeExcelImportModal();
      }
    }
  });
}

export function openExcelImportModal() {
  const modal = $('modal-excel-import');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

export function closeExcelImportModal() {
  const modal = $('modal-excel-import');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
  $('excel-preview-section')?.classList.add('hidden');
  $('excel-dropzone')?.classList.remove('hidden');
  const fileInput = $('input-excel-file');
  if (fileInput) fileInput.value = '';
  BankState.importedPacksTemp = null;
}

async function handleExcelFileUpload(file) {
  try {
    const dropzone = $('excel-dropzone');
    const previewSection = $('excel-preview-section');

    const result = await readExcelOrCSVFile(file);
    BankState.importedPacksTemp = result.packs;

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
      <td><span class="type-pill">${escapeHtml(row.wordType || 'Từ vựng')}</span></td>
      <td class="text-subtle">${escapeHtml(row.example || '-')}</td>
    `;
    tbody.appendChild(tr);
  });

  if (items.length > 10) {
    const trMore = document.createElement('tr');
    trMore.innerHTML = `
      <td colspan="6" style="text-align: center; color: #64748b; font-style: italic; padding: 10px;">
        ... và ${items.length - 10} mục nữa sẵn sàng nạp vào ngân hàng
      </td>
    `;
    tbody.appendChild(trMore);
  }
}

function handleConfirmImport() {
  if (!BankState.importedPacksTemp || BankState.importedPacksTemp.length === 0) {
    alert('Không có dữ liệu hợp lệ để lưu!');
    return;
  }

  BankState.importedPacksTemp.forEach(pack => {
    saveLessonPack(pack);
  });

  alert(`🎉 Thành công! Đã nạp ${BankState.importedPacksTemp.length} bài học vào Ngân Hàng Giáo Viên!`);

  closeExcelImportModal();
  updateBankStats();
  renderBankTagChips();
  renderBankTable();
}

// ─── 7. Hỗ Trợ Phát Âm (Web Speech API) ──────────────────
function speakWord(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Auto Bootstrap On Load ─────────────────────────────
document.addEventListener('DOMContentLoaded', initBankPage);
