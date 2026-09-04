# AI Cloze Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng tính năng tạo bài tập điền từ bằng AI (OpenAI/DeepSeek API) cho từng từ vựng trong bài học, lưu vào SQLite Turso theo mã syncCode và cung cấp giao diện làm bài tập trắc nghiệm 4 lựa chọn tối ưu cho mobile kèm công tắc bật/tắt bản dịch tiếng Việt.

**Architecture:** Sử dụng Next.js API Route `/api/ai/generate-exercises` làm proxy gọi LLM tránh lỗi CORS; lưu trữ bộ câu hỏi vào bảng `ai_lesson_exercises` trong SQLite Turso và cache `localStorage`; tích hợp modal làm bài tập tương tác `AIClozeQuizModal` với âm thanh TTS, giải thích ngữ cảnh và nút toggle bản dịch tiếng Việt.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand Persist, Drizzle ORM, @libsql/client (Turso SQLite), Lucide React, Web Speech API / TTS.

**Spec:** docs/superpowers/specs/2026-09-04-ai-cloze-exercises-design.md

## Global Constraints
- Default AI Endpoint: `https://api.deepseek.com/v1`
- Default Model: `deepseek-chat`
- API Key must be stored safely in client `localStorage` (`nihongo_ai_config`) and never committed to git.
- Support offline usage with local cache when no network or no syncCode is linked.
- Mobile first: touch-friendly target sizes (min 44px), instant feedback, and clean layout without clutter.
- All unit tests and static builds (`npm run build`) must pass with 0 errors.

---

### Task 1: AI Configuration Store & Data Types

**Files:**
- Create: `src/types/ai.ts`
- Create: `src/stores/aiStore.ts`
- Test: `src/stores/__tests__/aiStore.test.ts`

**Interfaces:**
- Produces:
  - `ClozeExerciseItem`: `{ id: string; vocabId: string; targetWord: string; targetReading: string; sentence: string; fullSentence: string; translation: string; options: string[]; correctIndex: number; explanation: string; }`
  - `AILessonExerciseSet`: `{ lessonId: string; syncCode: string; model: string; exercises: ClozeExerciseItem[]; updatedAt: number; }`
  - `AIConfig`: `{ endpointUrl: string; apiKey: string; modelName: string; showTranslationInQuiz: boolean; }`
  - `useAIStore`: Hook Zustand persist với `config`, `setConfig`, `cachedExercises`, `saveExercisesToCache`, `getExercisesFromCache`

- [ ] **Step 1: Write the failing test**

```typescript
// src/stores/__tests__/aiStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAIStore } from '../aiStore';

describe('AI Store', () => {
  beforeEach(() => {
    useAIStore.setState({
      config: {
        endpointUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        modelName: 'deepseek-chat',
        showTranslationInQuiz: true,
      },
      cachedExercises: {},
    });
  });

  it('updates AI configuration properly', () => {
    useAIStore.getState().setConfig({
      apiKey: 'sk-test-123456',
      modelName: 'deepseek-v4-flash',
    });

    const state = useAIStore.getState();
    expect(state.config.apiKey).toBe('sk-test-123456');
    expect(state.config.modelName).toBe('deepseek-v4-flash');
    expect(state.config.endpointUrl).toBe('https://api.deepseek.com/v1');
    expect(state.config.showTranslationInQuiz).toBe(true);
  });

  it('caches and retrieves exercises by lessonId', () => {
    const mockExercises = [
      {
        id: 'ex_1',
        vocabId: 'minna_1_1',
        targetWord: 'わたし',
        targetReading: 'わたし',
        sentence: '（　　）は学生です。',
        fullSentence: 'わたしは学生です。',
        translation: 'Tôi là học sinh.',
        options: ['わたし', 'あなた', 'せんせい', 'だれ'],
        correctIndex: 0,
        explanation: 'Dùng わたし để chỉ bản thân.',
      },
    ];

    useAIStore.getState().saveExercisesToCache('minna_lesson_1', mockExercises, 'deepseek-chat');
    const cached = useAIStore.getState().getExercisesFromCache('minna_lesson_1');

    expect(cached).not.toBeNull();
    expect(cached?.exercises.length).toBe(1);
    expect(cached?.exercises[0].targetWord).toBe('わたし');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/stores/__tests__/aiStore.test.ts`
