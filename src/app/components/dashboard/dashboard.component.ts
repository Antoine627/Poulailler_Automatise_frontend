import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { EnvironmentCardComponent } from '../environment-card/environment-card.component';
import { ControlPanelComponent } from '../control-panel/control-panel.component';
import { FeedingScheduleComponent } from '../feeding-schedule/feeding-schedule.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    SidebarComponent,
    EnvironmentCardComponent,
    ControlPanelComponent,
    FeedingScheduleComponent
  ],
  template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="main-content">
        <div class="dashboard-wrapper">
          <app-header></app-header>
          <div class="dashboard-container">
            <div class="environment-section">
              <app-environment-card 
                title="Temperature" 
                icon="thermometer" 
                value="6" 
                unit="C">
              </app-environment-card>
              
              <app-environment-card 
                title="Humidite" 
                icon="droplet" 
                value="67.57" 
                unit="%">
              </app-environment-card>
              
              <app-environment-card 
                title="Luminosite" 
                icon="sun" 
                value="52" 
                unit="Lux">
              </app-environment-card>
              
              <app-environment-card 
                title="Ventilation" 
                icon="fan" 
                [hasControls]="true"
                [isActive]="false">
              </app-environment-card>
            </div>
            
            <app-control-panel></app-control-panel>
            
            <app-feeding-schedule></app-feeding-schedule>
          </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      position: relative;
    }
    app-sidebar {
      position: fixed; /* Fixe la barre latérale */
      height: 100vh; /* Assure que la barre latérale prend toute la hauteur */
      width: 250px; /* Largeur de la barre latérale */
      z-index: 1; /* Barre latérale en dessous */
    }
    .main-content {
      flex: 1;
      overflow-y: auto; /* Permet le défilement vertical */
      background-color: #f5f5f5;
      margin-left: 250px; /* Largeur de la barre latérale */
      height: 100vh; /* Assure que la section principale prend toute la hauteur */
    }
    .dashboard-wrapper {
      padding: 1.5rem;
      background-color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      border-bottom-left-radius: 50px;
      border-top-left-radius: 50px;
      position: relative; /* Position relative pour le z-index */
      z-index: 2; /* Placer au-dessus de la barre latérale */
    }
    .dashboard-container {
      padding: 1.5rem;
    }
    .environment-section, .additional-sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .section {
      background-color: #f9f9f9;
      padding: 1rem;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    .section h3 {
      margin-bottom: 0.5rem;
    }
    .section ul {
      list-style-type: none;
      padding: 0;
    }
    .section ul li {
      margin-bottom: 0.25rem;
    }
  `]
})
export class DashboardComponent {}