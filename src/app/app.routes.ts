import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component'; // Importation du DashboardComponent

import { GesVaccinComponent } from './pages/ges-vaccin/ges-vaccin.component';
import { HistoryComponent } from './pages/history/history.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirection par défaut vers le login
    { path: 'login', component: LoginComponent }, // Route pour le login
    { path: 'dashboard', component: DashboardComponent },// Route pour le tableau de bord
  
    { path: 'ges-vaccin', component: GesVaccinComponent},
    { path: 'historique', component: HistoryComponent }, // Ajoute cette route
    { path: 'forgot-password', component: ForgotPasswordComponent},
    { path: 'reset-password', component: ResetPasswordComponent}
];

