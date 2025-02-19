import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FeedingManagementComponent } from './components/feeding-management/feeding-management.component';
import { StockManagementComponent } from './components/stock-management/stock-management.component';
import { StockDetailDialogComponent } from './components/stock-detail-dialog/stock-detail-dialog.component';
import { LoginComponent } from './components/login/login.component';


export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'alimentation', component: FeedingManagementComponent },
  { path: 'stocks', component: StockManagementComponent},
  { path: 'stocks/details', component: StockDetailDialogComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' } // Cette route doit être en dernier
];
