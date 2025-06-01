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
  flavor!: Flavor;
  toppings: Flavor[] = [];
  sizes: Flavor[] = [];

  selectedToppings: Flavor[] = [];
  selectedSize?: Flavor;

  errorMsg: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const saved = this.cartService.getFlavor();
    if (!saved) {
      this.router.navigate(['/user/menu']);
      return;
    }
    this.flavor = saved;

    this.productService.getToppings().subscribe({
      next: data => this.toppings = data,
      error: () => this.errorMsg = 'No se pudieron cargar los toppings'
    });
    this.productService.getSizes().subscribe({
      next: data => this.sizes = data,
      error: () => this.errorMsg = 'No se pudieron cargar los tamaños'
    });
  }

  toggleTopping(t: Flavor) {
    const idx = this.selectedToppings.findIndex(x => x.id_producto === t.id_producto);
    if (idx > -1) {
      this.selectedToppings.splice(idx, 1);
    } else {
      this.selectedToppings.push(t);
    }
  }

  selectSize(s: Flavor) {
    this.selectedSize = s;
  }

  // ← Estas dos funciones DEBEN estar dentro de la clase:
  isToppingSelected(t: Flavor): boolean {
    return this.selectedToppings.some(x => x.id_producto === t.id_producto);
  }

  isSizeSelected(s: Flavor): boolean {
    return this.selectedSize?.id_producto === s.id_producto;
  }

  addToCart() {
    if (!this.selectedSize) {
      Swal.fire('Error', 'Debes seleccionar un tamaño antes de continuar.', 'error');
      return;
    }
    this.cartService.setToppings(this.selectedToppings);
    this.cartService.setSize(this.selectedSize);
    this.router.navigate(['/user/pickup']);
  }
}
