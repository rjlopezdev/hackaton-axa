import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';

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
];
