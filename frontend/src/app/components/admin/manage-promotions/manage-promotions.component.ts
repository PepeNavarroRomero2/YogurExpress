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

  // Modelo del formulario
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
      next: (data: Promotion[]) => this.promotions = data,
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
    this.promoModel = {
      codigo: p.codigo,
      descripcion: p.descripcion || '',
      descuento: p.descuento,
    };
  }

  onSave(form: NgForm): void {
    if (form.invalid) return;

    if (this.isEditing && this.editingPromotionId != null) {
      this.promotionService.updatePromotion(this.editingPromotionId, this.promoModel).subscribe({
        next: () => {
          Swal.fire('Actualizado', 'Promoción actualizada', 'success');
          this.onCancel();
          this.loadPromotions();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo actualizar la promoción', 'error');
        },
      });
    } else {
      this.promotionService.createPromotion(this.promoModel).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Promoción creada', 'success');
          this.onCancel();
          this.loadPromotions();
        },
        error: () => {
          Swal.fire('Error', 'No se pudo crear la promoción', 'error');
        },
      });
    }
  }

  onDelete(id: number): void {
    Swal.fire({
      title: '¿Eliminar esta promoción?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed) {
        this.promotionService.deletePromotion(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Promoción eliminada', 'success');
            this.loadPromotions();
          },
          error: (err: any) => {
            console.error('Error eliminando promoción', err);
            Swal.fire('Error', 'No se pudo eliminar la promoción', 'error');
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
