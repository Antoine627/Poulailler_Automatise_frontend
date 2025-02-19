import { Component, Input, OnInit, OnDestroy, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-control-item',
  templateUrl: './control-item.component.html', // Lien vers le template HTML
  styleUrls: ['./control-item.component.css'], // Lien vers le fichier CSS
  standalone: true,
  imports: [CommonModule, FontAwesomeModule]
})
export class ControlItemComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() type: 'feed' | 'water' | 'light' = 'feed';
  @Input() value: number = 0;
  @Input() unit: string = '';
  @Input() status: string = '';
  @Input() isActive: boolean = false;

  currentValue: number = 0;
  private decrementInterval: any;

  faClock = faClock;

  ngOnInit() {
    this.currentValue = this.value;
  }

  getImageUrl(): string {
    if (this.type === 'light') {
      return this.isActive ? 'assets/images/light.png' : 'assets/images/light-off.png';
    }
    
    switch(this.type) {
      case 'feed': return 'assets/images/feeder.png';
      case 'water': return 'assets/images/drink.png';
      default: return '';
    }
  }

  toggleActive() {
    this.isActive = !this.isActive;

    if (this.type === 'feed' || this.type === 'water') {
      if (this.isActive && this.currentValue > 0) {
        if (this.decrementInterval) {
          clearInterval(this.decrementInterval);
        }
        this.decrementInterval = setInterval(() => {
          if (this.currentValue > 0) {
            this.currentValue--;
          } else {
            clearInterval(this.decrementInterval);
          }
        }, 1000);
      } else {
        if (this.decrementInterval) {
          clearInterval(this.decrementInterval);
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.decrementInterval) {
      clearInterval(this.decrementInterval);
    }
  }

  openModal() {
    console.log('Open scheduling modal');
  }
}