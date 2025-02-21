
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
  dates: { date: number, day: string, index: number }[] = []; // Toutes les dates
  currentWeekDates: { date: number, day: string, index: number }[] = []; // Uniquement la semaine actuelle
  selectedDate: { date: number, day: string } | null = null;
  showDates: boolean = false; // Masquer les autres dates au début

  constructor() {
    this.generateCurrentWeek();
    this.generateCalendar();
  }

  // Génère toutes les dates sauf celles de la semaine actuelle
  generateCalendar() {
    const now = new Date();
    const currentDay = now.getDay(); // Jour de la semaine (0 = Dimanche, 6 = Samedi)

    for (let i = 7; i < 45; i++) { // Générer à partir de la 2ème semaine
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + i);
      const dayIndex = futureDate.getDay(); // 0 (Dim) à 6 (Sam)
      const dayName = this.days[dayIndex === 0 ? 6 : dayIndex - 1]; // Adapter pour que Lun commence

      // Ajouter uniquement si ce n'est pas dans la semaine actuelle
      if (!this.isInCurrentWeek(futureDate)) {
        this.dates.push({ date: futureDate.getDate(), day: dayName, index: i + 1 });
      }
    }
  }

  // Génère les dates de la semaine actuelle
  generateCurrentWeek() {
    let today = new Date();
    let dayOfWeek = today.getDay(); // 0 (Dim) à 6 (Sam)
    let startOfWeek = new Date(today);
  
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Début de la semaine (Lundi)
  
    for (let i = 0; i < 7; i++) {
      let currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);

      this.currentWeekDates.push({
        index: i + 1,
        day: this.days[i],
        date: currentDate.getDate()
      });
    }
  }

  // Vérifie si une date est dans la semaine actuelle
  isInCurrentWeek(date: Date): boolean {
    let today = new Date();
    let dayOfWeek = today.getDay();
    let startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    let endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return date >= startOfWeek && date <= endOfWeek;
  }

  // Sélectionner une date
  selectDate(dateObj: { date: number; day: string }) {
    this.selectedDate = dateObj;
  }

  // Afficher / cacher toutes les dates (sauf la semaine actuelle)
  toggleDates() {
    this.showDates = !this.showDates;
  }
}
