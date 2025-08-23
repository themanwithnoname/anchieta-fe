import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  },
  { 
    path: 'home', 
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Início - Anchieta'
  },
  { 
    path: 'about', 
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent),
    title: 'Sobre - Anchieta'
  },
  { 
    path: 'processos', 
    loadComponent: () => import('./pages/processos/processos.component').then(m => m.ProcessosComponent),
    title: 'Processos - Anchieta'
  },
  {
    path: '**',
    redirectTo: '/home'
  }
];
