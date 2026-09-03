import mimikaraData from '@/data/vocab/mimikara_n3.json';
import minnaData from '@/data/vocab/minna.json';
import somatomeData from '@/data/vocab/somatome_n3.json';
import tangoData from '@/data/vocab/tango.json';

import n5Kanji from '@/data/kanji/n5.json';
import n4Kanji from '@/data/kanji/n4.json';
import n3Kanji from '@/data/kanji/n3.json';
import n2Kanji from '@/data/kanji/n2.json';
import n1Kanji from '@/data/kanji/n1.json';

export type VocabLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type TextbookId = 'minna_n5' | 'minna_n4' | 'mimikara_n3' | 'somatome_n3';

export interface ExampleSentence {
  japanese: string;
  reading?: string;
  vietnamese: string;
}

export interface VocabItem {
  id: string; // e.g. "minna_1_0", "mimikara_1_5"
  lessonId: string; // e.g. "minna_1", "mimikara_1"
  bookId: TextbookId;
  word: string; // Kanji or Kana representation
  reading: string; // Hiragana / Katakana reading
  sinoVietnamese?: string; // Âm Hán Việt
  meaning: string; // Vietnamese meaning
  meaningEn?: string; // English meaning if available
  romaji?: string; // Romaji reading if available
  wordType?: string; // e.g. "Danh từ", "Động từ", "Tính từ"
  level: VocabLevel;
  example?: ExampleSentence;
}

export interface LessonInfo {
  id: string; // e.g. "minna_1", "mimikara_1", "somatome_1"
  bookId: TextbookId;
  bookTitle: string;
  lessonNumber: number;
  title: string; // e.g. "Bài 1: Giới thiệu bản thân"
  subtitle?: string; // e.g. "Từ vựng cơ bản, đại từ nhân xưng, quốc tịch"
  level: VocabLevel;
  items: VocabItem[];
}

export interface TextbookInfo {
  id: TextbookId;
  title: string;
  shortTitle: string;
  description: string;
  level: VocabLevel;
  lessonCount: number;
  vocabCount: number;
  category: string;
}

