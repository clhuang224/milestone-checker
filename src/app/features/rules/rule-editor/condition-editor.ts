import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ConditionGroup,
  ConditionNode,
  ConditionOperator,
  ConditionRow,
  defaultRow,
} from '../../../core/rule-engine/condition-mapper';
import { FindingDefinition } from '../../../models/finding.model';

const NUMBER_OPERATORS: ConditionOperator[] = ['==', '!=', '>', '>=', '<', '<='];
const BOOLEAN_OPERATORS: ConditionOperator[] = ['==', '!='];

@Component({
  selector: 'app-condition-editor',
  imports: [FormsModule, ConditionEditor],
  templateUrl: './condition-editor.html',
})
export class ConditionEditor {
  readonly node = input.required<ConditionNode>();
  readonly fields = input.required<FindingDefinition[]>();
  readonly nodeChange = output<ConditionNode>();

  readonly row = computed(() =>
    this.node().type === 'row' ? (this.node() as ConditionRow) : undefined,
  );
  readonly group = computed(() =>
    this.node().type === 'group' ? (this.node() as ConditionGroup) : undefined,
  );

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
