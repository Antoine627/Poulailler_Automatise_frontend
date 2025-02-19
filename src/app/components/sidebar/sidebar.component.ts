import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTachometerAlt, faUsers, faSyringe, faKiwiBird, faHistory, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html', // Lien vers le template HTML
  styleUrls: ['./sidebar.component.css'] // Lien vers le fichier CSS
})
export class SidebarComponent {

  constructor(private router: Router) { }

  faTachometerAlt = faTachometerAlt;
  faUsers = faUsers;
  faSyringe = faSyringe;
  faKiwiBird = faKiwiBird;
  faHistory = faHistory;
  faSignOutAlt = faSignOutAlt;

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToUserManagement() {
    this.router.navigate(['/user-management']);
  }

  navigateToVaccinationManagement() {
    this.router.navigate(['/vaccination-management']);
  }

  navigateToPoultryManagement() {
    this.router.navigate(['/poultry-management']);
  }

  navigateToAlimentation() {
    this.router.navigate(['/alimentation']);
  }

  navigateToHistoriques() {
    this.router.navigate(['/historiques']);
  }

  logout() {
    // Implémentez votre logique de déconnexion ici
    console.log('Déconnexion');
  }

}
