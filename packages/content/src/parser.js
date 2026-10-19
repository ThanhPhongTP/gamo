/**
 * =============================================
 * @gamo/content — Smart Text Parser
 * =============================================
 * Cho phép giáo viên dán văn bản tự do từ Word, Excel, Zalo, Web
 * và tự động phân tích thành các cặp câu hỏi/từ vựng chuẩn.
 */

import { normalizeItem } from './schema.js';

/**
 * Parses raw text input into normalized items.
 * Supports:
 * - Tab-separated (Excel / Google Sheets)
 * - Colon, hyphen, equal sign, comma separated
 * - Numbered lists (1. cat: con mèo)
 * - Slash separated (cat / con mèo)
 * 
 * @param {string} rawText
 * @returns {Array<Object>} List of normalized items
 */
export function parseSmartText(rawText = '') {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const parsedItems = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Remove leading bullet points or numbers like "1. ", "1/ ", "- ", "• ", "* "
    line = line.replace(/^(\d+[\.\)\/\-:]\s*|[-•*+]\s*)/, '').trim();
    if (!line) continue;

    // Extract optional pipe metadata: "| distractors: a, b" or "| hint: S + V"
    let distractors = [];
    let hint = '';
    if (line.includes('|')) {
      const segments = line.split('|');
      line = segments[0].trim();
      for (let s = 1; s < segments.length; s++) {
        const seg = segments[s].trim();
        if (seg.toLowerCase().startsWith('distractor') || seg.toLowerCase().startsWith('bẫy') || seg.toLowerCase().startsWith('wrong')) {
          const colonIdx = seg.indexOf(':');
          const dStr = colonIdx !== -1 ? seg.substring(colonIdx + 1) : seg;
          distractors = dStr.split(',').map(d => d.trim()).filter(Boolean);
        } else if (seg.toLowerCase().startsWith('hint') || seg.toLowerCase().startsWith('gợi ý') || seg.toLowerCase().startsWith('pattern')) {
          const colonIdx = seg.indexOf(':');
          hint = colonIdx !== -1 ? seg.substring(colonIdx + 1).trim() : seg;
        } else if (!hint) {
          hint = seg;
        }
      }
    }

    // Detect separator in order of common delimiters
    let left = '';
    let right = '';

    if (line.includes('\t')) {
      // Tab-separated (Excel / Sheets copy)
      const parts = line.split('\t').map(s => s.trim()).filter(Boolean);
      left = parts[0];
      right = parts.slice(1).join(' - ');
    } else if (line.includes(':')) {
      const idx = line.indexOf(':');
      left = line.substring(0, idx).trim();
      right = line.substring(idx + 1).trim();
    } else if (line.includes(' - ') || line.includes(' – ') || line.includes(' — ')) {
      const parts = line.split(/\s+[-–—]\s+/);
      left = parts[0]?.trim();
      right = parts.slice(1).join(' - ').trim();
    } else if (line.includes('=')) {
      const parts = line.split('=');
      left = parts[0]?.trim();
      right = parts.slice(1).join('=').trim();
    } else if (line.includes('/')) {
      const parts = line.split('/');
      left = parts[0]?.trim();
      right = parts.slice(1).join('/').trim();
    } else if (line.includes(',')) {
      const idx = line.indexOf(',');
      left = line.substring(0, idx).trim();
      right = line.substring(idx + 1).trim();
    }

    if (left && right) {
      // Auto-detect English vs Vietnamese
      // If right has Vietnamese diacritics and left doesn't, left = answer (English), right = prompt (Vietnamese)
      const isRightVietnamese = hasVietnameseDiacritics(right);
      const isLeftVietnamese = hasVietnameseDiacritics(left);

      let sentenceOrWord = left;
      let meaning = right;

      if (!isRightVietnamese && isLeftVietnamese) {
        // Left is Vietnamese meaning, right is English word/sentence
        sentenceOrWord = right;
        meaning = left;
      }

      parsedItems.push(normalizeItem({
        fullSentence: sentenceOrWord,
        word: sentenceOrWord,
        meaning,
        distractors,
        hint,
      }, parsedItems.length));
    }
  }

  return parsedItems;
}

/**
 * Checks if a string contains typical Vietnamese diacritics
 */
export function hasVietnameseDiacritics(str = '') {
  const pattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
  return pattern.test(str);
}
