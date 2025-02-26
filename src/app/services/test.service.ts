import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TestService {

  private apiUrl = 'http://localhost:3000/api/tests';  // Modifiez l'URL si nécessaire

  constructor(private http: HttpClient) {}

  // Récupérer tous les tests
  getTests(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Calculer les besoins en alimentation pour un test
  calculateFeedRequirements(testId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calculateFeed/${testId}`, data);
  }

  // Calculer la rentabilité pour un test
  calculateProfitability(testId: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/calculateProfitability/${testId}`, data);
  }

  // Enregistrer les décès
  recordDeaths(testId: string, deaths: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/recordDeaths/${testId}`, { deaths });
  }
}
