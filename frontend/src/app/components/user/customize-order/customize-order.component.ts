import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, Topping, SizeOption } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-customize-order',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customize-order.component.html',
  styleUrls: ['./customize-order.component.scss']
})
export class CustomizeOrderComponent implements OnInit {
  flavorName = '';
  flavorPrice = 0;
  toppings: Topping[] = [];
  sizes: SizeOption[] = [];
  selectedToppings: Topping[] = [];
  selectedSize?: SizeOption;
  total = 0;

  constructor(
    private productSvc: ProductService,
    private cartSvc: CartService,
    private router: Router
  ) {}

  ngOnInit() {
    const flavor = this.cartSvc.getFlavor();
    if (!flavor) {
      this.router.navigate(['/user/menu']);
      return;
    }
    // INICIALIZACIÓN
    this.flavorName = flavor.name;
    this.flavorPrice = flavor.price;
    this.toppings = this.productSvc.getToppings();
    this.sizes    = this.productSvc.getSizes();
    this.selectedToppings = this.cartSvc.getToppings();
    this.selectedSize     = this.cartSvc.getSize();
    this.updateTotal();
  }

  /** toggle en servicio y actualiza estado local */
  toggleTopping(t: Topping) {
    this.cartSvc.toggleTopping(t);
    this.selectedToppings = this.cartSvc.getToppings();
    this.updateTotal();
  }

  selectSize(s: SizeOption) {
    this.cartSvc.setSize(s);
    this.selectedSize = s;
    this.updateTotal();
  }

  updateTotal() {
    this.total = this.cartSvc.getTotal();
  }

  /** Comprueba si un topping está seleccionado */
  isSelectedTopping(t: Topping): boolean {
    return this.selectedToppings.some(st => st.id === t.id);
  }

  next() {
    this.router.navigate(['/user/pickup']);
  }
}
