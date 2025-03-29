import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Componentes
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomePageComponent } from './features/home/home-page/home-page.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { InsuranceListComponent } from './features/insurance/insurance-list/insurance-list.component';
import { InsuranceDetailComponent } from './features/insurance/insurance-detail/insurance-detail.component';
import { ChatWidgetComponent } from './features/chatbot/chat-widget/chat-widget.component';

// Interceptores
import { TokenInterceptor } from './core/interceptors/token.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HomePageComponent,
    DashboardComponent,
    InsuranceListComponent,
    InsuranceDetailComponent,
    ChatWidgetComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }