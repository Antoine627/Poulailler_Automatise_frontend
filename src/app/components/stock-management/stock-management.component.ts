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
import { StockDetailDialogComponent } from '../stock-detail-dialog/stock-detail-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
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
  editMode = false;
  currentStockId: string | null = null;
  showNotificationBar = false;
  notificationMessage = '';
  notificationType = '';
  waterQuantity: number = 0; // Niveau d'eau via capteur
  chartData: any[] = []; // Déclaration explicite de chartData

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
  
    // Charger les stocks (uniquement pour les aliments)
    this.stockService.getAllStocks().subscribe({
      next: (stocks) => {
        console.log('[StockManagementComponent] All stocks loaded:', stocks);
        this.dataSource.data = stocks.filter(stock => stock.type.toLowerCase() !== 'eau');
        this.prepareChartData(stocks);
        this.isLoading = false;
        if (container) {
          container.classList.remove('loading-animation');
          this.animateTableRows();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[StockManagementComponent] Error loading stocks:', error);
        this.showCustomNotification('Erreur lors du chargement des stocks', 'error');
        this.isLoading = false;
        if (container) {
          container.classList.remove('loading-animation');
        }
      }
    });
  
    // Charger les alertes de stock bas (incluant l'eau via capteur)
    this.stockService.getAlertLowStock().subscribe({
      next: (alerts: LowStockAlert[]) => {
        console.log('[StockManagementComponent] Low stock alerts loaded:', alerts);
        this.lowStockAlerts = alerts;
        setTimeout(() => this.animateAlerts(), 100);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[StockManagementComponent] Error loading alerts:', error);
        this.showCustomNotification('Erreur lors du chargement des alertes', 'error');
      }
    });
  
    // Charger les statistiques (uniquement pour les aliments)
    this.stockService.getStockStats().subscribe({
      next: (stats) => {
        console.log('[StockManagementComponent] Stock stats loaded:', stats);
        this.stockStats = stats;
        setTimeout(() => this.animateStats(), 100);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[StockManagementComponent] Error loading stats:', error);
        this.showCustomNotification('Erreur lors du chargement des statistiques', 'error');
      }
    });
  
    // Charger le niveau d'eau via le capteur
    this.stockService.getWaterTankLevel().subscribe({
      next: (data) => {
        console.log('[StockManagementComponent] Water tank level and quantity loaded:', data);
        this.waterQuantity = data.waterQuantity;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('[StockManagementComponent] Error loading water tank level:', error);
        this.showCustomNotification('Erreur lors du chargement du niveau d\'eau', 'error');
        this.waterQuantity = 0; // Valeur par défaut en cas d'erreur
      }
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
      .filter(category => category.toLowerCase() !== 'eau') // Exclure l'eau
      .map(category => {
        const categoryStocks = stocks.filter(stock => stock.category === category && stock.type.toLowerCase() !== 'eau');
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
  
    if (stockData.type.toLowerCase() === 'eau') {
      this.showCustomNotification('Les stocks d\'eau ne sont pas gérés manuellement, utilisez le capteur d\'eau.', 'error');
      return;
    }
  
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
    if (stock.type.toLowerCase() === 'eau') {
      this.showCustomNotification('Les stocks d\'eau ne peuvent pas être modifiés manuellement, utilisez le capteur d\'eau.', 'error');
      return;
    }
  
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
    if (stock.type.toLowerCase() === 'eau') {
      this.showCustomNotification('Les détails des stocks d\'eau ne sont pas disponibles manuellement, utilisez le capteur d\'eau.', 'info');
      return;
    }
  
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
    if (stock.type.toLowerCase() === 'eau') {
      this.showCustomNotification('Les stocks d\'eau ne peuvent pas être supprimés manuellement, utilisez le capteur d\'eau.', 'error');
      return;
    }
  
    console.log('Tentative de suppression du stock:', stock);
    const row = document.querySelector(`tr[data-id="${stock._id}"]`);
    if (row) {
      row.classList.add('shake-animation');
      setTimeout(() => {
        row.classList.remove('shake-animation');
        this.openDeleteDialog(stock);
      }, 300);
    } else {
      console.warn('Row not found for stock ID:', stock._id);
      this.openDeleteDialog(stock);
    }
  }
  
  openDeleteDialog(stock: Stock) {
    console.log('Ouvrir dialogue de suppression pour stock:', stock);
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
        console.log('Suppression confirmée pour stock ID:', stock._id);
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
            // Restaurer le focus sur un élément interactif après la fermeture
            const deleteButton = document.querySelector(`button[data-id="${stock._id}"]`) as HTMLElement;
            if (deleteButton) {
              deleteButton.focus();
            }
          },
          error: (error) => {
            if (error.status === 409) {
              this.showCustomNotification('Impossible de supprimer le stock car il n\'est pas vide.', 'error');
            } else if (error.status === 400) {
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
    if (stock.type.toLowerCase() === 'eau') {
      return 'normal'; // L'eau n'est pas gérée manuellement, donc pas d'alerte ici
    }
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
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationBar = true;
  
    setTimeout(() => {
      this.showNotificationBar = false;
    }, 3000);
  }

  showNotification(message: string, type: 'success' | 'error' | 'info') {
    this.showCustomNotification(message, type);
  }
}