import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AlimentationService, Feeding } from '../../services/alimentation.service';
import { StockService } from '../../services/stock.service';
import { Stock } from '../../models/stock.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-feeding-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './feeding-schedule.component.html',
  styleUrls: ['./feeding-schedule.component.css']
})
export class FeedingScheduleComponent implements OnInit {
  @ViewChild('addModal') addModal!: TemplateRef<any>;

  nourritures: Feeding[] = [];
  eau: Feeding[] = [];
  stocks: Stock[] = [];
  newStartTime: string = '';
  newEndTime: string = '';
  newQuantity: number = 0;
  newFeedType: string = '';
  newNotes: string = '';
  newAutomaticFeeding: boolean = true;
  newProgramStartTime: string = '';
  newProgramEndTime: string = '';
  newStockId: string = ''; // Ajouté pour l'ID du stock
  currentSection: string = '';
  editIndex: number | null = null;

  showNotificationBar = false; // Pour afficher ou masquer la barre de notification
  notificationMessage = '';    // Message à afficher
  notificationType = '';       // Type de notification (success, error, info)

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private alimentationService: AlimentationService,
    private stockService: StockService,
    private dialog: MatDialog 
  ) {}

  ngOnInit() {
    this.loadFeedings();
    this.loadStocks();
  }

  loadFeedings() {
    this.alimentationService.getAllFeedings().subscribe(
      (feedings: Feeding[]) => {
        // Séparer les programmes entre nourriture et eau
        this.nourritures = feedings.filter(feeding => feeding.feedType !== 'eau');
        this.eau = feedings.filter(feeding => feeding.feedType === 'eau');
      },
      error => {
        console.error('Erreur lors du chargement des programmes:', error);
      }
    );
  }


  loadStocks() {
    this.stockService.getAllStocks().subscribe(
      (stocks: Stock[]) => {
        this.stocks = stocks; // Assurez-vous que cette propriété est définie dans le composant
      },
      error => {
        console.error('Erreur lors du chargement des stocks:', error);
      }
    );
  }


  // Méthode pour afficher une notification
  showCustomNotification(message: string, type: 'success' | 'error' | 'info') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationBar = true;

    // Fermer automatiquement la notification après 3 secondes
    setTimeout(() => {
      this.showNotificationBar = false;
    }, 3000);
  }

  // Méthode pour afficher une notification (alias pour compatibilité)
  showNotification(message: string, type: 'success' | 'error' | 'info') {
    this.showCustomNotification(message, type);
  }

  openAddModal(section: string, content: TemplateRef<any>, index: number | null = null) {
    this.currentSection = section;
    this.editIndex = index;

    if (index !== null) {
      const programs = section === 'nourritures' ? this.nourritures : this.eau;
      const program = programs[index];
      this.newProgramStartTime = program.programStartTime || '';
      this.newProgramEndTime = program.programEndTime || '';
      this.newQuantity = program.quantity;
      this.newFeedType = program.feedType;
      this.newNotes = program.notes || '';
      this.newAutomaticFeeding = program.automaticFeeding || true;
      this.newStockId = program.stockId || ''; // Remplir l'ID du stock si disponible
    } else {
      this.resetForm();
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        this.resetForm();
      },
      () => {
        this.resetForm();
      }
    );
  }

  saveProgram() {
    if (this.newProgramStartTime && this.newProgramEndTime && this.newQuantity && this.newFeedType) {
      const newProgram: Feeding = {
        quantity: this.newQuantity,
        feedType: this.currentSection === 'eau' ? 'eau' : this.newFeedType,
        notes: this.newNotes,
        automaticFeeding: this.newAutomaticFeeding,
        programStartTime: this.newProgramStartTime,
        programEndTime: this.newProgramEndTime,
        stockId: this.newStockId,
      };
  
      if (this.editIndex !== null) {
        // Mettre à jour un programme existant
        const programs = this.currentSection === 'nourritures' ? this.nourritures : this.eau;
        this.alimentationService.updateFeeding(programs[this.editIndex]._id!, newProgram).subscribe({
          next: () => {
            this.showCustomNotification('Programme mis à jour avec succès', 'success');
            this.loadFeedings();
            this.modalService.dismissAll();
  
            // Décrémenter le stock d'eau si le programme concerne l'eau
            if (newProgram.feedType === 'eau') {
              this.decrementWaterStock(newProgram.quantity);
            }
          },
          error: (error) => {
            this.showCustomNotification('Erreur lors de la mise à jour du programme', 'error');
            console.error('Erreur lors de la mise à jour:', error);
          },
        });
      } else {
        // Ajouter un nouveau programme
        this.alimentationService.addFeeding(newProgram).subscribe({
          next: () => {
            this.showCustomNotification('Programme ajouté avec succès', 'success');
            this.loadFeedings();
            this.modalService.dismissAll();
  
            // Décrémenter le stock d'eau si le programme concerne l'eau
            if (newProgram.feedType === 'eau') {
              this.decrementWaterStock(newProgram.quantity);
            }
          },
          error: (error) => {
            this.showCustomNotification('Erreur lors de l\'ajout du programme', 'error');
            console.error('Erreur lors de l\'ajout:', error);
          },
        });
      }
  
      this.resetForm();
    }
  }

 

  editProgram(section: string, index: number) {
    try {
      // Ouvrir le modal d'édition
      this.openAddModal(section, this.addModal, index);
  
      // Afficher un message de succès
      this.showCustomNotification('Programme chargé pour modification', 'success');
    } catch (error) {
      // En cas d'erreur, afficher un message d'erreur
      this.showCustomNotification('Erreur lors du chargement du programme', 'error');
      console.error('Erreur lors de l\'édition du programme :', error);
    }
  }

  deleteProgram(section: string, index: number) {
    const programs = section === 'nourritures' ? this.nourritures : this.eau;
    const program = programs[index];
  
    // Ouvrir la boîte de dialogue de confirmation
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: `Êtes-vous sûr de vouloir supprimer ce programme ?`,
      },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Si l'utilisateur confirme la suppression
        this.alimentationService.deleteFeeding(program._id!).subscribe({
          next: () => {
            this.showCustomNotification('Programme supprimé avec succès', 'success');
            this.loadFeedings(); // Recharger les données après la suppression
          },
          error: (error) => {
            this.showCustomNotification('Erreur lors de la suppression du programme', 'error');
            console.error('Erreur lors de la suppression:', error);
          },
        });
      }
    });
  }

  navigateToAlimentation() {
    this.router.navigate(['/stocks']);
  }

  private resetForm() {
    this.newProgramStartTime = '';
    this.newProgramEndTime = '';
    this.newQuantity = 0;
    this.newFeedType = '';
    this.newNotes = '';
    this.newAutomaticFeeding = true;
    this.newStockId = ''; // Réinitialiser l'ID du stock
    this.editIndex = null;
  }


  onFeedTypeChange(event: any) {
    // Implémentez la logique de gestion du changement de type de nourriture ici
    this.newFeedType = event.target.value; // Exemple de mise à jour de la propriété newFeedType
  }

  decrementWaterStock(quantityUsed: number) {
    this.stockService.getAllStocks().subscribe({
      next: (stocks) => {
        const waterStock = stocks.find(stock => stock.type === 'eau'); // Trouver le stock d'eau
  
        if (waterStock) {
          if (waterStock.quantity >= quantityUsed) {
            waterStock.quantity -= quantityUsed; // Décrémenter la quantité d'eau
  
            // Mettre à jour le stock d'eau dans la base de données
            this.stockService.updateStock(waterStock._id!, waterStock).subscribe({
              next: () => {
                this.showCustomNotification('Stock d\'eau mis à jour avec succès', 'success');
              },
              error: (error) => {
                this.showCustomNotification('Erreur lors de la mise à jour du stock d\'eau', 'error');
                console.error('Erreur lors de la mise à jour du stock d\'eau :', error);
              },
            });
          } else {
            this.showCustomNotification('Stock d\'eau insuffisant', 'error');
          }
        } else {
          this.showCustomNotification('Stock d\'eau introuvable', 'error');
        }
      },
      error: (error) => {
        this.showCustomNotification('Erreur lors du chargement des stocks', 'error');
        console.error('Erreur lors du chargement des stocks :', error);
      },
    });
  }
}
