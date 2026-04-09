import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  /* ── Public routes ─────────────────────── */
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'accedi',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'login',
    redirectTo: 'accedi',
    pathMatch: 'full',
  },
  {
    path: 'registrati',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'e/:slug',
    loadComponent: () => import('./features/public-event/public-event.component').then(m => m.PublicEventComponent),
  },

  /* ── Protected routes (Admin) ──────────── */
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'eventi',
    loadComponent: () => import('./features/my-events/my-events.component').then(m => m.MyEventsComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'eventi/nuovo',
    loadComponent: () => import('./features/create-event/create-event.component').then(m => m.CreateEventComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'eventi/:id',
    loadComponent: () => import('./features/event-dashboard/event-dashboard.component').then(m => m.EventDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },

  /* ── Protected routes (Professional) ───── */
  {
    path: 'agenda',
    loadComponent: () => import('./features/agenda/agenda.component').then(m => m.AgendaComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['PROFESSIONAL'] },
  },

  /* ── Redirects ─────────────────────────── */
  {
    path: '**',
    redirectTo: 'accedi',
  },
];
