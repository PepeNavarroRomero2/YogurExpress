// src/app/components/admin/manage-products/manage-products.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import Swal from 'sweetalert2';

import { ProductoService, Producto } from '../../../services/producto.service';

@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.scss'],
})
export class ManageProductsComponent implements OnInit {
  products: Producto[] = [];

  showForm: boolean = false;
  isEditing: boolean = false;
  editingProductId: number | null = null;

  // Modelo de formulario
  product: {
    nombre: string;
    tipo: 'sabor' | 'topping' | 'tamanos';
    precio: number;
    descripcion?: string;
    alergenos?: string;
    imagen_url?: string;
  } = {
    nombre: '',
    tipo: 'sabor',
    precio: 0,
    descripcion: '',
    alergenos: '',
    imagen_url: ''
  };

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  /** 1. Carga todos los productos desde el backend */
  loadProducts(): void {
    this.productoService.getProductos().subscribe({
      next: (data: Producto[]) => {
        this.products = data;
      },
      error: (err) => {
        console.error('Error cargando productos', err);
        Swal.fire('Error', 'No se pudieron cargar los productos.', 'error');
      },
    });
  }

  /** 2. Abre el formulario en modo “crear”. */
  onCreate(): void {
    this.showForm = true;
    this.isEditing = false;
    this.editingProductId = null;
    this.product = {
      nombre: '',
      tipo: 'sabor',
      precio: 0,
      descripcion: '',
      alergenos: '',
      imagen_url: ''
    };
  }

  /** 3. Abre el formulario con datos para editar. */
  onEdit(p: Producto): void {
    this.showForm = true;
    this.isEditing = true;
    this.editingProductId = p.id_producto;
    this.product = {
      nombre: p.nombre,
      tipo: p.tipo,
      precio: p.precio,
      descripcion: p.descripcion || '',
      alergenos: p.alergenos || '',
      imagen_url: p.imagen_url || ''
    };
  }

  /** 4. Cancela creación/edición. */
  onCancel(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingProductId = null;
  }

  /** 5. Guarda: crea o actualiza según el modo. */
  onSave(form: any): void {
    if (form.invalid) {
      Swal.fire('Error', 'Por favor, rellena todos los campos obligatorios.', 'error');
      return;
    }

    if (this.isEditing && this.editingProductId != null) {
      // MODO EDICIÓN
      this.productoService.updateProducto(this.editingProductId, {
        nombre: this.product.nombre,
        tipo: this.product.tipo,
        precio: this.product.precio,
        descripcion: this.product.descripcion,
        alergenos: this.product.alergenos,
        imagen_url: this.product.imagen_url
      }).subscribe({
        next: () => {
          Swal.fire('Editado', 'Producto actualizado correctamente.', 'success');
          this.loadProducts();
          this.onCancel();
        },
        error: (err) => {
          console.error('Error actualizando producto', err);
          Swal.fire('Error', 'No se pudo actualizar el producto.', 'error');
        }
      });
    } else {
      // MODO CREACIÓN
      this.productoService.createProducto({
        nombre: this.product.nombre,
        tipo: this.product.tipo,
        precio: this.product.precio,
        descripcion: this.product.descripcion,
        alergenos: this.product.alergenos,
        imagen_url: this.product.imagen_url
      }).subscribe({
        next: () => {
          Swal.fire('Creado', 'Producto creado correctamente.', 'success');
          this.loadProducts();
          this.onCancel();
        },
        error: (err) => {
          console.error('Error creando producto', err);
          Swal.fire('Error', 'No se pudo crear el producto.', 'error');
        }
      });
    }
  }

  /** 6. Elimina un producto. */
  onDelete(id: number): void {
    Swal.fire({
      title: '¿Estás seguro de eliminar este producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.productoService.deleteProducto(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Producto eliminado.', 'success');
            this.loadProducts();
          },
          error: (err) => {
            console.error('Error eliminando producto', err);
            Swal.fire('Error', 'No se pudo eliminar el producto.', 'error');
          },
        });
      }
    });
  }
}
