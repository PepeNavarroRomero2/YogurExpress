import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginRegisterComponent }         from './login-register/login-register.component';
import { ProductMenuComponent }           from './product-menu/product-menu.component';
import { CustomizeOrderComponent }        from './customize-order/customize-order.component';
import { SelectTimeComponent }            from './select-time/select-time.component';
import { PaymentConfirmationComponent }   from './payment-confirmation/payment-confirmation.component';
import { OrderHistoryComponent }          from './order-history/order-history.component';
import { PointsComponent }                from './points/points.component';
import { authGuard }                      from '../../guards/auth.guard';

const routes: Routes = [
  { path: '',            redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',       component: LoginRegisterComponent },
  { path: 'menu',        component: ProductMenuComponent },
  { path: 'personalize', component: CustomizeOrderComponent },
  { path: 'pickup',      component: SelectTimeComponent },
  // Estas requieren login:
  { path: 'payment',     component: PaymentConfirmationComponent, canActivate: [authGuard] },
  { path: 'history',     component: OrderHistoryComponent,        canActivate: [authGuard] },
  { path: 'points',      component: PointsComponent,              canActivate: [authGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
