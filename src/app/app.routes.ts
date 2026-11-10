import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'forms',
        loadComponent: () => import('./pages/home.page').then((m) => m.HomePage),
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./pages/records.page').then((m) => m.RecordsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings.page').then((m) => m.SettingsPage),
      },
      { path: '', redirectTo: 'forms', pathMatch: 'full' },
    ],
  },
  {
    path: 'fill/:id',
    loadComponent: () => import('./pages/fill.page').then((m) => m.FillPage),
  },
  {
    path: 'editor/:id',
    loadComponent: () =>
      import('./pages/editor.page').then((m) => m.EditorPage),
  },
  { path: '**', redirectTo: '' },
];
