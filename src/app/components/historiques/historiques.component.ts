import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HistoryService } from '../../services/history.service'; // Importez le service
import { History } from '../../models/history.model'; // Importez l'interface

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './historiques.component.html',
  styleUrls: ['./historiques.component.scss'],
})


export class HistoriquesComponent implements OnInit {
  // Données de l'historique
  historyData: History[] = [];
  filteredHistory: History[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Options de périodes pour le filtre
  periodes = [
    { value: 'jour', label: "Aujourd'hui" },
    { value: 'semaine', label: '7 derniers jours' },
    { value: 'mois', label: '30 derniers jours' },
    { value: 'personnalise', label: 'Période personnalisée' },
  ];

  periodeSelectionnee = 'jour'; // Aujourd'hui par défaut
  afficherDatesPersonnalisees = false;
  dateDebut = new Date().toISOString().split('T')[0]; // Date d'aujourd'hui
  dateFin = new Date().toISOString().split('T')[0]; // Date d'aujourd'hui

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  // Charger l'historique depuis le backend
  loadHistory(): void {
    const startDate = this.periodeSelectionnee === 'jour' ? this.dateDebut : undefined;
    const endDate = this.periodeSelectionnee === 'jour' ? this.dateFin : undefined;

    this.historyService.getHistory(undefined, startDate, endDate, this.itemsPerPage, this.currentPage).subscribe({
      next: (data) => {
        this.historyData = data.history;
        this.filteredHistory = data.history;
        this.totalItems = data.pagination.total;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
      },
    });
  }

  // Appliquer les filtres
  appliquerFiltres(): void {
    this.currentPage = 1; // Réinitialiser la pagination
    this.loadHistory();
  }

  // Changer de page
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadHistory();
  }

  // Exporter les données
  exporterDonnees(format: string): void {
    console.log(`Exportation en format ${format} déclenchée`);
    // Implémentez la logique d'exportation ici
  }

  // Gérer le changement de période
  onPeriodeChange(event: any): void {
    this.periodeSelectionnee = event.target.value;
    this.afficherDatesPersonnalisees = this.periodeSelectionnee === 'personnalise';
    this.appliquerFiltres();
  }

  // Générer les numéros de page pour la pagination
  getPaginationPages(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Formater les données de manière lisible
  formatData(data: any): string {
    if (!data) return ''; // Si les données sont vides, retourner une chaîne vide
  
    // Dictionnaire de traduction pour les clés
    const translations: { [key: string]: string } = {
      vaccineId: 'ID du vaccin',
      vaccineName: 'Nom du vaccin',
      vaccineCount: 'Nombre de vaccins',
      summaryDate: 'Date du résumé',
      administeredDate: 'Date d\'administration',
      // Ajoutez d'autres traductions ici
    };
  
    // Dictionnaire de traduction pour les valeurs spécifiques
    const valueTranslations: { [key: string]: string } = {
      'Newcastle + Bronchite': 'Newcastle + Bronchite (FR)',
      'Marek': 'Marek (FR)',
      // Ajoutez d'autres traductions de valeurs ici
    };
  
    // Formater les données en français
    return Object.keys(data)
      .map((key) => {
        const translatedKey = translations[key] || key; // Traduire la clé
        let value = data[key];
  
        // Traduire la valeur si nécessaire
        if (typeof value === 'string' && valueTranslations[value]) {
          value = valueTranslations[value];
        }
  
        return `${translatedKey}: ${value}`; // Retourner la paire clé-valeur traduite
      })
      .join(', '); // Joindre les résultats avec une virgule
  }
}