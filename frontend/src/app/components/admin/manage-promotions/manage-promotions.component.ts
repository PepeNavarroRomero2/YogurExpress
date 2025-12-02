// frontend/src/app/components/admin/manage-promotions/manage-promotions.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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
  showForm = false;
  isEditing = false;
  editingPromotionId: number | null = null;

  // Modelo del formulario (aquÃ­ descuento en porcentaje, no en fracciÃ³n)
  promoModel: { codigo: string; descripcion: string; descuento: number } = {
    codigo: '',
    descripcion: '',
    descuento: 0,
  };

  constructor(private promotionService: PromotionService) {}

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.promotionService.getPromotions().subscribe({
      next: (data: Promotion[]) => (this.promotions = data),
      error: (err: any) => {
        console.error('Error cargando promociones', err);
        Swal.fire('Error', 'No se pudieron cargar las promociones', 'error');
      },
    });
  }

  onCreate(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingPromotionId = null;
    this.promoModel = { codigo: '', descripcion: '', descuento: 0 };
  }

  onEdit(p: Promotion): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingPromotionId = p.id_promocion;
    // Convertimos la fracciÃ³n a porcentaje para el formulario
    this.promoModel = {
      codigo: p.codigo,
      descripcion: p.descripcion || '',
      descuento: Math.round(p.descuento * 100),
    };
  }

  /** Crea el objeto que el backend espera, con 'descuento' como fracciÃ³n */
  private toDto() {
    return {
      codigo: this.promoModel.codigo.trim(),
      descripcion: this.promoModel.descripcion.trim(),
      descuento: this.promoModel.descuento / 100,
    };
  }

  onSave(form: NgForm): void {
    if (form.invalid) return;

    const dto = this.toDto();

    if (this.isEditing && this.editingPromotionId != null) {
      this.promotionService.updatePromotion(this.editingPromotionId, dto).subscribe({
        next: () => {
          Swal.fire('Actualizado', 'PromociÃ³n actualizada', 'success');
          this.onCancel();
          this.loadPromotions();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar la promociÃ³n', 'error');
        },
      });
    } else {
      this.promotionService.createPromotion(dto).subscribe({
        next: () => {
          Swal.fire('Ã‰xito', 'PromociÃ³n creada', 'success');
          this.onCancel();
          this.loadPromotions();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo crear la promociÃ³n', 'error');
        },
      });
    }
  }

  onDelete(id: number): void {
    Swal.fire({
      title: 'Â¿Eliminar esta promociÃ³n?',
      text: 'Esta acciÃ³n no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.promotionService.deletePromotion(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'PromociÃ³n eliminada', 'success');
            this.loadPromotions();
          },
          error: (err: any) => {
            console.error('Error eliminando promociÃ³n', err);
            Swal.fire('Error', 'No se pudo eliminar la promociÃ³n', 'error');
          },
        });
      }
    });
  }

  onCancel(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingPromotionId = null;
  }
}

