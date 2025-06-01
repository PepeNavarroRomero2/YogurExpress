# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.13.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


## Imports

npm install sweetalert2


**Admin Module Documentation**

This document describes the structure and usage of the Admin module in the Angular 19 application, covering the `DashboardComponent`, `ManageInventoryComponent`, `ManageProductsComponent`, and `ManagePromotionsComponent`.

---

## 1. Module Structure

```
src/app/admin/
├── admin-routing.module.ts    # Defines child routes for the admin module
├── admin.module.ts            # Declares and imports standalone components
├── dashboard/
│   ├── dashboard.component.ts
│   ├── dashboard.component.html
│   └── dashboard.component.scss
├── manage-inventory/
│   ├── manage-inventory.component.ts
│   ├── manage-inventory.component.html
│   └── manage-inventory.component.scss
├── manage-products/
│   ├── manage-products.component.ts
│   ├── manage-products.component.html
│   └── manage-products.component.scss
└── manage-promotions/
    ├── manage-promotions.component.ts
    ├── manage-promotions.component.html
    └── manage-promotions.component.scss
```

### 1.1 Routing (admin-routing.module.ts)

```ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent }   from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}
```

### 1.2 Module Declaration (admin.module.ts)

```ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ManageInventoryComponent } from './manage-inventory/manage-inventory.component';
import { ManageProductsComponent } from './manage-products/manage-products.component';
import { ManagePromotionsComponent } from './manage-promotions/manage-promotions.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    DashboardComponent,
    ManageInventoryComponent,
    ManageProductsComponent,
    ManagePromotionsComponent
  ]
})
export class AdminModule {}
```

---

## 2. DashboardComponent

**Location**: `src/app/admin/dashboard/`

```ts
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ManageInventoryComponent,
    ManageProductsComponent,
    ManagePromotionsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  todaysOrders = 0;
  todaysRevenue = 0;
  topProduct = '';
  activeTab: 'products' | 'inventory' | 'promotions' = 'products';

  setTab(tab: 'products' | 'inventory' | 'promotions') {
    this.activeTab = tab;
  }
}
```

### 2.1 Template (dashboard.component.html)

```html
<header>Admin Dashboard</header>
<nav>
  <button (click)="setTab('products')">Manage Products</button>
  <button (click)="setTab('inventory')">Manage Inventory</button>
  <button (click)="setTab('promotions')">Manage Promotions</button>
</nav>
<section *ngIf="activeTab === 'products'">
  <app-manage-products></app-manage-products>
</section>
<section *ngIf="activeTab === 'inventory'">
  <app-manage-inventory></app-manage-inventory>
</section>
<section *ngIf="activeTab === 'promotions'">
  <app-manage-promotions></app-manage-promotions>
</section>
```

---

## 3. ManageInventoryComponent

**Location**: `src/app/admin/manage-inventory/`

```ts
@Component({
  selector: 'app-manage-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-inventory.component.html',
  styleUrls: ['./manage-inventory.component.scss']
})
export class ManageInventoryComponent implements OnInit {
  inventory: InventoryItem[];
  filtered: InventoryItem[];
  searchTerm = '';
  editId: number | null = null;
  backupQty = 0;

  ngOnInit() {
    this.filtered = [...this.inventory];
  }

  filterInventory() { /* filtering logic */ }
  startEdit(item: InventoryItem) { /*...*/ }
  saveEdit(item: InventoryItem) { /*...*/ }
  cancelEdit(item: InventoryItem) { /*...*/ }
}
```

### 3.1 Key Features

* **Search** by product name
* **Inline editing** of quantity
* **Save/Cancel** actions per row

---

## 4. ManageProductsComponent

**Location**: `src/app/admin/manage-products/`

```ts
@Component({
  selector: 'app-manage-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-products.component.html',
  styleUrls: ['./manage-products.component.scss']
})
export class ManageProductsComponent {
  products: Product[] = [];
  nextId = 1;
  showForm = false;
  editingId: number | null = null;
  product: Product;

  onCreate() { /*...*/ }
  onEdit(p: Product) { /*...*/ }
  onDelete(id: number) { /*...*/ }
  onSave(form: NgForm) { /*...*/ }
  onCancel(form: NgForm) { /*...*/ }
}
```

