import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Storage } from '../../../core/storage/storage';
import {
  ASPIRATION_LABELS,
  MANNER_LABELS,
  PLACE_LABELS,
  VOICING_LABELS,
  ZHUYIN_CATEGORY_LABELS,
  ZHUYIN_CATEGORY_ORDER,
  ZHUYIN_INVENTORY,
} from '../../../data/zhuyin-inventory';
import {
  ArticulationDiacritic,
  ArticulationSubstitution,
  WordExample,
} from '../../../models/articulation-record.model';
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
  errorDiacritic?: ArticulationDiacritic;
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
  readonly assessmentId = input.required<string>();

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.id()));
  readonly assessment = computed(() =>
    this.storage.assessments().find((a) => a.id === this.assessmentId()),
  );
  readonly processes = this.storage.articulationProcesses;

  readonly substitutions = computed(() =>
    this.storage.articulationRecords().filter((r) => r.assessmentId === this.assessmentId()),
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

  /**
   * Live preview of what is being recorded. Worth the screen space because "no substituted
   * sound" plus 鼻音化 resolves to 'ㄧ→ㄧⁿ', not the ✓ the empty dropdown suggests.
   */
  readonly draftLabel = computed(() => {
    const draft = this.draft();
    return draft ? substitutionLabel(this.toSubstitution(draft)) : '';
  });

  substitutionsFor(targetPhonemeId: string): ArticulationSubstitution[] {
    return this.substitutions().filter((s) => s.targetPhonemeId === targetPhonemeId);
  }

  label(substitution: ArticulationSubstitution): string {
    return substitutionLabel(substitution);
  }

  /**
   * '雙唇/塞音/不送氣/清音' — built here rather than in the template so it renders without stray
   * spaces, and so the English feature ids are mapped to Chinese in one place.
   */
  featureLabel(symbol: ZhuyinSymbol): string {
    const features = symbol.features;
    if (!features) {
      return '';
    }
    const parts = [PLACE_LABELS[features.place], MANNER_LABELS[features.manner]];
    if (features.aspiration !== 'notApplicable') {
      parts.push(ASPIRATION_LABELS[features.aspiration]);
    }
    parts.push(VOICING_LABELS[features.voicing]);
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
      errorDiacritic: substitution.errorDiacritic,
      processIds: [...substitution.processIds],
      examples: [...substitution.examples],
    });
  }

  setErrorPhoneme(value: string): void {
    this.draft.update((current) => (current ? { ...current, errorPhonemeId: value } : current));
  }

  setNasalized(checked: boolean): void {
    this.draft.update((current) =>
      current ? { ...current, errorDiacritic: checked ? 'nasalized' : undefined } : current,
    );
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

    this.storage.upsertSubstitution(this.toSubstitution(draft));
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

  private toSubstitution(draft: SubstitutionDraft): ArticulationSubstitution {
    return {
      id: draft.id,
      caseId: this.id(),
      assessmentId: this.assessmentId(),
      targetPhonemeId: draft.targetPhonemeId,
      errorPhonemeId: draft.errorPhonemeId || undefined,
      errorDiacritic: draft.errorDiacritic,
      processIds: draft.processIds,
      examples: draft.examples,
      updatedOnISODate: new Date().toISOString().slice(0, 10),
    };
  }

  private resetExampleDraft(): void {
    this.draftWord.set('');
    this.draftNote.set('');
  }
}
