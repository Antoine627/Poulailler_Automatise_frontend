import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FeedingManagementComponent } from './components/feeding-management/feeding-management.component';
import { StockManagementComponent } from './components/stock-management/stock-management.component';
import { StockDetailDialogComponent } from './components/stock-detail-dialog/stock-detail-dialog.component';
// import { LoginComponent } from './components/login/login.component';
import { LoginComponent } from './pages/login/login.component';


export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'alimentation', component: FeedingManagementComponent },
  { path: 'stocks', component: StockManagementComponent},
  { path: 'stocks/details', component: StockDetailDialogComponent },
  // { path: 'login', component: LoginComponent },
  { path: 'login', component: LoginComponent }, // Route pour le login
  { path: '**', redirectTo: '' } // Cette route doit être en dernier
];
// import { Routes } from '@angular/router';
// import { LoginComponent } from './pages/login/login.component';
// import { VaccinComponent } from './pages/vaccin/vaccin.component';

// export const routes: Routes = [
//     { path: '', redirectTo: '/login', pathMatch: 'full' }, // Redirection par défaut vers le login
//     { path: 'login', component: LoginComponent }, // Route pour le login
//     { path: 'dashboard', component: DashboardComponent },// Route pour le tableau de bord
//     { path: 'vaccin', component: VaccinComponent}
// ];

