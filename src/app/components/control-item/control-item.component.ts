import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faSync, faExclamationTriangle, faEdit, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { StockService } from '../../services/stock.service';
import { Subscription, interval } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EnvironmentalService, LightSchedule } from '../../services/environmental.service';
import { LightScheduleModalComponent } from '../light-schedule-modal/light-schedule-modal.component';

enum ControlStatus {
  IDLE = 'En attente',
  ACTIVE = 'Actif',
  ERROR = 'Erreur',
  LOW_STOCK = 'Stock bas',
  NO_STOCK = 'Stock épuisé',
  LOADING = 'Chargement...',
  NOT_FOUND = 'Stock introuvable'
}

@Component({
  selector: 'app-control-item',
  templateUrl: './control-item.component.html',
  styleUrls: ['./control-item.component.css'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, LightScheduleModalComponent]
})
export class ControlItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title: string = '';
  @Input() type: string = '';
  @Input() value: number = 0;
  @Input() unit: string = '';
  @Input() status: string = '';
  @Input() isActive: boolean = false;
  @Input() stockId: string = '';
  @Input() requiresStock: boolean = false;
  @Input() isToggleable: boolean = true;
  @Input() refreshInterval: number = 30000;

  currentValue: number = 0;
  initialValue: number = 0;
  private decrementInterval: any;
  private refreshSubscription: Subscription | null = null;
  private subscriptions: Subscription[] = [];

  // Icônes
  faClock = faClock;
  faSync = faSync;
  faExclamationTriangle = faExclamationTriangle;
  faEdit = faEdit;
  faPlus = faPlus;
  faTrash = faTrash;

  lightSchedule: LightSchedule | null = null;

  // États
  isLoading: boolean = false;
  isRefreshing: boolean = false;
  errorMessage: string = '';
  lastRefresh: Date | null = null;
  ControlStatus = ControlStatus;

  constructor(
    private stockService: StockService,
    private environmentalService: EnvironmentalService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.updateCurrentValue();
    if (!this.stockId && this.requiresStock) {
      this.loadStockIdByType();
    } else if (this.stockId && this.requiresStock) {
      this.refreshStockData();
      this.setupPeriodicRefresh();
    }

    if (this.type === 'light') {
      this.loadLightSchedule();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.updateCurrentValue();
    }
    if (changes['stockId'] && !changes['stockId'].firstChange) {
      this.refreshStockData();
      this.setupPeriodicRefresh();
    }
  }

  ngOnDestroy() {
    this.stopDecrementInterval();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadLightSchedule() {
    this.environmentalService.getLightSchedule().subscribe(
      (schedule) => {
        this.lightSchedule = schedule;
      },
      (error) => {
        console.error('Erreur lors du chargement du programme de lumière:', error);
        this.errorMessage = 'Erreur lors du chargement de la programmation';
      }
    );
  }

  deleteLightSchedule() {
    this.environmentalService.deleteLightSchedule().subscribe(
      () => {
        this.lightSchedule = null;
        this.showNotification('Programmation de l\'éclairage supprimée', 'success');
      },
      (error) => {
        console.error('Erreur lors de la suppression de la programmation:', error);
        this.showNotification('Erreur lors de la suppression', 'error');
      }
    );
  }

  openModal(lightSchedule?: LightSchedule) {
    if (this.type === 'light') {
      this.openLightScheduleModal(lightSchedule);
    }
  }

  openLightScheduleModal(lightSchedule?: LightSchedule) {
    const modalRef = this.modalService.open(LightScheduleModalComponent, {
      size: 'lg',
      backdrop: 'static'
    });

    modalRef.componentInstance.title = 'Programmer l\'éclairage';
    modalRef.componentInstance.lightSchedule = lightSchedule || this.lightSchedule;

    modalRef.result.then((result: LightSchedule) => {
      if (result) {
        this.saveLightSchedule(result);
      }
    }).catch(() => {
      // Modal fermé sans action
    });
  }

  saveLightSchedule(schedule: LightSchedule) {
    this.isLoading = true;
    this.errorMessage = '';

    // Vérifier que startTime et endTime ne sont pas null
    if (!schedule.startTime || !schedule.endTime) {
      this.errorMessage = 'Les heures de début et de fin sont requises';
      this.isLoading = false;
      return;
    }

    // Valider le format des heures
    if (!this.validateTimeFormat(schedule.startTime) || !this.validateTimeFormat(schedule.endTime)) {
      this.errorMessage = 'Format d\'heure invalide (HH:MM requis)';
      this.isLoading = false;
      return;
    }

    // Vérifier que l'heure de fin est postérieure à l'heure de début
    if (schedule.startTime >= schedule.endTime) {
      this.errorMessage = 'L\'heure de fin doit être postérieure à l\'heure de début';
      this.isLoading = false;
      return;
    }

    // Envoyer les données au backend
    this.environmentalService.scheduleLightingControl(
      schedule.startTime,
      schedule.endTime,
      schedule.enabled
    ).subscribe({
      next: (response) => {
        this.lightSchedule = schedule;
        this.isLoading = false;
        this.showNotification('Programmation enregistrée avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la programmation de l\'éclairage:', error);
        this.errorMessage = error.error?.error || 'Erreur lors de la programmation';
        this.isLoading = false;
        this.showNotification(this.errorMessage, 'error');
      }
    });
  }

  validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
  }

  showNotification(message: string, type: 'success' | 'error' | 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // Implémentation réelle de notification si nécessaire
  }

  // Méthodes pour les autres types (avec valeurs de retour explicites)
  private updateCurrentValue() {
    this.currentValue = this.value || 0;
    this.initialValue = this.currentValue;
  }

  private loadStockIdByType() { /* ... implémentation existante ... */ }

  private refreshStockData() { /* ... implémentation existante ... */ }

  private setupPeriodicRefresh() { /* ... implémentation existante ... */ }

  private getStatusFromStock(stock: any): string {
    if (!stock) return ControlStatus.ERROR;
    if (stock.quantity <= 0) return ControlStatus.NO_STOCK;
    if (stock.minQuantity && stock.quantity <= stock.minQuantity) return ControlStatus.LOW_STOCK;
    return this.isActive ? `${ControlStatus.ACTIVE} (${stock.quantity} ${stock.unit} restant)` : ControlStatus.IDLE;
  }

  toggleActive() { /* ... implémentation existante ... */ }

  private startDecrementInterval() { /* ... implémentation existante ... */ }

  private stopDecrementInterval() { /* ... implémentation existante ... */ }

  private decrementStockInDatabase() { /* ... implémentation existante ... */ }

  refreshData() { /* ... implémentation existante ... */ }

  getStockPercentage(): number {
    if (this.initialValue <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((this.currentValue / this.initialValue) * 100)));
  }

  getImageUrl(): string {
    if (this.type === 'feed') return '/assets/images/feeder.png';
    if (this.type === 'water') return '/assets/images/drink.png';
    return '/assets/images/default-control.png';
  }
}