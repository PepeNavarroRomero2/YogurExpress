import { Component }    from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm }  from '@angular/forms';
import Swal             from 'sweetalert2';

interface Product {
  id: number;
  name: string;
  type: string;
  price: number;
  image: File | null;
  imagePreview: string | null;
}

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.scss']
})
export class ManageProductsComponent {
  products: Product[] = [];
  nextId = 1;

  // Form state
  showForm = false;
  editingId: number | null = null;
  product: Product = this.resetProduct();

  types = ['Flavor','Topping','Other'];

  private resetProduct(): Product {
    return { id: 0, name:'', type:'', price:0, image:null, imagePreview:null };
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.product.image = file;
    const reader = new FileReader();
    reader.onload = () => this.product.imagePreview = reader.result as string;
    reader.readAsDataURL(file);
  }

  onCreate() {
    this.editingId = null;
    this.product = this.resetProduct();
    this.showForm = true;
  }

  onEdit(p: Product) {
    this.editingId = p.id;
    this.product = { ...p };          // copia los datos
    this.showForm = true;
  }

  onDelete(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    this.products = this.products.filter(p => p.id !== id);
    Swal.fire('Eliminado','Producto borrado','info');
  }

  onSave(form: NgForm) {
    if (form.invalid) return;

    if (this.editingId != null) {
      // editar
      this.products = this.products.map(p =>
        p.id === this.editingId ? { ...this.product, id: p.id } : p
      );
      Swal.fire('Actualizado','Producto modificado','success');
    } else {
      // crear
      const newProduct = { ...this.product, id: this.nextId++ };
      this.products.push(newProduct);
      Swal.fire('Guardado','Producto añadido','success');
    }

    form.resetForm(this.resetProduct());
    this.showForm = false;
  }

  onCancel(form: NgForm) {
    form.resetForm(this.resetProduct());
    this.showForm = false;
  }
}
