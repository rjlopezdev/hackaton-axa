import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse, HttpParams } from "@angular/common/http";
import { Observable, throwError, BehaviorSubject } from "rxjs";
import { catchError, retry, tap } from "rxjs/operators";

export interface AIResponse {
  email: string;
  prompt: string;
  response: string;
  isRegistered?: boolean;
  conversationEnded?: boolean;
  specialty?: string;
}

export interface UserInfo {
  isRegistered: boolean;
  name?: string;
  age?: number;
  zipCode?: string;
  profession?: string;
  insuranceTypes?: string[];
  policies?: string[];
}

export interface Specialist {
  CP: number;
  Nombre: string;
  Especialidad: string;
  Qos: number;
  Dia_Cita: string;
  Hora_Cita: string;
  Dirección: string;
}

export interface SpecialistResponse {
  specialists: Specialist[];
  fallbackToGeneral: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AIService {
  private apiUrl = "http://localhost:8080";
  private messageHistory: { role: 'user' | 'assistant', content: string }[] = [];
  
  // Subject para manejar el estado de la conversación
  private conversationStateSubject = new BehaviorSubject<{
    ended: boolean;
    specialty?: string;
  }>({ ended: false });
  
  // Observable público para el estado de la conversación
  public conversationState$ = this.conversationStateSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la información del usuario
   */
  getUserInfo(email: string): Observable<UserInfo> {
    const params = new HttpParams().set('email', email);
    
    return this.http.get<UserInfo>(`${this.apiUrl}/api/user-info`, { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los especialistas disponibles para una especialidad y código postal
   */
  getSpecialists(specialty: string, zipCode: string): Observable<SpecialistResponse> {
    const params = new HttpParams()
      .set('especialidad', specialty)
      .set('cp', zipCode);
    
    return this.http.get<SpecialistResponse>(`${this.apiUrl}/api/specialists`, { params })
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  /**
   * Envía un mensaje al asistente virtual
   */
  sendMessage(email: string, prompt: string): Observable<AIResponse> {
    // Añadir el mensaje del usuario al historial
    this.messageHistory.push({ role: 'user', content: prompt });
    
    // Preparar los datos adicionales del usuario para el modo invitado
    let userInfo = {};
    if (email === "guest@example.com") {
      // Recuperar información almacenada
      const userAge = localStorage.getItem('userAge');
      const userZipCode = localStorage.getItem('userZipCode');
      const userProfession = localStorage.getItem('userProfession');
      
      // Añadir a la solicitud si está disponible
      if (userAge && userZipCode && userProfession) {
        userInfo = {
          age: userAge,
          zipCode: userZipCode,
          profession: userProfession
        };
      }
    }

    // Crear payload
    const payload = { 
      email, 
      prompt,
      ...userInfo
    };

    return this.http.post<AIResponse>(`${this.apiUrl}/ai-assistant`, payload)
      .pipe(
        retry(1),
        tap(response => {
          // Añadir la respuesta al historial
          this.messageHistory.push({ role: 'assistant', content: response.response });
          
          // Actualizar el estado de la conversación
          if (response.conversationEnded) {
            this.conversationStateSubject.next({
              ended: true,
              specialty: response.specialty
            });
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Reinicia la conversación y su estado
   */
  resetConversation(): void {
    this.messageHistory = [];
    this.conversationStateSubject.next({ ended: false });
  }

  /**
   * Obtiene el historial de mensajes actual
   */
  getMessageHistory(): { role: 'user' | 'assistant', content: string }[] {
    return [...this.messageHistory];
  }

  /**
   * Guarda información de usuario no registrado
   */
  saveGuestUserInfo(age: string, zipCode: string, profession: string): void {
    localStorage.setItem('userAge', age);
    localStorage.setItem('userZipCode', zipCode);
    localStorage.setItem('userProfession', profession);
  }

  /**
   * Borra la información del usuario no registrado
   */
  clearGuestUserInfo(): void {
    localStorage.removeItem('userAge');
    localStorage.removeItem('userZipCode');
    localStorage.removeItem('userProfession');
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = `Código: ${error.status}, Mensaje: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}