import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThermometerHalf, faTint, faSun, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EnvironmentalData, EnvironementService } from '../../services/environement.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-environment-card',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './environment-card.component.html',
  styleUrls: ['./environment-card.component.css']
})
export class EnvironmentCardComponent implements OnInit, OnDestroy {
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

  // Données environnementales
  environmentalData: EnvironmentalData | null = null;
  dataSubscription?: Subscription;
  refreshInterval = 30000; // Actualiser toutes les 30 secondes

  constructor(private environementService: EnvironementService) {}

  ngOnInit(): void {
    // Charger les données immédiatement
    this.loadEnvironmentalData();
  
    // Configurer l'actualisation automatique des données
    this.dataSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.environementService.getLatestData())
      )
      .subscribe({
        next: (data) => {
          console.log('Received Data:', data); // Ajouter un log ici
          this.environmentalData = data;
          this.updateCardValues();
        },
        error: (err) => {
          console.error('Failed to refresh environmental data:', err);
        }
      });
  }
  

  ngOnDestroy(): void {
    // Nettoyer les abonnements lors de la destruction du composant
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  loadEnvironmentalData(): void {
    this.environementService.getLatestData().subscribe({
      next: (data) => {
        console.log('Données reçues depuis l\'API:', data); // Ajouter un log ici
        this.environmentalData = data;
        this.updateCardValues();
      },
      error: (err) => {
        console.error('Failed to load environmental data:', err);
      }
    });
  }

  updateCardValues(): void {
    if (this.environmentalData) {
      console.log('Données environnementales:', this.environmentalData); // Log des données reçues
  
      switch (this.title.toLowerCase()) {
        case 'temperature':
          this.value = this.environmentalData.temperature.toFixed(1);
          this.unit = 'C';
          break;
        case 'humidity':
          console.log('Valeur d\'humidité:', this.environmentalData.humidity); // Log de l'humidité
          this.value = this.environmentalData.humidity.toFixed(1);
          this.unit = '%';
          break;
        case 'light':
          console.log('Valeur de luminosité:', this.environmentalData.lightPercentage); // Log de la luminosité
          this.value = this.environmentalData.lightPercentage.toFixed(1);
          this.unit = 'Lux';
          break;
        default:
          this.value = 'N/A';
          this.unit = '';
      }
  
      console.log('Valeurs mises à jour - Valeur:', this.value, 'Unité:', this.unit); // Log des valeurs finales
    }
  }
  

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
    // Ici, vous pourriez ajouter un appel à l'API pour modifier l'état du dispositif
    // Par exemple: this.environementService.toggleLight(this.isActive).subscribe(...);
  }
}