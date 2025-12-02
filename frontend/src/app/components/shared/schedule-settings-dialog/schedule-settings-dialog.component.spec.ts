import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleSettingsDialogComponent } from './schedule-settings-dialog.component';

describe('ScheduleSettingsDialogComponent', () => {
  let component: ScheduleSettingsDialogComponent;
  let fixture: ComponentFixture<ScheduleSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleSettingsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

