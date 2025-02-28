import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

interface LightSchedule {
  startTime: string;
  endTime: string;
  enabled: boolean;
}

@Component({
  selector: 'app-light-schedule-modal',
  templateUrl: './light-schedule-modal.component.html',
  styleUrls: ['./light-schedule-modal.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LightScheduleModalComponent implements OnInit {
  @Input() title: string = 'Programmer l\'éclairage';
  @Input() lightSchedule: LightSchedule | null = null;

  scheduleForm: FormGroup;

  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.scheduleForm = this.fb.group({
      startTime: ['08:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      endTime: ['20:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]],
      enabled: [true]
    }, { validators: this.timeValidator }); // Ajoutez la validation personnalisée ici
  }

  ngOnInit() {
    if (this.lightSchedule) {
      this.scheduleForm.patchValue(this.lightSchedule);
    }
  }

  save() {
    if (this.scheduleForm.valid) {
      this.activeModal.close(this.scheduleForm.value);
    } else {
      console.error('Formulaire invalide');
    }
  }

  // Validation personnalisée pour vérifier que l'heure de fin >= heure de début
  timeValidator(control: AbstractControl): ValidationErrors | null {
    const startTime = control.get('startTime')?.value;
    const endTime = control.get('endTime')?.value;

    if (startTime && endTime && startTime >= endTime) {
      return { timeError: true }; // Retourne une erreur si l'heure de fin est <= heure de début
    }
    return null; // Pas d'erreur
  }

  get startTime() { return this.scheduleForm.get('startTime'); }
  get endTime() { return this.scheduleForm.get('endTime'); }
}