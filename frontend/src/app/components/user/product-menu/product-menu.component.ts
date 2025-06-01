import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, Flavor } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { PointsService } from '../../../services/points.service';
import { OrderHistoryComponent } from '../order-history/order-history.component';

@Component({
  selector: 'app-product-menu',
  standalone: true,
  imports: [CommonModule, OrderHistoryComponent],
  templateUrl: './product-menu.component.html',
  styleUrls: ['./product-menu.component.scss']
})
export class ProductMenuComponent implements OnInit {
  flavors: Flavor[] = [];
  showHistory = false;
  currentPoints = 0;

  constructor(
    private productSvc: ProductService,
    private cartSvc: CartService,
    private ptsSvc: PointsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.flavors = this.productSvc.getFlavors();
    this.cartSvc.clear();
    this.refreshPoints();
  }

  selectFlavor(flavor: Flavor) {
    this.cartSvc.setFlavor(flavor);
    this.router.navigate(['/user/personalize']);
  }

  toggleHistory() {
    this.showHistory = !this.showHistory;
    this.refreshPoints();
  }

  /** Navega a la pantalla de canje de puntos */
  goToPoints() {
    this.router.navigate(['/user/points']);
  }

  private refreshPoints() {
    this.currentPoints = this.ptsSvc.getPoints();
  }
}
