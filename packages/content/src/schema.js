/**
 * =============================================
 * @gamo/content — Universal Content Schema
 * =============================================
 * "1 lần nạp, vạn game chơi" — Standard data contract for all GAMO games.
 */

/**
 * Creates a normalized Lesson Pack object.
 * @param {Object} options
 * @returns {Object} Normalized LessonPack
 */
export function createLessonPack({
  id = null,
  title = 'Bài học mới',
  grade = 'primary', // 'primary' (tiểu học) | 'secondary' (cấp 2) | 'high' (cấp 3)
  type = 'vocab',    // 'vocab' (từ vựng) | 'quiz' (trắc nghiệm) | 'mixed'
  unit = '',
  description = '',
  items = [],
} = {}) {
  const packId = id || `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const normalizedItems = (items || []).map((item, index) => {
    return normalizeItem(item, index);
  });

  return {
    id: packId,
    title: title.trim() || 'Bài học không tên',
    grade,
    type,
    unit: unit.trim(),
    description: description.trim(),
    itemCount: normalizedItems.length,
    items: normalizedItems,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Normalizes a single question / word item.
 */
export function normalizeItem(item, index = 0) {
  // Support flexible input forms:
  // 1. { word: 'cat', meaning: 'con mèo' }
  // 2. { prompt: 'con mèo', answer: 'cat' }
  // 3. { question: '...', answer: '...', options: [...] }
  const answer = (item.answer || item.word || '').trim();
  const prompt = (item.prompt || item.meaning || item.question || '').trim();

  return {
    id: item.id || `item_${index + 1}_${Date.now()}`,
    prompt,                   // Câu hỏi / Nghĩa tiếng Việt / Gợi ý
    answer,                   // Từ tiếng Anh / Đáp án đúng
    ipa: (item.ipa || '').trim(), // Phiên âm (vd: /kæt/)
    example: (item.example || '').trim(), // Câu ví dụ
    image: item.image || null,
    audio: item.audio || null,
    distractors: Array.isArray(item.distractors) ? item.distractors : (item.options || []).filter(o => o !== answer),
  };
}

/**
 * Validates a lesson pack.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateLessonPack(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') {
    return { valid: false, errors: ['Dữ liệu bài học không hợp lệ'] };
  }
  if (!pack.title || pack.title.trim() === '') {
    errors.push('Tên bài học không được để trống');
  }
  if (!Array.isArray(pack.items) || pack.items.length < 4) {
    errors.push('Bài học cần có ít nhất 4 từ vựng / câu hỏi để có thể bắt đầu trò chơi');
  }

  // Check each item
  pack.items?.forEach((item, idx) => {
    if (!item.answer || !item.prompt) {
      errors.push(`Mục thứ ${idx + 1} thiếu câu hỏi hoặc câu trả lời`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
