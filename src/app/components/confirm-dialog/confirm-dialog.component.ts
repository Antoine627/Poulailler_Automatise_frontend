import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelButtonText }}</button>
      <button mat-button [mat-dialog-close]="true" color="warn">
        {{ data.confirmButtonText }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  styles: [
    `
      h2.mat-dialog-title {
        color: #333;
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }

      .mat-dialog-content {
        color: #666;
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }

      .mat-dialog-actions {
        justify-content: flex-end;
        padding: 1rem 0;

        button {
          margin-left: 0.5rem;
        }

        button[color='warn'] {
          background-color: #dc3545;
          color: white;
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      title: string;
      message: string;
      confirmButtonText?: string; // Optionnel
      cancelButtonText?: string; // Optionnel
    }
  ) {
    // Définir des valeurs par défaut si elles ne sont pas fournies
    this.data.confirmButtonText = this.data.confirmButtonText || 'Confirmer';
    this.data.cancelButtonText = this.data.cancelButtonText || 'Annuler';
  }
}