import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BuildService } from '../services/build';
import { AuthService } from '../services/auth';
import { Build } from '../models/build.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  builds: Build[] = [];
  allBuilds: Build[] = [];
  isMyBuilds = false;
  pageTitle = 'Galería de Builds';
  private searchSubscription?: Subscription;

  constructor(
    private buildService: BuildService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const url = this.router.url;
    this.isMyBuilds = url === '/my-builds';
    
    this.loadBuilds();

    this.searchSubscription = this.buildService.searchTerm$.subscribe(term => {
      this.filterBuilds(term);
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  private loadBuilds(): void {
    if (this.isMyBuilds) {
      this.pageTitle = 'Mis Builds';
      const user = this.authService.getCurrentUser();
      if (user?.nombre) {
        this.buildService.getAllBuilds().subscribe({
          next: (data) => {
            this.allBuilds = data.filter(b => b.autor === user.nombre);
            this.filterBuilds(this.buildService.getSearchTerm());
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error cargando builds:', err);
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.buildService.getAllBuilds().subscribe(data => {
        this.allBuilds = data;
        this.filterBuilds(this.buildService.getSearchTerm());
        this.cdr.detectChanges();
      });
    }
  }

  private filterBuilds(term: string): void {
    if (!term.trim()) {
      this.builds = [...this.allBuilds];
    } else {
      const lowerTerm = term.toLowerCase();
      this.builds = this.allBuilds.filter(b => 
        b.nombre?.toLowerCase().includes(lowerTerm) ||
        b.autor?.toLowerCase().includes(lowerTerm) ||
        b.clase?.toLowerCase().includes(lowerTerm) ||
        b.ascendencia?.toLowerCase().includes(lowerTerm) ||
        b.descripcion?.toLowerCase().includes(lowerTerm) ||
        b.ventajas?.toLowerCase().includes(lowerTerm) ||
        b.desventajas?.toLowerCase().includes(lowerTerm)
      );
    }
    this.cdr.detectChanges();
  }

  viewBuild(id: string): void {
    this.router.navigate(['/build', id]);
  }

  getImageUrl(imagen: string, imagenMime: string = ''): string {
    return this.buildService.getImageUrl(imagen, imagenMime);
  }
}