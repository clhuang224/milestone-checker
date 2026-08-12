import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { RuleList } from './rule-list';

describe('RuleList', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [RuleList] });
  });

  it('renders the empty-state message when there are no rules', async () => {
    const fixture = TestBed.createComponent(RuleList);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('還沒有任何規則');
  });

  it('opens the rule editor when "新增規則" is clicked', async () => {
    const fixture = TestBed.createComponent(RuleList);
    await fixture.whenStable();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('app-rule-editor')).toBeTruthy();
  });
});
