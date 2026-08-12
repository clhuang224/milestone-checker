import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'cases', pathMatch: 'full' },
  {
    path: 'cases',
    loadComponent: () => import('./features/cases/case-list/case-list').then((m) => m.CaseList),
  },
  {
    path: 'cases/:id',
    loadComponent: () =>
      import('./features/cases/case-detail/case-detail').then((m) => m.CaseDetail),
  },
];
