import { Component, OnInit } from '@angular/core';
import { CostService } from '../../services/cost.service';
import { ProductionService } from '../../services/production.service';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
    feedPerChicken: 0,
    bagWeight: 25, // Poids d'un sac en kg
    result: 0,
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
    this.feedCalculation.result =
      this.feedCalculation.chickenCount * this.feedCalculation.feedPerChicken;
    this.feedCalculation.bagsRequired = Math.ceil(
      this.feedCalculation.result / this.feedCalculation.bagWeight
    );
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