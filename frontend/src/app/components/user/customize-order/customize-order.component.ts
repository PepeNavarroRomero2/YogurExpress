// src/app/components/user/customize-order/customize-order.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';

import { Flavor, ProductService } from '../../../services/product.service';
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
  // Flavor seleccionado previamente (sabor)
  flavor!: Flavor & { cantidad_disponible: number };

  // Listas cargadas desde el backend + cantidad disponible
  toppings: (Flavor & { cantidad_disponible: number })[] = [];
  sizes: (Flavor & { cantidad_disponible: number })[] = [];

  // Selecciones del usuario
  selectedToppings: (Flavor & { cantidad_disponible: number })[] = [];
  selectedSize?: Flavor & { cantidad_disponible: number };

  // Mensaje de error si no carga toppings/tamaños
  errorMsg: string = '';

  // Mapa temporal { id_producto → cantidad_disponible } para acceso rápido
  private invMap = new Map<number, number>();

  constructor(
    private location: Location,
    private productService: ProductService,
    private cartService: CartService,
    private inventoryService: InventoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // 1) recuperar el sabor base guardado en CartService
    const saved = this.cartService.getFlavor();
    if (!saved) {
      // Si no hay sabor guardado, volvemos al menú de sabores
      this.router.navigate(['/user/menu']);
      return;
    }
    // Asignamos el flavor con cantidad_disponible=0 (se actualizará luego)
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
          next: (tops: Flavor[]) => {
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

        // 4) cargamos tamaños y aplicamos cantidad_disponible
        this.productService.getSizes().subscribe({
          next: (sz: Flavor[]) => {
            this.sizes = sz.map(s => ({
              ...s,
              cantidad_disponible: this.invMap.get(s.id_producto) ?? 0
            }));
            // Preseleccionar el primer tamaño disponible (si existe)
            const primerDisp = this.sizes.find(s => s.cantidad_disponible > 0);
            if (primerDisp) {
              this.selectedSize = primerDisp;
            }
          },
          error: () => {
            this.errorMsg = 'No se pudieron cargar los tamaños.';
            this.sizes = [];
          }
        });

      },
      error: (err) => {
        console.error('Error cargando inventario:', err);
        this.errorMsg = 'No se pudo cargar inventario.';
        // Aunque falle inventario, intentamos cargar toppings y tamaños con qty=0
        this.productService.getToppings().subscribe();
        this.productService.getSizes().subscribe();
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

  /** Selecciona un tamaño (solo si hay stock) */
  selectSize(s: Flavor & { cantidad_disponible: number }): void {
    if (s.cantidad_disponible > 0) {
      this.selectedSize = s;
    }
  }

  /** Alterna la selección de un topping (solo si hay stock) */
  toggleToppingSelection(t: Flavor & { cantidad_disponible: number }): void {
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

  /** Indica si un topping ya está en selectedToppings */
  isToppingSelected(t: Flavor & { cantidad_disponible: number }): boolean {
    return this.selectedToppings.some(x => x.id_producto === t.id_producto);
  }

  /** Indica si ese tamaño es el seleccionado */
  isSizeSelected(s: Flavor & { cantidad_disponible: number }): boolean {
    return this.selectedSize?.id_producto === s.id_producto;
  }

  /**
   * Al hacer clic en "Agregar al pedido":
   *  - Verifica stock de flavor, tamaño y toppings seleccionados.
   *  - Guarda en CartService (sabores, toppings, tamaño).
   *  - Redirige a /user/pickup
   */
  addToCart(): void {
    // 1) verificar flavor (sabor)
    if (!this.flavor || this.flavor.cantidad_disponible <= 0) {
      Swal.fire('Error', 'El sabor seleccionado está agotado.', 'error');
      return;
    }

    // 2) verificar size (tamaño)
    if (!this.selectedSize || this.selectedSize.cantidad_disponible <= 0) {
      Swal.fire('Error', 'Debes seleccionar un tamaño disponible.', 'error');
      return;
    }

    // 3) verificar toppings seleccionados
    for (const top of this.selectedToppings) {
      if (top.cantidad_disponible <= 0) {
        Swal.fire('Error', `El topping "${top.nombre}" está agotado.`, 'error');
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
    // tamaño (incluye tipo)
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

  /** Redirecciones de botones inferiores (Historial, Mis Puntos, Cerrar Sesión) */
  goToHistory(): void {
    this.router.navigate(['/user/history']);
  }

  goToPoints(): void {
    this.router.navigate(['/user/points']);
  }

  logout(): void {
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
