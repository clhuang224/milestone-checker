import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ageInMonthsOn,
  correctedAgeInMonthsOn,
  formatAgeInMonths,
  todayISO,
} from '../../../core/age';
import { effectiveProcessGroups } from '../../../core/articulation/summary';
import { buildFacts } from '../../../core/rule-engine/facts';
import { evaluateRules } from '../../../core/rule-engine/json-logic';
import { Storage } from '../../../core/storage/storage';
import {
  Case,
  CaseHearing,
  HEARING_STATUS_LABELS,
  HEARING_STATUS_ORDER,
  HearingStatus,
  NATIVE_LANGUAGE_LABELS,
  NATIVE_LANGUAGE_ORDER,
  NativeLanguageId,
  SEX_LABELS,
  Sex,
} from '../../../models/case.model';
import { SessionRecord } from '../../../models/session-record.model';

interface NativeLanguageOption {
  id: NativeLanguageId;
  label: string;
}

/**
 * Visual grouping of NATIVE_LANGUAGE_ORDER: Taiwan's national languages (sign languages included),
 * the new-immigrant languages, then Cantonese. Shown as spacing only, with no headings.
 */
const NATIVE_LANGUAGE_GROUP_SIZES = [8, 7, 1];

/** Separators accepted when several languages are typed into 其他 at once. */
const OTHER_LANGUAGE_SEPARATOR = /[,，、;；\n]/;

interface RecordRow {
  record: SessionRecord;
  /** 'ㄅ 構音評估表 · SOAP' — what was actually done, the column people scan for. */
  formNames: string;
  ageLabel: string;
  warningCount: number;
}

@Component({
  selector: 'app-case-detail',
  imports: [RouterLink],
  templateUrl: './case-detail.html',
})
export class CaseDetail {
  private readonly storage = inject(Storage);

