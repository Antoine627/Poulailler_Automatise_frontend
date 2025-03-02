import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; // Importez HttpHeaders
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service'; // Importez AuthService pour récupérer le token


export interface LightSchedule {
  startTime: string;
  endTime: string;
  enabled: boolean;
  // intensity?: number; // Facultatif, si vous utilisez l'intensité
  activeDays?: string[]; // Ajout des jours actifs
}


@Injectable({
  providedIn: 'root',
})
export class EnvironmentalService {
  private apiUrl = 'http://localhost:3000/api/environmental'; // Remplacez par l'URL de votre API

  constructor(private http: HttpClient, private authService: AuthService) {} // Injectez AuthService

  // --------------------------
  // Méthodes pour les données environnementales
  // --------------------------

  /**
   * Collecte et stocke les données environnementales.
   * @param location - L'emplacement des données.
   * @param notes - Les notes supplémentaires.
   * @returns Observable<any> - La réponse du serveur.
   */
  collectAndStoreEnvironmentalData(location: string, notes: string): Observable<any> {
    const body = { location, notes };
    return this.http.post<any>(`${this.apiUrl}/collect`, body, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('collectAndStoreEnvironmentalData'))
    );
  }

  /**
   * Récupère les données environnementales avec des filtres avancés.
   * @param startDate - La date de début (optionnelle).
   * @param endDate - La date de fin (optionnelle).
   * @param limit - Le nombre maximum de résultats (par défaut 100).
   * @param parameter - Le paramètre à filtrer (optionnel).
   * @param minValue - La valeur minimale (optionnelle).
   * @param maxValue - La valeur maximale (optionnelle).
   * @param location - L'emplacement (optionnel).
   * @returns Observable<any[]> - Les données environnementales.
   */
  getEnvironmentalData(startDate?: string, endDate?: string, limit: number = 100, parameter?: string, minValue?: number, maxValue?: number, location?: string): Observable<any[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }
    if (parameter && (minValue || maxValue)) {
      params = params.set('parameter', parameter);
      if (minValue) params = params.set('minValue', minValue.toString());
      if (maxValue) params = params.set('maxValue', maxValue.toString());
    }
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get<any[]>(`${this.apiUrl}/data`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getEnvironmentalData', []))
    );
  }

  /**
   * Récupère les statistiques environnementales.
   * @param startDate - La date de début (optionnelle).
   * @param endDate - La date de fin (optionnelle).
   * @param location - L'emplacement (optionnel).
   * @returns Observable<any> - Les statistiques environnementales.
   */
  getEnvironmentalStats(startDate?: string, endDate?: string, location?: string): Observable<any> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get<any>(`${this.apiUrl}/stats`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('getEnvironmentalStats'))
    );
  }

  /**
   * Récupère les alertes actives.
   * @param severity - La sévérité de l'alerte (optionnelle).
   * @param type - Le type d'alerte (optionnel).
   * @returns Observable<any[]> - Les alertes actives.
   */
  getActiveAlerts(severity?: string, type?: string): Observable<any[]> {
    let params = new HttpParams();
    if (severity) {
      params = params.set('severity', severity);
    }
    if (type) {
      params = params.set('type', type);
    }
    return this.http.get<any[]>(`${this.apiUrl}/alerts`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getActiveAlerts', []))
    );
  }

  /**
   * Analyse les tendances des données environnementales.
   * @param parameter - Le paramètre à analyser.
   * @param interval - L'intervalle de temps (par défaut 'hour').
   * @param location - L'emplacement (optionnel).
   * @returns Observable<any[]> - Les tendances environnementales.
   */
  getEnvironmentalTrends(parameter: string, interval: string = 'hour', location?: string): Observable<any[]> {
    let params = new HttpParams().set('parameter', parameter).set('interval', interval);
    if (location) {
      params = params.set('location', location);
    }
    return this.http.get<any[]>(`${this.apiUrl}/trends`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getEnvironmentalTrends', []))
    );
  }

  /**
   * Contrôle automatique des équipements basé sur les données environnementales.
   * @param location - L'emplacement (optionnel).
   * @returns Observable<any> - La réponse du serveur.
   */
  autoAdjustEnvironment(location?: string): Observable<any> {
    let params = new HttpParams();
    if (location) {
      params = params.set('location', location);
    }
    return this.http.post<any>(`${this.apiUrl}/adjust`, {}, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('autoAdjustEnvironment'))
    );
  }

  /**
   * Programme la collecte périodique des données depuis les capteurs.
   * @param interval - L'intervalle de collecte.
   * @returns Observable<any> - La réponse du serveur.
   */
  scheduleSensorCollection(interval: number): Observable<any> {
    const body = { interval };
    return this.http.post<any>(`${this.apiUrl}/schedule`, body, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('scheduleSensorCollection'))
    );
  }


  /**
 * Programme l'allumage automatique de la lampe entre deux horaires.
 * @param startTime - L'heure de début (format HH:MM).
 * @param endTime - L'heure de fin (format HH:MM).
 * @param enabled - Si la programmation est activée (optionnel, par défaut true).
 * @returns Observable<any> - La réponse du serveur.
 */
