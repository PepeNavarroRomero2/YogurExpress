// frontend/src/app/components/admin/manage-promotions/manage-promotions.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromotionService, Promotion } from '../../../services/promotion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-promotions.component.html',
  styleUrls: ['./manage-promotions.component.scss'],
})
export class ManagePromotionsComponent implements OnInit {
  promotions: Promotion[] = [];
  showForm: boolean = false;
  isEditing: boolean = false;
  editingPromotionId: number | null = null;

  // Modelo temporal para el formulario
  promotion: { codigo: string; descuento: number } = {
    codigo: '',
    descuento: 0,
  };

  constructor(private promotionService: PromotionService) {}

  ngOnInit(): void {
    this.loadPromotions();
  }

  /** Carga todas las promociones */
  loadPromotions(): void {
    this.promotionService.getPromotions().subscribe({
      next: (data: Promotion[]) => {
        this.promotions = data;
      },
      error: (err) => {
        console.error('Error cargando promociones', err);
        Swal.fire('Error', 'No se pudieron cargar las promociones.', 'error');
      },
    });
  }

  /** Mostrar formulario en modo “crear” */
  onCreate(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingPromotionId = null;
    this.promotion = { codigo: '', descuento: 0 };
  }

  /** Mostrar formulario en modo “editar” */
  onEdit(p: Promotion): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingPromotionId = p.id_promocion;
    this.promotion = { codigo: p.codigo, descuento: p.descuento };
  }

  /** Cancelar creación/edición */
  onCancel(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingPromotionId = null;
  }

  /** Guardar (crear o actualizar) */
  onSave(form: any): void {
    if (form.invalid) {
      Swal.fire('Error', 'Rellena todos los campos.', 'error');
      return;
    }

    if (this.isEditing && this.editingPromotionId != null) {
      // Editar promoción
      this.promotionService.updatePromotion(this.editingPromotionId, this.promotion).subscribe({
        next: () => {
          Swal.fire('Editado', 'Promoción actualizada.', 'success');
          this.loadPromotions();
          this.onCancel();
        },
        error: (err) => {
          console.error('Error actualizando promoción', err);
          Swal.fire('Error', 'No se pudo actualizar la promoción.', 'error');
        },
      });
    } else {
      // Crear nueva promoción
      this.promotionService.createPromotion(this.promotion).subscribe({
        next: () => {
          Swal.fire('Creado', 'Promoción creada.', 'success');
          this.loadPromotions();
          this.onCancel();
        },
        error: (err) => {
          console.error('Error creando promoción', err);
          Swal.fire('Error', 'No se pudo crear la promoción.', 'error');
        },
      });
    }
  }

  /** Eliminar una promoción */
  onDelete(id: number): void {
    Swal.fire({
      title: '¿Eliminar promoción?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.promotionService.deletePromotion(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Promoción eliminada.', 'success');
            this.loadPromotions();
          },
          error: (err) => {
            console.error('Error eliminando promoción', err);
            Swal.fire('Error', 'No se pudo eliminar la promoción.', 'error');
          },
        });
      }
    });
  }
}
