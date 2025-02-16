import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTachometerAlt, faUsers, faSyringe, faKiwiBird, faHistory, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <aside class="sidebar">
      <div class="logo-container">
        <img src="assets/images/logo.png" alt="Cocorico Poulailler" class="logo">
      </div>
      
      <nav class="menu">
        <ul>
          <li class="menu-item">
            <div class="menu-content">
              <fa-icon [icon]="faTachometerAlt"></fa-icon>
              Tableau de bord
            </div>
          </li>
          <li class="menu-item">
            <div class="menu-content">
              <fa-icon [icon]="faUsers"></fa-icon>
              Gestion utilisateurs
            </div>
          </li>
          <li class="menu-item">
            <div class="menu-content">
              <fa-icon [icon]="faSyringe"></fa-icon>
              Gestion vaccination
            </div>
          </li>
          <li class="menu-item">
            <div class="menu-content">
              <fa-icon [icon]="faKiwiBird"></fa-icon>
              Gestion de volailles
            </div>
          </li>
          <li class="menu-item">
            <div class="menu-content">
              <fa-icon [icon]="faHistory"></fa-icon>
              Historiques
            </div>
          </li>
        </ul>
      </nav>
      
      <div class="logout">
        <button>
          <fa-icon [icon]="faSignOutAlt"></fa-icon>
          Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      background-color: #FFDE59;
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 1rem;
      border-top-left-radius: 70px;
      border-bottom-left-radius: 20px;
    }

    .logo-container {
      padding: 1.5rem 1rem;
      text-align: center;
    }

    .logo {
      max-width: 180px;
      height: auto;
      margin-bottom: 0.5rem;
    }

    .logo-text {
      font-weight: bold;
      color: #000;
      font-size: 1.2rem;
    }

    .menu {
      flex: 1;
      margin-top: 2rem;
    }

    .menu ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .menu-item {
      cursor: pointer;
      border-radius: 0.5rem;
    }

    .menu-content {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #000;
    }

    .menu-item:hover .menu-content {
      background-color: #fff;
      width: 195px;
      color: rgb(175, 148, 37);
      border-radius: 0.5rem;
      transform: scale(1.1); /* Effet de zoom */
      transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease; /* Transition fluide */
    }

    .icon-dashboard, .icon-users, .icon-vaccination, 
    .icon-poultry, .icon-history, .icon-logout {
      font-size: 1.2rem;
      opacity: 0.7;
    }

    .logout {
      padding: 5rem 1rem;
      margin-top: auto;
    }

    .logout button {
      width: 100%;
      padding: 0.75rem;
      background: transparent;
      border: none;
      color: #FF0000;
      border-radius: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 1rem;
      font-weight: 500;
    }

    .logout button:hover {
      background-color: rgba(255, 0, 0, 0.1);
      width: 195px;
      transform: scale(1.1); /* Effet de zoom */
      transition: transform 0.3s ease, background-color 0.3s ease, color 0.3s ease; /* Transition fluide */
    }
  `]
})
export class SidebarComponent {
  faTachometerAlt = faTachometerAlt;
  faUsers = faUsers;
  faSyringe = faSyringe;
  faKiwiBird = faKiwiBird;
  faHistory = faHistory;
  faSignOutAlt = faSignOutAlt;
}