import * as fs from 'fs';
import * as path from 'path';
import { db, ensureDbInitialized } from '../src/db';
import { aiLessonExercises } from '../src/db/schema';

export async function generateSqlAndSeed() {
  const dir = path.join(__dirname, 'data', 'minna_exercises');
  if (!fs.existsSync(dir)) {
    console.error('Directory scripts/data/minna_exercises does not exist.');
    return;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('minna_') && f.endsWith('.json'))
    .sort((a, b) => {
      const na = parseInt(a.replace('minna_', '').replace('.json', ''), 10);
      const nb = parseInt(b.replace('minna_', '').replace('.json', ''), 10);
      return na - nb;
    });

  const sqlStatements: string[] = [
    '-- Auto-generated Seed SQL for ai_lesson_exercises (Minna no Nihongo I)',
    '-- Run in Turso: turso db shell <db-name> < scripts/seed_ai_exercises_minna.sql\n',
  ];

  let totalLessons = 0;
  let totalExercises = 0;
  const now = Date.now();

  for (const f of files) {
    const lessonKey = f.replace('.json', '');
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const exercises = JSON.parse(raw);
    const count = exercises.length;
    totalLessons++;
    totalExercises += count;

    const id = `${lessonKey}_global`;
    const jsonStr = JSON.stringify(exercises);
    const escapedJson = jsonStr.replace(/'/g, "''");

    sqlStatements.push(
      `INSERT OR REPLACE INTO ai_lesson_exercises (id, lesson_id, sync_code, model, total_exercises, exercises_data, created_at, updated_at) VALUES ('${id}', '${lessonKey}', 'global', 'curated-minna-i', ${count}, '${escapedJson}', ${now}, ${now});`
    );
  }

  const sqlFilePath = path.join(__dirname, 'seed_ai_exercises_minna.sql');
  fs.writeFileSync(sqlFilePath, sqlStatements.join('\n\n'), 'utf8');
  console.log(`✅ Exported SQL seed file: ${sqlFilePath}`);
  console.log(`📊 Lessons: ${totalLessons}, Total Cloze Exercises: ${totalExercises}`);

  try {
    await ensureDbInitialized();
    console.log('🚀 Seeding exercises into database table ai_lesson_exercises...');
    for (const f of files) {
      const lessonKey = f.replace('.json', '');
      const exercises = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      const id = `${lessonKey}_global`;
      const exercisesData = JSON.stringify(exercises);

      await db
        .insert(aiLessonExercises)
        .values({
          id,
          lessonId: lessonKey,
          syncCode: 'global',
          model: 'curated-minna-i',
          totalExercises: exercises.length,
          exercisesData,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: aiLessonExercises.id,
          set: {
            model: 'curated-minna-i',
            totalExercises: exercises.length,
            exercisesData,
            updatedAt: now,
          },
        });
    }
    console.log('🎉 Database seeding complete!');
  } catch (err: any) {
    console.log('ℹ️ Local/Turso DB skipped or error:', err.message);
  }
}

generateSqlAndSeed();
