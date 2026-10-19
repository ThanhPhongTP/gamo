/**
 * =============================================
 * @gamo/content — Game Adapters
 * =============================================
 * Biến đổi Universal Lesson Pack thành câu hỏi & format phù hợp
 * cho từng game cụ thể (Bubble Pop, Trắc nghiệm, Game 3D, Lật thẻ...).
 */

/**
 * Transforms a lesson pack into questions for Word Bubble Pop game.
 * 
 * @param {Object} pack - LessonPack
 * @param {Object} options - { mode: 'meaning' | 'word' | 'both' }
 * @returns {Array<Object>} List of Bubble Pop questions
 */
export function toBubblePopQuestions(pack, { mode = 'meaning' } = {}) {
  if (!pack || !Array.isArray(pack.items)) return [];

  const allItems = pack.items;

  return allItems.map((item, index) => {
    const isWordToMeaning = mode === 'word'
      ? true
      : mode === 'meaning'
        ? false
        : Math.random() > 0.5;

    // Prompt = Câu hỏi hiển thị trên bảng
    // Answer = Bong bóng học sinh cần bắn vỡ
    const question = isWordToMeaning ? item.answer : item.prompt;
    const answer   = isWordToMeaning ? item.prompt : item.answer;

    // Build distractors from remaining items in the pack
    const pool = allItems
      .filter((_, i) => i !== index)
      .map(other => isWordToMeaning ? other.prompt : other.answer);

    const shuffledPool = shuffleArray(pool);
    const distractors  = shuffledPool.slice(0, 7);

    return {
      id: item.id || `q_${index}`,
      question,
      answer,
      distractors,
      ipa: item.ipa || '',
      originalItem: item,
    };
  });
}

/**
 * Transforms a lesson pack into multiple choice quiz format.
 */
export function toQuizQuestions(pack) {
  if (!pack || !Array.isArray(pack.items)) return [];

  return pack.items.map((item, index) => {
    const wrongPool = pack.items
      .filter((_, i) => i !== index)
      .map(other => other.answer);

    const distractors = shuffleArray(wrongPool).slice(0, 3);
    const options = shuffleArray([item.answer, ...distractors]);

    return {
      id: item.id || `quiz_${index}`,
      question: item.prompt,
      correctAnswer: item.answer,
      options,
      ipa: item.ipa || '',
    };
  });
}

/**
 * Transforms a lesson pack into pairs for Memory Match cards.
 */
export function toMemoryCardPairs(pack) {
  if (!pack || !Array.isArray(pack.items)) return [];

  const cards = [];
  pack.items.forEach((item, index) => {
    cards.push({
      id: `pair_${index}_a`,
      pairId: index,
      type: 'word',
      content: item.answer,
    });
    cards.push({
      id: `pair_${index}_b`,
      pairId: index,
      type: 'meaning',
      content: item.prompt,
    });
  });

  return shuffleArray(cards);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
