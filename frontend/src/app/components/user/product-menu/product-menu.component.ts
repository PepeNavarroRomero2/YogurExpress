import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { ProductoService, Producto } from '../../../services/producto.service';
import { CartService } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ScheduleService } from '../../../services/schedule.service';
import { StoreClosedOverlayComponent } from '../../shared/store-closed-overlay/store-closed-overlay/store-closed-overlay.component';

@Component({
  selector: 'app-product-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, StoreClosedOverlayComponent],
  templateUrl: './product-menu.component.html',
  styleUrls: ['./product-menu.component.scss']
})
export class ProductMenuComponent implements OnInit, OnDestroy {
  flavors: Producto[] = [];
  loading = true;
  errorMsg = '';
  isOpen = true;

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private productService: ProductoService,
    private cartService: CartService,
    private authService: AuthService,
    private schedule: ScheduleService
  ) {}

  ngOnInit(): void {
    // Traer horario y observar estado de apertura
    this.schedule.fetch();
    this.subs.push(this.schedule.isOpen$.subscribe(v => (this.isOpen = v)));

    // Cargar sabores
    this.productService.getSabores().subscribe({
      next: (list) => {
        this.flavors = list || [];
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar los productos.';
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onSelectFlavor(flavor: Producto): void {
    if (!this.isOpen) {
      Swal.fire('Estamos cerrados', 'Vuelve dentro del horario para poder pedir.', 'info');
      return;
    }
    this.cartService.setFlavor(flavor);
    // Ruta correcta segÃºn tu routing (user-routing.module.ts)
    this.router.navigate(['/user/personalize']);
  }

  goToHistory(): void { this.router.navigate(['/user/history']); }
  goToPoints(): void { this.router.navigate(['/user/points']); }

  logout(): void {
    Swal.fire({
      title: 'Â¿Cerrar sesiÃ³n?',
      text: 'Se limpiarÃ¡ tu carrito.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÃ­, cerrar sesiÃ³n',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.cartService.clear();
        Swal.fire('Desconectado', 'Has cerrado sesiÃ³n.', 'success');
        this.router.navigate(['/user/login']);
      }
    });
  }
}

