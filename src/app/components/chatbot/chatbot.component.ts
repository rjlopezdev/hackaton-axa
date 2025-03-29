import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AIService } from "../../services/ai.service";

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: "app-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chatbot.component.html",
  styleUrls: ["./chatbot.component.css"],
})
export class ChatbotComponent implements AfterViewChecked, OnInit {
  @ViewChild("messagesContainer") private messagesContainer!: ElementRef;
  messages: Message[] = [];
  newMessage = "";
  isLoading = false;
  private shouldScroll = false;
  
  // Variables para recopilar información de usuario no registrado
  isGatheringUserInfo = false;
  userAge: string = '';
  userZipCode: string = '';
  userProfession: string = '';
  infoStep: number = 0;

  constructor(private aiService: AIService) {}

  ngOnInit() {
    // Iniciar chatbot con mensaje de bienvenida
    setTimeout(() => {
      this.addBotMessage("¡Hola! Soy el asistente virtual de AXA. ¿En qué puedo ayudarte hoy?");
    }, 500);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  addBotMessage(content: string): void {
    this.messages.push({
      content: content,
      isUser: false,
      timestamp: new Date(),
    });
    this.shouldScroll = true;
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const messageContent = this.newMessage;
    this.newMessage = ""; // Limpiar input inmediatamente

    // Añadir mensaje del usuario a la conversación
    this.messages.push({
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    });
    this.shouldScroll = true;

    // Verificar si estamos recopilando información del usuario
    if (this.isGatheringUserInfo) {
      this.handleUserInfoCollection(messageContent);
      return;
    }

    // Procesar el mensaje normal
    this.processUserMessage(messageContent);
  }

  private processUserMessage(messageContent: string) {
    // Verificar si es usuario invitado
    const userEmail = localStorage.getItem("userEmail") || "guest@example.com";
    const isGuest = userEmail === "guest@example.com";

    // Si es invitado y es el primer mensaje, iniciar recopilación de información
    if (isGuest && this.messages.length <= 3) {
      this.isGatheringUserInfo = true;
      this.infoStep = 1;
      setTimeout(() => {
        this.addBotMessage("Para poder ayudarte mejor, necesito algo de información. ¿Podrías indicarme tu edad, por favor?");
      }, 800);
      return;
    }

    // Enviar mensaje al backend
    this.isLoading = true;
    this.aiService.sendMessage(userEmail, messageContent).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.addBotMessage(response.response);
      },
      error: (error) => {
        this.isLoading = false;
        console.error("Error getting AI response:", error);
        this.addBotMessage(
          "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo."
        );
      },
    });
  }

  private handleUserInfoCollection(message: string) {
    switch (this.infoStep) {
      case 1: // Edad
        this.userAge = message.trim();
        this.infoStep = 2;
        setTimeout(() => {
          this.addBotMessage("Gracias. ¿Podrías indicarme tu código postal?");
        }, 800);
        break;
      
      case 2: // Código postal
        this.userZipCode = message.trim();
        this.infoStep = 3;
        setTimeout(() => {
          this.addBotMessage("Perfecto. Por último, ¿cuál es tu profesión?");
        }, 800);
        break;
      
      case 3: // Profesión
        this.userProfession = message.trim();
        this.isGatheringUserInfo = false;
        this.infoStep = 0;
        
        // Guardar información en localStorage
        localStorage.setItem('userAge', this.userAge);
        localStorage.setItem('userZipCode', this.userZipCode);
        localStorage.setItem('userProfession', this.userProfession);
        
        setTimeout(() => {
          this.addBotMessage("¡Gracias por la información! Ahora puedo ayudarte mejor. ¿En qué puedo asistirte hoy?");
        }, 800);
        break;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}