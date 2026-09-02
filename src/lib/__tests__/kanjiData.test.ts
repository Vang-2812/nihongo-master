import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getKanjiByLevel,
  getAllKanji,
  getAllKanjiCharacters,
  getKanjiByCharacter,
  getRadicalDetail,
  getCompoundsForKanji,
  parseKanjiMeaning,
  getAdjacentKanji,
} from '../kanjiData';

describe('Kanji Data Helper & Indexer', () => {
  it('should load kanji by level accurately', () => {
    const n5 = getKanjiByLevel('N5');
    const n4 = getKanjiByLevel('N4');
    const n3 = getKanjiByLevel('N3');
    const n2 = getKanjiByLevel('N2');
    const n1 = getKanjiByLevel('N1');

    assert.ok(n5.length > 100, `N5 count ${n5.length} should be > 100`);
    assert.ok(n4.length > 150, `N4 count ${n4.length} should be > 150`);
    assert.ok(n3.length > 400, `N3 count ${n3.length} should be > 400`);
    assert.ok(n2.length > 300, `N2 count ${n2.length} should be > 300`);
    assert.ok(n1.length > 1000, `N1 count ${n1.length} should be > 1000`);

    assert.equal(n5[0].level, 'N5');
    assert.equal(n1[0].level, 'N1');
  });

  it('should return all kanji and all characters list', () => {
    const all = getAllKanji();
    const chars = getAllKanjiCharacters();

    assert.ok(all.length >= 2000, 'Total kanji should be >= 2000');
    assert.ok(chars.length >= 2000, 'Total characters should be >= 2000');
  });

  it('should look up kanji by character (including URI-encoded)', () => {
    const kanji1 = getKanjiByCharacter('一');
    assert.ok(kanji1);
    assert.equal(kanji1.character, '一');
    assert.equal(kanji1.stroke_count, 1);

    const encoded = encodeURIComponent('日');
    const kanjiSun = getKanjiByCharacter(encoded);
    assert.ok(kanjiSun);
    assert.equal(kanjiSun.character, '日');
  });

  it('should parse Sino-Vietnamese and meaning accurately', () => {
    const parsed1 = parseKanjiMeaning('nhất (một)', '一');
    assert.equal(parsed1.sinoVietnamese, 'NHẤT');

    const parsed2 = parseKanjiMeaning('HOÀN (một khối; toàn bộ; nguyên vẹn)');
    assert.equal(parsed2.sinoVietnamese, 'HOÀN');
    assert.equal(parsed2.meaning, 'Một khối; toàn bộ; nguyên vẹn');

    const parsed3 = parseKanjiMeaning('Hiểu biết, Xong');
    assert.equal(parsed3.sinoVietnamese, 'HIỂU BIẾT');
    assert.equal(parsed3.meaning, 'Hiểu biết, Xong');
  });

  it('should look up radical details', () => {
    const radical1 = getRadicalDetail('一');
    assert.ok(radical1);
    assert.equal(radical1.radical, '一');
    assert.equal(radical1.stroke_count, 1);
    assert.equal(radical1.reading_ja, 'いち');
  });

  it('should retrieve compounds for kanji from vocab database', () => {
    const compounds = getCompoundsForKanji('一', 5);
    assert.ok(compounds.length > 0);
    assert.ok(compounds.some((c) => c.word.includes('一')));
  });

  it('should get adjacent kanji correctly', () => {
    const n5 = getKanjiByLevel('N5');
    if (n5.length >= 2) {
      const first = n5[0].character;
      const second = n5[1].character;

      const adjFirst = getAdjacentKanji(first, 'N5');
      assert.equal(adjFirst.prev, null);
      assert.equal(adjFirst.next?.character, second);

      const adjSecond = getAdjacentKanji(second, 'N5');
      assert.equal(adjSecond.prev?.character, first);
    }
  });
});
