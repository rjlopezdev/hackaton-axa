import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Auth guard como función
const authGuard = () => {
  const isGuestMode = localStorage.getItem('isGuestMode') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const isAuthenticated = isGuestMode || userEmail !== null;
  
  console.log('Auth Guard - isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    // Si no hay autenticación, redirigir a login
    return { path: '/login' };
  }
  
  return isAuthenticated;
};

export const appRoutes: Routes = [
  // Ruta raíz redirecciona basado en autenticación
  {
    path: "",
    redirectTo: "/dashboard",
    pathMatch: "full",
  },

  // Ruta de login - siempre accesible
  {
    path: "login",
    component: LoginComponent,
  },

  // Ruta del chatbot - protegida
  {
    path: "chatbot",
    component: ChatbotComponent,
    canActivate: [authGuard],
  },

  // Ruta del dashboard - protegida
  {
    path: "dashboard",
    component: DashboardComponent,
    canActivate: [authGuard],
  },
];