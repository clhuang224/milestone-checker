import { Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ConditionNode,
  defaultGroup,
  fromJsonLogic,
  toJsonLogic,
} from '../../../core/rule-engine/condition-mapper';
import { RuleField } from '../../../core/rule-engine/facts';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';
import { Rule, RuleSeverity } from '../../../models/rule.model';
import { ConditionEditor } from './condition-editor';

@Component({
  selector: 'app-rule-editor',
  imports: [FormsModule, ConditionEditor],
  templateUrl: './rule-editor.html',
})
export class RuleEditor {
  readonly initialRule = input<Rule | undefined>();
  readonly fields = input.required<RuleField[]>();
  readonly processes = input.required<PhonologicalProcessDefinition[]>();
  readonly saveRule = output<Rule>();
  readonly cancelEdit = output<void>();

  readonly name = signal('');
  readonly message = signal('');
  readonly severity = signal<RuleSeverity>('info');
  readonly reportTemplate = signal('');
  readonly enabled = signal(true);
  readonly sourceNote = signal('');
  readonly conditionNode = signal<ConditionNode>({
    type: 'group',
    combinator: 'and',
    children: [],
  });

  readonly canSave = computed(() => this.name().trim() !== '' && this.message().trim() !== '');

  constructor() {
    effect(() => {
      const rule = this.initialRule();
      this.name.set(rule?.name ?? '');
      this.message.set(rule?.action.message ?? '');
      this.severity.set(rule?.action.severity ?? 'info');
      this.reportTemplate.set(rule?.action.reportTemplate ?? '');
      this.enabled.set(rule?.enabled ?? true);
      this.sourceNote.set(rule?.sourceNote ?? '');
      this.conditionNode.set(rule ? fromJsonLogic(rule.condition) : defaultGroup(this.fields()));
    });
  }

  submit(): void {
    if (!this.canSave()) {
      return;
    }
    const rule: Rule = {
      id: this.initialRule()?.id ?? crypto.randomUUID(),
      name: this.name().trim(),
      condition: toJsonLogic(this.conditionNode()),
      action: {
        message: this.message().trim(),
        severity: this.severity(),
        reportTemplate: this.reportTemplate().trim() || undefined,
      },
      enabled: this.enabled(),
      sourceNote: this.sourceNote().trim() || undefined,
    };
    this.saveRule.emit(rule);
  }
}