### 4.1 Key Features

* **Create/Edit** form with validation
* **Delete** action with confirmation
* **Image preview** using `FileReader`
* **List** of saved products in memory

---

## 5. ManagePromotionsComponent

**Location**: `src/app/admin/manage-promotions/`

```ts
@Component({
  selector: 'app-manage-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-promotions.component.html',
  styleUrls: ['./manage-promotions.component.scss']
})
export class ManagePromotionsComponent {
  promotions: Promotion[] = [];
  nextId = 1;
  showForm = false;
  editingId: number | null = null;
  newPromotion: Promotion;

  onCreate() { /*...*/ }
  onEdit(p: Promotion) { /*...*/ }
  onDelete(id: number) { /*...*/ }
  onSave() { /*...*/ }
  onCancel() { /*...*/ }
}
```

### 5.1 Key Features

* **Create/Edit** promotions with code & discount
* **Delete** promotions
* **Responsive table** listing

---

## 6. Integration

* **Main route** `/admin` lazy-loads `AdminModule`.
* **AppComponent** bootstrap via `provideRouter` and standalone components.
* **Global styles** in `src/styles.scss` and component-scoped SCSS.

---

## 7. Future Improvements

* Persist data via API (`HttpClient`, backend endpoints).
* Add unit and e2e tests.
* Enhance form validation using Reactive Forms.
* Integrate role-based guards for access control.

## Documentación: LoginRegisterComponent
1. Ubicación
src/app/components/user/login-register/login-register.component.ts

2. Descripción
Componente standalone que ofrece al usuario dos modos de autenticación:

Login: formulario de correo y contraseña.

Registro: formulario de nombre, correo y contraseña.

Gestiona el flujo de inicio de sesión y registro usando un servicio mock (AuthService) y redirige al usuario a la zona correspondiente (/user/menu o /admin) tras la autenticación.

3. Dependencias
Angular

CommonModule

FormsModule

Router (para navegación)

Terceros

SweetAlert2 (Swal.fire) para mostrar errores/éxitos

Servicios propios

AuthService (mock de autenticación en localStorage)

4. Propiedades de clase
Propiedad	Tipo	Descripción
isLoginMode	boolean	Indica si el formulario está en modo “login” (true) o “registro” (false).
name	string	Nombre del usuario (solo en modo registro).
email	string	Correo electrónico para login o registro.
password	string	Contraseña para login o registro.

5. Métodos principales
toggleMode()
Cambia entre los modos de “login” y “registro”, y limpia los campos del formulario.

onSubmit()

Si isLoginMode es true:

Llama a auth.login(email, password).

Si es correcto, comprueba auth.getUser().role:

Si role === 'admin', navega a /admin.

Si role === 'user', navega a /user/menu.

Si falla, muestra un modal de error.

Si isLoginMode es false:

Valida que name no esté vacío.

Llama a auth.register(name, email, password).

Si es correcto, muestra un modal de éxito y vuelve al modo login.

Si el email ya existe, muestra un modal de error.

6. Plantilla (resumen)
Título dinámico:

html
Copiar
Editar
<h2>{{ isLoginMode ? 'Iniciar sesión' : 'Registro de usuario' }}</h2>
Campos de formulario:

name (solo en registro)

email

password

Botón de envío con clase y texto dinámicos.

Enlace para alternar entre modos.

7. Estilos (resumen)
Contenedor centrado, fondo blanco, sombra ligera.

Formularios con .form-group, .form-control y botones .btn, .btn-primary / .btn-success.

Enlace de alternancia resaltado en azul.

8. TODO
👷‍♂️ TODO: cuando integremos backend real, eliminar la lógica de rol mock, ajustar AuthService para obtener el rol de usuario desde la respuesta del servidor (por ejemplo, un JWT con claim role) y refactorizar la redirección en onSubmit() para basarse en esa información.

## Documentación: CartService
1. Ubicación
src/app/services/cart.service.ts

