import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTachometerAlt, faUsers, faSyringe, faKiwiBird, faHistory, faSignOutAlt, faBars, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Importez le service AuthService

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  constructor(private router: Router, private authService: AuthService) { }

  faTachometerAlt = faTachometerAlt;
  faUsers = faUsers;
  faSyringe = faSyringe;
  faKiwiBird = faKiwiBird;
  faHistory = faHistory;
  faSignOutAlt = faSignOutAlt;
  faBars = faBars;
  faUtensils = faUtensils;

  // État du sidebar
  isSidebarOpen = false;


  // Basculer l'état du sidebar
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  navigateToUserManagement() {
    this.router.navigate(['/alimentation']);
  }

  navigateToVaccinationManagement() {
    this.router.navigate(['/vaccinations']);
  }

  navigateToPoultryManagement() {
    this.router.navigate(['/productions']);
  }

  navigateToAlimentation() {
    this.router.navigate(['/alimentation']);
  }

  navigateToHistoriques() {
    this.router.navigate(['/historiques']);
  }

  navigateToSettings() {
    this.router.navigate(['/parametres']);
  }

  logout(): void {
    this.authService.logout(); // Déconnecter l'utilisateur
    this.router.navigate(['/']); // Rediriger vers la page de connexion
  }
}
