// frontend/src/app/components/user/product-menu/product-menu.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';    // ← para NgIf, NgFor
import { RouterModule, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ProductService, Flavor } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-product-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './product-menu.component.html',
  styleUrls: ['./product-menu.component.scss']
})
export class ProductMenuComponent implements OnInit {
  sabores: Flavor[] = [];
  errorMsg: string = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/user/login']);
      return;
    }
    this.loadFlavors();
  }

  loadFlavors() {
    this.productService.getFlavors().subscribe({
      next: data => {
        this.sabores = data;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar los sabores';
      }
    });
  }

  viewFlavorInfo(flavor: Flavor) {
    this.cartService.setFlavor(flavor);
    this.router.navigate(['/user/personalize']);
  }

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
        this.authService.logout();
        this.cartService.clear();
        Swal.fire('Desconectado', 'Has cerrado sesión.', 'success');
      }
    });
  }
}
