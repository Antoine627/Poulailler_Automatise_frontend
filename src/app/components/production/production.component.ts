import { Component, OnInit } from '@angular/core';
import { CostService } from '../../services/cost.service';
import { ProductionService } from '../../services/production.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Production } from '../../models/production.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';


interface FeedRequirement {
  totalFeedConsumptionKg: number;
  bagsNeeded: number;
  totalCostFCFA: number;
}

interface FeedRequirements {
  demarrage: FeedRequirement;
  croissance: FeedRequirement;
  finition: FeedRequirement;
}


interface ProfitabilityStats {
  profit: number;             // Bénéfice/perte en valeur absolue (FCFA)
  profitMargin: number;       // Marge bénéficiaire en pourcentage
  returnOnInvestment: number; // Retour sur investissement en pourcentage
  status: string;             // 'Bénéfice' ou 'Perte'
}


interface ProfitabilityCalculation {
  revenue: number;
  costs: number;
  result: number;
  profit: number;  // Retiré le caractère optionnel ?
  profitMargin?: number;
  chickPrice?: number;
  sellingPricePerKg?: number;
  averageWeightKg?: number;
  mortalityRate?: number;
  feedCost?: number;
  otherCostsPerChicken?: number;
  totalRevenue: number;  // Retiré le caractère optionnel ?
  totalCosts: number;    // Retiré le caractère optionnel ?
}


interface ProductionManagement {
  totalProduction: number;
  deaths: number;
  updatedProduction: number;
  chickenCount: number; // Ajoutez cette propriété
  mortality: number;    // Ajoutez cette propriété
}


interface FeedCalculation {
  chickenCount: number;
  numberOfWeeks: number;
  result: FeedRequirements;
  totalFeedConsumptionKg: number;
  totalBagsNeeded: number;
  totalCostFCFA: number;
  bagsRequired: number;
  estimatedMortality?: number; // Add this
  survivingChickens?: number;  // Add this
}


interface ProfitabilityParams {
  numberOfChickens: number;
  chickPrice: number;
  feedCost: number;
  otherCosts: number;
  sellingPricePerUnit: number;
}


interface ProfitabilityResults {
  numberOfChickens: number;
  purchaseCost: number;
  feedCost: number;
  otherCosts: number;
  totalCost: number;
  costPerUnit: number;
  totalRevenue: number;
  profit: number;
  profitPerUnit: number;
}

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.css'],
})
export class ProductionComponent implements OnInit {
  productions: any[] = [];
  costStats: any[] = [];
  productionStats: any = null;
  totalCosts: any = null;
  loading = true;
  error: string | null = null;
  showEditModal = false;
  editingProduction: any = null;
  editForm: any = null;
  isAdding = true;

  showResults = false;

  public profitabilityStats: any = null;
  public successMessage: string | null = null;

  dashboardStats: any = {
    profit: 0
  };

  // Propriétés pour les notifications
showNotificationBar = false;
notificationMessage = '';
notificationType: 'success' | 'error' | 'info' = 'info';

  profitabilityParams = {
    numberOfChickens: 0,
    chickPrice: 0,
    feedCost: 0,
    otherCosts: 0,
    sales: [{ quantity: 0, unitPrice: 0 }] // Tableau pour les ventes
  };

  profitabilityResults: ProfitabilityResults | null = null;

  // Propriétés pour les calculs
  feedCalculation = {
    chickenCount: 0,
    numberOfWeeks: 0,
    result: {
      demarrage: { totalFeedConsumptionKg: 0, bagsNeeded: 0, totalCostFCFA: 0 },
      croissance: { totalFeedConsumptionKg: 0, bagsNeeded: 0, totalCostFCFA: 0 },
      finition: { totalFeedConsumptionKg: 0, bagsNeeded: 0, totalCostFCFA: 0 }
    } as FeedRequirements,
    totalFeedConsumptionKg: 0,
    totalBagsNeeded: 0,
    totalCostFCFA: 0,
    bagsRequired: 0,
    estimatedMortality: 0, // Initialize this
    survivingChickens: 0  // Initialize this
  };


