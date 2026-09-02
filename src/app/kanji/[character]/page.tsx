import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllKanjiCharacters,
  getKanjiByCharacter,
  getAdjacentKanji,
  getRadicalDetail,
  getCompoundsForKanji,
  parseKanjiMeaning,
} from '@/lib/kanjiData';
import KanjiDetailView from '@/components/kanji/KanjiDetailView';

export function generateStaticParams() {
  const characters = getAllKanjiCharacters();
  return characters.map((character) => ({
    character,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { character: string };
}): Metadata {
  const char = decodeURIComponent(params.character);
  const kanji = getKanjiByCharacter(char);

  if (!kanji) {
    return {
      title: `Chữ Hán ${char} - Nihongo Master`,
    };
  }

  const { sinoVietnamese, meaning } = parseKanjiMeaning(
    kanji.meaning_vi,
    kanji.character
  );

  return {
    title: `${kanji.character} (${sinoVietnamese}) - Kanji ${kanji.level} | Nihongo Master`,
    description: `Học chữ Hán ${kanji.character} (${sinoVietnamese}) cấp độ ${kanji.level}: ${meaning}. Xem thứ tự nét viết, âm On/Kun, bộ thủ và các từ ghép thông dụng.`,
  };
}

export default function KanjiDetailPage({
  params,
}: {
  params: { character: string };
}) {
  const char = decodeURIComponent(params.character);
  const kanji = getKanjiByCharacter(char);

  if (!kanji) {
    notFound();
  }

  const adjacent = getAdjacentKanji(char, kanji.level);
  const radicalsWithDetails = (kanji.radicals || []).map((ref) => ({
    ref,
    detail: getRadicalDetail(ref.character),
  }));
  const compounds = getCompoundsForKanji(char);

  return (
    <KanjiDetailView
      kanji={kanji}
      adjacent={adjacent}
      radicalsWithDetails={radicalsWithDetails}
      compounds={compounds}
    />
  );
}