Expected: FAIL with module not found `../aiStore`

- [ ] **Step 3: Write types and implementation**

Create `src/types/ai.ts`:
```typescript
export interface ClozeExerciseItem {
  id: string;
  vocabId: string;
  targetWord: string;
  targetReading: string;
  sentence: string;
  fullSentence: string;
  translation: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AILessonExerciseSet {
  lessonId: string;
  syncCode: string;
  model: string;
  exercises: ClozeExerciseItem[];
  updatedAt: number;
}

export interface AIConfig {
  endpointUrl: string;
  apiKey: string;
  modelName: string;
  showTranslationInQuiz: boolean;
}
```

Create `src/stores/aiStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIConfig, ClozeExerciseItem, AILessonExerciseSet } from '@/types/ai';

interface AIState {
  config: AIConfig;
  cachedExercises: Record<string, AILessonExerciseSet>;
  setConfig: (config: Partial<AIConfig>) => void;
  saveExercisesToCache: (lessonId: string, exercises: ClozeExerciseItem[], model: string, syncCode?: string) => void;
  getExercisesFromCache: (lessonId: string) => AILessonExerciseSet | null;
  toggleTranslationSetting: () => void;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      config: {
        endpointUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        modelName: 'deepseek-chat',
        showTranslationInQuiz: true,
      },
      cachedExercises: {},

      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),

      saveExercisesToCache: (lessonId, exercises, model, syncCode = 'local') =>
        set((state) => ({
          cachedExercises: {
            ...state.cachedExercises,
            [lessonId]: {
              lessonId,
              syncCode,
              model,
              exercises,
              updatedAt: Date.now(),
            },
          },
        })),

      getExercisesFromCache: (lessonId) => {
        return get().cachedExercises[lessonId] || null;
      },

      toggleTranslationSetting: () =>
        set((state) => ({
          config: {
            ...state.config,
            showTranslationInQuiz: !state.config.showTranslationInQuiz,
          },
        })),
    }),
    {
      name: 'nihongo_ai_store',
      partialize: (state) => ({
        config: state.config,
        cachedExercises: state.cachedExercises,
      }),
    }
  )
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/stores/__tests__/aiStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/ai.ts src/stores/aiStore.ts src/stores/__tests__/aiStore.test.ts
git commit -m "feat(ai): add ai configuration types, zustand persist store and unit tests"
```

---