2. Descripción
Servicio singleton que mantiene en memoria el estado del pedido actual (sabor, toppings, tamaño, etc.). Se usa para compartir datos entre los distintos componentes de flujo de usuario.

3. Dependencias
Angular

@Injectable (con providedIn: 'root')

Modelos propios

Flavor (importado de product.service.ts)

4. Interfaz interna
ts
Copiar
Editar
export interface Cart {
  flavor?: Flavor;
  toppings: string[];
  size?: string;
  // más campos (pickupTime, paymentInfo…) cuando se implementen
}
5. Métodos públicos
Método	Parámetros	Retorno	Descripción
setFlavor(...)	flavor: Flavor	void	Guarda el sabor elegido en el carrito.
getFlavor()	—	Flavor | undefined	Devuelve el sabor almacenado.
clear()	—	void	Resetea el carrito a su estado inicial (solo toppings vacíos).
(Próximos)	—	—	Añadir: addTopping(), removeTopping(), setSize(), getCart(), etc.

ts
Copiar
Editar
/** Guarda el sabor seleccionado en el carrito */
setFlavor(flavor: Flavor) {
  this.cart.flavor = flavor;
}

/** Devuelve el sabor actualmente almacenado */
getFlavor(): Flavor | undefined {
  return this.cart.flavor;
}

/** Resetea el carrito (para un nuevo pedido) */
clear() {
  this.cart = { toppings: [] };
}
6. TODO
👷‍♂️ TODO: Ampliar el CartService para gestionar el resto de datos del pedido:

Toppings (addTopping, removeTopping, getToppings)

Tamaño (setSize, getSize)

Hora de recogida (setPickupTime, getPickupTime)

Método getCart() que devuelva todo el estado actual.

👷‍♂️ TODO: Cuando exista backend, sincronizar el carrito con la API:

Guardar el estado temporal en sesión del servidor o en un objeto de pedido pendiente.

Llamadas HTTP para validar disponibilidad de toppings/inventario antes de confirmar.

## Documentación: CustomizeOrderComponent
1. Ubicación
src/app/components/user/customize-order/customize-order.component.ts

2. Descripción
Componente standalone que permite al usuario personalizar el pedido tras seleccionar el sabor. Ofrece:

Listado de toppings con checkbox.

Selección de tamaño con radio buttons.

Cálculo dinámico del precio total (sabor + toppings + tamaño).

Navegación al siguiente paso (/user/pickup).

Se apoya en ProductService para obtener las opciones estáticas y en CartService para leer/escribir el estado del carrito.

3. Dependencias
Angular

CommonModule

Router

Servicios propios

ProductService (obtiene arrays de sabores, toppings y tamaños)

CartService (gestiona el estado del carrito)

4. Propiedades de clase
Propiedad	Tipo	Descripción
flavorName	string	Nombre del sabor seleccionado
flavorPrice	number	Precio base del sabor
toppings	Topping[]	Lista completa de toppings disponibles
sizes	SizeOption[]	Lista completa de tamaños disponibles
selectedToppings	Topping[]	Toppings actualmente seleccionados
selectedSize	SizeOption | undefined	Tamaño actualmente seleccionado
total	number	Precio total calculado (base + extras + tamaño)

5. Métodos principales
ngOnInit()

Recupera el sabor elegido de CartService.

Si no existe, redirige a /user/menu.

Inicializa toppings, sizes, selectedToppings, selectedSize y calcula total.

toggleTopping(t: Topping): void
Altera selección de un topping: lo añade o lo quita del carrito, refresca selectedToppings y recalcula total.

selectSize(s: SizeOption): void
Establece el tamaño en el carrito, actualiza selectedSize y recalcula total.

isSelectedTopping(t: Topping): boolean
Comprueba si un topping está marcado (evita usar arrow functions en la plantilla).

updateTotal(): void
Llama a CartService.getTotal() para actualizar el campo total.

next(): void
Navega a la ruta de selección de hora: /user/pickup.

6. Plantilla (resumen)
html
Copiar
Editar
<h2>Personaliza tu {{ flavorName }}</h2>
<p>Precio base: {{ flavorPrice | currency:'EUR' }}</p>

