// src/app/components/user/customize-order/customize-order.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';

import { Producto, ProductoService } from '../../../services/producto.service';
import { CartService } from '../../../services/cart.service';
import { InventoryService, InventoryItem } from '../../../services/inventory.service';

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
  // Producto seleccionado previamente (sabor)
  flavor!: Producto & { cantidad_disponible: number };

  // Listas cargadas desde el backend + cantidad disponible
  toppings: (Producto & { cantidad_disponible: number })[] = [];
  sizes: (Producto & { cantidad_disponible: number })[] = [];

  // Selecciones del usuario
  selectedToppings: (Producto & { cantidad_disponible: number })[] = [];
  selectedSize?: Producto & { cantidad_disponible: number };

  // Mensaje de error si no carga toppings/tamaÃ±os
  errorMsg: string = '';

  // Mapa temporal { id_producto â†’ cantidad_disponible } para acceso rÃ¡pido
  private invMap = new Map<number, number>();

  constructor(
    private location: Location,
    private productService: ProductoService,
    private cartService: CartService,
    private inventoryService: InventoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 1) recuperar el sabor base guardado en CartService
    const saved = this.cartService.getFlavor();
    if (!saved) {
      // Si no hay sabor guardado, volvemos al menÃº de sabores
      this.router.navigate(['/user/menu']);
      return;
    }
    // Asignamos el flavor con cantidad_disponible=0 (se actualizarÃ¡ luego)
    this.flavor = { ...saved, cantidad_disponible: 0 };

    // 2) cargamos todo el inventario
    this.inventoryService.getInventory().subscribe({
      next: (invList: InventoryItem[]) => {
        invList.forEach(it => this.invMap.set(it.id_producto, it.cantidad_disponible));
        // Ahora podemos asignar cantidad_disponible al flavor
        const qty = this.invMap.get(this.flavor.id_producto) ?? 0;
        this.flavor.cantidad_disponible = qty;

        // 3) cargamos toppings y aplicamos cantidad_disponible
        this.productService.getToppings().subscribe({
          next: (tops: Producto[]) => {
            this.toppings = tops.map(t => ({
              ...t,
              cantidad_disponible: this.invMap.get(t.id_producto) ?? 0
            }));
          },
          error: () => {
            this.errorMsg = 'No se pudieron cargar los toppings.';
            this.toppings = [];
          }
        });

        // 4) cargamos tamaÃ±os y aplicamos cantidad_disponible
        this.productService.getTamanos().subscribe({
          next: (sz: Producto[]) => {
            this.sizes = sz.map(s => ({
              ...s,
              cantidad_disponible: this.invMap.get(s.id_producto) ?? 0
            }));
            // Preseleccionar el primer tamaÃ±o disponible (si existe)
            const primerDisp = this.sizes.find(s => s.cantidad_disponible > 0);
            if (primerDisp) {
              this.selectedSize = primerDisp;
            }
          },
          error: () => {
            this.errorMsg = 'No se pudieron cargar los tamaÃ±os.';
            this.sizes = [];
          }
        });

      },
      error: (err) => {
        console.error('Error cargando inventario:', err);
        this.errorMsg = 'No se pudo cargar inventario.';
        // Aunque falle inventario, intentamos cargar toppings y tamaÃ±os con qty=0
        this.productService.getToppings().subscribe();
        this.productService.getTamanos().subscribe();
      }
    });
  }

  /** Navegar a la vista anterior */
  goBack(): void {
    this.location.back();
  }

  /** Abre un SweetAlert2 para seleccionar toppings con checkboxes */
  selectToppings(): void {
    let html = '<div style="text-align:left;">';
    this.toppings.forEach(t => {
      html += `
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
    html += '</div>';

    Swal.fire({
      title: 'Seleccionar Toppings',
      html: html,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      preConfirm: () => {
        const checkedBoxes = Array.from(
          document.querySelectorAll('input[name="topping"]:checked')
        ) as HTMLInputElement[];
        return checkedBoxes.map(cb => Number(cb.value));
      }
    }).then(result => {
      if (result.isConfirmed && Array.isArray(result.value)) {
        const selectedIds: number[] = result.value as number[];
        this.selectedToppings = this.toppings.filter(t => selectedIds.includes(t.id_producto));
      }
    });
  }

  /** Selecciona un tamaÃ±o (solo si hay stock) */
  selectSize(s: Producto & { cantidad_disponible: number }): void {
    if (s.cantidad_disponible > 0) {
      this.selectedSize = s;
    }
  }

  /** Alterna la selecciÃ³n de un topping (solo si hay stock) */
  toggleToppingSelection(t: Producto & { cantidad_disponible: number }): void {
    if (t.cantidad_disponible <= 0) {
      return;
    }
    const idx = this.selectedToppings.findIndex(x => x.id_producto === t.id_producto);
    if (idx >= 0) {
      this.selectedToppings.splice(idx, 1);
    } else {
      this.selectedToppings.push(t);
    }
  }

  /** Indica si un topping ya estÃ¡ en selectedToppings */
  isToppingSelected(t: Producto & { cantidad_disponible: number }): boolean {
    return this.selectedToppings.some(x => x.id_producto === t.id_producto);
  }

  /** Indica si ese tamaÃ±o es el seleccionado */
  isSizeSelected(s: Producto & { cantidad_disponible: number }): boolean {
    return this.selectedSize?.id_producto === s.id_producto;
  }

  /**
   * Al hacer clic en "Agregar al pedido":
   *  - Verifica stock de flavor, tamaÃ±o y toppings seleccionados.
   *  - Guarda en CartService (sabores, toppings, tamaÃ±o).
   *  - Redirige a /user/pickup
   */
  addToCart(): void {
    // 1) verificar flavor (sabor)
    if (!this.flavor || this.flavor.cantidad_disponible <= 0) {
      Swal.fire('Error', 'El sabor seleccionado estÃ¡ agotado.', 'error');
      return;
    }

    // 2) verificar size (tamaÃ±o)
    if (!this.selectedSize || this.selectedSize.cantidad_disponible <= 0) {
      Swal.fire('Error', 'Debes seleccionar un tamaÃ±o disponible.', 'error');
      return;
    }

    // 3) verificar toppings seleccionados
    for (const top of this.selectedToppings) {
      if (top.cantidad_disponible <= 0) {
        Swal.fire('Error', `El topping "${top.nombre}" estÃ¡ agotado.`, 'error');
        return;
      }
    }

    // 4) todo ok, guardamos en CartService
    this.cartService.setFlavor({ 
      id_producto: this.flavor.id_producto,
      nombre: this.flavor.nombre,
      tipo: this.flavor.tipo,
      precio: this.flavor.precio,
      descripcion: this.flavor.descripcion,
      alergenos: this.flavor.alergenos,
      imagen_url: this.flavor.imagen_url
    });
    // toppings (incluye tipo)
    this.cartService.setToppings(this.selectedToppings.map(t => ({
      id_producto: t.id_producto,
      nombre: t.nombre,
      tipo: t.tipo,
      precio: t.precio,
      descripcion: t.descripcion,
      alergenos: t.alergenos,
      imagen_url: t.imagen_url
    })));
    // tamaÃ±o (incluye tipo)
    this.cartService.setSize({ 
      id_producto: this.selectedSize.id_producto,
      nombre: this.selectedSize.nombre,
      tipo: this.selectedSize.tipo,
      precio: this.selectedSize.precio,
      descripcion: this.selectedSize.descripcion,
      alergenos: this.selectedSize.alergenos,
      imagen_url: this.selectedSize.imagen_url
    });

    // 5) navegamos a pantalla de recogida (pickup)
    this.router.navigate(['/user/pickup']);
  }

  /** Redirecciones de botones inferiores (Historial, Mis Puntos, Cerrar SesiÃ³n) */
  goToHistory(): void {
    this.router.navigate(['/user/history']);
  }

  goToPoints(): void {
    this.router.navigate(['/user/points']);
  }

  logout(): void {
    Swal.fire({
      title: 'Â¿Cerrar sesiÃ³n?',
      text: 'Se borrarÃ¡ tu sesiÃ³n actual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÃ­, cerrar sesiÃ³n',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.cartService.clear();
        this.router.navigate(['/user/login']);
      }
    });
  }
}

