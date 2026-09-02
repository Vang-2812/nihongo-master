'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Layers,
  Dices,
  Zap,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Play,
  GraduationCap,
} from 'lucide-react';
import { useSRSStore } from '@/stores/srsStore';
import { getAllTextbooks, getAllLessons, TextbookId } from '@/lib/vocabData';

export type QuizMode = 'builder' | 'choice' | 'matching';
export type QuizSource = 'srs' | 'level' | 'lesson';

export default function QuizHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { cards, stats } = useSRSStore();

  const [selectedMode, setSelectedMode] = useState<QuizMode>('builder');
  const [selectedSource, setSelectedSource] = useState<QuizSource>('level');
  const [selectedLevel, setSelectedLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>('N5');
  const [selectedBook, setSelectedBook] = useState<TextbookId>('minna_n5');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('minna_1');
  const [questionCount, setQuestionCount] = useState<number>(15);
  const [pairCount, setPairCount] = useState<number>(6);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalSRSCards = mounted ? Object.keys(cards).length : 0;
  const textbooks = getAllTextbooks();
  const lessonsForSelectedBook = getAllLessons().filter((l) => l.bookId === selectedBook);

  // Auto-update lesson when textbook changes
  const handleBookChange = (bookId: TextbookId) => {
    setSelectedBook(bookId);
    const bookLessons = getAllLessons().filter((l) => l.bookId === bookId);
    if (bookLessons.length > 0) {
      setSelectedLessonId(bookLessons[0].id);
    }
  };

  // Build Quiz Launch URL
  const handleStartQuiz = () => {
    const params = new URLSearchParams();
    params.set('source', selectedSource);

    if (selectedSource === 'level') {
      params.set('level', selectedLevel);
    } else if (selectedSource === 'lesson') {
      params.set('lessonId', selectedLessonId);
    }

    if (selectedMode === 'matching') {
      params.set('count', String(pairCount));
    } else {
      params.set('count', String(questionCount));
    }

    router.push(`/review/quiz/${selectedMode}?${params.toString()}`);
  };

  const modeCards = [
    {
      id: 'builder' as QuizMode,
      title: 'Ghép Ký Tự (Word Builder)',
      badge: '⭐ Độc Quyền',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
      description: 'Luyện phản xạ chính tả: xếp các ô ký tự moras rời rạc thành từ tiếng Nhật hoàn chỉnh.',
      icon: Sparkles,
      iconColor: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
      accentColor: 'border-amber-500 ring-amber-500',
    },
    {
      id: 'choice' as QuizMode,
      title: 'Trắc Nghiệm 4 Đáp Án',
      badge: 'Tốc độ',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300',
      description: 'Luyện phản xạ nhận diện từ vựng và Hán tự cực nhanh với 4 lựa chọn nghĩa tiếng Việt.',
      icon: CheckCircle2,
      iconColor: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60',
      accentColor: 'border-indigo-600 ring-indigo-600',
    },
    {
      id: 'matching' as QuizMode,
      title: 'Ghép Thẻ (Matching Game)',
      badge: 'Ghi nhớ',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
      description: 'Nối các cặp thẻ từ vựng tiếng Nhật và nghĩa tương ứng trong thời gian ngắn nhất.',
      icon: Zap,
      iconColor: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
      accentColor: 'border-emerald-500 ring-emerald-500',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/review"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Quay lại Ôn tập SRS"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Dices className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              <span>Trung Tâm Quizlet & Trò Chơi</span>
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1 ml-9">
            Củng cố trí nhớ với đa dạng chế độ: Trắc nghiệm, Ghép thẻ, và Ghép ký tự Word Builder.
          </p>
        </div>

        {/* User Stats Preview */}
        {mounted && (
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{stats.streak} ngày</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{stats.totalXp} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: CHOOSE QUIZ MODE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
            1
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Chọn chế độ thử thách
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modeCards.map((m) => {
            const isSelected = selectedMode === m.id;
            const Icon = m.icon;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMode(m.id)}
                className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 select-none ${
                  isSelected
                    ? `bg-white dark:bg-slate-900 ${m.accentColor} shadow-xl shadow-indigo-500/10 ring-2`
                    : 'bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`p-2.5 rounded-2xl ${m.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${m.badgeColor}`}
                    >
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                  <span className={isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-400'}>
                    {isSelected ? '✓ Đã chọn' : 'Nhấn để chọn'}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: CHOOSE SCOPE / SOURCE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
            2
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Chọn phạm vi luyện tập
          </h2>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          {/* Source Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setSelectedSource('level')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedSource === 'level'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Theo Cấp Độ JLPT</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSource('lesson')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedSource === 'lesson'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Theo Bài Giáo Trình</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSource('srs')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedSource === 'srs'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Kho SRS Của Bạn ({totalSRSCards})</span>
            </button>
          </div>

          {/* Tab 1 Content: JLPT Level Selector */}
          {selectedSource === 'level' && (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Chọn Cấp Độ (N5 - N1)
              </label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`py-3 rounded-2xl font-bold font-mono text-sm sm:text-base border-2 transition-all ${
                      selectedLevel === lvl
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-600/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2 Content: Lesson & Textbook Selector */}
          {selectedSource === 'lesson' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Textbook Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Giáo trình
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => handleBookChange(e.target.value as TextbookId)}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {textbooks.map((tb) => (
                      <option key={tb.id} value={tb.id}>
                        {tb.title} ({tb.lessonCount} bài)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Bài học
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {lessonsForSelectedBook.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title} ({l.items.length} từ)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3 Content: SRS Overview */}
          {selectedSource === 'srs' && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-sm text-slate-700 dark:text-slate-300 space-y-1 animate-fadeIn">
              <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                {totalSRSCards > 0
                  ? `Đang có ${totalSRSCards} thẻ flashcard trong kho SRS cá nhân của bạn.`
                  : 'Kho SRS chưa có thẻ nào. Hệ thống sẽ tự động dùng dữ liệu từ vựng N5 khởi đầu.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các câu hỏi trắc nghiệm và trò chơi sẽ ưu tiên lấy từ các thẻ bạn đã lưu hoặc đang ôn tập.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: QUESTION / PAIR COUNT & LAUNCH */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
            3
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Số lượng câu hỏi / Cặp thẻ
          </h2>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {selectedMode === 'matching' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {[6, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPairCount(count)}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                    pairCount === count
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count} cặp ({count * 2} thẻ)
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {[10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${
                    questionCount === count
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count} câu
                </button>
              ))}
            </div>
          )}

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStartQuiz}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-base shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Bắt Đầu Thử Thách Ngay</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}