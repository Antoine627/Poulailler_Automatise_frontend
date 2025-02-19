import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AlimentationService, Feeding } from '../../services/alimentation.service';
import { StockService } from '../../services/stock.service';
import { Stock, StockStats } from '../../models/stock.model';

@Component({
  selector: 'app-feeding-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feeding-schedule.component.html',
  styleUrls: ['./feeding-schedule.component.css']
})
export class FeedingScheduleComponent implements OnInit {
  @ViewChild('addModal') addModal!: TemplateRef<any>;

  nourritures: Feeding[] = [];
  eau: Feeding[] = [];
  stocks: Stock[] = [];
  stockAlerts: Stock[] = [];
  newStartTime: string = '';
  newEndTime: string = '';
  newQuantity: number = 0;
  newFeedType: string = '';
  newStockQuantity: number = 0;
  newStockId: string = '';
  newNotes: string = '';
  newAutomaticFeeding: boolean = true;
  newProgramStartTime: string = '';
  newProgramEndTime: string = '';
  currentSection: string = '';
  editIndex: number | null = null;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private alimentationService: AlimentationService,
    private stockService: StockService
  ) {}

  ngOnInit() {
    this.loadFeedings();
  }

  loadFeedings() {
    this.alimentationService.getAllFeedings().subscribe(
      (feedings: Feeding[]) => {
        // Séparer les programmes entre nourriture et eau
        this.nourritures = feedings.filter(feeding => feeding.feedType !== 'eau');
        this.eau = feedings.filter(feeding => feeding.feedType === 'eau');
      },
      error => {
        console.error('Erreur lors du chargement des programmes:', error);
      }
    );
  }

  loadStocks() {
    this.stockService.getAllStocks().subscribe(
      (stocks: Stock[]) => {
        this.stocks = stocks;
      },
      error => {
        console.error('Erreur lors du chargement des stocks:', error);
      }
    );
  }

  openAddModal(section: string, content: TemplateRef<any>, index: number | null = null) {
    this.currentSection = section;
    this.editIndex = index;

    if (index !== null) {
      const programs = section === 'nourritures' ? this.nourritures : this.eau;
      const program = programs[index];
      this.newProgramStartTime = program.programStartTime || '';
      this.newProgramEndTime = program.programEndTime || '';
      this.newQuantity = program.quantity;
      this.newFeedType = program.feedType;
      this.newStockQuantity = program.stockQuantity || 0;
      this.newStockId = program.stockId || '';
      this.newNotes = program.notes || '';
      this.newAutomaticFeeding = program.automaticFeeding || true;
    } else {
      this.resetForm();
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      () => {
        this.resetForm();
      },
      () => {
        this.resetForm();
      }
    );
  }

  saveProgram() {
    if (this.newProgramStartTime && this.newProgramEndTime && this.newQuantity && this.newFeedType && this.newStockId) {
      const newProgram = {
        quantity: this.newQuantity,
        feedType: this.currentSection === 'eau' ? 'eau' : this.newFeedType,
        stockQuantity: this.newStockQuantity,
        stockId: this.newStockId,
        notes: this.newNotes,
        automaticFeeding: this.newAutomaticFeeding,
        programStartTime: this.newProgramStartTime,
        programEndTime: this.newProgramEndTime
      };

      if (this.editIndex !== null) {
        const programs = this.currentSection === 'nourritures' ? this.nourritures : this.eau;
        this.alimentationService.updateFeeding(programs[this.editIndex]._id!, newProgram).subscribe(
          () => {
            this.loadFeedings(); // Recharger les données après la mise à jour
            this.modalService.dismissAll();
          },
          error => {
            console.error('Erreur lors de la mise à jour:', error);
          }
        );
      } else {
        this.alimentationService.addFeeding(newProgram).subscribe(
          () => {
            this.loadFeedings(); // Recharger les données après l'ajout
            this.modalService.dismissAll();
          },
          error => {
            console.error('Erreur lors de l\'ajout:', error);
          }
        );
      }

      this.resetForm();
    }
  }

  editProgram(section: string, index: number) {
    this.openAddModal(section, this.addModal, index);
  }

  deleteProgram(section: string, index: number) {
    const programs = section === 'nourritures' ? this.nourritures : this.eau;
    this.alimentationService.deleteFeeding(programs[index]._id!).subscribe(
      () => {
        this.loadFeedings(); // Recharger les données après la suppression
      },
      error => {
        console.error('Erreur lors de la suppression:', error);
      }
    );
  }

  navigateToAlimentation() {
    this.router.navigate(['/stocks']);
  }

  private resetForm() {
    this.newProgramStartTime = '';
    this.newProgramEndTime = '';
    this.newQuantity = 0;
    this.newFeedType = '';
    this.newStockQuantity = 0;
    this.newStockId = '';
    this.newNotes = '';
    this.newAutomaticFeeding = true;
    this.editIndex = null;
  }
}
