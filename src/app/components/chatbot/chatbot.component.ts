import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit,
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

  constructor(private aiService: AIService) {}
  ngOnInit(): void {
    this.messages.push({
      content:
        "¡Hola! Soy el asistente virtual de AXA. ¿En qué puedo ayudarte hoy?",
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

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
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

    // Enviar mensaje al backend
    const userEmail = localStorage.getItem("userEmail") || "guest@example.com";
    this.isLoading = true;

    this.aiService.sendMessage(userEmail, messageContent).subscribe({
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

  onKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}