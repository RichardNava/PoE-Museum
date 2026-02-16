import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BuildService } from '../../services/build';
import { Build } from '../../models/build.model';

@Component({
  selector: 'app-detalle-build',
  standalone: false,
  templateUrl: './detalle-build.html',
  styleUrl: './detalle-build.css',
})
export class DetalleBuild implements OnInit {
  build: Build | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private buildService: BuildService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Primero buscar en caché
      const cachedBuilds = this.buildService.getBuildsFromCache();
      const cached = cachedBuilds.find(b => b._id === id);
      
      if (cached) {
        this.build = cached;
        this.cdr.detectChanges();
      } else {
        // Si no está en caché, hacer petición
        this.buildService.getBuildById(id).subscribe({
          next: (build) => {
            this.build = build;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error cargando build:', err);
            this.cdr.detectChanges();
          }
        });
      }
    }
  }

  goBack(): void {
    this.location.back();
  }

  editBuild(): void {
    this.router.navigate(['/create-build'], { state: { build: this.build } });
  }

  getStars(value: number): number[] {
    return Array(5).fill(0);
  }

  getStarFill(index: number, value: number): number {
    return Math.min(1, Math.max(0, value - index));
  }

  getImageUrl(imagen: string): string {
    return this.buildService.getImageUrl(imagen);
  }
}