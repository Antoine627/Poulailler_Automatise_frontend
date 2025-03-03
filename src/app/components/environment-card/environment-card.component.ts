import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faThermometerHalf, faTint, faSun, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EnvironmentalData, EnvironementService } from '../../services/environement.service'; // Votre service actuel
import { EnvironmentalService } from '../../services/environmental.service'; // Service mis à jour pour la lampe
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
  lightbulbOn = 'assets/images/light.png';
  lightbulbOff = 'assets/images/light-off.png';

  // Données environnementales
  environmentalData: EnvironmentalData | null = null;
  dataSubscription?: Subscription;
  refreshInterval = 30000; // Actualiser toutes les 30 secondes
  isLoading: boolean = false; // État de chargement pour les commandes

  constructor(
    private environementService: EnvironementService, // Service existant pour les données environnementales
    private environmentalService: EnvironmentalService // Service mis à jour pour la lampe
  ) {}

  ngOnInit(): void {
    this.loadEnvironmentalData();
    this.dataSubscription = interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.environementService.getLatestData())
      )
      .subscribe({
        next: (data) => {
          console.log('Received Data:', data);
          this.environmentalData = data;
          this.updateCardValues();
        },
        error: (err) => {
          console.error('Failed to refresh environmental data:', err);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  loadEnvironmentalData(): void {
    this.environementService.getLatestData().subscribe({
      next: (data) => {
        console.log('Données reçues depuis l\'API:', data);
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
      switch (this.title.toLowerCase()) {
        case 'temperature':
          this.value = this.environmentalData.temperature.toFixed(1);
          this.unit = 'C';
          break;
        case 'humidity':
          this.value = this.environmentalData.humidity.toFixed(1);
          this.unit = '%';
          break;
        case 'light':
          this.value = this.environmentalData.lightPercentage.toFixed(1);
          this.unit = 'Lux';
          break;
        default:
          this.value = 'N/A';
          this.unit = '';
      }
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
      case 'lightbulb':
        return this.isActive ? this.lightbulbOn : this.lightbulbOff;
      default:
        return this.faQuestionCircle;
    }
  }

  isColoredIcon(): boolean {
    return ['thermometer', 'droplet', 'sun'].includes(this.icon);
  }

  turnOnLamp() {
    if (this.isLoading || this.isActive) return;

    this.isLoading = true;
    this.environmentalService.controlLampManually('START').subscribe({
      next: () => {
        this.isActive = true;
        this.isLoading = false;
        console.log('Lampe allumée');
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de l\'allumage de la lampe:', err);
      }
    });
  }

  turnOffLamp() {
    if (this.isLoading || !this.isActive) return;

    this.isLoading = true;
    this.environmentalService.controlLampManually('STOP').subscribe({
      next: () => {
        this.isActive = false;
        this.isLoading = false;
        console.log('Lampe éteinte');
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erreur lors de l\'extinction de la lampe:', err);
      }
    });
  }

  toggleActive() {
    if (this.isActive) {
      this.turnOffLamp();
    } else {
      this.turnOnLamp();
    }
  }
}