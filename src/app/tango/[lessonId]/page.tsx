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
      title: 'Bài học từ vựng - Nihongo Master',
    };
  }

  return {
    title: `${lesson.title} - ${lesson.bookTitle} | Nihongo Master`,
    description: `Học từ vựng tiếng Nhật ${lesson.title} thuộc giáo trình ${lesson.bookTitle} (${lesson.items.length} từ). Kèm phát âm giọng chuẩn bản xứ, âm Hán Việt và hệ thống ôn tập SRS thông minh.`,
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
