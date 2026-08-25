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
});
