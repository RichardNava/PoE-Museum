import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';

interface ParsedItem {
  nameAndType: string;
  itemClass: string;
  rarity: string;
  quality: string;
  armour?: string;
  energyShield?: string;
  physicalDamage?: string;
  critChance?: string;
  attacksPerSec?: string;
  requirements: string;
  sockets: string;
  itemLevel: string;
  enchantments: string[];
  implicits: string[];
  explicits: string[];
  isCorrupted: boolean;
  influence: string;
}

@Component({
  selector: 'app-poe-item',
  standalone: false,
  templateUrl: './poe-item.html',
  styleUrl: './poe-item.css',
})
export class PoeItemComponent implements OnInit {
  @Input() itemText: string = '';
  
  item: ParsedItem | null = null;
  error: string = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.parseItem();
  }

  private parseItem(): void {
    if (!this.itemText.trim()) {
      this.error = 'No hay contenido';
      return;
    }

    const rawLines = this.itemText.split('\n');
    const lines: string[] = [];
    
    let skipThisLine = false;
    
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      const nextLine = rawLines[i + 1]?.trim();
      
      // Skip lines that ARE { }
      if (line.startsWith('{') && line.endsWith('}')) {
        continue;
      }
      
      // Skip lines inside {} blocks
      if (line.startsWith('{')) {
        skipThisLine = true;
        continue;
      }
      if (line.endsWith('}')) {
        skipThisLine = false;
        continue;
      }
      if (skipThisLine) continue;
      
      // Detect and skip flavor text - comes AFTER a separator and BEFORE another separator
      // Check if this is a separator
      if (line.includes('---') || line.includes('--------')) {
        // Check if next lines are flavor text (end with .)
        if (nextLine && nextLine.endsWith('.') && !nextLine.includes(':')) {
          // Skip all flavor lines until next separator
          let j = i + 1;
          while (j < rawLines.length) {
            const flavorLine = rawLines[j].trim();
            if (flavorLine.includes('---') || flavorLine.includes('--------')) break;
            j++;
          }
          i = j;
          continue;
        }
      }
      
      if (line) lines.push(line);
    }

    try {
      this.item = this.parseLines(lines);
      this.error = '';
    } catch (e) {
      this.error = 'Error al parsear el item';
      console.error('Parse error:', e);
    }
    
    this.cdr.detectChanges();
  }

  private parseLines(lines: string[]): ParsedItem {
    const item: ParsedItem = {
      nameAndType: '',
      itemClass: '',
      rarity: '',
      quality: '',
      requirements: '',
      sockets: '',
      itemLevel: '',
      enchantments: [],
      implicits: [],
      explicits: [],
      isCorrupted: false,
      influence: ''
    };

    // Find section indices
    const rarityIdx = lines.findIndex(l => l.startsWith('Rarity:'));
    const classIdx = lines.findIndex(l => l.startsWith('Item Class:'));
    const reqIdx = lines.findIndex(l => l.startsWith('Requirements:'));
    const socketsIdx = lines.findIndex(l => l.includes('Sockets:'));
    const ilvlIdx = lines.findIndex(l => l.startsWith('Item Level:'));

    // Name and Type (after Rarity)
    if (rarityIdx >= 0 && rarityIdx + 1 < lines.length) {
      const name = lines[rarityIdx + 1];
      const type = lines[rarityIdx + 2] || '';
      item.nameAndType = `${name}, ${type}`;
    }

    // Item Class
    if (classIdx >= 0) {
      item.itemClass = lines[classIdx].replace('Item Class:', '').trim();
    }

    // Rarity
    if (rarityIdx >= 0) {
      item.rarity = lines[rarityIdx].replace('Rarity:', '').trim();
    }

    // Stats (between Rarity and Requirements)
    const statsEnd = reqIdx >= 0 ? reqIdx : lines.length;
    for (let i = rarityIdx + 1; i < statsEnd; i++) {
      const l = lines[i];
      if (l.startsWith('Quality:')) item.quality = l;
      else if (l.startsWith('Armour:')) item.armour = l;
      else if (l.startsWith('Energy Shield:')) item.energyShield = l;
      else if (l.startsWith('Physical Damage:')) item.physicalDamage = l;
      else if (l.startsWith('Critical Strike Chance:')) item.critChance = l;
      else if (l.startsWith('Attacks per Second:')) item.attacksPerSec = l;
    }

    // Requirements (single line)
    if (reqIdx >= 0) {
      const reqs: string[] = [];
      for (let i = reqIdx + 1; i < lines.length; i++) {
        const l = lines[i];
        if (l.includes('---') || l.includes('--------') || l.includes('Sockets')) break;
        if (l) reqs.push(l.replace('Level:', 'Lvl:').replace('Str:', 'S:').replace('Dex:', 'D:').replace('Int:', 'I:'));
      }
      item.requirements = reqs.join(' ');
    }

    // Sockets
    if (socketsIdx >= 0) item.sockets = lines[socketsIdx];

    // Item Level
    if (ilvlIdx >= 0) item.itemLevel = lines[ilvlIdx];

    // After Item Level: enchantments, implicits, explicits
    const start = ilvlIdx >= 0 ? ilvlIdx + 1 : 0;
    let currentSection: 'enchant' | 'implicit' | null = null;
    
    for (let i = start; i < lines.length; i++) {
      const l = lines[i];
      const lower = l.toLowerCase();
      
      if (lower === 'corrupted') {
        item.isCorrupted = true;
        continue;
      }
      if (lower.includes('shaper') || lower.includes('elder') || lower.includes('warlord') || 
          lower.includes('hunter') || lower.includes('crusader') || lower.includes('redeemer')) {
        item.influence = l;
        continue;
      }
      if (l.includes('---') || l.includes('--------')) {
        currentSection = null;
        continue;
      }
      
      if (lower.includes('(enchant)')) {
        currentSection = 'enchant';
        item.enchantments.push(l.replace(/\(enchant\)/gi, '').trim());
      } else if (lower.includes('(implicit)')) {
        currentSection = 'implicit';
        item.implicits.push(l.replace(/\(implicit\)/gi, '').trim());
      } else if (l.trim()) {
        if (currentSection === 'enchant') item.enchantments.push(l);
        else if (currentSection === 'implicit') item.implicits.push(l);
        else item.explicits.push(l);
      }
    }

    return item;
  }

  getRarityClass(): string {
    return this.item?.rarity?.toLowerCase() || '';
  }
}
