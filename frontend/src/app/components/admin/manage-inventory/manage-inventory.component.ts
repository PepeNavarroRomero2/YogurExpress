// src/app/components/admin/manage-inventory/manage-inventory.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import {
  InventoryService,
  InventoryItem
} from '../../../services/inventory.service';

@Component({
  selector: 'app-manage-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-inventory.component.html',
  styleUrls: ['./manage-inventory.component.scss']
})
export class ManageInventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  filteredInventory: InventoryItem[] = [];
  editId: number | null = null;
  editQuantity: number | null = null;
  searchTerm: string = '';

  constructor(private inventoryService: InventoryService) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  /** Carga todo el inventario (id_producto, productName, cantidad_disponible) */
  loadInventory(): void {
    this.inventoryService.getInventory().subscribe({
      next: (data: InventoryItem[]) => {
        this.inventory = data;
        this.filteredInventory = data;
      },
      error: (err) => {
        console.error('Error cargando inventario:', err);
        Swal.fire(
          'Error',
          'No se pudo cargar la lista de inventario.',
          'error'
        );
      }
    });
  }

  /** Filtra la tabla a medida que el usuario escribe en el input */
  onSearchTermChange(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredInventory = [...this.inventory];
    } else {
      this.filteredInventory = this.inventory.filter((item) =>
        item.productName.toLowerCase().includes(term)
      );
    }
  }

  /** Activa el modo ediciÃ³n para un Ã­tem concreto */
  enableEdit(item: InventoryItem): void {
    this.editId = item.id_producto;
    this.editQuantity = item.cantidad_disponible;
  }

  /** Cancela la ediciÃ³n en curso */
  cancelEdit(): void {
    this.editId = null;
    this.editQuantity = null;
  }

  /** Guarda la cantidad editada para el Ã­tem (hace PUT /api/inventory/:id_producto) */
  saveEdit(item: InventoryItem): void {
    if (
      this.editQuantity === null ||
      this.editQuantity < 0 ||
      isNaN(this.editQuantity)
    ) {
      Swal.fire('Error', 'La cantidad debe ser un nÃºmero vÃ¡lido â‰¥ 0.', 'error');
      return;
    }

    this.inventoryService
      .updateInventory(item.id_producto, this.editQuantity)
      .subscribe({
        next: () => {
          // Actualiza localmente para reflejar el cambio
          item.cantidad_disponible = this.editQuantity!;
          this.editId = null;
          this.editQuantity = null;
          Swal.fire(
            'Ã‰xito',
            'Cantidad actualizada correctamente.',
            'success'
          );
        },
        error: (err) => {
          console.error('Error actualizando inventario:', err);
          Swal.fire(
            'Error',
            'No se pudo actualizar la cantidad de inventario.',
            'error'
          );
        }
      });
  }
}

