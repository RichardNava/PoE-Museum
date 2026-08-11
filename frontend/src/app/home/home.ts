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
  isLoading = false;
  showLoadingState = false;
  isServerWaking = false;
  loadError = false;
  isShowingCachedBuilds = false;
  activeSearchTerm = '';
  pageTitle = 'Galería de Builds';
  private routeQuerySubscription?: Subscription;
  private refreshWarningSubscription?: Subscription;
  private loadingVisibilityTimer?: ReturnType<typeof setTimeout>;
  private serverWakeTimer?: ReturnType<typeof setTimeout>;

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
    
    this.routeQuerySubscription = this.route.queryParamMap.subscribe(params => {
      this.activeSearchTerm = params.get('q')?.trim() ?? '';
      this.filterBuilds(this.activeSearchTerm);
    });
    this.loadBuilds();
    this.refreshWarningSubscription = this.buildService.buildsRefreshWarning$.subscribe(showWarning => {
      this.isShowingCachedBuilds = showWarning;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.routeQuerySubscription?.unsubscribe();
    this.refreshWarningSubscription?.unsubscribe();
    this.clearLoadingTimers();
  }

  private loadBuilds(forceRefresh = false): void {
    this.startLoading();

    if (this.isMyBuilds) {
      this.pageTitle = 'Mis Builds';
      const user = this.authService.getCurrentUser();
      if (user?.nombre) {
        this.buildService.getAllBuilds(forceRefresh).subscribe({
          next: (data) => {
            this.allBuilds = data.filter(b => b.autor === user.nombre);
            this.filterBuilds(this.activeSearchTerm);
            this.finishLoading();
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error cargando builds:', err);
            this.handleLoadError();
            this.cdr.detectChanges();
          }
        });
      } else {
        this.finishLoading();
      }
    } else {
      this.buildService.getAllBuilds(forceRefresh).subscribe({
        next: (data) => {
          this.allBuilds = data;
          this.filterBuilds(this.activeSearchTerm);
          this.finishLoading();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando builds:', err);
          this.handleLoadError();
          this.cdr.detectChanges();
        }
      });
    }
  }

  retryLoadBuilds(): void {
    this.loadBuilds(true);
  }

  clearSearch(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge'
    });
  }

  private startLoading(): void {
    this.clearLoadingTimers();
    this.isLoading = true;
    this.showLoadingState = false;
    this.isServerWaking = false;
    this.loadError = false;
    this.loadingVisibilityTimer = setTimeout(() => {
      if (this.isLoading) {
        this.showLoadingState = true;
        this.cdr.detectChanges();
      }
    }, 400);
    this.serverWakeTimer = setTimeout(() => {
      if (this.isLoading) {
        this.isServerWaking = true;
        this.cdr.detectChanges();
      }
    }, 1200);
  }

  private finishLoading(): void {
    this.clearLoadingTimers();
    this.isLoading = false;
    this.showLoadingState = false;
    this.isServerWaking = false;
  }

  private handleLoadError(): void {
    this.finishLoading();
    this.loadError = true;
  }

  private clearLoadingTimers(): void {
    if (this.loadingVisibilityTimer) {
      clearTimeout(this.loadingVisibilityTimer);
      this.loadingVisibilityTimer = undefined;
    }

    if (this.serverWakeTimer) {
      clearTimeout(this.serverWakeTimer);
      this.serverWakeTimer = undefined;
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

  exportToJson(): void {
    const dataStr = JSON.stringify(this.allBuilds, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poe-builds-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
