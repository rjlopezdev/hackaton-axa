import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatbotComponent } from '../chatbot/chatbot.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChatbotComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userEmail: string | null = null;
  isGuestMode: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    this.userEmail = localStorage.getItem('userEmail');
    this.isGuestMode = localStorage.getItem('isGuestMode') === 'true';
    
    // Si no hay autenticación, redirigir al login
    if (!this.userEmail && !this.isGuestMode) {
      this.router.navigate(['/login']);
    }
  }

  logout(): void {
    // Limpiar datos de sesión
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isGuestMode');
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }
}