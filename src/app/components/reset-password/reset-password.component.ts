import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  token: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    
    // Vérifier si le token existe
    if (!this.token) {
      this.errorMessage = "Token de réinitialisation manquant. Veuillez réessayer le processus de réinitialisation.";
      return;
    }
    
    // Vérifier la validité du token avant d'afficher le formulaire
    this.authService.verifyResetToken(this.token).subscribe({
      next: (response) => {
        // Token valide, le formulaire peut être utilisé
        console.log('Token validé avec succès');
      },
      error: (error) => {
        this.errorMessage = "Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.";
        this.resetPasswordForm.disable(); // Désactiver le formulaire
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmPassword')?.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) return;

    const { newPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword(this.token, newPassword).subscribe({
      next: (res) => {
        this.successMessage = 'Votre mot de passe a été réinitialisé avec succès.';
        this.errorMessage = '';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la réinitialisation du mot de passe.';
        this.successMessage = '';
      }
    });
  }

  isInvalid(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    return control?.invalid && (control.dirty || control.touched);
  }
}