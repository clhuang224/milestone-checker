import {
  ArticulationProbe,
  ManualProcessGroup,
  PhonologicalSummary,
} from '../../models/articulation-record.model';
import { probeErrors } from './probe-errors';

/**
 * The phonological summary in force for an assessment.
 *
 * Derived from the probes unless the therapist has overridden it. The derived result is never
 * stored — it is a function of the grid, and keeping a copy would only let the two disagree.
 * An absent summary record means "use the derived one", so the default costs no storage.
 */
export function effectiveProcessGroups(
  probes: ArticulationProbe[],
  summary: PhonologicalSummary | undefined,
): ManualProcessGroup[] {
  if (summary && !summary.useDerived) {
    return summary.manual;
  }
  return derivedProcessGroups(probes);
}

/** 「後置化: ㄉ ㄊ」 — each process with the target sounds that demonstrated it. */
export function derivedProcessGroups(probes: ArticulationProbe[]): ManualProcessGroup[] {
  const byProcess = new Map<string, Set<string>>();

  for (const error of probeErrors(probes)) {
    for (const processId of error.processIds) {
      const targets = byProcess.get(processId) ?? new Set<string>();
      targets.add(error.targetPhonemeId);
      byProcess.set(processId, targets);
    }
  }

  return [...byProcess].map(([processId, targets]) => ({
    processId,
    targetPhonemeIds: [...targets],
  }));
}

/** Every process id the summary attributes to a given target sound. */
export function processIdsForTarget(
  groups: ManualProcessGroup[],
  targetPhonemeId: string,
): string[] {
  return groups
    .filter((group) => group.targetPhonemeIds.includes(targetPhonemeId))
    .map((group) => group.processId);
}
