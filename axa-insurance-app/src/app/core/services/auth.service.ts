import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from 'src/environments/environment';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {
    // Inicializar con el usuario del localStorage si existe
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    // Verificar si existe token y si no está expirado
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    // En un entorno real, este sería un endpoint de API
    // Para demo/hackathon, usamos una respuesta simulada
    
    // SOLO PARA DEMO - en producción, usar la API real
    if (credentials.email === 'demo@axa.com' && credentials.password === 'password') {
      const mockResponse: AuthResponse = {
        accessToken: 'mock-jwt-token',
        user: {
          id: '1',
          email: credentials.email,
          name: 'Usuario Demo',
          role: 'client'
        }
      };
      
      this.storeAuthData(mockResponse);
      return of(mockResponse);
    }
    
    // En producción, usar este código
    /*
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Error en la autenticación:', error);
          return throwError(() => error);
        })
      );
    */
    
    // Código para demo que simula error de credenciales
    return throwError(() => ({
      status: 401,
      message: 'Credenciales incorrectas'
    }));
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Error en el registro:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    // Eliminar datos de usuario del almacenamiento local
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    // Actualizar el BehaviorSubject
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh-token`, {})
      .pipe(
        tap(response => this.storeAuthData(response)),
        catchError(error => {
          console.error('Error al refrescar token:', error);
          // Si falla el refresh, cerrar sesión
          this.logout();
          return throwError(() => error);
        })
      );
  }

  private storeAuthData(response: AuthResponse): void {
    // Guardar token en localStorage
    localStorage.setItem('access_token', response.accessToken);
    // Guardar datos del usuario
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    // Actualizar el BehaviorSubject
    this.currentUserSubject.next(response.user);
  }
}