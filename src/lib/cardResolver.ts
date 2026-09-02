import { SRSCard } from '@/stores/srsStore';
import { getAllVocab, getSinoVietnamese, VocabItem } from '@/lib/vocabData';
import { getKanjiByCharacter, parseKanjiMeaning, getCompoundsForKanji, KanjiItem, KanjiCompound } from '@/lib/kanjiData';

export interface ResolvedCardContent {
  id: string;
  cardType: 'vocab' | 'kanji';
  contentId: string | number;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  title: string;
  reading: string;
  sinoVietnamese?: string;
  meaning: string;
  meaningEn?: string;
  romaji?: string;
  wordType?: string;
  example?: {
    japanese: string;
    reading?: string;
    vietnamese: string;
  };
  onyomi?: string[];
  kunyomi?: string[];
  strokeCount?: number;
  radicals?: { character: string; is_main?: boolean; position?: string | null }[];
  mnemonic?: string | null;
  compounds?: KanjiCompound[];
}

let vocabMapCache: Map<string, VocabItem> | null = null;
let vocabWordMapCache: Map<string, VocabItem> | null = null;

function getVocabMaps() {
  if (vocabMapCache && vocabWordMapCache) {
    return { byId: vocabMapCache, byWord: vocabWordMapCache };
  }

  const byId = new Map<string, VocabItem>();
  const byWord = new Map<string, VocabItem>();
  const all = getAllVocab();

  for (const v of all) {
    byId.set(v.id, v);
    if (!byWord.has(v.word)) {
      byWord.set(v.word, v);
    }
  }

  vocabMapCache = byId;
  vocabWordMapCache = byWord;
  return { byId, byWord };
}

/**
 * Resolves full detailed metadata for an SRSCard (Vocab or Kanji)
 */
export function resolveCardContent(card: SRSCard): ResolvedCardContent {
  if (card.cardType === 'kanji') {
    const rawChar = String(card.contentId).replace(/^kanji_/, '');
    const kanji = getKanjiByCharacter(rawChar);

    if (kanji) {
      const parsed = parseKanjiMeaning(kanji.meaning_vi, kanji.character);
      const compounds = getCompoundsForKanji(kanji.character, 3);
      
      const kunStr = kanji.kunyomi && kanji.kunyomi.length > 0 ? kanji.kunyomi.join('・') : '';
      const onStr = kanji.onyomi && kanji.onyomi.length > 0 ? kanji.onyomi.join('・') : '';
      const combinedReading = [kunStr, onStr].filter(Boolean).join(' / ') || kanji.character;

      let example: { japanese: string; reading?: string; vietnamese: string } | undefined;
      if (compounds && compounds.length > 0) {
        const firstComp = compounds[0];
        example = {
          japanese: firstComp.word,
          reading: firstComp.reading,
          vietnamese: firstComp.meaning,
        };
      }

      return {
        id: card.id,
        cardType: 'kanji',
        contentId: card.contentId,
        level: card.level || kanji.level || 'N5',
        title: kanji.character,
        reading: combinedReading,
        sinoVietnamese: parsed.sinoVietnamese,
        meaning: parsed.meaning || kanji.meaning_vi,
        onyomi: kanji.onyomi,
        kunyomi: kanji.kunyomi,
        strokeCount: kanji.stroke_count,
        radicals: kanji.radicals,
        mnemonic: kanji.mnemonic_vi,
        compounds,
        example,
      };
    }

    return {
      id: card.id,
      cardType: 'kanji',
      contentId: card.contentId,
      level: card.level || 'N5',
      title: rawChar,
      reading: '',
      meaning: 'Hán tự',
      sinoVietnamese: getSinoVietnamese(rawChar),
    };
  }

  // Vocab card
  const rawId = String(card.contentId);
  const cleanId = rawId.replace(/^vocab_/, '');
  const { byId, byWord } = getVocabMaps();

  const vocab = byId.get(cleanId) || byId.get(rawId) || byWord.get(rawId) || byWord.get(cleanId);

  if (vocab) {
    const sino = vocab.sinoVietnamese || getSinoVietnamese(vocab.word);
    return {
      id: card.id,
      cardType: 'vocab',
      contentId: card.contentId,
      level: card.level || vocab.level || 'N5',
      title: vocab.word,
      reading: vocab.reading,
      sinoVietnamese: sino || undefined,
      meaning: vocab.meaning,
      meaningEn: vocab.meaningEn,
      romaji: vocab.romaji,
      wordType: vocab.wordType,
      example: vocab.example,
    };
  }

  return {
    id: card.id,
    cardType: 'vocab',
    contentId: card.contentId,
    level: card.level || 'N5',
    title: rawId,
    reading: rawId,
    meaning: 'Từ vựng',
    sinoVietnamese: getSinoVietnamese(rawId),
  };
}
