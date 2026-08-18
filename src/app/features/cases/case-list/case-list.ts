import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ageInMonthsOn, formatAgeInMonths, todayISO } from '../../../core/age';
import { Storage } from '../../../core/storage/storage';

@Component({
  selector: 'app-case-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './case-list.html',
})
export class CaseList {
  private readonly storage = inject(Storage);
  private readonly router = inject(Router);

  readonly cases = this.storage.cases;
  readonly newCaseLabel = signal('');
  readonly newCaseBirthDate = signal('');

  /** Echoes back what the app derives from the date, so a mistyped year is obvious immediately. */
  readonly newCaseAge = computed(() => this.ageLabel(this.newCaseBirthDate()));

  ageLabel(birthDateISO: string | undefined): string {
    if (!birthDateISO) {
      return '';
    }
    const months = ageInMonthsOn(birthDateISO, todayISO());
    return months === undefined ? '' : formatAgeInMonths(months);
  }

  addCase(): void {
    const label = this.newCaseLabel().trim();
    if (!label) {
      return;
    }

    const id = crypto.randomUUID();
    this.storage.upsertCase({
      id,
      label,
      createdOnISODate: todayISO(),
      birthDateISO: this.newCaseBirthDate() || undefined,
    });
    this.newCaseLabel.set('');
    this.newCaseBirthDate.set('');
    this.router.navigate(['/cases', id]);
  }

  removeCase(id: string): void {
    if (confirm('確定要刪除這個個案嗎?個案的觀察紀錄也會一併刪除。')) {
      this.storage.removeCase(id);
    }
  }
}
