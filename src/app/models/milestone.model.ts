export type CategoryId = 'language' | 'speech' | 'swallowing';

export interface Milestone {
  id: string;
  categoryId: CategoryId;
  title: string;
  description?: string;
  typicalAgeRangeMonths?: [number, number];
  suggestedActivities?: string[];
  /** Where this milestone claim comes from. Required for real (non-placeholder) content. */
  sourceNote?: string;
}

export interface AchievementRecord {
  milestoneId: string;
  achievedOnISODate: string;
  note?: string;
}

export interface ObservationEntry {
  id: string;
  dateISODate: string;
  text: string;
}
