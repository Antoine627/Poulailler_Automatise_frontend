

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private apiUrl = 'http://localhost:3000/api'; // Replace with your backend URL

  constructor(private http: HttpClient) {}

  // Get statistics data from backend
  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getStats`);
  }

  // Get all productions
  getProductions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getProductions`);
  }

  // Add a new production
  addProduction(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addProduction`, data);
  }

  // Calculate feed requirements
  calculateFeed(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/calculateFeedRequirements`, data);
  }
}
