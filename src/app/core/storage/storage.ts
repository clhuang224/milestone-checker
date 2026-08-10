import { Injectable, computed, signal } from '@angular/core';

import { AchievementRecord, ObservationEntry } from '../../models/milestone.model';

const STORAGE_KEY = 'dev-milestones:v1';

interface StoredData {
  achievements: AchievementRecord[];
  observations: ObservationEntry[];
}

function emptyData(): StoredData {
  return { achievements: [], observations: [] };
}

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private readonly data = signal<StoredData>(this.load());

  readonly achievements = computed(() => this.data().achievements);
  readonly observations = computed(() => this.data().observations);

  recordAchievement(record: AchievementRecord): void {
    this.data.update((current) => ({
      ...current,
      achievements: [
        ...current.achievements.filter((a) => a.milestoneId !== record.milestoneId),
        record,
      ],
    }));
    this.persist();
  }

  clearAchievement(milestoneId: string): void {
    this.data.update((current) => ({
      ...current,
      achievements: current.achievements.filter((a) => a.milestoneId !== milestoneId),
    }));
    this.persist();
  }

  addObservation(entry: ObservationEntry): void {
    this.data.update((current) => ({
      ...current,
      observations: [...current.observations, entry],
    }));
    this.persist();
  }

  private load(): StoredData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return emptyData();
      }
      return { ...emptyData(), ...JSON.parse(raw) };
    } catch {
      return emptyData();
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data()));
  }
}
