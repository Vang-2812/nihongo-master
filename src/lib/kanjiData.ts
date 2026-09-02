import n5Data from '@/data/kanji/n5.json';
import n4Data from '@/data/kanji/n4.json';
import n3Data from '@/data/kanji/n3.json';
import n2Data from '@/data/kanji/n2.json';
import n1Data from '@/data/kanji/n1.json';
import radicalsData from '@/data/kanji/radicals.json';

import mimikaraData from '@/data/vocab/mimikara_n3.json';
import minnaData from '@/data/vocab/minna.json';
import somatomeData from '@/data/vocab/somatome_n3.json';
import tangoData from '@/data/vocab/tango.json';

export type KanjiLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface RadicalRef {
  character: string;
  is_main?: boolean;
  position?: string | null;
}

export interface KanjiItem {
  character: string;
  stroke_count: number;
  onyomi: string[];
  kunyomi: string[];
  meaning_vi: string;
  mnemonic_vi: string | null;
  radicals: RadicalRef[];
  level: KanjiLevel;
  jlptIndex?: number;
}

export interface RadicalDetail {
  radical: string;
  variants: string | null;
  stroke_count: number;
  meaning_vi: string;
  meaning_en: string;
  reading_ja: string;
  kangxi_number: number;
}

export interface KanjiCompound {
  word: string;
  reading: string;
  hanviet?: string;
  meaning: string;
  source?: string;
}

// Well-known Sino-Vietnamese and meanings override for placeholder or irregular entries
const KANJI_OVERRIDE: Record<string, { sinoVietnamese: string; meaning: string }> = {
  '二': { sinoVietnamese: 'NHỊ', meaning: 'Số hai (2)' },
  '五': { sinoVietnamese: 'NGŨ', meaning: 'Số năm (5)' },
  '気': { sinoVietnamese: 'KHÍ', meaning: 'Khí chất, tinh thần, tâm trạng' },
  '年': { sinoVietnamese: 'NIÊN', meaning: 'Năm, tuổi tác' },
  '入': { sinoVietnamese: 'NHẬP', meaning: 'Vào, đi vào, nhét vào' },
  '子': { sinoVietnamese: 'TỬ', meaning: 'Con cái, đứa trẻ' },
  '今': { sinoVietnamese: 'KIM', meaning: 'Bây giờ, hiện tại' },
  '来': { sinoVietnamese: 'LAI', meaning: 'Đến, tới' },
  '休': { sinoVietnamese: 'HƯU', meaning: 'Nghỉ ngơi' },
  '話': { sinoVietnamese: 'THOẠI', meaning: 'Nói chuyện, câu chuyện' },
};

export function parseKanjiMeaning(
  rawMeaning: string,
  char?: string
): { sinoVietnamese: string; meaning: string } {
  if (char && KANJI_OVERRIDE[char]) {
    return KANJI_OVERRIDE[char];
  }

  if (!rawMeaning) {
    return { sinoVietnamese: '', meaning: '' };
  }

  const text = rawMeaning.trim();

  // Pattern 1: SINO_VIETNAMESE (meaning in vietnamese)
  // e.g. "nhất (một)", "HOÀN (một khối; toàn bộ; nguyên vẹn)"
  const parenMatch = text.match(/^([^(]+)\s*\(([^)]+)\)/);
  if (parenMatch) {
    const rawSino = parenMatch[1].trim();
    const meaning = parenMatch[2].trim();
    return {
      sinoVietnamese: rawSino.toUpperCase(),
      meaning: meaning.charAt(0).toUpperCase() + meaning.slice(1),
    };
  }

  // Pattern 2: comma or semicolon separated
  const parts = text.split(/[,;]/);
  if (parts.length > 1) {
    return {
      sinoVietnamese: parts[0].trim().toUpperCase(),
      meaning: text,
    };
  }

  return {
    sinoVietnamese: text.toUpperCase(),
    meaning: text,
  };
}

// Attach levels to raw data
const typedN5: KanjiItem[] = (n5Data as any[]).map((k) => ({
  ...k,
  level: 'N5' as KanjiLevel,
}));

const typedN4: KanjiItem[] = (n4Data as any[]).map((k) => ({
  ...k,
  level: 'N4' as KanjiLevel,
}));

const typedN3: KanjiItem[] = (n3Data as any[]).map((k) => ({
  ...k,
  level: 'N3' as KanjiLevel,
}));

const typedN2: KanjiItem[] = (n2Data as any[]).map((k) => ({
  ...k,
  level: 'N2' as KanjiLevel,
}));

const typedN1: KanjiItem[] = (n1Data as any[]).map((k) => ({
  ...k,
  level: 'N1' as KanjiLevel,
}));

const allKanjiList: KanjiItem[] = [
  ...typedN5,
  ...typedN4,
  ...typedN3,
  ...typedN2,
  ...typedN1,
];

// Map by character for O(1) lookup
const kanjiByCharMap = new Map<string, KanjiItem>();
for (const item of allKanjiList) {
  if (!kanjiByCharMap.has(item.character)) {
    kanjiByCharMap.set(item.character, item);
  }
}

