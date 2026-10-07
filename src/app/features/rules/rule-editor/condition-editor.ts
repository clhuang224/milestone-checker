import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ConditionGroup,
  ConditionNode,
  ConditionOperator,
  ConditionRow,
  ConditionSetRow,
  ConditionSubject,
  defaultRow,
  defaultSetRow,
} from '../../../core/rule-engine/condition-mapper';
import { BETTER_EAR_NORMAL_FIELD_ID, RuleField } from '../../../core/rule-engine/facts';
import {
  ZHUYIN_CATEGORY_LABELS,
  ZHUYIN_CATEGORY_ORDER,
  ZHUYIN_INVENTORY,
} from '../../../data/zhuyin-inventory';
import { NATIVE_LANGUAGE_LABELS, NATIVE_LANGUAGE_ORDER } from '../../../models/case.model';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';

const NUMBER_OPERATORS: ConditionOperator[] = ['==', '!=', '>', '>=', '<', '<='];
const BOOLEAN_OPERATORS: ConditionOperator[] = ['==', '!='];

interface SetOption {
  id: string;
  label: string;
}

interface SetOptionGroup {
  /** Empty for a single flat list whose subject select already names it. */
  label: string;
  options: SetOption[];
}

/**
 * Spelled out rather than just 「包含／排除」, because 「排除」 is existential: it asks whether
 * anything is *left over* once these are set aside, not whether they are absent.
 */
function modeHint(row: ConditionSetRow): string {
  return row.mode === 'includes'
    ? '個案身上有勾選的其中任一項時成立'
    : `扣掉勾選的項目後，個案身上仍然有其他${remainderNounOf(row.subject)}時成立`;
}

/**
 * Comparison fields whose label cannot carry what the tool does with them. The better ear is the
 * only one: 「（優耳）」 names the basis, but not that aided counts as non-normal or that a
 * missing ear can leave the answer unknown — both silent, since an unjudged rule just doesn't fire.
 */
const FIELD_HINTS: Partial<Record<string, string>> = {
  [BETTER_EAR_NORMAL_FIELD_ID]:
    '任一耳正常就是「是」，兩耳都填了且都非正常才是「否」，其餘不判斷；配戴助聽器／人工電子耳算非正常',
};

/**
 * What an 排除 row looks for once the checked items are set aside. Native languages are their own
 * collection, so 「其他構音錯誤」 would misdescribe a (file-imported) native-language 排除 row.
 */
function remainderNounOf(subject: ConditionSubject): string {
  return subject === 'nativeLanguage' ? '母語' : '構音錯誤';
}

@Component({
  selector: 'app-condition-editor',
  imports: [FormsModule, ConditionEditor],
  templateUrl: './condition-editor.html',
})
export class ConditionEditor {
  readonly node = input.required<ConditionNode>();
  readonly fields = input.required<RuleField[]>();
  readonly processes = input.required<PhonologicalProcessDefinition[]>();
  readonly nodeChange = output<ConditionNode>();

  readonly row = computed(() =>
    this.node().type === 'row' ? (this.node() as ConditionRow) : undefined,
  );
  readonly setRow = computed(() =>
    this.node().type === 'set' ? (this.node() as ConditionSetRow) : undefined,
  );
  readonly group = computed(() =>
    this.node().type === 'group' ? (this.node() as ConditionGroup) : undefined,
  );

  readonly modeHint = computed(() => {
    const row = this.setRow();
    return row ? modeHint(row) : '';
  });

  readonly remainderNoun = computed(() => {
    const row = this.setRow();
    return row ? remainderNounOf(row.subject) : '';
  });

  /**
   * Native language only offers 包含. 排除 stays listed when a row already carries it (a rule
   * imported from a file), so the select shows what the rule actually does instead of a value it
   * does not hold; once switched to 包含 it disappears.
   */
  readonly offersExcludes = computed(() => {
    const row = this.setRow();
    return !!row && (row.subject !== 'nativeLanguage' || row.mode === 'excludes');
  });

