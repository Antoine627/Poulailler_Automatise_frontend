// src/app/services/cost.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Cost } from '../models/cost.model'; // Importez l'interface

@Injectable({
  providedIn: 'root',
})
export class CostService {
  private apiUrl = 'http://localhost:3000/api/costs';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Ajouter un coût
  addCost(cost: Cost): Observable<Cost> {
    return this.http.post<Cost>(this.apiUrl, cost, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<Cost>('addCost'))
    );
  }

  // Récupérer l'historique des coûts
  getCostHistory(startDate?: string, endDate?: string, limit: number = 50): Observable<Cost[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<Cost[]>(`${this.apiUrl}/history`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<Cost[]>('getCostHistory', []))
    );
  }

  // Récupérer les statistiques des coûts
  getCostStats(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) {
      params = params.set('startDate', startDate);
    }
    if (endDate) {
      params = params.set('endDate', endDate);
    }
    return this.http.get<any[]>(`${this.apiUrl}/stats`, { params, headers: this.getHeader() }).pipe(
      catchError(this.handleError<any[]>('getCostStats', []))
    );
  }

  // Calculer les coûts totaux
  calculateTotalCosts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/total`, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('calculateTotalCosts'))
    );
  }

  // Calculer les besoins en alimentation
  calculateFeedRequirements(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/feed-requirements`, data, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('calculateFeedRequirements'))
    );
  }

  // Calculer la rentabilité
  calculateProfitability(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/profitability`, data, { headers: this.getHeader() }).pipe(
      catchError(this.handleError<any>('calculateProfitability'))
    );
  }

  // Gestion des erreurs
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

  // Récupérer les en-têtes HTTP avec le token JWT
  private getHeader(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
    } else {
      return new HttpHeaders({
        'Content-Type': 'application/json',
      });
    }
  }
}