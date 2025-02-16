import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThermometerHalf, faTint, faSun, faFan, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-environment-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="card">
      <div class="card-header">
        <h3>{{title}} <fa-icon [icon]="getIcon()" [class.rotate]="isActive" [class.colored-icon]="isColoredIcon()"></fa-icon></h3>
      </div>
      <div class="card-body" *ngIf="!hasControls">
        <div class="value">{{value}}{{unit === 'C' ? '°' : ''}} {{unit}}</div>
      </div>
      <div class="card-body controls" *ngIf="hasControls">
        <div class="buttons">
          <button class="btn-on" [disabled]="isActive" (click)="toggleActive()">Allumer</button>
          <button class="btn-off" [disabled]="!isActive" (click)="toggleActive()">Eteindre</button>
        </div>
        <div class="status">
          Status <span class="status-indicator" [class.on]="isActive"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 1rem;
      border-bottom: 1px solid #eee;
    }
    .card-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .card-body {
      padding: 1.5rem;
      text-align: center;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .value {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
    }
    .controls .buttons {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .btn-on, .btn-off {
      flex: 1;
      padding: 0.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-on {
      background-color: #4CAF50;
      color: white;
    }
    .btn-off {
      background-color: #e0e0e0; /* Initial grayed-out color */
      color: #fff;
    }
    .btn-on:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    .btn-off:disabled {
      background-color: #e0e0e0; /* Grayed-out color when disabled */
      cursor: not-allowed;
    }
    .btn-off:not(:disabled) {
      background-color: #DF222C; /* Active color */
    }
    .status {
      display: flex;
      align-items: center;
      justify-content: left;
      gap: 0.5rem;
    }
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #DF222C;
    }
    .status-indicator.on {
      background-color: #4CAF50;
    }
    .rotate {
      animation: spin 2s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .colored-icon {
      color: #14AE5C;
    }
  `]
})
export class EnvironmentCardComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() value: string = '';
  @Input() unit: string = '';
  @Input() hasControls: boolean = false;
  @Input() isActive: boolean = false; // Default to false to disable "Eteindre" initially

  // Icônes Font Awesome
  faThermometerHalf = faThermometerHalf;
  faTint = faTint;
  faSun = faSun;
  faFan = faFan;
  faQuestionCircle = faQuestionCircle; // Icône par défaut

  getIcon(): IconDefinition {
    switch (this.icon) {
      case 'thermometer':
        return this.faThermometerHalf;
      case 'droplet':
        return this.faTint;
      case 'sun':
        return this.faSun;
      case 'fan':
        return this.faFan;
      default:
        return this.faQuestionCircle; // Retourne une icône par défaut si aucune correspondance n'est trouvée
    }
  }

  isColoredIcon(): boolean {
    return ['thermometer', 'droplet', 'sun'].includes(this.icon);
  }

  toggleActive() {
    this.isActive = !this.isActive;
  }
}
