import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, CommonModule } from '@angular/common';
import { AuthService } from './../../services/auth.service';
import { lastValueFrom } from 'rxjs';

// Définissez l'interface UserInfo
interface UserInfo {
  username?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  createdAt?: string;
}

export interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, NgIf, CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  loading = false;
  userInfo: UserInfo = {};
  isAuthPage = false;

  // Formulaire de mot de passe
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Propriétés pour les notifications
  showNotificationBar = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'info' = 'info';

  // Propriété pour stocker la date et l'heure actuelles
  currentDateTime: string = '';

  // Interval pour la mise à jour de l'heure
  private timeInterval: any;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.updateDateTime();
    this.timeInterval = setInterval(() => this.updateDateTime(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private loadUserInfo(): void {
    this.loading = true;

    this.authService.getCurrentUser().subscribe({
      next: (response) => {
        console.log('Réponse du backend:', response); // Debug
        if (response.success && response.data) {
          this.userInfo = response.data; // Mappez les données correctement
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des informations utilisateur:', error); // Debug
        this.loading = false;
      }
    });
  }

  async changePassword(event: Event): Promise<void> {
    event.preventDefault();

    if (this.newPassword !== this.confirmPassword) {
      this.showNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    this.loading = true;

    try {
      await lastValueFrom(this.authService.updatePassword(this.currentPassword, this.newPassword));
      this.showNotification('Mot de passe modifié avec succès', 'success');
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (error: any) {
      this.showNotification(error.error?.message || 'Erreur lors du changement de mot de passe', 'error');
    } finally {
      this.loading = false;
    }
  }

  async generateNewCode(): Promise<void> {
    this.loading = true;

    try {
      await lastValueFrom(this.authService.updateCode());
      this.showNotification('Nouveau code de connexion généré avec succès', 'success');
    } catch (error: any) {
      this.showNotification(error.error?.message || 'Erreur lors de la génération du nouveau code', 'error');
    } finally {
      this.loading = false;
    }
  }

  // Méthode pour afficher une notification
  showCustomNotification(message: string, type: 'success' | 'error' | 'info') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationBar = true;

    // Fermer automatiquement la notification après 3 secondes
    setTimeout(() => {
      this.showNotificationBar = false;
    }, 3000);
  }

  // Méthode pour afficher une notification (alias pour compatibilité)
  showNotification(message: string, type: 'success' | 'error' | 'info') {
    this.showCustomNotification(message, type);
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  // Méthode pour mettre à jour la date et l'heure actuelles
  updateDateTime(): void {
    this.currentDateTime = new Date().toISOString();
  }
}
