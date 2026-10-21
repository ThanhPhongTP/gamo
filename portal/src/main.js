/**
 * ========================================================
 * GAMO Portal — Main Application Logic (Arcade Homepage)
 * ========================================================
 * - Clean Game Arena Homepage (Focused on Game Grid)
 * - Launchers for Word Bubble Pop & Sentence Bridge Builder
 * - Auto sync with Lesson Packs from @gamo/content
 */

import {
  getAllLessons,
} from '@gamo/content';

// ─── DOM Selector Helper ─────────────────────────────────
const $ = id => document.getElementById(id);

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
        opt.textContent = `⭐ ${p.title} (${p.items?.length || 0} từ)`;
        optgroupCustom.appendChild(opt);
      });
      bubbleSelect.appendChild(optgroupCustom);
    }

    // Group: Bài SGK Chuẩn
    const optgroupSGK = document.createElement('optgroup');
    optgroupSGK.label = '📚 Sách Giáo Khoa Chuẩn';
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

    const customSentencePacks = sentencePacks.filter(p => !p.id.startsWith('pack_sentence_'));
    if (customSentencePacks.length > 0) {
      const optgroupCustom = document.createElement('optgroup');
      optgroupCustom.label = '⭐ Bài Của Giáo Viên (Tự nạp)';
      customSentencePacks.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `⭐ ${p.title} (${p.items?.length || 0} câu)`;
        optgroupCustom.appendChild(opt);
      });
      bridgeSelect.appendChild(optgroupCustom);
    }

    const optgroupSGK = document.createElement('optgroup');
    optgroupSGK.label = '📚 Mẫu Câu Lớp Học Chuẩn';
    sentencePacks.forEach(p => {
      if (p.id.startsWith('pack_sentence_')) {
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
}

function updateBankCountBadge() {
  const allLessons = getAllLessons();
  let totalItems = 0;
  allLessons.forEach(p => {
    totalItems += p.items?.length || 0;
  });

  const badge = $('portal-bank-total-badge');
  if (badge) badge.textContent = `${totalItems} mục`;
}

// ─── Auto Bootstrap On Load ─────────────────────────────
document.addEventListener('DOMContentLoaded', initPortal);
