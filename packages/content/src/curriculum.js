/**
 * =============================================
 * @gamo/content — Pre-built Curriculum Library
 * =============================================
 * Kho bài học chuẩn hóa sẵn theo chương trình tiếng Anh Việt Nam & Quốc tế.
 * Giáo viên chọn 1 click là có ngay bài giảng đầy đủ.
 */

import { createLessonPack } from './schema.js';

export const CURRICULUM_LIBRARY = [
  // ─── CẤP 1 (Tiểu Học / Primary) ────────────────
  createLessonPack({
    id: 'pack_primary_animals',
    title: 'Unit 3: Cute Animals (Thế Giới Động Vật)',
    grade: 'primary',
    type: 'vocab',
    unit: 'Unit 3',
    description: 'Từ vựng các con vật nuôi và hoang dã quen thuộc',
    items: [
      { prompt: 'con mèo', answer: 'cat', ipa: '/kæt/' },
      { prompt: 'con chó', answer: 'dog', ipa: '/dɒɡ/' },
      { prompt: 'con chim', answer: 'bird', ipa: '/bɜːd/' },
      { prompt: 'con cá', answer: 'fish', ipa: '/fɪʃ/' },
      { prompt: 'con thỏ', answer: 'rabbit', ipa: '/ˈræb.ɪt/' },
      { prompt: 'con voi', answer: 'elephant', ipa: '/ˈel.ɪ.fənt/' },
      { prompt: 'con hổ', answer: 'tiger', ipa: '/ˈtaɪ.ɡər/' },
      { prompt: 'con khỉ', answer: 'monkey', ipa: '/ˈmʌŋ.ki/' },
      { prompt: 'con vịt', answer: 'duck', ipa: '/dʌk/' },
      { prompt: 'con sư tử', answer: 'lion', ipa: '/ˈlaɪ.ən/' },
    ],
  }),

  createLessonPack({
    id: 'pack_primary_school',
    title: 'Unit 1: In the Classroom (Đồ Dùng Học Tập)',
    grade: 'primary',
    type: 'vocab',
    unit: 'Unit 1',
    description: 'Từ vựng đồ dùng học tập lớp học quen thuộc',
    items: [
      { prompt: 'quyển sách', answer: 'book', ipa: '/bʊk/' },
      { prompt: 'cây bút mực', answer: 'pen', ipa: '/pen/' },
      { prompt: 'cây bút chì', answer: 'pencil', ipa: '/ˈpen.səl/' },
      { prompt: 'cây thước kẻ', answer: 'ruler', ipa: '/ˈruː.lər/' },
      { prompt: 'cục tẩy / gôm', answer: 'eraser', ipa: '/ɪˈreɪ.zər/' },
      { prompt: 'cặp sách / ba lô', answer: 'school bag', ipa: '/ˈskuːl bæɡ/' },
      { prompt: 'cái bàn học', answer: 'desk', ipa: '/desk/' },
      { prompt: 'cái ghế', answer: 'chair', ipa: '/tʃeər/' },
      { prompt: 'cái bảng đen', answer: 'blackboard', ipa: '/ˈblæk.bɔːd/' },
    ],
  }),

  createLessonPack({
    id: 'pack_primary_food',
    title: 'Unit 5: Food & Drinks (Món Ăn & Thức Uống)',
    grade: 'primary',
    type: 'vocab',
    unit: 'Unit 5',
    description: 'Từ vựng các món ăn ngon và đồ uống hằng ngày',
    items: [
      { prompt: 'quả táo', answer: 'apple', ipa: '/ˈæp.əl/' },
      { prompt: 'quả chuối', answer: 'banana', ipa: '/bəˈnɑː.nə/' },
      { prompt: 'cơm / gạo', answer: 'rice', ipa: '/raɪs/' },
      { prompt: 'bánh mì', answer: 'bread', ipa: '/bred/' },
      { prompt: 'sữa tươi', answer: 'milk', ipa: '/mɪlk/' },
      { prompt: 'quả trứng', answer: 'egg', ipa: '/eɡ/' },
      { prompt: 'nước lọc', answer: 'water', ipa: '/ˈwɔː.tər/' },
      { prompt: 'thịt gà', answer: 'chicken', ipa: '/ˈtʃɪk.ɪn/' },
    ],
  }),

  // ─── CẤP 2 (THCS / Secondary) ─────────────────
  createLessonPack({
    id: 'pack_sec_hobbies',
    title: 'Unit 1: My Hobbies (Sở Thích & Đam Mê)',
    grade: 'secondary',
    type: 'vocab',
    unit: 'Unit 1',
    description: 'Từ vựng sở thích nâng cao chương trình Lớp 7 Global Success',
    items: [
      { prompt: 'làm vườn', answer: 'gardening', ipa: '/ˈɡɑː.dən.ɪŋ/' },
      { prompt: 'cưỡi ngựa', answer: 'horse riding', ipa: '/ˈhɔːs ˌraɪ.dɪŋ/' },
      { prompt: 'làm đồ thủ công', answer: 'making crafts', ipa: '/ˈmeɪ.kɪŋ krɑːfts/' },
      { prompt: 'vẽ tranh sơn dầu', answer: 'painting', ipa: '/ˈpeɪn.tɪŋ/' },
      { prompt: 'nhiếp ảnh / chụp ảnh', answer: 'photography', ipa: '/fəˈtɒɡ.rə.fi/' },
      { prompt: 'sưu tầm tem', answer: 'collecting stamps', ipa: '/kəˈlek.tɪŋ stæmps/' },
      { prompt: 'chơi cờ vua', answer: 'playing chess', ipa: '/ˈpleɪ.ɪŋ tʃes/' },
      { prompt: 'trượt băng', answer: 'ice skating', ipa: '/ˈaɪs ˌskeɪ.tɪŋ/' },
    ],
  }),

  createLessonPack({
    id: 'pack_sec_environment',
    title: 'Unit 8: Green Living (Bảo Vệ Môi Trường)',
    grade: 'secondary',
    type: 'vocab',
    unit: 'Unit 8',
    description: 'Từ vựng sinh thái và môi trường sống xanh',
    items: [
      { prompt: 'tái chế', answer: 'recycle', ipa: '/ˌriːˈsaɪ.kəl/' },
      { prompt: 'năng lượng mặt trời', answer: 'solar energy', ipa: '/ˈsəʊ.lər ˈen.ə.dʒi/' },
      { prompt: 'ô nhiễm không khí', answer: 'air pollution', ipa: '/eər pəˈluː.ʃən/' },
      { prompt: 'rác thải nhựa', answer: 'plastic waste', ipa: '/ˈplæs.tɪk weɪst/' },
      { prompt: 'dấu chân carbon', answer: 'carbon footprint', ipa: '/ˌkɑː.bən ˈfʊt.prɪnt/' },
      { prompt: 'bảo tồn thiên nhiên', answer: 'conservation', ipa: '/ˌkɒn.səˈveɪ.ʃən/' },
      { prompt: 'sự ấm lên toàn cầu', answer: 'global warming', ipa: '/ˌɡləʊ.bəl ˈwɔː.mɪŋ/' },
    ],
  }),

  // ─── CẤP 3 (THPT / High School) ───────────────
  createLessonPack({
    id: 'pack_high_future_jobs',
    title: 'Unit 5: The World of Work (Nghề Nghiệp Tương Lai)',
    grade: 'high',
    type: 'vocab',
    unit: 'Unit 5',
    description: 'Từ vựng chuyên ngành nghề nghiệp thế kỷ 21',
    items: [
      { prompt: 'chuyên gia trí tuệ nhân tạo', answer: 'AI specialist', ipa: '/ˌeɪˈaɪ ˈspeʃ.əl.ɪst/' },
      { prompt: 'kỹ sư dữ liệu lớn', answer: 'data engineer', ipa: '/ˈdeɪ.tə ˌen.dʒɪˈnɪər/' },
      { prompt: 'nhà khởi nghiệp sáng tạo', answer: 'entrepreneur', ipa: '/ˌɒn.trə.prəˈnɜːr/' },
      { prompt: 'an ninh mạng', answer: 'cybersecurity', ipa: '/ˌsaɪ.bə.sɪˈkjʊə.rə.ti/' },
      { prompt: 'tư duy phản biện', answer: 'critical thinking', ipa: '/ˌkrɪt.ɪ.kəl ˈθɪŋ.kɪŋ/' },
      { prompt: 'khả năng thích ứng', answer: 'adaptability', ipa: '/əˌdæp.təˈbɪl.ə.ti/' },
      { prompt: 'làm việc từ xa linh hoạt', answer: 'remote working', ipa: '/rɪˈməʊt ˈwɜː.kɪŋ/' },
    ],
  }),

  // ─── CẤP 1 — MẪU CÂU (Sentence Patterns / Primary) ─────────
  createLessonPack({
    id: 'pack_sentence_daily',
    title: 'Mẫu Câu: Hoạt Động Thường Ngày (Daily Actions)',
    grade: 'primary',
    type: 'sentence',
    unit: 'Grammar Unit 1',
    description: 'Luyện tập ghép câu miêu tả hoạt động hằng ngày và sở thích',
    items: [
      {
        prompt: 'Cô ấy đang đọc một quyển sách.',
        fullSentence: 'She is reading a book',
        chunks: ['She', 'is', 'reading', 'a book'],
        distractors: ['are', 'reads'],
        pattern: 'Present Continuous (S + is/are + V-ing)',
        hint: 'Chủ ngữ "She" đi với "is" + động từ thêm "-ing"',
      },
      {
        prompt: 'Tôi thích chơi bóng đá cùng bạn bè.',
        fullSentence: 'I like playing soccer with my friends',
        chunks: ['I', 'like', 'playing soccer', 'with my friends'],
        distractors: ['likes', 'play'],
        pattern: 'Like + V-ing',
        hint: 'Sau "like" dùng danh động từ V-ing',
      },
      {
        prompt: 'Họ đang bơi trong hồ bơi.',
        fullSentence: 'They are swimming in the pool',
        chunks: ['They', 'are', 'swimming', 'in the pool'],
        distractors: ['is', 'swim'],
        pattern: 'Present Continuous (They + are + V-ing)',
        hint: 'Chủ ngữ "They" số nhiều đi với "are"',
      },
      {
        prompt: 'Anh ấy thức dậy lúc sáu giờ sáng.',
        fullSentence: 'He gets up at six o clock',
        chunks: ['He', 'gets up', 'at', 'six o clock'],
        distractors: ['get', 'on'],
        pattern: 'Present Simple (He + V-s/es)',
        hint: 'Giờ giấc đi với giới từ "at"',
      },
      {
        prompt: 'Chúng tôi đi bộ đến trường mỗi ngày.',
        fullSentence: 'We walk to school every day',
        chunks: ['We', 'walk', 'to school', 'every day'],
        distractors: ['walks', 'at school'],
        pattern: 'Present Simple with We',
        hint: '"We" đi với động từ nguyên mẫu',
      },
      {
        prompt: 'Em trai tôi có thể đi xe đạp rất giỏi.',
        fullSentence: 'My brother can ride a bike well',
        chunks: ['My brother', 'can', 'ride a bike', 'well'],
        distractors: ['rides', 'riding'],
        pattern: 'Modal verb: Can + V-infinitive',
        hint: 'Sau "can" luôn là động từ nguyên mẫu',
      },
    ],
  }),

  createLessonPack({
    id: 'pack_sentence_asking',
    title: 'Mẫu Câu: Giao Tiếp & Hỏi Đáp (Conversational Q&A)',
    grade: 'secondary',
    type: 'sentence',
    unit: 'Communication Unit 2',
    description: 'Luyện tập các câu hỏi và câu trả lời thông dụng trong giao tiếp',
    items: [
      {
        prompt: 'Bạn đến từ đâu?',
        fullSentence: 'Where do you come from',
        chunks: ['Where', 'do', 'you', 'come from'],
        distractors: ['does', 'are'],
        pattern: 'Wh- question: Where + do + S + V?',
        hint: 'Hỏi quê quán, xuất thân của bạn',
      },
      {
        prompt: 'Bạn có muốn uống một ly nước cam không?',
        fullSentence: 'Would you like some orange juice',
        chunks: ['Would you like', 'some', 'orange juice'],
        distractors: ['Do you want', 'any'],
        pattern: 'Polite Offer: Would you like + noun?',
        hint: 'Lời mời lịch sự dùng "Would you like"',
      },
      {
        prompt: 'Hôm nay thời tiết thế nào?',
        fullSentence: 'What is the weather like today',
        chunks: ['What', 'is', 'the weather like', 'today'],
        distractors: ['how', 'are'],
        pattern: 'What is ... like?',
        hint: '"What is ... like" dùng để hỏi đặc điểm thời tiết',
      },
      {
        prompt: 'Bạn thường đi học bằng phương tiện gì?',
        fullSentence: 'How do you go to school',
        chunks: ['How', 'do you', 'go to school'],
        distractors: ['What', 'goes'],
        pattern: 'How + do + you + V?',
        hint: '"How" dùng để hỏi cách thức, phương tiện',
      },
      {
        prompt: 'Bao lâu bạn đọc sách một lần?',
        fullSentence: 'How often do you read books',
        chunks: ['How often', 'do you', 'read books'],
        distractors: ['How long', 'reads'],
        pattern: 'Frequency: How often + do + S + V?',
        hint: '"How often" hỏi mức độ thường xuyên',
      },
    ],
  }),
];

/**
 * Get curriculum filtered by grade level
 */
export function getCurriculumByGrade(grade = 'all') {
  if (grade === 'all') return CURRICULUM_LIBRARY;
  return CURRICULUM_LIBRARY.filter(pack => pack.grade === grade);
}

/**
 * Find pack by ID
 */
export function getCurriculumById(id) {
  return CURRICULUM_LIBRARY.find(pack => pack.id === id) || null;
}
