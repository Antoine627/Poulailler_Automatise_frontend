import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlimentationService, Feeding, FeedingStats, StockAlert } from '../../services/alimentation.service';
import { FeedingType } from '../../models/alimentation';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface FeedingProgram {
  quantity: number;
  programStartTime: string;
  programEndTime: string;
  _id?: string;
}

@Component({
  selector: 'app-feeding-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './feeding-management.component.html',
  styleUrls: ['./feeding-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush // Use OnPush change detection
})
export class FeedingManagementComponent implements OnInit, OnDestroy {
  feedingPrograms: FeedingProgram[] = [];
  feedingForm!: FormGroup;
  feedingHistory: Feeding[] = [];
  feedingStats: FeedingStats[] = [];
  stockAlerts: StockAlert[] = [];
  startDate: string;
  endDate: string;
  isFeedingSystemActive: boolean = true;
  lastFeedingTime: string = '';
  nextFeedingTime: string = '';
  foodTankLevel: number = 35;
  feedingQuantity: number = 5;
  feedingSchedule: string[] = ['08:00', '16:00'];
  isAutoMode: boolean = true;
  isWaterSystemActive: boolean = true;
  waterTankLevel: number = 85;
  dailyFoodConsumption: number = 0;
  dailyWaterConsumption: number = 0;
  dailyDistributions: number = 0;
  feedTypes: FeedingType[] = [];
  private updateInterval: any;

  constructor(
    private fb: FormBuilder,
    private alimentationService: AlimentationService
  ) {
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
  }

  loadFeedingHistory() {
    const params = {
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      limit: 50 // Limit the number of results
    };

    this.alimentationService.getFeedingHistory(params)
      .subscribe({
        next: (history) => {
          this.feedingHistory = history;
          this.updateFeedingStatus();
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
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      });
  }

  loadStockAlerts() {
    this.alimentationService.getAlertLowStock()
      .subscribe(alerts => {
        this.stockAlerts = alerts;
      });
  }

  loadFeedingPrograms() {
    this.alimentationService.getFeedingHistory({ limit: 50 }) // Limit the results
      .subscribe((feedings: Feeding[]) => {
        this.feedingPrograms = feedings
          .filter(feeding => feeding.programStartTime && feeding.programEndTime)
          .map(feeding => ({
            quantity: feeding.quantity,
            programStartTime: feeding.programStartTime!,
            programEndTime: feeding.programEndTime!,
            _id: feeding._id
          }));
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
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du programme:', error);
          }
        });
    }
  }

  toggleFeedingSystem() {
    this.isFeedingSystemActive = !this.isFeedingSystemActive;
  }

  toggleWaterSystem() {
    this.isWaterSystemActive = !this.isWaterSystemActive;
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
          },
          error: (error) => {
            console.error('Erreur lors de la distribution:', error);
          }
        });
    }
  }

  calculateAutonomy(currentStock: number): number {
    const averageDailyConsumption = this.dailyFoodConsumption || 1;
    return Math.floor(currentStock / averageDailyConsumption);
  }
}
