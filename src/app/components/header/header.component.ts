// header.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  currentDate = new Date();
  pageTitle = 'Tableau de bord';

  // Mapping des routes vers les titres
  private routeTitles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/user-management': 'Gestion utilisateurs',
    '/vaccination-management': 'Gestion vaccination',
    '/poultry-management': 'Gestion de volailles',
    '/alimentation': 'Alimentations',
    '/historiques': 'Historiques'
  };

  constructor(private router: Router) {
    // S'abonner aux événements de navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Mettre à jour le titre en fonction de la route active
      this.pageTitle = this.routeTitles[event.url] || 'Tableau de bord';
    });
  }

  ngOnInit() {
    // Initialiser le titre au chargement du composant
    this.pageTitle = this.routeTitles[this.router.url] || 'Tableau de bord';
  }
}