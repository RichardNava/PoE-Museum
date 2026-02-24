import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BuildService } from '../../services/build';
import { AuthService } from '../../services/auth';
import { Build, Valoraciones } from '../../models/build.model';

@Component({
  selector: 'app-detalle-build',
  standalone: false,
  templateUrl: './detalle-build.html',
  styleUrl: './detalle-build.css',
})
export class DetalleBuild implements OnInit {
  build: Build | null = null;
  isImageModalOpen = false;
  isVersionesOpen = false;
  currentUserName: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private buildService: BuildService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserName = user?.nombre || null;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const cachedBuilds = this.buildService.getBuildsFromCache();
      const cached = cachedBuilds.find(b => b._id === id);
      
      if (cached) {
        this.build = cached;
        this.cdr.detectChanges();
      } else {
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
    if (!this.currentUserName) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.build) {
      if (this.build.autor === this.currentUserName) {
        this.buildService.setBuildToEdit(this.build);
        this.router.navigate(['/create-build']);
      } else {
        this.router.navigate(['/login']);
      }
    }
  }

  canEdit(): boolean {
    if (!this.currentUserName || !this.build) return false;
    return this.build.autor === this.currentUserName;
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

  parseList(text: string | undefined): string[] {
    if (!text) return [];
    return text
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  ceil(value: number | undefined): number {
    return value ? Math.ceil(value) : 0;
  }

  getValoracion(key: keyof import('../../models/build.model').Valoraciones): number {
    return this.build?.valoraciones?.[key] ?? 0;
  }

  getPartialFill(value: number): number {
    return (value % 1) * 100;
  }

  openImageModal(): void {
    if (this.build?.imagen) {
      this.isImageModalOpen = true;
    }
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
  }

  toggleVersiones(): void {
    this.isVersionesOpen = !this.isVersionesOpen;
  }
}