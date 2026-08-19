import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ArticulationSubstitution } from '../../../models/articulation-record.model';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';
import { ProcessOverview } from './process-overview';

const processes: PhonologicalProcessDefinition[] = [
  { id: 'deaspiration', name: '不送氣化', builtin: true },
  { id: 'backing', name: '後置化', builtin: true },
];

function substitution(
  overrides: Partial<ArticulationSubstitution> & Pick<ArticulationSubstitution, 'id'>,
): ArticulationSubstitution {
  return {
    caseId: 'case-1',
    assessmentId: 'assessment-1',
    targetPhonemeId: 'p',
    errorPhonemeId: 'b',
    processIds: [],
    examples: [],
    updatedOnISODate: '2026-01-02',
    ...overrides,
  };
}

function render(substitutions: ArticulationSubstitution[]): ComponentFixture<ProcessOverview> {
  const fixture = TestBed.createComponent(ProcessOverview);
  fixture.componentRef.setInput('substitutions', substitutions);
  fixture.componentRef.setInput('processes', processes);
  return fixture;
}

describe('ProcessOverview', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProcessOverview] });
  });

  it('renders the empty state when nothing is recorded', async () => {
    const fixture = render([]);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('還沒有記錄到錯誤音對');
  });

  it('groups pairs under the process they are tagged with', async () => {
    const fixture = render([
      substitution({ id: 'sub-1', targetPhonemeId: 'p', processIds: ['deaspiration'] }),
      substitution({
        id: 'sub-2',
        targetPhonemeId: 't',
        errorPhonemeId: 'd',
        processIds: ['deaspiration'],
      }),
      substitution({
        id: 'sub-3',
        targetPhonemeId: 'd',
        errorPhonemeId: 'g',
        processIds: ['backing'],
      }),
    ]);
    await fixture.whenStable();

    const groups = fixture.componentInstance.groups();
    expect(groups.map((g) => g.name)).toEqual(['不送氣化', '後置化']);
    expect(groups[0].pairs).toEqual(['ㄆ→ㄅ', 'ㄊ→ㄉ']);
    expect(groups[1].pairs).toEqual(['ㄉ→ㄍ']);
  });

  it('lists a pair under every process it carries', async () => {
    const fixture = render([
      substitution({ id: 'sub-1', processIds: ['deaspiration', 'backing'] }),
    ]);
    await fixture.whenStable();

    expect(fixture.componentInstance.groups().map((g) => g.pairs)).toEqual([['ㄆ→ㄅ'], ['ㄆ→ㄅ']]);
  });

  it('collects untagged error pairs into their own group', async () => {
    const fixture = render([substitution({ id: 'sub-1', processIds: [] })]);
    await fixture.whenStable();

    const groups = fixture.componentInstance.groups();
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('尚未歸類');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('尚未歸類');
  });

  it('leaves correct sounds out of the summary entirely', async () => {
    const fixture = render([
      substitution({ id: 'sub-1', errorPhonemeId: undefined, processIds: ['deaspiration'] }),
    ]);
    await fixture.whenStable();

    expect(fixture.componentInstance.groups()).toEqual([]);
  });

  it('drops processes that nothing is tagged with', async () => {
    const fixture = render([substitution({ id: 'sub-1', processIds: ['backing'] })]);
    await fixture.whenStable();

    expect(fixture.componentInstance.groups().map((g) => g.name)).toEqual(['後置化']);
  });
});
