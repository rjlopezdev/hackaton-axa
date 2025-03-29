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

  constructor(private router: Router) {}

  onSubmit() {
    // Aquí normalmente harías una validación y llamada a API
    // Para esta demo, solo verificamos que el email esté presente
    if (this.email) {
      localStorage.setItem('isGuestMode', 'false');
      localStorage.setItem('userEmail', this.email);
      this.router.navigate(['/chatbot']);
    }
  }

  loginAsGuest() {
    // Almacenar el modo invitado en localStorage
    localStorage.setItem('isGuestMode', 'true');
    localStorage.removeItem('userEmail'); // Eliminamos cualquier email almacenado previamente
    this.router.navigate(['/chatbot']);
  }
}