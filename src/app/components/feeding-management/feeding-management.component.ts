import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlimentationService, Feeding, FeedingStats, StockAlert, Notification } from '../../services/alimentation.service';
import { FeedingType } from '../../models/alimentation';
import { HeaderComponent } from '../header/header.component';
import { filter, Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Stock } from '../../models/stock.model';

interface FeedingProgram {
  quantity: number;
  programStartTime: string;
  programEndTime: string;
  feedType: string;
  stockId?: string;
  automaticFeeding: boolean;
  notes?: string;
  _id?: string;
}

@Component({
  selector: 'app-feeding-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, HeaderComponent],
  templateUrl: './feeding-management.component.html',
  styleUrls: ['./feeding-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedingManagementComponent implements OnInit, OnDestroy {
  feedingPrograms: FeedingProgram[] = [];
  feedingForm!: FormGroup;
  waterSupplyForm!: FormGroup;
  feedingHistory: Feeding[] = [];
  feedingStats: FeedingStats[] = [];
  stockAlerts: StockAlert[] = [];
  availableStocks: Stock[] = [];
  unreadNotifications: Notification[] = [];
  startDate: string;
  endDate: string;
  isFeedingSystemActive: boolean = false;
  lastFeedingTime: string = '';
  nextFeedingTime: string = '';
  foodTankLevel: number = 100;
  feedingQuantity: number = 5;
  feedingSchedule: string[] = ['08:00', '16:00'];
  isAutoMode: boolean = true;
  isWaterSystemActive: boolean = false;
  waterTankLevel: number = 100;
  dailyFoodConsumption: number = 0;
  dailyWaterConsumption: number = 0;
  dailyDistributions: number = 0;
  feedTypes: FeedingType[] = [];
  selectedProgram: FeedingProgram | null = null;
  bulkFeedingMode: boolean = false;
  bulkFeedings: Feeding[] = [];

  private initialFoodQuantity: number = 0;
  
  private subscriptions: Subscription = new Subscription();
  private updateInterval: any;
  private feedingInterval: any;
  private waterInterval: any;
  private notificationsInterval: any;

  isAuthPage: boolean = false;

  constructor(
    private fb: FormBuilder,
    private alimentationService: AlimentationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private stockService: StockService
  ) {
    const routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isAuthPage = event.url === '/login';
      });
    
    this.subscriptions.add(routerSubscription);
      
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    this.startDate = weekAgo.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.initForms();
    this.loadFeedingHistory();
    this.loadFeedingStats();
    this.loadStockAlerts();
    this.loadFeedingPrograms();
    this.loadAvailableStocks();
    this.loadUnreadNotifications();
    this.initDailyStats(); 

    this.updateFeedingStatus();
    this.updateInterval = setInterval(() => {
      this.updateFeedingStatus();
    }, 60000);

    this.updateInterval = setInterval(() => {
      this.updateFeedingStatus();
      this.checkActiveProgramStatus(); // Ajouter cette ligne
    }, 60000);

    this.notificationsInterval = setInterval(() => {
      this.loadUnreadNotifications();
    }, 300000); // Check for new notifications every 5 minutes
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
    if (this.notificationsInterval) {
      clearInterval(this.notificationsInterval);
    }
    
    this.subscriptions.unsubscribe();
  }

  private initForms() {
    this.feedingForm = this.fb.group({
      feedType: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      stockId: ['', Validators.required],
      notes: [''],
      automaticFeeding: [false],
      programStartTime: [''],
      programEndTime: ['']
    });

    this.waterSupplyForm = this.fb.group({
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      enabled: [false]
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
    this.cdr.markForCheck();
  }

  loadFeedingHistory() {
    const params = {
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      limit: 50
    };
  
    const subscription = this.alimentationService.getFeedingHistory(params)
      .subscribe({
        next: (history) => {
          this.feedingHistory = history;
          this.updateLastFeedingTime();
          this.calculateDailyConsumption();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'historique:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  loadFeedingStats() {
    const params = {
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate)
    };
  
    const subscription = this.alimentationService.getFeedingStats(params)
      .subscribe({
        next: (stats) => {
          this.feedingStats = stats;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  } 

  loadStockAlerts() {
    const subscription = this.alimentationService.getAlertLowStock()
      .subscribe({
        next: (alerts) => {
          this.stockAlerts = alerts;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des alertes de stock:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  loadFeedingPrograms() {
    const subscription = this.alimentationService.getAllFeedings()
      .subscribe({
        next: (feedings: Feeding[]) => {
          this.feedingPrograms = feedings
            .filter(feeding => feeding.programStartTime && feeding.programEndTime)
            .map(feeding => ({
              quantity: feeding.quantity,
              programStartTime: feeding.programStartTime!,
              programEndTime: feeding.programEndTime!,
              feedType: feeding.feedType,
              stockId: feeding.stockId,
              automaticFeeding: feeding.automaticFeeding || false,
              notes: feeding.notes,
              _id: feeding._id
            }));
  
          // Calculer la quantité totale initiale de nourriture
          this.initialFoodQuantity = this.feedingPrograms
            .filter(program => program.feedType !== 'eau')
            .reduce((total, program) => total + program.quantity, 0);
  
          this.updateNextFeedingTime();
          this.updateTankLevels();
          this.updateConsumedFood(); // Nouvelle méthode
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des programmes:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }


  private updateConsumedFood() {
  // Calculer la quantité restante de nourriture
  const remainingFood = this.feedingPrograms
    .filter(program => program.feedType !== 'eau')
    .reduce((total, program) => total + program.quantity, 0);

  // Calculer la quantité consommée
  this.dailyFoodConsumption = this.initialFoodQuantity - remainingFood;
  this.cdr.markForCheck();
}

  loadAvailableStocks() {
    const subscription = this.stockService.getAllStocks()
      .subscribe({
        next: (stocks) => {
          this.availableStocks = stocks;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des stocks:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  loadUnreadNotifications() {
    const subscription = this.alimentationService.getUnreadNotifications()
      .subscribe({
        next: (notifications) => {
          this.unreadNotifications = notifications;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notifications:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  onSubmit() {
    if (this.feedingForm.valid) {
      const feeding: Feeding = {
        ...this.feedingForm.value,
        reminderSent: false
      };
      
      const subscription = this.alimentationService.addFeeding(feeding)
        .subscribe({
          next: () => {
            this.reloadData();
            this.feedingForm.reset();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout de l\'alimentation:', error);
          }
        });
      
      this.subscriptions.add(subscription);
    }
  }

  updateProgram(program: FeedingProgram) {
    if (program._id) {
      const subscription = this.alimentationService.updateFeeding(program._id, program)
        .subscribe({
          next: () => {
            this.reloadData();
            this.selectedProgram = null;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour du programme:', error);
          }
        });
      
      this.subscriptions.add(subscription);
    }
  }

  deleteProgram(index: number) {
    const program = this.feedingPrograms[index];
    if (program._id && confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      const subscription = this.alimentationService.deleteFeeding(program._id)
        .subscribe({
          next: () => {
            this.reloadData();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la suppression du programme:', error);
          }
        });
      
      this.subscriptions.add(subscription);
    }
  }


  

  toggleFeedingSystem() {
    if (!this.feedingPrograms || this.feedingPrograms.length === 0) {
      return;
    }
  
    // Basculer l'état du système
    this.isFeedingSystemActive = !this.isFeedingSystemActive;
  
    if (this.isFeedingSystemActive) {
      // Vérifier s'il y a des programmes actifs actuellement
      const activeProgram = this.getActiveProgram();
      if (!activeProgram) {
        console.log('Aucun programme actif pour le moment, le système attendra la prochaine période');
      }
      
      // Démarrer le système quand même
      this.startFeedingSystem();
    } else {
      // Arrêter le système
      this.stopFeedingSystem();
    }
  }


  startFeedingSystem() {
    this.feedingInterval = setInterval(() => {
      const activeProgram = this.getActiveProgram();
      
      // Si aucun programme actif ou si on est hors de la plage horaire, arrêter
      if (!activeProgram || !activeProgram._id) {
        return;
      }
      
      // Vérifier si nous sommes toujours dans la plage horaire
      if (!this.isWithinTimeRange(activeProgram)) {
        console.log('Programme hors plage horaire, arrêt de la décrémentation');
        // Ne pas arrêter le système entier, juste passer au programme suivant
        return;
      }
      
      const decrementAmount = 0.5;
      const currentQuantity = typeof activeProgram.quantity === 'number' ? 
        activeProgram.quantity : parseFloat(activeProgram.quantity as any) || 0;
      const newQuantity = Math.max(0, currentQuantity - decrementAmount);
      
      this.alimentationService.decrementFeedingQuantity(activeProgram._id, decrementAmount)
        .subscribe({
          next: (updatedFeeding) => {
            activeProgram.quantity = typeof updatedFeeding.quantity === 'number' ? 
              updatedFeeding.quantity : parseFloat(updatedFeeding.quantity as any) || 0;
    
            if (activeProgram.stockId) {
              this.alimentationService.updateStockQuantity(activeProgram.stockId, decrementAmount)
                .subscribe({
                  next: () => {
                    console.log('Stock décrémenté avec succès');
                    
                    this.updateTankLevels();
                    this.dailyFoodConsumption += decrementAmount;
                    this.dailyDistributions++;
    
                    if (activeProgram.quantity <= 0) {
                      // Ne pas arrêter le système entier, juste ce programme
                      activeProgram.quantity = 0;
                      this.updateProgram(activeProgram);
                    }
                    
                    this.cdr.detectChanges();
                  },
                  error: (error) => {
                    console.error('Erreur lors de la décrémentation du stock:', error);
                  }
                });
            } else {
              this.updateTankLevels();
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            console.error('Erreur lors de la décrémentation:', error);
          }
        });
    }, 2000);
  }
  


  private stopFeedingSystem() {
    if (this.feedingInterval) {
      clearInterval(this.feedingInterval);
      this.feedingInterval = null;
    }
    this.isFeedingSystemActive = false;
    this.cdr.markForCheck();
  }


  private getActiveProgram(): FeedingProgram | undefined {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;
  
    // Trouver tous les programmes actifs dans la plage horaire actuelle
    const activePrograms = this.feedingPrograms.filter(program => {
      if (!program.programStartTime || !program.programEndTime) return false;
  
      const [startHours, startMinutes] = program.programStartTime.split(':').map(Number);
      const [endHours, endMinutes] = program.programEndTime.split(':').map(Number);
      const startTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;
  
      // Convertir en nombre si nécessaire
      const quantity = typeof program.quantity === 'number' ? 
        program.quantity : parseFloat(program.quantity as any) || 0;
  
      return program.feedType !== 'eau' && 
             quantity > 0 && 
             currentTime >= startTime && 
             currentTime <= endTime;
    });
  
    // Retourner le premier programme actif, ou undefined si aucun n'est actif
    return activePrograms.length > 0 ? activePrograms[0] : undefined;
  }


  // Nouvelle méthode pour obtenir le programme actif
  private getActiveWaterProgram(): FeedingProgram | undefined {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinutes;
  
    return this.feedingPrograms.find(program => {
      if (!program.programStartTime || !program.programEndTime) return false;
  
      const [startHours, startMinutes] = program.programStartTime.split(':').map(Number);
      const [endHours, endMinutes] = program.programEndTime.split(':').map(Number);
      const startTime = startHours * 60 + startMinutes;
      const endTime = endHours * 60 + endMinutes;
  
      // Convertir en nombre si nécessaire
      const quantity = typeof program.quantity === 'number' ? 
        program.quantity : parseFloat(program.quantity as any) || 0;
  
      return program.feedType === 'eau' && 
             quantity > 0 && 
             currentTime >= startTime && 
             currentTime <= endTime;
    });
  }



  private isWithinTimeRange(program: FeedingProgram): boolean {
  if (!program.programStartTime || !program.programEndTime) {
    return false; // Si pas de plage horaire définie, considérer comme inactif
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinutes;

  const [startHours, startMinutes] = program.programStartTime.split(':').map(Number);
  const [endHours, endMinutes] = program.programEndTime.split(':').map(Number);
  const startTime = startHours * 60 + startMinutes;
  const endTime = endHours * 60 + endMinutes;

  // Vérifier si l'heure actuelle est dans la plage horaire
  return currentTime >= startTime && currentTime <= endTime;
}



private checkActiveProgramStatus() {
  // Cette méthode est appelée régulièrement pour vérifier si un programme doit être arrêté
  if (this.isFeedingSystemActive) {
    const activeProgram = this.getActiveProgram();
    
    // Si aucun programme actif n'est trouvé, vérifier si c'est parce que l'heure de fin est passée
    if (!activeProgram) {
      // Vérifier s'il y a des programmes qui ont atteint leur heure de fin
      const programsToCheck = this.feedingPrograms.filter(p => 
        p.feedType !== 'eau' && 
        typeof p.quantity === 'number' ? p.quantity > 0 : parseFloat(p.quantity as any) > 0
      );
      
      for (const program of programsToCheck) {
        if (!this.isWithinTimeRange(program)) {
          console.log('Programme terminé car hors plage horaire');
        }
      }
      
      // Si vraiment aucun programme actif, arrêter complètement le système
      if (programsToCheck.length === 0) {
        this.stopFeedingSystem();
      }
    }
  }
}



  toggleWaterSystem() {
    if (!this.feedingPrograms || this.feedingPrograms.length === 0) {
      return;
    }
  
    this.isWaterSystemActive = !this.isWaterSystemActive;
  
    if (this.isWaterSystemActive) {
      this.waterInterval = setInterval(() => {
        const activeWaterProgram = this.getActiveWaterProgram();
  
        if (!activeWaterProgram || !activeWaterProgram._id) {
          return;
        }
  
        // Convertir en nombre si nécessaire
        const currentQuantity = typeof activeWaterProgram.quantity === 'number' ? 
          activeWaterProgram.quantity : parseFloat(activeWaterProgram.quantity as any) || 0;
  
        if (currentQuantity > 0) {
          const decrementAmount = 0.5;
          const newQuantity = Math.max(0, currentQuantity - decrementAmount);
  
          this.alimentationService.decrementFeedingQuantity(activeWaterProgram._id, decrementAmount)
            .subscribe({
              next: (updatedFeeding) => {
                // Mettre à jour la quantité localement
                activeWaterProgram.quantity = typeof updatedFeeding.quantity === 'number' ? 
                  updatedFeeding.quantity : parseFloat(updatedFeeding.quantity as any) || 0;
  
                if (activeWaterProgram.stockId) {
                  this.alimentationService.updateStockQuantity(activeWaterProgram.stockId, decrementAmount)
                    .subscribe({
                      next: () => {
                        this.dailyWaterConsumption += decrementAmount;
                        this.dailyDistributions++;
  
                        // Mise à jour des jauges via la méthode commune
                        this.updateTankLevels();
  
                        // Forcer la mise à jour de l'interface
                        this.cdr.detectChanges();
  
                        if (newQuantity <= 0) {
                          this.stopWaterSystem();
                        }
                      },
                      error: (error) => {
                        console.error('Erreur lors de la mise à jour du stock d\'eau:', error);
                        this.stopWaterSystem();
                      }
                    });
                } else {
                  // Même si pas de stock, mettre à jour l'interface
                  this.updateTankLevels();
                  this.cdr.detectChanges();
                }
              },
              error: (error) => {
                console.error('Erreur lors de la décrémentation de l\'eau:', error);
                this.stopWaterSystem();
              }
            });
        } else {
          this.stopWaterSystem();
        }
      }, 3000);
    } else {
      this.stopWaterSystem();
    }
  }
  


private stopWaterSystem() {
  if (this.waterInterval) {
    clearInterval(this.waterInterval);
    this.waterInterval = null;
  }
  this.isWaterSystemActive = false;
  this.cdr.markForCheck();
}


private initDailyStats() {
  // Réinitialiser les statistiques à minuit
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // lendemain
    0, 0, 0 // minuit
  );
  const msToMidnight = night.getTime() - now.getTime();

  // Réinitialiser maintenant si c'est un nouveau jour
  this.resetDailyStats();

  // Programmer la réinitialisation pour minuit
  setTimeout(() => {
    this.resetDailyStats();
    // Répéter toutes les 24 heures
    setInterval(() => this.resetDailyStats(), 24 * 60 * 60 * 1000);
  }, msToMidnight);
}


private resetDailyStats() {
  this.dailyFoodConsumption = 0;
  this.dailyWaterConsumption = 0;
  this.dailyDistributions = 0;
  this.cdr.markForCheck();
}

// Nouvelle méthode pour obtenir le programme d'eau actif
// private getActiveWaterProgram(): FeedingProgram | undefined {
//   const now = new Date();
//   const currentHour = now.getHours();
//   const currentMinutes = now.getMinutes();
//   const currentTime = currentHour * 60 + currentMinutes;

//   return this.feedingPrograms.find(program => {
//     if (!program.programStartTime || !program.programEndTime) return false;

//     const [startHours, startMinutes] = program.programStartTime.split(':').map(Number);
//     const [endHours, endMinutes] = program.programEndTime.split(':').map(Number);
//     const startTime = startHours * 60 + startMinutes;
//     const endTime = endHours * 60 + endMinutes;

//     return program.feedType === 'eau' && 
//            program.quantity > 0 && 
//            currentTime >= startTime && 
//            currentTime <= endTime;
//   });
// }



canActivateSystems(): boolean {
  return this.feedingPrograms && this.feedingPrograms.length > 0;
}


  distributeFoodNow() {
    if (this.isFeedingSystemActive && this.feedingForm.get('stockId')?.value) {
      const newFeeding: Feeding = {
        quantity: this.feedingQuantity,
        feedType: this.feedingForm.get('feedType')?.value || 'grain',
        automaticFeeding: false,
        stockId: this.feedingForm.get('stockId')?.value,
        reminderSent: false,
        notes: 'Distribution manuelle'
      };

      const subscription = this.alimentationService.addFeeding(newFeeding)
        .subscribe({
          next: () => {
            this.reloadData();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la distribution:', error);
          }
        });
      
      this.subscriptions.add(subscription);
    }
  }

  updateWaterSupply(feedingId: string) {
    if (this.waterSupplyForm.valid) {
      const waterSupply = this.waterSupplyForm.value;
      
      const subscription = this.alimentationService.updateWaterSupply(feedingId, waterSupply)
        .subscribe({
          next: () => {
            this.reloadData();
            this.waterSupplyForm.reset();
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour de l\'apport en eau:', error);
          }
        });
      
      this.subscriptions.add(subscription);
    }
  }

  markNotificationAsRead(notificationId: string) {
    const subscription = this.alimentationService.markNotificationAsRead(notificationId)
      .subscribe({
        next: () => {
          this.loadUnreadNotifications();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du marquage de la notification:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  addToBulkFeedings() {
    if (this.feedingForm.valid) {
      const feeding: Feeding = {
        ...this.feedingForm.value,
        reminderSent: false
      };
      
      this.bulkFeedings.push(feeding);
      this.feedingForm.reset();
      this.cdr.markForCheck();
    }
  }

  submitBulkFeedings() {
    if (this.bulkFeedings.length > 0) {
      const subscription = this.alimentationService.bulkAddFeedings(this.bulkFeedings)
        .subscribe({
          next: () => {
            this.reloadData();
            this.bulkFeedings = [];
            this.bulkFeedingMode = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erreur lors de l\'ajout des alimentations en masse:', error);
          }
        });
      
      this.subscriptions.add(subscription);
    }
  }

  removeBulkFeeding(index: number) {
    this.bulkFeedings.splice(index, 1);
    this.cdr.markForCheck();
  }

  toggleBulkMode() {
    this.bulkFeedingMode = !this.bulkFeedingMode;
    if (!this.bulkFeedingMode) {
      this.bulkFeedings = [];
    }
    this.cdr.markForCheck();
  }

  checkFeedingReminders() {
    const subscription = this.alimentationService.checkFeedingReminders()
      .subscribe({
        next: () => {
          this.loadUnreadNotifications();
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors de la vérification des rappels:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  startFeedingReminderCronJobs() {
    const subscription = this.alimentationService.startFeedingReminderCronJobs()
      .subscribe({
        next: () => {
          console.log('Tâches cron démarrées avec succès');
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erreur lors du démarrage des tâches cron:', error);
        }
      });
    
    this.subscriptions.add(subscription);
  }

  calculateAutonomy(stock: number | undefined): number {
    if (stock === undefined) {
      return 0;
    }
    
    // Calculer l'autonomie basée sur la consommation quotidienne moyenne
    const averageDailyConsumption = this.calculateAverageDailyConsumption();
    return averageDailyConsumption > 0 ? Math.floor(stock / averageDailyConsumption) : 0;
  }

  calculateAverageDailyConsumption(): number {
    if (this.feedingStats.length === 0) {
      return 0;
    }
    
    // Calculer la consommation moyenne quotidienne
    const totalQuantity = this.feedingStats.reduce((sum, stat) => sum + stat.totalQuantity, 0);
    const daysInRange = this.getDaysInRange();
    
    return daysInRange > 0 ? totalQuantity / daysInRange : 0;
  }

  getDaysInRange(): number {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateDailyConsumption() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrer les alimentations d'aujourd'hui
    const todayFeedings = this.feedingHistory.filter(feeding => {
      const feedingDate = new Date(feeding.createdAt!);
      feedingDate.setHours(0, 0, 0, 0);
      return feedingDate.getTime() === today.getTime();
    });
    
    // Calculer la consommation quotidienne
    this.dailyFoodConsumption = todayFeedings.reduce((sum, feeding) => {
      if (feeding.feedType !== 'eau') {
        return sum + feeding.quantity;
      }
      return sum;
    }, 0);
    
    this.dailyWaterConsumption = todayFeedings.reduce((sum, feeding) => {
      if (feeding.feedType === 'eau') {
        return sum + feeding.quantity;
      }
      return sum;
    }, 0);
    
    this.dailyDistributions = todayFeedings.length;
    
    this.cdr.markForCheck();
  }

  editProgram(program: FeedingProgram) {
    this.selectedProgram = { ...program };
    this.cdr.markForCheck();
  }

  cancelEdit() {
    this.selectedProgram = null;
    this.cdr.markForCheck();
  }

  saveEdit() {
    if (this.selectedProgram) {
      this.updateProgram(this.selectedProgram);
    }
  }

  updateDateRange() {
    this.loadFeedingHistory();
    this.loadFeedingStats();
    this.cdr.markForCheck();
  }

  updateLastFeedingTime() {
    if (this.feedingHistory.length > 0) {
      const lastFeeding = this.feedingHistory[0];
      this.lastFeedingTime = new Date(lastFeeding.createdAt!)
        .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else {
      this.lastFeedingTime = '--:--';
    }
    this.cdr.markForCheck();
  }

  updateNextFeedingTime() {
    const now = new Date();
  
    const nextProgram = this.feedingPrograms.find(program => {
      const [hours, minutes] = program.programStartTime.split(':');
      const programTime = new Date();
      programTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return programTime > now;
    });
  
    if (nextProgram) {
      this.nextFeedingTime = nextProgram.programStartTime;
    } else {
      this.nextFeedingTime = '--:--';
    }
    this.cdr.markForCheck();
  }

  // Modifier la méthode updateTankLevels pour refléter les quantités réelles
  private updateTankLevels() {
    if (!this.feedingPrograms || this.feedingPrograms.length === 0) {
      this.foodTankLevel = 0;
      this.waterTankLevel = 0;
      this.cdr.markForCheck();
      return;
    }
  
    // Définir des capacités maximales pour les réservoirs
    const maxFoodCapacity = 100; // Ajustez cette valeur selon vos besoins réels
    const maxWaterCapacity = 100; // Ajustez cette valeur selon vos besoins réels
  
    // Calculer les totaux actuels en tenant compte des types dynamiques
    const totals = this.feedingPrograms.reduce((acc, program) => {
      // Convertir en nombre si c'est une chaîne ou un autre type
      const quantity = typeof program.quantity === 'number' ? program.quantity : parseFloat(program.quantity as any) || 0;
      
      if (program.feedType === 'eau') {
        acc.water += quantity;
      } else {
        acc.food += quantity;
      }
      return acc;
    }, { food: 0, water: 0 });
  
    // Calculer les pourcentages par rapport aux capacités maximales
    this.foodTankLevel = Math.min(100, Math.max(0, (totals.food / maxFoodCapacity) * 100));
    this.waterTankLevel = Math.min(100, Math.max(0, (totals.water / maxWaterCapacity) * 100));
  
    this.cdr.markForCheck();
  }

  trackByFn(index: number, item: any): any {
    return item._id || index;
  }

  trackByStockFn(index: number, item: StockAlert): string {
    return item._id || index.toString();
  }

  trackByNotificationFn(index: number, item: Notification): string {
    return item._id || index.toString();
  }

  private reloadData() {
    this.loadFeedingHistory();
    this.loadFeedingStats();
    this.loadStockAlerts();
    this.loadFeedingPrograms();
    this.loadAvailableStocks();
    this.updateFeedingStatus();
  }
}