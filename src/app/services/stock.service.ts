// src/app/services/stock.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Stock, StockStats } from './../models/stock.model';

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private readonly apiUrl = 'http://localhost:3000/api/stocks';

  constructor(private http: HttpClient) {}

  /**
   * Ajoute un nouveau stock
   */
  addStock(stockData: Omit<Stock, '_id'>): Observable<Stock> {
    return this.http.post<Stock>(this.apiUrl, stockData).pipe(
      tap(stock => console.log('Stock added:', stock)),
      catchError(this.handleError)
    );
  }


  // Obtenir tous les stocks
  getAllStocks(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/all`);
  }

  /**
   * Récupère les statistiques des stocks
   */
  getStockStats(): Observable<StockStats[]> {
    return this.http.get<StockStats[]>(`${this.apiUrl}/stats`).pipe(
      tap(stats => console.log('Stock stats:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour un stock existant
   */
  updateStock(id: string, stockData: Partial<Stock>): Observable<Stock> {
    return this.http.put<Stock>(`${this.apiUrl}/${id}`, stockData).pipe(
      tap(stock => console.log('Stock updated:', stock)),
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un stock
   */
  deleteStock(id: string): Observable<Stock> {
    return this.http.delete<Stock>(`${this.apiUrl}/${id}`).pipe(
      tap(stock => console.log('Stock deleted:', stock)),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère tous les stocks de l'utilisateur courant
   */
  getStocksByUser(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/user`).pipe(
      tap(stocks => console.log('User stocks:', stocks)),
      catchError(this.handleError)
    );
  }


  // Obtenir les alertes de stock bas
  getAlertLowStock(): Observable<Stock[]> {
    return this.http.get<Stock[]>(`${this.apiUrl}/alerts/low-stock`);
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides';
          break;
        case 404:
          errorMessage = 'Stock non trouvé';
          break;
        case 500:
          errorMessage = 'Erreur serveur';
          break;
        default:
          errorMessage = `Code d'erreur: ${error.status}, message: ${error.message}`;
      }
    }

    console.error('Erreur dans StockService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}