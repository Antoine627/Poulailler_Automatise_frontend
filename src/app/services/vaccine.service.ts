import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VaccineService {
  private apiUrl = 'http://localhost:3000/api/vaccins'; // Mets l'URL de ton backend

  constructor(private http: HttpClient) {}

  // Récupérer tous les vaccins
  getVaccines(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Ajouter un nouveau vaccin
  addVaccine(vaccineData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, vaccineData);
  }

  // Mettre à jour un vaccin
  updateVaccine(id: string, vaccineData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, vaccineData);
  }

  // Supprimer un vaccin
  deleteVaccine(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Récupérer les vaccins à venir
  getUpcomingVaccines(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/upcoming`);
  }
}
