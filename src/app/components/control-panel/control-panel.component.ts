import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlItemComponent } from '../control-item/control-item.component';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, ControlItemComponent],
  template: `
    <div class="panel">
      <h2>Contrôles</h2>
      <div class="controls-grid">
        <app-control-item
          title="Mangeoirs"
          type="feed"
          [value]="5"
          unit="kg"
          status="Statut"
          [isActive]="false">
        </app-control-item>

        <app-control-item
          title="Abreuvoirs"
          type="water"
          [value]="96"
          unit="%"
          status="Statut"
          [isActive]="false">
        </app-control-item>

        <app-control-item
          title="Lumière"
          type="light"
          status="Éteinte"
          [isActive]="false">
        </app-control-item>
      </div>
    </div>
  `,
  styles: [`
    .panel {
      background-color: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.5rem;
      color: #333;
    }
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
  `]
})
export class ControlPanelComponent {}