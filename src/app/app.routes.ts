import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const appRoutes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'chatbot',
    component: ChatbotComponent,
    canActivate: [
      () => {
        const isGuestMode = localStorage.getItem('isGuestMode') === 'true';
        const userEmail = localStorage.getItem('userEmail');
        return isGuestMode || userEmail !== null;
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [
      () => {
        const isGuestMode = localStorage.getItem('isGuestMode') === 'true';
        const userEmail = localStorage.getItem('userEmail');
        return isGuestMode || userEmail !== null;
      },
    ],
  },
];