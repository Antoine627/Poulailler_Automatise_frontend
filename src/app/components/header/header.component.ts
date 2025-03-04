import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // Importez le service AuthService
import { HttpClient } from '@angular/common/http'; // Importez HttpClient
import { FormsModule } from '@angular/forms';

interface UserInfo {
  username?: string;
  email?: string;
  role?: string;
  profilePicture?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentDate = new Date();
  pageTitle = 'Tableau de bord';
  userName = '';
  userRole = '';
  userProfilePicture = '';


    // ... autres propriétés
    isFormVisible: boolean = false; // Contrôle la visibilité du formulaire

    // ... constructeur et autres méthodes
  
    toggleForm() {
      this.isFormVisible = !this.isFormVisible; // Inverse la visibilité
    }
    
  
  // Propriétés pour le formulaire
  userEmail: string = '';
  durationHours: number = 1;
  message: string = '';

  private routeTitles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/user-management': 'Gestion utilisateurs',
    '/vaccination-management': 'Gestion vaccination',
    '/poultry-management': 'Gestion de volailles',
    '/alimentation': 'Alimentations',
    '/historiques': 'Historiques'
  };

  constructor(private router: Router, private authService: AuthService, private http: HttpClient) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.pageTitle = this.routeTitles[event.url] || 'Tableau de bord';
    });
  }

  ngOnInit() {
    this.pageTitle = this.routeTitles[this.router.url] || 'Tableau de bord';
    this.loadUserInfoFromLocalStorage();
    this.loadUserInfo();
  }

  loadUserInfoFromLocalStorage() {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const userInfo: UserInfo = JSON.parse(storedUserInfo);
      this.userName = userInfo.username || '';
      this.userRole = userInfo.role || '';
      this.userProfilePicture = userInfo.profilePicture
        ? `http://localhost:3000/uploads/profiles/${userInfo.profilePicture}`
        : 'assets/images/default-profile.png';
    }
  }

  loadUserInfo() {
    this.authService.getCurrentUser().subscribe((userInfo: UserInfo) => {
      if (userInfo) {
        this.userName = userInfo.username || '';
        this.userRole = userInfo.role || '';
        this.userProfilePicture = userInfo.profilePicture
          ? `http://localhost:3000/uploads/profiles/${userInfo.profilePicture}`
          : 'assets/images/default-profile.png';
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
    });
  }

  /* onSubmit() {
    const requestBody = {
      userEmail: this.userEmail,
      durationHours: this.durationHours,
    };

    this.http.post('http://localhost:3000/api/generate-temporary-access-code', requestBody)
      .subscribe({
        next: (response: any) => {
          this.message = 'Code d\'accès temporaire envoyé avec succès!';
        },
        error: (error) => {
          this.message = 'Erreur lors de l\'envoi du code : ' + error.message;
        }
      });
  } */

      onSubmit() {
        const requestBody = {
          userEmail: this.userEmail,  // Ajout de l'email
          durationHours: this.durationHours,
        };
      
        this.http.post('http://localhost:3000/api/auth/generate-temporary-access-code', requestBody)
          .subscribe({
            next: (response: any) => {
              this.message = 'Code d\'accès temporaire envoyé avec succès!';
            },
            error: (error) => {
              this.message = 'Erreur lors de l\'envoi du code : ' + error.message;
            }
          });
      }
}