  readonly id = input.required<string>();

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.id()));
  readonly forms = this.storage.assessmentForms;

  /** Basic details are filled once at intake; they should not own the top of every visit. */
  readonly detailsOpen = signal(false);

  /**
   * True while any field a rule can read is still unfilled, which is when "not filled, not judged"
   * can still bite this case. Gestational weeks is not among them: blank there means term, not
   * unknown. Typed-only languages count as answered (`nativeLanguages: []`), matching the rule guard.
   */
  readonly hasUnjudgedFields = computed(() => {
    const c = this.caseRecord();
    return (
      !!c &&
      (!c.birthDateISO ||
        c.nativeLanguages === undefined ||
        c.hearing?.left === undefined ||
        c.hearing?.right === undefined)
    );
  });

  readonly draftFormIds = signal<string[]>([]);
  readonly composing = signal(false);
  readonly canCreate = computed(() => this.draftFormIds().length > 0);

  readonly rows = computed<RecordRow[]>(() =>
    this.storage.recordsFor(this.id()).map((record) => ({
      record,
      formNames: record.formIds
        .map((formId) => this.forms().find((f) => f.id === formId)?.name ?? formId)
        .join(' · '),
      ageLabel: this.ageAt(record),
      warningCount: this.warningsFor(record).length,
    })),
  );

  startCompose(): void {
    this.draftFormIds.set([]);
    this.composing.set(true);
  }

  toggleDraftForm(formId: string): void {
    this.draftFormIds.update((current) =>
      current.includes(formId) ? current.filter((id) => id !== formId) : [...current, formId],
    );
  }

  createRecord(): string | undefined {
    // At least one form, per the developer: a visit with no form recorded nothing.
    if (!this.canCreate()) {
      return undefined;
    }
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      caseId: this.id(),
      onISODate: todayISO(),
      formIds: this.draftFormIds(),
    };
    this.storage.upsertSessionRecord(record);
    this.composing.set(false);
    return record.id;
  }

  firstFormOf(record: SessionRecord): string {
    return record.formIds[0] ?? '';
  }

  onBirthDateChange(birthDateISO: string): void {
    const caseRecord = this.caseRecord();
    if (caseRecord) {
      this.storage.upsertCase({ ...caseRecord, birthDateISO: birthDateISO || undefined });
    }
  }

  readonly sexOptions: { value: Sex; label: string }[] = (['female', 'male'] as Sex[]).map(
    (value) => ({ value, label: SEX_LABELS[value] }),
  );

  onSexChange(raw: string): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    this.storage.upsertCase({ ...caseRecord, sex: raw as Sex });
  }

  onGestationalWeeksChange(raw: string): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    const weeks = raw === '' ? undefined : Number(raw);
    this.storage.upsertCase({
      ...caseRecord,
      gestationalWeeks: weeks === undefined || Number.isNaN(weeks) ? undefined : weeks,
    });
  }

  readonly hearingEars: { side: keyof CaseHearing; label: string }[] = [
    { side: 'left', label: '左耳聽力' },
    { side: 'right', label: '右耳聽力' },
  ];

  readonly hearingOptions: { value: HearingStatus; label: string }[] = HEARING_STATUS_ORDER.map(
    (value) => ({ value, label: HEARING_STATUS_LABELS[value] }),
  );

  /**
   * Sets one ear, or clears it when the status already chosen is picked again. The other ear is
   * never filled in, and with both ears cleared `hearing` is removed rather than stored as `{}`.
   */
  toggleHearing(side: keyof CaseHearing, status: HearingStatus): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    const hearing: CaseHearing = { ...caseRecord.hearing };
    if (hearing[side] === status) {
      delete hearing[side];
    } else {
      hearing[side] = status;
    }
    const next: Case = { ...caseRecord };
    delete next.hearing;
    if (hearing.left !== undefined || hearing.right !== undefined) {
      next.hearing = hearing;
    }
    this.storage.upsertCase(next);
  }

  readonly nativeLanguageGroups: NativeLanguageOption[][] = (() => {
    const options = NATIVE_LANGUAGE_ORDER.map((id) => ({ id, label: NATIVE_LANGUAGE_LABELS[id] }));
    let start = 0;
    return NATIVE_LANGUAGE_GROUP_SIZES.map((size) => {
      const group = options.slice(start, start + size);
      start += size;
      return group;
    });
  })();

  /** Rejection shown under 其他 when the typed text names a language that has a checkbox. */
  readonly otherLanguageError = signal('');

  hasNativeLanguage(c: Case, id: NativeLanguageId): boolean {
    return c.nativeLanguages?.includes(id) ?? false;
  }

  toggleNativeLanguage(id: NativeLanguageId): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    const current = caseRecord.nativeLanguages ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.saveLanguages(caseRecord, next, caseRecord.otherNativeLanguages ?? []);
  }

  /**
   * Adds what was typed into 其他. Several entries may be separated by 、 or a comma. An entry that
   * names a built-in language is refused, so the same language never ends up recorded two ways —
   * once as an id rules can read and once as text they cannot.
   */
  addOtherLanguages(raw: string): boolean {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return false;
    }
    const others = [...(caseRecord.otherNativeLanguages ?? [])];
    const refused: string[] = [];
    for (const entry of raw.split(OTHER_LANGUAGE_SEPARATOR).map((e) => e.trim())) {
      if (!entry || others.includes(entry)) {
        continue;
      }
      const builtin = builtinLabelsMatching(entry);
      if (builtin.length > 0) {
        refused.push(...builtin.filter((label) => !refused.includes(label)));
        continue;
      }
      others.push(entry);
    }
    this.otherLanguageError.set(
      refused.length > 0 ? `${refused.map((l) => `「${l}」`).join('')}在清單上，請直接勾選。` : '',
    );
    if (others.length !== (caseRecord.otherNativeLanguages ?? []).length) {
      this.saveLanguages(caseRecord, caseRecord.nativeLanguages ?? [], others);
    }
    return refused.length === 0;
  }

  removeOtherLanguage(entry: string): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    this.saveLanguages(
      caseRecord,
      caseRecord.nativeLanguages ?? [],
      (caseRecord.otherNativeLanguages ?? []).filter((x) => x !== entry),
    );
  }

  onOtherLanguageInput(input: HTMLInputElement): void {
    if (this.addOtherLanguages(input.value)) {
      input.value = '';
    }
  }

  /**
   * Nothing checked and nothing typed removes both fields: the case is back to "not asked", which
   * rules skip. Typed languages with no box checked keep `nativeLanguages: []` — the question was
   * answered, just not from the list, and a rule asking about a listed language should read no.
   */
  private saveLanguages(caseRecord: Case, native: NativeLanguageId[], others: string[]): void {
    const next: Case = { ...caseRecord };
    delete next.nativeLanguages;
    delete next.otherNativeLanguages;
    if (native.length > 0 || others.length > 0) {
      next.nativeLanguages = NATIVE_LANGUAGE_ORDER.filter((id) => native.includes(id));
    }
    if (others.length > 0) {
      next.otherNativeLanguages = others;
    }
    this.storage.upsertCase(next);
  }

  /** Age on the day of the visit, not today — and a mistyped year shows up here immediately. */
  private ageAt(record: SessionRecord): string {
    const caseRecord = this.caseRecord();
    if (!caseRecord?.birthDateISO) {
      return '';
    }
    const months = ageInMonthsOn(caseRecord.birthDateISO, record.onISODate);
    if (months === undefined) {
      return '';
    }
    const corrected = correctedAgeInMonthsOn(
      caseRecord.birthDateISO,
      caseRecord.gestationalWeeks,
      record.onISODate,
    );
    const label = formatAgeInMonths(months);
    return corrected !== undefined && corrected !== months
      ? `${label}（矯正 ${formatAgeInMonths(corrected)}）`
      : label;
  }

  private warningsFor(record: SessionRecord) {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return [];
    }
    const probes = this.storage.probesForSessionRecord(record.id);
    return evaluateRules(
      this.storage.rules(),
      buildFacts(
        caseRecord,
        record,
        this.storage.profileFor(record.id) ?? {
          recordId: record.id,
          values: {},
          updatedOnISODate: record.onISODate,
        },
        probes,
        effectiveProcessGroups(probes, this.storage.summaryFor(record.id)),
        this.storage.trialsForSessionRecord(record.id),
      ),
    );
  }
}

/**
 * Built-in labels the typed entry names: the full label, or a shorthand inside it, so 「台語」 is
 * caught by 「台灣台語」. Only that direction — an entry that merely contains a label, such as
 * 「馬來西亞華語」, is a different language and must stay recordable. A single character is too
 * short to mean anything.
 */
function builtinLabelsMatching(entry: string): string[] {
  return NATIVE_LANGUAGE_ORDER.map((id) => NATIVE_LANGUAGE_LABELS[id]).filter(
    (label) => label === entry || (entry.length >= 2 && label.includes(entry)),
  );
}
