import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';

interface InventoryItem {
  id: number;
  product: string;
  quantity: number;
}

@Component({
  selector: 'app-manage-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-inventory.component.html',
  styleUrls: ['./manage-inventory.component.scss']
})
export class ManageInventoryComponent implements OnInit {
  inventory: InventoryItem[] = [
    { id:1, product:'Strawberry Yogurt', quantity:40 },
    { id:2, product:'Granola',          quantity:15 },
    { id:3, product:'Chocolate Chips',  quantity:35 }
  ];
  filtered: InventoryItem[] = [];
  searchTerm = '';

  // edición inline
  editId: number | null = null;
  backupQty = 0;

  ngOnInit() {
    this.filtered = [...this.inventory];
  }

  filterInventory() {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.inventory.filter(i =>
      i.product.toLowerCase().includes(term)
    );
  }

  startEdit(item: InventoryItem) {
    this.editId = item.id;
    this.backupQty = item.quantity;
  }

  saveEdit(item: InventoryItem) {
    this.editId = null;
    // automáticamente reflejado en el array original
  }

  cancelEdit(item: InventoryItem) {
    item.quantity = this.backupQty;
    this.editId = null;
  }
}
