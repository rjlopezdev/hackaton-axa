import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';

  constructor(private router: Router) {
    // Limpiar cualquier estado previo de autenticación al llegar a la página de login
    localStorage.removeItem('isGuestMode');
    localStorage.removeItem('userEmail');
  }

  onSubmit() {
    // Validar que se ha ingresado un email
    if (this.email.trim()) {
      console.log('Iniciando sesión con email:', this.email);
      
      // Guardar datos de autenticación
      localStorage.setItem('isGuestMode', 'false');
      localStorage.setItem('userEmail', this.email);
      
      console.log("Redirigiendo a dashboard...");
      this.router.navigateByUrl("/dashboard");
    }
  }

  loginAsGuest() {
    console.log('Iniciando sesión como invitado');
    
    // Configurar modo invitado
    localStorage.setItem('isGuestMode', 'true');
    localStorage.removeItem('userEmail');
    
    this.router.navigateByUrl("/chatbot");
  }
}