import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PoeWikiService {
  private wikiBaseUrl = 'https://www.poewiki.net/wiki/';
  private proxyUrl = 'http://localhost:3000/api/poe-wiki/image';

  private imageCache: Map<string, string> = new Map();

  constructor(private http: HttpClient) {}

  getItemImage(baseType: string, isUnique: boolean): Observable<string | null> {
    const searchName = baseType.trim();
    const cacheKey = `${searchName}_${isUnique}`;
    
    if (this.imageCache.has(cacheKey)) {
      return of(this.imageCache.get(cacheKey) || null);
    }

    // Use proxy to get image URL
    return this.http.get<any>(`${this.proxyUrl}?title=${encodeURIComponent(searchName)}&isUnique=${isUnique}`).pipe(
      map(response => {
        const imageUrl = response?.imageUrl || null;
        if (imageUrl) {
          this.imageCache.set(cacheKey, imageUrl);
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
