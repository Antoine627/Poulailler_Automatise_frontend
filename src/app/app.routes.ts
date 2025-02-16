import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component'; // Importation du DashboardComponent

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirection par défaut vers le login
    { path: 'login', component: LoginComponent }, // Route pour le login
    { path: 'dashboard', component: DashboardComponent } // Route pour le tableau de bord
];

