// frontend/src/app/components/admin/manage-inventory/manage-inventory.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, InventoryItem } from '../../../services/inventory.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-inventory.component.html',
  styleUrls: ['./manage-inventory.component.scss'],
})
export class ManageInventoryComponent implements OnInit {
  // Array original con todo el inventario
  inventory: InventoryItem[] = [];

  // Array filtrado que usará el *ngFor en la vista
  filteredInventory: InventoryItem[] = [];

  // Almacena el id del elemento que estamos editando (o null si ninguno)
  editId: number | null = null;

  // Valor temporal de la cantidad mientras editamos
  editQuantity: number | null = null;

  // Término de búsqueda
  searchTerm: string = '';

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    // Cargar inventario desde el servicio
    this.inventoryService.getInventory().subscribe({
      next: (data: InventoryItem[]) => {
        this.inventory = data;
        // Inicialmente, filteredInventory = todos los items
        this.filteredInventory = [...this.inventory];
      },
      error: (err) => {
        console.error('Error cargando inventario', err);
        Swal.fire('Error', 'No se pudo cargar el inventario.', 'error');
      },
    });
  }

  /** Filtra el array según searchTerm */
  filterInventory(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredInventory = [...this.inventory];
    } else {
      this.filteredInventory = this.inventory.filter((item) =>
        item.productName.toLowerCase().includes(term)
      );
    }
  }

  /** Inicia la edición de un ítem concreto */
  onEdit(item: InventoryItem): void {
    this.editId = item.id;
    this.editQuantity = item.quantity;
  }

  /** Cancela la edición */
  cancelEdit(item: InventoryItem): void {
    this.editId = null;
    this.editQuantity = null;
  }

  /** Guarda el nuevo valor de cantidad */
  saveEdit(item: InventoryItem): void {
    if (this.editQuantity === null || this.editQuantity < 0) {
      Swal.fire('Error', 'La cantidad debe ser un número válido.', 'error');
      return;
    }

    this.inventoryService.updateInventory(item.id, this.editQuantity).subscribe({
      next: () => {
        // Actualiza en el array original
        item.quantity = this.editQuantity!;
        // Refresca el filteredInventory para que vea el cambio
        this.filterInventory();
        Swal.fire('Guardado', 'Cantidad actualizada correctamente.', 'success');
        this.editId = null;
        this.editQuantity = null;
      },
      error: (err) => {
        console.error('Error guardando inventario', err);
        Swal.fire('Error', 'No se pudo actualizar el inventario.', 'error');
      },
    });
  }
}
