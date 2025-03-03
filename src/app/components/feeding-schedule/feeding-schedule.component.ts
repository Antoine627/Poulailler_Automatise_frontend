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
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-feeding-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './feeding-schedule.component.html',
  styleUrls: ['./feeding-schedule.component.css']
})
export class FeedingScheduleComponent implements OnInit, OnDestroy {
  @ViewChild('addFoodModal') addFoodModal!: TemplateRef<any>;
  @ViewChild('addWaterModal') addWaterModal!: TemplateRef<any>;

  nourritures: Feeding[] = [];
  eau: Feeding[] = [];
  stocks: Stock[] = [];
  notifications: Notification[] = [];

  filteredNourritureStocks: Stock[] = [];
  filteredEauStocks: Stock[] = [];

  newQuantity: number = 0;
  newNotes: string = '';
  newAutomaticFeeding: boolean = true;
  newProgramStartTime: string = '';
  newProgramEndTime: string = '';
  newStockId: string = '';
  currentSection: string = '';
  editIndex: number | null = null;

  private subscriptions: Subscription = new Subscription();
  readonly CHECK_INTERVAL: number = 60000; // 1 minute
  readonly NOTIFICATION_CHECK_INTERVAL: number = 300000; // 5 minutes

  showNotificationBar = false;
  notificationMessage = '';
  notificationType = '';

