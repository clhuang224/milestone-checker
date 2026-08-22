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
    // The form is in the path so the browser's back button moves between forms rather than
    // leaving the record, and so a form is directly linkable.
    path: 'cases/:caseId/records/:recordId/forms/:formId',
    loadComponent: () =>
      import('./features/records/record-detail/record-detail').then((m) => m.RecordDetail),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/articulation/articulation-table/articulation-table').then(
            (m) => m.ArticulationTable,
          ),
      },
    ],
  },
  {
    path: 'forms',
    loadComponent: () => import('./features/forms/form-list/form-list').then((m) => m.FormList),
  },
  {
    path: 'rules',
    loadComponent: () => import('./features/rules/rule-list/rule-list').then((m) => m.RuleList),
  },
  {
    // Kept so existing links and habits do not hit a 404; both are now reached through 評估表一覽.
    path: 'articulation-processes',
    loadComponent: () =>
      import('./features/articulation/process-list/process-list').then((m) => m.ProcessList),
  },
];
