import { Component, computed, inject, input } from '@angular/core';

import { Storage } from '../../../core/storage/storage';
import {
  ASPIRATION_LABELS,
  INITIAL_COLUMNS,
  MANNER_LABELS,
  PLACE_LABELS,
  VOICING_LABELS,
  ZHUYIN_CATEGORY_LABELS,
  ZHUYIN_INVENTORY,
  findZhuyin,
} from '../../../data/zhuyin-inventory';
import {
  ArticulationProbe,
  ProbeItem,
  emptyProbeItems,
} from '../../../models/articulation-record.model';
import { ZhuyinSymbol } from '../../../models/zhuyin.model';
import { ProcessSummary } from '../process-summary/process-summary';

/** One cell of the grid: a target sound and its fixed set of probe slots. */
export interface GridCell {
  symbol: ZhuyinSymbol;
  items: ProbeItem[];
}

interface GridSection {
  label: string;
  /** Columns for the initials; a single wrapping column for everything else. */
  columns: GridCell[][];
  /** Initials carry a meaningful left-to-right ordering worth explaining. */
  explainsColumns: boolean;
}

@Component({
  selector: 'app-articulation-table',
  imports: [ProcessSummary],
  templateUrl: './articulation-table.html',
})
export class ArticulationTable {
  private readonly storage = inject(Storage);

  readonly caseId = input.required<string>();
  readonly recordId = input.required<string>();

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.caseId()));
  readonly assessment = computed(() =>
    this.storage.sessionRecords().find((a) => a.id === this.recordId()),
  );

  readonly probes = computed(() =>
    this.storage.articulationRecords().filter((r) => r.recordId === this.recordId()),
  );

  readonly sections = computed<GridSection[]>(() => {
    const initials: GridSection = {
      label: ZHUYIN_CATEGORY_LABELS.initial,
      columns: INITIAL_COLUMNS.map((column) => column.map((id) => this.cellFor(findZhuyin(id)!))),
      explainsColumns: true,
    };

    const rest = (['medial', 'final', 'tone'] as const).map((category) => ({
      label: ZHUYIN_CATEGORY_LABELS[category],
      columns: [
        ZHUYIN_INVENTORY.filter((symbol) => symbol.category === category).map((symbol) =>
          this.cellFor(symbol),
        ),
      ],
      explainsColumns: false,
    }));

    return [initials, ...rest];
  });

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

  setWord(symbolId: string, index: number, word: string): void {
    this.updateItem(symbolId, index, (item) => ({ ...item, word }));
  }

  setHeard(symbolId: string, index: number, heard: string): void {
    this.updateItem(symbolId, index, (item) => ({ ...item, heard }));
  }

  private cellFor(symbol: ZhuyinSymbol): GridCell {
    const probe = this.probes().find((p) => p.targetPhonemeId === symbol.id);
    return { symbol, items: probe?.items ?? emptyProbeItems() };
  }

  private updateItem(
    symbolId: string,
    index: number,
    change: (item: ProbeItem) => ProbeItem,
  ): void {
    const existing = this.probes().find((p) => p.targetPhonemeId === symbolId);
    const items = [...(existing?.items ?? emptyProbeItems())];
    items[index] = change(items[index] ?? { word: '', heard: '' });

    const probe: ArticulationProbe = {
      id: existing?.id ?? crypto.randomUUID(),
      caseId: this.caseId(),
      recordId: this.recordId(),
      targetPhonemeId: symbolId,
      items,
      updatedOnISODate: new Date().toISOString().slice(0, 10),
    };

    // A row emptied back out is deleted rather than kept as a row of blanks.
    if (items.every((item) => !item.word.trim() && !item.heard.trim())) {
      if (existing) {
        this.storage.removeProbe(existing.id);
      }
      return;
    }
    this.storage.upsertProbe(probe);
  }
}
