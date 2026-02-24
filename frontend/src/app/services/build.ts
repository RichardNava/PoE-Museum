import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Build } from '../models/build.model';

@Injectable({
  providedIn: 'root',
})
export class BuildService {
  private apiUrl = 'http://localhost:3000/poem';
  private imageUrl = 'http://localhost:3000/images/';
  private buildsCache: Build[] = [];

  constructor(private http: HttpClient) {}

  getImageUrl(imagen: string): string {
    if (imagen && imagen.trim() !== '') {
      return this.imageUrl + imagen;
    }
    return 'https://placehold.co/300x200/12C9FF/000000?text=No+Image';
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
}