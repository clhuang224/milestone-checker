import { Component, computed, inject, input } from '@angular/core';

import { applicableProcessIds } from '../../../core/articulation/derive-processes';
import { derivedProcessGroups, effectiveProcessGroups } from '../../../core/articulation/summary';
import { Storage } from '../../../core/storage/storage';
import { ZHUYIN_INVENTORY, findZhuyin } from '../../../data/zhuyin-inventory';
import { ArticulationProbe, ManualProcessGroup } from '../../../models/articulation-record.model';

interface DisplayGroup {
  processId: string;
  name: string;
  /** 'ㄉ ㄊ' */
  symbols: string;
}

interface ManualOption {
  processId: string;
  name: string;
  /** Sounds this process could apply to, so an impossible pairing is never offered. */
  targets: { id: string; symbol: string; selected: boolean }[];
}

@Component({
  selector: 'app-process-summary',
  templateUrl: './process-summary.html',
})
export class ProcessSummary {
  private readonly storage = inject(Storage);

  readonly assessmentId = input.required<string>();
  readonly probes = input.required<ArticulationProbe[]>();

  private readonly summary = computed(() => this.storage.summaryFor(this.assessmentId()));

  readonly useDerived = computed(() => this.summary()?.useDerived ?? true);

  readonly groups = computed<DisplayGroup[]>(() =>
    this.toDisplay(effectiveProcessGroups(this.probes(), this.summary())),
  );

  /** Only the sounds actually recorded as errors can be assigned a process by hand. */
  readonly manualOptions = computed<ManualOption[]>(() => {
    const recorded = [...new Set(this.probes().map((p) => p.targetPhonemeId))];
    const manual = this.summary()?.manual ?? [];

    return this.storage
      .articulationProcesses()
      .map((process) => ({
        processId: process.id,
        name: process.name,
        targets: recorded
          .filter((id) => applicableProcessIds(id).includes(process.id))
          .map((id) => ({
            id,
            symbol: findZhuyin(id)?.symbol ?? id,
            selected: manual.some(
              (group) => group.processId === process.id && group.targetPhonemeIds.includes(id),
            ),
          })),
      }))
      .filter((option) => option.targets.length > 0);
  });

  setUseDerived(useDerived: boolean): void {
    // Switching to manual starts blank rather than seeded from the derived result: an override
    // the therapist did not write is worse than an empty box they can see is empty.
    this.storage.saveSummary({
      assessmentId: this.assessmentId(),
      useDerived,
      manual: useDerived ? (this.summary()?.manual ?? []) : [],
    });
  }

  toggleManual(processId: string, targetPhonemeId: string): void {
    const manual = this.summary()?.manual ?? [];
    const group = manual.find((g) => g.processId === processId);

    let next: ManualProcessGroup[];
    if (!group) {
      next = [...manual, { processId, targetPhonemeIds: [targetPhonemeId] }];
    } else {
      const targets = group.targetPhonemeIds.includes(targetPhonemeId)
        ? group.targetPhonemeIds.filter((id) => id !== targetPhonemeId)
        : [...group.targetPhonemeIds, targetPhonemeId];
      next = manual
        .map((g) => (g.processId === processId ? { ...g, targetPhonemeIds: targets } : g))
        .filter((g) => g.targetPhonemeIds.length > 0);
    }

    this.storage.saveSummary({
      assessmentId: this.assessmentId(),
      useDerived: false,
      manual: next,
    });
  }

  private toDisplay(groups: ManualProcessGroup[]): DisplayGroup[] {
    const order = new Map(ZHUYIN_INVENTORY.map((symbol, index) => [symbol.id, index]));

    return groups
      .map((group) => ({
        processId: group.processId,
        name:
          this.storage.articulationProcesses().find((p) => p.id === group.processId)?.name ??
          group.processId,
        symbols: [...group.targetPhonemeIds]
          .sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
          .map((id) => findZhuyin(id)?.symbol ?? id)
          .join(' '),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  protected readonly derivedCount = computed(() => derivedProcessGroups(this.probes()).length);
}
