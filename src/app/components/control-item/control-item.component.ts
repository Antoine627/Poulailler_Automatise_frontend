import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-control-item',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  template: `
    <div class="control-item">
      <div class="control-header">
        <h3 class="title">
          {{title}}
        </h3>
        <fa-icon [icon]="faClock" class="clock-icon" (click)="openModal()"></fa-icon>
      </div>
      <div class="control-body">
        <div class="content-center">
          <div *ngIf="currentValue && unit" class="value-section">
            <span class="value">{{currentValue}}</span>
            <span class="unit">{{unit}}</span>
          </div>
          <div class="icon-section">
            <img [src]="getImageUrl()" 
                 [class.light-glow]="type === 'light' && isActive"
                 alt="{{type}} icon" 
                 class="control-icon"/>
          </div>
          <label class="switch">
            <input type="checkbox" 
                   [checked]="isActive" 
                   (change)="toggleActive()"
                   [disabled]="type !== 'light' && currentValue <= 0">
            <span class="slider round"></span>
          </label>
        </div>
      </div>
      <div class="status-section">
        <div class="status">
          Status <span class="status-indicator" [class.on]="isActive"></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .control-item {
      background-color: #FFF59D;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1rem;
      position: relative;
    }
    .control-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .control-header .title {
      margin: 0;
      font-size: 1.2rem;
    }
    .clock-icon {
      cursor: pointer;
      color: #555;
    }
    .control-body {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .content-center {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .value-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .value {
      font-size: 1.5rem;
      font-weight: bold;
      transition: all 0.5s ease;
    }
    .unit {
      font-size: 1rem;
      color: #555;
      transition: all 0.5s ease;
    }
    .icon-section {
      display: flex;
      align-items: center;
    }
    .control-icon {
      width: 48px;
      height: 48px;
      transition: all 0.5s ease;
    }
    
    /* Nouveau style pour le switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 34px;
      margin: 0 10px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
    }

    input:checked + .slider {
      background-color: #4CAF50;
    }

    input:disabled + .slider {
      background-color: #e0e0e0;
      cursor: not-allowed;
    }

    input:checked:disabled + .slider {
      background-color: #a5d6a7;
    }

    input:focus + .slider {
      box-shadow: 0 0 1px #4CAF50;
    }

    input:checked + .slider:before {
      transform: translateX(26px);
    }

    .slider.round {
      border-radius: 34px;
    }

    .slider.round:before {
      border-radius: 50%;
    }

    .status-section {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      font-size: 1rem;
      color: #555;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status {
      font-size: 1rem;
      color: #555;
    }
    .status-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #ccc;
    }
    .status-indicator.on {
      background-color: #4CAF50;
    }

     @keyframes glow {
      0% {
        filter: drop-shadow(0 0 2px rgba(255, 244, 104, 0.8))
               drop-shadow(0 0 4px rgba(255, 244, 104, 0.6));
      }
      50% {
        filter: drop-shadow(0 0 8px rgba(255, 244, 104, 0.8))
               drop-shadow(0 0 12px rgba(255, 244, 104, 0.6))
               drop-shadow(0 0 16px rgba(255, 244, 104, 0.4));
      }
      100% {
        filter: drop-shadow(0 0 2px rgba(255, 244, 104, 0.8))
               drop-shadow(0 0 4px rgba(255, 244, 104, 0.6));
      }
    }

    .light-glow {
      animation: glow 2s ease-in-out infinite;
    }
  `]
})
export class ControlItemComponent implements OnInit {
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