scheduleLightingControl(
  startTime: string,
  endTime: string,
  enabled: boolean = true
): Observable<any> {
  const body = {
    startTime,
    endTime,
    enabled
  };

  return this.http.post<any>(`${this.apiUrl}/schedule/lighting`, body, { headers: this.getHeader() }).pipe(
    catchError(this.handleError<any>('scheduleLightingControl'))
  );
}


 /**
 * Récupère la programmation de la lampe en fonction de l'emplacement.
 * @param location - L'emplacement de la lampe.
 * @returns Observable<LightSchedule> - La programmation de la lampe.
 */
getLightSchedule(): Observable<LightSchedule> {
  return this.http.get<LightSchedule>(`${this.apiUrl}/light-schedule`, { headers: this.getHeader() }).pipe(
    catchError(this.handleError<LightSchedule>('getLightSchedule'))
  );
}


/**
 * Récupère les préférences de jour pour une lampe spécifique.
 * @param lampId - L'identifiant de la lampe.
 * @returns Observable<string[]> - Les jours actifs pour la lampe.
 */
getLightPreferences(lampId: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/light-preferences`, { headers: this.getHeader() }).pipe(
    catchError(this.handleError<string[]>('getLightPreferences'))
  );
}


/**
 * Met à jour les préférences de jour pour une lampe spécifique.
 * @param lampId - L'identifiant de la lampe.
 * @param activeDays - Les jours actifs à mettre à jour.
 * @returns Observable<any> - La réponse du serveur.
 */
updateLightPreferences(lampId: string, activeDays: string[]): Observable<any> {
  const body = { lampId, activeDays };
  return this.http.post<any>(`${this.apiUrl}/light-preferences`, body, { headers: this.getHeader() }).pipe(
    catchError(this.handleError<any>('updateLightPreferences'))
  );
}


/**
   * Supprime la programmation de la lampe.
   * @returns Observable<any> - La réponse du serveur.
   */
deleteLightSchedule(): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/light-schedule`, { headers: this.getHeader() }).pipe(
    catchError(this.handleError<any>('deleteLightSchedule'))
  );
}

  // --------------------------
  // Gestion des erreurs
  // --------------------------

  /**
   * Gestion centralisée des erreurs.
   * @param operation - Le nom de l'opération en cours.
   * @param result - La valeur de retour en cas d'erreur.
   * @returns (error: any) => Observable<T> - Une fonction de gestion d'erreur.
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  // --------------------------
  // Méthodes pour les en-têtes HTTP
  // --------------------------

  /**
   * Retourne les en-têtes HTTP avec le token JWT.
   * @returns HttpHeaders - Les en-têtes HTTP.
   */
  private getHeader(): HttpHeaders {
    const token = this.authService.getToken(); // Récupère le token depuis AuthService
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Ajoute le token dans l'en-tête Authorization
      });
    } else {
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }
  }
}