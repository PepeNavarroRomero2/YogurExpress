import { Component }    from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import Swal             from 'sweetalert2';

interface Promotion {
  id: number;
  code: string;
  discount: number;
}

@Component({
  selector: 'app-manage-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-promotions.component.html',
  styleUrls: ['./manage-promotions.component.scss']
})
export class ManagePromotionsComponent {
  promotions: Promotion[] = [];
  nextId = 1;

  // Form
  showForm = false;
  editingId: number | null = null;
  newPromotion: Promotion = this.resetPromo();

  private resetPromo(): Promotion {
    return { id:0, code:'', discount:0 };
  }

  onCreate() {
    this.editingId = null;
    this.newPromotion = this.resetPromo();
    this.showForm = true;
  }

  onEdit(p: Promotion) {
    this.editingId = p.id;
    this.newPromotion = { ...p };
    this.showForm = true;
  }

  onDelete(id: number) {
    if (!confirm('¿Eliminar esta promoción?')) return;
    this.promotions = this.promotions.filter(p => p.id !== id);
    Swal.fire('Eliminada','Promoción borrada','info');
  }

  onSave() {
    if (!this.newPromotion.code || this.newPromotion.discount <= 0) {
      Swal.fire('Error','Código y descuento válidos','error');
      return;
    }

    if (this.editingId != null) {
      this.promotions = this.promotions.map(p =>
        p.id === this.editingId ? { ...this.newPromotion, id: p.id } : p
      );
      Swal.fire('Actualizada','Promoción modificada','success');
    } else {
      const promo = { ...this.newPromotion, id: this.nextId++ };
      this.promotions.push(promo);
      Swal.fire('Creada','Promoción añadida','success');
    }

    this.showForm = false;
  }

  onCancel() {
    this.newPromotion = this.resetPromo();
    this.showForm = false;
  }
}
