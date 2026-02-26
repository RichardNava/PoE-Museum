import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Build } from '../models/build.model';

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  private apiUrl = 'http://localhost:3000/poem';
  private imageUrl = 'http://localhost:3000/images/';
  private buildsCache: Build[] = [];
  
  private buildToEditSubject = new BehaviorSubject<Build | null>(null);
  buildToEdit$ = this.buildToEditSubject.asObservable();

  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  constructor(private http: HttpClient) {}

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  getSearchTerm(): string {
    return this.searchTermSubject.getValue();
  }

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

  getAllBuilds(): Observable<Build[]> {
    return this.http.get<Build[]>(`${this.apiUrl}/all`).pipe(
      tap(builds => {
        this.buildsCache = builds;
      })
    );
  }

  getBuildById(id: string): Observable<Build> {
    return this.http.get<Build>(`${this.apiUrl}/${id}`);
  }

  getBuildsFromCache(): Build[] {
    return this.buildsCache;
  }

  createBuild(build: Build): Observable<Build> {
    return this.http.post<Build>(`${this.apiUrl}`, build);
  }

  updateBuild(id: string, build: Build): Observable<Build> {
    return this.http.put<Build>(`${this.apiUrl}/${id}`, build);
  }

  deleteBuild(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getBuildsByUser(userId: string): Observable<Build[]> {
    return this.http.get<Build[]>(`${this.apiUrl}/user/${userId}`);
  }
}