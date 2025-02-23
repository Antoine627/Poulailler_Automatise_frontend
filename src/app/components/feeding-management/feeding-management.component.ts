import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlimentationService, Feeding, FeedingStats, StockAlert } from '../../services/alimentation.service';
import { FeedingType } from '../../models/alimentation';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { filter } from 'rxjs';
import { StockService } from '../../services/stock.service';

interface FeedingProgram {
  quantity: number;
  programStartTime: string;
  programEndTime: string;
  type?: string; // Ajoutez cette ligne
  _id?: string;
}

@Component({
  selector: 'app-feeding-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './feeding-management.component.html',
  styleUrls: ['./feeding-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedingManagementComponent implements OnInit, OnDestroy {
  feedingPrograms: FeedingProgram[] = [];
  feedingForm!: FormGroup;
  feedingHistory: Feeding[] = [];
  feedingStats: FeedingStats[] = [];
  stockAlerts: StockAlert[] = [];
  startDate: string;
  endDate: string;
  isFeedingSystemActive: boolean = false; // Désactivé par défaut
  lastFeedingTime: string = '';
  nextFeedingTime: string = '';
  foodTankLevel: number = 100; // Initialiser à 100% (ou une autre valeur par défaut)
  feedingQuantity: number = 5;
  feedingSchedule: string[] = ['08:00', '16:00'];
  isAutoMode: boolean = true;
  isWaterSystemActive: boolean = false; // Désactivé par défaut
  waterTankLevel: number = 100; // Initialiser à 100% (ou une autre valeur par défaut)
  dailyFoodConsumption: number = 0;
  dailyWaterConsumption: number = 0;
  dailyDistributions: number = 0;
  feedTypes: FeedingType[] = [];
  private updateInterval: any;
  private feedingInterval: any; // Intervalle pour la décrémentation en temps réel
  private waterInterval: any; // Intervalle pour la décrémentation en temps réel

  isAuthPage: boolean = false;

  constructor(
    private fb: FormBuilder,
    private alimentationService: AlimentationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private stockService: StockService // Injectez StockService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAuthPage = event.url === '/login';
      });
      
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    this.startDate = weekAgo.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.initForm();
    this.loadFeedingHistory();
    this.loadFeedingStats();
    this.loadStockAlerts();
    this.loadFeedingPrograms();

    this.updateFeedingStatus();
    this.updateInterval = setInterval(() => {
      this.updateFeedingStatus();
    }, 60000);
  }

  ngOnDestroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.feedingInterval) {
      clearInterval(this.feedingInterval);
    }
    if (this.waterInterval) {
      clearInterval(this.waterInterval);
    }
  }

  private initForm() {
    this.feedingForm = this.fb.group({
      feedType: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      stockQuantity: ['', [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  updateFeedingStatus() {
    const now = new Date();

    if (this.feedingHistory.length > 0) {
      this.lastFeedingTime = new Date(this.feedingHistory[0].createdAt!)
        .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    const nextScheduledTime = this.feedingSchedule.find(time => {
      const [hours, minutes] = time.split(':');
      const scheduledTime = new Date();
      scheduledTime.setHours(parseInt(hours), parseInt(minutes));
      return scheduledTime > now;
    });

    this.nextFeedingTime = nextScheduledTime || this.feedingSchedule[0];
    this.cdr.markForCheck(); // Marquer pour la détection des changements
  }

  loadFeedingHistory() {
    const params = {
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      limit: 50
    };
  
    this.alimentationService.getFeedingHistory(params)
      .subscribe({
        next: (history) => {
          this.feedingHistory = history;
          this.updateLastFeedingTime(); // Mettre à jour la dernière distribution
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'historique:', error);
        }
      });
  }

  loadFeedingStats() {
    const params = {
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate)
    };
  
    this.alimentationService.getFeedingStats(params)
      .subscribe({
        next: (stats) => {
          this.feedingStats = stats;
          this.cdr.markForCheck(); // Marquer pour la détection des changements
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      });
  } 

  loadStockAlerts() {
    this.alimentationService.getAlertLowStock()
      .subscribe({
        next: (alerts) => {
          this.stockAlerts = alerts;
          this.cdr.markForCheck(); // Marquer pour la détection des changements
        },
        error: (error) => {
          console.error('Erreur lors du chargement des alertes de stock:', error);
        }
      });
  }

  loadFeedingPrograms() {
    this.alimentationService.getFeedingHistory({ limit: 50 })
      .subscribe({
        next: (feedings: Feeding[]) => {
          this.feedingPrograms = feedings
            .filter(feeding => feeding.programStartTime && feeding.programEndTime)
            .map(feeding => ({
              quantity: feeding.quantity,
              programStartTime: feeding.programStartTime!,
              programEndTime: feeding.programEndTime!,
              type: feeding.feedType === 'eau' ? 'Eau' : 'Nourriture', // Ajoutez cette ligne
              _id: feeding._id
            }));
          this.updateNextFeedingTime(); // Mettre à jour la prochaine distribution
          this.cdr.markForCheck(); // Marquer pour la détection des changements
        },
        error: (error) => {
          console.error('Erreur lors du chargement des programmes:', error);
        }
      });
  }

  onSubmit() {
    if (this.feedingForm.valid) {
      this.alimentationService.addFeeding(this.feedingForm.value)
        .subscribe({
          next: () => {
            this.loadFeedingHistory();
            this.loadFeedingStats();
            this.loadStockAlerts();
            this.feedingForm.reset();
            this.cdr.markForCheck(); // Marquer pour la détection des changements
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout de l\'alimentation:', error);
          }
        });
    }
  }

  updateProgram(program: FeedingProgram) {
    if (program._id) {
      this.alimentationService.updateFeeding(program._id, program)
        .subscribe({
          next: () => {
            this.loadFeedingPrograms();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour du programme:', error);
          }
        });
    }
  }

  deleteProgram(index: number) {
    const program = this.feedingPrograms[index];
    if (program._id && confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      this.alimentationService.deleteFeeding(program._id)
        .subscribe({
          next: () => {
            this.feedingPrograms.splice(index, 1);
            this.loadFeedingPrograms();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du programme:', error);
          }
        });
    }
  }

  toggleFeedingSystem() {
    this.isFeedingSystemActive = !this.isFeedingSystemActive;

    if (this.isFeedingSystemActive) {
      // Démarrer la décrémentation en temps réel
      this.feedingInterval = setInterval(() => {
        this.foodTankLevel = Math.max(0, this.foodTankLevel - 1); // Décrémenter de 1% chaque seconde
        this.cdr.markForCheck(); // Forcer la mise à jour de l'interface
        console.log('Niveau du réservoir d\'aliments:', this.foodTankLevel);

        // Arrêter l'intervalle si le réservoir est vide
        if (this.foodTankLevel <= 0) {
          clearInterval(this.feedingInterval);
          this.isFeedingSystemActive = false; // Désactiver le système
          console.log('Réservoir d\'aliments vide. Système désactivé.');
        }
      }, 1000); // Décrémenter toutes les secondes
    } else {
      // Arrêter la décrémentation
      if (this.feedingInterval) {
        clearInterval(this.feedingInterval);
      }
    }

    this.cdr.markForCheck();
  }

  toggleWaterSystem() {
    this.isWaterSystemActive = !this.isWaterSystemActive;

    if (this.isWaterSystemActive) {
      // Démarrer la décrémentation en temps réel
      this.waterInterval = setInterval(() => {
        this.waterTankLevel = Math.max(0, this.waterTankLevel - 1); // Décrémenter de 1% chaque seconde
        this.cdr.markForCheck(); // Forcer la mise à jour de l'interface
        console.log('Niveau du réservoir d\'eau:', this.waterTankLevel);

        // Arrêter l'intervalle si le réservoir est vide
        if (this.waterTankLevel <= 0) {
          clearInterval(this.waterInterval);
          this.isWaterSystemActive = false; // Désactiver le système
          console.log('Réservoir d\'eau vide. Système désactivé.');
        }
      }, 1000); // Décrémenter toutes les secondes
    } else {
      // Arrêter la décrémentation
      if (this.waterInterval) {
        clearInterval(this.waterInterval);
      }
    }

    this.cdr.markForCheck();
  }

  distributeFoodNow() {
    if (this.isFeedingSystemActive) {
      const newFeeding: Feeding = {
        quantity: this.feedingQuantity,
        feedType: 'grain',
        automaticFeeding: false,
        createdAt: new Date(),
        notes: 'Manual distribution'
      };

      this.alimentationService.addFeeding(newFeeding)
        .subscribe({
          next: () => {
            this.loadFeedingHistory();
            this.updateFeedingStatus();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la distribution:', error);
          }
        });
    }
  }

  calculateAutonomy(stock: number | undefined): number {
    if (stock === undefined) {
      return 0; // Retourne une valeur par défaut si stock est undefined
    }
    // Implémentez la logique pour calculer l'autonomie
    return stock / 10; // Exemple simplifié
  }

  trackByFn(index: number, item: any): any {
    return index; // ou retournez un identifiant unique de l'élément (ex: item._id)
  }

  trackByStockFn(index: number, item: StockAlert): string {
    return item._id || index.toString(); // Retourne l'ID de l'alerte ou l'index si l'ID n'existe pas
  }

  updateLastFeedingTime() {
    if (this.feedingHistory.length > 0) {
      // Récupérer la dernière distribution
      const lastFeeding = this.feedingHistory[0];
      this.lastFeedingTime = new Date(lastFeeding.createdAt!)
        .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      this.lastFeedingTime = '--:--'; // Aucune distribution enregistrée
    }
    this.cdr.markForCheck(); // Marquer pour la détection des changements
  }

  updateNextFeedingTime() {
    const now = new Date();
  
    // Trouver la prochaine distribution programmée
    const nextProgram = this.feedingPrograms.find(program => {
      const [hours, minutes] = program.programStartTime.split(':');
      const programTime = new Date();
      programTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return programTime > now;
    });
  
    if (nextProgram) {
      this.nextFeedingTime = nextProgram.programStartTime;
    } else {
      this.nextFeedingTime = '--:--'; // Aucune distribution programmée
    }
    this.cdr.markForCheck(); // Marquer pour la détection des changements
  }
}