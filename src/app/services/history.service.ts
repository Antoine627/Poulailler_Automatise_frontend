import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http'; // Importez HttpHeaders
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service'; // Importez AuthService pour récupérer le token

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private apiUrl = 'http://localhost:3000/api/history'; // Remplacez par l'URL de votre API

  constructor(private http: HttpClient, private authService: AuthService) {} // Injectez AuthService

  // --------------------------
  // Méthodes pour l'historique
  // --------------------------

  /**
   * Récupère l'historique avec des filtres optionnels.
   * @param type - Le type d'historique (optionnel).
   * @param startDate - La date de début (optionnelle).
   * @param endDate - La date de fin (optionnelle).
   * @param limit - Le nombre maximum de résultats (par défaut 50).
   * @param page - La page de résultats (par défaut 1).
   * @returns Observable<any> - L'historique filtré.
   */
  getHistory(type?: string, startDate?: string, endDate?: string, limit: number = 10, page: number = 1): Observable<any> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    if (type) {
      params = params.set('type', type);
    }
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }

    return this.http.get<any>(this.apiUrl, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('getHistory'))
    );
  }

  /**
   * Récupère l'historique par type.
   * @param type - Le type d'historique.
   * @returns Observable<any[]> - L'historique par type.
   */
  getHistoryByType(type: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/type/${type}`, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getHistoryByType', []))
    );
  }

  /**
   * Récupère les statistiques de l'historique.
   * @returns Observable<any[]> - Les statistiques de l'historique.
   */
  getHistoryStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats`, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getHistoryStats', []))
    );
  }

  /**
   * Récupère l'historique pour un utilisateur spécifique.
   * @param userId - L'ID de l'utilisateur.
   * @returns Observable<any[]> - L'historique de l'utilisateur.
   */
  getHistoryByUser(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getHistoryByUser', []))
    );
  }

  /**
   * Recherche dans l'historique par mot-clé.
   * @param keyword - Le mot-clé à rechercher.
   * @returns Observable<any[]> - Les résultats de la recherche.
   */
  searchHistory(keyword: string): Observable<any[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<any[]>(`${this.apiUrl}/search`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('searchHistory', []))
    );
  }

  /**
   * Supprime une entrée de l'historique.
   * @param id - L'ID de l'entrée à supprimer.
   * @returns Observable<any> - La réponse du serveur.
   */
  deleteHistoryEntry(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('deleteHistoryEntry'))
    );
  }

  /**
   * Récupère l'historique par jour.
   * @param startDate - La date de début (optionnelle).
   * @param endDate - La date de fin (optionnelle).
   * @returns Observable<any[]> - L'historique par jour.
   */
  getHistoryByDay(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }
    return this.http.get<any[]>(`${this.apiUrl}/by-day`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getHistoryByDay', []))
    );
  }

  /**
   * Récupère l'historique par semaine.
   * @param startDate - La date de début (optionnelle).
   * @param endDate - La date de fin (optionnelle).
   * @returns Observable<any[]> - L'historique par semaine.
   */
  getHistoryByWeek(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }
    return this.http.get<any[]>(`${this.apiUrl}/by-week`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getHistoryByWeek', []))
    );
  }

  /**
   * Récupère l'historique par mois.
   * @param startDate - La date de début (optionnelle).
   * @param endDate - La date de fin (optionnelle).
   * @returns Observable<any[]> - L'historique par mois.
   */
  getHistoryByMonth(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate && endDate) {
      params = params.set('startDate', startDate).set('endDate', endDate);
    }
    return this.http.get<any[]>(`${this.apiUrl}/by-month`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getHistoryByMonth', []))
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