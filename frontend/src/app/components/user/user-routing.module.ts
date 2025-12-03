import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginRegisterComponent }         from './login-register/login-register.component';
import { ProductMenuComponent }           from './product-menu/product-menu.component';
import { CustomizeOrderComponent }        from './customize-order/customize-order.component';
import { SelectTimeComponent }            from './select-time/select-time.component';
import { PaymentConfirmationComponent }   from './payment-confirmation/payment-confirmation.component';
import { OrderHistoryComponent }          from './order-history/order-history.component';
import { PointsComponent }                from './points/points.component';

import { authGuard }          from '../../guards/auth.guard';
import { loginRedirectGuard } from '../../guards/login-redirect.guard';

const routes: Routes = [
  // /user â†’ a login (si ya hay sesión, el guard puede redirigir)
  { path: 'login', component: LoginRegisterComponent, canActivate: [loginRedirectGuard] },

  // resto requiere sesión
  { path: 'menu',        component: ProductMenuComponent,         canActivate: [authGuard] },
  { path: 'personalize', component: CustomizeOrderComponent,      canActivate: [authGuard] },
  { path: 'pickup',      component: SelectTimeComponent,          canActivate: [authGuard] },
  { path: 'payment',     component: PaymentConfirmationComponent, canActivate: [authGuard] },
  { path: 'history',     component: OrderHistoryComponent,        canActivate: [authGuard] },
  { path: 'points',      component: PointsComponent,              canActivate: [authGuard] },

  // Alias legacy para enlaces viejos:
  { path: 'customize', redirectTo: 'personalize', pathMatch: 'full' },

  // por defecto dentro de /user
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }

