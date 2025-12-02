import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomizeOrderComponent } from './customize-order.component';

describe('CustomizeOrderComponent', () => {
  let component: CustomizeOrderComponent;
  let fixture: ComponentFixture<CustomizeOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomizeOrderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomizeOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