  currentStockQuantity: number | null = null;
  currentStockUnit: string = '';
  isStockInsufficient: boolean = false;
  currentTimeString: string = '';
  timeErrors: { startTime: string | null; endTime: string | null } = { 
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
    this.initializeData();
    this.setupIntervals();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initializeData() {
    this.loadFeedings();
    this.loadStocks();
    this.loadUnreadNotifications();
    this.updateCurrentTime();
  }

  private setupIntervals() {
    this.subscriptions.add(
      interval(60000).subscribe(() => this.updateCurrentTime())
    );
    this.subscriptions.add(
      interval(this.CHECK_INTERVAL).subscribe(() => this.checkPrograms())
    );
    this.subscriptions.add(
      interval(this.NOTIFICATION_CHECK_INTERVAL).subscribe(() => this.loadUnreadNotifications())
    );
  }

  private checkPrograms() {
    this.checkExpiredPrograms();
    this.checkUpcomingPrograms();
    this.alimentationService.checkFeedingReminders().subscribe();
  }

  updateCurrentTime() {
    const now = new Date();
    this.currentTimeString = this.formatTimeString(now);
  }

  validateTimeInputs(): boolean {
    this.timeErrors = { startTime: null, endTime: null };
    const now = new Date();
    const currentTimeStr = this.formatTimeString(now);

    if (this.newAutomaticFeeding) {
      if (!this.newProgramStartTime || this.newProgramStartTime < currentTimeStr) {
        this.timeErrors.startTime = "L'heure de début doit être postérieure à l'heure actuelle";
      }
      if (!this.newProgramEndTime || this.newProgramEndTime <= this.newProgramStartTime) {
        this.timeErrors.endTime = "L'heure de fin doit être postérieure à l'heure de début";
      }
    }
    return !this.timeErrors.startTime && !this.timeErrors.endTime;
  }

  onQuantityChange() {
    const selectedStock = this.stocks.find(stock => stock._id === this.newStockId);
    if (selectedStock) {
      this.isStockInsufficient = this.newQuantity > selectedStock.quantity;
      this.currentStockQuantity = selectedStock.quantity;
      this.currentStockUnit = selectedStock.unit;
    }
  }

  loadUnreadNotifications() {
    this.subscriptions.add(
      this.alimentationService.getUnreadNotifications().subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          if (notifications.length > 0) {
            this.showCustomNotification(notifications[0].message, notifications[0].type as 'success' | 'error' | 'info');
            this.alimentationService.markNotificationAsRead(notifications[0]._id).subscribe();
          }
        },
        error: (error) => console.error('Erreur notifications:', error)
      })
    );
  }

  checkExpiredPrograms() {
    const currentTimeString = this.formatTimeString(new Date());
    this.processExpiredPrograms(this.nourritures, 'Aliment', currentTimeString);
    this.processExpiredPrograms(this.eau, 'Eau', currentTimeString);
  }

  private processExpiredPrograms(programs: Feeding[], sectionName: string, currentTimeString: string) {
    programs.filter(p => p.programEndTime && p.programEndTime < currentTimeString)
      .forEach(program => {
        if (program._id) {
          this.subscriptions.add(
            this.alimentationService.deleteFeeding(program._id).subscribe({
              next: () => {
                if (program.stockId) this.incrementStock(program.stockId, program.quantity);
                this[sectionName === 'Aliment' ? 'nourritures' : 'eau'] = 
                  this[sectionName === 'Aliment' ? 'nourritures' : 'eau'].filter(p => p._id !== program._id);
                this.showCustomNotification(`Programme "${this.getStockType(program.stockId || '')}" terminé`, 'info');
              },
              error: (error) => console.error('Erreur suppression auto:', error)
            })
          );
        }
      });
  }

  checkUpcomingPrograms() {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    const currentTimeString = this.formatTimeString(now);
    const oneHourLaterString = this.formatTimeString(oneHourLater);

    this.checkSectionPrograms(this.nourritures, 'Aliment', currentTimeString, oneHourLaterString);
    this.checkSectionPrograms(this.eau, 'Eau', currentTimeString, oneHourLaterString);
  }

  private checkSectionPrograms(programs: Feeding[], sectionName: string, current: string, oneHourLater: string) {
    programs.forEach(program => {
      if (program.programStartTime && 
          program.programStartTime > current && 
          program.programStartTime <= oneHourLater &&
          !program.reminderSent) {
        const timeRemaining = this.calculateTimeRemaining(program.programStartTime);
        this.showCustomNotification(
          `Programme ${this.getStockType(program.stockId || '')} dans ${timeRemaining}`, 
          'info'
        );
        if (program._id) {
          this.alimentationService.updateFeeding(program._id, { reminderSent: true }).subscribe();
        }
      }
    });
  }

  formatTimeString(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  calculateTimeRemaining(targetTimeStr: string): string {
    const now = new Date();
    const [hours, minutes] = targetTimeStr.split(':').map(Number);
    const target = new Date(now.setHours(hours, minutes, 0, 0));
    if (target < now) target.setDate(target.getDate() + 1);
    
    const diffMs = target.getTime() - now.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    return diffMin < 60 
      ? `${diffMin} minute${diffMin > 1 ? 's' : ''}`
      : `${Math.floor(diffMin / 60)}h${diffMin % 60}m`;
  }

  getStockUnit(stockId: string | undefined): string {
    return this.stocks.find(s => s._id === stockId)?.unit || '';
  }

  getStockType(stockId: string): string {
    return this.stocks.find(s => s._id === stockId)?.type || '';
  }

  isProgramExpiringSoon(program: Feeding): boolean {
    if (!program.programEndTime) return false;
    const endTime = new Date();
    const [hours, minutes] = program.programEndTime.split(':').map(Number);
    endTime.setHours(hours, minutes, 0, 0);
    const diffMin = Math.floor((endTime.getTime() - Date.now()) / 60000);
    return diffMin >= 0 && diffMin <= 30;
  }

  loadFeedings() {
    this.subscriptions.add(
      this.alimentationService.getAllFeedings().subscribe({
        next: (feedings) => {
          this.nourritures = feedings.filter(f => f.feedType !== 'Eau');
          this.eau = feedings.filter(f => f.feedType === 'Eau');
        },
        error: (error) => {
          console.error('Erreur chargement programmes:', error);
          this.showCustomNotification('Erreur chargement programmes', 'error');
        }
      })
    );
  }

  loadStocks() {
    this.subscriptions.add(
      this.stockService.getAllStocks().subscribe({
        next: (stocks) => {
          this.stocks = stocks;
          this.filteredNourritureStocks = stocks.filter(s => s.type !== 'Eau');
          this.filteredEauStocks = stocks.filter(s => s.type === 'Eau');
          this.onStockChange();
        },
        error: (error) => {
          console.error('Erreur chargement stocks:', error);
          this.showCustomNotification('Erreur chargement stocks', 'error');
        }
      })
    );
  }

  showCustomNotification(message: string, type: 'success' | 'error' | 'info') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotificationBar = true;
    setTimeout(() => this.showNotificationBar = false, 3000);
  }

  openAddModal(section: string, content: TemplateRef<any>, index: number | null = null) {
    this.currentSection = section;
    this.editIndex = index;
    this.timeErrors = { startTime: null, endTime: null };
    this.updateCurrentTime();

    const programs = section === 'Aliment' ? this.nourritures : this.eau;
    if (index !== null) {
      const program = programs[index];
      Object.assign(this, {
        newQuantity: program.quantity,
        newNotes: program.notes || '',
        newAutomaticFeeding: program.automaticFeeding || false,
        newProgramStartTime: program.programStartTime || '',
        newProgramEndTime: program.programEndTime || '',
        newStockId: program.stockId || ''
      });
      this.onStockChange();
    } else {
      this.resetForm();
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' })
      .result.finally(() => this.resetForm());
  }

  saveProgram() {
    if (this.newAutomaticFeeding && !this.validateTimeInputs()) {
      this.showCustomNotification("Corrigez les erreurs d'heure", 'error');
      return;
    }


    // Validation supplémentaire pour s'assurer que les heures sont au format HH:mm
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (this.newAutomaticFeeding && (
        !timeRegex.test(this.newProgramStartTime) || 
        !timeRegex.test(this.newProgramEndTime))) {
      this.showCustomNotification("Format d'heure invalide (HH:mm requis)", 'error');
      return;
    }

    const selectedStock = this.stocks.find(s => s._id === this.newStockId);
    if (!selectedStock || this.newQuantity > selectedStock.quantity) {
      this.showCustomNotification('Stock insuffisant ou invalide', 'error');
      return;
    }

    const newProgram: Feeding = {
      quantity: this.newQuantity,
      feedType: selectedStock.type,
      notes: this.newNotes,
      automaticFeeding: this.newAutomaticFeeding,
      programStartTime: this.newAutomaticFeeding ? this.newProgramStartTime : undefined,
      programEndTime: this.newAutomaticFeeding ? this.newProgramEndTime : undefined,
      stockId: this.newStockId,
      reminderSent: false
    };

    if (this.editIndex !== null) {
      const programs = this.currentSection === 'Aliment' ? this.nourritures : this.eau;
      const programId = programs[this.editIndex]._id;
      if (programId) {
        this.subscriptions.add(
          this.alimentationService.updateFeeding(programId, newProgram).subscribe({
            next: (updated) => {
              if (this.newAutomaticFeeding && this.currentSection === 'Eau') {
                this.alimentationService.updateWaterSupply(programId, {
                  startTime: this.newProgramStartTime,
                  endTime: this.newProgramEndTime,
                  enabled: true
                }).subscribe({
                  next: () => this.showCustomNotification('Programme eau mis à jour', 'success'),
                  error: () => this.showCustomNotification('Erreur mise à jour eau', 'error')
                });
              } else {
                this.showCustomNotification('Programme mis à jour', 'success');
              }
              this.loadFeedings();
              this.modalService.dismissAll();
            },
            error: () => this.showCustomNotification('Erreur mise à jour', 'error')
          })
        );
      }
    } else {
      this.subscriptions.add(
        this.alimentationService.addFeeding(newProgram).subscribe({
          next: (added) => {
            if (this.newAutomaticFeeding && this.currentSection === 'Eau' && added._id) {
              this.alimentationService.updateWaterSupply(added._id, {
                startTime: this.newProgramStartTime,
                endTime: this.newProgramEndTime,
                enabled: true
              }).subscribe({
                next: () => this.showCustomNotification('Programme eau ajouté', 'success'),
                error: () => this.showCustomNotification('Erreur ajout eau', 'error')
              });
            } else {
              this.showCustomNotification('Programme ajouté', 'success');
            }
            this.loadFeedings();
            this.loadStocks();
            this.modalService.dismissAll();
          },
          error: () => this.showCustomNotification('Erreur ajout', 'error')
        })
      );
    }
  }


  sendProgramsToArduino() {
  console.log('Envoi des programmes à l\'Arduino');
  this.subscriptions.add(
    this.alimentationService.sendProgramsToArduino().subscribe({
      next: () => this.showCustomNotification('Programmes envoyés à l\'Arduino avec succès', 'success'),
      error: (error) => {
        console.error('Erreur lors de l\'envoi des programmes à l\'Arduino:', error);
        this.showCustomNotification('Erreur lors de l\'envoi des programmes à l\'Arduino', 'error');
      }
    })
  );
}

  deleteProgram(section: string, index: number) {
    const programs = section === 'Aliment' ? this.nourritures : this.eau;
    const program = programs[index];

    this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title: 'Confirmation', message: 'Supprimer ce programme ?' }
    }).afterClosed().subscribe(result => {
      if (result && program._id) {
        this.subscriptions.add(
          this.alimentationService.deleteFeeding(program._id).subscribe({
            next: () => {
              if (program.stockId) this.incrementStock(program.stockId, program.quantity);
              this.showCustomNotification('Programme supprimé', 'success');
              this.loadFeedings();
            },
            error: () => this.showCustomNotification('Erreur suppression', 'error')
          })
        );
      }
    });
  }

  incrementStock(stockId: string, quantity: number) {
    this.subscriptions.add(
      this.alimentationService.updateStockQuantity(stockId, -quantity).subscribe({
        next: () => this.loadStocks(),
        error: () => this.showCustomNotification('Erreur mise à jour stock', 'error')
      })
    );
  }

  editProgram(section: string, index: number) {
    const modal = section === 'Aliment' ? this.addFoodModal : this.addWaterModal;
    this.openAddModal(section, modal, index);
  }

  navigateToAlimentation() {
    this.router.navigate(['/stocks']);
  }

  resetForm() {
    const now = new Date();
    this.newProgramStartTime = this.formatTimeString(new Date(now.getTime() + 300000));
    this.newProgramEndTime = this.formatTimeString(new Date(now.getTime() + 2100000));
    Object.assign(this, {
      newQuantity: 0,
      newNotes: '',
      newAutomaticFeeding: true,
      newStockId: '',
      currentStockQuantity: null,
      currentStockUnit: '',
      isStockInsufficient: false,
      editIndex: null
    });
  }

  onAutomaticFeedingChange() {
    if (!this.newAutomaticFeeding) {
      this.newProgramStartTime = '';
      this.newProgramEndTime = '';
      this.timeErrors = { startTime: null, endTime: null };
    } else {
      this.resetForm();
    }
  }

  onStockChange() {
    const stocks = this.currentSection === 'Aliment' ? this.filteredNourritureStocks : this.filteredEauStocks;
    const stock = stocks.find(s => s._id === this.newStockId);
    Object.assign(this, {
      currentStockQuantity: stock?.quantity || null,
      currentStockUnit: stock?.unit || '',
      isStockInsufficient: stock ? this.newQuantity > stock.quantity : false
    });
  }
}