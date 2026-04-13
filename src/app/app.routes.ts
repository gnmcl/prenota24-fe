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
    path: 'invito/:token',
    loadComponent: () => import('./features/accept-invitation/accept-invitation.component').then(m => m.AcceptInvitationComponent),
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

  // Events
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

  // Clients
  {
    path: 'clienti',
    loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'clienti/nuovo',
    loadComponent: () => import('./features/clients/client-form.component').then(m => m.ClientFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'clienti/:id',
    loadComponent: () => import('./features/clients/client-detail.component').then(m => m.ClientDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'clienti/:id/modifica',
    loadComponent: () => import('./features/clients/client-form.component').then(m => m.ClientFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },

  // Professionals
  {
    path: 'professionisti',
    loadComponent: () => import('./features/professionals/professionals.component').then(m => m.ProfessionalsComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'professionisti/nuovo',
    loadComponent: () => import('./features/professionals/professional-form.component').then(m => m.ProfessionalFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'professionisti/:id',
    loadComponent: () => import('./features/professionals/professional-detail.component').then(m => m.ProfessionalDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'professionisti/:id/modifica',
    loadComponent: () => import('./features/professionals/professional-form.component').then(m => m.ProfessionalFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },

  // Appointments
  {
    path: 'appuntamenti',
    loadComponent: () => import('./features/appointments/appointments.component').then(m => m.AppointmentsComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'appuntamenti/nuovo',
    loadComponent: () => import('./features/appointments/appointment-form.component').then(m => m.AppointmentFormComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },
  {
    path: 'appuntamenti/:id',
    loadComponent: () => import('./features/appointments/appointment-detail.component').then(m => m.AppointmentDetailComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },

  // Service Types
  {
    path: 'servizi',
    loadComponent: () => import('./features/services/service-types.component').then(m => m.ServiceTypesComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN'] },
  },

  /* ── Protected routes (Professional) ───── */
  {
    path: 'agenda',
    loadComponent: () => import('./features/agenda/agenda.component').then(m => m.AgendaComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['ADMIN', 'PROFESSIONAL'] },
  },
  {
    path: 'pro/dashboard',
    loadComponent: () => import('./features/pro/professional-dashboard.component').then(m => m.ProfessionalDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['PROFESSIONAL'] },
  },
  {
    path: 'pro/appuntamenti',
    loadComponent: () => import('./features/pro/professional-appointments.component').then(m => m.ProfessionalAppointmentsComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['PROFESSIONAL'] },
  },
  {
    path: 'pro/clienti',
    loadComponent: () => import('./features/pro/professional-clients.component').then(m => m.ProfessionalClientsComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['PROFESSIONAL'] },
  },
  {
    path: 'pro/profilo',
    loadComponent: () => import('./features/pro/professional-profile.component').then(m => m.ProfessionalProfileComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['PROFESSIONAL'] },
  },
  {
    path: 'pro/disponibilita',
    loadComponent: () => import('./features/pro/professional-availability.component').then(m => m.ProfessionalAvailabilityComponent),
    canActivate: [authGuard, roleGuard],
    data: { allowed: ['PROFESSIONAL'] },
  },

  /* ── Redirects ─────────────────────────── */
  {
    path: '**',
    redirectTo: 'accedi',
  },
];
