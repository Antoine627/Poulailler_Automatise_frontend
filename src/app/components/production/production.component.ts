import { Component, OnInit } from '@angular/core';
import { CostService } from '../../services/cost.service';
import { ProductionService } from '../../services/production.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';

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

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './production.component.html',
  styleUrls: ['./production.component.css'],
})
export class ProductionComponent implements OnInit {
  productions: any[] = [];
  costStats: any[] = [];
  productionStats: any = null;
  totalCosts: any = null;
  loading = true;
  error = null;

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
  };

  profitabilityCalculation = {
    revenue: 0,
    costs: 0,
    result: 0,
  };

  // Propriétés pour la gestion de la production
  productionManagement = {
    totalProduction: 0,
    deaths: 0,
    updatedProduction: 0,
  };

  feedBagSize = 50;
  feedPrices: { [key: string]: number } = { 'demarrage': 15000, 'croissance': 17000, 'finition': 18000 };

  constructor(
    private costService: CostService,
    private productionService: ProductionService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading = true;
    forkJoin({
      productions: this.productionService.getAllProductions(),
      costStats: this.costService.getCostStats(),
      productionStats: this.productionService.getProductionStats(),
      totalCosts: this.costService.calculateTotalCosts(),
    }).subscribe({
      next: (data) => {
        this.productions = data.productions;
        this.costStats = data.costStats;
        this.productionStats = data.productionStats;
        this.totalCosts = data.totalCosts;
        this.loading = false;
      },
      // error: (err) => {
      //   this.error = 'Une erreur est survenue lors du chargement des données';
      //   this.loading = false;
      //   console.error(err);
      // },
    });
  }

  // Calculer les besoins en alimentation
  calculateFeedRequirements() {
    const { chickenCount, numberOfWeeks } = this.feedCalculation;

    // Initialiser les totaux pour chaque type d'aliment
    const feedRequirements: FeedRequirements = {
      demarrage: { totalFeedConsumptionKg: 0, bagsNeeded: 0, totalCostFCFA: 0 },
      croissance: { totalFeedConsumptionKg: 0, bagsNeeded: 0, totalCostFCFA: 0 },
      finition: { totalFeedConsumptionKg: 0, bagsNeeded: 0, totalCostFCFA: 0 }
    };

    // Calcul de la consommation totale et du coût pour chaque phase
    for (let week = 1; week <= numberOfWeeks; week++) {
      let feedType: keyof FeedRequirements;
      let weeklyRate: number;

      if (week === 1) {
        feedType = 'demarrage';
        weeklyRate = 0.35;
      } else if (week >= 2 && week <= 4) {
        feedType = 'croissance';
        weeklyRate = 0.65;
      } else {
        feedType = 'finition';
        weeklyRate = 0.9;
      }

      feedRequirements[feedType].totalFeedConsumptionKg += weeklyRate * chickenCount;
    }

    // Calculer les sacs nécessaires et le coût total pour chaque type d'aliment
    let totalFeedConsumptionKg = 0;
    let totalBagsNeeded = 0;
    let totalCostFCFA = 0;

    for (const feedType of Object.keys(feedRequirements)) {
      feedRequirements[feedType as keyof FeedRequirements].bagsNeeded = Math.ceil(feedRequirements[feedType as keyof FeedRequirements].totalFeedConsumptionKg / this.feedBagSize);
      feedRequirements[feedType as keyof FeedRequirements].totalCostFCFA = feedRequirements[feedType as keyof FeedRequirements].bagsNeeded * this.feedPrices[feedType as keyof typeof this.feedPrices];

      totalFeedConsumptionKg += feedRequirements[feedType as keyof FeedRequirements].totalFeedConsumptionKg;
      totalBagsNeeded += feedRequirements[feedType as keyof FeedRequirements].bagsNeeded;
      totalCostFCFA += feedRequirements[feedType as keyof FeedRequirements].totalCostFCFA;
    }

    this.feedCalculation.result = feedRequirements;
    this.feedCalculation.totalFeedConsumptionKg = totalFeedConsumptionKg;
    this.feedCalculation.totalBagsNeeded = totalBagsNeeded;
    this.feedCalculation.totalCostFCFA = totalCostFCFA;
  }

  // Calculer la rentabilité
  calculateProfitability() {
    this.profitabilityCalculation.result =
      ((this.profitabilityCalculation.revenue - this.profitabilityCalculation.costs) /
        this.profitabilityCalculation.costs) *
      100;
    // Mettre à jour les coûts totaux et la rentabilité dans les cartes
    this.totalCosts = {
      total: this.profitabilityCalculation.costs,
      profitability: this.profitabilityCalculation.result,
    };
  }

  // Mettre à jour la production en fonction des décès
  updateProduction() {
    this.productionManagement.updatedProduction =
      this.productionManagement.totalProduction - this.productionManagement.deaths;
    // Mettre à jour la production totale dans les cartes
    this.productionStats = {
      totalProduction: this.productionManagement.updatedProduction,
    };
  }
}