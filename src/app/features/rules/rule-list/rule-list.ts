import { Component, computed, inject, signal } from '@angular/core';

import { fromJsonLogic } from '../../../core/rule-engine/condition-mapper';
import { ruleFields } from '../../../core/rule-engine/facts';
import { Storage } from '../../../core/storage/storage';
import { Rule } from '../../../models/rule.model';
import { RuleEditor } from '../rule-editor/rule-editor';

function parseRuleSet(data: unknown): Rule[] {
  if (!Array.isArray(data)) {
    throw new Error('檔案內容必須是一個規則陣列');
  }
  return data.map((item, index) => {
    const rule = item as Partial<Rule> | null;
    if (
      typeof rule !== 'object' ||
      rule === null ||
      typeof rule.id !== 'string' ||
      typeof rule.name !== 'string' ||
      typeof rule.condition !== 'object' ||
      rule.condition === null ||
      typeof rule.action?.message !== 'string' ||
      typeof rule.action?.severity !== 'string' ||
      typeof rule.enabled !== 'boolean'
    ) {
      throw new Error(`第 ${index + 1} 筆規則格式不正確`);
    }
    fromJsonLogic(rule.condition);
    return rule as Rule;
  });
}

@Component({
  selector: 'app-rule-list',
  imports: [RuleEditor],
  templateUrl: './rule-list.html',
})
export class RuleList {
  private readonly storage = inject(Storage);

  readonly rules = this.storage.rules;
  readonly fields = computed(() => ruleFields(this.storage.findings()));
  readonly processes = this.storage.articulationProcesses;

  readonly isCreating = signal(false);
  readonly editingRuleId = signal<string | undefined>(undefined);
  readonly importError = signal<string | undefined>(undefined);

  readonly editingRule = computed(() => this.rules().find((r) => r.id === this.editingRuleId()));
  readonly isEditorOpen = computed(() => this.isCreating() || this.editingRuleId() !== undefined);

  startCreate(): void {
    this.isCreating.set(true);
    this.editingRuleId.set(undefined);
  }

  startEdit(rule: Rule): void {
    this.editingRuleId.set(rule.id);
    this.isCreating.set(false);
  }

  closeEditor(): void {
    this.isCreating.set(false);
    this.editingRuleId.set(undefined);
  }

  onSave(rule: Rule): void {
    this.storage.upsertRule(rule);
    this.closeEditor();
  }

  toggleEnabled(rule: Rule): void {
    this.storage.upsertRule({ ...rule, enabled: !rule.enabled });
  }

  removeRule(id: string): void {
    if (confirm('確定要刪除這條規則嗎?')) {
      this.storage.removeRule(id);
    }
  }

  exportRules(): void {
    const blob = new Blob([JSON.stringify(this.rules(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importRules(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const rules = parseRuleSet(JSON.parse(text));
      if (confirm(`確定要匯入 ${rules.length} 條規則嗎?這會取代目前所有的規則。`)) {
        this.storage.replaceRules(rules);
        this.importError.set(undefined);
      }
    } catch (error) {
      this.importError.set(error instanceof Error ? error.message : '匯入失敗，檔案格式不正確');
    }
  }
}
