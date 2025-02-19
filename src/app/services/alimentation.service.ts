import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  // Ajouter une alimentation
  addFeeding(feeding: Feeding): Observable<Feeding> {
    return this.http.post<Feeding>(this.apiUrl, feeding);
  }

  // Obtenir l'historique des alimentations
  getFeedingHistory(params: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Observable<Feeding[]> {
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

    return this.http.get<Feeding[]>(this.apiUrl, { params: httpParams });
  }

  // Obtenir toutes les alimentations
  getAllFeedings(): Observable<Feeding[]> {
    return this.http.get<Feeding[]>(`${this.apiUrl}/all`);
  }

  // Mettre à jour une alimentation
  updateFeeding(id: string, feeding: Partial<Feeding>): Observable<Feeding> {
    return this.http.put<Feeding>(`${this.apiUrl}/${id}`, feeding);
  }

  // Supprimer une alimentation
  deleteFeeding(id: string): Observable<Feeding> {
    return this.http.delete<Feeding>(`${this.apiUrl}/${id}`);
  }

  // Obtenir les statistiques des alimentations
  getFeedingStats(params: {
    startDate?: Date;
    endDate?: Date;
  }): Observable<FeedingStats[]> {
    let httpParams = new HttpParams();

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate.toISOString());
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate.toISOString());
    }

    return this.http.get<FeedingStats[]>(`${this.apiUrl}/stats`, { params: httpParams });
  }

  // Obtenir les alertes de stock bas
  getAlertLowStock(): Observable<StockAlert[]> {
    return this.http.get<StockAlert[]>(`${this.apiUrl}/alerts/low-stock`);
  }

  // Ajouter plusieurs alimentations en une seule requête
  bulkAddFeedings(feedings: Feeding[]): Observable<Feeding[]> {
    return this.http.post<Feeding[]>(`${this.apiUrl}/bulk`, { feedings });
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
    return this.http.put<Feeding>(`${this.apiUrl}/${id}/water-supply`, waterSupply);
  }
}