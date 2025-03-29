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
  password: string = '';
  isGuestMode: boolean = false;

  constructor(private router: Router) {}

  onSubmit() {
    if (this.isGuestMode) {
      // Store guest mode in localStorage
      localStorage.setItem('isGuestMode', 'true');
      this.router.navigate(['/chatbot']);
      return;
    }

    // Here you would typically make an API call to authenticate
    // For demo purposes, we'll just check if email and password are provided
    if (this.email && this.password) {
      localStorage.setItem('isGuestMode', 'false');
      localStorage.setItem('userEmail', this.email);
      this.router.navigate(['/chatbot']);
    }
  }

  toggleGuestMode() {
    this.isGuestMode = !this.isGuestMode;
    if (this.isGuestMode) {
      this.email = '';
      this.password = '';
    }
  }
}
