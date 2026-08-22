import { describe, expect, it } from 'vitest';

import { ArticulationProbe, PhonologicalSummary } from '../../models/articulation-record.model';
import { probeErrors, errorLabel } from './probe-errors';
import { derivedProcessGroups, effectiveProcessGroups, processIdsForTarget } from './summary';

function probe(targetPhonemeId: string, ...heard: string[]): ArticulationProbe {
  return {
    id: `probe-${targetPhonemeId}`,
    caseId: 'case-1',
    recordId: 'assessment-1',
    targetPhonemeId,
    items: heard.map((h) => ({ word: '詞', heard: h })),
    updatedOnISODate: '2026-08-19',
  };
}

describe('probeErrors', () => {
  it('skips items with a blank 錯音, which mean the sound was correct', () => {
    expect(probeErrors([probe('p', '', '', '')])).toEqual([]);
  });

  it('labels a substitution and a diacritic-only error', () => {
    const [substitution, nasalized] = probeErrors([probe('p', 'ㄅㄠ'), probe('i', 'ㄧⁿ')]);

    expect(errorLabel(substitution)).toBe('ㄆ→ㄅ');
    expect(errorLabel(nasalized)).toBe('ㄧ→ㄧⁿ');
  });

  it('shows unparseable text as written rather than pretending to understand it', () => {
    const [error] = probeErrors([probe('p', '含糊')]);

    expect(errorLabel(error)).toBe('ㄆ→含糊');
    expect(error.processIds).toEqual([]);
  });
});

describe('derivedProcessGroups', () => {
  it('groups the sounds that demonstrated each process', () => {
    const groups = derivedProcessGroups([probe('s', 'ㄉ'), probe('sh', 'ㄉ')]);

    expect(groups).toEqual([{ processId: 'stopping', targetPhonemeIds: ['s', 'sh'] }]);
  });

  it('lists a sound under every process its error demonstrates', () => {
    // ㄑ→ㄅ loses aspiration and becomes a stop.
    const groups = derivedProcessGroups([probe('q', 'ㄅ')]);

    expect(groups.map((g) => g.processId).sort()).toEqual(['deaspiration', 'stopping']);
  });

  it('does not repeat a target that errs the same way twice', () => {
    const groups = derivedProcessGroups([probe('s', 'ㄉ', 'ㄉㄜ')]);

    expect(groups).toEqual([{ processId: 'stopping', targetPhonemeIds: ['s'] }]);
  });
});

describe('effectiveProcessGroups', () => {
  const probes = [probe('s', 'ㄉ')];

  it('derives when there is no stored summary at all', () => {
    expect(effectiveProcessGroups(probes, undefined)).toEqual(derivedProcessGroups(probes));
  });

  it('derives when the summary says to', () => {
    const summary: PhonologicalSummary = {
      recordId: 'assessment-1',
      useDerived: true,
      manual: [{ processId: 'ignored', targetPhonemeIds: ['s'] }],
    };

    expect(effectiveProcessGroups(probes, summary)).toEqual(derivedProcessGroups(probes));
  });

  it('uses the manual grouping when the therapist took over', () => {
    const summary: PhonologicalSummary = {
      recordId: 'assessment-1',
      useDerived: false,
      manual: [{ processId: 'fronting', targetPhonemeIds: ['s'] }],
    };

    expect(effectiveProcessGroups(probes, summary)).toEqual(summary.manual);
  });

  it('respects an empty manual grouping rather than falling back to derived', () => {
    const summary: PhonologicalSummary = {
      recordId: 'assessment-1',
      useDerived: false,
      manual: [],
    };

    expect(effectiveProcessGroups(probes, summary)).toEqual([]);
  });
});

describe('processIdsForTarget', () => {
  it('collects every process attributed to one sound', () => {
    const groups = [
      { processId: 'backing', targetPhonemeIds: ['d', 't'] },
      { processId: 'stopping', targetPhonemeIds: ['s'] },
    ];

    expect(processIdsForTarget(groups, 'd')).toEqual(['backing']);
    expect(processIdsForTarget(groups, 's')).toEqual(['stopping']);
    expect(processIdsForTarget(groups, 'b')).toEqual([]);
  });
});
