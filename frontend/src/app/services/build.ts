import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, concat, EMPTY, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Build } from '../models/build.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  private readonly buildsCacheDuration = 5 * 60 * 1000;
  private apiUrl = `${environment.apiBaseUrl}/poem`;
  private imageUrl = `${environment.apiBaseUrl}/images/`;
  private buildsCache: Build[] = [];
  private buildsCacheTimestamp = 0;
  private hasBuildsCache = false;
  
  private buildToEditSubject = new BehaviorSubject<Build | null>(null);
  buildToEdit$ = this.buildToEditSubject.asObservable();

  private buildsRefreshWarningSubject = new BehaviorSubject<boolean>(false);
  buildsRefreshWarning$ = this.buildsRefreshWarningSubject.asObservable();

  constructor(private http: HttpClient) {}

  setBuildToEdit(build: Build | null): void {
    this.buildToEditSubject.next(build);
  }

  getBuildToEdit(): Build | null {
    return this.buildToEditSubject.getValue();
  }

  clearBuildToEdit(): void {
    this.buildToEditSubject.next(null);
  }

  getImageUrl(imagen: string, imagenMime: string = ''): string {
    if (!imagen || imagen.trim() === '') {
      return 'https://placehold.co/300x200/12C9FF/000000?text=No+Image';
    }
    
    // If imagen_mime is "image/uri", treat imagen as a full URL
    if (imagenMime === 'image/uri') {
      return imagen;
    }
    
    // Otherwise, use local assets
    return this.imageUrl + imagen;
  }

  getAllBuilds(forceRefresh = false): Observable<Build[]> {
    const hasValidCache = this.hasBuildsCache && Date.now() - this.buildsCacheTimestamp < this.buildsCacheDuration;

    if (!forceRefresh && hasValidCache) {
      return of([...this.buildsCache]);
    }

    if (!forceRefresh && this.hasBuildsCache) {
      this.buildsRefreshWarningSubject.next(false);
      return concat(
        of([...this.buildsCache]),
        this.requestBuilds().pipe(
          catchError(() => {
            this.buildsRefreshWarningSubject.next(true);
            return EMPTY;
          })
        )
      );
    }

    return this.requestBuilds();
  }

  getBuildById(id: string): Observable<Build> {
    return this.http.get<Build>(`${this.apiUrl}/${id}`);
  }

  getBuildsFromCache(): Build[] {
    return [...this.buildsCache];
  }

  createBuild(build: Build): Observable<Build> {
    return this.http.post<Build>(`${this.apiUrl}`, build).pipe(
      tap(createdBuild => this.addOrReplaceCachedBuild(createdBuild))
    );
  }

  updateBuild(id: string, build: Build): Observable<Build> {
    return this.http.put<Build>(`${this.apiUrl}/${id}`, build).pipe(
      tap(updatedBuild => this.addOrReplaceCachedBuild(updatedBuild))
    );
  }

  deleteBuild(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.removeCachedBuild(id))
    );
  }

  getBuildsByUser(userId: string): Observable<Build[]> {
    return this.http.get<Build[]>(`${this.apiUrl}/user/${userId}`);
  }

  private requestBuilds(): Observable<Build[]> {
    return this.http.get<Build[]>(`${this.apiUrl}/all`).pipe(
      tap(builds => this.cacheBuilds(builds))
    );
  }

  private cacheBuilds(builds: Build[]): void {
    this.buildsCache = builds;
    this.buildsCacheTimestamp = Date.now();
    this.hasBuildsCache = true;
    this.buildsRefreshWarningSubject.next(false);
  }

  private addOrReplaceCachedBuild(build: Build): void {
    if (!this.hasBuildsCache) return;

    const index = this.buildsCache.findIndex(cachedBuild => cachedBuild._id === build._id);
    this.buildsCache = index === -1
      ? [build, ...this.buildsCache]
      : this.buildsCache.map(cachedBuild => cachedBuild._id === build._id ? build : cachedBuild);
    this.buildsCacheTimestamp = Date.now();
    this.buildsRefreshWarningSubject.next(false);
  }

  private removeCachedBuild(id: string): void {
    if (!this.hasBuildsCache) return;

    this.buildsCache = this.buildsCache.filter(build => build._id !== id);
    this.buildsCacheTimestamp = Date.now();
    this.buildsRefreshWarningSubject.next(false);
  }
}
