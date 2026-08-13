import { Component, computed, inject, signal } from '@angular/core';

import { Storage } from '../../../core/storage/storage';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';

interface ProcessDraft {
  id: string;
  name: string;
  description: string;
  sourceNote: string;
  builtin: boolean;
}

function draftFrom(process: PhonologicalProcessDefinition): ProcessDraft {
  return {
    id: process.id,
    name: process.name,
    description: process.description ?? '',
    sourceNote: process.sourceNote ?? '',
    builtin: process.builtin,
  };
}

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.html',
})
export class ProcessList {
  private readonly storage = inject(Storage);

  readonly processes = this.storage.articulationProcesses;
  readonly draft = signal<ProcessDraft | undefined>(undefined);

  readonly canSave = computed(() => (this.draft()?.name ?? '').trim().length > 0);

  startCreate(): void {
    this.draft.set({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      sourceNote: '',
      builtin: false,
    });
  }

  startEdit(process: PhonologicalProcessDefinition): void {
    this.draft.set(draftFrom(process));
  }

  updateDraft(field: 'name' | 'description' | 'sourceNote', value: string): void {
    this.draft.update((current) => (current ? { ...current, [field]: value } : current));
  }

  cancel(): void {
    this.draft.set(undefined);
  }

  save(): void {
    const draft = this.draft();
    if (!draft || !this.canSave()) {
      return;
    }

    this.storage.upsertArticulationProcess({
      id: draft.id,
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      sourceNote: draft.sourceNote.trim() || undefined,
      builtin: draft.builtin,
    });
    this.draft.set(undefined);
  }

  remove(process: PhonologicalProcessDefinition): void {
    if (confirm(`確定要刪除「${process.name}」嗎?已經貼上這個標籤的音對會被解除標記。`)) {
      this.storage.removeArticulationProcess(process.id);
    }
  }
}
