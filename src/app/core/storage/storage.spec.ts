import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { Storage } from './storage';

describe('Storage', () => {
  let service: Storage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(Storage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('starts empty when localStorage has nothing', () => {
    expect(service.achievements()).toEqual([]);
    expect(service.observations()).toEqual([]);
  });

  it('records an achievement and writes it to localStorage', () => {
    service.recordAchievement({ milestoneId: 'm1', achievedOnISODate: '2026-01-01' });

    expect(service.achievements()).toEqual([
      { milestoneId: 'm1', achievedOnISODate: '2026-01-01' },
    ]);

    const persisted = JSON.parse(localStorage.getItem('dev-milestones:v1')!);
    expect(persisted.achievements).toEqual([
      { milestoneId: 'm1', achievedOnISODate: '2026-01-01' },
    ]);
  });

  it('a fresh instance picks up what an earlier instance persisted', () => {
    service.recordAchievement({ milestoneId: 'm1', achievedOnISODate: '2026-01-01' });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(Storage);

    expect(reloaded.achievements()).toEqual([
      { milestoneId: 'm1', achievedOnISODate: '2026-01-01' },
    ]);
  });

  it('replaces an existing achievement for the same milestone', () => {
    service.recordAchievement({ milestoneId: 'm1', achievedOnISODate: '2026-01-01' });
    service.recordAchievement({ milestoneId: 'm1', achievedOnISODate: '2026-02-01' });

    expect(service.achievements()).toEqual([
      { milestoneId: 'm1', achievedOnISODate: '2026-02-01' },
    ]);
  });

  it('clears an achievement', () => {
    service.recordAchievement({ milestoneId: 'm1', achievedOnISODate: '2026-01-01' });
    service.clearAchievement('m1');

    expect(service.achievements()).toEqual([]);
  });

  it('adds an observation', () => {
    service.addObservation({ id: 'o1', dateISODate: '2026-01-01', text: '第一次叫爸爸' });

    expect(service.observations()).toEqual([
      { id: 'o1', dateISODate: '2026-01-01', text: '第一次叫爸爸' },
    ]);
  });

  it('falls back to empty data when localStorage holds corrupt JSON', () => {
    localStorage.setItem('dev-milestones:v1', '{not valid json');

    const corrupted = TestBed.inject(Storage);
    expect(corrupted.achievements()).toEqual([]);
    expect(corrupted.observations()).toEqual([]);
  });
});
