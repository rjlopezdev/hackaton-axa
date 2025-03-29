import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

interface AIResponse {
  email: string;
  prompt: string;
  response: string;
}

@Injectable({
  providedIn: "root",
})
export class AIService {
  private apiUrl = "http://localhost:8080/ai-assistant";

  constructor(private http: HttpClient) {}

  sendMessage(email: string, prompt: string): Observable<AIResponse> {
    return this.http.post<AIResponse>(this.apiUrl, { email, prompt });
  }
}
