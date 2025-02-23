import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, NgClass],
  template: `
    <div class="settings-container" [ngClass]="currentTheme">
      <h1>Paramètres</h1>
      
      <section class="settings-section">
        <h2>Apparence</h2>
        
        <!-- Thème -->
        <div class="setting-item">
          <label>Thème</label>
          <div class="theme-options">
            <div 
              *ngFor="let theme of themes" 
              class="theme-option" 
              [ngClass]="{'active': currentTheme === theme.value}"
              (click)="changeTheme(theme.value)">
              <div class="theme-preview" [ngClass]="theme.value"></div>
              <span>{{ theme.label }}</span>
            </div>
          </div>
        </div>
        
        <!-- Couleur principale -->
        <div class="setting-item">
          <label>Couleur principale</label>
          <div class="color-options">
            <div 
              *ngFor="let color of colors" 
              class="color-option"
              [style.background-color]="color.value"
              [ngClass]="{'active': currentColor === color.value}"
              (click)="changeColor(color.value)">
            </div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2>Langue</h2>
        <div class="setting-item">
          <label>Sélectionner la langue</label>
          <select [(ngModel)]="currentLanguage" (change)="changeLanguage()">
            <option *ngFor="let lang of languages" [value]="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
      </section>

      <section class="settings-section">
        <h2>Sécurité</h2>
        
        <!-- Changement de mot de passe -->
        <div class="setting-item">
          <label>Changer le mot de passe</label>
          <form (submit)="changePassword($event)">
            <div class="form-group">
              <input type="password" [(ngModel)]="currentPassword" name="currentPassword" 
                placeholder="Mot de passe actuel" required />
            </div>
            <div class="form-group">
              <input type="password" [(ngModel)]="newPassword" name="newPassword" 
                placeholder="Nouveau mot de passe" required />
            </div>
            <div class="form-group">
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" 
                placeholder="Confirmer le mot de passe" required />
            </div>
            <button type="submit">Enregistrer</button>
          </form>
        </div>
        
        <!-- Changement de code PIN -->
        <div class="setting-item">
          <label>Changer le code PIN</label>
          <form (submit)="changePin($event)">
            <div class="form-group">
              <input type="password" [(ngModel)]="currentPin" name="currentPin" 
                placeholder="Code PIN actuel" required 
                maxlength="4" pattern="\d{4}" />
            </div>
            <div class="form-group">
              <input type="password" [(ngModel)]="newPin" name="newPin" 
                placeholder="Nouveau code PIN" required 
                maxlength="4" pattern="\d{4}" />
            </div>
            <div class="form-group">
              <input type="password" [(ngModel)]="confirmPin" name="confirmPin" 
                placeholder="Confirmer le code PIN" required 
                maxlength="4" pattern="\d{4}" />
            </div>
            <button type="submit">Enregistrer</button>
          </form>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>Notifications</h2>
        <div class="setting-item toggle">
          <label>Notifications push</label>
          <div class="toggle-switch">
            <input type="checkbox" id="push-notifications" [(ngModel)]="pushNotifications" (change)="togglePushNotifications()">
            <label for="push-notifications"></label>
          </div>
        </div>
      </section>

      <div class="settings-actions">
        <button class="btn-secondary" (click)="resetSettings()">
          Réinitialiser
        </button>
        <button class="btn-primary" (click)="saveSettings()">
          Enregistrer tout
        </button>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: 'Roboto', sans-serif;
    }
    
    .settings-container.light-theme {
      background-color: #ffffff;
      color: #333333;
    }
    
    .settings-container.dark-theme {
      background-color: #222222;
      color: #f0f0f0;
    }
    
    .settings-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .setting-item {
      margin-bottom: 20px;
    }
    
    .setting-item label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .theme-options {
      display: flex;
      gap: 15px;
    }
    
    .theme-option {
      cursor: pointer;
      text-align: center;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    
    .theme-option.active {
      opacity: 1;
      font-weight: 600;
    }
    
    .theme-preview {
      width: 80px;
      height: 50px;
      border-radius: 6px;
      margin-bottom: 8px;
      border: 1px solid #ccc;
    }
    
    .theme-preview.light-theme {
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
    }
    
    .theme-preview.dark-theme {
      background-color: #222222;
      border: 1px solid #444444;
    }
    
    .theme-preview.system-theme {
      background: linear-gradient(to right, #ffffff 50%, #222222 50%);
    }
    
    .color-options {
      display: flex;
      gap: 10px;
    }
    
    .color-option {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .color-option.active {
      transform: scale(1.2);
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
    }
    
    select {
      padding: 10px;
      border-radius: 5px;
      font-size: 16px;
      width: 200px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    input[type="password"] {
      padding: 10px;
      border-radius: 5px;
      border: 1px solid #ccc;
      font-size: 16px;
      width: 100%;
      max-width: 300px;
    }
    
    button {
      padding: 10px 20px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      background-color: #4a86e8;
      color: white;
      border: none;
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-switch label {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      border-radius: 34px;
      transition: .4s;
    }
    
    .toggle-switch label:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      border-radius: 50%;
      transition: .4s;
    }
    
    .toggle-switch input:checked + label {
      background-color: #4a86e8;
    }
    
    .toggle-switch input:checked + label:before {
      transform: translateX(26px);
    }
    
    .settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 30px;
    }
    
    .btn-secondary {
      background-color: transparent;
      border: 1px solid #4a86e8;
      color: #4a86e8;
    }
    
    .setting-item.toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class SettingsComponent {
  // Thèmes
  themes = [
    { value: 'light-theme', label: 'Thème Clair' },
    { value: 'dark-theme', label: 'Thème Sombre' },
    { value: 'system-theme', label: 'Système' }
  ];
  currentTheme = 'light-theme';
  
  // Couleurs
  colors = [
    { value: '#4a86e8', label: 'Bleu' },
    { value: '#6aa84f', label: 'Vert' },
    { value: '#e69138', label: 'Orange' },
    { value: '#a64d79', label: 'Violet' },
    { value: '#cc0000', label: 'Rouge' }
  ];
  currentColor = '#4a86e8';
  
  // Langues
  languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' }
  ];
  currentLanguage = 'fr';
  
  // Sécurité - Mot de passe
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  // Sécurité - Code PIN
  currentPin = '';
  newPin = '';
  confirmPin = '';
  
  // Notifications
  pushNotifications = true;
  
  // Méthodes
  changeTheme(theme: string): void {
    this.currentTheme = theme;
    console.log(`Thème changé à: ${theme}`);
  }
  
  changeColor(color: string): void {
    this.currentColor = color;
    document.documentElement.style.setProperty('--primary-color', color);
    console.log(`Couleur principale changée à: ${color}`);
  }
  
  changeLanguage(): void {
    console.log(`Langue changée à: ${this.currentLanguage}`);
    // Ici vous appelleriez votre service de traduction
    // this.translateService.use(this.currentLanguage);
  }
  
  changePassword(event: Event): void {
    event.preventDefault();
    if (this.newPassword !== this.confirmPassword) {
      console.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    console.log('Mot de passe changé avec succès');
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }
  
  changePin(event: Event): void {
    event.preventDefault();
    if (this.newPin !== this.confirmPin) {
      console.error('Les codes PIN ne correspondent pas');
      return;
    }
    
    console.log('Code PIN changé avec succès');
    this.currentPin = '';
    this.newPin = '';
    this.confirmPin = '';
  }
  
  togglePushNotifications(): void {
    console.log(`Notifications push ${this.pushNotifications ? 'activées' : 'désactivées'}`);
  }
  
  resetSettings(): void {
    this.currentTheme = 'light-theme';
    this.currentColor = '#4a86e8';
    this.currentLanguage = 'fr';
    this.pushNotifications = true;
    console.log('Paramètres réinitialisés');
  }
  
  saveSettings(): void {
    console.log('Tous les paramètres sauvegardés');
    // Ici vous sauvegarderiez tous les paramètres dans votre service
  }
}