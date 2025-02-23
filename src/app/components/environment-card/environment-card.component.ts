import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThermometerHalf, faTint, faSun, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-environment-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './environment-card.component.html',
  styleUrls: ['./environment-card.component.css']
})
export class EnvironmentCardComponent {
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() value: string = '';
  @Input() unit: string = '';
  @Input() hasControls: boolean = false;
  @Input() isActive: boolean = false;

  // Icônes Font Awesome
  faThermometerHalf = faThermometerHalf;
  faTint = faTint;
  faSun = faSun;
  faQuestionCircle = faQuestionCircle;

  // Chemins des images pour la lampe
  lightbulbOn = 'assets/images/light.png'; // Chemin vers l'image de la lampe allumée
  lightbulbOff = 'assets/images/light-off.png'; // Chemin vers l'image de la lampe éteinte

  getIcon(): IconDefinition | string {
    switch (this.icon) {
      case 'thermometer':
        return this.faThermometerHalf;
      case 'droplet':
        return this.faTint;
      case 'sun':
        return this.faSun;
      case 'lightbulb': // Utiliser l'image de la lampe
        return this.isActive ? this.lightbulbOn : this.lightbulbOff;
      default:
        return this.faQuestionCircle;
    }
  }

  isColoredIcon(): boolean {
    return ['thermometer', 'droplet', 'sun'].includes(this.icon);
  }

  toggleActive() {
    this.isActive = !this.isActive;
  }
}
