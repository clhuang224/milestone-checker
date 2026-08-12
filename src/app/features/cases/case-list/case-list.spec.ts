import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';

import { CaseList } from './case-list';

describe('CaseList', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CaseList],
      providers: [provideRouter([])],
    });
  });

  it('renders the create-case form and an empty-state message', async () => {
    const fixture = TestBed.createComponent(CaseList);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(text).toContain('新增個案');
    expect(text).toContain('還沒有個案');
  });
});
