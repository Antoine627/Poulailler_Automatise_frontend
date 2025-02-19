// login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface CodeFormControls {
  [key: string]: any;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="login-container">
        <div class="login-form">
          <div class="logo">
            <img src="assets/images/logo.png" alt="Logo Cocorico" />
          </div>
          
          <div class="login-tabs">
            <div 
              class="tab" 
              [class.active]="!isCodeMode" 
              (click)="toggleMode(false)"
            >
              Email et mot de passe
            </div>
            <div 
              class="tab" 
              [class.active]="isCodeMode" 
              (click)="toggleMode(true)"
            >
              code
            </div>
          </div>

          <h1>BIENVENUE</h1>
          
          <p class="subtitle">
            {{ isCodeMode ? 'Veuillez saisir votre code de connexion' : 'Veuillez saisir vos informations de connexion, email et mot de passe ou avec code' }}
          </p>

          <!-- Form pour Email/Mot de passe -->
          <form *ngIf="!isCodeMode" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                placeholder="Entrez votre email"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="password-input">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  id="password"
                  formControlName="password"
                  class="form-control"
                />
                <button type="button" class="toggle-password" (click)="togglePasswordVisibility()">
                  <i class="eye-icon"></i>
                </button>
              </div>
            </div>

            <a href="#" class="forgot-password">mot de passe oublié ?</a>

            <button type="submit" class="submit-btn">Se connecter</button>
          </form>

          <!-- Form pour Code -->
          <form *ngIf="isCodeMode" [formGroup]="codeForm" (ngSubmit)="onSubmitCode()">
            <div class="code-inputs">
              <input
                *ngFor="let control of codeControls; let i = index"
                type="text"
                [formControlName]="'digit' + i"
                maxlength="1"
                class="code-input"
                (input)="onCodeInput($event, i)"
                (keydown)="onKeyDown($event, i)"
              />
            </div>
          </form>
        </div>
        <div class="illustration">
          <!-- L'image du coq sera ajoutée en CSS comme background-image -->
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      padding: 2rem;
      overflow: hidden;
    }

    .login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 90%;
      max-width: 1200px;
      height: 600px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .login-form {
      padding: 2rem 4rem;
      max-width: 480px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    .logo img {
      width: 80px;
      height: 80px;
    }

    .login-tabs {
      display: flex;
      gap: 1rem;
      margin: 2rem 0;
    }

    .tab {
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .tab.active {
      background: #FFF59D;
      border-radius: 4px;
    }

    h1 {
      font-size: 2rem;
      margin: 2rem 0;
      text-align: center;
    }

    .subtitle {
      color: #666;
      margin-bottom: 2rem;
      text-align: center;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .password-input {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
    }

    .forgot-password {
      display: block;
      text-align: right;
      color: #2196F3;
      text-decoration: none;
      margin: 1rem 0;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: #FFF59D;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s ease;
    }

    .submit-btn:hover {
      background: #FFF176;
    }

    .code-inputs {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .code-input {
      width: 60px;
      height: 60px;
      text-align: center;
      font-size: 1.5rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 0.5rem;
    }

    .code-input:focus {
      border-color: #FFF59D;
      outline: none;
    }

    .illustration {
      background-image: url('/assets/images/chick.png');
      background-size: cover;
      background-position: center;
    }

    @media (max-width: 768px) {
      .page-wrapper {
        padding: 1rem;
      }

      .login-container {
        grid-template-columns: 1fr;
        width: 100%;
        height: auto;
      }

      .login-form {
        padding: 2rem;
      }

      .illustration {
        display: none;
      }

      .code-inputs {
        gap: 0.5rem;
      }

      .code-input {
        width: 50px;
        height: 50px;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  codeForm: FormGroup;
  showPassword = false;
  isCodeMode = false;
  codeControls = Array(4).fill(null);

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Création du formulaire de code avec typage correct
    const codeControls: CodeFormControls = {};
    for (let i = 0; i < 4; i++) {
      codeControls[`digit${i}`] = ['', [Validators.required, Validators.maxLength(1)]];
    }
    this.codeForm = this.fb.group(codeControls);
  }

  toggleMode(isCode: boolean) {
    this.isCodeMode = isCode;
    if (isCode) {
      this.codeForm.reset();
    } else {
      this.loginForm.reset();
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onCodeInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Ensure only numbers
    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    // Move to next input
    if (value && index < 3) {
      const nextInput = document.querySelector(`input[formcontrolname="digit${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const control = this.codeForm.get(`digit${index}`);
    if (event.key === 'Backspace' && index > 0 && control) {
      const controlValue = control.value;
      if (!controlValue) {
        const prevInput = document.querySelector(`input[formcontrolname="digit${index - 1}"]`) as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      console.log('Form submitted', this.loginForm.value);
    }
  }

  onSubmitCode() {
    if (this.codeForm.valid) {
      const code = Object.values(this.codeForm.value).join('');
      console.log('Code submitted:', code);
    }
  }
}