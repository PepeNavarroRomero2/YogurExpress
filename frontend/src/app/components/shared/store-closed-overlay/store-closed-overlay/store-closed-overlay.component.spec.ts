import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreClosedOverlayComponent } from './store-closed-overlay.component';

describe('StoreClosedOverlayComponent', () => {
  let component: StoreClosedOverlayComponent;
  let fixture: ComponentFixture<StoreClosedOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreClosedOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreClosedOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

