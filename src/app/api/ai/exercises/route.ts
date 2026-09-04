import { NextRequest, NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/db';
import { aiLessonExercises } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    await ensureDbInitialized();
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
    await ensureDbInitialized();
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

    return NextResponse.json({
      success: true,
      message: 'Exercises saved successfully',
      count: exercises.length,
      lessonId,
      syncCode,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
