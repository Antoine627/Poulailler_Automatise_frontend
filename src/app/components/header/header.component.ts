import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service'; // Importez le service AuthService

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentDate = new Date();
  pageTitle = 'Tableau de bord';
  userName = '';
  userProfilePicture = '';

  // Mapping des routes vers les titres
  private routeTitles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/user-management': 'Gestion utilisateurs',
    '/vaccination-management': 'Gestion vaccination',
    '/poultry-management': 'Gestion de volailles',
    '/alimentation': 'Alimentations',
    '/historiques': 'Historiques'
  };

  constructor(private router: Router, private authService: AuthService) {
    // S'abonner aux événements de navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Mettre à jour le titre en fonction de la route active
      this.pageTitle = this.routeTitles[event.url] || 'Tableau de bord';
    });
  }

  ngOnInit() {
    // Initialiser le titre au chargement du composant
    this.pageTitle = this.routeTitles[this.router.url] || 'Tableau de bord';

    // Récupérer les informations de l'utilisateur
    this.loadUserInfo();
  }

  loadUserInfo() {
    this.authService.getCurrentUser().subscribe(userInfo => {
      if (userInfo) {
        this.userName = userInfo.username;
        
        // Vérifier si profilePicture est défini et n'est pas vide
        if (userInfo.profilePicture) {
          // Construire l'URL complète vers l'image
          this.userProfilePicture = `http://localhost:3000/uploads/profiles/${userInfo.profilePicture}`;
        } else {
          // Image par défaut si aucune photo n'est disponible
          this.userProfilePicture = 'assets/images/default-profile.png';
        }
        
        console.log('User info loaded:', userInfo);
        console.log('Profile picture URL:', this.userProfilePicture);
      }
    });
  }
}
