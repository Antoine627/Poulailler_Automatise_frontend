import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent {
  currentPage = 1;
  itemsPerPage = 2;
  alimentationHistory = [
    { date: '01/01/2023', heure: '10:00', quantite: '5kg', mode: 'Automatique' },
    { date: '01/01/2023', heure: '16:00', quantite: '5kg', mode: 'Automatique' },
    { date: '02/01/2023', heure: '7:00', quantite: '6kg', mode: 'Manuel' },
    { date: '02/01/2023', heure: '7:00', quantite: '6kg', mode: 'Manuel' }
  ];

  get paginatedData() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.alimentationHistory.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number) {
    this.currentPage = page;
  }

  get totalPages() {
    return Math.ceil(this.alimentationHistory.length / this.itemsPerPage);
  }
}
