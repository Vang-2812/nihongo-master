import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getAllLessonIds,
  getLessonById,
  getAdjacentLessons,
} from '@/lib/vocabData';
import LessonDetailView from '@/components/vocab/LessonDetailView';

export function generateStaticParams() {
  const lessonIds = getAllLessonIds();
  return lessonIds.map((lessonId) => ({
    lessonId,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { lessonId: string };
}): Metadata {
  const lesson = getLessonById(params.lessonId);

  if (!lesson) {
    return {
      title: 'TANGO ARCHIVE | Nihongo Master',
    };
  }

  return {
    title: `[ ${lesson.level} ] ${lesson.title} · ${lesson.bookTitle} | TANGO ARCHIVE`,
    description: `Từ vựng tiếng Nhật: ${lesson.title} (${lesson.bookTitle}) gồm ${lesson.items.length} từ. Phát âm chuẩn bản xứ, âm Hán Việt, bài tập AI và chu kỳ ôn tập SRS.`,
  };
}

export default function LessonDetailPage({
  params,
}: {
  params: { lessonId: string };
}) {
  const lesson = getLessonById(params.lessonId);

  if (!lesson) {
    notFound();
  }

  const adjacent = getAdjacentLessons(params.lessonId);

  return <LessonDetailView lesson={lesson} adjacent={adjacent} />;
}
