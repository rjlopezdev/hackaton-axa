import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'axa';

  constructor(private router: Router) {}

  ngOnInit() {
    // Verificar el estado de autenticación al iniciar la aplicación
    const isAuthenticated = localStorage.getItem('userEmail') !== null || 
                           localStorage.getItem('isGuestMode') === 'true';
    
    if (isAuthenticated) {
      // Si está autenticado, redirigir al dashboard
      this.router.navigate(['/dashboard']);
    } else {
      // Si no está autenticado, redirigir al login
      this.router.navigate(['/login']);
    }
  }
}