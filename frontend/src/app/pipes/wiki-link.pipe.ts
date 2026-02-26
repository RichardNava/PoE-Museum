import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'wikiLink'
})
export class WikiLinkPipe implements PipeTransform {
  private wikiBaseUrl = 'https://www.poewiki.net/wiki/';

  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';

    const transformed = text.replace(/\{([^}]+)\}/g, (match, content) => {
      const encodedName = encodeURIComponent(content.trim());
      const url = `${this.wikiBaseUrl}${encodedName}`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="wiki-link">${content.trim()}</a>`;
    });

    return this.sanitizer.bypassSecurityTrustHtml(transformed);
  }
}
