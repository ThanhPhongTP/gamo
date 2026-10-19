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
