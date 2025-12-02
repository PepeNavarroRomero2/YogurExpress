import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoyaltyService, LoyaltySettings } from '../../../services/loyalty.service';

@Component({
  selector: 'app-loyalty-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loyalty-settings-dialog.component.html',
  styleUrls: ['./loyalty-settings-dialog.component.scss']
})
export class LoyaltySettingsDialogComponent {
  @Output() closed = new EventEmitter<void>();
  model: LoyaltySettings = { earnRate: 1, pointsPerEuro: 10 };
  saving = false;

  constructor(private loyalty: LoyaltyService) {
    this.model = { ...this.loyalty.value };
  }

  get valid(): boolean {
    return this.model.earnRate >= 0 && this.model.earnRate <= 100
        && this.model.pointsPerEuro >= 1 && this.model.pointsPerEuro <= 10000;
  }

  onCancel(): void {
    this.closed.emit();
  }

  onSave(): void {
    if (!this.valid || this.saving) return;
    this.saving = true;
    this.loyalty.save(this.model).subscribe({
      next: () => {
        this.saving = false;
        this.closed.emit();
      },
      error: () => {
        this.saving = false;
        alert('Error guardando configuraciÃ³n de puntos');
      }
    });
  }
}