// Well-known Sino-Vietnamese dictionary for common Kanji characters
const SINO_VIETNAMESE_DICT: Record<string, string> = {
  会: 'HỘI',
  社: 'XÃ',
  語: 'NGỮ',
  車: 'XA',
  本: 'BẢN',
  学: 'HỌC',
  校: 'HIỆU',
  生: 'SINH',
  先: 'TIÊN',
  私: 'TƯ',
  人: 'NHÂN',
  方: 'PHƯƠNG',
  何: 'HÀ',
  誰: 'THÙY',
  歳: 'TUẾ',
  日: 'NHẬT',
  月: 'NGUYỆT',
  火: 'HỎA',
  水: 'THỦY',
  木: 'MỘC',
  金: 'KIM',
  土: 'THỔ',
  年: 'NIÊN',
  時: 'THỜI',
  分: 'PHÂN',
  半: 'BÁN',
  今: 'KIM',
  毎: 'MỖI',
  朝: 'TRIÊU',
  昼: 'TRÚ',
  晩: 'VÃN',
  夜: 'DẠ',
  行: 'HÀNH',
  来: 'LAI',
  帰: 'QUY',
  食: 'THỰC',
  飲: 'ẨM',
  見: 'KIẾN',
  聞: 'VĂN',
  読: 'ĐỘC',
  書: 'THƯ',
  買: 'MÃI',
  話: 'THOẠI',
  休: 'HƯU',
  売: 'MẠI',
  出: 'XUẤT',
  入: 'NHẬP',
  大: 'ĐẠI',
  小: 'TIỂU',
  高: 'CAO',
  安: 'AN',
  新: 'TÂN',
  古: 'CỔ',
  長: 'TRƯỜNG',
  短: 'ĐOẢN',
  多: 'ĐA',
  少: 'THIỂU',
  好: 'HẢO',
  嫌: 'HIỀM',
  白: 'BẠCH',
  黒: 'HẮC',
  赤: 'XÍCH',
  青: 'THANH',
  国: 'QUỐC',
  友: 'HỮU',
  父: 'PHỤ',
  母: 'MẪU',
  兄: 'HUYNH',
  弟: 'ĐỆ',
  姉: 'TỶ',
  妹: 'MUỘI',
  男: 'NAM',
  女: 'NỮ',
  子: 'TỬ',
  家: 'GIA',
  町: 'ĐINH',
  店: 'ĐIẾM',
  駅: 'DỊCH',
  道: 'ĐẠO',
  雨: 'VŨ',
  雪: 'TUYẾT',
  天: 'THIÊN',
  気: 'KHÍ',
  花: 'HOA',
  魚: 'NGƯ',
  肉: 'NHỤC',
  手: 'THỦ',
  足: 'TÚC',
  目: 'MỤC',
  耳: 'NHĨ',
  口: 'KHẨU',
  心: 'TÂM',
  力: 'LỰC',
  名: 'DANH',
  前: 'TIỀN',
  後: 'HẬU',
  上: 'THƯỢNG',
  下: 'HẠ',
  中: 'TRUNG',
  外: 'NGOẠI',
  左: 'TẢ',
  右: 'HỮU',
  北: 'BẮC',
  南: 'NAM',
  東: 'ĐÔNG',
  西: 'TÂY',
  間: 'GIAN',
  近: 'CẬN',
  遠: 'VIỄN',
  春: 'XUÂN',
  夏: 'HẠ',
  秋: 'THU',
  冬: 'ĐÔNG',
  山: 'SƠN',
  川: 'XUYÊN',
  海: 'HẢI',
  空: 'KHÔNG',
  電: 'ĐIỆN',
  銀: 'NGÂN',
  病: 'BỆNH',
  院: 'VIỆN',
  医: 'Y',
  者: 'GIẢ',
  研: 'NGHIÊN',
  究: 'CỨU',
  員: 'VIÊN',
  仕: 'SĨ',
  事: 'SỰ',
  勉: 'MIỄN',
  強: 'CƯỜNG',
  教: 'GIÁO',
  室: 'THẤT',
  授: 'THỤ',
  業: 'NGHIỆP',
  試: 'THÍ',
  験: 'NGHIỆM',
  宿: 'TÚC',
  題: 'ĐỀ',
  質: 'CHẤT',
  問: 'VẤN',
  答: 'ĐÁP',
  紙: 'CHỈ',
  文: 'VĂN',
  字: 'TỰ',
  漢: 'HÁN',
  歌: 'CA',
  音: 'ÂM',
  楽: 'LẠC',
  映: 'ÁNH',
  画: 'HỌA',
  写: 'TẢ',
  真: 'CHÂN',
  旅: 'LỮ',
  物: 'VẬT',
  堂: 'ĐƯỜNG',
  館: 'QUÁN',
  公: 'CÔNG',
  園: 'VIÊN',
  門: 'MÔN',
  池: 'TRÌ',
  森: 'SÂM',
  林: 'LÂM',
};

// Populate Sino-Vietnamese map from Kanji JSON files
const kanjiSinoMap = new Map<string, string>();
const allKanjiFiles = [
  ...(n5Kanji as any[]),
  ...(n4Kanji as any[]),
  ...(n3Kanji as any[]),
  ...(n2Kanji as any[]),
  ...(n1Kanji as any[]),
];

