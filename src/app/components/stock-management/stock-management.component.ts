import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { Stock, StockStats, LowStockAlert } from './../../models/stock.model';
import { StockService } from '../../services/stock.service';
import { StockDetailDialogComponent } from './../stock-detail-dialog/stock-detail-dialog.component';
import { ConfirmDialogComponent } from './../confirm-dialog/confirm-dialog.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-stock-management',
  templateUrl: './stock-management.component.html',
  styleUrls: ['./stock-management.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SidebarComponent,
    HeaderComponent,
    MatPaginatorModule,
    MatTableModule
  ]
})
export class StockManagementComponent implements OnInit {
  displayedColumns: string[] = ['type', 'quantity', 'unit', 'lastUpdated', 'status', 'actions'];
  dataSource = new MatTableDataSource<Stock>();
  stockForm: FormGroup;
  stockStats: StockStats[] = [];
  lowStockAlerts: LowStockAlert[] = []; 
  isLoading = false;
  // lowStockAlerts: Stock[] = [];
  chartData: any[] = [];
  editMode = false;
  currentStockId: string | null = null;
  showNotificationBar = false;
  notificationMessage = '';
  notificationType = '';
  waterQuantity: number = 100;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private stockService: StockService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    this.stockForm = this.fb.group({
      type: ['', [Validators.required, Validators.minLength(3)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      unit: ['kg', Validators.required],
      category: ['nourriture', Validators.required],
      minQuantity: [10, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadAllData();
    this.addRowAnimationHandlers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  addRowAnimationHandlers() {
    document.addEventListener('DOMContentLoaded', () => {
      // Ajout d'animations au survol des lignes du tableau
      const rows = document.querySelectorAll('.table tbody tr');
      rows.forEach(row => {
        row.addEventListener('mouseenter', () => {
          row.classList.add('row-hover-animation');
        });
        row.addEventListener('mouseleave', () => {
          row.classList.remove('row-hover-animation');
        });
      });

      // Animation pour les éléments stat-item
      const statItems = document.querySelectorAll('.stat-item');
      statItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          item.classList.add('stat-item-hover');
        });
        item.addEventListener('mouseleave', () => {
          item.classList.remove('stat-item-hover');
        });
      });
    });
  }

  loadAllData() {
    this.isLoading = true;
  
    const container = document.querySelector('.stock-dashboard-container');
    if (container) {
      container.classList.add('loading-animation');
    }
  
    // Charger les stocks
    this.stockService.getAllStocks().subscribe({
      next: (stocks) => {
        this.dataSource.data = stocks;
        this.prepareChartData(stocks);
  
        // Récupérer le stock d'eau
        const waterStock = stocks.find(stock => stock.type === 'eau');
        if (waterStock) {
          this.waterQuantity = waterStock.quantity; // Assigner la quantité d'eau
        } else {
          this.waterQuantity = 0; // Valeur par défaut si aucun stock d'eau n'est trouvé
          this.showCustomNotification('Aucun stock d\'eau trouvé', 'info');
        }
  
        this.isLoading = false;
        if (container) {
          container.classList.remove('loading-animation');
          this.animateTableRows();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.showCustomNotification('Erreur lors du chargement des stocks', 'error');
        this.isLoading = false;
        if (container) {
          container.classList.remove('loading-animation');
        }
      }
    });
  
    // Charger les alertes de stock bas
    this.stockService.getAlertLowStock().subscribe({
      next: (alerts: LowStockAlert[]) => { // Typer la réponse comme LowStockAlert[]
        this.lowStockAlerts = alerts.filter(alert => alert.currentStock < alert.minQuantity);
        setTimeout(() => this.animateAlerts(), 100);
        this.cdr.markForCheck();
      },
      error: (error) => this.showCustomNotification('Erreur lors du chargement des alertes', 'error')
    });
  
    // Charger les statistiques
    this.stockService.getStockStats().subscribe({
      next: (stats) => {
        this.stockStats = stats;
        setTimeout(() => this.animateStats(), 100);
        this.cdr.markForCheck();
      },
      error: (error) => this.showCustomNotification('Erreur lors du chargement des statistiques', 'error')
    });
  }


  
  animateTableRows() {
    const rows = document.querySelectorAll('.table tbody tr');
    rows.forEach((row, index) => {
      setTimeout(() => {
        row.classList.add('fade-in-row');
      }, index * 50);
    });
  }

  animateStats() {
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('fade-in-stats');
      }, index * 100);
    });
  }

  animateAlerts() {
    const alertItems = document.querySelectorAll('.alert-item');
    alertItems.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('slide-in-right');
      }, index * 100);
    });
  }

  prepareChartData(stocks: Stock[]) {
    const categories = [...new Set(stocks.map(stock => stock.category))];
  
    this.chartData = categories
      .filter(category => category !== 'eau') // Exclure l'eau
      .map(category => {
        const categoryStocks = stocks.filter(stock => stock.category === category);
        const totalQuantity = categoryStocks.reduce((sum, stock) => sum + stock.quantity, 0);
  
        return {
          name: category,
          value: totalQuantity
        };
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }

    // Animation pour feedback visuel de la filtration
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
      tableContainer.classList.add('filter-animation');
      setTimeout(() => {
        tableContainer.classList.remove('filter-animation');
      }, 300);
    }
  }

  onSubmit() {
    if (this.stockForm.invalid) {
      console.error('Formulaire invalide', this.stockForm.value);
      return;
    }
  
    const stockData = {
      type: this.stockForm.value.type.trim(),
      quantity: Number(this.stockForm.value.quantity),
      unit: this.stockForm.value.unit.trim(),
      category: this.stockForm.value.category.trim(),
      minQuantity: Number(this.stockForm.value.minQuantity)
    };
  
    console.log('Données envoyées:', stockData); // Afficher les données dans la console
  
    this.isLoading = true;
  
    if (this.editMode && this.currentStockId) {
      this.stockService.updateStock(this.currentStockId, stockData).subscribe({
        next: (stock) => {
          this.showCustomNotification('Stock mis à jour avec succès', 'success');
          this.resetForm();
          this.loadAllData();
        },
        error: (error) => {
          this.showCustomNotification(`Erreur lors de la mise à jour: ${error.message}`, 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.stockService.addStock(stockData).subscribe({
        next: (stock) => {
          this.showCustomNotification('Stock ajouté avec succès', 'success');
          this.resetForm();
          this.loadAllData();
        },
        error: (error) => {
          this.showCustomNotification(`Erreur lors de l'ajout: ${error.message}`, 'error');
          this.isLoading = false;
        }
      });
    }
  }
  
  

  editStock(stock: Stock) {
    this.editMode = true;
    this.currentStockId = stock._id || null;
    this.stockForm.setValue({
      type: stock.type,
      quantity: stock.quantity,
      unit: stock.unit,
      category: stock.category,
      minQuantity: stock.minQuantity
    });

    // Animation de mise en évidence du formulaire
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.classList.add('highlight-animation');
      setTimeout(() => {
        formCard.classList.remove('highlight-animation');
      }, 1000);
    }
  }

  viewStockDetails(stock: Stock) {
    // Animation avant d'ouvrir la boîte de dialogue
    const row = document.querySelector(`tr[data-id="${stock._id}"]`);
    if (row) {
      row.classList.add('pulse-animation');
      setTimeout(() => {
        row.classList.remove('pulse-animation');
        this.dialog.open(StockDetailDialogComponent, {
          width: '600px',
          data: { stock }
        });
      }, 300);
    } else {
      this.dialog.open(StockDetailDialogComponent, {
        width: '600px',
        data: { stock }
      });
    }
  }

  deleteStock(stock: Stock) {
    const row = document.querySelector(`tr[data-id="${stock._id}"]`);
    if (row) {
      row.classList.add('shake-animation');
      setTimeout(() => {
        row.classList.remove('shake-animation');
        this.openDeleteDialog(stock);
      }, 300);
    } else {
      this.openDeleteDialog(stock);
    }
  }
  
  openDeleteDialog(stock: Stock) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer ${stock.type} ?`,
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler'
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && stock._id) {
        this.isLoading = true;
        this.stockService.deleteStock(stock._id).subscribe({
          next: () => {
            this.showCustomNotification('Stock supprimé avec succès', 'success');
  
            const row = document.querySelector(`tr[data-id="${stock._id}"]`);
            if (row) {
              row.classList.add('fade-out-row');
              setTimeout(() => {
                this.loadAllData();
              }, 300);
            } else {
              this.loadAllData();
            }
          },
          error: (error) => {
            // Gestion spécifique pour un stock non vide
            if (error.status === 409) {
              this.showCustomNotification('Impossible de supprimer le stock car il n\'est pas vide.', 'error');
            }
            // Autres cas d'erreur
            else if (error.status === 400) {
              this.showCustomNotification(error.error.message || 'Données invalides', 'error');
            } else if (error.status === 404) {
              this.showCustomNotification('Le stock que vous essayez de supprimer n\'existe pas.', 'error');
            } else if (error.status === 401) {
              this.showCustomNotification('Vous n\'êtes pas autorisé à effectuer cette action.', 'error');
            } else {
              this.showCustomNotification(`Une erreur s'est produite : ${error.message}`, 'error');
            }
  
            this.isLoading = false;
            console.error('Erreur détaillée:', error);
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      }
    });
  }

  resetForm() {
    this.stockForm.reset({
      type: '',
      quantity: 0,
      unit: 'kg',
      category: 'nourriture',
      minQuantity: 10
    });
    this.editMode = false;
    this.currentStockId = null;
    this.isLoading = false;

    // Animation de réinitialisation du formulaire
    const formCard = document.querySelector('.form-card');
    if (formCard) {
      formCard.classList.add('reset-animation');
      setTimeout(() => {
        formCard.classList.remove('reset-animation');
      }, 300);
    }
  }

  getStockStatus(stock: Stock): string {
    if (stock.quantity <= 0) {
      return 'rupture';
    } else if (stock.quantity < stock.minQuantity) {
      return 'bas';
    } else {
      return 'normal';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'rupture': return 'status-out';
      case 'bas': return 'status-low';
      case 'normal': return 'status-normal';
      default: return '';
    }
  }

  showCustomNotification(message: string, type: 'success' | 'error' | 'info') {
    // Afficher une notification à l'utilisateur
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationBar = true;
  
    // Fermer automatiquement la notification après 3 secondes
    setTimeout(() => {
      this.showNotificationBar = false;
    }, 3000);
  }

  // On conserve la méthode originale pour compatibilité
  showNotification(message: string, type: 'success' | 'error' | 'info') {
    this.showCustomNotification(message, type);
  }
  
}