<section>
  <h3>Toppings</h3>
  <label *ngFor="let t of toppings">
    <input
      type="checkbox"
      [checked]="isSelectedTopping(t)"
      (change)="toggleTopping(t)"
    /> {{ t.name }} (+{{ t.price | currency:'EUR' }})
  </label>
</section>

<section>
  <h3>Tamaño</h3>
  <label *ngFor="let s of sizes">
    <input
      type="radio"
      name="size"
      [checked]="selectedSize?.id === s.id"
      (change)="selectSize(s)"
    /> {{ s.name }} (+{{ s.price | currency:'EUR' }})
  </label>
</section>

<div>
  <strong>Total:</strong> {{ total | currency:'EUR' }}
</div>

<button (click)="next()">Siguiente</button>
7. Estilos (resumen)
Contenedor centrado y con padding.

Secciones de toppings y tamaños con display: flex; flex-wrap: wrap; gap.

Botón “Siguiente” destacado en verde (.btn-next).

8. TODO
👷‍♂️ TODO: Cambiar llamada a ProductService.getToppings() y getSizes() para que retornen Observable<Topping[]> y Observable<SizeOption[]> vía HTTP (HttpClient).

👷‍♂️ TODO: Gestionar estados de carga (loading spinner) y error al consumir la API.

👷‍♂️ TODO: Refactorizar toggleTopping, selectSize y cálculo de total usando flujos reactivos (por ejemplo, un BehaviorSubject<Cart> en CartService).

👷‍♂️ TODO: Validar en la UI que al menos se seleccione un tamaño antes de avanzar.

👷‍♂️ TODO: Extraer constantes de rutas ('/user/pickup') a un único archivo de configuración de rutas.

## Documentación: SelectTimeComponent
1. Ubicación
src/app/components/user/select-time/select-time.component.ts

2. Descripción
Permite al usuario indicar la fecha y hora en que pasará a recoger su pedido. Usa un <input type="datetime-local"> con restricción mínima de ahora + 15 minutos, almacena la selección en CartService y navega al siguiente paso.

3. Dependencias
Angular

CommonModule, FormsModule

Router

Terceros

SweetAlert2 (Swal.fire)

Servicios propios

CartService (para guardar/leer pickupTime)

4. Propiedades
Nombre	Tipo	Descripción
pickupTime	string	Valor enlazado al input datetime-local
minDateTime	string	Valor mínimo permitido para el datetime-local

5. Métodos
ngOnInit():

Redirige a menú si no hay sabor en el carrito.

Precarga pickupTime si ya existía.

Calcula minDateTime = ahora + 15min.

formatLocal(d: Date): string: da formato ISO para el input.

onSubmit(): valida selección, guarda en CartService, navega a /user/payment.

onBack(): vuelve a /user/personalize.

6. Plantilla (resumen)
Título: “¿Cuándo pasas a recoger?”

Formulario con <input type="datetime-local" [min]="minDateTime">

Botones “Atrás” y “Siguiente”

7. Estilos (resumen)
Tarjeta blanca centrada con sombra.

Campos y botones con estilos coherentes al resto de la app.

8. TODO
👷‍♂️ TODO: Reemplazar <input> nativo por un date-picker y time-picker estilizados (p. ej. ngx-bootstrap, Material).

👷‍♂️ TODO: Validar que la hora seleccionada está dentro de nuestro horario de apertura (p. ej. 10:00–22:00).

👷‍♂️ TODO: Cuando exista API, guardar pickupTime en el pedido remoto (POST /orders/temp o similar).

👷‍♂️ TODO: Extraer la ventana mínima de recogida (15 minutos) a una constante o configuración.

## Documentación: PaymentConfirmationComponent
1. Ubicación
src/app/components/user/payment-confirmation/payment-confirmation.component.ts

2. Descripción
Pantalla final del flujo de compra donde se muestra un resumen del pedido (sabor, toppings, tamaño, hora de recogida y total) y se confirma el pago. Al confirmar:

Llama a OrderService.placeOrder().

