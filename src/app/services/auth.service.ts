import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Importez HttpHeaders
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { jwtDecode } from 'jwt-decode'; // Importez jwtDecode avec une importation nommée

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // URL de votre backend

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // Injectez PLATFORM_ID pour vérifier l'environnement
  ) {}

  // --------------------------
  // Méthodes d'authentification
  // --------------------------

  /**
   * Connexion avec email et mot de passe.
   * @param email - L'email de l'utilisateur.
   * @param password - Le mot de passe de l'utilisateur.
   * @returns Observable<any> - La réponse du serveur.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  /**
   * Connexion avec un code.
   * @param code - Le code de connexion.
   * @returns Observable<any> - La réponse du serveur.
   */
  loginWithCode(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/code`, { code }).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  /**
   * Déconnexion de l'utilisateur.
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token'); // Supprime le token stocké
    }
  }

  /**
   * Récupère le token depuis localStorage.
   * @returns string | null - Le token JWT ou null.
   */
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token'); // Récupère le token stocké
    }
    return null; // Si ce n'est pas un navigateur, retourne null
  }

  /**
   * Vérifie si l'utilisateur est authentifié.
   * @returns boolean - True si l'utilisateur est authentifié, sinon false.
   */
  isAuthenticated(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token'); // Récupérez le token depuis localStorage
      return !!token; // Retourne true si le token existe, sinon false
    }
    return false; // Si ce n'est pas un navigateur, retourne false
  }

  /**
   * Décoder le token pour obtenir les informations de l'utilisateur.
   * @param token - Le token JWT.
   * @returns any - Les informations de l'utilisateur ou null.
   */
  getUserInfoFromToken(token: string): any {
    try {
      return jwtDecode(token); // Utilisez jwtDecode pour décoder le token JWT
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  /**
   * Récupère les informations de l'utilisateur actuellement connecté.
   * @returns Observable<any> - Les informations de l'utilisateur.
   */
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, { headers: this.getHeader() }).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  // --------------------------
  // Méthodes d'inscription
  // --------------------------

  /**
   * Inscription d'un nouvel utilisateur.
   * @param formData - Les données du formulaire d'inscription.
   * @returns Observable<any> - La réponse du serveur.
   */
  register(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, formData).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  // --------------------------
  // Méthodes de gestion du mot de passe
  // --------------------------

  /**
   * Met à jour le mot de passe de l'utilisateur.
   * @param currentPassword - Le mot de passe actuel.
   * @param newPassword - Le nouveau mot de passe.
   * @returns Observable<any> - La réponse du serveur.
   */
  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-password`, { currentPassword, newPassword }, { headers: this.getHeader() }).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  /**
   * Demande de réinitialisation de mot de passe.
   * @param email - L'email de l'utilisateur.
   * @returns Observable<any> - La réponse du serveur.
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  /**
   * Vérifie la validité du token de réinitialisation.
   * @param token - Le token de réinitialisation.
   * @returns Observable<any> - La réponse du serveur.
   */
  verifyResetToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/reset-password/${token}`).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  /**
   * Réinitialise le mot de passe après vérification du token.
   * @param token - Le token de réinitialisation.
   * @param newPassword - Le nouveau mot de passe.
   * @returns Observable<any> - La réponse du serveur.
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword }).pipe(
      catchError(this.handleError) // Gestion des erreurs
    );
  }

  // --------------------------
  // Méthodes de gestion du code
  // --------------------------

  /**
   * Met à jour le code de connexion de l'utilisateur.
   * @returns Observable<any> - La réponse du serveur.
   */
  updateCode(): Observable<any> {
    return this.http.put(`${this.apiUrl}/update-code`, {}, { headers: this.getHeader() }).pipe(
      catchError(this.handleError) // Gestion des erreurs
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
  private handleError(error: any): Observable<never> {
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

    console.error('Erreur dans AuthService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // --------------------------
  // Méthodes pour les en-têtes HTTP
  // --------------------------

  /**
   * Retourne les en-têtes HTTP avec le token JWT.
   * @returns HttpHeaders - Les en-têtes HTTP.
   */
  getHeader(): HttpHeaders {
    const token = this.getToken(); // Récupère le token depuis localStorage
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