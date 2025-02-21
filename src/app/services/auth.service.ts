import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // URL de ton backend

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  /* loginWithCode(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/loginWithCode`, { code });
  } */

    loginWithCode(code: string): Observable<any> {
      return this.http.post(`${this.apiUrl}/code`, { code });
    }

    
  logout(): void {
    localStorage.removeItem('token'); // Supprime le token stocké
  }

  getToken(): string | null {
    return localStorage.getItem('token'); // Récupère le token stocké
  }

  isAuthenticated(): boolean {
    return !!this.getToken(); // Vérifie si un token existe
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }
  
}
