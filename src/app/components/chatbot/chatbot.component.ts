import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class ChatbotComponent {
  messages: Message[] = [];
  newMessage = "";
  isLoading = false;

  constructor(private aiService: AIService) {}

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const userEmail = localStorage.getItem("userEmail") || "guest@example.com";
    const messageContent = this.newMessage;

    // Add user message
    this.messages.push({
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    });

    // Get AI response
    this.isLoading = true;
    this.aiService.sendMessage(userEmail, messageContent).subscribe({
      next: (response) => {
        this.messages.push({
          content: response.response,
          isUser: false,
          timestamp: new Date(),
        });
        this.isLoading = false;
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
      },
    });

    this.newMessage = "";
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
