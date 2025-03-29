import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }

  // Método para procesar mensajes del usuario
  processMessage(message: string, isAuthenticated: boolean): Observable<string> {
    // En un entorno real, este sería un endpoint de API a un servicio de chatbot
    // Para demo/hackathon, usamos respuestas simuladas
    
    // SOLO PARA DEMO - en producción, usar la API real
    return this.simulateResponse(message, isAuthenticated);
    
    // En producción, usar este código
    /*
    return this.http.post<{response: string}>(`${environment.apiUrl}/chatbot/message`, { 
      message, 
      isAuthenticated 
    })
    .pipe(
      map(response => response.response),
      catchError(error => {
        console.error('Error procesando mensaje en chatbot:', error);
        return of('Lo siento, ha ocurrido un error al procesar tu solicitud.');
      })
    );
    */
  }
  
  // Simulación de respuestas para fines de demostración
  private simulateResponse(message: string, isAuthenticated: boolean): Observable<string> {
    // Convertir mensaje a minúsculas para facilitar la comparación
    const lowerMsg = message.toLowerCase();
    let response = '';
    
    // Respuestas diferentes para clientes vs visitantes
    if (isAuthenticated) {
      // Respuestas para clientes autenticados
      if (lowerMsg.includes('póliza') || lowerMsg.includes('poliza')) {
        response = 'Puedes revisar tu póliza ingresando a la sección "Mis Pólizas" en el dashboard. Allí encontrarás todos los detalles y podrás descargarla en formato PDF.';
      }
      else if (lowerMsg.includes('siniestro') || lowerMsg.includes('accidente')) {
        response = 'Para reportar un siniestro, por favor ve a la sección "Reportar Siniestro" en tu dashboard. Necesitarás proporcionar detalles del incidente y adjuntar fotografías si es posible. También puedes llamar a nuestra línea de emergencia 24/7 al 800-123-4567.';
      }
      else if (lowerMsg.includes('actualizar') || lowerMsg.includes('datos')) {
        response = 'Puedes actualizar tu información personal en la sección "Mi Perfil". Recuerda que es importante mantener tus datos actualizados para garantizar una comunicación efectiva.';
      }
      else if (lowerMsg.includes('pago') || lowerMsg.includes('factura')) {
        response = 'Tienes 2 pagos pendientes. Tu próximo pago vence el 15 de abril. Puedes realizar tu pago en línea a través de la sección "Mis Pagos" en el dashboard.';
      }
      else {
        response = 'Como cliente AXA, ofrecemos atención personalizada para tus seguros. ¿Puedo ayudarte con información sobre tus pólizas, reportar un siniestro, actualizar tus datos o revisar el estado de tus pagos?';
      }
    } else {
      // Respuestas para visitantes no autenticados
      if (lowerMsg.includes('seguro') || lowerMsg.includes('ofrecen')) {
        response = 'En AXA ofrecemos una amplia gama de seguros: Automóvil, Hogar, Vida, Salud y Seguros para Empresas. ¿Sobre cuál te gustaría obtener más información?';
      }
      else if (lowerMsg.includes('cotización') || lowerMsg.includes('cotizar') || lowerMsg.includes('precio')) {
        response = 'Para obtener una cotización personalizada, puedes usar nuestra herramienta de cotización en línea o registrarte para que un asesor te contacte. ¿Te gustaría que te guíe en el proceso?';
      }
      else if (lowerMsg.includes('horario') || lowerMsg.includes('atención')) {
        response = 'Nuestro horario de atención telefónica es de lunes a viernes de 8:00 AM a 8:00 PM y sábados de 9:00 AM a 2:00 PM. Nuestras oficinas físicas atienden de 9:00 AM a 5:00 PM en días laborables.';
      }
      else if (lowerMsg.includes('oficina') || lowerMsg.includes('ubicación')) {
        response = 'Contamos con oficinas en las principales ciudades del país. Para encontrar la más cercana a ti, puedes visitar la sección "Oficinas" en nuestro sitio web o compartirme tu ubicación actual.';
      }
      else {
        response = 'Bienvenido a AXA. ¿Cómo puedo ayudarte hoy? Puedo ofrecerte información sobre nuestros seguros, cotizaciones, horarios de atención o ubicación de nuestras oficinas.';
      }
    }
    
    // Simular tiempo de respuesta del servidor
    return of(response).pipe(delay(1500));
  }
}