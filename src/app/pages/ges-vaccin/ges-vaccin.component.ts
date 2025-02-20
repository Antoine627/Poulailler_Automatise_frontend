import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ges-vaccin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ges-vaccin.component.html',
  styleUrl: './ges-vaccin.component.css'
})
export class GesVaccinComponent {
  days: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  dates: { date: number, day: string, index: number }[] = [];
  selectedDate: { date: number, day: string } | null = null;
  showDates: boolean = false;

  constructor() {
    this.generateCalendar();
    this.generateCurrentWeek();
  }

  // Génère un calendrier sur 45 jours
  generateCalendar() {
    const now = new Date();
    const currentDay = now.getDay(); // Get the day of the week (0 to 6)
  
    for (let i = 7; i < 45; i++) { // Start from the 8th day (i=7) to skip the first week
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + i);
      const dayIndex = futureDate.getDay(); // 0 (Dim) à 6 (Sam)
      const dayName = this.days[dayIndex === 0 ? 6 : dayIndex - 1]; // Adapter pour que Lun commence
      this.dates.push({ date: futureDate.getDate(), day: dayName, index: i + 1 });
    }
  }
  
  generateCurrentWeek() {
    let today = new Date();
    let dayOfWeek = today.getDay(); // 0 (Dimanche) à 6 (Samedi)
    let startOfWeek = new Date(today); 
  
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Lundi de la semaine actuelle
  
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
  
      this.dates.push({
        index: i + 1,
        day: this.days[i],
        date: currentDate.getDate() // Use getDate() to get the day of the month as a number
      });
    }
  }
  
  // Sélectionner une date
  selectDate(dateObj: { date: number; day: string }) {
    this.selectedDate = dateObj;
  }

  // Afficher / cacher le calendrier
  toggleDates() {
    this.showDates = !this.showDates;
  }
}
