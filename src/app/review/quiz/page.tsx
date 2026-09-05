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
      title: 'WORD BUILDER',
      subtitle: 'Ghép Ký Tự',
      badge: 'EXCLUSIVE',
      description: 'Luyện phản xạ chính tả: xếp các ô ký tự moras rời rạc thành từ tiếng Nhật hoàn chỉnh.',
      icon: Sparkles,
    },
    {
      id: 'choice' as QuizMode,
      title: 'MULTIPLE CHOICE',
      subtitle: 'Trắc Nghiệm 4 Đáp Án',
      badge: 'SPEED',
      description: 'Luyện phản xạ nhận diện từ vựng và Hán tự cực nhanh với 4 lựa chọn nghĩa tiếng Việt.',
      icon: CheckCircle2,
    },
    {
      id: 'matching' as QuizMode,
      title: 'MATCHING TILES',
      subtitle: 'Ghép Cặp Thẻ',
      badge: 'MEMORY',
      description: 'Nối các cặp thẻ từ vựng tiếng Nhật và nghĩa tương ứng trong thời gian ngắn nhất.',
      icon: Zap,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/review"
              className="p-2 border border-stone-300 bg-white text-stone-700 hover:bg-stone-100 transition-colors duration-100 rounded-none shadow-xs"
              title="Quay lại Ôn tập SRS"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-serif font-light text-stone-900 tracking-tight uppercase flex items-center gap-2.5">
              <span>QUIZ & GAME HUB · 練習</span>
            </h1>
          </div>
          <p className="text-stone-600 font-sans text-sm sm:text-base mt-1 ml-11">
            Củng cố phản xạ ngôn ngữ qua các bài tập kiểm tra trắc nghiệm, ghép cặp thẻ và cấu trúc từ.
          </p>
        </div>

        {/* User Stats Preview */}
        {mounted && (
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto border border-stone-200 bg-white p-2 rounded-none shadow-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 border border-amber-200 bg-amber-50 text-xs font-mono font-medium text-amber-800 rounded-none">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>{stats.streak}D STREAK</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 border border-stone-200 bg-stone-100 text-stone-800 text-xs font-mono font-medium rounded-none">
              <Sparkles className="w-3.5 h-3.5 text-stone-600" />
              <span>{stats.totalXp} XP</span>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: CHOOSE QUIZ MODE */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 border border-stone-300 bg-stone-100 text-stone-800 font-mono font-medium text-xs flex items-center justify-center rounded-none">
            1
          </span>
          <h2 className="text-sm font-sans uppercase tracking-wider font-medium text-stone-900">
            CHỌN CHẾ ĐỘ THỬ THÁCH · SELECT MODE
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
                className={`relative p-5 transition-all duration-100 cursor-pointer flex flex-col justify-between space-y-4 select-none rounded-none shadow-xs ${
                  isSelected
                    ? 'border-2 border-stone-800 bg-stone-50'
                    : 'border border-stone-200 bg-white hover:border-stone-400 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={`p-2 border rounded-none ${
                        isSelected
                          ? 'border-stone-800 bg-stone-900 text-white'
                          : 'border-stone-300 bg-stone-100 text-stone-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 border border-stone-200 bg-stone-50 text-stone-700 rounded-none uppercase tracking-wider">
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-serif font-medium text-stone-900 uppercase tracking-wide">
                    {m.title}
                  </h3>
                  <p className="text-xs font-sans text-stone-500 mt-0.5 uppercase tracking-wider">
                    {m.subtitle}
                  </p>
                  <p className="text-xs font-sans text-stone-600 mt-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-sans font-medium uppercase tracking-wider">
                  <span className={isSelected ? 'font-medium text-stone-900' : 'text-stone-400'}>
                    {isSelected ? 'ĐÃ CHỌN ✓' : 'CHỌN'}
                  </span>
                  <div
                    className={`w-4 h-4 border flex items-center justify-center rounded-none ${
                      isSelected ? 'border-stone-800 bg-stone-900 text-white' : 'border-stone-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 bg-white" />}
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
          <span className="w-6 h-6 border border-stone-300 bg-stone-100 text-stone-800 font-mono font-medium text-xs flex items-center justify-center rounded-none">
            2
          </span>
          <h2 className="text-sm font-sans uppercase tracking-wider font-medium text-stone-900">
            CHỌN PHẠM VI LUYỆN TẬP · SELECT SCOPE
          </h2>
        </div>

        <div className="p-5 sm:p-6 border border-stone-200 bg-white space-y-6 rounded-none shadow-sm">
          {/* Source Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 border border-stone-200 p-1 bg-stone-50 rounded-none">
            <button
              type="button"
              onClick={() => setSelectedSource('level')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono uppercase tracking-wider transition-colors duration-100 rounded-none ${
                selectedSource === 'level'
                  ? 'bg-stone-900 text-white font-medium shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>JLPT LEVEL (N5 - N1)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSource('lesson')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono uppercase tracking-wider transition-colors duration-100 rounded-none ${
                selectedSource === 'lesson'
                  ? 'bg-stone-900 text-white font-medium shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>BY TEXTBOOK LESSON</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSource('srs')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-mono uppercase tracking-wider transition-colors duration-100 rounded-none ${
                selectedSource === 'srs'
                  ? 'bg-stone-900 text-white font-medium shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>SRS REPOSITORY ({totalSRSCards})</span>
            </button>
          </div>

          {/* Tab 1 Content: JLPT Level Selector with Pastel Colors */}
          {selectedSource === 'level' && (
            <div className="space-y-3 animate-fadeIn">
              <label className="text-xs font-mono uppercase tracking-wider text-stone-500 block">
                CHỌN CẤP ĐỘ / SELECT LEVEL
              </label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {([
                  { lvl: 'N5', colorClass: 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100', activeClass: 'border-2 border-stone-800 bg-emerald-100 text-emerald-900 font-bold shadow-xs' },
                  { lvl: 'N4', colorClass: 'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100', activeClass: 'border-2 border-stone-800 bg-sky-100 text-sky-900 font-bold shadow-xs' },
                  { lvl: 'N3', colorClass: 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100', activeClass: 'border-2 border-stone-800 bg-amber-100 text-amber-900 font-bold shadow-xs' },
                  { lvl: 'N2', colorClass: 'border border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100', activeClass: 'border-2 border-stone-800 bg-purple-100 text-purple-900 font-bold shadow-xs' },
                  { lvl: 'N1', colorClass: 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100', activeClass: 'border-2 border-stone-800 bg-rose-100 text-rose-900 font-bold shadow-xs' },
                ] as const).map(({ lvl, colorClass, activeClass }) => {
                  const isLvlSelected = selectedLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`py-3 font-mono text-sm sm:text-base transition-all duration-100 rounded-none ${
                        isLvlSelected ? activeClass : colorClass
                      }`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2 Content: Lesson & Textbook Selector */}
          {selectedSource === 'lesson' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Textbook Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-stone-500 block">
                    GIÁO TRÌNH / TEXTBOOK
                  </label>
                  <select
                    value={selectedBook}
                    onChange={(e) => handleBookChange(e.target.value as TextbookId)}
                    className="w-full p-3 border border-stone-300 bg-white text-stone-900 font-mono text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-stone-400 shadow-xs"
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
                  <label className="text-xs font-mono uppercase tracking-wider text-stone-500 block">
                    BÀI HỌC / LESSON
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full p-3 border border-stone-300 bg-white text-stone-900 font-mono text-sm rounded-none focus:outline-none focus:ring-1 focus:ring-stone-400 shadow-xs"
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
            <div className="p-4 border border-stone-200 bg-stone-50 text-sm text-stone-800 space-y-1 animate-fadeIn rounded-none">
              <p className="font-sans text-xs uppercase tracking-wider font-medium text-stone-900">
                {totalSRSCards > 0
                  ? `SRS: ${totalSRSCards} THẺ TRONG HÀNG ĐỢI ÔN TẬP`
                  : 'SRS TRỐNG: TỰ ĐỘNG NẠP TỪ VỰNG N5 KHỞI ĐẦU'}
              </p>
              <p className="text-xs text-stone-600 font-sans">
                Các câu hỏi trắc nghiệm và trò chơi sẽ ưu tiên lấy từ các thẻ bạn đã lưu hoặc đang ôn tập.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: QUESTION / PAIR COUNT & LAUNCH */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 border border-stone-300 bg-stone-100 text-stone-800 font-mono font-medium text-xs flex items-center justify-center rounded-none">
            3
          </span>
          <h2 className="text-sm font-sans uppercase tracking-wider font-medium text-stone-900">
            SỐ LƯỢNG MỤC THỬ THÁCH · COUNT
          </h2>
        </div>

        <div className="p-5 sm:p-6 border border-stone-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 rounded-none shadow-sm">
          {selectedMode === 'matching' ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {[6, 8].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPairCount(count)}
                  className={`flex-1 sm:flex-initial px-5 py-2.5 font-sans font-medium text-xs sm:text-sm border transition-colors duration-100 rounded-none shadow-xs ${
                    pairCount === count
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {count} CẶP · {count * 2} THẺ
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
                  className={`flex-1 sm:flex-initial px-5 py-2.5 font-sans font-medium text-xs sm:text-sm border transition-colors duration-100 rounded-none shadow-xs ${
                    questionCount === count
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {count} CÂU HỎI
                </button>
              ))}
            </div>
          )}

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStartQuiz}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 border border-stone-900 bg-stone-900 text-white hover:bg-stone-800 font-sans font-medium text-xs sm:text-sm uppercase tracking-wider transition-colors duration-100 rounded-none shadow-xs active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>BẮT ĐẦU LUYỆN TẬP · 開始</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}