// Map radicals by radical character
const radicalMap = new Map<string, RadicalDetail>();
for (const r of radicalsData as RadicalDetail[]) {
  if (r.radical) {
    radicalMap.set(r.radical, r);
  }
}

// Pre-build compounds index
let compoundsIndex: Map<string, KanjiCompound[]> | null = null;

function getCompoundsIndex(): Map<string, KanjiCompound[]> {
  if (compoundsIndex) return compoundsIndex;

  const map = new Map<string, KanjiCompound[]>();

  const addCompound = (char: string, item: KanjiCompound) => {
    if (!map.has(char)) {
      map.set(char, []);
    }
    const list = map.get(char)!;
    if (!list.some((existing) => existing.word === item.word)) {
      list.push(item);
    }
  };

  // 1. mimikara_n3
  for (const item of mimikaraData as any[]) {
    const word = (item['Từ Vựng'] || '').trim();
    if (!word) continue;
    const hanviet = (item['Hán Tự'] || '').trim();
    const meaning = (item['Nghĩa'] || '').trim();
    const kanjiChars = Array.from(new Set<string>(word.split(''))).filter((c: string) =>
      /[\u4e00-\u9faf]/.test(c)
    );
    for (const c of kanjiChars) {
      addCompound(c, { word, reading: '', hanviet, meaning, source: 'Mimikara N3' });
    }
  }

  // 2. minna
  for (const item of minnaData as any[]) {
    const word = (item.word_jp || '').trim();
    if (!word) continue;
    const reading = (item.reading || '').trim();
    const meaning = (item.meaning_vi || '').trim();
    const kanjiChars = Array.from(new Set<string>(word.split(''))).filter((c: string) =>
      /[\u4e00-\u9faf]/.test(c)
    );
    for (const c of kanjiChars) {
      addCompound(c, { word, reading, hanviet: '', meaning, source: 'Minna' });
    }
  }

  // 3. somatome_n3
  for (const item of somatomeData as any[]) {
    const rawWord = (item.kanji || item.word || '').trim();
    if (!rawWord) continue;
    let cleanWord = rawWord.replace(/[\r\n\t]+/g, '').replace(/\s+/g, '').trim();
    let reading = (item.word || '').trim();
    const match = cleanWord.match(/^([^(]+)\(([^)]+)\)(.*)$/);
    if (match) {
      cleanWord = match[1] + match[3];
      if (reading === rawWord) reading = match[2];
    }
    const meaning = (item.meaning || '').trim();
    const kanjiChars = Array.from(new Set<string>(cleanWord.split(''))).filter((c: string) =>
      /[\u4e00-\u9faf]/.test(c)
    );
    for (const c of kanjiChars) {
      addCompound(c, { word: cleanWord, reading, hanviet: '', meaning, source: 'Somatome N3' });
    }
  }

  // 4. tango
  for (const item of tangoData as any[]) {
    const word = (item.kanji || '').trim();
    if (!word) continue;
    const reading = (item.kana || '').trim();
    const meaning = (item.vietnamese || '').trim();
    const kanjiChars = Array.from(new Set<string>(word.split(''))).filter((c: string) =>
      /[\u4e00-\u9faf]/.test(c)
    );
    for (const c of kanjiChars) {
      addCompound(c, { word, reading, hanviet: '', meaning, source: 'Tango' });
    }
  }

  compoundsIndex = map;
  return map;
}

export function getKanjiByLevel(level: KanjiLevel): KanjiItem[] {
  switch (level) {
    case 'N5':
      return typedN5;
    case 'N4':
      return typedN4;
    case 'N3':
      return typedN3;
    case 'N2':
      return typedN2;
    case 'N1':
      return typedN1;
    default:
      return typedN5;
  }
}

export function getAllKanji(): KanjiItem[] {
  return allKanjiList;
}

export function getAllKanjiCharacters(): string[] {
  return Array.from(kanjiByCharMap.keys());
}

export function getKanjiByCharacter(char: string): KanjiItem | undefined {
  if (!char) return undefined;
  const decoded = decodeURIComponent(char);
  return kanjiByCharMap.get(decoded) || kanjiByCharMap.get(char);
}

export function getRadicalDetail(radicalChar: string): RadicalDetail | undefined {
  return radicalMap.get(radicalChar);
}

export function getCompoundsForKanji(char: string, limit: number = 20): KanjiCompound[] {
  const index = getCompoundsIndex();
  const list = index.get(char) || [];
  return list.slice(0, limit);
}

export function getAdjacentKanji(
  char: string,
  level?: KanjiLevel
): { prev: KanjiItem | null; next: KanjiItem | null } {
  const targetLevel = level || getKanjiByCharacter(char)?.level || 'N5';
  const list = getKanjiByLevel(targetLevel);
  const index = list.findIndex((k) => k.character === char);

  if (index === -1) {
    return { prev: null, next: null };
  }

  const prev = index > 0 ? list[index - 1] : null;
  const next = index < list.length - 1 ? list[index + 1] : null;

  return { prev, next };
}
