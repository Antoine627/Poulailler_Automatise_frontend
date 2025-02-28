import { Component, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AlimentationService, Feeding, Notification } from '../../services/alimentation.service';
import { StockService } from '../../services/stock.service';
import { Stock } from '../../models/stock.model';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { Subscription, interval, forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Component({
  selector: 'app-feeding-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './feeding-schedule.component.html',
  styleUrls: ['./feeding-schedule.component.css']
})
export class FeedingScheduleComponent implements OnInit, OnDestroy {
  @ViewChild('addModal') addModal!: TemplateRef<any>;
  @ViewChild('alertModal') alertModal!: TemplateRef<any>;

  nourritures: Feeding[] = [];
  eau: Feeding[] = [];
  stocks: Stock[] = [];
  notifications: Notification[] = [];

  filteredStocks: Stock[] = [];

  
  newStartTime: string = '';
  newEndTime: string = '';
  newQuantity: number = 0;
  // newFeedType: string = '';
  newNotes: string = '';
  newAutomaticFeeding: boolean = true;
  newProgramStartTime: string = '';
  newProgramEndTime: string = '';
  newStockId: string = '';
  currentSection: string = '';
  editIndex: number | null = null;
  
  checkSubscription: Subscription | null = null;
  notificationSubscription: Subscription | null = null;
  CHECK_INTERVAL: number = 60000; // 1 minute
  NOTIFICATION_CHECK_INTERVAL: number = 300000; // 5 minutes

  showNotificationBar = false;
  notificationMessage = '';
  notificationType = '';

  currentStockQuantity: number | null = null;
  currentStockUnit: string = '';
  isStockInsufficient: boolean = false;
  lowStockAlerts: Stock[] = [];

  @ViewChild('addModalNourriture') addModalNourriture!: TemplateRef<any>;
  @ViewChild('addModalEau') addModalEau!: TemplateRef<any>;

  filteredNourritureStocks: Stock[] = [];
  filteredEauStocks: Stock[] = [];

  currentTimeString: string = '';
  timeErrors: { startTime: string | null, endTime: string | null } = { 
    startTime: null, 
    endTime: null 
  };

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
    this.checkLowStocks();
    this.loadUnreadNotifications();
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 60000);
    
    // Démarrer les vérifications périodiques
    this.startProgramCheck();
    this.startNotificationCheck();
  }

  updateCurrentTime() {
    const now = new Date();
    this.currentTimeString = this.formatTimeString(now);
  }


  validateTimeInputs() {
    this.timeErrors = { startTime: null, endTime: null };
    
    // Obtenir l'heure actuelle
    const now = new Date();
    const currentTimeStr = this.formatTimeString(now);
    
    // Valider l'heure de début
    if (this.newProgramStartTime) {
      // Vérifier si l'heure de début est déjà passée aujourd'hui
      if (this.newProgramStartTime < currentTimeStr) {
        this.timeErrors.startTime = "L'heure de début ne peut pas être antérieure à l'heure actuelle";
      }
    }
    
    // Valider l'heure de fin
    if (this.newProgramStartTime && this.newProgramEndTime) {
      // Vérifier que l'heure de fin est postérieure à l'heure de début
      if (this.newProgramEndTime <= this.newProgramStartTime) {
        this.timeErrors.endTime = "L'heure de fin doit être postérieure à l'heure de début";
      }
      
      // Vérifier que l'heure de fin n'est pas déjà passée
      if (this.newProgramEndTime < currentTimeStr) {
        this.timeErrors.endTime = "L'heure de fin ne peut pas être antérieure à l'heure actuelle";
      }
    }
    
    return !this.timeErrors.startTime && !this.timeErrors.endTime;
  }

  ngOnDestroy() {
    // Se désabonner de tous les observables
    if (this.checkSubscription) {
      this.checkSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // Démarrer la vérification périodique des programmes
  startProgramCheck() {
    this.checkExpiredPrograms();
    this.checkUpcomingPrograms();
    this.alimentationService.checkFeedingReminders().subscribe();

    this.checkSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkExpiredPrograms();
      this.checkUpcomingPrograms();
      this.alimentationService.checkFeedingReminders().subscribe();
    });
  }

  // Démarrer la vérification périodique des notifications
  startNotificationCheck() {
    this.notificationSubscription = interval(this.NOTIFICATION_CHECK_INTERVAL).subscribe(() => {
      this.loadUnreadNotifications();
      this.checkLowStocks();
    });
  }


  onQuantityChange() {
    const selectedStock = this.stocks.find(stock => stock._id === this.newStockId);
    if (selectedStock) {
      this.isStockInsufficient = this.newQuantity > selectedStock.quantity;
      this.currentStockQuantity = selectedStock.quantity;
      this.currentStockUnit = selectedStock.unit;
    }
  }

  // Charger les notifications non lues
  loadUnreadNotifications() {
    this.alimentationService.getUnreadNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        
        // Afficher les notifications non lues
        if (notifications.length > 0) {
          // Afficher la première notification non lue
          this.showCustomNotification(notifications[0].message, notifications[0].type as 'success' | 'error' | 'info');
          
          // Marquer la notification comme lue
          this.alimentationService.markNotificationAsRead(notifications[0]._id).subscribe();
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    });
  }

  // Vérifier les stocks bas
  checkLowStocks() {
    this.alimentationService.getAlertLowStock().subscribe({
      next: (alerts) => {
        if (alerts.length > 0) {
          // Créer une liste des stocks bas
          this.stockService.getAllStocks().subscribe({
            next: (stocks) => {
              this.lowStockAlerts = stocks.filter(stock => 
                alerts.some(alert => alert._id === stock._id && stock.quantity <= stock.minQuantity)
              );
              
              if (this.lowStockAlerts.length > 0) {
                // Ouvrir un modal d'alerte si des stocks sont bas
                this.openAlertModal(this.alertModal);
              }
            }
          });
        }
      },
      error: (error) => {
        console.error('Erreur lors de la vérification des stocks bas:', error);
      }
    });
  }

  // Ouvrir un modal d'alerte pour les stocks bas
  openAlertModal(content: TemplateRef<any>) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-alert-title' });
  }

  // Vérifier et supprimer les programmes expirés
  checkExpiredPrograms() {
    const currentTime = new Date();
    const currentTimeString = this.formatTimeString(currentTime);
    
    // Vérifier les programmes de nourriture et d'eau
    this.checkAndRemoveExpiredPrograms(this.nourritures, 'nourritures', currentTimeString);
    this.checkAndRemoveExpiredPrograms(this.eau, 'eau', currentTimeString);
  }

  // Fonction pour vérifier et supprimer les programmes expirés d'une section spécifique
  checkAndRemoveExpiredPrograms(programs: Feeding[], sectionName: string, currentTimeString: string) {
    const expiredPrograms = programs.filter(program => 
      program.programEndTime && program.programEndTime < currentTimeString
    );

    if (expiredPrograms.length > 0) {
      // Supprimer chaque programme expiré
      expiredPrograms.forEach(program => {
        if (program._id) {
          this.alimentationService.deleteFeeding(program._id).subscribe({
            next: () => {
              // Remettre la quantité dans le stock correspondant
              if (program.stockId) {
                this.incrementStock(program.stockId, program.quantity);
              }
              
              // Mettre à jour les listes locales
              if (sectionName === 'nourritures') {
                this.nourritures = this.nourritures.filter(p => p._id !== program._id);
              } else {
                this.eau = this.eau.filter(p => p._id !== program._id);
              }
              
              this.showCustomNotification(`Programme "${program.feedType}" terminé et supprimé automatiquement`, 'info');
            },
            error: (error) => {
              console.error('Erreur lors de la suppression automatique du programme:', error);
            }
          });
        }
      });
    }
  }

  // Vérifier les programmes qui débuteront bientôt
  checkUpcomingPrograms() {
    const currentTime = new Date();
    const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000);
    const currentTimeString = this.formatTimeString(currentTime);
    const oneHourLaterString = this.formatTimeString(oneHourLater);
    
    // Vérifier pour la nourriture et l'eau
    this.checkUpcomingProgramsForSection(this.nourritures, 'nourriture', currentTimeString, oneHourLaterString);
    this.checkUpcomingProgramsForSection(this.eau, 'eau', currentTimeString, oneHourLaterString);
  }

  // Vérifier les programmes à venir pour une section spécifique
  checkUpcomingProgramsForSection(programs: Feeding[], sectionName: string, currentTimeString: string, oneHourLaterString: string) {
    programs.forEach(program => {
      if (program.programStartTime && 
          program.programStartTime > currentTimeString && 
          program.programStartTime <= oneHourLaterString &&
          !program.reminderSent) { // Vérifier si le rappel n'a pas déjà été envoyé
        
        // Calculer le temps restant approximatif
        const timeRemaining = this.calculateTimeRemaining(program.programStartTime);
        
        // Notifier l'utilisateur
        this.showCustomNotification(
          `Un programme de ${program.feedType} débutera dans environ ${timeRemaining}`, 
          'info'
        );
        
        // Marquer le programme comme rappel envoyé
        if (program._id) {
          this.alimentationService.updateFeeding(program._id, { reminderSent: true }).subscribe();
        }
      }
    });
  }

  // Formater une date en chaîne de temps (HH:MM) pour la comparaison
  formatTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Calculer approximativement le temps restant en minutes
  calculateTimeRemaining(targetTimeStr: string): string {
    const now = new Date();
    const [hours, minutes] = targetTimeStr.split(':').map(Number);
    
    // Créer une date avec l'heure cible
    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);
    
    // Si l'heure cible est déjà passée aujourd'hui, supposer qu'elle est pour demain
    if (targetTime < now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    // Calculer la différence en minutes
    const diffMs = targetTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} heure${hours > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }

  // Méthode pour obtenir l'unité de stock en fonction de l'ID du stock
  getStockUnit(stockId: string | undefined): string {
    if (!stockId) return '';
    const stock = this.stocks.find(s => s._id === stockId);
    return stock ? stock.unit : '';
  }

  // Méthode pour vérifier si un programme expire bientôt
  isProgramExpiringSoon(program: Feeding): boolean {
    const currentTime = new Date();
    const programEndTime = new Date();
    
    if (!program.programEndTime) return false;
    
    const [hours, minutes] = program.programEndTime.split(':').map(Number);
    programEndTime.setHours(hours, minutes, 0, 0);

    // Vérifier si le programme expire dans les 30 minutes
    const diffMs = programEndTime.getTime() - currentTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    return diffMinutes >= 0 && diffMinutes <= 30;
  }

  // Charger tous les programmes d'alimentation
  loadFeedings() {
    this.alimentationService.getAllFeedings().subscribe({
      next: (feedings: Feeding[]) => {
        this.nourritures = feedings.filter(feeding => feeding.feedType !== 'eau');
        this.eau = feedings.filter(feeding => feeding.feedType === 'eau');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.showCustomNotification('Erreur lors du chargement des programmes', 'error');
      }
    });
  }

  // Charger tous les stocks
  loadStocks() {
    this.stockService.getAllStocks().subscribe({
      next: (stocks: Stock[]) => {
        this.stocks = stocks;
        // Filtrer les stocks pour la nourriture et l'eau
        this.filteredNourritureStocks = stocks.filter(stock => stock.type !== 'eau');
        this.filteredEauStocks = stocks.filter(stock => stock.type === 'eau');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des stocks:', error);
        this.showCustomNotification('Erreur lors du chargement des stocks', 'error');
      }
    });
  }

  // Vérifier si un stock est suffisant
  isStockSufficient(section: string): boolean {
    const stock = this.stocks.find(stock => stock.type === section);
    return stock ? stock.quantity > 0 : false;
  }

  // Vérifier si la quantité demandée est disponible dans le stock sélectionné
  checkStockSufficiency() {
    const stock = this.stocks.find(stock => stock._id === this.newStockId);
    if (stock) {
      this.currentStockQuantity = stock.quantity;
      this.currentStockUnit = stock.unit;
      this.isStockInsufficient = this.newQuantity > stock.quantity;
    } else {
      this.currentStockQuantity = null;
      this.currentStockUnit = '';
      this.isStockInsufficient = false;
    }
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

  // Ouvrir le modal d'ajout/édition
  openAddModal(section: string, content: TemplateRef<any>, index: number | null = null) {
    this.currentSection = section;
    this.editIndex = index;
    this.timeErrors = { startTime: null, endTime: null };
    this.updateCurrentTime();
  
    if (index !== null) {
      const programs = section === 'nourritures' ? this.nourritures : this.eau;
      const program = programs[index];
      this.newProgramStartTime = program.programStartTime || '';
      this.newProgramEndTime = program.programEndTime || '';
      this.newQuantity = program.quantity;
      this.newNotes = program.notes || '';
      this.newAutomaticFeeding = program.automaticFeeding || true;
      this.newStockId = program.stockId || '';
    } else {
      this.resetForm();
    }
  
    // Utiliser le modal approprié en fonction de la section
    const modalTemplate = section === 'nourritures' ? this.addModalNourriture : this.addModalEau;
    
    this.modalService.open(modalTemplate, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        this.resetForm();
      },
      () => {
        this.resetForm();
      }
    );
  }

  // Sauvegarder un programme d'alimentation
  saveProgram() {
    if (!this.validateTimeInputs()) {
      this.showCustomNotification("Veuillez corriger les erreurs dans les champs d'heure", 'error');
      return;
    }
  
    if (this.newAutomaticFeeding && !this.validateTimeInputs()) {
      this.showCustomNotification("Veuillez corriger les erreurs dans les champs d'heure", 'error');
      return;
    }
  
    const selectedStock = this.stocks.find(stock => stock._id === this.newStockId);
  
    if (!selectedStock) {
      this.showCustomNotification(`Aucun stock trouvé pour l'ID ${this.newStockId}`, 'error');
      return;
    }
  
    if (!selectedStock._id) {
      this.showCustomNotification('ID du stock non défini', 'error');
      return;
    }
  
    if (this.newQuantity > selectedStock.quantity) {
      this.showCustomNotification(`Quantité insuffisante en stock. Disponible: ${selectedStock.quantity} ${selectedStock.unit}`, 'error');
      return;
    }
  
    const newProgram: Feeding = {
      quantity: this.newQuantity,
      feedType: selectedStock.type, // Utiliser le type du stock directement
      notes: this.newNotes,
      automaticFeeding: this.newAutomaticFeeding,
      programStartTime: this.newProgramStartTime,
      programEndTime: this.newProgramEndTime,
      stockId: selectedStock._id,
      reminderSent: false
    };
  
    if (this.editIndex !== null) {
      // Mettre à jour un programme existant
      const programs = this.currentSection === 'nourritures' ? this.nourritures : this.eau;
      if (programs[this.editIndex]._id) {
        this.alimentationService.updateFeeding(programs[this.editIndex]._id!, newProgram).subscribe({
          next: () => {
            this.showCustomNotification('Programme mis à jour avec succès', 'success');
            this.loadFeedings();
            this.modalService.dismissAll();
          },
          error: (error) => {
            this.showCustomNotification('Erreur lors de la mise à jour du programme', 'error');
            console.error('Erreur lors de la mise à jour:', error);
          },
        });
      }
    } else {
      // Ajouter un nouveau programme
      this.alimentationService.addFeeding(newProgram).subscribe({
        next: () => {
          this.showCustomNotification('Programme ajouté avec succès', 'success');
          this.loadFeedings();
          this.loadStocks(); // Recharger les stocks après l'ajout
          this.modalService.dismissAll();
        },
        error: (error) => {
          this.showCustomNotification('Erreur lors de l\'ajout du programme', 'error');
          console.error('Erreur lors de l\'ajout:', error);
        },
      });
    }
  
    this.resetForm();
  }


  getStockType(stockId: string): string {
    const stock = this.stocks.find(s => s._id === stockId);
    return stock ? stock.type : '';
  }
  

  // Décrémenter un stock
  decrementStock(stockId: string, quantityUsed: number) {
    const stock = this.stocks.find(stock => stock._id === stockId);
    if (!stock) {
      this.showCustomNotification('Stock introuvable', 'error');
      return;
    }

    if (stock.quantity < quantityUsed) {
      this.showCustomNotification(`Quantité insuffisante en stock. Disponible: ${stock.quantity} ${stock.unit}`, 'error');
      return;
    }

    // Mettre à jour la quantité dans le service plutôt que localement
    this.alimentationService.updateStockQuantity(stockId, quantityUsed).subscribe({
      next: () => {
        this.loadStocks(); // Recharger les stocks après la mise à jour
      },
      error: (error) => {
        this.showCustomNotification('Erreur lors de la mise à jour du stock', 'error');
        console.error('Erreur lors de la mise à jour du stock:', error);
      }
    });
  }


  onAutomaticFeedingChange() {
    if (!this.newAutomaticFeeding) {
      // Si l'alimentation automatique est désactivée, réinitialiser les heures
      this.newProgramStartTime = '';
      this.newProgramEndTime = '';
      this.timeErrors = { startTime: null, endTime: null };
    } else {
      // Si l'alimentation automatique est activée, définir les heures par défaut
      const defaultStartTime = new Date();
      defaultStartTime.setMinutes(defaultStartTime.getMinutes() + 5);
      this.newProgramStartTime = this.formatTimeString(defaultStartTime);
      
      const defaultEndTime = new Date();
      defaultEndTime.setMinutes(defaultEndTime.getMinutes() + 35);
      this.newProgramEndTime = this.formatTimeString(defaultEndTime);
    }
  }

  // Incrémenter un stock (après suppression d'un programme)
  incrementStock(stockId: string, quantity: number) {
    // Dans ce cas, nous utilisons une valeur négative pour "incrémenter" car le service soustrait la quantité
    this.alimentationService.updateStockQuantity(stockId, -quantity).subscribe({
      next: () => {
        this.loadStocks(); // Recharger les stocks après la mise à jour
      },
      error: (error) => {
        this.showCustomNotification('Erreur lors de la mise à jour du stock', 'error');
        console.error('Erreur lors de la mise à jour du stock:', error);
      }
    });
  }

  // Éditer un programme existant
  editProgram(section: string, index: number) {
    try {
      // Ouvrir le modal d'édition
      this.openAddModal(section, this.addModal, index);
      this.showCustomNotification('Programme chargé pour modification', 'success');
    } catch (error) {
      this.showCustomNotification('Erreur lors du chargement du programme', 'error');
      console.error('Erreur lors de l\'édition du programme :', error);
    }
  }

  // Supprimer un programme
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
      if (result && program._id) {
        // Si l'utilisateur confirme la suppression
        this.alimentationService.deleteFeeding(program._id).subscribe({
          next: () => {
            if (program.stockId) {
              this.incrementStock(program.stockId, program.quantity);
            }
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

  // Naviguer vers la page de gestion des stocks
  navigateToAlimentation() {
    this.router.navigate(['/stocks']);
  }

  // Réinitialiser le formulaire
  // private resetForm() {
  //   this.newProgramStartTime = '';
  //   this.newProgramEndTime = '';
  //   this.newQuantity = 0;
  //   this.newFeedType = '';
  //   this.newNotes = '';
  //   this.newAutomaticFeeding = true;
  //   this.newStockId = '';
  //   this.currentStockQuantity = null;
  //   this.currentStockUnit = '';
  //   this.editIndex = null;
  // }


  private resetForm() {
    const defaultStartTime = new Date();
    defaultStartTime.setMinutes(defaultStartTime.getMinutes() + 5);
    this.newProgramStartTime = this.formatTimeString(defaultStartTime);
    
    const defaultEndTime = new Date();
    defaultEndTime.setMinutes(defaultEndTime.getMinutes() + 35);
    this.newProgramEndTime = this.formatTimeString(defaultEndTime);
    
    this.newQuantity = 0;
    // Supprimer cette ligne
    // this.newFeedType = '';
    this.newNotes = '';
    this.newAutomaticFeeding = true;
    this.newStockId = '';
    this.currentStockQuantity = null;
    this.currentStockUnit = '';
    this.editIndex = null;
  }

  // Gérer le changement de type d'alimentation
  // onFeedTypeChange(event: any) {
  //   this.newFeedType = event.target.value;
  // }

  // Gérer le changement de stock sélectionné
  onStockChange() {
    // Utiliser le bon ensemble de stocks en fonction de la section courante
    const stocksList = this.currentSection === 'nourritures' ? this.filteredNourritureStocks : this.filteredEauStocks;
    const selectedStock = stocksList.find(stock => stock._id === this.newStockId);
    
    if (selectedStock) {
      this.currentStockQuantity = selectedStock.quantity;
      this.currentStockUnit = selectedStock.unit;
      this.isStockInsufficient = this.newQuantity > selectedStock.quantity;
    } else {
      this.currentStockQuantity = null;
      this.currentStockUnit = '';
      this.isStockInsufficient = false;
    }
  }

  // Procédure de gestion bulk pour ajouter plusieurs programmes
  bulkAddFeedings(feedings: Feeding[]) {
    // Vérifier d'abord si tous les stocks sont suffisants
    const stockChecks = feedings.map(feeding => {
      const stock = this.stocks.find(s => s._id === feeding.stockId);
      return { feeding, stock, isValid: stock && stock.quantity >= feeding.quantity };
    });
    
    const invalidStocks = stockChecks.filter(check => !check.isValid);
    
    if (invalidStocks.length > 0) {
      let errorMessage = 'Quantité insuffisante pour les alimentations suivantes: ';
      invalidStocks.forEach(invalid => {
        errorMessage += `${invalid.feeding.feedType} (${invalid.feeding.quantity}), `;
      });
      this.showCustomNotification(errorMessage, 'error');
      return;
    }
    
    // Si tous les stocks sont suffisants, ajouter en bulk
    this.alimentationService.bulkAddFeedings(feedings).subscribe({
      next: () => {
        this.showCustomNotification('Programmes ajoutés avec succès', 'success');
        this.loadFeedings();
        this.loadStocks();
      },
      error: (error) => {
        this.showCustomNotification('Erreur lors de l\'ajout des programmes', 'error');
        console.error('Erreur lors de l\'ajout en masse:', error);
      }
    });
  }
}