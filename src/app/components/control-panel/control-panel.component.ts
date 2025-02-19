import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlItemComponent } from '../control-item/control-item.component';

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [CommonModule, ControlItemComponent],
  templateUrl: './control-panel.component.html', // Lien vers le template HTML
  styleUrls: ['./control-panel.component.css'] // Lien vers le fichier CSS
})
export class ControlPanelComponent {}