import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HistoryService } from '../../services/history.service';
import { History } from '../../models/history.model';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './historiques.component.html',
  styleUrls: ['./historiques.component.scss'],
})
export class HistoriquesComponent implements OnInit {
  // Constantes système mises à jour
  readonly CURRENT_UTC_DATETIME = '2025-02-25 16:48:27';
  readonly CURRENT_USER = 'Antoine627';

  // Données de l'historique
  historyData: History[] = [];
  filteredHistory: History[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Filtres et périodes
  periodes = [
    { value: 'jour', label: "Aujourd'hui" },
    { value: 'semaine', label: '7 derniers jours' },
    { value: 'mois', label: '30 derniers jours' },
    { value: 'personnalise', label: 'Période personnalisée' },
  ];

  periodeSelectionnee = 'jour';
  afficherDatesPersonnalisees = false;
  dateDebut: string = '';
  dateFin: string = '';

  // États
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private historyService: HistoryService) {
    this.initializeDates();
  }

  private initializeDates(): void {
    const currentDate = this.CURRENT_UTC_DATETIME.split(' ')[0];
    this.dateDebut = currentDate;
    this.dateFin = currentDate;
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  private getDateRange(): { startDate: string; endDate: string } {
    const currentDate = new Date(this.CURRENT_UTC_DATETIME);
    let startDate: Date;
    let endDate: Date = currentDate;

    switch (this.periodeSelectionnee) {
      case 'jour':
        startDate = new Date(currentDate.setHours(0, 0, 0, 0));
        endDate = new Date(currentDate.setHours(23, 59, 59, 999));
        break;

      case 'semaine':
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'mois':
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        break;

      case 'personnalise':
        startDate = new Date(`${this.dateDebut}T00:00:00.000Z`);
        endDate = new Date(`${this.dateFin}T23:59:59.999Z`);
        break;

      default:
        startDate = new Date(currentDate.setHours(0, 0, 0, 0));
        endDate = new Date(currentDate.setHours(23, 59, 59, 999));
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }


  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }


  getVisiblePages(): number[] {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: number[] = [];
    let l: number;

    for (let i = Math.max(2, this.currentPage - delta); 
         i <= Math.min(this.totalPages - 1, this.currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (range[0] > 2) {
      range.unshift(-1); // Ajouter l'ellipsis au début
    }
    if (range[range.length - 1] < this.totalPages - 1) {
      range.push(-1); // Ajouter l'ellipsis à la fin
    }

    return range;
  }
  

  loadHistory(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    const { startDate, endDate } = this.getDateRange();

    console.log('Chargement historique:', {
      periode: this.periodeSelectionnee,
      startDate,
      endDate,
      currentDateTime: this.CURRENT_UTC_DATETIME,
      currentUser: this.CURRENT_USER
    });

    this.historyService.getHistory(undefined, startDate, endDate, this.itemsPerPage, this.currentPage)
      .subscribe({
        next: (data) => {
          this.historyData = data.history;
          this.filteredHistory = data.history;
          this.totalItems = data.pagination.total;
          this.loading = false;
          this.success = 'Historique chargé avec succès';
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'historique:', error);
          this.error = error.message || 'Erreur lors du chargement de l\'historique';
          this.loading = false;
        }
      });
  }

  appliquerFiltres(): void {
    this.currentPage = 1;
    this.loadHistory();
  }

   // Mettre à jour la méthode onPageChange
   onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadHistory();
    }
  }

  onPeriodeChange(event: any): void {
    this.periodeSelectionnee = event.target.value;
    this.afficherDatesPersonnalisees = this.periodeSelectionnee === 'personnalise';
    this.appliquerFiltres();
  }

  exporterDonnees(format: string): void {
    const timestamp = this.CURRENT_UTC_DATETIME.replace(/[: ]/g, '_');
    const filename = `historique_${timestamp}.${format}`;
    
    const metadata = {
      exportedAt: this.CURRENT_UTC_DATETIME,
      exportedBy: this.CURRENT_USER,
      format: format,
      filters: {
        periode: this.periodeSelectionnee,
        dateDebut: this.dateDebut,
        dateFin: this.dateFin
      }
    };

    console.log('Export des données:', {
      filename,
      metadata,
      currentDateTime: this.CURRENT_UTC_DATETIME,
      currentUser: this.CURRENT_USER
    });
  }

  getPaginationPages(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  formatData(data: any): string {
    if (!data) return '';

    // Ajouter les informations système
    const systemInfo = {
      timestamp: this.CURRENT_UTC_DATETIME,
      user: this.CURRENT_USER
    };

    const enrichedData = { ...data, system: systemInfo };

    // Traductions
    const translations: { [key: string]: string } = {
      timestamp: 'Date et heure',
      user: 'Utilisateur',
      updatedAt: 'Mis à jour le',
      updatedBy: 'Mis à jour par',
      createdAt: 'Créé le',
      createdBy: 'Créé par'
    };

    return Object.entries(enrichedData)
      .map(([key, value]) => {
        const translatedKey = translations[key] || key;

        // Formater les dates
        if (value instanceof Date || (typeof value === 'string' && value.includes('T'))) {
          const date = new Date(value);
          return `${translatedKey}: ${date.toLocaleString('fr-FR', { timeZone: 'UTC' })}`;
        }

        // Formater les objets
        if (typeof value === 'object' && value !== null) {
          return `${translatedKey}: ${JSON.stringify(value)}`;
        }

        return `${translatedKey}: ${value}`;
      })
      .join(', ');
  }
}