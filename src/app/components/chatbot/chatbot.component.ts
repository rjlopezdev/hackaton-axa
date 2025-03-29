import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent {
  messages: Message[] = [];
  newMessage: string = '';
  isLoading: boolean = false;

  sendMessage() {
    if (!this.newMessage.trim()) return;

    // Add user message
    this.messages.push({
      content: this.newMessage,
      isUser: true,
      timestamp: new Date(),
    });

    // Simulate bot response
    this.isLoading = true;
    setTimeout(() => {
      this.messages.push({
        content:
          'This is a simulated response. In a real implementation, this would be connected to an AI service.',
        isUser: false,
        timestamp: new Date(),
      });
      this.isLoading = false;
    }, 1000);

    this.newMessage = '';
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
