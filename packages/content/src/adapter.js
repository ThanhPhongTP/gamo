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

/**
 * Transforms a lesson pack into questions for Sentence Bridge game (xây cầu vượt sông).
 * 
 * @param {Object} pack - LessonPack
 * @param {Object} options - { difficulty: 'easy' | 'medium' | 'hard', maxDistractors }
 * @returns {Array<Object>} List of Bridge Building questions
 */
export function toSentenceBridgeQuestions(pack, { difficulty = 'medium', maxDistractors = null } = {}) {
  if (!pack || !Array.isArray(pack.items)) return [];

  const defaultDistractorCount = difficulty === 'easy' ? 1 : difficulty === 'hard' ? 4 : 2;
  const targetDistractorCount = typeof maxDistractors === 'number' ? maxDistractors : defaultDistractorCount;

  const allItems = pack.items;

  return allItems.map((item, index) => {
    const rawChunks = Array.isArray(item.chunks) && item.chunks.length > 0
      ? item.chunks
      : (item.fullSentence || item.answer || '').split(/\s+/).filter(Boolean);

    // Target bricks in correct sequence
    const targetChunks = rawChunks.map((chunk, i) => ({
      id: `tgt_${index}_${i}`,
      text: chunk,
      isTarget: true,
      targetIndex: i,
    }));

    // Distractor bricks
    let distractorTexts = Array.isArray(item.distractors) && item.distractors.length > 0
      ? [...item.distractors]
      : [];

    // If not enough distractors, borrow from other items' chunks
    if (distractorTexts.length < targetDistractorCount) {
      const otherChunks = allItems
        .filter((_, i) => i !== index)
        .flatMap(other => other.chunks || [])
        .filter(c => !rawChunks.includes(c));

      const sampled = shuffleArray(otherChunks).slice(0, targetDistractorCount - distractorTexts.length);
      distractorTexts.push(...sampled);
    }

    const distractorChunks = distractorTexts.slice(0, targetDistractorCount).map((text, i) => ({
      id: `dist_${index}_${i}`,
      text,
      isTarget: false,
      targetIndex: -1,
    }));

    // Pool of all bricks to display in river/tray
    const pool = shuffleArray([...targetChunks, ...distractorChunks]);

    return {
      id: item.id || `bridge_${index}`,
      prompt: item.prompt,
      fullSentence: item.fullSentence || item.answer,
      chunks: rawChunks,
      targetCount: rawChunks.length,
      distractorTexts,
      bricks: pool,
      pattern: item.pattern || '',
      hint: item.hint || item.pattern || '',
      ipa: item.ipa || '',
      originalItem: item,
    };
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

