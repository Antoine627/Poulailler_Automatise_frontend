/* 
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;       // Formulaire pour email/mot de passe
  codeLoginForm: FormGroup;   // Formulaire pour code secret
  errorMessage: string = '';
  showCodeLogin: boolean = false; // Toggle entre les deux modes

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Formulaire pour email/mot de passe
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Formulaire pour code secret (4 chiffres)
    this.codeLoginForm = this.fb.group({
      code1: ['', [Validators.required, Validators.pattern('[0-9]')]], 
      code2: ['', [Validators.required, Validators.pattern('[0-9]')]], 
      code3: ['', [Validators.required, Validators.pattern('[0-9]')]], 
      code4: ['', [Validators.required, Validators.pattern('[0-9]')]]
    });
  }

  // Basculer entre les deux modes
  toggleCodeLogin() {
    this.showCodeLogin = !this.showCodeLogin;
  }

  // Gère la soumission des deux formulaires
  onSubmit() {
    if (this.showCodeLogin) {
      this.loginWithCode();
    } else {
      this.loginWithEmail();
    }
  }

  // Connexion avec email/mot de passe
  loginWithEmail() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        console.log('Connexion réussie avec email/password');
        this.router.navigate(['/dashboard']);
        this.loginForm.reset();
      },
      error: (err) => {
        console.error('Erreur de connexion:', err);
        this.errorMessage = err.error.message || 'Connexion échouée';
      }
    });
  }

  // Connexion avec code secret
  loginWithCode() {
    if (this.codeLoginForm.invalid) return;

    const { code1, code2, code3, code4 } = this.codeLoginForm.value;
    const code = `${code1}${code2}${code3}${code4}`;

    this.authService.loginWithCode(code).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        console.log('Connexion réussie avec code secret');
        this.router.navigate(['/dashboard']);
        this.codeLoginForm.reset();
      },
      error: (err) => {
        console.error('Erreur de connexion:', err);
        this.errorMessage = err.error.message || 'Connexion échouée';
      }
    });
  }
}
 */

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  codeLoginForm: FormGroup;
  errorMessage: string = '';
  showCodeLogin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Formulaire email/mot de passe avec validation en temps réel
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Formulaire pour code secret (4 chiffres)
    this.codeLoginForm = this.fb.group({
      code1: ['', [Validators.required, Validators.pattern('^[0-9]$')]], 
      code2: ['', [Validators.required, Validators.pattern('^[0-9]$')]], 
      code3: ['', [Validators.required, Validators.pattern('^[0-9]$')]], 
      code4: ['', [Validators.required, Validators.pattern('^[0-9]$')]]
    });
  }

  // Basculer entre les deux modes
  toggleCodeLogin() {
    this.showCodeLogin = !this.showCodeLogin;
  }

  // Vérifie si un champ est valide
  isInvalid(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    return control?.invalid && (control.dirty || control.touched);
  }

  // Connexion avec email/mot de passe
  loginWithEmail() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        this.router.navigate(['/dashboard']);
        this.loginForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Connexion échouée';
      }
    });
  }

  // Connexion avec code secret
  loginWithCode() {
    if (this.codeLoginForm.invalid) return;

    const { code1, code2, code3, code4 } = this.codeLoginForm.value;
    const code = `${code1}${code2}${code3}${code4}`;

    this.authService.loginWithCode(code).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        this.router.navigate(['/dashboard']);
        this.codeLoginForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Connexion échouée';
      }
    });
  }

  // Gère la soumission en fonction du mode sélectionné
  onSubmit() {
    if (this.showCodeLogin) {
      this.loginWithCode();
    } else {
      this.loginWithEmail();
    }
  }
}
