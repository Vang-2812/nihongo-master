import { client, db, ensureDbInitialized } from '../src/db';
import { textbooks, lessons, vocabItems } from '../src/db/schema';
import { getAllTextbooks, getAllLessons } from '../src/lib/vocabData';

async function seed() {
  console.log('🚀 Initializing SQLite database schema...');
  await ensureDbInitialized();

  console.log('📚 Seeding Textbooks...');
  const allTextbooks = getAllTextbooks();
  for (const tb of allTextbooks) {
    await db
      .insert(textbooks)
      .values({
        id: tb.id,
        title: tb.title,
        level: tb.level,
        description: tb.description,
        totalLessons: tb.lessonCount,
      })
      .onConflictDoNothing();
  }

  console.log('📖 Seeding Lessons and Vocabulary...');
  const allLessons = getAllLessons();
  let totalVocabCount = 0;

  for (const les of allLessons) {
    await db
      .insert(lessons)
      .values({
        id: les.id,
        textbookId: les.bookId,
        lessonNumber: les.lessonNumber,
        title: les.title,
      })
      .onConflictDoNothing();

    if (les.items && les.items.length > 0) {
      for (const item of les.items) {
        await db
          .insert(vocabItems)
          .values({
            id: item.id,
            lessonId: item.lessonId,
            word: item.word,
            reading: item.reading,
            meaning: item.meaning,
            sinoVietnamese: item.sinoVietnamese || null,
            romaji: item.romaji || null,
            level: item.level,
          })
          .onConflictDoNothing();
        totalVocabCount++;
      }
    }
  }

  console.log(`✅ Seeding complete!`);
  console.log(`- Textbooks: ${allTextbooks.length}`);
  console.log(`- Lessons: ${allLessons.length}`);
  console.log(`- Vocabulary Items: ${totalVocabCount}`);
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
