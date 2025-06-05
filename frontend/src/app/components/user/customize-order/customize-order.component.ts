// frontend/src/app/components/user/customize-order/customize-order.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Flavor, ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-customize-order',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './customize-order.component.html',
  styleUrls: ['./customize-order.component.scss']
})
export class CustomizeOrderComponent implements OnInit {
  // El sabor base que llegó desde el menú
  flavor!: Flavor;
  // Arrays de toppings y tamaños (cargados desde la API)
  toppings: Flavor[] = [];
  sizes: Flavor[] = [];

  // Lo que el usuario ha seleccionado
  selectedToppings: Flavor[] = [];
  selectedSize?: Flavor;

  // Mensaje de error general (por si falla la carga de toppings o tamaños)
  errorMsg: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Recuperamos el sabor guardado en el carrito; si no existe, volvemos al menú
    const saved = this.cartService.getFlavor();
    if (!saved) {
      this.router.navigate(['/user/menu']);
      return;
    }
    this.flavor = saved;

    // Cargamos toppings y tamaños desde el servicio
    this.productService.getToppings().subscribe({
      next: data => this.toppings = data,
      error: () => this.errorMsg = 'No se pudieron cargar los toppings'
    });
    this.productService.getSizes().subscribe({
      next: data => this.sizes = data,
      error: () => this.errorMsg = 'No se pudieron cargar los tamaños'
    });
  }

  /**
   * Abre un diálogo de SweetAlert2 con checkboxes generados
   * dinámicamente para cada topping, de modo que se vean correctamente.
   */
  selectToppings() {
    // Generamos un bloque HTML con checkbox por cada topping
    let htmlCheckboxes = '<div style="text-align:left;">';
    this.toppings.forEach(t => {
      // Cada checkbox lleva un id único: topping-<id_producto>
      htmlCheckboxes += `
        <div style="margin-bottom: 0.5rem;">
          <input type="checkbox"
                 id="topping-${t.id_producto}"
                 name="topping"
                 value="${t.id_producto}"
                 style="margin-right: 0.5rem;" 
                 ${this.isToppingSelected(t) ? 'checked' : ''} />
          <label for="topping-${t.id_producto}" style="cursor: pointer;">
            ${t.nombre}
          </label>
        </div>
      `;
    });
    htmlCheckboxes += '</div>';

    Swal.fire({
      title: 'Seleccionar Toppings',
      html: htmlCheckboxes,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        // Recogemos todos los checkboxes marcados y devolvemos sus IDs
        const checkedBoxes = Array.from(
          document.querySelectorAll('input[name="topping"]:checked')
        ) as HTMLInputElement[];
        const selectedIds = checkedBoxes.map(cb => Number(cb.value));
        return selectedIds;
      }
    }).then(result => {
      if (result.isConfirmed && Array.isArray(result.value)) {
        const selectedIds: number[] = result.value as number[];
        // Filtramos el array this.toppings para obtener los objetos seleccionados
        this.selectedToppings = this.toppings.filter(t => selectedIds.includes(t.id_producto));
      }
    });
  }

  /** Marca un tamaño como seleccionado (solo uno) */
  selectSize(s: Flavor) {
    this.selectedSize = s;
  }

  /** Devuelve true si ese topping ya está en selectedToppings */
  isToppingSelected(t: Flavor): boolean {
    return this.selectedToppings.some(x => x.id_producto === t.id_producto);
  }

  /** Devuelve true si ese tamaño coincide con selectedSize */
  isSizeSelected(s: Flavor): boolean {
    return this.selectedSize?.id_producto === s.id_producto;
  }

  /** Al hacer clic en “Agregar al pedido” */
  addToCart() {
    if (!this.selectedSize) {
      Swal.fire('Error', 'Debes seleccionar un tamaño antes de continuar.', 'error');
      return;
    }
    // Guardamos en el CartService lo seleccionado
    this.cartService.setFlavor(this.flavor);
    this.cartService.setToppings(this.selectedToppings);
    this.cartService.setSize(this.selectedSize);
    // Navegamos a la siguiente pantalla (Pickup / Select Time)
    this.router.navigate(['/user/pickup']);
  }

  /** Botones inferiores: mantienen su funcionalidad original */
  goToHistory() {
    this.router.navigate(['/user/history']);
  }

  goToPoints() {
    this.router.navigate(['/user/points']);
  }

  logout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Se borrará tu sesión actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.cartService.clear();
        this.router.navigate(['/user/login']);
      }
    });
  }
}
