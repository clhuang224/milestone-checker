import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildFacts } from '../../../core/rule-engine/facts';
import { evaluateCondition } from '../../../core/rule-engine/json-logic';
import { Storage } from '../../../core/storage/storage';
import { ArticulationProbe } from '../../../models/articulation-record.model';
import { Case, NativeLanguageId, RecordProfile } from '../../../models/case.model';
import { SessionRecord } from '../../../models/session-record.model';
import { RuleList } from '../rule-list/rule-list';
import { RuleEditor } from './rule-editor';

/**
 * The whole path a therapist takes with an applicability rule: build it by clicking through the
 * editor, save it, come back later and open it again. Each piece (toJsonLogic, fromJsonLogic,
 * the condition editor's options) has its own unit tests; this one exists because a saved
 * condition that does not read back fails silently — the reopened editor cannot show it, and
 * evaluateCondition() swallows the parse error and returns false, so the rule never fires.
 *
 * Driven through RuleList with the real Storage, and the reopen happens in a fresh TestBed so a
 * new Storage has to load the rule back out of localStorage.
 */

const RULE_NAME = '母語台語且捲舌音有錯';

async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  fixture.detectChanges();
  await fixture.whenStable();
}

function buttonByText(root: ParentNode, text: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
    (b) => b.textContent?.trim() === text,
  );
  if (!button) {
    throw new Error(`No button labelled 「${text}」`);
  }
  return button;
}

function choose(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event('change'));
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

/** The condition editors directly under the top-level group, i.e. its rows. */
function childEditors(root: HTMLElement): HTMLElement[] {
  const top = root.querySelector('app-rule-editor app-condition-editor');
  if (!top) {
    throw new Error('No condition editor rendered');
  }
  return Array.from(top.querySelectorAll<HTMLElement>('app-condition-editor')).filter(
    (el) => el.parentElement?.closest('app-condition-editor') === top,
  );
}

function subjectAndMode(row: HTMLElement): [string, string] {
  const [subject, mode] = Array.from(row.querySelectorAll<HTMLSelectElement>('select'));
  return [subject.value, mode.value];
}

function pressedChips(row: HTMLElement): string[] {
  return Array.from(row.querySelectorAll<HTMLButtonElement>('button.chip'))
    .filter((chip) => chip.getAttribute('aria-pressed') === 'true')
    .map((chip) => chip.textContent?.trim() ?? '');
}

const ON_DATE = '2026-08-20';
const record: SessionRecord = {
  id: 'record-1',
  caseId: 'case-1',
  onISODate: ON_DATE,
  formIds: ['articulation'],
};
const profile: RecordProfile = { recordId: 'record-1', values: {}, updatedOnISODate: ON_DATE };

/** ㄕ produced as ㄙ — the 石頭 → 俗頭 substitution named in this change's tasks. */
const shError: ArticulationProbe = {
  id: 'probe-sh',
  caseId: 'case-1',
  recordId: 'record-1',
  targetPhonemeId: 'sh',
  items: [{ word: '石', heard: 'ㄙ' }],
  updatedOnISODate: ON_DATE,
};

function factsFor(nativeLanguages: NativeLanguageId[]) {
  const caseRecord: Case = {
    id: 'case-1',
    label: '個案 A',
    sex: 'female',
    createdOnISODate: '2026-08-01',
    nativeLanguages,
  };
  return buildFacts(caseRecord, record, profile, [shError], [], []);
}

describe('RuleEditor: an applicability rule survives save and reopen', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [RuleList] });
  });

  it('reopens 母語 包含 台灣台語 AND 目標音 包含 ㄓㄔㄕㄖ as two rows, and the rule fires', async () => {
    // --- Build it in the editor ---
    const fixture = TestBed.createComponent(RuleList);
    await settle(fixture);
    const root = fixture.nativeElement as HTMLElement;

    buttonByText(root, '新增規則').click();
    await settle(fixture);

    type(root.querySelector<HTMLInputElement>('#rule-name')!, RULE_NAME);
    type(root.querySelector<HTMLInputElement>('#rule-message')!, '測試訊息');
    await settle(fixture);

    // A new rule starts with one comparison row; clear it so the group holds only our two rows.
    for (const remove of Array.from(root.querySelectorAll<HTMLButtonElement>('button'))) {
      if (remove.textContent?.trim() === '移除') {
        remove.click();
      }
    }
    await settle(fixture);
    expect(childEditors(root)).toHaveLength(0);

    const editor = root.querySelector('app-rule-editor')!;
    buttonByText(editor, '＋ 適用條件').click();
    await settle(fixture);
    buttonByText(editor, '＋ 適用條件').click();
    await settle(fixture);

    // Rows are looked up afresh after every change: each emit replaces the node they render.
    choose(childEditors(root)[0].querySelector('select')!, 'nativeLanguage');
    await settle(fixture);
    buttonByText(childEditors(root)[0], '台灣台語').click();
    await settle(fixture);

    for (const symbol of ['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ']) {
      buttonByText(childEditors(root)[1], symbol).click();
      await settle(fixture);
    }

    // Sanity check on the build itself, so a failure below is about the reopen, not the build.
    const [languageRow, targetRow] = childEditors(root);
    expect(subjectAndMode(languageRow)).toEqual(['nativeLanguage', 'includes']);
    expect(pressedChips(languageRow)).toEqual(['台灣台語']);
    expect(subjectAndMode(targetRow)).toEqual(['articulationTarget', 'includes']);
    expect(pressedChips(targetRow)).toEqual(['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ']);

    // --- Save ---
    buttonByText(root, '儲存').click();
    await settle(fixture);
    expect(root.querySelector('app-rule-editor')).toBeNull();
    fixture.destroy();

    // --- Come back later: a fresh app, a fresh Storage reading localStorage ---
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [RuleList] });
    const reopened = TestBed.createComponent(RuleList);
    await settle(reopened);
    const reopenedRoot = reopened.nativeElement as HTMLElement;

    const saved = TestBed.inject(Storage)
      .rules()
      .find((rule) => rule.name === RULE_NAME);
    expect(saved).toBeDefined();

    buttonByText(reopenedRoot, '編輯').click();
    await settle(reopened);

    // Not the fallback: the editor parsed the stored JSON back into the rows it was built from.
    const reopenedEditor = reopened.debugElement.query(
      (el) => el.componentInstance instanceof RuleEditor,
    ).componentInstance as RuleEditor;
    expect(reopenedEditor.conditionNode()).toEqual({
      type: 'group',
      combinator: 'and',
      children: [
        { type: 'set', subject: 'nativeLanguage', mode: 'includes', values: ['taiwanese'] },
        {
          type: 'set',
          subject: 'articulationTarget',
          mode: 'includes',
          values: ['zh', 'ch', 'sh', 'r'],
        },
      ],
    });

    const rows = childEditors(reopenedRoot);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.querySelector('.panel') !== null)).toBe(true);
    expect(subjectAndMode(rows[0])).toEqual(['nativeLanguage', 'includes']);
    expect(pressedChips(rows[0])).toEqual(['台灣台語']);
    expect(subjectAndMode(rows[1])).toEqual(['articulationTarget', 'includes']);
    expect(pressedChips(rows[1])).toEqual(['ㄓ', 'ㄔ', 'ㄕ', 'ㄖ']);

    // --- And the stored condition actually fires on a real case ---
    expect(evaluateCondition(saved!.condition, factsFor(['taiwanese']))).toBe(true);
    expect(evaluateCondition(saved!.condition, factsFor(['mandarin']))).toBe(false);
  });
});
