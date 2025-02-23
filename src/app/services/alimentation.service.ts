import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Stock } from '../models/stock.model';

export interface Feeding {
  _id?: string;
  quantity: number;
  feedType: string;
  stockQuantity?: number;
  notes?: string;
  automaticFeeding?: boolean;
  waterSupply?: {
    startTime: string;
    endTime: string;
    enabled: boolean;
  };
  programStartTime?: string;
  programEndTime?: string;
  stockId?: string;
  createdAt?: Date;
}

export interface FeedingStats {
  _id: string;
  totalQuantity: number;
  averageQuantity: number;
  count: number;
}

export interface StockAlert {
  _id: string;
  currentStock: number;
}

@Injectable({
  providedIn: 'root',
})
export class AlimentationService {
  private readonly apiUrl = 'http://localhost:3000/api/feedings';
  private readonly stockApiUrl = 'http://localhost:3000/api/stocks';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  // Ajouter une alimentation
  addFeeding(feeding: Feeding): Observable<Feeding> {
    const headers = this.getHeaders();
    return this.http.post<Feeding>(this.apiUrl, feeding, { headers }).pipe(
      switchMap(addedFeeding => {
        if (feeding.stockId && feeding.quantity) {
          return this.updateStockQuantity(feeding.stockId, feeding.quantity).pipe(
            map(() => addedFeeding)
          );
        }
        return of(addedFeeding);
      }),
      catchError(this.handleError)
    );
  }

  // Obtenir l'historique des alimentations
  getFeedingHistory(params: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Observable<Feeding[]> {
    const headers = this.getHeaders();
    let httpParams = new HttpParams();

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate.toISOString());
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate.toISOString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<Feeding[]>(this.apiUrl, { headers, params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtenir toutes les alimentations
  getAllFeedings(): Observable<Feeding[]> {
    const headers = this.getHeaders();
    return this.http.get<Feeding[]>(`${this.apiUrl}/all`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Mettre à jour une alimentation
  updateFeeding(id: string, feeding: Partial<Feeding>): Observable<Feeding> {
    const headers = this.getHeaders();
    return this.http.put<Feeding>(`${this.apiUrl}/${id}`, feeding, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Supprimer une alimentation
  deleteFeeding(id: string): Observable<Feeding> {
    const headers = this.getHeaders();
    return this.http.delete<Feeding>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtenir les statistiques des alimentations
  getFeedingStats(params: {
    startDate?: Date;
    endDate?: Date;
  }): Observable<FeedingStats[]> {
    const headers = this.getHeaders();
    let httpParams = new HttpParams();

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate.toISOString());
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate.toISOString());
    }

    return this.http.get<FeedingStats[]>(`${this.apiUrl}/stats`, { headers, params: httpParams }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtenir les alertes de stock bas
  getAlertLowStock(): Observable<StockAlert[]> {
    const headers = this.getHeaders();
    return this.http.get<StockAlert[]>(`${this.apiUrl}/alerts/low-stock`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Ajouter plusieurs alimentations en une seule requête
  bulkAddFeedings(feedings: Feeding[]): Observable<Feeding[]> {
    const headers = this.getHeaders();
    return this.http.post<Feeding[]>(`${this.apiUrl}/bulk`, { feedings }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Mettre à jour l'apport en eau
  updateWaterSupply(
    id: string,
    waterSupply: {
      startTime: string;
      endTime: string;
      enabled: boolean;
    }
  ): Observable<Feeding> {
    const headers = this.getHeaders();
    return this.http.put<Feeding>(`${this.apiUrl}/${id}/water-supply`, waterSupply, { headers }).pipe(
      catchError(this.handleError)
    );
  }


  // Mettre à jour la quantité de stock
  private updateStockQuantity(stockId: string, quantityToRemove: number): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.stockApiUrl}/update-quantity/${stockId}`;
    return this.http.put(url, { quantityToRemove }, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  

  // Gestion des erreurs
  private handleError(error: HttpErrorResponse) {
    console.error('Erreur dans AlimentationService:', error);
    return throwError(() => new Error('Une erreur est survenue'));
  }
}