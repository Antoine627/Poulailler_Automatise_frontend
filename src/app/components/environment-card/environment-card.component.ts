import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThermometerHalf, faTint, faSun, faFan, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-environment-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './environment-card.component.html', // Lien vers le template HTML
  styleUrls: ['./environment-card.component.css'] // Lien vers le fichier CSS
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