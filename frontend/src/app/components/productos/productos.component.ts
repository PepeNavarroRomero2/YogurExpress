import { Component } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductoService, Producto } from '../../services/producto.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.css']
})
export class ProductosComponent {
  productos: Producto[] = [];

  constructor(private productoService: ProductoService) {
    this.productoService.getProductos().subscribe(data => {
      this.productos = data;
    });
  }
}

