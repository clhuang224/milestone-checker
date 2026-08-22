import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';

import { NASALIZED_MARK } from '../../../core/articulation/parse-heard';
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

/** Where the floating ⁿ button sits, in viewport coordinates. */
interface MarkPosition {
  left: number;
  top: number;
}

/** Side of the ⁿ button, and the gap it keeps from the box it belongs to. */
const MARK_BUTTON_SIZE = 24;
const MARK_BUTTON_GAP = 4;

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

  readonly nasalizedMark = NASALIZED_MARK;

  /**
   * The ⁿ button floats (`position: fixed`) beside whichever 錯音 box has focus rather than
   * sitting in the grid: the initials section is six columns of place of articulation inside a
   * `max-w-6xl` shell, and a per-cell button would spend horizontal budget the columns need.
   * Floating costs no layout at all, so nothing can push ㄍ under ㄅ.
   */
  readonly markSlot = signal<string | null>(null);
  readonly markPosition = signal<MarkPosition>({ left: 0, top: 0 });
  private markInput: HTMLInputElement | null = null;

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

  constructor() {
    // Capture phase, because the grid's own `overflow-x-auto` box scrolls and scroll does not
    // bubble. Resize matters too: the button is placed from viewport coordinates.
    const follow = () => this.placeMark();
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    });
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

  setWord(symbolId: string, index: number, word: string): void {
    this.updateItem(symbolId, index, (item) => ({ ...item, word }));
  }

  setHeard(symbolId: string, index: number, heard: string): void {
    this.updateItem(symbolId, index, (item) => ({ ...item, heard }));
  }

  /** Identifies one 錯音 box, so only the focused one grows a button. */
  slotKey(symbolId: string, index: number): string {
    return `${symbolId}:${index}`;
  }

  offerMark(input: HTMLInputElement, symbolId: string, index: number): void {
    this.markInput = input;
    this.markSlot.set(this.slotKey(symbolId, index));
    this.placeMark();
  }

  /** Leaving the box hides the button — unless focus is moving onto the button itself. */
  dismissMark(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof HTMLElement && next.dataset['nasalMark'] !== undefined) {
      return;
    }
    this.closeMark();
  }

  /** Tabbing off the button hides it; the hop back to its own box after inserting does not. */
  dismissMarkFromButton(event: FocusEvent): void {
    if (event.relatedTarget === this.markInput) {
      return;
    }
    this.closeMark();
  }

  /**
   * Inserts the mark at the caret rather than at the end of the box, because the position is
   * what the mark means: in 「ㄉㄭⁿ」 it belongs to ㄭ, and `parseHeard` only reads a ⁿ that
   * directly follows the first zhuyin symbol.
   */
  insertNasalizedMark(input: HTMLInputElement, symbolId: string, index: number): void {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const heard = input.value.slice(0, start) + NASALIZED_MARK + input.value.slice(end);
    const caret = start + NASALIZED_MARK.length;

    // The box only writes through on `change` (blur), so the pending text lives in the DOM.
    input.value = heard;
    this.setHeard(symbolId, index, heard);
    input.focus();
    input.setSelectionRange(caret, caret);
  }

  private closeMark(): void {
    this.markSlot.set(null);
    this.markInput = null;
  }

  /** Keeps the floating button glued to its box while the page or the grid scrolls. */
  private placeMark(): void {
    const input = this.markInput;
    if (!input) {
      return;
    }
    const box = input.getBoundingClientRect();
    const toTheRight = box.right + MARK_BUTTON_GAP;
    const fits = toTheRight + MARK_BUTTON_SIZE <= window.innerWidth - MARK_BUTTON_GAP;
    this.markPosition.set({
      left: fits ? toTheRight : box.left - MARK_BUTTON_SIZE - MARK_BUTTON_GAP,
      top: box.top + (box.height - MARK_BUTTON_SIZE) / 2,
    });
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