Muestra un SweetAlert2 con:

Icono: success

Título: “Pedido confirmado”

Texto: “Tu pedido ha sido realizado correctamente.”

Botón: “Volver a inicio”

Redirige a /user/menu.

3. Dependencias
Angular

CommonModule

Router

Terceros

SweetAlert2 (Swal.fire)

Servicios propios

CartService

AuthService

OrderService

4. Métodos principales
ngOnInit()

Recupera el carrito y total.

Redirige al menú si falta cualquier parte del pedido.

confirmPayment()

Invoca OrderService.placeOrder().

Si falla, muestra modal de error.

Si tiene éxito, muestra modal de éxito y, al cerrar, redirige a /user/menu.

onBack()

Navega a la pantalla de selección de hora (/user/pickup).

5. TODO
👷‍♂️ TODO: Integrar con pasarela de pago real (Stripe, PayPal…):

Pagar con tarjeta, 3D Secure, etc.

Gestionar errores de transacción.

👷‍♂️ TODO: Consumir OrderService vía HTTP cuando exista API en /api/orders.

👷‍♂️ TODO: Extraer rutas literales ('/user/menu', '/user/pickup') a constantes de configuración.

## Documentación: OrderHistoryComponent
1. Ubicación
src/app/components/user/order-history/order-history.component.ts

2. Descripción
Componente standalone que muestra el historial de pedidos del usuario actual. Obtiene los pedidos de OrderService.getOrdersForCurrentUser() y los presenta en tarjetas con todos los detalles: ID, fecha, sabor, toppings, tamaño, hora de recogida y total.

3. Dependencias
Angular

CommonModule

Servicios propios

OrderService (para recuperar los pedidos)

4. Propiedades
Nombre	Tipo	Descripción
orders	Order[]	Lista de pedidos del usuario logueado

5. Métodos
ngOnInit()
Carga orders desde OrderService.

formatToppings(order: Order): string
Extrae y concatena los nombres de toppings o muestra “Sin toppings” si no hay.

6. Plantilla (resumen)
Título: “Historial de pedidos”

Iteración con *ngFor de orders → muestra tarjetas con detalles.

ng-template para mensaje “No has realizado ningún pedido aún.”

7. Estilos (resumen)
Contenedor centrado con ancho máximo.

Tarjetas blancas con sombra para cada pedido.

Etiquetas en negrita para los campos.

8. TODO
👷‍♂️ TODO: Cambiar la carga de pedidos para usar Observable<Order[]> desde un endpoint REST (GET /api/orders?userEmail=…) y manejar estados de loading y error.

👷‍♂️ TODO: Añadir paginación o scroll infinito si el historial es muy grande.

👷‍♂️ TODO: Permitir filtrar pedidos por fecha o estado (recogido, pendiente).

👷‍♂️ TODO: Extraer constantes de rutas y estilos compartidos (por ejemplo, clases de tarjetas) a módulos comunes.

## Documentación: PointsComponent
1. Ubicación
src/app/components/user/points/points.component.ts

2. Descripción
Componente standalone que muestra el saldo de puntos del usuario y permite canjearlos. Muestra:

Saldo actual en “pts”.

Formulario para indicar cuántos puntos canjear.

Validaciones básicas y mensajes con SweetAlert2.

3. Propiedades de clase
Propiedad	Tipo	Descripción
currentPoints	number	Puntos disponibles del usuario.
redeemAmount	number	Cantidad introducida para canjear.

4. Métodos principales
ngOnInit(): carga currentPoints mediante PointsService.getPoints().

onRedeem():

Valida que redeemAmount > 0.

Llama a PointsService.redeemPoints().

Muestra modal de éxito o error y actualiza currentPoints.

5. TODO
👷‍♂️ TODO: Integrar lógica de añadir puntos automáticamente tras cada pedido exitoso (p. ej. en OrderService.placeOrder()).

👷‍♂️ TODO: Permitir canjear puntos por descuentos en el proceso de confirmación de pago.

👷‍♂️ TODO: Refactorizar a flujos reactivos (Observable<number>) y manejar carga/errores de la API.