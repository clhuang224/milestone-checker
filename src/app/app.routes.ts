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
  {
    path: 'cases/:id/articulation',
    loadComponent: () =>
      import('./features/articulation/articulation-table/articulation-table').then(
        (m) => m.ArticulationTable,
      ),
  },
  {
    path: 'rules',
    loadComponent: () => import('./features/rules/rule-list/rule-list').then((m) => m.RuleList),
  },
  {
    path: 'articulation-processes',
    loadComponent: () =>
      import('./features/articulation/process-list/process-list').then((m) => m.ProcessList),
  },
];
