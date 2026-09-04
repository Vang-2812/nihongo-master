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
