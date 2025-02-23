import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    const formData = new FormData();
    formData.append('username', this.registerForm.get('username')?.value || '');
    formData.append('email', this.registerForm.get('email')?.value || '');
    formData.append('password', this.registerForm.get('password')?.value || '');
    
    // Ajout du fichier au FormData s'il existe
    if (this.selectedFile) {
      formData.append('profilePicture', this.selectedFile, this.selectedFile.name);
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        this.errorMessage = '';
        console.log('Inscription réussie:', response);
        // Rediriger vers la page de connexion ou le tableau de bord après l'inscription réussie
        // this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Erreur d\'inscription:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
      }
    });
  }

  onFileChange(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
      console.log('Fichier sélectionné:', this.selectedFile.name);
    }
  }
}