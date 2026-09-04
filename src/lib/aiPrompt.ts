import { ClozeExerciseItem } from '@/types/ai';

export interface VocabPromptItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
}

export function buildClozePrompt(
  lessonTitle: string,
  level: string,
  words: VocabPromptItem[]
): { system: string; user: string } {
  const system = `Bạn là một chuyên gia giáo dục tiếng Nhật bản ngữ chuẩn mực.
Nhiệm vụ của bạn là tạo bài tập điền từ vào chỗ trống (Cloze test) cho học viên học tiếng Nhật trình độ ${level}.
Yêu cầu bắt buộc:
1. Đối với MỖI từ vựng trong danh sách được cung cấp, hãy tạo đúng 1 câu ví dụ tiếng Nhật tự nhiên, thiết thực trong đời sống, phù hợp với trình độ JLPT ${level}.
2. Thay thế từ vựng mục tiêu trong câu bằng ký hiệu chỗ trống: （　　）.
3. Tạo 4 phương án trắc nghiệm trong mảng "options": gồm 1 từ mục tiêu và 3 từ gây nhiễu (distractors) cùng từ loại hoặc cùng cấp độ JLPT ${level}. Đảm bảo các lựa chọn được xáo trộn ngẫu nhiên.
4. "correctIndex": Chỉ số (0, 1, 2 hoặc 3) của đáp án đúng trong mảng "options".
5. "fullSentence": Câu tiếng Nhật hoàn chỉnh khi đã điền từ đúng vào chỗ trống.
6. "translation": Bản dịch câu hoàn chỉnh sang tiếng Việt tự nhiên, chính xác.
7. "explanation": Giải thích ngắn gọn (1-2 câu tiếng Việt) vì sao từ đó là đáp án chính xác trong ngữ cảnh câu này.
8. QUAN TRỌNG: Đầu ra CHỈ LÀ một mảng JSON thuần túy (Pure JSON Array), KHÔNG kèm bất kỳ lời chào hay giải thích nào bên ngoài mảng JSON.`;

  const user = `Tạo bài tập điền từ cho bài học: "${lessonTitle}" (Trình độ: ${level}).
Danh sách từ vựng (${words.length} từ):
${words
  .map(
    (w, idx) =>
      `${idx + 1}. [ID: ${w.id}] Từ: "${w.word}" (Cách đọc: ${w.reading}) - Nghĩa: ${w.meaning}`
  )
  .join('\n')}

Hãy tạo đúng ${words.length} câu tương ứng với định dạng JSON sau:
[
  {
    "id": "ex_1",
    "vocabId": "id_cua_tu",
    "targetWord": "tu_dung",
    "targetReading": "cach_doc_hiragana",
    "sentence": "cau_tieng_nhat_co_cho_trong_（　　）",
    "fullSentence": "cau_tieng_nhat_hoan_chinh",
    "translation": "nghia_tieng_viet",
    "options": ["lua_chon_1", "lua_chon_2", "lua_chon_3", "lua_chon_4"],
    "correctIndex": 0,
    "explanation": "giai_thich_ngan_gon"
  }
]`;

  return { system, user };
}

export function parseClozeResponse(rawText: string): ClozeExerciseItem[] {
  let cleaned = rawText.trim();
  // Strip markdown codeblocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find start and end of JSON array
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  const items = JSON.parse(cleaned);
  if (!Array.isArray(items)) {
    throw new Error('AI response is not an array');
  }

  return items.map((item, idx) => ({
    id: item.id || `ex_${idx + 1}_${Date.now()}`,
    vocabId: item.vocabId || `item_${idx}`,
    targetWord: item.targetWord || '',
    targetReading: item.targetReading || item.targetWord || '',
    sentence: item.sentence || '',
    fullSentence: item.fullSentence || item.sentence?.replace('（　　）', item.targetWord) || '',
    translation: item.translation || '',
    options: Array.isArray(item.options) ? item.options : [item.targetWord],
    correctIndex: typeof item.correctIndex === 'number' ? item.correctIndex : 0,
    explanation: item.explanation || '',
  }));
}