### Task 2: SQLite Schema & Database Persistence Routes

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/app/api/ai/exercises/route.ts`
- Test: `src/app/api/ai/exercises/__tests__/exercises.test.ts`

**Interfaces:**
- Consumes: `src/db/index.ts`, `src/types/ai.ts`
- Produces:
  - Table `ai_lesson_exercises`
  - `GET /api/ai/exercises?lessonId=...&syncCode=...` -> returns `{ success: true, exercises: ClozeExerciseItem[], model: string }`
  - `POST /api/ai/exercises` -> body `{ lessonId, syncCode, model, exercises }` -> persists to SQLite

- [ ] **Step 1: Write failing test for exercises API route**

```typescript
// src/app/api/ai/exercises/__tests__/exercises.test.ts
import { describe, it, expect } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('AI Exercises Database API Route', () => {
  it('handles GET and POST validation gracefully', async () => {
    const postReq = new NextRequest('http://localhost:3000/api/ai/exercises', {
      method: 'POST',
      body: JSON.stringify({ lessonId: '', exercises: [] }),
    });
    const postRes = await POST(postReq);
    expect(postRes.status).toBe(400);

    const getReq = new NextRequest('http://localhost:3000/api/ai/exercises?lessonId=');
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/ai/exercises/__tests__/exercises.test.ts`
Expected: FAIL with route not found

- [ ] **Step 3: Update schema.ts and implement route.ts**

Update `src/db/schema.ts`:
```typescript
export const aiLessonExercises = sqliteTable('ai_lesson_exercises', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull(),
  syncCode: text('sync_code').notNull(),
  model: text('model').notNull(),
  totalExercises: integer('total_exercises').notNull(),
  exercisesData: text('exercises_data').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
```

Implement `src/app/api/ai/exercises/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiLessonExercises } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');
    const syncCode = searchParams.get('syncCode') || 'local';

    if (!lessonId) {
      return NextResponse.json({ success: false, error: 'lessonId is required' }, { status: 400 });
    }

    const id = `${lessonId}_${syncCode}`;
    const records = await db.select().from(aiLessonExercises).where(eq(aiLessonExercises.id, id));

    if (records.length === 0) {
      return NextResponse.json({ success: true, found: false, exercises: null });
    }

    const record = records[0];
    const exercises = JSON.parse(record.exercisesData);

    return NextResponse.json({
      success: true,
      found: true,
      lessonId: record.lessonId,
      syncCode: record.syncCode,
      model: record.model,
      totalExercises: record.totalExercises,
      exercises,
      updatedAt: record.updatedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonId, syncCode = 'local', model = 'deepseek-chat', exercises } = body;

    if (!lessonId || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { success: false, error: 'lessonId and non-empty exercises array are required' },
        { status: 400 }
      );
    }

    const id = `${lessonId}_${syncCode}`;
    const now = Date.now();
    const exercisesData = JSON.stringify(exercises);

    await db
      .insert(aiLessonExercises)
      .values({
        id,
        lessonId,
        syncCode,
        model,
        totalExercises: exercises.length,
        exercisesData,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: aiLessonExercises.id,
        set: {
          model,
          totalExercises: exercises.length,
          exercisesData,
          updatedAt: now,
        },
      });

    return NextResponse.json({ success: true, message: 'Exercises saved successfully', count: exercises.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/ai/exercises/__tests__/exercises.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/app/api/ai/exercises/route.ts src/app/api/ai/exercises/__tests__/exercises.test.ts
git commit -m "feat(api): implement ai lesson exercises sqlite table and get/post persistence endpoints"
```

---

### Task 3: AI Proxy Generator Route & Prompt Engineering

**Files:**
- Create: `src/lib/aiPrompt.ts`
- Create: `src/app/api/ai/generate-exercises/route.ts`
- Test: `src/lib/__tests__/aiPrompt.test.ts`

**Interfaces:**
- Consumes: `src/types/ai.ts`
- Produces:
  - `buildClozePrompt(lessonTitle, level, words)`
  - `parseClozeResponse(rawText)`
  - `POST /api/ai/generate-exercises`

- [ ] **Step 1: Write the failing test for AI prompt parser**

```typescript
// src/lib/__tests__/aiPrompt.test.ts
import { describe, it, expect } from 'vitest';
import { parseClozeResponse, buildClozePrompt } from '../aiPrompt';

describe('AI Prompt & Parser Helpers', () => {
  it('builds prompt containing vocabulary list', () => {
    const prompt = buildClozePrompt('Bài 1', 'N5', [
      { id: '1', word: 'わたし', reading: 'わたし', meaning: 'tôi' },
    ]);
    expect(prompt.system).toContain('JSON');
    expect(prompt.user).toContain('わたし');
  });

  it('correctly parses pure JSON array', () => {
    const raw = JSON.stringify([
      {
        id: '1',
        vocabId: 'v1',
        targetWord: 'わたし',
        targetReading: 'わたし',
        sentence: '（　　）はベトナム人です。',
        fullSentence: 'わたしはベトナム人です。',
        translation: 'Tôi là người Việt Nam.',
        options: ['わたし', 'あなた', 'かれ', 'せんせい'],
        correctIndex: 0,
        explanation: 'Tự giới thiệu bản thân.',
      },
    ]);
    const parsed = parseClozeResponse(raw);
    expect(parsed.length).toBe(1);
    expect(parsed[0].targetWord).toBe('わたし');
  });

  it('cleans markdown codeblocks before parsing', () => {
    const rawWithMarkdown = `Here is the JSON:\n\`\`\`json\n[{"id":"1","vocabId":"v1","targetWord":"ほん","targetReading":"ほん","sentence":"（　　）を読みます。","fullSentence":"ほんを読みます。","translation":"Đọc sách.","options":["ほん","ペン","ノート","つくえ"],"correctIndex":0,"explanation":"ほん là sách."}]\n\`\`\``;
    const parsed = parseClozeResponse(rawWithMarkdown);
    expect(parsed.length).toBe(1);
    expect(parsed[0].targetWord).toBe('ほん');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/__tests__/aiPrompt.test.ts`
Expected: FAIL with module not found

- [ ] **Step 3: Implement aiPrompt.ts and generate-exercises route**

Create `src/lib/aiPrompt.ts`:
```typescript
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
1. Đối với MỖI từ vựng trong danh sách được cung cấp, hãy tạo đúng 1 câu ví dụ tiếng Nhật tự nhiên, phù hợp với trình độ ${level}.
2. Thay thế từ vựng mục tiêu trong câu bằng ký hiệu chỗ trống: （　　）.
3. Tạo 4 phương án trắc nghiệm trong mảng "options": gồm 1 từ mục tiêu và 3 từ gây nhiễu (distractors) cùng từ loại hoặc cùng cấp độ JLPT ${level}. Đảm bảo các lựa chọn được xáo trộn ngẫu nhiên.
4. "correctIndex": Chỉ số (0, 1, 2 hoặc 3) của đáp án đúng trong mảng "options".
5. "fullSentence": Câu tiếng Nhật hoàn chỉnh khi đã điền từ đúng vào chỗ trống.
6. "translation": Bản dịch câu hoàn chỉnh sang tiếng Việt tự nhiên, chính xác.
7. "explanation": Giải thích ngắn gọn (1-2 câu tiếng Việt) vì sao từ đó là đáp án chính xác trong ngữ cảnh câu này.
8. QUAN TRỌNG: Đầu ra CHỈ LÀ một mảng JSON thuần túy (Pure JSON Array), KHÔNG kèm bất kỳ lời chào hay giải thích nào bên ngoài mảng JSON.`;

  const user = `Tạo bài tập điền từ cho bài học: "${lessonTitle}" (Trình độ: ${level}).
Danh sách từ vựng (${words.length} từ):
${words.map((w, idx) => `${idx + 1}. [ID: ${w.id}] Từ: "${w.word}" (Cách đọc: ${w.reading}) - Nghĩa: ${w.meaning}`).join('\n')}

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
```

Implement `src/app/api/ai/generate-exercises/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { buildClozePrompt, parseClozeResponse, VocabPromptItem } from '@/lib/aiPrompt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      endpointUrl = 'https://api.deepseek.com/v1',
      apiKey,
      model = 'deepseek-chat',
      lessonTitle = 'Bài học tiếng Nhật',
      level = 'N5',
      words = [],
    } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Chưa cấu hình API Key. Vui lòng vào Cài đặt để thêm API Key.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Danh sách từ vựng trống.' },
        { status: 400 }
      );
    }

    const { system, user } = buildClozePrompt(lessonTitle, level, words as VocabPromptItem[]);

    // Normalize endpoint URL: ensure it ends with /chat/completions
    let fullUrl = endpointUrl.trim();
    if (fullUrl.endsWith('/')) {
      fullUrl = fullUrl.slice(0, -1);
    }
    if (!fullUrl.endsWith('/chat/completions')) {
      fullUrl = `${fullUrl}/chat/completions`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout

    const aiRes = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model.trim() || 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      let errMsg = `Lỗi từ AI Provider (Mã: ${aiRes.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error?.message) errMsg = errJson.error.message;
      } catch {}
      return NextResponse.json({ success: false, error: errMsg }, { status: aiRes.status });
    }

    const data = await aiRes.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    const exercises = parseClozeResponse(rawContent);

    return NextResponse.json({
      success: true,
      model,
      exercises,
      total: exercises.length,
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu AI bị quá thời gian (timeout 90s). Vui lòng thử lại.' },
        { status: 504 }
      );
    }
    return NextResponse.json({ success: false, error: error.message || 'Lỗi không xác định' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/__tests__/aiPrompt.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/aiPrompt.ts src/app/api/ai/generate-exercises/route.ts src/lib/__tests__/aiPrompt.test.ts
git commit -m "feat(ai): add prompt builder, response parser and proxy generate-exercises endpoint"
```

---

### Task 4: AI Settings UI in `/settings`

**Files:**
- Create: `src/components/settings/AISettingsSection.tsx`
- Modify: `src/app/settings/page.tsx`
- Test: `src/components/settings/__tests__/AISettingsSection.test.tsx` (or verify in Settings page)

**Interfaces:**
- Consumes: `useAIStore`
- Produces: Visual section with Endpoint input, API Key input (with eye toggle), Model input, translation toggle, and "Test Connection" button.

- [ ] **Step 1: Create AISettingsSection component**

```tsx
// src/components/settings/AISettingsSection.tsx
'use client';

import React, { useState } from 'react';
import { useAIStore } from '@/stores/aiStore';
import { toast } from '@/stores/toastStore';
import { Sparkles, Eye, EyeOff, Check, RotateCcw, Zap, ExternalLink } from 'lucide-react';

export default function AISettingsSection() {
  const { config, setConfig } = useAIStore();
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleResetDefaults = () => {
    setConfig({
      endpointUrl: 'https://api.deepseek.com/v1',
      modelName: 'deepseek-chat',
    });
    toast.info('Đã khôi phục cài đặt AI mặc định!');
  };

  const handleTestConnection = async () => {
    if (!config.apiKey.trim()) {
      toast.error('Vui lòng nhập API Key trước khi kiểm tra!');
      return;
    }
    setIsTesting(true);
    try {
      const res = await fetch('/api/ai/generate-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          apiKey: config.apiKey,
          model: config.modelName,
          lessonTitle: 'Test Connection',
          level: 'N5',
          words: [{ id: 'test_1', word: 'ねこ', reading: 'ねこ', meaning: 'con mèo' }],
        }),
      });
      const data = await res.json();
      if (data.success && data.exercises?.length > 0) {
        toast.success('Kết nối AI thành công! Sẵn sàng tạo bài tập.');
      } else {
        toast.error(data.error || 'Kiểm tra thất bại. Vui lòng kiểm tra lại URL hoặc Key.');
      }
    } catch (err: any) {
      toast.error(`Lỗi kết nối: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mb-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Trí tuệ nhân tạo (AI Assistant)
              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                Mới
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Cấu hình mô hình AI để tự động tạo câu hỏi bài tập ngữ cảnh cho từ vựng
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
          title="Khôi phục mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mặc định</span>
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {/* Endpoint URL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            AI Endpoint URL (OpenAI Compatible)
          </label>
          <input
            type="text"
            value={config.endpointUrl}
            onChange={(e) => setConfig({ endpointUrl: e.target.value })}
            placeholder="https://api.deepseek.com/v1"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => setConfig({ apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Khóa bí mật chỉ được lưu trên trình duyệt của bạn (localStorage), không lưu trên server.
          </p>
        </div>

        {/* Model Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tên Mô Hình (Model)
            </label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => setConfig({ modelName: e.target.value })}
              placeholder="deepseek-chat"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono"
            />
          </div>

          {/* Translation Toggle */}
          <div className="flex flex-col justify-center">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Hiển thị bản dịch tiếng Việt khi làm bài
            </label>
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => setConfig({ showTranslationInQuiz: !config.showTranslationInQuiz })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.showTranslationInQuiz ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.showTranslationInQuiz ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {config.showTranslationInQuiz ? 'Hiện bản dịch' : 'Ẩn bản dịch (Thử thách)'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Connection Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all active:scale-95 shadow-sm shadow-purple-500/20"
          >
            {isTesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang kiểm tra kết nối...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Kiểm tra kết nối</span>
              </>
            )}
          </button>

          <a
            href="https://platform.deepseek.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-medium"
          >
            Lấy DeepSeek API Key
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount AISettingsSection in `src/app/settings/page.tsx`**

Place `<AISettingsSection />` above or alongside `SyncSettingsSection`.

- [ ] **Step 3: Verify build and test**

Run: `npm run build`
Expected: Succeeded with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/AISettingsSection.tsx src/app/settings/page.tsx
git commit -m "feat(settings): add ai assistant configuration section with endpoint, key, and test connection"
```

---

### Task 5: Interactive Mobile-Optimized Cloze Quiz Modal

**Files:**
- Create: `src/components/vocab/AIClozeQuizModal.tsx`
- Test: `src/components/vocab/__tests__/AIClozeQuizModal.test.tsx`

**Interfaces:**
- Consumes: `ClozeExerciseItem[]`, `useAIStore`, `useSRSStore` (for awarding XP)
- Produces: Full interactive practice modal with progress bar, question blank, 4 option buttons, Vietnamese translation toggle (eye icon), instant feedback colors, Japanese audio button, explanation block, and completion summary screen.

- [ ] **Step 1: Implement AIClozeQuizModal component**

Key behaviors:
- `isTranslationVisible` local state initialized with `config.showTranslationInQuiz`.
- Eye button to toggle translation on the fly.
- Options rendered in clean touch-friendly buttons.
- State tracks: `currentIndex`, `selectedAnswerIndex`, `isAnswered`, `score`, `wrongQuestions`.
- When selected: plays audio pronunciation of `item.fullSentence` using Japanese TTS engine, updates SRS XP (+5 XP for correct).
- Summary view shows score, percentage, XP gained, button to retry or return.

- [ ] **Step 2: Run test / verify rendering**

Write test or verify component imports and props.

- [ ] **Step 3: Commit**

```bash
git add src/components/vocab/AIClozeQuizModal.tsx
git commit -m "feat(vocab): add interactive mobile-optimized ai cloze quiz modal with audio and translation toggle"
```

---

### Task 6: Lesson Integration, Database Sync & Full Verification

**Files:**
- Modify: `src/components/vocab/LessonDetailView.tsx`
- Modify: `src/services/syncService.ts` (include AI exercises in sync check or fetch)
- Test: Full test suite `npm test` and build check `npm run build`

**Interfaces:**
- Consumes: `AIClozeQuizModal`, `useAIStore`, `/api/ai/exercises`, `/api/ai/generate-exercises`
- Produces:
  - "✨ Bài tập AI" button when no exercises exist.
  - "🎯 Luyện bài tập AI (X câu)" and "🔄 Tạo lại" buttons when exercises exist.
  - Generates exercises for all words or user-selected words.
  - Persists directly to SQLite Turso and local cache.

- [ ] **Step 1: Update LessonDetailView with AI Exercise Buttons and State**

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: 52+ tests passing.

- [ ] **Step 3: Run full static build**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/vocab/LessonDetailView.tsx src/services/syncService.ts
git commit -m "feat(lesson): integrate ai exercise generation, persistence, and cloze practice into lesson view"
```
