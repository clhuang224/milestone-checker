import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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

  addCase(): void {
    const label = this.newCaseLabel().trim();
    if (!label) {
      return;
    }

    const id = crypto.randomUUID();
    this.storage.upsertCase({
      id,
      label,
      createdOnISODate: new Date().toISOString().slice(0, 10),
    });
    this.newCaseLabel.set('');
    this.router.navigate(['/cases', id]);
  }

  removeCase(id: string): void {
    if (confirm('確定要刪除這個個案嗎?個案的觀察紀錄也會一併刪除。')) {
      this.storage.removeCase(id);
    }
  }
}
