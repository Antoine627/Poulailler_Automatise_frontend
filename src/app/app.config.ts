import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),  // Fournisseur de routage
    provideHttpClient(withFetch()),  // Fournisseur HTTP
    provideClientHydration(withEventReplay()),
    FormsModule,  // Gestion des formulaires
  ]
};