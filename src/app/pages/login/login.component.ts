
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
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


  // LIMITER LE NOMBRE DE TENTATIVE DE CONNEXION A 3
  attempts: number = 0;
isBlocked: boolean = false;
countdown: number = 30;
interval: any;
 // Autres propriétés existantes...
 countdownDuration: number = 30;  // Durée du compte à rebours en secondes
  


  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.codeLoginForm = this.fb.group({
      code1: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      code2: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      code3: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      code4: ['', [Validators.required, Validators.pattern('^[0-9]$')]]
    });
  }

  
    toggleCodeLogin() {
      this.errorMessage = '';
      this.showCodeLogin = !this.showCodeLogin;
      
      if (this.showCodeLogin) {
        this.focusOnFirstInput();
      }
    }
    

  isInvalid(form: FormGroup, controlName: string) {
    const control = form.get(controlName);
    return control?.invalid && (control.dirty || control.touched);
  }


    /* handleError(error: any) {
      if (error.status === 400) {
        this.errorMessage = 'Veuillez remplir correctement les champs requis.';
      } else if (error.status === 401) {
        this.errorMessage = 'Identifiants incorrects. Veuillez réessayer.';
        if (this.showCodeLogin) {
          this.codeLoginForm.reset();
          this.focusOnFirstInput(); // Remet le focus sur le premier champ
        }
      } else if (error.status === 404) {
        this.errorMessage = 'Utilisateur non trouvé. Vérifiez votre email.';
      } else {
        this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
      }
    } */
    
      handleError(error: any) {
        if (error.status === 400) {
          this.errorMessage = 'Veuillez remplir correctement les champs requis.';
        } else if (error.status === 401) {
          this.attempts++;
          this.errorMessage = 'Identifiants incorrects. Veuillez réessayer.';
      
          if (this.attempts >= 3) {
            this.blockUser();
          } else if (this.showCodeLogin) {
            this.codeLoginForm.reset();
            this.focusOnFirstInput();
          }
        } else if (error.status === 404) {
          this.errorMessage = 'Utilisateur non trouvé. Vérifiez votre email.';
        } else {
          this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer plus tard.';
        }
      }
      

  loginWithEmail() {
    if (this.loginForm.invalid) return;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        this.router.navigate(['/dashboard']);
        this.loginForm.reset();
      },
      error: (err) => this.handleError(err)
    });
  }

  /* loginWithCode() {
    if (this.codeLoginForm.invalid) return;
    this.errorMessage = '';

    const { code1, code2, code3, code4 } = this.codeLoginForm.value;
    const code = `${code1}${code2}${code3}${code4}`;

    this.authService.loginWithCode(code).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.data.token);
        this.router.navigate(['/dashboard']);
        this.codeLoginForm.reset();
      },
      error: (err) => this.handleError(err)
    });
  } */

    loginWithCode() {
      if (this.isBlocked || this.codeLoginForm.invalid) return;
      this.errorMessage = '';
    
      const { code1, code2, code3, code4 } = this.codeLoginForm.value;
      const code = `${code1}${code2}${code3}${code4}`;
    
      this.authService.loginWithCode(code).subscribe({
        next: (res) => {
          localStorage.setItem('token', res.data.token);
          this.router.navigate(['/dashboard']);
          this.codeLoginForm.reset();
          this.resetAttempts(); // Réinitialiser les tentatives après une connexion réussie
        },
        error: (err) => this.handleError(err)
      });
    }
    

  onSubmit() {
    this.showCodeLogin ? this.loginWithCode() : this.loginWithEmail();
  }

  // Déplacement automatique vers le champ suivant
  /* moveToNext(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    if (input.value.match(/^[0-9]$/)) {
      setTimeout(() => {
        const inputs = this.codeInputs.toArray();
        if (index < inputs.length - 1) {
          inputs[index + 1].nativeElement.focus();
        } else {
          this.onSubmit(); // Soumission automatique du formulaire si dernier champ rempli
        }
      }, 100);
    } else {
      input.value = '';
    }
  } */
  
    moveToNext(event: KeyboardEvent, index: number) {
      const input = event.target as HTMLInputElement;
      const inputs = this.codeInputs.toArray();
      const key = event.key;
    
      if (key.match(/^[0-9]$/)) {
        event.preventDefault(); // Empêche le comportement par défaut
        this.codeLoginForm.patchValue({ [`code${index + 1}`]: key }); // Mise à jour du FormControl
    
        if (index < inputs.length - 1) {
          setTimeout(() => inputs[index + 1].nativeElement.focus(), 100);
        } else {
          this.onSubmit(); // Envoi automatique si dernier champ rempli
        }
      } else if (key === 'Backspace') {
        event.preventDefault();
        this.codeLoginForm.patchValue({ [`code${index + 1}`]: '' }); // Efface le champ dans le FormControl
    
        if (index > 0) {
          setTimeout(() => inputs[index - 1].nativeElement.focus(), 100);
        }
      } else {
        event.preventDefault(); // Bloque toute autre touche
      }
    }
    

  // Empêcher la saisie de caractères non numériques
  allowOnlyNumbers(event: KeyboardEvent) {
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }



  // POINTER LE CURSEUR SUR LE PREMIER CHAMPS
 /*  focusOnFirstInput() {
    setTimeout(() => {
      const inputs = this.codeInputs.toArray();
      if (inputs.length > 0) {
        inputs[0].nativeElement.focus();
      }
    }, 100);
  } */
    focusOnFirstInput() {
      setTimeout(() => {
        const inputs = this.codeInputs.toArray();
        if (inputs.length > 0) {
          // Réinitialiser le formulaire
          this.codeLoginForm.reset();
          
          // Remettre le focus sur le premier champ
          inputs[0].nativeElement.focus();
        }
      }, 100);
    }
    

    //FONCTION POUR BLOQUER L UTILISATEUR 
    blockUser() {
      this.isBlocked = true;
      this.countdownDuration = this.countdown; // Temps en secondes
      this.errorMessage = `Trop de tentatives ! Réessayez dans ${this.countdown} secondes.`;
    
      this.interval = setInterval(() => {
        this.countdown--;
        this.errorMessage = `Trop de tentatives ! Réessayez dans ${this.countdown} secondes.`;
    
        // Si le compte à rebours atteint zéro, réinitialisation
        if (this.countdown <= 0) {
          clearInterval(this.interval);
          this.resetAttempts();
        }
      }, 1000);
    }
    
    //FONCTION POUR DEBLOQUER L UTILISATEUR 
    resetAttempts() {
      this.attempts = 0;
      this.isBlocked = false;
      this.countdown = 30;
      this.errorMessage = '';
    }
    
  
}
