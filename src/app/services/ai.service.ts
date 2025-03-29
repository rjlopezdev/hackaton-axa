import { Injectable } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, retry } from "rxjs/operators";

interface AIResponse {
  email: string;
  prompt: string;
  response: string;
  isRegistered?: boolean;
}

@Injectable({
  providedIn: "root",
})
export class AIService {
  private apiUrl = "http://localhost:8080/ai-assistant";

  constructor(private http: HttpClient) {}

  sendMessage(email: string, prompt: string): Observable<AIResponse> {
    // Si es modo invitado y tenemos información del usuario, prepararla
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

    return this.http.post<AIResponse>(this.apiUrl, payload)
      .pipe(
        retry(1), // Reintentar la solicitud una vez si falla
        catchError(this.handleError)
      );
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