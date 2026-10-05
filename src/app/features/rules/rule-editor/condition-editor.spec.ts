import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  ConditionNode,
  ConditionSetRow,
  toJsonLogic,
} from '../../../core/rule-engine/condition-mapper';
import { RuleField } from '../../../core/rule-engine/facts';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';
import { ConditionEditor } from './condition-editor';

const FIELDS: RuleField[] = [
  { id: 'case.ageInMonths', label: '月齡', kind: 'number' },
  { id: 'drooling', label: '流口水', kind: 'boolean' },
];

const PROCESSES: PhonologicalProcessDefinition[] = [
  { id: 'vowelNasalization', name: '母音鼻音化', builtin: true },
  { id: 'stopping', name: '塞音化', builtin: true },
];

function setup(node: ConditionNode) {
  const fixture = TestBed.createComponent(ConditionEditor);
  fixture.componentRef.setInput('node', node);
  fixture.componentRef.setInput('fields', FIELDS);
  fixture.componentRef.setInput('processes', PROCESSES);
  return fixture;
}

const excludeRow: ConditionSetRow = {
  type: 'set',
  subject: 'articulationTarget',
  mode: 'excludes',
  values: ['zh'],
};

describe('ConditionEditor applicability rows', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConditionEditor] });
  });

  it('spells out that 排除 means something is left over, not that it is absent', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('扣掉勾選的項目後');
    expect(text).toContain('仍然有其他構音錯誤');
  });

  it('offers zhuyin symbols for the target subject', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    const labels = fixture.componentInstance
      .setOptions()
      .flatMap((g) => g.options.map((o) => o.id));
    expect(labels).toContain('zh');
    expect(labels).toContain('ihFront');
  });

  it('offers the process catalogue for the process subject', async () => {
    const fixture = setup({ ...excludeRow, subject: 'articulationProcess', values: [] });
    await fixture.whenStable();

    expect(fixture.componentInstance.setOptions()).toEqual([
      {
        label: '音韻歷程',
        options: [
          { id: 'vowelNasalization', label: '母音鼻音化' },
          { id: 'stopping', label: '塞音化' },
        ],
      },
    ]);
  });

  it('toggles a value on and off', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    const emitted: ConditionNode[] = [];
    fixture.componentInstance.nodeChange.subscribe((node) => emitted.push(node));

    fixture.componentInstance.toggleSetValue('ch');
    fixture.componentInstance.toggleSetValue('zh');

    expect((emitted[0] as ConditionSetRow).values).toEqual(['zh', 'ch']);
    expect((emitted[1] as ConditionSetRow).values).toEqual([]);
  });

  it('clears the selection when the subject changes, since ids are not interchangeable', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    const emitted: ConditionNode[] = [];
    fixture.componentInstance.nodeChange.subscribe((node) => emitted.push(node));

    fixture.componentInstance.setSubject('articulationProcess');

    expect(emitted[0]).toEqual({
      type: 'set',
      subject: 'articulationProcess',
      mode: 'excludes',
      values: [],
    });
  });

  it('warns that an empty 包含 selection matches nothing', async () => {
    const fixture = setup({ ...excludeRow, mode: 'includes', values: [] });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('這個條件不會成立');
  });

  it('warns harder for an empty 排除, because that one matches almost everyone', async () => {
    // The two modes behave oppositely when empty. Saying 「不會成立」 for 排除 was untrue.
    const fixture = setup({ ...excludeRow, values: [] });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('只要有任何構音錯誤就成立');
    expect(text).not.toContain('這個條件不會成立');
  });

  it('builds a condition the rule engine can evaluate', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    expect(toJsonLogic(fixture.componentInstance.node())).toEqual({
      some: [{ var: 'articulation.errors' }, { '!': { in: [{ var: 'targetPhonemeId' }, ['zh']] } }],
    });
  });

  it('offers the four categories, by their labels, for the category subject', async () => {
    const fixture = setup({ ...excludeRow, subject: 'articulationCategory', values: [] });
    await fixture.whenStable();

    const options = fixture.componentInstance.setOptions().flatMap((g) => g.options);
    expect(options.map((o) => o.id)).toEqual(['initial', 'medial', 'final', 'tone']);
    expect(options.map((o) => o.label)).toEqual(['聲母', '介音', '韻母', '聲調']);
  });

  it('offers every native language for the native-language subject', async () => {
    const fixture = setup({
      ...excludeRow,
      subject: 'nativeLanguage',
      mode: 'includes',
      values: [],
    });
    await fixture.whenStable();

    const options = fixture.componentInstance.setOptions().flatMap((g) => g.options);
    expect(options).toHaveLength(16);
    expect(options[0]).toEqual({ id: 'mandarin', label: '華語' });
  });

  it('names tones in the target grid instead of showing bare tone marks', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    const tones = fixture.componentInstance.setOptions().find((g) => g.label === '聲調');
    expect(tones?.options.map((o) => o.label)).toContain('二聲');
    expect(tones?.options.map((o) => o.label)).not.toContain('ˊ');
    // Other categories keep their symbols.
    const initials = fixture.componentInstance.setOptions().find((g) => g.label === '聲母');
    expect(initials?.options.map((o) => o.label)).toContain('ㄓ');
  });

  it('switching to 母語 from 排除 resets to 包含, since 母語 offers only 包含', async () => {
    const fixture = setup(excludeRow);
    await fixture.whenStable();

    const emitted: ConditionNode[] = [];
    fixture.componentInstance.nodeChange.subscribe((node) => emitted.push(node));
    fixture.componentInstance.setSubject('nativeLanguage');

    expect(emitted).toEqual([
      { type: 'set', subject: 'nativeLanguage', mode: 'includes', values: [] },
    ]);
  });

  it('offers only 包含 on a native-language row', async () => {
    const fixture = setup({
      ...excludeRow,
      subject: 'nativeLanguage',
      mode: 'includes',
      values: [],
    });
    await fixture.whenStable();

    const values = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('select')[1].options,
    ].map((o) => o.value);
    expect(values).toEqual(['includes']);
  });

  it('shows an imported native-language 排除 row truthfully, without rewriting it', async () => {
    const row: ConditionSetRow = {
      type: 'set',
      subject: 'nativeLanguage',
      mode: 'excludes',
      values: ['mandarin'],
    };
    const fixture = setup(row);
    const emitted: ConditionNode[] = [];
    fixture.componentInstance.nodeChange.subscribe((node) => emitted.push(node));
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const modeSelect = element.querySelectorAll('select')[1];
    expect(modeSelect.value).toBe('excludes');
    expect(element.textContent).toContain('仍然有其他母語時成立');
    expect(element.querySelector('p.meta')?.textContent).not.toContain('構音錯誤');
    expect(emitted).toEqual([]);
  });
});
