import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <h1>Tableau de bord</h1>
      <div class="user-info">
        <span>Fatou DIEYE</span>
        <span class="date">{{currentDate | date:'dd/MM/yyyy'}}</span>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background-color: white;
      border-radius: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .date {
      font-size: 0.9rem;
      color: #666;
    }
  `]
})
export class HeaderComponent {
  currentDate = new Date();
}