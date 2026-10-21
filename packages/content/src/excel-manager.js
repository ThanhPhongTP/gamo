/**
 * =============================================
 * @gamo/content — Excel & CSV Lesson Data Manager
 * =============================================
 * Quản lý đọc, ghi và xuất file Excel / CSV cho giáo viên.
 * Hoàn toàn chạy trên Client (Local-First / Serverless).
 */

import { createLessonPack, normalizeItem } from './schema.js';
import { getAllLessons, saveLessonPack } from './storage.js';

/**
 * Tạo nội dung file CSV mẫu chuẩn cho Giáo Viên.
 * Kèm UTF-8 BOM (\uFEFF) để Excel hiển thị tiếng Việt có dấu chuẩn 100%.
 */
export function generateSampleCSV() {
  const headers = [
    'Unit',
    'Loai_Bai',
    'Cap_Hoc',
    'Tieng_Anh',
    'Nghia_Tieng_Viet',
    'Phien_Am_IPA',
    'Loai_Tu',
    'Vi_Du_Tieng_Anh',
    'Nghia_Vi_Du',
    'Goi_Y_Cau_Hoi',
  ];

  const sampleRows = [
    [
      'Unit 1: Animals',
      'vocab',
      'primary',
      'bee',
      'con ong',
      '/biː/',
      'Danh từ (Noun)',
      'A yellow bee lands on the flower.',
      'Một chú ong vàng đậu lên bông hoa.',
      'Loài côn trùng có cánh nhiều sọc vàng đen chăm chỉ làm mật',
    ],
    [
      'Unit 1: Animals',
      'vocab',
      'primary',
      'butterfly',
      'con bướm',
      '/ˈbʌt.ə.flaɪ/',
      'Danh từ (Noun)',
      'The butterfly has colorful wings.',
      'Con bướm có đôi cánh nhiều màu sắc.',
      'Loài côn trùng có cánh nhiều màu sắc bay lượn quanh hoa',
    ],
    [
      'Unit 1: Animals',
      'vocab',
      'primary',
      'dolphin',
      'cá heo',
      '/ˈdɒl.fɪn/',
      'Danh từ (Noun)',
      'Dolphins are very friendly and smart.',
      'Cá heo rất thân thiện và thông minh.',
      'Loài động vật có vú sống dưới biển rất thông minh',
    ],
    [
      'Unit 1: Animals',
      'vocab',
      'primary',
      'elephant',
      'con voi',
      '/ˈel.ɪ.fənt/',
      'Danh từ (Noun)',
      'The elephant has a long trunk.',
      'Con voi có một chiếc vòi dài.',
      'Động vật to lớn nhất trên cạn có ngà và vòi dài',
    ],
    [
      'Unit 2: Daily Routines',
      'sentence',
      'primary',
      '[She] [is reading] [a book]',
      'Cô ấy đang đọc sách',
      '',
      '',
      'She is reading a book in the library.',
      'Cô ấy đang đọc một quyển sách trong thư viện.',
      'Thì hiện tại tiếp diễn với chủ ngữ She',
    ],
    [
      'Unit 2: Daily Routines',
      'sentence',
      'primary',
      '[They] [play football] [after school]',
      'Họ chơi bóng đá sau giờ học',
      '',
      '',
      'They play football in the school yard.',
      'Họ chơi bóng đá ở sân trường.',
      'Thì hiện tại đơn diễn tả thói quen',
    ],
  ];

  const csvRows = [
    headers.join(','),
    ...sampleRows.map(row =>
      row
        .map(cell => {
          const str = String(cell || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ];

  return '\uFEFF' + csvRows.join('\r\n');
}

/**
 * Tải file CSV mẫu về máy giáo viên
 */
export function downloadSampleCSV(filename = 'GAMO_Mau_Nhap_De_Giao_Vien.csv') {
  const content = generateSampleCSV();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất một LessonPack hoặc toàn bộ ngân hàng bài học ra file CSV
 */
export function exportLessonsToCSV(lessons = null, filename = 'GAMO_Ngan_Hang_Tu_Vung.csv') {
  const packs = lessons || getAllLessons();
  const headers = [
    'Unit',
    'Loai_Bai',
    'Cap_Hoc',
    'Tieng_Anh',
    'Nghia_Tieng_Viet',
    'Phien_Am_IPA',
    'Loai_Tu',
    'Vi_Du_Tieng_Anh',
    'Nghia_Vi_Du',
    'Goi_Y_Cau_Hoi',
  ];

  const rows = [];
  packs.forEach(pack => {
    const unitName = pack.unit || pack.title || 'Chủ đề chung';
    const type = pack.type || 'vocab';
    const grade = pack.grade || 'primary';

    (pack.items || []).forEach(item => {
      const en = item.fullSentence || item.answer || item.word || '';
      const vi = item.prompt || item.meaning || '';
      const ipa = item.ipa || '';
      const wordType = item.wordType || item.pattern || '';
      const ex = item.example || '';
      const exVi = item.exampleMeaning || '';
      const hint = item.hint || '';

      rows.push([
        unitName,
        type,
        grade,
        en,
        vi,
        ipa,
        wordType,
        ex,
        exVi,
        hint,
      ]);
    });
  });

  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(cell => {
          const str = String(cell || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ];

  const content = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Đọc file CSV dạng text và chuyển đổi thành danh sách dòng đối tượng
 */
export function parseCSVText(text) {
  if (!text) return [];

  // Chuẩn hóa dòng
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  const lines = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentLine += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length < 2) return [];

  // Parse header
  const parseRow = rowStr => {
    const cells = [];
    let cell = '';
    let inQ = false;
    for (let j = 0; j < rowStr.length; j++) {
      const c = rowStr[j];
      const nc = rowStr[j + 1];
      if (c === '"' && inQ && nc === '"') {
        cell += '"';
        j++;
      } else if (c === '"') {
        inQ = !inQ;
      } else if (c === ',' && !inQ) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const rawHeaders = parseRow(lines[0]);
  const headers = rawHeaders.map(h => normalizeHeader(h));

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const row = parseRow(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    items.push(obj);
  }

  return items;
}

/**
 * Chuẩn hóa tên cột để hỗ trợ cả tiếng Việt có dấu, không dấu, hoặc tiếng Anh
 */
function normalizeHeader(header) {
  const h = (header || '').toLowerCase().trim().replace(/[\s_\-]+/g, '');
  if (h.includes('tienganh') || h.includes('word') || h.includes('tuvung') || h.includes('english') || h.includes('cau')) {
    return 'english';
  }
  if (h.includes('tiengviet') || h.includes('nghia') || h.includes('meaning') || h.includes('vietnamese')) {
    return 'vietnamese';
  }
  if (h.includes('phienam') || h.includes('ipa')) {
    return 'ipa';
  }
  if (h.includes('loaitu') || h.includes('wordtype') || h.includes('pos')) {
    return 'wordType';
  }
  if (h.includes('unit') || h.includes('chude') || h.includes('baihoc') || h.includes('topic')) {
    return 'unit';
  }
  if (h.includes('caphoc') || h.includes('grade') || h.includes('lop')) {
    return 'grade';
  }
  if (h.includes('loaibai') || h.includes('type')) {
    return 'type';
  }
  if (h.includes('vidu') || h.includes('example')) {
    return 'example';
  }
  if (h.includes('nghiavidu') || h.includes('examplemeaning')) {
    return 'exampleMeaning';
  }
  if (h.includes('goiy') || h.includes('hint')) {
    return 'hint';
  }
  return h;
}

/**
 * Đọc file Excel (.xlsx, .xls) hoặc CSV do người dùng chọn và chuyển thành các bài học LessonPack
 * Hỗ trợ tự động tải thư viện SheetJS (XLSX) từ CDN nếu file là định dạng nhị phân Excel.
 * @param {File} file 
 * @returns {Promise<{ packs: Array<Object>, items: Array<Object>, rawCount: number }>}
 */
export async function readExcelOrCSVFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  let rawRows = [];

  if (extension === 'csv' || extension === 'txt') {
    const text = await file.text();
    rawRows = parseCSVText(text);
  } else if (extension === 'xlsx' || extension === 'xls') {
    // Đọc Excel qua SheetJS (load dynamic nếu chưa có trên window)
    await loadXLSXLibrary();
    const data = await file.arrayBuffer();
    const workbook = window.XLSX.read(data, { type: 'array' });
    
    // Lấy sheet đầu tiên hoặc nối các sheets
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (json && json.length > 1) {
      const headerRow = json[0].map(h => normalizeHeader(String(h || '')));
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (!row || row.length === 0) continue;
        const obj = {};
        headerRow.forEach((h, idx) => {
          obj[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
        });
        if (obj.english || obj.vietnamese) {
          rawRows.push(obj);
        }
      }
    }
  } else {
    throw new Error('Định dạng file không được hỗ trợ. Vui lòng chọn file .csv hoặc .xlsx!');
  }

  if (rawRows.length === 0) {
    throw new Error('Không tìm thấy dữ liệu từ vựng hợp lệ trong file!');
  }

  // Nhóm các mục theo Unit / Bài học
  const unitGroups = {};

  rawRows.forEach(row => {
    const en = (row.english || '').trim();
    const vi = (row.vietnamese || '').trim();
    if (!en || !vi) return;

    const unitName = (row.unit || 'Bài Học Tự Nạp Từ Excel').trim();
    if (!unitGroups[unitName]) {
      unitGroups[unitName] = {
        title: unitName,
        unit: unitName,
        type: row.type || (en.includes(' ') && (en.split(' ').length > 3 || en.includes('[')) ? 'sentence' : 'vocab'),
        grade: row.grade || 'primary',
        items: [],
      };
    }

    unitGroups[unitName].items.push({
      word: en,
      answer: en,
      fullSentence: en,
      meaning: vi,
      prompt: vi,
      ipa: row.ipa || '',
      wordType: row.wordType || '',
      example: row.example || '',
      exampleMeaning: row.exampleMeaning || '',
      hint: row.hint || '',
    });
  });

  const packs = Object.values(unitGroups).map(group => {
    return createLessonPack({
      id: `custom_excel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: group.title,
      unit: group.unit,
      type: group.type,
      grade: group.grade,
      items: group.items,
    });
  });

  const allItems = rawRows.filter(r => r.english && r.vietnamese);

  return {
    packs,
    items: allItems,
    rawCount: allItems.length,
  };
}

/**
 * Nạp dynamic script SheetJS (xlsx) khi người dùng tải file .xlsx
 */
let xlsxLoadingPromise = null;
function loadXLSXLibrary() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLoadingPromise) return xlsxLoadingPromise;

  xlsxLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => {
      resolve(window.XLSX);
    };
    script.onerror = () => {
      reject(new Error('Không thể tải thư viện đọc file Excel (.xlsx). Vui lòng thử lại với định dạng file .CSV!'));
    };
    document.head.appendChild(script);
  });

  return xlsxLoadingPromise;
}
