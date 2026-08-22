import { SwallowUnitDefinition } from '../../models/swallow-catalogue.model';
import { SwallowOutcome, SwallowTrial } from '../../models/swallow-trial.model';

/**
 * 不嗆咳的比例, 0–100. The single scale both outcome shapes flatten onto, so a rule compares
 * one thing.
 *
 * The flattening loses whether the number was counted or estimated — a rule cannot tell 「數過
 * 的 90%」 from 「估的 90%」. That is deliberate, and it is why the table and the report render
 * `outcomeLabel()` rather than this number: a reader can always see which one it was.
 */
export function successPercent(outcome: SwallowOutcome): number {
  if (outcome.kind === 'estimated') {
    return clamp(outcome.successPercent);
  }
  if (outcome.attempts <= 0) {
    return 0;
  }
  // 「嗆咳一次以下」 is read as exactly one — the conservative direction, since assuming fewer
  // would claim a success the therapist did not record.
  return clamp(((outcome.attempts - outcome.chokes) / outcome.attempts) * 100);
}

function clamp(percent: number): number {
  return Math.max(0, Math.min(100, Math.round(percent)));
}

const COMPARISON_LABELS: Record<string, string> = {
  lt: '少於',
  lte: '以下',
  eq: '',
  gte: '以上',
  gt: '超過',
};

/** '10 口中嗆咳 1 口以下（90%）' or '約 90%' — the original form, not the flattened one. */
export function outcomeLabel(outcome: SwallowOutcome, units: SwallowUnitDefinition[] = []): string {
  if (outcome.kind === 'estimated') {
    return `約 ${clamp(outcome.successPercent)}%`;
  }

  const unit = units.find((u) => u.id === outcome.unitId)?.name ?? outcome.unitId;
  const comparison = COMPARISON_LABELS[outcome.comparison] ?? '';
  const prefix = comparison === '少於' || comparison === '超過' ? comparison : '';
  const suffix = comparison === '以下' || comparison === '以上' ? comparison : '';

  return (
    `${outcome.attempts} ${unit}中嗆咳 ${prefix}${outcome.chokes}${suffix} ${unit}` +
    `（${successPercent(outcome)}%）`
  );
}

/** True when anything was choked at all — 「完全不嗆咳」 is 100%. */
export function chokedAtAll(trial: SwallowTrial): boolean {
  return successPercent(trial.outcome) < 100;
}
