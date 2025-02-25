import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Stock, StockStats, LowStockAlert } from './../models/stock.model';
import { AuthService } from './auth.service'; // Importez AuthService

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly apiUrl = 'http://localhost:3000/api/stocks';

  constructor(private http: HttpClient, private authService: AuthService) {} // Injectez AuthService

  // --------------------------
  // Méthodes pour les en-têtes HTTP
  // --------------------------

  /**
   * Retourne les en-têtes HTTP avec le token JWT.
   * @returns HttpHeaders - Les en-têtes HTTP.
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    });
  }
  

  // --------------------------
  // Méthodes pour les stocks
  // --------------------------

  /**
   * Ajouter un nouveau stock.
   * @param stockData - Les données du stock à ajouter.
   * @returns Observable<Stock> - La réponse du serveur.
   */
  addStock(stockData: Omit<Stock, '_id'>): Observable<Stock> {
    const headers = this.getHeaders();
    return this.http.post<Stock>(this.apiUrl, stockData, { headers }).pipe(
      tap((stock) => console.log('Stock added:', stock)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir tous les stocks.
   * @returns Observable<Stock[]> - La liste des stocks.
   */
  getAllStocks(): Observable<Stock[]> {
    const headers = this.getHeaders();
    return this.http.get<Stock[]>(`${this.apiUrl}/all`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Récupérer les statistiques des stocks.
   * @returns Observable<StockStats[]> - Les statistiques des stocks.
   */
  getStockStats(): Observable<StockStats[]> {
    const headers = this.getHeaders();
    return this.http.get<StockStats[]>(`${this.apiUrl}/stats`, { headers }).pipe(
      tap((stats) => console.log('Stock stats:', stats)),
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour un stock existant.
   * @param id - L'ID du stock à mettre à jour.
   * @param stockData - Les nouvelles données du stock.
   * @returns Observable<Stock> - La réponse du serveur.
   */
  updateStock(id: string, stockData: Partial<Stock>): Observable<Stock> {
    const headers = this.getHeaders();
    return this.http.put<Stock>(`${this.apiUrl}/${id}`, stockData, { headers }).pipe(
      tap((stock) => console.log('Stock updated:', stock)),
      catchError(this.handleError)
    );
  }


  /**
   * Récupère les stocks par type.
   * @param type - Le type de stock à récupérer.
   * @returns Observable<any[]> - La liste des stocks du type spécifié.
   */
  getStocksByType(type: string): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/by-type/${type}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }




  /**
   * Décrémenter un stock automatiquement.
   * @param type - Le type de stock à décrémenter ('feed' ou 'water').
   * @param quantityToDecrement - La quantité à décrémenter (default: 1).
   * @returns Observable<any> - La réponse du serveur.
   */
  decrementStock(stockId: string, quantity: number = 1): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.apiUrl}/decrement`; // Assurez-vous que l'URL est correcte
  
    console.log(`Envoi de la requête de décrémentation: stockId=${stockId}, quantity=${quantity}`);
  
    return this.http.post<any>(url, { stockId, quantityToDecrement: quantity }, { headers })
      .pipe(
        tap(response => console.log('Réponse de décrémentation:', response)),
        catchError(error => {
          console.error('Erreur de décrémentation:', error);
          return throwError(() => error);
        })
      );
  }


  

  /**
   * Supprimer un stock.
   * @param id - L'ID du stock à supprimer.
   * @returns Observable<Stock> - La réponse du serveur.
   */
  deleteStock(id: string): Observable<Stock> {
    const headers = this.getHeaders();
    return this.http.delete<Stock>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap((stock) => console.log('Stock deleted:', stock)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les alertes de stock bas.
   * @returns Observable<Stock[]> - La liste des stocks en alerte.
   */
  getAlertLowStock(): Observable<LowStockAlert[]> {
    const headers = this.getHeaders();
    return this.http.get<LowStockAlert[]>(`${this.apiUrl}/alerts/low-stock`, { headers }).pipe(
      catchError(this.handleError)
    );
  }



/**
 * Obtenir les quantités totales pour chaque type de stock.
 * @returns Observable<{ totalsByType: { [key: string]: { totalQuantity: number, unit: string } } }> - Les quantités totales par type.
 */
getTotals(): Observable<{ totalsByType: { [key: string]: { totalQuantity: number, unit: string } } }> {
  const headers = this.getHeaders();
  return this.http.get<{ totalsByType: { [key: string]: { totalQuantity: number, unit: string } } }>(`${this.apiUrl}/totals`, { headers }).pipe(
    catchError(this.handleError)
  );
}




  /**
 * Récupérer le niveau du réservoir d'aliments.
 * @returns Observable<{ foodTankLevel: number }> - Le niveau du réservoir en pourcentage.
 */
getFoodTankLevel(): Observable<{ foodTankLevel: number }> {
  const headers = this.getHeaders();
  return this.http.get<{ foodTankLevel: number }>(`${this.apiUrl}/food-tank-level`, { headers }).pipe(
    catchError(this.handleError)
  );
}


getWaterTankLevel(): Observable<{ waterTankLevel: number }> {
  const headers = this.getHeaders();
  return this.http.get<{ waterTankLevel: number }>(`${this.apiUrl}/water-tank-level`, { headers }).pipe(
    catchError(this.handleError)
  );
}

  // --------------------------
  // Gestion des erreurs
  // --------------------------

  /**
   * Gestion centralisée des erreurs.
   * @param error - L'erreur retournée par le serveur.
   * @returns Observable<never> - Un observable avec l'erreur.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
  
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          // Utiliser le message d'erreur renvoyé par le serveur
          errorMessage = error.error.message || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
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