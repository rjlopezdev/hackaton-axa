import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AIService } from "../../services/ai.service";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface SpecialistAppointment {
  name: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  selected: boolean;
}

@Component({
  selector: "app-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chatbot.component.html",
  styleUrls: ["./chatbot.component.css"],
})
export class ChatbotComponent implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild("messagesContainer") private messagesContainer!: ElementRef;
  
  // Propiedades de mensajes
  messages: Message[] = [];
  newMessage = "";
  isLoading = false;
  
  // Datos del usuario
  userEmail: string = "guest@example.com";
  isRegistered: boolean = false;
  userZipCode: string = "";
  
  // Datos para usuarios no registrados
  collectingUserData: boolean = false;
  waitingForAge: boolean = false;
  waitingForZipCode: boolean = false;
  waitingForProfession: boolean = false;
  
  // Estado de la conversación
  conversationEnded: boolean = false;
  recommendedSpecialty: string | null = null;
  
  // Citas con especialistas
  specialists: SpecialistAppointment[] = [];
  showingSpecialists: boolean = false;
  
  private shouldScroll = false;
  private subscription: Subscription = new Subscription();

  constructor(private aiService: AIService, private router: Router) {}

  ngOnInit(): void {
    // Cargar email del usuario desde localStorage
    const storedEmail = localStorage.getItem('userEmail');
    if (storedEmail) {
      this.userEmail = storedEmail;
      this.isRegistered = true;
      
      // Cargar datos del usuario registrado
      this.loadUserInfo(this.userEmail);
    }
    
    // Suscribirse a cambios en el estado de la conversación
    this.subscription.add(
      this.aiService.conversationState$.subscribe(state => {
        this.conversationEnded = state.ended;
        if (state.ended && state.specialty) {
          this.recommendedSpecialty = state.specialty;
          this.loadSpecialists(state.specialty);
        }
      })
    );
    
    // Mensaje inicial del bot
    this.messages.push({
      content:
        "¡Hola! Soy el asistente virtual de AXA para seguros de salud. ¿En qué puedo ayudarte hoy?",
      isUser: false,
      timestamp: new Date(),
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }
  
  ngOnDestroy(): void {
    // Cancelar todas las suscripciones al destruir el componente
    this.subscription.unsubscribe();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error("Error al hacer scroll:", err);
    }
  }
  
  private loadUserInfo(email: string): void {
    this.subscription.add(
      this.aiService.getUserInfo(email).subscribe({
        next: (info) => {
          this.isRegistered = info.isRegistered;
          if (info.isRegistered && info.zipCode) {
            this.userZipCode = info.zipCode;
          }
        },
        error: (error) => {
          console.error("Error al cargar información del usuario:", error);
        }
      })
    );
  }
  
  private loadSpecialists(specialty: string): void {
    // Solo cargar especialistas si tenemos código postal
    if (!this.userZipCode) {
      this.collectZipCodeForSpecialists();
      return;
    }
    
    this.subscription.add(
      this.aiService.getSpecialists(specialty, this.userZipCode).subscribe({
        next: (response) => {
          // Transformar la respuesta en nuestro formato
          this.specialists = response.specialists.map(specialist => ({
            name: specialist.Nombre,
            specialty: specialist.Especialidad,
            date: specialist.Dia_Cita,
            time: specialist.Hora_Cita,
            location: specialist.Dirección,
            selected: false
          }));
          
          if (this.specialists.length > 0) {
            this.showSpecialistOptions();
          } else {
            this.messages.push({
              content: "No se encontraron especialistas disponibles para esta especialidad en tu zona.",
              isUser: false,
              timestamp: new Date(),
            });
            this.shouldScroll = true;
          }
          
          // Mostrar mensaje si se usó médico general como alternativa
          if (response.fallbackToGeneral) {
            this.messages.push({
              content: "No encontré especialistas específicos, pero aquí tienes médicos de cabecera disponibles en tu zona:",
              isUser: false,
              timestamp: new Date(),
            });
            this.shouldScroll = true;
          }
        },
        error: (error) => {
          console.error("Error al cargar especialistas:", error);
          this.messages.push({
            content: "Lo siento, hubo un problema al buscar especialistas disponibles.",
            isUser: false,
            timestamp: new Date(),
          });
          this.shouldScroll = true;
        }
      })
    );
  }
  
  private collectZipCodeForSpecialists(): void {
    this.messages.push({
      content: "Para buscar especialistas cerca de ti, necesito tu código postal.",
      isUser: false,
      timestamp: new Date(),
    });
    this.waitingForZipCode = true;
    this.shouldScroll = true;
  }
  
  private showSpecialistOptions(): void {
    // Mostrar mensaje sobre especialistas disponibles
    this.messages.push({
      content: `He encontrado ${this.specialists.length} especialistas disponibles. Por favor, selecciona uno de los horarios disponibles:`,
      isUser: false,
      timestamp: new Date(),
    });
    
    // Activar la vista de selección de especialistas
    this.showingSpecialists = true;
    this.shouldScroll = true;
  }
  
  selectSpecialist(index: number): void {
    // Marcar el especialista seleccionado
    this.specialists.forEach((specialist, i) => {
      specialist.selected = (i === index);
    });
    
    const selected = this.specialists[index];
    
    // Añadir mensaje de confirmación
    this.messages.push({
      content: `He seleccionado una cita con ${selected.name} para el ${selected.date} a las ${selected.time} en ${selected.location}`,
      isUser: true,
      timestamp: new Date(),
    });
    
    // Respuesta del sistema
    this.messages.push({
      content: `¡Perfecto! Tu cita ha sido reservada con éxito:\n\n` +
               `Especialista: ${selected.name} (${selected.specialty})\n` +
               `Fecha: ${selected.date}\n` +
               `Hora: ${selected.time}\n` +
               `Lugar: ${selected.location}\n\n` +
               `Recibirás un correo de confirmación con los detalles. ¿Necesitas algo más?`,
      isUser: false,
      timestamp: new Date(),
    });
    
    // Ocultar la selección de especialistas
    this.showingSpecialists = false;
    this.shouldScroll = true;
  }
  
  resetChat(): void {
    // Reiniciar el estado del chat
    this.aiService.resetConversation();
    this.messages = [{
      content: "¡Hola de nuevo! ¿En qué puedo ayudarte hoy?",
      isUser: false,
      timestamp: new Date(),
    }];
    this.conversationEnded = false;
    this.recommendedSpecialty = null;
    this.specialists = [];
    this.showingSpecialists = false;
    this.collectingUserData = false;
    this.waitingForAge = false;
    this.waitingForZipCode = false;
    this.waitingForProfession = false;
    this.shouldScroll = true;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const messageContent = this.newMessage;
    this.newMessage = ""; // Limpiar input inmediatamente

    // Procesar datos de usuario no registrado si estamos en ese flujo
    if (!this.isRegistered && this.collectingUserData) {
      this.processUserDataInput(messageContent);
      return;
    }
    
    // Procesar código postal para especialistas si lo estamos esperando
    if (this.waitingForZipCode && this.recommendedSpecialty) {
      this.processZipCodeInput(messageContent);
      return;
    }

    // Añadir mensaje del usuario a la conversación
    this.messages.push({
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    });
    this.shouldScroll = true;

    // Si no estamos recolectando datos, enviar mensaje al backend
    this.isLoading = true;
    
    // Si es la primera interacción con usuario no registrado, iniciar recolección de datos
    if (!this.isRegistered && this.messages.length === 2) {
      this.startCollectingUserData();
      this.isLoading = false;
      return;
    }

    this.aiService.sendMessage(this.userEmail, messageContent).subscribe({
      next: (response) => {
        // Añadir respuesta del bot
        this.messages.push({
          content: response.response,
          isUser: false,
          timestamp: new Date(),
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
      error: (error) => {
        console.error("Error getting AI response:", error);
        this.messages.push({
          content:
            "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo.",
          isUser: false,
          timestamp: new Date(),
        });
        this.isLoading = false;
        this.shouldScroll = true;
      },
    });
  }
  
  private startCollectingUserData(): void {
    this.collectingUserData = true;
    this.waitingForAge = true;
    
    this.messages.push({
      content: "Para poder ayudarte mejor, necesito algunos datos. ¿Podrías indicarme tu edad?",
      isUser: false,
      timestamp: new Date(),
    });
    this.shouldScroll = true;
  }
  
  private processUserDataInput(input: string): void {
    // Añadir mensaje del usuario
    this.messages.push({
      content: input,
      isUser: true,
      timestamp: new Date(),
    });
    this.shouldScroll = true; 