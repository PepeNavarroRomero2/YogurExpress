import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectTimeComponent } from './select-time.component';

describe('SelectTimeComponent', () => {
  let component: SelectTimeComponent;
  let fixture: ComponentFixture<SelectTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
