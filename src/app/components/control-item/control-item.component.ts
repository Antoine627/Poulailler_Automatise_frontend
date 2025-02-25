import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock, faSync, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { StockService } from '../../services/stock.service';
import { Subscription, timer, interval } from 'rxjs';
import { switchMap, catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';

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
  imports: [CommonModule, FontAwesomeModule]
})
export class ControlItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() title: string = '';
  @Input() type: string = ''; // Type dynamique
  @Input() value: number = 0;
  @Input() unit: string = '';
  @Input() status: string = '';
  @Input() isActive: boolean = false;
  @Input() stockId: string = '';
  @Input() requiresStock: boolean = false;
  @Input() isToggleable: boolean = true;
  @Input() refreshInterval: number = 30000; // 30 secondes par défaut

  currentValue: number = 0;
  initialValue: number = 0;
  private decrementInterval: any;
  private refreshSubscription: Subscription | null = null;
  private subscriptions: Subscription[] = [];
  
  // Icônes
  faClock = faClock;
  faSync = faSync;
  faExclamationTriangle = faExclamationTriangle;
  
  // États
  isLoading: boolean = false;
  isRefreshing: boolean = false;
  errorMessage: string = '';
  lastRefresh: Date | null = null;
  ControlStatus = ControlStatus; // Pour pouvoir utiliser l'enum dans le template

  constructor(private stockService: StockService) {}

  ngOnInit() {
    this.updateCurrentValue();
    console.log(`Init ${this.title} - type: ${this.type}, value: ${this.value}, unit: ${this.unit}, currentValue: ${this.currentValue}, stockId: ${this.stockId}`);
    
    if (!this.stockId && this.requiresStock) {
      this.loadStockIdByType();
    } else if (this.stockId && this.requiresStock) {
      this.refreshStockData();
      this.setupPeriodicRefresh();
    }
  }

  private loadStockIdByType() {
    this.isLoading = true;
    this.status = ControlStatus.LOADING;
    
    const subscription = this.stockService.getStocksByType(this.type).subscribe({
      next: (stocks) => {
        this.isLoading = false;
        if (stocks && stocks.length > 0) {
          const stock = stocks.sort((a, b) => b.quantity - a.quantity)[0];
          this.stockId = stock._id;
          this.currentValue = stock.quantity;
          this.initialValue = stock.quantity;
          this.unit = stock.unit || this.unit;
          this.status = this.getStatusFromStock(stock);
          this.lastRefresh = new Date();
          console.log(`Stock trouvé pour ${this.type}: ID=${this.stockId}, quantity=${this.currentValue}`);
          
          // Maintenant qu'on a le stockId, on peut configurer le rafraîchissement périodique
          this.setupPeriodicRefresh();
        } else {
          this.errorMessage = `Aucun stock de type "${this.type}" trouvé`;
          this.status = ControlStatus.NOT_FOUND;
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error(`Erreur lors de la récupération du stock de type ${this.type}:`, error);
        this.errorMessage = `Erreur: ${error.message || 'Impossible de récupérer le stock'}`;
        this.status = ControlStatus.ERROR;
      }
    });
    
    this.subscriptions.push(subscription);
  }

  private refreshStockData() {
    if (!this.stockId) return;
    
    this.isRefreshing = true;
    
    const subscription = this.stockService.updateStock(this.stockId, {})
      .pipe(
        // On utilise un appel vide pour obtenir les données à jour
        catchError(error => {
          console.error(`Erreur lors du rafraîchissement du stock ${this.stockId}:`, error);
          return of(null);
        }),
        finalize(() => {
          this.isRefreshing = false;
          this.lastRefresh = new Date();
        })
      )
      .subscribe(stock => {
        if (stock) {
          this.currentValue = stock.quantity;
          this.unit = stock.unit || this.unit;
          this.status = this.getStatusFromStock(stock);
          
          // Si on est actif mais qu'il n'y a plus de stock, on désactive
          if (this.isActive && this.currentValue <= 0) {
            this.isActive = false;
            this.stopDecrementInterval();
          }
        }
      });
    
    this.subscriptions.push(subscription);
  }

  private setupPeriodicRefresh() {
    // Arrêter tout rafraîchissement existant
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
    
    // Ne configurer que si nous avons un ID de stock
    if (this.stockId) {
      this.refreshSubscription = interval(this.refreshInterval)
        .subscribe(() => {
          // Ne pas rafraîchir si on est en train de décrémenter activement
          if (!this.isActive) {
            this.refreshStockData();
          }
        });
      
      this.subscriptions.push(this.refreshSubscription);
    }
  }

  private getStatusFromStock(stock: any): string {
    if (!stock) return ControlStatus.ERROR;
    
    if (stock.quantity <= 0) {
      return ControlStatus.NO_STOCK;
    } else if (stock.minQuantity && stock.quantity <= stock.minQuantity) {
      return ControlStatus.LOW_STOCK;
    } else if (this.isActive) {
      return `${ControlStatus.ACTIVE} (${stock.quantity} ${stock.unit} restant)`;
    } else {
      return ControlStatus.IDLE;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      this.updateCurrentValue();
      console.log(`Change detected ${this.title} - new value: ${this.value}, currentValue set to: ${this.currentValue}`);
    }
    
    if (changes['stockId'] && !changes['stockId'].firstChange) {
      console.log(`stockId changed to: ${this.stockId}`);
      this.refreshStockData();
      this.setupPeriodicRefresh();
    }
  }

  private updateCurrentValue() {
    this.currentValue = this.value || 0;
    this.initialValue = this.currentValue;
  }

  getImageUrl(): string {
    // Retourne l'URL de l'image en fonction du type
    if (this.type === 'feed') {
      return '/assets/images/feeder.png'; // Image pour la nourriture
    } else if (this.type === 'water') {
      return '/assets/images/drink.png'; // Image pour l'eau
    } else {
      return '/assets/images/default-control.png'; // Image par défaut
    }
  }

  toggleActive() {
    if (!this.isToggleable || this.isLoading) {
      return;
    }
    
    if (this.requiresStock && !this.isActive) {
      if ((this.currentValue <= 0 || !this.stockId)) {
        if (!this.stockId) {
          this.errorMessage = `Aucun stock de type "${this.type}" disponible`;
          this.status = ControlStatus.NOT_FOUND;
        } else {
          this.errorMessage = 'Stock épuisé';
          this.status = ControlStatus.NO_STOCK;
        }
        return;
      }
    }
    
    this.errorMessage = '';
    this.isActive = !this.isActive;

    if (this.requiresStock) {
      if (this.isActive && this.currentValue > 0) {
        this.startDecrementInterval();
      } else {
        this.stopDecrementInterval();
      }
    } else {
      // Pour les contrôles qui ne nécessitent pas de stock (comme la lumière)
      this.status = this.isActive ? ControlStatus.ACTIVE : ControlStatus.IDLE;
    }
  }
  
  private startDecrementInterval() {
    this.stopDecrementInterval(); // Nettoyer l'intervalle précédent
  
    this.status = `${ControlStatus.ACTIVE} (${this.currentValue} ${this.unit} restant)`;
  
    this.decrementInterval = setInterval(() => {
      if (this.currentValue > 0 && this.stockId) {
        this.decrementStockInDatabase();
      } else {
        this.stopDecrementInterval();
        this.isActive = false;
        this.status = this.stockId ? ControlStatus.NO_STOCK : ControlStatus.NOT_FOUND;
      }
    }, 5000); // Décrémente toutes les 5 secondes
  }
  
  private stopDecrementInterval() {
    if (this.decrementInterval) {
      clearInterval(this.decrementInterval);
      this.decrementInterval = null;
    }
    
    if (!this.isActive && this.requiresStock) {
      this.status = this.currentValue <= 0 ? ControlStatus.NO_STOCK : ControlStatus.IDLE;
    }
  }

  private decrementStockInDatabase() {
    if (!this.stockId) {
      console.error('Tentative de décrémentation sans stockId');
      this.errorMessage = 'Erreur: Aucun stock identifié';
      this.stopDecrementInterval();
      this.isActive = false;
      return;
    }
  
    if (this.currentValue <= 0) {
      console.error('Tentative de décrémentation avec un stock déjà épuisé');
      this.errorMessage = 'Erreur: Stock déjà épuisé';
      this.stopDecrementInterval();
      this.isActive = false;
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = '';
  
    console.log(`Décrémentation du stock ${this.stockId} en cours...`);
  
    const subscription = this.stockService.decrementStock(this.stockId, 1)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log(`Stock ${this.stockId} décrémenté avec succès:`, response);
          
          // Mise à jour depuis la réponse du serveur
          if (response && response.stock) {
            this.currentValue = response.stock.quantity;
            this.unit = response.stock.unit || this.unit;
          } else {
            // Fallback si la réponse ne contient pas les informations attendues
            this.currentValue--;
          }
          
          this.status = `${ControlStatus.ACTIVE} (${this.currentValue} ${this.unit} restant)`;
  
          if (this.currentValue <= 0) {
            this.stopDecrementInterval();
            this.isActive = false;
            this.status = ControlStatus.NO_STOCK;
          }
        },
        error: (error) => {
          console.error(`Erreur lors de la décrémentation du stock ${this.stockId}:`, error);
  
          if (error.message.includes('Quantité insuffisante')) {
            this.errorMessage = 'Stock insuffisant';
            this.status = ControlStatus.NO_STOCK;
            // Rafraîchir pour obtenir la vraie valeur
            this.refreshStockData();
          } else if (error.message.includes('Ressource non trouvée')) {
            this.errorMessage = `Stock introuvable`;
            this.status = ControlStatus.NOT_FOUND;
          } else {
            this.errorMessage = error.message || 'Erreur de connexion';
            this.status = ControlStatus.ERROR;
          }
  
          this.stopDecrementInterval();
          this.isActive = false;
        }
      });
  
    this.subscriptions.push(subscription);
  }

  // Méthode pour forcer le rafraîchissement des données
  refreshData() {
    if (this.isRefreshing || !this.stockId) return;
    this.refreshStockData();
  }

  // Retourne le pourcentage de stock restant par rapport à la valeur initiale
  getStockPercentage(): number {
    if (this.initialValue <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((this.currentValue / this.initialValue) * 100)));
  }

  ngOnDestroy() {
    this.stopDecrementInterval();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  openModal() {
    console.log('Open scheduling modal');
  }
}