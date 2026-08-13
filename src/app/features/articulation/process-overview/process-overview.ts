import { Component, computed, input } from '@angular/core';

import { ArticulationSubstitution } from '../../../models/articulation-record.model';
import { PhonologicalProcessDefinition } from '../../../models/phonological-process.model';
import { substitutionLabel } from '../substitution-label';

interface ProcessGroup {
  id: string;
  name: string;
  description?: string;
  pairs: string[];
}

/** Pseudo-group id for error pairs the therapist hasn't classified yet. */
const UNTAGGED = '__untagged__';

@Component({
  selector: 'app-process-overview',
  templateUrl: './process-overview.html',
})
export class ProcessOverview {
  readonly substitutions = input.required<ArticulationSubstitution[]>();
  readonly processes = input.required<PhonologicalProcessDefinition[]>();

  /** Correct sounds are left out — the overview summarises errors only. */
  private readonly errors = computed(() => this.substitutions().filter((s) => s.errorPhonemeId));

  readonly groups = computed<ProcessGroup[]>(() => {
    const tagged: ProcessGroup[] = this.processes()
      .map((process) => ({
        id: process.id,
        name: process.name,
        description: process.description,
        pairs: this.errors()
          .filter((s) => s.processIds.includes(process.id))
          .map(substitutionLabel),
      }))
      .filter((group) => group.pairs.length > 0);

    const untagged = this.errors().filter((s) => s.processIds.length === 0);
    if (untagged.length > 0) {
      tagged.push({
        id: UNTAGGED,
        name: '尚未歸類',
        description: '這些錯誤音對還沒有貼上任何音韻歷程標籤',
        pairs: untagged.map(substitutionLabel),
      });
    }

    return tagged;
  });
}
