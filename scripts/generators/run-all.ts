import * as fs from 'fs';
import * as path from 'path';
import { validateExercises } from './validate';
import { minna8Exercises } from './minna_8';
import { minna9Exercises } from './minna_9';
import { minna10Exercises } from './minna_10';
import { minna11Exercises } from './minna_11';
import { minna12Exercises } from './minna_12';
import { minna13Exercises } from './minna_13';
import { minna14Exercises } from './minna_14';
import { minna15Exercises } from './minna_15';
import { generateSqlAndSeed } from '../seed-ai-exercises';

const lessons = [
  { id: 'minna_8', data: minna8Exercises },
  { id: 'minna_9', data: minna9Exercises },
  { id: 'minna_10', data: minna10Exercises },
  { id: 'minna_11', data: minna11Exercises },
  { id: 'minna_12', data: minna12Exercises },
  { id: 'minna_13', data: minna13Exercises },
  { id: 'minna_14', data: minna14Exercises },
  { id: 'minna_15', data: minna15Exercises },
];

const targetDir = path.join(__dirname, '..', 'data', 'minna_exercises');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('🚀 Validating and saving exercises for minna_8 through minna_15...');

for (const { id, data } of lessons) {
  validateExercises(id, data);
  const filePath = path.join(targetDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`💾 Saved ${data.length} exercises to ${filePath}`);
}

console.log('\n🔄 Generating SQL seed file for cloud database and seeding local/Turso DB...');
generateSqlAndSeed().then(() => {
  console.log('\n🎉 Finished generating all exercises for Lessons 8 through 15!');
});
