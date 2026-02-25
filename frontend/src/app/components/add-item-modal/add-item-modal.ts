import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-item-modal',
  standalone: false,
  templateUrl: './add-item-modal.html',
  styleUrl: './add-item-modal.css',
})
export class AddItemModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() addItem = new EventEmitter<string>();

  itemText: string = '';
  maxItems: number = 8;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}

  onClose(): void {
    this.itemText = '';
    this.close.emit();
  }

  onAdd(): void {
    if (!this.itemText.trim()) {
      return;
    }
    this.addItem.emit(this.itemText);
    this.itemText = '';
  }

  pasteFromClipboard(): void {
    navigator.clipboard.readText().then(text => {
      this.itemText = text;
      this.cdr.detectChanges();
    }).catch(err => {
      console.error('Error al leer portapapeles:', err);
    });
  }

  isValidItem(): boolean {
    return this.itemText.includes('Item Class:') && this.itemText.includes('Rarity:');
  }
}
