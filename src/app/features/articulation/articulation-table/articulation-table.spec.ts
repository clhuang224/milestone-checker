import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from '../../../core/storage/storage';
import { ArticulationTable } from './articulation-table';

function setup() {
  const fixture = TestBed.createComponent(ArticulationTable);
  fixture.componentRef.setInput('caseId', 'case-1');
  fixture.componentRef.setInput('recordId', 'assessment-1');
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
    storage.upsertSessionRecord({
      id: 'assessment-1',
      caseId: 'case-1',
      onISODate: '2026-01-02',
      formIds: ['articulation'],
    });
  });

  it('lays the initials out as the standard chart, with the vowels and tones after', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const text = textOf(fixture);

    expect(text).toContain('聲母');
    expect(text).toContain('聲調');
    expect(text).toContain('ㄅ');
    expect(text).toContain('ㄙ');
  });

  it('keeps the tone names reachable, in the tooltip rather than the cell', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const titles = [...(fixture.nativeElement as HTMLElement).querySelectorAll('span[title]')].map(
      (span) => span.getAttribute('title'),
    );

    expect(titles).toContain('輕聲');
  });

  it('orders the initials columns by place, front of the mouth to back', async () => {
    // Not the bopomofo recitation order, which puts 舌根 third and then runs forward again.
    // See references/taiwan-mandarin-consonants.md for the ordering the therapist gave.
    const fixture = setup();
    await fixture.whenStable();

    const firstOfEachColumn = fixture.componentInstance
      .sections()[0]
      .columns.map((column) => column[0].symbol.symbol);

    expect(firstOfEachColumn).toEqual(['ㄅ', 'ㄗ', 'ㄉ', 'ㄓ', 'ㄐ', 'ㄍ']);
  });

  it('puts the distinctive features in the tooltip, to keep the cells narrow', async () => {
    const fixture = setup();
    await fixture.whenStable();

    const titles = [...(fixture.nativeElement as HTMLElement).querySelectorAll('span[title]')].map(
      (span) => span.getAttribute('title'),
    );

    expect(titles).toContain('雙唇/塞音/送氣/清音');
  });

  it('stores what is typed into a slot', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.setWord('p', 0, '拋');
    fixture.componentInstance.setHeard('p', 0, 'ㄅㄠ');

    const [probe] = storage.probesForSessionRecord('assessment-1');
    expect(probe.targetPhonemeId).toBe('p');
    expect(probe.items[0]).toEqual({ word: '拋', heard: 'ㄅㄠ' });
  });

  it('keeps the other slots blank rather than collapsing them', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.setHeard('p', 2, 'ㄅ');

    const [probe] = storage.probesForSessionRecord('assessment-1');
    expect(probe.items).toHaveLength(3);
    expect(probe.items[0]).toEqual({ word: '', heard: '' });
    expect(probe.items[2].heard).toBe('ㄅ');
  });

  it('deletes a row that gets emptied back out', async () => {
    const fixture = setup();
    await fixture.whenStable();

    fixture.componentInstance.setHeard('p', 0, 'ㄅ');
    expect(storage.probesForSessionRecord('assessment-1')).toHaveLength(1);

    fixture.componentInstance.setHeard('p', 0, '');
    expect(storage.probesForSessionRecord('assessment-1')).toEqual([]);
  });

  it('only shows probes belonging to this assessment', async () => {
    storage.upsertSessionRecord({
      id: 'assessment-other',
      caseId: 'case-1',
      onISODate: '2025-01-02',
      formIds: ['articulation'],
    });
    storage.upsertProbe({
      id: 'other',
      caseId: 'case-1',
      recordId: 'assessment-other',
      targetPhonemeId: 'p',
      items: [{ word: '拋', heard: 'ㄅㄠ' }],
      updatedOnISODate: '2025-01-02',
    });

    const fixture = setup();
    await fixture.whenStable();

    expect(fixture.componentInstance.probes()).toEqual([]);
  });

  it('does not repeat the header the record page already shows', async () => {
    const fixture = setup();
    await fixture.whenStable();

    // The case name, date and back link belong to the record page around this form.
    expect(textOf(fixture)).not.toContain('回個案');
  });

  it('shows a message when the case does not exist', async () => {
    const fixture = TestBed.createComponent(ArticulationTable);
    fixture.componentRef.setInput('caseId', 'missing');
    fixture.componentRef.setInput('recordId', 'assessment-1');
    await fixture.whenStable();

    expect(textOf(fixture)).toContain('找不到這個個案');
  });
});
