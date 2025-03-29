import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomePageComponent } from './features/home/home-page/home-page.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { InsuranceListComponent } from './features/insurance/insurance-list/insurance-list.component';
import { InsuranceDetailComponent } from './features/insurance/insurance-detail/insurance-detail.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'insurance', 
    component: InsuranceListComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'insurance/:id', 
    component: InsuranceDetailComponent, 
    canActivate: [AuthGuard] 
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }