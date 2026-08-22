import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Storage } from '../../../core/storage/storage';

interface FormRow {
  id: string;
  name: string;
  /** How many session records use it — the reason to care that a form exists. */
  usedBy: number;
  /** Instruments are code; only their catalogues are editable. Item lists are data. */
  editable: boolean;
}

@Component({
  selector: 'app-form-list',
  imports: [RouterLink],
  templateUrl: './form-list.html',
})
export class FormList {
  private readonly storage = inject(Storage);

  readonly ruleCount = computed(() => this.storage.rules().length);

  readonly rows = computed<FormRow[]>(() => {
    const records = this.storage.sessionRecords();
    return this.storage.assessmentForms().map((form) => ({
      id: form.id,
      name: form.name,
      usedBy: records.filter((r) => r.formIds.includes(form.id)).length,
      editable: form.body.kind === 'itemList',
    }));
  });
}