for (const k of allKanjiFiles) {
  if (k && k.character && !kanjiSinoMap.has(k.character)) {
    if (SINO_VIETNAMESE_DICT[k.character]) {
      kanjiSinoMap.set(k.character, SINO_VIETNAMESE_DICT[k.character]);
      continue;
    }
    const raw = (k.meaning_vi || '').trim();
    const paren = raw.match(/^([^(]+)\s*\(/);
    let sino = paren ? paren[1].trim() : (raw.split(/[,;]/)[0] || '').trim();
    sino = sino.split(/[,/]/)[0].trim().toUpperCase();
    if (sino) {
      kanjiSinoMap.set(k.character, sino);
    }
  }
}

// Add explicit dictionary overrides
for (const [char, val] of Object.entries(SINO_VIETNAMESE_DICT)) {
  kanjiSinoMap.set(char, val);
}

/**
 * Extracts Sino-Vietnamese reading for a given Japanese word.
 */
export function getSinoVietnamese(word: string): string {
  if (!word) return '';
  const kanjiChars = word.split('').filter((c) => /[\u4e00-\u9faf]/.test(c));
  if (kanjiChars.length === 0) return '';
  const list = kanjiChars
    .map((c) => kanjiSinoMap.get(c) || SINO_VIETNAMESE_DICT[c] || '')
    .filter(Boolean);
  return list.length > 0 ? list.join(' ') : '';
}

// Minna no Nihongo descriptive titles for lessons 1 to 50
const MINNA_LESSON_TITLES: Record<number, { title: string; subtitle: string }> = {
  1: { title: 'Bài 1: Giới thiệu bản thân', subtitle: 'Đại từ nhân xưng, quốc tịch, nghề nghiệp, câu khẳng định và nghi vấn' },
  2: { title: 'Bài 2: Đồ vật và sở hữu', subtitle: 'Chỉ định từ (này, đó, kia), vật dụng học tập, đồ dùng văn phòng' },
  3: { title: 'Bài 3: Địa điểm và vị trí', subtitle: 'Nơi chốn, phòng ban, quốc gia, hỏi giá tiền và phương hướng' },
  4: { title: 'Bài 4: Thời gian và hoạt động hàng ngày', subtitle: 'Giờ giấc, các ngày trong tuần, động từ cơ bản và khoảng thời gian' },
  5: { title: 'Bài 5: Đi lại và phương tiện', subtitle: 'Di chuyển (đi, đến, về), phương tiện giao thông, ngày tháng năm' },
  6: { title: 'Bài 6: Hoạt động và ăn uống', subtitle: 'Tha động từ, đồ ăn thức uống, rủ rê và mời mọc' },
  7: { title: 'Bài 7: Công cụ và quà tặng', subtitle: 'Phương tiện thực hiện hành động, cho nhận quà tặng, đã làm gì' },
  8: { title: 'Bài 8: Tính từ và miêu tả', subtitle: 'Tính từ đuôi い và đuôi な, miêu tả đồ vật, nơi chốn, thời tiết' },
  9: { title: 'Bài 9: Sở thích và khả năng', subtitle: 'Hiểu biết, sở thích, kỹ năng, nguyên nhân và lý do (から)' },
  10: { title: 'Bài 10: Tồn tại và vị trí không gian', subtitle: 'Sự hiện diện của người và vật (います / あります), vị trí trên dưới trong ngoài' },
  11: { title: 'Bài 11: Số lượng và thời gian', subtitle: 'Lượng từ, đếm đồ vật, khoảng thời gian thực hiện hành động' },
  12: { title: 'Bài 12: So sánh và quá khứ tính từ', subtitle: 'So sánh hơn, so sánh nhất, thể quá khứ của tính từ và danh từ' },
  13: { title: 'Bài 13: Mong muốn và mục đích', subtitle: 'Muốn có cái gì (～がほしい), muốn làm gì (～たい), mục đích di chuyển' },
  14: { title: 'Bài 14: Thể Te và yêu cầu lịch sự', subtitle: 'Chia động từ thể て, yêu cầu giúp đỡ (～てください), hành động đang diễn ra' },
  15: { title: 'Bài 15: Xin phép và cấm đoán', subtitle: 'Được phép làm (～てもいいです), không được phép làm (～てはいけません)' },
  16: { title: 'Bài 16: Trình tự hành động và miêu tả đặc điểm', subtitle: 'Hành động nối tiếp (～てから), cách đi đến nơi nào đó, miêu tả ngoại hình' },
  17: { title: 'Bài 17: Thể Nai và bắt buộc', subtitle: 'Chia động từ thể ない, xin đừng làm gì, phải làm gì (～なければなりません)' },
  18: { title: 'Bài 18: Thể từ điển và khả năng', subtitle: 'Động từ nguyên mẫu, khả năng làm gì (～ことができます), sở thích' },
  19: { title: 'Bài 19: Thể Ta và kinh nghiệm', subtitle: 'Chia động từ thể た, kinh nghiệm từng trải (～たことがあります), liệt kê hành động' },
  20: { title: 'Bài 20: Thể thông thường (Thể ngắn)', subtitle: 'Hội thoại thường ngày, giao tiếp thân mật với bạn bè và gia đình' },
  21: { title: 'Bài 21: Bày tỏ ý kiến và trích dẫn', subtitle: 'Nghĩ rằng (～と思います), nói rằng (～と言いました), đồng ý và suy đoán' },
  22: { title: 'Bài 22: Mệnh đề định ngữ', subtitle: 'Mệnh đề bổ nghĩa cho danh từ, miêu tả người và đồ vật chi tiết' },
  23: { title: 'Bài 23: Khi nào và điều kiện tự nhiên', subtitle: 'Khi làm gì (～とき), câu điều kiện hiển nhiên (～と rẽ phải, thấy ngân hàng)' },
  24: { title: 'Bài 24: Cho nhận hành động', subtitle: 'Cho và nhận ân huệ, làm giúp ai việc gì (～てあげます / ～てもらいます / ～てくれます)' },
  25: { title: 'Bài 25: Câu điều kiện giả định', subtitle: 'Nếu thì (～たら), dù cho có thế nào đi nữa (～ても)' },
  26: { title: 'Bài 26: Giải thích lý do và xác nhận', subtitle: 'Cách dùng ～んです, bày tỏ sự quan tâm, nhờ vả giải thích' },
  27: { title: 'Bài 27: Động từ thể khả năng', subtitle: 'Biến đổi động từ thể khả năng, nhìn thấy (見える) và nghe thấy (聞こえる)' },
  28: { title: 'Bài 28: Hành động đồng thời và thói quen', subtitle: 'Vừa làm việc này vừa làm việc kia (～ながら), thói quen đều đặn' },
  29: { title: 'Bài 29: Trạng thái của sự vật (Tự động từ)', subtitle: 'Tự động từ và tha động từ, diễn tả kết quả trạng thái (～ています)' },
  30: { title: 'Bài 30: Chuẩn bị sẵn sàng (Tha động từ)', subtitle: 'Hành động có chủ đích chuẩn bị sẵn (～てあります / ～ておきます)' },
  31: { title: 'Bài 31: Thể ý chí và dự định', subtitle: 'Thể ý chí (Ý hướng hình), dự định làm gì (～ようと思っています / ～つもりです)' },
  32: { title: 'Bài 32: Lời khuyên và phỏng đoán', subtitle: 'Nên / Không nên làm gì (～ほうがいいです), dự đoán (～でしょう / ～かもしれません)' },
  33: { title: 'Bài 33: Thể mệnh lệnh và cấm chỉ', subtitle: 'Mệnh lệnh hình và cấm chỉ hình, biển báo công cộng và truyền đạt chỉ thị' },
  34: { title: 'Bài 34: Thực hiện theo chỉ dẫn', subtitle: 'Làm theo đúng như (～とおりに), sau khi làm gì (～あとで)' },
  35: { title: 'Bài 35: Thể điều kiện', subtitle: 'Chia động từ thể điều kiện (～ば / ～なら), đưa ra lời khuyên phù hợp' },
  36: { title: 'Bài 36: Cố gắng và biến đổi trạng thái', subtitle: 'Cố gắng tạo thói quen (～場所にします), dần dần trở nên (～ようになります)' },
  37: { title: 'Bài 37: Động từ thể bị động', subtitle: 'Chia thể bị động (Bị, được làm gì), bị động gián tiếp phiền toái' },
  38: { title: 'Bài 38: Danh từ hóa động từ', subtitle: 'Biến câu thành danh từ (～のは / ～のを / ～のに), thích thú và sở trường' },
  39: { title: 'Bài 39: Chỉ nguyên nhân và kết quả', subtitle: 'Vì... nên (～て / ～ので), diễn tả cảm xúc và lý do bất khả kháng' },
  40: { title: 'Bài 40: Nghi vấn từ trong câu lồng', subtitle: 'Câu hỏi lồng (～か / ～かどうか), thử làm việc gì xem sao (～てみます)' },
  41: { title: 'Bài 41: Kính ngữ cho và nhận', subtitle: 'Cho nhận kính cẩn (いただく / くださる / やる), xin hãy làm giúp (～ていただけませんか)' },
  42: { title: 'Bài 42: Mục đích và công dụng', subtitle: 'Để phục vụ mục đích (～ために), dùng vào việc gì (～のに使います)' },
  43: { title: 'Bài 43: Dự đoán và bề ngoài', subtitle: 'Có vẻ sắp xảy ra (～そうです), đi đâu đó rồi quay lại (～てきます)' },
  44: { title: 'Bài 44: Quá mức và mức độ dễ khó', subtitle: 'Làm quá nhiều (～すぎます), dễ làm (～やすい) và khó làm (～にくい)' },
  45: { title: 'Bài 45: Trường hợp và ngược lại', subtitle: 'Trong trường hợp (～ばあいは), thế mà / mặc dù (～のに)' },
  46: { title: 'Bài 46: Thời điểm hành động và vừa mới', subtitle: 'Sắp sửa, đang, vừa mới xong (～ところ), vừa mới làm xong (～ばかり)' },
  47: { title: 'Bài 47: Nghe nói và phán đoán', subtitle: 'Nghe đồn rằng (～そうです theo truyền thông), dường như là (～ようです)' },
  48: { title: 'Bài 48: Thể sai khiến', subtitle: 'Cho phép hoặc bắt buộc ai làm gì (Sai khiến hình), xin phép được làm' },
  49: { title: 'Bài 49: Tôn kính ngữ (Kính ngữ nâng cao)', subtitle: 'Tôn trọng hành động của người trên (Kính ngữ đặc biệt, お～になります)' },
  50: { title: 'Bài 50: Khiêm nhường ngữ (Hạ mình lịch sự)', subtitle: 'Hạ mình lịch sự khi nói về bản thân (お～します, ご～します, động từ đặc biệt)' },
};

// Clean Somatome string helper
function cleanSomatomeField(text: string): { cleanKanji: string; cleanReading: string } {
  if (!text) return { cleanKanji: '', cleanReading: '' };
  const raw = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
  const parenMatch = raw.match(/^([^(]+)\s*\(\s*([^)]+)\s*\)\s*(.*)$/);
  if (parenMatch) {
    const cleanKanji = (parenMatch[1] + parenMatch[3]).replace(/\s+/g, '').trim();
    const cleanReading = parenMatch[2].replace(/\s+/g, '').trim();
    return { cleanKanji, cleanReading };
  }
  return { cleanKanji: raw, cleanReading: raw };
}

// Master caches
let cachedTextbooks: TextbookInfo[] | null = null;
let cachedLessons: LessonInfo[] | null = null;
let cachedLessonMap: Map<string, LessonInfo> | null = null;
let cachedAllVocab: VocabItem[] | null = null;

function buildAllVocabAndLessons(): {
  textbooks: TextbookInfo[];
  lessons: LessonInfo[];
  lessonMap: Map<string, LessonInfo>;
  allVocab: VocabItem[];
} {
  if (cachedTextbooks && cachedLessons && cachedLessonMap && cachedAllVocab) {
    return {
      textbooks: cachedTextbooks,
      lessons: cachedLessons,
      lessonMap: cachedLessonMap,
      allVocab: cachedAllVocab,
    };
  }

  const lessons: LessonInfo[] = [];
  const lessonMap = new Map<string, LessonInfo>();
  const allVocab: VocabItem[] = [];

  // Group minna.json by lesson_number
  const minnaByLesson = new Map<number, any[]>();
  for (const item of (minnaData || []) as any[]) {
    const l = Number(item.lesson_number || item.lesson);
    if (!l) continue;
    if (!minnaByLesson.has(l)) {
      minnaByLesson.set(l, []);
    }
    minnaByLesson.get(l)!.push(item);
  }

  // Group tango.json by lesson "1".."50"
  const tangoByLesson = new Map<string, any[]>();
  for (const item of tangoData as any[]) {
    const l = String(item.lesson || '').trim();
    if (!l) continue;
    if (!tangoByLesson.has(l)) {
      tangoByLesson.set(l, []);
    }
    tangoByLesson.get(l)!.push(item);
  }

  // 1. Minna N5 (Lessons 1 - 25)
  for (let i = 1; i <= 25; i++) {
    const lessonKey = String(i);
    const lessonId = `minna_${i}`;
    const hasMinna = minnaByLesson.has(i) && minnaByLesson.get(i)!.length > 0;
    const rawItems = hasMinna ? minnaByLesson.get(i)! : (tangoByLesson.get(lessonKey) || []);
    const meta = MINNA_LESSON_TITLES[i] || {
      title: `Bài ${i}`,
      subtitle: `Từ vựng Minna no Nihongo N5 Bài ${i}`,
    };

    const items: VocabItem[] = rawItems.map((item, idx) => {
      let word: string;
      let reading: string;
      let meaning: string;
      let meaningEn: string | undefined = undefined;
      let romaji: string | undefined = undefined;
      let wordType: string | undefined = undefined;

      if (hasMinna) {
        word = (item.word_jp || item.word || item.reading || '').trim();
        reading = (item.reading || item.word_jp || item.word || '').trim();
        meaning = (item.meaning_vi || item.meaning || '').trim();
        meaningEn = (item.meaning_en || item.english || '').trim() || undefined;
        romaji = (item.romaji || '').trim() || undefined;
        wordType = (item.word_type || '').trim() || undefined;
      } else {
        word = (item.kanji || item.kana || '').trim();
        reading = (item.kana || item.kanji || '').trim();
        meaning = (item.vietnamese || '').trim();
        meaningEn = (item.english || '').trim() || undefined;
        romaji = (item.romaji || '').trim() || undefined;
      }

      const sino = getSinoVietnamese(word);
      const vId = `${lessonId}_${idx}`;

      return {
        id: vId,
        lessonId,
        bookId: 'minna_n5',
        word,
        reading,
        sinoVietnamese: sino || undefined,
        meaning,
        meaningEn,
        romaji,
        wordType,
        level: 'N5',
        example: undefined,
      };
    });

    const lessonInfo: LessonInfo = {
      id: lessonId,
      bookId: 'minna_n5',
      bookTitle: 'Minna no Nihongo N5',
      lessonNumber: i,
      title: meta.title,
      subtitle: meta.subtitle,
      level: 'N5',
      items,
    };

    lessons.push(lessonInfo);
    lessonMap.set(lessonId, lessonInfo);
    allVocab.push(...items);
  }

  // 2. Minna N4 (Lessons 26 - 50)
  for (let i = 26; i <= 50; i++) {
    const lessonKey = String(i);
    const lessonId = `minna_${i}`;
    const hasMinna = minnaByLesson.has(i) && minnaByLesson.get(i)!.length > 0;
    const rawItems = hasMinna ? minnaByLesson.get(i)! : (tangoByLesson.get(lessonKey) || []);
    const meta = MINNA_LESSON_TITLES[i] || {
      title: `Bài ${i}`,
      subtitle: `Từ vựng Minna no Nihongo N4 Bài ${i}`,
    };

    const items: VocabItem[] = rawItems.map((item, idx) => {
      let word: string;
      let reading: string;
      let meaning: string;
      let meaningEn: string | undefined = undefined;
      let romaji: string | undefined = undefined;
      let wordType: string | undefined = undefined;

      if (hasMinna) {
        word = (item.word_jp || item.word || item.reading || '').trim();
        reading = (item.reading || item.word_jp || item.word || '').trim();
        meaning = (item.meaning_vi || item.meaning || '').trim();
        meaningEn = (item.meaning_en || item.english || '').trim() || undefined;
        romaji = (item.romaji || '').trim() || undefined;
        wordType = (item.word_type || '').trim() || undefined;
      } else {
        word = (item.kanji || item.kana || '').trim();
        reading = (item.kana || item.kanji || '').trim();
        meaning = (item.vietnamese || '').trim();
        meaningEn = (item.english || '').trim() || undefined;
        romaji = (item.romaji || '').trim() || undefined;
      }

      const sino = getSinoVietnamese(word);
      const vId = `${lessonId}_${idx}`;

      return {
        id: vId,
        lessonId,
        bookId: 'minna_n4',
        word,
        reading,
        sinoVietnamese: sino || undefined,
        meaning,
        meaningEn,
        romaji,
        wordType,
        level: 'N4',
        example: undefined,
      };
    });

    const lessonInfo: LessonInfo = {
      id: lessonId,
      bookId: 'minna_n4',
      bookTitle: 'Minna no Nihongo N4',
      lessonNumber: i,
      title: meta.title,
      subtitle: meta.subtitle,
      level: 'N4',
      items,
    };

    lessons.push(lessonInfo);
    lessonMap.set(lessonId, lessonInfo);
    allVocab.push(...items);
  }

  // 3. Mimikara Oboeru N3 (64 Units & lessons)
  const mimikaraLessonsMap = new Map<string, any[]>();
  for (const item of mimikaraData as any[]) {
    const lName = (item.Lesson || '').trim();
    if (!lName) continue;
    if (!mimikaraLessonsMap.has(lName)) {
      mimikaraLessonsMap.set(lName, []);
    }
    mimikaraLessonsMap.get(lName)!.push(item);
  }

  let mimikaraIndex = 1;
  for (const [rawLessonName, rawItems] of Array.from(mimikaraLessonsMap.entries())) {
    const lessonId = `mimikara_${mimikaraIndex}`;
    const cleanTitle = rawLessonName.replace(/\s+/g, ' ').trim();

    const items: VocabItem[] = rawItems.map((item, idx) => {
      const word = (item['Từ Vựng'] || '').trim();
      const rawHanViet = (item['Hán Tự'] || '').trim();
      const sino = rawHanViet || getSinoVietnamese(word);
      const meaning = (item['Nghĩa'] || '').trim();
      const vId = `${lessonId}_${idx}`;

      return {
        id: vId,
        lessonId,
        bookId: 'mimikara_n3',
        word,
        reading: word,
        sinoVietnamese: sino || undefined,
        meaning,
        level: 'N3',
      };
    });

    const lessonInfo: LessonInfo = {
      id: lessonId,
      bookId: 'mimikara_n3',
      bookTitle: 'Mimikara Oboeru N3',
      lessonNumber: mimikaraIndex,
      title: cleanTitle,
      subtitle: `Từ vựng Mimikara N3 - ${cleanTitle}`,
      level: 'N3',
      items,
    };

    lessons.push(lessonInfo);
    lessonMap.set(lessonId, lessonInfo);
    allVocab.push(...items);
    mimikaraIndex++;
  }

  // 4. Soumatome N3 (36 lessons: 6 weeks x 6 days)
  const somatomeLessonsMap = new Map<string, any[]>();
  for (const item of somatomeData as any[]) {
    const lName = (item.lesson || '').trim();
    if (!lName) continue;
    if (!somatomeLessonsMap.has(lName)) {
      somatomeLessonsMap.set(lName, []);
    }
    somatomeLessonsMap.get(lName)!.push(item);
  }

  let somatomeIndex = 1;
  for (const [rawLessonName, rawItems] of Array.from(somatomeLessonsMap.entries())) {
    const lessonId = `somatome_${somatomeIndex}`;
    const cleanTitle = rawLessonName.replace(/\s+/g, ' ').trim();

    const weekMatch = cleanTitle.match(/第(\d+)週\s*\((\d+)\)/);
    const subtitle = weekMatch
      ? `Tuần ${weekMatch[1]} - Ngày ${weekMatch[2]}`
      : `Bài học Soumatome N3`;

    const items: VocabItem[] = rawItems.map((item, idx) => {
      const rawWord = (item.word || '').replace(/[\r\n\t]+/g, '').trim();
      const rawKanji = (item.kanji || '').trim();
      const meaning = (item.meaning || '').replace(/\s+/g, ' ').trim();
      const wordType = (item.type || '').trim() || undefined;

      let word = rawWord;
      let reading = rawWord;

      if (rawKanji) {
        const parsed = cleanSomatomeField(rawKanji);
        if (parsed.cleanKanji) {
          word = parsed.cleanKanji;
          reading = parsed.cleanReading || rawWord;
        }
      }

      const sino = getSinoVietnamese(word);
      const vId = `${lessonId}_${idx}`;

      return {
        id: vId,
        lessonId,
        bookId: 'somatome_n3',
        word,
        reading,
        sinoVietnamese: sino || undefined,
        meaning,
        wordType:
          wordType === 'n'
            ? 'Danh từ'
            : wordType === 'v'
            ? 'Động từ'
            : wordType === 'adj'
            ? 'Tính từ'
            : wordType,
        level: 'N3',
      };
    });

    const lessonInfo: LessonInfo = {
      id: lessonId,
      bookId: 'somatome_n3',
      bookTitle: 'Nihongo Soumatome N3',
      lessonNumber: somatomeIndex,
      title: cleanTitle,
      subtitle: `${subtitle}: ${cleanTitle.replace(/^第\d+週\s*\(\d+\)\s*–\s*/, '')}`,
      level: 'N3',
      items,
    };

    lessons.push(lessonInfo);
    lessonMap.set(lessonId, lessonInfo);
    allVocab.push(...items);
    somatomeIndex++;
  }

  // Count items per textbook
  const minnaN5Count = lessons
    .filter((l) => l.bookId === 'minna_n5')
    .reduce((sum, l) => sum + l.items.length, 0);
  const minnaN4Count = lessons
    .filter((l) => l.bookId === 'minna_n4')
    .reduce((sum, l) => sum + l.items.length, 0);
  const mimikaraCount = lessons
    .filter((l) => l.bookId === 'mimikara_n3')
    .reduce((sum, l) => sum + l.items.length, 0);
  const somatomeCount = lessons
    .filter((l) => l.bookId === 'somatome_n3')
    .reduce((sum, l) => sum + l.items.length, 0);

  const textbooks: TextbookInfo[] = [
    {
      id: 'minna_n5',
      title: 'Minna no Nihongo N5 (Sơ cấp 1)',
      shortTitle: 'Minna N5',
      description: 'Giáo trình tiếng Nhật Sơ cấp 1 tiêu chuẩn (Bài 1 - Bài 25)',
      level: 'N5',
      lessonCount: 25,
      vocabCount: minnaN5Count,
      category: 'Sơ cấp',
    },
    {
      id: 'minna_n4',
      title: 'Minna no Nihongo N4 (Sơ cấp 2)',
      shortTitle: 'Minna N4',
      description: 'Giáo trình tiếng Nhật Sơ cấp 2 tiêu chuẩn (Bài 26 - Bài 50)',
      level: 'N4',
      lessonCount: 25,
      vocabCount: minnaN4Count,
      category: 'Sơ cấp',
    },
    {
      id: 'mimikara_n3',
      title: 'Mimikara Oboeru N3 (Từ vựng)',
      shortTitle: 'Mimikara N3',
      description: 'Luyện thi N3 toàn diện theo phương pháp Nghe & Nhớ (64 Units)',
      level: 'N3',
      lessonCount: 64,
      vocabCount: mimikaraCount,
      category: 'Trung cấp',
    },
    {
      id: 'somatome_n3',
      title: 'Nihongo Soumatome N3 (Từ vựng)',
      shortTitle: 'Soumatome N3',
      description: 'Tổng hợp từ vựng N3 trong 6 tuần học (36 ngày chi tiết theo chủ đề)',
      level: 'N3',
      lessonCount: 36,
      vocabCount: somatomeCount,
      category: 'Trung cấp',
    },
  ];

  cachedTextbooks = textbooks;
  cachedLessons = lessons;
  cachedLessonMap = lessonMap;
  cachedAllVocab = allVocab;

  return { textbooks, lessons, lessonMap, allVocab };
}

export function getAllTextbooks(): TextbookInfo[] {
  return buildAllVocabAndLessons().textbooks;
}

export function getTextbookById(bookId: TextbookId): TextbookInfo | undefined {
  return getAllTextbooks().find((b) => b.id === bookId);
}

export function getAllLessons(): LessonInfo[] {
  return buildAllVocabAndLessons().lessons;
}

export function getLessonsByTextbook(bookId: TextbookId): LessonInfo[] {
  return getAllLessons().filter((l) => l.bookId === bookId);
}

export function getLessonById(lessonId: string): LessonInfo | undefined {
  return buildAllVocabAndLessons().lessonMap.get(lessonId);
}

export function getAllLessonIds(): string[] {
  return getAllLessons().map((l) => l.id);
}

export function getAllVocab(): VocabItem[] {
  return buildAllVocabAndLessons().allVocab;
}

export function getAdjacentLessons(
  lessonId: string
): { prev: LessonInfo | null; next: LessonInfo | null } {
  const all = getAllLessons();
  const index = all.findIndex((l) => l.id === lessonId);
  if (index === -1) {
    return { prev: null, next: null };
  }
  const prev = index > 0 ? all[index - 1] : null;
  const next = index < all.length - 1 ? all[index + 1] : null;
  return { prev, next };
}

function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function searchVocab(query: string, lessonId?: string): VocabItem[] {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    if (lessonId) {
      return getLessonById(lessonId)?.items || [];
    }
    return getAllVocab();
  }

  const pool = lessonId ? getLessonById(lessonId)?.items || [] : getAllVocab();

  return pool.filter((item) => {
    const inWord = item.word.toLowerCase().includes(normQuery);
    const inReading = item.reading.toLowerCase().includes(normQuery);
    const inMeaning = normalizeSearchText(item.meaning).includes(normQuery);
    const inSino = item.sinoVietnamese
      ? normalizeSearchText(item.sinoVietnamese).includes(normQuery)
      : false;
    const inRomaji = item.romaji ? item.romaji.toLowerCase().includes(normQuery) : false;
    const inEn = item.meaningEn
      ? item.meaningEn.toLowerCase().includes(normQuery)
      : false;

    return inWord || inReading || inMeaning || inSino || inRomaji || inEn;
  });
}
