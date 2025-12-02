import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoyaltySettingsDialogComponent } from './loyalty-settings-dialog.component';

describe('LoyaltySettingsDialogComponent', () => {
  let component: LoyaltySettingsDialogComponent;
  let fixture: ComponentFixture<LoyaltySettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoyaltySettingsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoyaltySettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

