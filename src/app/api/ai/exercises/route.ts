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

    const globalId = `${lessonId}_global`;
    const globalRecords = await db.select().from(aiLessonExercises).where(eq(aiLessonExercises.id, globalId));
    const globalRecord = globalRecords.length > 0 ? globalRecords[0] : null;
    const globalDetail = globalRecord
      ? {
          lessonId: globalRecord.lessonId,
          syncCode: globalRecord.syncCode,
          model: globalRecord.model,
          totalExercises: globalRecord.totalExercises,
          exercises: JSON.parse(globalRecord.exercisesData),
          updatedAt: globalRecord.updatedAt,
        }
      : null;

    let customRecord = null;
    if (syncCode !== 'global') {
      const customId = `${lessonId}_${syncCode}`;
      const customRecords = await db.select().from(aiLessonExercises).where(eq(aiLessonExercises.id, customId));
      if (customRecords.length > 0) {
        customRecord = customRecords[0];
      }
    }

    const customDetail = customRecord
      ? {
          lessonId: customRecord.lessonId,
          syncCode: customRecord.syncCode,
          model: customRecord.model,
          totalExercises: customRecord.totalExercises,
          exercises: JSON.parse(customRecord.exercisesData),
          updatedAt: customRecord.updatedAt,
        }
      : null;

    if (!globalDetail && !customDetail) {
      return NextResponse.json({
        success: true,
        found: false,
        exercises: null,
        global: null,
        custom: null,
      });
    }

    // Default: custom if exists, otherwise global
    const primary = customDetail || globalDetail;

    return NextResponse.json({
      success: true,
      found: true,
      lessonId,
      syncCode,
      model: primary!.model,
      totalExercises: primary!.totalExercises,
      exercises: primary!.exercises,
      source: customDetail ? 'custom' : 'global',
      global: globalDetail,
      custom: customDetail,
      updatedAt: primary!.updatedAt,
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
