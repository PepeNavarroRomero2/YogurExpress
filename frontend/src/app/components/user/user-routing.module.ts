import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginRegisterComponent }         from './login-register/login-register.component';
import { ProductMenuComponent }           from './product-menu/product-menu.component';
import { CustomizeOrderComponent }        from './customize-order/customize-order.component';
import { SelectTimeComponent }            from './select-time/select-time.component';
import { PaymentConfirmationComponent }   from './payment-confirmation/payment-confirmation.component';
import { OrderHistoryComponent }          from './order-history/order-history.component';
import { PointsComponent }                from './points/points.component';

const routes: Routes = [
  { path: '',            redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',       component: LoginRegisterComponent },
  { path: 'menu',        component: ProductMenuComponent },
  { path: 'personalize', component: CustomizeOrderComponent },
  { path: 'pickup',      component: SelectTimeComponent },
  { path: 'payment',     component: PaymentConfirmationComponent },
  { path: 'history',     component: OrderHistoryComponent },
  { path: 'points',      component: PointsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
