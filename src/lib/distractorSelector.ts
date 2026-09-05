import { QuizItem } from '@/components/quiz/MultipleChoiceQuiz';

// Semantic category rules for Vietnamese meanings
interface SemanticCategory {
  id: string;
  pattern: RegExp;
  keywords?: string[];
}

const SEMANTIC_CATEGORIES: SemanticCategory[] = [
  {
    id: 'day_of_week',
    pattern: /^(thứ\s+(hai|ba|tư|năm|sáu|bảy)|chủ\s+nhật)/i,
    keywords: ['thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy', 'chủ nhật'],
  },
  {
    id: 'time_period',
    pattern: /^(buổi\s+(sáng|trưa|chiều|tối)|ban\s+(ngày|đêm)|sáng\s+nay|tối\s+nay|hôm\s+(nay|qua|kia)|ngày\s+(mai|kia)|tuần\s+(này|trước|sau)|tháng\s+(này|trước|sau)|năm\s+(nay|ngoái|sau))/i,
    keywords: ['sáng', 'trưa', 'chiều', 'tối', 'đêm', 'hôm nay', 'hôm qua', 'ngày mai', 'tuần này', 'tháng này', 'năm nay'],
  },
  {
    id: 'clock_time',
    pattern: /(\d+\s*(giờ|tiếng|phút|giây)|mấy\s+giờ|bao\s+nhiêu\s+phút|giờ|phút|giây)/i,
  },
  {
    id: 'month',
    pattern: /^tháng\s+(\d+|giêng|chạp|mười|hai|ba|tư|năm|sáu|bảy|tám|chín)/i,
  },
  {
    id: 'family',
    pattern: /^(bố|ba|cha|mẹ|má|ông|bà|anh|chị|em|vợ|chồng|con|cháu|cô|chú|bác|dì)(\s|$)/i,
    keywords: ['bố', 'mẹ', 'ông', 'bà', 'anh trai', 'chị gái', 'em trai', 'em gái', 'vợ', 'chồng', 'con trai', 'con gái'],
  },
  {
    id: 'color',
    pattern: /^(màu\s+\S+|đỏ|xanh|vàng|trắng|đen|tím|hồng|cam|nâu|xám)(\s|$)/i,
    keywords: ['màu đỏ', 'màu xanh', 'màu vàng', 'màu trắng', 'màu đen', 'màu tím', 'màu hồng', 'màu cam'],
  },
  {
    id: 'pronoun',
    pattern: /^(tôi|bạn|chúng\s+tôi|chúng\s+ta|anh\s+ấy|cô\s+ấy|ông\s+ấy|bà\s+ấy|họ|người\s+đó|vị\s+đó)(\s|$)/i,
  },
  {
    id: 'question',
    pattern: /^(ai|cái\s+gì|gì|ở\s+đâu|đâu|khi\s+nào|bao\s+giờ|tại\s+sao|vì\s+sao|thế\s+nào|như\s+thế\s+nào|bao\s+nhiêu|mấy)(\s|$|\?)/i,
  },
  {
    id: 'position',
    pattern: /^(trên|dưới|trong|ngoài|trước|sau|bên\s+cạnh|giữa|bên\s+phải|bên\s+trái|đông|tây|nam|bắc)(\s|$)/i,
  },
  {
    id: 'transport',
    pattern: /^(xe\s+(buýt|đạp|máy|hơi|tải)|tàu\s+(điện|hỏa|thủy)|máy\s+bay)(\s|$)/i,
  },
  {
    id: 'profession',
    pattern: /^(giáo\s+viên|thầy\s+giáo|cô\s+giáo|học\s+sinh|sinh\s+viên|bác\s+sĩ|kỹ\s+sư|nhân\s+viên|giám\s+đốc|luật\s+sư|thông\s+dịch\s+viên)(\s|$)/i,
  },
];

// Common Japanese suffixes that signify belonging to the same lexical category
const JAPANESE_SUFFIXES = [
  '曜日', 'ようび',
  '時半', 'じはん',
  '時間', 'じかん',
  '時', 'じ',
  '分', 'ふん', 'ぷん',
  '人', 'じん', 'にん',
  '語', 'ご',
  '円', 'えん',
  '日', 'にち', 'か',
  '月', 'がつ', 'げつ',
  '年', 'ねん',
  '歳', 'さい',
  '本', 'ほん', 'ぼん', 'ぽん',
  '枚', 'まい',
  '台', 'だい',
  '匹', 'ひき', 'びき', 'ぴき',
  '階', 'かい', 'がい',
  '番', 'ばん',
];

