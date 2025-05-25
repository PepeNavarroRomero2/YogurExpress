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

## Documentacion AdmminModule

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

