import { Component, OnInit } from '@angular/core';
import { TestService } from '../../services/test.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FeedData {
  numberOfChickens: number;
  numberOfWeeks: number;
}

interface SalesData {
  sales: number;
}

interface DeathsData {
  numberOfDeaths: number;
}

interface FeedRequirements {
  start: { totalFeedRequired: number; estimatedCost: number };
  growth: { totalFeedRequired: number; estimatedCost: number };
  finish: { totalFeedRequired: number; estimatedCost: number };
}

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})

export class TestComponent implements OnInit {
  tests: any[] = [];
  selectedTestId: string = '';
  feedData: any = {
    feedPrices: {
      start: 500,
      growth: 450,
      finish: 400
    }
  };
  salesData: any = { sales: [] };
  deaths: number = 0;

  constructor(private testService: TestService) {}

  ngOnInit(): void {
    this.loadTests();
  }

  // Charger tous les tests
  loadTests(): void {
    this.testService.getTests().subscribe(
      (data) => {
        this.tests = data;
      },
      (error) => {
        console.error('Error loading tests', error);
      }
    );
  }

  // Calculer les besoins en alimentation
  calculateFeed(): void {
    this.testService.calculateFeedRequirements(this.selectedTestId, this.feedData).subscribe(
      (data) => {
        console.log('Feed requirements calculated', data);
        this.loadTests();  // Recharger les tests pour voir les résultats
      },
      (error) => {
        console.error('Error calculating feed requirements', error);
      }
    );
  }

  // Calculer la rentabilité
  calculateProfitability(): void {
    this.testService.calculateProfitability(this.selectedTestId, this.salesData).subscribe(
      (data) => {
        console.log('Profitability calculated', data);
        this.loadTests();  // Recharger les tests pour voir les résultats
      },
      (error) => {
        console.error('Error calculating profitability', error);
      }
    );
  }

  // Enregistrer les décès
  recordDeaths(): void {
    this.testService.recordDeaths(this.selectedTestId, this.deaths).subscribe(
      (data) => {
        console.log('Deaths recorded', data);
        this.loadTests();  // Recharger les tests pour voir les résultats
      },
      (error) => {
        console.error('Error recording deaths', error);
      }
    );
  }
}
