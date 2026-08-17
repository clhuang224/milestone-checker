import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '../../../core/storage/storage';
import { ArticulationTable } from './articulation-table';

function setup() {
  const fixture = TestBed.createComponent(ArticulationTable);
  fixture.componentRef.setInput('id', 'case-1');
  return fixture;
}

function textOf(fixture: { nativeElement: unknown }): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('ArticulationTable', () => {
  let storage: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [ArticulationTable],
      providers: [provideRouter([])],
    });
    storage = TestBed.inject(Storage);
    storage.upsertCase({ id: 'case-1', label: '個案 A', createdOnISODate: '2026-01-01' });
  });

  it('lists every zhuyin row grouped by category', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const text = textOf(fixture);

    expect(text).toContain('聲母');
    expect(text).toContain('聲調');
    expect(text).toContain('ㄅ');
    expect(text).toContain('ㄙ');
    expect(text).toContain('ㄦ');
    expect(text).toContain('輕聲');
  });

  it('shows the reference articulation features on initials', async () => {
    const fixture = setup();
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('雙唇/塞音/送氣');
  });

  it('renders a recorded pair, its process tags and its example words', async () => {
    storage.upsertArticulationProcess({ id: 'deaspiration', name: '不送氣化', builtin: true });
    storage.upsertSubstitution({
      id: 'sub-1',
      caseId: 'case-1',
      targetPhonemeId: 'p',
      errorPhonemeId: 'b',
      processIds: ['deaspiration'],
      examples: [{ word: '拼', note: 'ㄅㄧㄣ' }],
      updatedOnISODate: '2026-01-02',
    });

    const fixture = setup();
    await fixture.whenStable();
    const text = textOf(fixture);

    expect(text).toContain('ㄆ→ㄅ');
    expect(text).toContain('不送氣化');
    expect(text).toContain('拼');
    expect(text).toContain('ㄅㄧㄣ');
  });

  it('renders a pair with no error sound as correct', async () => {
    storage.upsertSubstitution({
      id: 'sub-1',
      caseId: 'case-1',
      targetPhonemeId: 'p',
      processIds: [],
      examples: [],
      updatedOnISODate: '2026-01-02',
    });

    const fixture = setup();
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('ㄆ ✓');
  });

  it('only shows substitutions belonging to this case', async () => {
    storage.upsertSubstitution({
      id: 'sub-other',
      caseId: 'case-2',
      targetPhonemeId: 'p',
      errorPhonemeId: 'b',
      processIds: [],
      examples: [],
      updatedOnISODate: '2026-01-02',
    });

    const fixture = setup();
    await fixture.whenStable();

    expect(textOf(fixture)).not.toContain('ㄆ→ㄅ');
  });

  it('saves a new pair through the inline editor', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startAdd({ id: 'p', symbol: 'ㄆ', category: 'initial', order: 2 });
    fixture.componentInstance.setErrorPhoneme('b');
    fixture.componentInstance.save();
    await fixture.whenStable();

    const saved = storage.substitutionsFor('case-1');
    expect(saved).toHaveLength(1);
    expect(saved[0].targetPhonemeId).toBe('p');
    expect(saved[0].errorPhonemeId).toBe('b');
    expect(textOf(fixture)).toContain('ㄆ→ㄅ');
  });

  it('preselects the recorded error sound when editing an existing pair', async () => {
    storage.upsertSubstitution({
      id: 'sub-1',
      caseId: 'case-1',
      targetPhonemeId: 'p',
      errorPhonemeId: 'b',
      processIds: [],
      examples: [],
      updatedOnISODate: '2026-01-02',
    });

    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startEdit(storage.substitutionsFor('case-1')[0]);
    await fixture.whenStable();

    const select = (fixture.nativeElement as HTMLElement).querySelector(
      'select',
    ) as HTMLSelectElement;
    expect(select.value).toBe('b');
  });

  it('records a diacritic with no substituted sound as an error, not a correct sound', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startAdd({ id: 'i', symbol: 'ㄧ', category: 'medial', order: 22 });
    fixture.componentInstance.setNasalized(true);
    fixture.componentInstance.save();
    await fixture.whenStable();

    const saved = storage.substitutionsFor('case-1');
    expect(saved[0].errorPhonemeId).toBeUndefined();
    expect(saved[0].errorDiacritic).toBe('nasalized');

    const text = textOf(fixture);
    expect(text).toContain('ㄧ→ㄧⁿ');
    expect(text).not.toContain('ㄧ ✓');
  });

  it('previews the pair being drafted, so a diacritic-only entry is not read as a ✓', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startAdd({ id: 'i', symbol: 'ㄧ', category: 'medial', order: 22 });
    expect(fixture.componentInstance.draftLabel()).toBe('ㄧ ✓');

    fixture.componentInstance.setNasalized(true);
    expect(fixture.componentInstance.draftLabel()).toBe('ㄧ→ㄧⁿ');
  });

  it('clears the diacritic when it is unticked', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startAdd({ id: 'i', symbol: 'ㄧ', category: 'medial', order: 22 });
    fixture.componentInstance.setNasalized(true);
    fixture.componentInstance.setNasalized(false);
    fixture.componentInstance.save();
    await fixture.whenStable();

    expect(storage.substitutionsFor('case-1')[0].errorDiacritic).toBeUndefined();
  });

  it('keeps an empty error sound as a correct-sound record rather than an empty string', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startAdd({ id: 'p', symbol: 'ㄆ', category: 'initial', order: 2 });
    fixture.componentInstance.save();
    await fixture.whenStable();

    expect(storage.substitutionsFor('case-1')[0].errorPhonemeId).toBeUndefined();
  });

  it('ignores an example with a blank word', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.startAdd({ id: 'p', symbol: 'ㄆ', category: 'initial', order: 2 });
    fixture.componentInstance.draftWord.set('   ');
    fixture.componentInstance.addExample();

    expect(fixture.componentInstance.draft()?.examples).toEqual([]);
  });

  it('shows a message when the case does not exist', async () => {
    const fixture = TestBed.createComponent(ArticulationTable);
    fixture.componentRef.setInput('id', 'missing');
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('找不到這個個案');
  });
});
