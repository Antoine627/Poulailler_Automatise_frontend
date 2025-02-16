import { Component, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-feeding-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="schedule-panel">
      <h2>Tableau des programmations d'alimentation</h2>
      
      <div class="schedule-content">
        <div class="schedule-section">
          <h3>Nourritures</h3>
          <button class="btn-add" (click)="openAddModal('nourritures', addModal)" [disabled]="nourritures.length >= 3">Ajouter</button>
          <div class="time-slots" *ngIf="nourritures.length > 0; else noProgramsNourritures">
            <div class="time-slot" *ngFor="let program of nourritures; let i = index">
              <div class="time-input">
                <label>Heure Début</label>
                <div class="time-control">
                  <input type="time" [(ngModel)]="program.startTime" disabled>
                  <i class="icon-clock"></i>
                </div>
              </div>
              <div class="time-input">
                <label>Heure Fin</label>
                <div class="time-control">
                  <input type="time" [(ngModel)]="program.endTime" disabled>
                  <i class="icon-clock"></i>
                </div>
              </div>
              <!-- Actions Modifier et Supprimer -->
              <div class="action-buttons">
                <i class="icon-edit" (click)="editProgram('nourritures', i)">✏️</i>
                <i class="icon-delete" (click)="deleteProgram('nourritures', i)">🗑️</i>
              </div>
            </div>
          </div>
          <ng-template #noProgramsNourritures>
            <p>Pas de programmes disponibles pour l'instant.</p>
          </ng-template>
        </div>
        
        <div class="schedule-section">
          <h3>Eau</h3>
          <button class="btn-add" (click)="openAddModal('eau', addModal)" [disabled]="eau.length >= 3">Ajouter</button>
          <div class="time-slots" *ngIf="eau.length > 0; else noProgramsEau">
            <div class="time-slot" *ngFor="let program of eau; let i = index">
              <div class="time-input">
                <label>Heure Début</label>
                <div class="time-control">
                  <input type="time" [(ngModel)]="program.startTime" disabled>
                  <i class="icon-clock"></i>
                </div>
              </div>
              <div class="time-input">
                <label>Heure Fin</label>
                <div class="time-control">
                  <input type="time" [(ngModel)]="program.endTime" disabled>
                  <i class="icon-clock"></i>
                </div>
              </div>
              <!-- Actions Modifier et Supprimer -->
              <div class="action-buttons">
                <i class="icon-edit" (click)="editProgram('eau', i)">✏️</i>
                <i class="icon-delete" (click)="deleteProgram('eau', i)">🗑️</i>
              </div>
            </div>
          </div>
          <ng-template #noProgramsEau>
            <p>Pas de programmes disponibles pour l'instant.</p>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Modal pour ajouter ou modifier un programme -->
    <ng-template #addModal let-modal>
  <div class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">{{ editIndex !== null ? 'Modifier un programme' : 'Ajouter un programme' }}</h4>
        <button type="button" class="close" aria-label="Close" (click)="modal.dismiss()">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Heure Début</label>
          <input type="time" class="form-control" [(ngModel)]="newStartTime">
        </div>
        <div class="form-group">
          <label>Heure Fin</label>
          <input type="time" class="form-control" [(ngModel)]="newEndTime">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="modal.dismiss()">Annuler</button>
        <button type="button" class="btn btn-primary" (click)="saveProgram()">
          {{ editIndex !== null ? 'Modifier' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
</ng-template>
  `,
  styles: [`
    .schedule-panel {
      background-color: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h2 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      color: #333;
      text-align: center;
    }
    .schedule-content {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
    }
    .schedule-section {
      flex: 1;
      position: relative;
      padding: 1rem;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      background-color: #fafafa;
    }
    h3 {
      font-size: 1.2rem;
      color: #333;
      margin-bottom: 1rem;
      text-align: center;
    }
    .btn-add {
      display: block;
      margin: 0 auto 1rem auto;
      padding: 0.5rem 1rem;
      background-color: #FFD600;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-add:disabled {
      background-color: #ccc; /* Couleur grise */
      cursor: not-allowed; /* Curseur "non autorisé" */
    }
    .time-slots {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .time-slot {
      display: flex;
      gap: 1rem;
      justify-content: center;
      align-items: center;
    }
    .time-input {
      flex: 1;
      max-width: 200px;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      color: #666;
      text-align: center;
    }
    .time-control {
      position: relative;
      display: flex;
      justify-content: center;
    }
    input[type="time"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      text-align: center;
    }
    .icon-clock {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #FFD600;
    }
    p {
      text-align: center;
      color: #666;
    }
    /* Styles pour la modale */
/* Styles pour la modale */
.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Fond semi-transparent */
  z-index: 1000;
}

/* Contenu de la modale */
.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  animation: modalFadeIn 0.3s; /* Animation d'apparition */
}

/* En-tête de la modale */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
}

/* Bouton de fermeture */
.close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Styles pour les entrées de temps */
.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="time"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Styles pour le pied de la modale */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn {
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background-color: #f44336; /* Rouge pour Annuler */
  color: white;
}

.btn-primary {
  background-color: #4CAF50; /* Vert pour Enregistrer */
  color: white;
}

.btn-secondary:hover {
  background-color: #e53935; /* Couleur légèrement plus foncée au survol */
}

.btn-primary:hover {
  background-color: #45a049; /* Couleur légèrement plus foncée au survol */
}

/* Animation de la modale */
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between; /* Espace entre les boutons */
  width: 100%; /* S'assurer que la largeur est maximale */
  margin-top: 20px; /* Ajout d'une marge supérieure si nécessaire */
}
  `]
})
export class FeedingScheduleComponent {
  @ViewChild('addModal') addModal!: TemplateRef<any>; // Référence au template de la modale

  nourritures: { startTime: string, endTime: string }[] = [];
  eau: { startTime: string, endTime: string }[] = [];
  newStartTime: string = '';
  newEndTime: string = '';
  currentSection: string = '';
  editIndex: number | null = null;

  constructor(private modalService: NgbModal) {}

  // Ouvrir la modale pour ajouter ou modifier un programme
  openAddModal(section: string, content: TemplateRef<any>, index: number | null = null) {
    this.currentSection = section;
    this.editIndex = index;

    // Si on est en mode modification, pré-remplir les champs avec les valeurs existantes
    if (index !== null) {
      const programs = section === 'nourritures' ? this.nourritures : this.eau;
      this.newStartTime = programs[index].startTime;
      this.newEndTime = programs[index].endTime;
    } else {
      this.newStartTime = '';
      this.newEndTime = '';
    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        // Réinitialiser après la fermeture de la modale
        this.newStartTime = '';
        this.newEndTime = '';
        this.editIndex = null;
      },
      (reason) => {
        // Réinitialiser après la fermeture de la modale
        this.newStartTime = '';
        this.newEndTime = '';
        this.editIndex = null;
      }
    );
  }

  // Enregistrer un programme (ajout ou modification)
  saveProgram() {
    if (this.newStartTime && this.newEndTime) {
      const newProgram = { startTime: this.newStartTime, endTime: this.newEndTime };

      if (this.currentSection === 'nourritures') {
        if (this.nourritures.length >= 3 && this.editIndex === null) {
          alert('Vous ne pouvez pas ajouter plus de 3 programmes pour les nourritures.');
          return;
        }
        if (this.editIndex !== null) {
          // Mode modification
          this.nourritures[this.editIndex] = newProgram;
        } else {
          // Mode ajout
          this.nourritures.push(newProgram);
        }
      } else if (this.currentSection === 'eau') {
        if (this.eau.length >= 3 && this.editIndex === null) {
          alert('Vous ne pouvez pas ajouter plus de 3 programmes pour l\'eau.');
          return;
        }
        if (this.editIndex !== null) {
          // Mode modification
          this.eau[this.editIndex] = newProgram;
        } else {
          // Mode ajout
          this.eau.push(newProgram);
        }
      }

      // Réinitialiser après enregistrement
      this.newStartTime = '';
      this.newEndTime = '';
      this.editIndex = null;
      this.modalService.dismissAll();
    }
  }

  // Modifier un programme
  editProgram(section: string, index: number) {
    this.openAddModal(section, this.addModal, index);
  }

  // Supprimer un programme
  deleteProgram(section: string, index: number) {
    if (section === 'nourritures') {
      this.nourritures.splice(index, 1);
    } else if (section === 'eau') {
      this.eau.splice(index, 1);
    }
  }
}