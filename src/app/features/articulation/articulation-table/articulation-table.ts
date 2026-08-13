import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Storage } from '../../../core/storage/storage';
import {
  ZHUYIN_CATEGORY_LABELS,
  ZHUYIN_CATEGORY_ORDER,
  ZHUYIN_INVENTORY,
} from '../../../data/zhuyin-inventory';
import { ArticulationSubstitution, WordExample } from '../../../models/articulation-record.model';
import { ZhuyinCategory, ZhuyinSymbol } from '../../../models/zhuyin.model';
import { ProcessOverview } from '../process-overview/process-overview';
import { substitutionLabel } from '../substitution-label';

interface CategorySection {
  category: ZhuyinCategory;
  label: string;
  symbols: ZhuyinSymbol[];
}

interface SubstitutionDraft {
  id: string;
  targetPhonemeId: string;
  errorPhonemeId: string;
  processIds: string[];
  examples: WordExample[];
}

@Component({
  selector: 'app-articulation-table',
  imports: [RouterLink, ProcessOverview],
  templateUrl: './articulation-table.html',
})
export class ArticulationTable {
  private readonly storage = inject(Storage);

  readonly id = input.required<string>();

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.id()));
  readonly processes = this.storage.articulationProcesses;

  readonly substitutions = computed(() =>
    this.storage.articulationRecords().filter((r) => r.caseId === this.id()),
  );

  readonly sections: CategorySection[] = ZHUYIN_CATEGORY_ORDER.map((category) => ({
    category,
    label: ZHUYIN_CATEGORY_LABELS[category],
    symbols: ZHUYIN_INVENTORY.filter((symbol) => symbol.category === category),
  }));

  /** Grouped for the error-sound <select>, so the list stays navigable at 42 options. */
  readonly options = this.sections;

  readonly draft = signal<SubstitutionDraft | undefined>(undefined);
  readonly draftWord = signal('');
  readonly draftNote = signal('');

  substitutionsFor(targetPhonemeId: string): ArticulationSubstitution[] {
    return this.substitutions().filter((s) => s.targetPhonemeId === targetPhonemeId);
  }

  label(substitution: ArticulationSubstitution): string {
    return substitutionLabel(substitution);
  }

  /** '雙唇/塞音/送氣' — built here rather than in the template so it renders without stray spaces. */
  featureLabel(symbol: ZhuyinSymbol): string {
    const features = symbol.features;
    if (!features) {
      return '';
    }
    const parts = [features.place, features.manner];
    if (features.aspiration !== '不適用') {
      parts.push(features.aspiration);
    }
    return parts.join('/');
  }

  exampleLabel(example: WordExample): string {
    return example.note ? `${example.word}(${example.note})` : example.word;
  }

  processNames(substitution: ArticulationSubstitution): string[] {
    return substitution.processIds.map(
      (id) => this.processes().find((p) => p.id === id)?.name ?? id,
    );
  }

  startAdd(symbol: ZhuyinSymbol): void {
    this.resetExampleDraft();
    this.draft.set({
      id: crypto.randomUUID(),
      targetPhonemeId: symbol.id,
      errorPhonemeId: '',
      processIds: [],
      examples: [],
    });
  }

  startEdit(substitution: ArticulationSubstitution): void {
    this.resetExampleDraft();
    this.draft.set({
      id: substitution.id,
      targetPhonemeId: substitution.targetPhonemeId,
      errorPhonemeId: substitution.errorPhonemeId ?? '',
      processIds: [...substitution.processIds],
      examples: [...substitution.examples],
    });
  }

  setErrorPhoneme(value: string): void {
    this.draft.update((current) => (current ? { ...current, errorPhonemeId: value } : current));
  }

  toggleProcess(processId: string): void {
    this.draft.update((current) =>
      current
        ? {
            ...current,
            processIds: current.processIds.includes(processId)
              ? current.processIds.filter((id) => id !== processId)
              : [...current.processIds, processId],
          }
        : current,
    );
  }

  addExample(): void {
    const word = this.draftWord().trim();
    if (!word) {
      return;
    }
    const note = this.draftNote().trim();
    this.draft.update((current) =>
      current
        ? { ...current, examples: [...current.examples, { word, note: note || undefined }] }
        : current,
    );
    this.resetExampleDraft();
  }

  removeExample(index: number): void {
    this.draft.update((current) =>
      current ? { ...current, examples: current.examples.filter((_, i) => i !== index) } : current,
    );
  }

  save(): void {
    const draft = this.draft();
    if (!draft) {
      return;
    }

    this.storage.upsertSubstitution({
      id: draft.id,
      caseId: this.id(),
      targetPhonemeId: draft.targetPhonemeId,
      errorPhonemeId: draft.errorPhonemeId || undefined,
      processIds: draft.processIds,
      examples: draft.examples,
      updatedOnISODate: new Date().toISOString().slice(0, 10),
    });
    this.cancel();
  }

  cancel(): void {
    this.draft.set(undefined);
    this.resetExampleDraft();
  }

  remove(substitution: ArticulationSubstitution): void {
    if (confirm(`確定要刪除「${substitutionLabel(substitution)}」這筆記錄嗎?`)) {
      this.storage.removeSubstitution(substitution.id);
    }
  }

  private resetExampleDraft(): void {
    this.draftWord.set('');
    this.draftNote.set('');
  }
}
