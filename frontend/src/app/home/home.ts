import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BuildService } from '../services/build';
import { AuthService } from '../services/auth';
import { Build } from '../models/build.model';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  builds: Build[] = [];
  isMyBuilds = false;
  pageTitle = 'Galería de Builds';

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
    
    if (this.isMyBuilds) {
      this.pageTitle = 'Mis Builds';
      const user = this.authService.getCurrentUser();
      if (user?.nombre) {
        this.buildService.getAllBuilds().subscribe({
          next: (data) => {
            this.builds = data.filter(b => b.autor === user.nombre);
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
        console.log('Datos recibidos en componente:', data);
        this.builds = data;
        this.cdr.detectChanges();
      });
    }
  }

  viewBuild(id: string): void {
    this.router.navigate(['/build', id]);
  }

  getImageUrl(imagen: string): string {
    return this.buildService.getImageUrl(imagen);
  }
}