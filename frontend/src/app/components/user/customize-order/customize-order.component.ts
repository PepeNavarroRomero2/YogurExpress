// frontend/src/app/components/user/customize-order/customize-order.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Flavor, ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import Swal from 'sweetalert2';

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
  // Arrays de toppings y tamaños
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

  /** Añade o quita un topping del array */
  toggleTopping(t: Flavor) {
    const idx = this.selectedToppings.findIndex(x => x.id_producto === t.id_producto);
    if (idx > -1) {
      this.selectedToppings.splice(idx, 1);
    } else {
      this.selectedToppings.push(t);
    }
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
    this.cartService.setToppings(this.selectedToppings);
    this.cartService.setSize(this.selectedSize);
    // Navegamos a la siguiente pantalla (Pickup / Select Time)
    this.router.navigate(['/user/pickup']);
  }
}
