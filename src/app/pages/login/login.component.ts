import { Component, ElementRef, QueryList, ViewChildren, ViewChild, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../../components/sidebar/sidebar.component'; // Assurez-vous que le chemin est correct
import { HeaderComponent } from '../../components/header/header.component'; // Assurez-vous que le chemin est correct

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, SidebarComponent, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements AfterViewInit {
  loginForm: FormGroup;
  codeForm: FormGroup;
  showPassword = false;
  isCodeMode = false;
  codeControls = Array(4).fill(null);
  errorMessage: string = '';
  attempts: number = 0;
  isBlocked: boolean = false;
  countdown: number = 30;
  countdownDuration: number = 30;
  interval: any;
  showCodeInputs: boolean = true;
  remainingAttempts: number = 3;

  // Ajoutez ces propriétés
  stockAlerts: any[] = [];

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;
  @ViewChild('firstInput') firstInput!: ElementRef;

  isAuthPage: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAuthPage = event.url === '/login'; // Adaptez le chemin selon votre configuration
      });

    if (isPlatformBrowser(this.platformId)) {
      const savedMode = localStorage.getItem('loginMode');
      this.isCodeMode = savedMode === 'code';
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    const codeControls: any = {};
    for (let i = 0; i < 4; i++) {
      codeControls[`digit${i}`] = ['', [Validators.required, Validators.pattern('^[0-9]$')]];
    }
    this.codeForm = this.fb.group(codeControls);
  }

  ngAfterViewInit() {
    this.focusOnFirstInput();
  }

  toggleMode(isCode: boolean) {
    this.isCodeMode = isCode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('loginMode', isCode ? 'code' : 'email');
    }
    if (isCode) {
      this.codeForm.reset();
      this.focusOnFirstInput();
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

    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    if (value && index < 3) {
      const nextInput = this.codeInputs.toArray()[index + 1].nativeElement;
      nextInput.focus();
    }

    if (value && index === 3) {
      this.onSubmitCode();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const control = this.codeForm.get(`digit${index}`);
    if (event.key === 'Backspace' && index > 0 && control) {
      const controlValue = control.value;
      if (!controlValue) {
        const prevInput = this.codeInputs.toArray()[index - 1].nativeElement;
        prevInput.focus();
      }
    }
  }

  onSubmit() {
    if (this.isCodeMode) {
      this.onSubmitCode();
    } else {
      this.onSubmitEmail();
    }
  }

  onSubmitEmail() {
    if (this.loginForm.invalid) return;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        this.router.navigate(['/../components/dashboard']);
        this.loginForm.reset();
      },
      error: (err) => this.handleError(err)
    });
  }

  onSubmitCode() {
    if (this.isBlocked || this.codeForm.invalid) return;
    this.errorMessage = '';

    const { digit0, digit1, digit2, digit3 } = this.codeForm.value;
    const code = `${digit0}${digit1}${digit2}${digit3}`;

    this.authService.loginWithCode(code).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        this.router.navigate(['/dashboard']);
        this.codeForm.reset();
        this.resetAttempts();
      },
      error: (err) => this.handleError(err)
    });
  }

  onForgotPassword() {
    this.router.navigate(['/forget-password']);
  }

  handleError(error: any) {
    if (error.status === 400) {
      this.errorMessage = 'Veuillez remplir correctement les champs requis.';
    } else if (error.status === 401) {
      this.attempts++;
      this.remainingAttempts = 3 - this.attempts;
      this.errorMessage = `Identifiants incorrects. Tentatives restantes : ${this.remainingAttempts}`;
      if (this.attempts >= 3) {
        this.blockUser();
      } else if (this.isCodeMode) {
        this.codeForm.reset();
        this.focusOnFirstInput();
      }
    } else if (error.status === 404) {
      this.errorMessage = 'Utilisateur non trouvé. Vérifiez votre email.';
    } else {
      this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
    }
  }

  blockUser() {
    this.isBlocked = true;
    this.showCodeInputs = false;
    this.countdownDuration = this.countdown;
    this.errorMessage = `Trop de tentatives ! Réessayez dans ${this.countdown} secondes.`;

    this.interval = setInterval(() => {
      this.countdown--;
      this.errorMessage = `Trop de tentatives ! Réessayez dans ${this.countdown} secondes.`;
      if (this.countdown <= 0) {
        clearInterval(this.interval);
        this.resetAttempts();
      }
    }, 1000);
  }

  resetAttempts() {
    this.attempts = 0;
    this.remainingAttempts = 3;
    this.isBlocked = false;
    this.showCodeInputs = true;
    this.countdown = 30;
    this.errorMessage = '';
  }

  focusOnFirstInput() {
    setTimeout(() => {
      if (this.firstInput) {
        this.firstInput.nativeElement.focus();
      }
    }, 100);
  }

  isInvalid(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    return control?.invalid && (control.dirty || control.touched);
  }

  // Ajoutez cette méthode si nécessaire
  calculateAutonomy(stock: number): number {
    // Implémentez la logique pour calculer l'autonomie
    return stock / 10; // Exemple simplifié
  }
}
