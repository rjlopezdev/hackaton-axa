import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss']
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatBody') chatBody!: ElementRef;
  
  isExpanded = false;
  chatForm!: FormGroup;
  messages: ChatMessage[] = [];
  isTyping = false;
  isAuthenticated = false;
  userName = '';

  // Sugerencias diferentes para usuarios autenticados y no autenticados
  clientSuggestions = [
    '¿Cómo revisar mi póliza?',
    'Reportar un siniestro',
    'Actualizar mis datos',
    'Ver mis pagos pendientes'
  ];
  
  visitorSuggestions = [
    '¿Qué seguros ofrecen?',
    'Quiero una cotización',
    'Horarios de atención',
    'Ubicación de oficinas'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private chatService: ChatService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkAuthentication();
    
    // Suscribirse a cambios de autenticación
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.isAuthenticated = true;
        this.userName = user.name;
      } else {
        this.isAuthenticated = false;
        this.userName = '';
      }
    });
  }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  
  initForm(): void {
    this.chatForm = this.formBuilder.group({
      message: ['', [Validators.required]]
    });
  }
  
  checkAuthentication(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.userName = currentUser.name;
    }
  }
  
  toggleChat(): void {
    this.isExpanded = !this.isExpanded;
    
    // Si es la primera vez que se abre el chat, no necesitamos hacer nada
    // El mensaje de bienvenida ya está definido en el HTML
  }
  
  sendMessage(): void {
    if (this.chatForm.invalid) {
      return;
    }
    
    const userMessage = this.chatForm.get('message')?.value;
    
    // Agregar mensaje del usuario
    this.messages.push({
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    });
    
    // Resetear formulario
    this.chatForm.reset();
    
    // Mostrar indicador de escritura
    this.isTyping = true;
    
    // Enviar mensaje al servicio para procesamiento
    this.chatService.processMessage(userMessage, this.isAuthenticated).subscribe({
      next: (response) => {
        // Esperar un tiempo para simular que el bot está escribiendo
        setTimeout(() => {
          this.isTyping = false;
          this.messages.push({
            text: response,
            sender: 'bot',
            timestamp: new Date()
          });
        }, 1000);
      },
      error: (error) => {
        this.isTyping = false;
        console.error('Error procesando mensaje:', error);
        this.messages.push({
          text: 'Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.',
          sender: 'bot',
          timestamp: new Date()
        });
      }
    });
  }
  
  useQuickSuggestion(suggestion: string): void {
    // Establecer la sugerencia como el mensaje actual
    this.chatForm.get('message')?.setValue(suggestion);
    // Enviar el mensaje
    this.sendMessage();
  }
  
  getSuggestions(): string[] {
    return this.isAuthenticated ? this.clientSuggestions : this.visitorSuggestions;
  }
  
  private scrollToBottom(): void {
    try {
      this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
    } catch(err) { }
  }
}