// Common Vietnamese stop words to ignore when comparing word overlap
const VIETNAMESE_STOPWORDS = new Set([
  'của', 'và', 'là', 'được', 'bị', 'ở', 'tại', 'với', 'cho', 'về',
  'trong', 'ra', 'vào', 'một', 'những', 'các', 'này', 'đó', 'kia',
  'làm', 'có', 'để', 'khi', 'thì', 'rất', 'quá', 'nhiều', 'ít',
]);

/**
 * Normalizes text for comparison (removes accents, lowercase, strips punctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'【】]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects the semantic category of a Vietnamese meaning string
 */
export function detectSemanticCategory(meaning: string): string | null {
  const norm = normalizeText(meaning);
  for (const cat of SEMANTIC_CATEGORIES) {
    if (cat.pattern.test(norm)) {
      return cat.id;
    }
    if (cat.keywords && cat.keywords.some((kw) => norm.includes(kw))) {
      return cat.id;
    }
  }
  return null;
}

/**
 * Extracts the primary prefix keyword from a Vietnamese meaning (e.g. "thứ", "màu", "xe", "phòng")
 */
function getVietnamesePrefix(meaning: string): string | null {
  const norm = normalizeText(meaning);
  const words = norm.split(' ');
  if (words.length >= 2 && words[0].length >= 2) {
    return words[0];
  }
  return null;
}

/**
 * Extracts Kanji characters from a string
 */
function extractKanji(text: string): Set<string> {
  const kanjiRegex = /[\u4e00-\u9faf]/g;
  const matches = text.match(kanjiRegex);
  return new Set(matches || []);
}

/**
 * Tokenizes Vietnamese text into meaningful words (excluding stopwords)
 */
