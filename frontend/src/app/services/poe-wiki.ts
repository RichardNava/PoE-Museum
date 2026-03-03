import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PoeWikiService {
  private wikiBaseUrl = 'https://www.poewiki.net/wiki/';
  private proxyUrl = `${environment.apiBaseUrl}/api/poe-wiki/image`;
  
  private imageCache: Map<string, string> = new Map();

  constructor(private http: HttpClient) {}

  getItemImage(itemName: string): Observable<string | null> {
    const searchName = itemName.trim();
    
    if (this.imageCache.has(searchName)) {
      return of(this.imageCache.get(searchName) || null);
    }

    return this.http.get<any>(`${this.proxyUrl}?title=${encodeURIComponent(searchName)}`).pipe(
      map(response => {
        const imageUrl = response?.imageUrl || null;
        if (imageUrl) {
          this.imageCache.set(searchName, imageUrl);
        }
        return imageUrl;
      })
    );
  }

  getItemWikiUrl(itemName: string): string {
    const encodedName = encodeURIComponent(itemName.trim().replace(/ /g, '_'));
    return `https://www.poewiki.net/wiki/${encodedName}`;
  }
}