  profitabilityCalculation: ProfitabilityCalculation = {
    revenue: 0,
    costs: 0,
    result: 0,
    profit: 0,           // Initialisé à 0
    profitMargin: 0,     // Initialisé à 0
    chickPrice: 0,
    sellingPricePerKg: 0,
    averageWeightKg: 0,
    mortalityRate: 0,
    feedCost: 0,
    otherCostsPerChicken: 0,
    totalRevenue: 0,     // Initialisé à 0
    totalCosts: 0        // Initialisé à 0
  };

  

  // Propriétés pour la gestion de la production
  productionManagement: ProductionManagement = {
  totalProduction: 0,
  deaths: 0,
  updatedProduction: 0,
  chickenCount: 0, // Initialisez cette propriété
  mortality: 0,    // Initialisez cette propriété
};

  feedBagSize = 50;
  feedPrices: { [key: string]: number } = { 'demarrage': 15000, 'croissance': 17000, 'finition': 18000 };

  constructor(
    private costService: CostService,
    private productionService: ProductionService,
    private dialog: MatDialog
  ) {}

  // 1. Vérifiez que votre service renvoie bien des données
  ngOnInit() {
    this.loadDashboardData();
    
    // Ajoutez un log pour vérifier si des données sont récupérées
    this.productionService.getAllProductions().subscribe(data => {
      console.log('Productions récupérées:', data);
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = null;
  
    forkJoin({
      productions: this.productionService.getAllProductions(),
      costStats: this.costService.getCostStats(),
      productionStats: this.productionService.getProductionStats(),
      totalCosts: this.costService.calculateTotalCosts(),
      costHistory: this.costService.getCostHistory(undefined, undefined, 20) // Récupérer l'historique des coûts
    }).subscribe({
      next: (data) => {
        // Gérer les productions
        this.productions = data.productions;
  
        // Récupérer la dernière production pour les statistiques
        const lastProduction = data.productions[data.productions.length - 1];
  
        // Mettre à jour les statistiques de production
        this.productionStats = {
          totalProduction: lastProduction ? lastProduction.chickenCount : 0,
          totalMortality: lastProduction ? lastProduction.mortality : 0
        };
  
        // Mettre à jour le formulaire de gestion de production avec les dernières valeurs
        this.productionManagement = {
          totalProduction: lastProduction ? lastProduction.chickenCount + lastProduction.mortality : 0,
          deaths: lastProduction ? lastProduction.mortality : 0,
          updatedProduction: lastProduction ? lastProduction.chickenCount : 0,
          chickenCount: lastProduction ? lastProduction.chickenCount : 0,
          mortality: lastProduction ? lastProduction.mortality : 0
        };
  
        // Mettre à jour les autres statistiques
        this.costStats = data.costStats;
        this.totalCosts = data.totalCosts;
  
        // Mettre à jour les calculs depuis l'historique
        this.updateCalculationsFromHistory(data.costHistory);
  
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Une erreur est survenue lors du chargement des données';
        this.loading = false;
        console.error(err);
      }
    });
  }


  // Méthode pour afficher une notification
private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
  this.notificationMessage = message;
  this.notificationType = type;
  this.showNotificationBar = true;

  // Fermer automatiquement la notification après 5 secondes
  setTimeout(() => {
    this.showNotificationBar = false;
  }, 5000);
}


  // Méthode pour ajouter une nouvelle vente
  addSale() {
    this.profitabilityParams.sales.push({ quantity: 0, unitPrice: 0 });
  }


  // Méthode pour supprimer une vente
  removeSale(index: number) {
    this.profitabilityParams.sales.splice(index, 1);
  }


  // // Add these methods to the class
exportResultsToCSV(): void {
  // Existing implementation from line 320-329
  // This is already in your component but not declared properly
}



exportProfitabilityToCSV(): void {
  const headers = ['Métrique', 'Valeur'];
  const data = [
    ['Revenus totaux', this.profitabilityCalculation?.totalRevenue?.toString() || '0'],
    ['Coûts totaux', this.profitabilityCalculation?.totalCosts?.toString() || '0'],
    ['Profit', this.profitabilityStats?.profit?.toString() || '0'],
    ['Marge de profit (%)', this.profitabilityStats?.profitMargin?.toString() || '0']
  ];
  
  this.exportToCSV(data, headers, 'rentabilite_poulailler.csv');
}


private exportToCSV(data: any[], headers: string[], filename: string): void {
  let csvContent = headers.join(',') + '\n';

  data.forEach(row => {
    csvContent += row.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  link.click();
  document.body.removeChild(link);
}
  
  // If you don't already have this utility method, add it too
  // private exportToCSV(data: any[], headers: string[], filename: string): void {
  //   let csvContent = headers.join(',') + '\n';
    
  //   data.forEach(row => {
  //     csvContent += row.join(',') + '\n';
  //   });
    
  //   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  //   const link = document.createElement('a');
  //   const url = URL.createObjectURL(blob);
    
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', filename);
  //   link.style.visibility = 'hidden';
    
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // }
  



  private updateCalculationsFromHistory(costHistory: any[]) {
    if (!costHistory || costHistory.length === 0) return;
  
    console.log('Cost history:', costHistory);
  
    // Trouver le dernier calcul de rentabilité
    const lastProfitCalc = costHistory
      .filter(cost => cost.type === 'profitability_calculation')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
    console.log('Last profitability calculation:', lastProfitCalc);
  
    // Mettre à jour les données de calcul de rentabilité
    if (lastProfitCalc) {
      // Récupérer dynamicData, que ce soit un objet ou une Map
      let dynamicData: any = lastProfitCalc.dynamicData;
  
      // Si dynamicData est une Map, on la convertit en objet pour faciliter l'accès
      if (dynamicData instanceof Map) {
        const obj: any = {};
        dynamicData.forEach((value, key) => {
          obj[key] = value;
        });
        dynamicData = obj;
      } else if (typeof dynamicData !== 'object' || dynamicData === null) {
        // Si dynamicData n'est pas un objet, on initialise un objet vide
        dynamicData = {};
      }
  
      console.log('Profitability dynamic data:', dynamicData);
  
      // Mettre à jour profitabilityCalculation
      this.profitabilityCalculation = {
        ...this.profitabilityCalculation,
        revenue: parseFloat(dynamicData.totalRevenue) || 0,
        costs: parseFloat(dynamicData.totalCosts) || 0,
        profit: parseFloat(dynamicData.profit) || 0,
        profitMargin: parseFloat(dynamicData.profitMargin) || 0,
        totalRevenue: parseFloat(dynamicData.totalRevenue) || 0,
        totalCosts: parseFloat(dynamicData.totalCosts) || 0
      };
  
      console.log('Updated Profitability Calculation:', this.profitabilityCalculation);
    }
  }

  // Calculer les besoins en alimentation
  calculateFeedRequirements() {
    const { chickenCount, numberOfWeeks } = this.feedCalculation;
    const currentDateTime = new Date().toISOString();
    const currentUser = 'Antoine627';
    
    // Vérification des entrées
    if (chickenCount <= 0 || numberOfWeeks <= 0) {
      this.error = 'Veuillez entrer des valeurs valides pour le nombre de volailles et le nombre de semaines';
      setTimeout(() => this.error = null, 5000);
      return;
    }
    
    console.log('Calcul avec:', { chickenCount, numberOfWeeks });
    
    // Taux de mortalité approximatif par semaine (peut être ajusté)
    const weeklyMortalityRate = 0.005; // 0.5% par semaine
    
    // Calcul pour chaque phase d'alimentation avec prise en compte du taux de mortalité
    const demarrage = this.calculatePhaseRequirementsWithMortality('demarrage', chickenCount, numberOfWeeks, weeklyMortalityRate);
    const croissance = this.calculatePhaseRequirementsWithMortality('croissance', chickenCount, numberOfWeeks, weeklyMortalityRate);
    const finition = this.calculatePhaseRequirementsWithMortality('finition', chickenCount, numberOfWeeks, weeklyMortalityRate);
    
    console.log('Résultats:', { demarrage, croissance, finition });
    
    // Mettre à jour le résultat
    this.feedCalculation.result = {
      demarrage,
      croissance,
      finition
    };
    
    // Calculer les totaux pour l'affichage dans les cards
    this.feedCalculation.totalFeedConsumptionKg =
      demarrage.totalFeedConsumptionKg + croissance.totalFeedConsumptionKg + finition.totalFeedConsumptionKg;
    
    this.feedCalculation.totalBagsNeeded =
      demarrage.bagsNeeded + croissance.bagsNeeded + finition.bagsNeeded;
    
    this.feedCalculation.totalCostFCFA =
      demarrage.totalCostFCFA + croissance.totalCostFCFA + finition.totalCostFCFA;
    
    // Estimer le nombre final de volailles après mortalité
    const estimatedSurvivingChickens = chickenCount * Math.pow(1 - weeklyMortalityRate, numberOfWeeks);
    this.feedCalculation.estimatedMortality = chickenCount - Math.floor(estimatedSurvivingChickens);
    this.feedCalculation.survivingChickens = Math.floor(estimatedSurvivingChickens);
    
    // Afficher les résultats
    this.showResults = true;
    
    // Masquer les résultats après 30 secondes
    setTimeout(() => {
      this.showResults = false;
    }, 30000);
    
    // Créer l'objet Production pour la base de données
    const production: Production = {
      chickenCount: chickenCount,
      mortality: this.feedCalculation.estimatedMortality || 0
    };
    
    // Créer une Map pour dynamicData
    const dynamicData = new Map<string, string>([
      ['chickenCount', chickenCount.toString()],
      ['numberOfWeeks', numberOfWeeks.toString()],
      ['totalFeedConsumptionKg', this.feedCalculation.totalFeedConsumptionKg.toString()],
      ['totalBagsNeeded', this.feedCalculation.totalBagsNeeded.toString()],
      ['estimatedMortality', this.feedCalculation.estimatedMortality?.toString() || '0'],
      ['survivingChickens', this.feedCalculation.survivingChickens?.toString() || chickenCount.toString()],
      ['calculatedBy', currentUser],
      ['calculatedAt', currentDateTime]
    ]);
    
    // Sauvegarder la production
    this.productionService.addProduction(production).subscribe({
      next: (savedProduction) => {
        console.log('Production sauvegardée:', savedProduction);
        
        // Créer et sauvegarder le coût associé
        const cost = {
          type: 'feed_calculation',
          description: `Calcul d'alimentation pour ${chickenCount} volailles sur ${numberOfWeeks} semaines`,
          amount: this.feedCalculation.totalCostFCFA,
          date: new Date(currentDateTime),
          dynamicData: dynamicData
        };
        
        // Dans calculateFeedRequirements()
        this.costService.addCost(cost).subscribe({
          next: (savedCost) => {
            console.log('Coût sauvegardé:', savedCost);
            this.loadDashboardData();
            this.showNotification('Calcul d\'alimentation effectué avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la sauvegarde du coût:', error);
            this.showNotification('Erreur lors de la sauvegarde du calcul d\'alimentation', 'error');
          }
        });

        // Dans calculateProfitability()
        this.costService.addCost(cost).subscribe({
          next: (savedCost) => {
            console.log('Coût de rentabilité enregistré:', savedCost);
            this.loadDashboardData();
            this.showNotification('Calcul de rentabilité effectué avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de l\'enregistrement du coût:', error);
            this.showNotification('Erreur lors de l\'enregistrement du calcul de rentabilité', 'error');
          }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la sauvegarde de la production:', error);
        this.error = 'Erreur lors de la sauvegarde de la production';
        setTimeout(() => this.error = null, 5000);
      }
    });
  }

  addProduction() {
    const { chickenCount, mortality } = this.productionManagement;
    const production: Production = {
      chickenCount,
      mortality
    };

    this.productionService.addProduction(production).subscribe({
      next: (savedProduction) => {
        console.log('Production ajoutée:', savedProduction);
        this.loadDashboardData();
        this.isAdding = false; // Changer l'état du bouton en "Modifier"
      },
      error: (error) => {
        console.error('Erreur lors de l\'ajout de la production:', error);
      }
    });
  }
  


  editProduction(production: Production) {
    this.editingProduction = production;
    this.editForm = {
      chickenCount: production.chickenCount,
      mortality: production.mortality
    };
    this.showEditModal = true;
  }


  saveEditedProduction() {
    if (!this.editingProduction?._id) return;

    const updatedProduction: Production = {
      ...this.editingProduction,
      ...this.editForm,
      updatedAt: new Date('2025-02-27 23:38:11')
    };

    this.productionService.updateProduction(this.editingProduction._id, updatedProduction).subscribe({
      next: (updated) => {
        // Mettre à jour la liste des productions
        this.productions = this.productions.map(p =>
          p._id === updated._id ? updated : p
        );
        this.showEditModal = false;
        this.editingProduction = null;
        this.loadDashboardData(); // Recharger les données
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
        // Gérer l'erreur (afficher un message à l'utilisateur)
      }
    });
  }


  deleteProduction(production: Production) {
    if (!production._id) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmer la suppression',
        message: 'Êtes-vous sûr de vouloir supprimer cette production ?',
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        confirmButtonIcon: 'delete',
        confirmButtonColor: '#f44336' // Rouge pour l'action de suppression
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.productionService.deleteProduction(production._id!).subscribe({
          next: () => {
            this.productions = this.productions.filter(p => p._id !== production._id);
            this.loadDashboardData(); // Recharger les données
            this.showNotification('Production supprimée avec succès', 'success');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.showNotification('Erreur lors de la suppression de la production', 'error');
          }
        });
      }
    });
  }

  cancelEdit() {
    this.showEditModal = false;
    this.editingProduction = null;
  }



  // Fonction utilitaire pour calculer les besoins pour chaque phase
  private calculatePhaseRequirements(phase: keyof FeedRequirements, chickenCount: number, weeks: number): FeedRequirement {
    const dailyFeedPerChicken: { [key in keyof FeedRequirements]: number } = {
      'demarrage': 0.035, // kg par jour
      'croissance': 0.07,
      'finition': 0.12
    };

    // Calcul corrigé des durées de phase
    let phaseDuration: number;
    if (phase === 'demarrage') {
      phaseDuration = Math.min(weeks, 3); // 3 premières semaines
    } else if (phase === 'croissance') {
      if (weeks <= 3) {
        phaseDuration = 0; // Pas de phase croissance si moins de 3 semaines
      } else {
        phaseDuration = Math.min(weeks - 3, 3); // 3 semaines ou moins après démarrage
      }
    } else { // phase === 'finition'
      if (weeks <= 6) {
        phaseDuration = 0; // Pas de phase finition si moins de 6 semaines
      } else {
        phaseDuration = weeks - 6; // Reste des semaines après croissance
      }
    }

    // Assurez-vous que les durées ne sont jamais négatives
    phaseDuration = Math.max(0, phaseDuration);
    
    console.log(`Phase ${phase}: durée = ${phaseDuration} semaines`);

    const totalFeedConsumptionKg = chickenCount * dailyFeedPerChicken[phase] * phaseDuration * 7;
    // Utiliser Math.ceil pour arrondir au sac supérieur
    const bagsNeeded = Math.ceil(totalFeedConsumptionKg / this.feedBagSize);
    const totalCostFCFA = bagsNeeded * this.feedPrices[phase];

    return {
      totalFeedConsumptionKg,
      bagsNeeded,
      totalCostFCFA
    };
  }



  private calculatePhaseRequirementsWithMortality(
    phase: keyof FeedRequirements, 
    initialChickenCount: number, 
    totalWeeks: number, 
    weeklyMortalityRate: number
  ): FeedRequirement {
    const dailyFeedPerChicken: { [key in keyof FeedRequirements]: number } = {
      'demarrage': 0.035, // kg par jour
      'croissance': 0.07,
      'finition': 0.12
    };
  
    // Déterminer la période de chaque phase
    let startWeek = 0;
    let endWeek = 0;
    
    if (phase === 'demarrage') {
      startWeek = 1;
      endWeek = Math.min(totalWeeks, 3);
    } else if (phase === 'croissance') {
      startWeek = 4;
      endWeek = Math.min(totalWeeks, 6);
    } else { // phase === 'finition'
      startWeek = 7;
      endWeek = totalWeeks;
    }
    
    let phaseDuration = Math.max(0, endWeek - startWeek + 1);
    
    // Ne pas calculer si la phase ne s'applique pas
    if (startWeek > totalWeeks) {
      return {
        totalFeedConsumptionKg: 0,
        bagsNeeded: 0,
        totalCostFCFA: 0
      };
    }
    
    console.log(`Phase ${phase}: semaines ${startWeek}-${endWeek}, durée = ${phaseDuration} semaines`);
    
    // Calculer la consommation avec mortalité progressive
    let totalFeedConsumptionKg = 0;
    let currentChickenCount = initialChickenCount;
    
    for (let week = startWeek; week <= endWeek; week++) {
      // Appliquer la mortalité
      if (week > 1) {
        currentChickenCount *= (1 - weeklyMortalityRate);
      }
      
      // Calculer la consommation hebdomadaire
      const weeklyConsumption = currentChickenCount * dailyFeedPerChicken[phase] * 7;
      totalFeedConsumptionKg += weeklyConsumption;
    }
    
    // Arrondir le nombre de volailles pour l'affichage
    currentChickenCount = Math.floor(currentChickenCount);
    
    // Utiliser Math.ceil pour arrondir au sac supérieur
    const bagsNeeded = Math.ceil(totalFeedConsumptionKg / this.feedBagSize);
    const totalCostFCFA = bagsNeeded * this.feedPrices[phase];
    
    return {
      totalFeedConsumptionKg,
      bagsNeeded,
      totalCostFCFA
    };
  }

  // Calculer la rentabilité
  calculateProfitability() {
    // Calculer le revenu total en fonction des ventes
    const totalRevenue = this.profitabilityParams.sales.reduce(
      (sum, sale) => sum + sale.quantity * sale.unitPrice,
      0
    );
  
    // Calculer les coûts totaux
    const totalCosts =
      this.profitabilityParams.numberOfChickens * this.profitabilityParams.chickPrice +
      this.profitabilityParams.feedCost +
      this.profitabilityParams.otherCosts;
  
    // Calculer le profit
    const profit = totalRevenue - totalCosts;
  
    // Calculer la marge bénéficiaire
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  
    // Mettre à jour profitabilityCalculation
    this.profitabilityCalculation = {
      ...this.profitabilityCalculation,
      revenue: totalRevenue,
      costs: totalCosts,
      profit: profit,
      profitMargin: profitMargin,
      totalRevenue: totalRevenue,
      totalCosts: totalCosts
    };
  
    console.log('Profitability Calculation:', this.profitabilityCalculation);
  
    // Convertir dynamicData en Map
    const dynamicDataMap = new Map<string, string>();
    dynamicDataMap.set('numberOfChickens', this.profitabilityParams.numberOfChickens.toString());
    dynamicDataMap.set('totalRevenue', totalRevenue.toString());
    dynamicDataMap.set('totalCosts', totalCosts.toString());
    dynamicDataMap.set('profit', profit.toString());
    dynamicDataMap.set('profitMargin', profitMargin.toString());
  
    // Préparer les données à enregistrer
    const costData = {
      type: 'profitability_calculation',
      description: 'Calcul de rentabilité pour le lot X',
      amount: totalCosts,
      date: new Date(),
      category: 'other',
      dynamicData: dynamicDataMap, // Utiliser le Map converti
      profitabilityDetails: {
        numberOfChickens: this.profitabilityParams.numberOfChickens,
        totalRevenue: totalRevenue,
        totalCosts: totalCosts,
        profit: profit,
        profitMargin: profitMargin,
        sales: this.profitabilityParams.sales
      }
    };
  
    // Envoyer les données à l'API
    this.costService.addCost(costData).subscribe({
      next: (savedCost) => {
        console.log('Coût de rentabilité enregistré:', savedCost);
        this.loadDashboardData(); // Recharger les données si nécessaire
      },
      error: (error) => {
        console.error('Erreur lors de l\'enregistrement du coût:', error);
      }
    });
  }


  private prepareMapForMongoDB(map: Map<string, string>): { [key: string]: string } {
    const obj: { [key: string]: string } = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  private mapToObject(map: Map<string, string>): { [key: string]: string } {
    const obj: { [key: string]: string } = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  // Mettre à jour la production en fonction des décès
  updateProduction() {
    this.productionManagement.updatedProduction =
      this.productionManagement.totalProduction - this.productionManagement.deaths;
    
    // Mettre à jour la production totale dans les cartes
    this.productionStats = {
      ...this.productionStats,
      totalProduction: this.productionManagement.updatedProduction,
    };
  }
}