function tokenizeMeaning(meaning: string): Set<string> {
  const norm = normalizeText(meaning);
  const words = norm.split(' ').filter((w) => w.length > 1 && !VIETNAMESE_STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Calculates a multi-tier similarity score between a target item and a candidate distractor.
 * Higher score = more similar / better distractor.
 */
export function calculateSimilarityScore(target: QuizItem, candidate: QuizItem): number {
  if (target.id === candidate.id) return -100;

  let score = 0;

  // 1. Semantic Category Match in Vietnamese meaning (+50 pts)
  const targetCategory = detectSemanticCategory(target.meaning);
  const candidateCategory = detectSemanticCategory(candidate.meaning);
  if (targetCategory && candidateCategory && targetCategory === candidateCategory) {
    score += 50;
  }

  // 2. Common Vietnamese Prefix Match (+30 pts) (e.g., "Thứ...", "Phòng...", "Xe...", "Màu...")
  const targetPrefix = getVietnamesePrefix(target.meaning);
  const candidatePrefix = getVietnamesePrefix(candidate.meaning);
  if (targetPrefix && candidatePrefix && targetPrefix === candidatePrefix) {
    score += 30;
  }

  // 3. Japanese Morpheme / Suffix Match (+40 pts) (e.g., ~曜日, ~時, ~人, ~語)
  for (const suffix of JAPANESE_SUFFIXES) {
    const targetHas = target.word.endsWith(suffix) || target.reading.endsWith(suffix);
    const candidateHas = candidate.word.endsWith(suffix) || candidate.reading.endsWith(suffix);
    if (targetHas && candidateHas) {
      score += 40;
      break;
    }
  }

  // 4. Shared Kanji Characters (+25 pts per shared Kanji)
  const targetKanji = extractKanji(target.word);
  const candidateKanji = extractKanji(candidate.word);
  let sharedKanjiCount = 0;
  targetKanji.forEach((k) => {
    if (candidateKanji.has(k)) {
      sharedKanjiCount++;
    }
  });
  if (sharedKanjiCount > 0) {
    score += sharedKanjiCount * 25;
  }

  // 5. Shared Meaning Tokens (+15 pts per shared significant word)
  const targetTokens = tokenizeMeaning(target.meaning);
  const candidateTokens = tokenizeMeaning(candidate.meaning);
  let sharedTokensCount = 0;
  targetTokens.forEach((token) => {
    if (candidateTokens.has(token)) {
      sharedTokensCount++;
    }
  });
  if (sharedTokensCount > 0) {
    score += Math.min(sharedTokensCount * 15, 30);
  }

  // 6. Sino-Vietnamese root match (+20 pts)
  if (target.sinoVietnamese && candidate.sinoVietnamese) {
    const targetSinoWords = target.sinoVietnamese.trim().split(/\s+/);
    const candidateSinoWords = candidate.sinoVietnamese.trim().split(/\s+/);
    for (const sw of targetSinoWords) {
      if (sw.length > 1 && candidateSinoWords.includes(sw)) {
        score += 20;
        break;
      }
    }
  }

  // 7. Length Ratio Bonus (+5 to +10 pts)
  const lenTarget = target.meaning.trim().length;
  const lenCand = candidate.meaning.trim().length;
  if (lenTarget > 0 && lenCand > 0) {
    const ratio = Math.min(lenTarget, lenCand) / Math.max(lenTarget, lenCand);
    if (ratio >= 0.6) {
      score += Math.round(ratio * 10);
    }
  }

  // 8. Same JLPT level bonus (+5 pts)
  if (target.level && candidate.level && target.level === candidate.level) {
    score += 5;
  }

  return score;
}

export interface SelectDistractorsOptions {
  count?: number;
  getOptionLabel?: (item: QuizItem) => string;
  fallbackDistractors?: string[];
}

/**
 * Selects the best distractor choices for a multiple choice question.
 * Prioritizes high-similarity candidates from the local pool first.
 * If local pool lacks enough similar distractors, expands to global pool.
 * Fallbacks to random candidates if not enough similar candidates exist.
 */
export function selectDistractors(
  target: QuizItem,
  localPool: QuizItem[],
  globalPool?: QuizItem[],
  options?: SelectDistractorsOptions
): string[] {
  const count = options?.count ?? 3;
  const getLabel = options?.getOptionLabel ?? ((item: QuizItem) => item.meaning.trim());
  const targetLabel = getLabel(target);

  const seenLabels = new Set<string>([targetLabel]);
  const scoredCandidates: { item: QuizItem; label: string; score: number }[] = [];

  // Helper to process a pool of items
  const processPool = (pool: QuizItem[], minScoreThreshold = 0) => {
    for (const item of pool) {
      if (item.id === target.id) continue;
      if (item.word === target.word) continue;
      if (target.type && item.type && target.type !== item.type) continue;
      const label = getLabel(item);
      if (seenLabels.has(label)) continue;

      const score = calculateSimilarityScore(target, item);
      if (score >= minScoreThreshold) {
        seenLabels.add(label);
        scoredCandidates.push({ item, label, score });
      }
    }
  };

  // 1. First pass: Search local pool for all candidates
  processPool(localPool, 0);

  // Check how many "strong" candidates (score >= 30) we got from localPool
  const strongLocalCount = scoredCandidates.filter((c) => c.score >= 30).length;

  // 2. Second pass: If we don't have enough strong similar candidates, expand to globalPool
  if (strongLocalCount < count && globalPool && globalPool.length > 0) {
    processPool(globalPool, 30);
  }

  // 3. Sort candidates:
  // Sort by score descending with slight random jitter for equal top candidates
  scoredCandidates.sort((a, b) => {
    if (Math.abs(a.score - b.score) <= 5) {
      return Math.random() - 0.5;
    }
    return b.score - a.score;
  });

  const chosenDistractors: string[] = scoredCandidates
    .slice(0, count)
    .map((c) => c.label);

  // 4. Fallback if still under count
  if (chosenDistractors.length < count) {
    const fallbackList = options?.fallbackDistractors || ['Đáp án B', 'Đáp án C', 'Đáp án D'];
    while (chosenDistractors.length < count) {
      chosenDistractors.push(fallbackList[chosenDistractors.length] || `Lựa chọn ${chosenDistractors.length + 1}`);
    }
  }

  return chosenDistractors;
}