  /** Zhuyin is grouped by category; the other subjects are single flat lists. */
  readonly setOptions = computed<SetOptionGroup[]>(() => {
    switch (this.setRow()?.subject) {
      case 'articulationProcess':
        return [
          {
            label: '音韻歷程',
            options: this.processes().map((p) => ({ id: p.id, label: p.name })),
          },
        ];
      case 'articulationCategory':
        return [
          {
            label: '',
            options: ZHUYIN_CATEGORY_ORDER.map((c) => ({
              id: c,
              label: ZHUYIN_CATEGORY_LABELS[c],
            })),
          },
        ];
      case 'nativeLanguage':
        return [
          {
            label: '',
            options: NATIVE_LANGUAGE_ORDER.map((l) => ({
              id: l,
              label: NATIVE_LANGUAGE_LABELS[l],
            })),
          },
        ];
      default:
        return ZHUYIN_CATEGORY_ORDER.map((category) => ({
          label: ZHUYIN_CATEGORY_LABELS[category],
          options: ZHUYIN_INVENTORY.filter((s) => s.category === category).map((s) => ({
            id: s.id,
            // A bare tone mark cannot be read on its own, so tones show their name.
            label: category === 'tone' ? (s.label ?? s.symbol) : s.symbol,
          })),
        }));
    }
  });

  setSubject(subject: ConditionSubject): void {
    const row = this.setRow();
    if (row) {
      // Ids are not interchangeable between subjects, so the selection cannot carry over.
      // Native language has no 排除 in the editor, so it cannot carry over either.
      const mode = subject === 'nativeLanguage' ? 'includes' : row.mode;
      this.nodeChange.emit({ ...row, subject, mode, values: [] });
    }
  }

  setMode(mode: ConditionSetRow['mode']): void {
    const row = this.setRow();
    if (row) {
      this.nodeChange.emit({ ...row, mode });
    }
  }

  toggleSetValue(id: string): void {
    const row = this.setRow();
    if (row) {
      this.nodeChange.emit({
        ...row,
        values: row.values.includes(id)
          ? row.values.filter((value) => value !== id)
          : [...row.values, id],
      });
    }
  }

  readonly selectedField = computed(() => {
    const row = this.row();
    return row ? this.fields().find((f) => f.id === row.fieldId) : undefined;
  });

  readonly fieldHint = computed(() => {
    const row = this.row();
    return row ? (FIELD_HINTS[row.fieldId] ?? '') : '';
  });

  readonly availableOperators = computed(() =>
    this.selectedField()?.kind === 'boolean' ? BOOLEAN_OPERATORS : NUMBER_OPERATORS,
  );

  setField(fieldId: string): void {
    const field = this.fields().find((f) => f.id === fieldId);
    const row = this.row();
    if (!row) {
      return;
    }
    this.nodeChange.emit({
      ...row,
      fieldId,
      operator: '==',
      value: field?.kind === 'boolean' ? true : 0,
    });
  }

  setOperator(operator: ConditionOperator): void {
    const row = this.row();
    if (row) {
      this.nodeChange.emit({ ...row, operator });
    }
  }

  setBooleanValue(value: boolean): void {
    const row = this.row();
    if (row) {
      this.nodeChange.emit({ ...row, value });
    }
  }

  setNumberValue(raw: number): void {
    const row = this.row();
    if (row) {
      this.nodeChange.emit({ ...row, value: Number.isNaN(raw) ? 0 : raw });
    }
  }

  setCombinator(combinator: 'and' | 'or'): void {
    const group = this.group();
    if (group) {
      this.nodeChange.emit({ ...group, combinator });
    }
  }

  updateChild(index: number, child: ConditionNode): void {
    const group = this.group();
    if (!group) {
      return;
    }
    const children = [...group.children];
    children[index] = child;
    this.nodeChange.emit({ ...group, children });
  }

  removeChild(index: number): void {
    const group = this.group();
    if (group) {
      this.nodeChange.emit({ ...group, children: group.children.filter((_, i) => i !== index) });
    }
  }

  addRowChild(): void {
    const group = this.group();
    if (group) {
      this.nodeChange.emit({ ...group, children: [...group.children, defaultRow(this.fields())] });
    }
  }

  addSetRowChild(): void {
    const group = this.group();
    if (group) {
      this.nodeChange.emit({ ...group, children: [...group.children, defaultSetRow()] });
    }
  }

  addGroupChild(): void {
    const group = this.group();
    if (!group) {
      return;
    }
    const newGroup: ConditionGroup = {
      type: 'group',
      combinator: 'and',
      children: [defaultRow(this.fields())],
    };
    this.nodeChange.emit({ ...group, children: [...group.children, newGroup] });
  }
}
