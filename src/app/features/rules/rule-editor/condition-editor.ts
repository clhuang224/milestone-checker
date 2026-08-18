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
import { RuleField } from '../../../core/rule-engine/facts';
import { ZHUYIN_CATEGORY_LABELS, ZHUYIN_INVENTORY } from '../../../data/zhuyin-inventory';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';
import { ZhuyinCategory } from '../../../models/zhuyin.model';

const NUMBER_OPERATORS: ConditionOperator[] = ['==', '!=', '>', '>=', '<', '<='];
const BOOLEAN_OPERATORS: ConditionOperator[] = ['==', '!='];

interface SetOption {
  id: string;
  label: string;
}

interface SetOptionGroup {
  label: string;
  options: SetOption[];
}

/**
 * Spelled out rather than just 「包含／排除」, because 「排除」 is existential: it asks whether
 * anything is *left over* once these are set aside, not whether they are absent.
 */
const MODE_HINTS: Record<ConditionSetRow['mode'], string> = {
  includes: '個案身上有勾選的其中任一項時成立',
  excludes: '扣掉勾選的項目後，個案身上仍然有其他構音錯誤時成立',
};

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
    return row ? MODE_HINTS[row.mode] : '';
  });

  /** Zhuyin is grouped by category; processes are a single flat list. */
  readonly setOptions = computed<SetOptionGroup[]>(() => {
    if (this.setRow()?.subject === 'articulationProcess') {
      return [
        {
          label: '音韻歷程',
          options: this.processes().map((p) => ({ id: p.id, label: p.name })),
        },
      ];
    }

    const categories = [...new Set(ZHUYIN_INVENTORY.map((s) => s.category))] as ZhuyinCategory[];
    return categories.map((category) => ({
      label: ZHUYIN_CATEGORY_LABELS[category],
      options: ZHUYIN_INVENTORY.filter((s) => s.category === category).map((s) => ({
        id: s.id,
        label: s.symbol,
      })),
    }));
  });

  setSubject(subject: ConditionSubject): void {
    const row = this.setRow();
    if (row) {
      // Ids are not interchangeable between subjects, so the selection cannot carry over.
      this.nodeChange.emit({ ...row, subject, values: [] });
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
