import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService, Schedule } from '../../../services/schedule.service';

@Component({
  selector: 'app-schedule-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-settings-dialog.component.html',
  styleUrls: ['./schedule-settings-dialog.component.scss']
})
export class ScheduleSettingsDialogComponent {
  @Output() closed = new EventEmitter<void>();
  model: Schedule = { openHour: 10, closeHour: 22, minLeadMinutes: 30 };
  saving = false;

  constructor(private scheduleService: ScheduleService) {
    this.model = { ...this.scheduleService.value };
  }

  get valid(): boolean {
    return (
      Number.isFinite(this.model.openHour) &&
      Number.isFinite(this.model.closeHour) &&
      Number.isFinite(this.model.minLeadMinutes) &&
      this.model.openHour >= 0 && this.model.openHour <= 23 &&
      this.model.closeHour >= 1 && this.model.closeHour <= 24 &&
      this.model.openHour < this.model.closeHour &&
      this.model.minLeadMinutes >= 0 && this.model.minLeadMinutes <= 240
    );
  }

  save(): void {
    if (!this.valid || this.saving) return;
    this.saving = true;
    this.scheduleService.saveAdmin(this.model).subscribe({
      next: () => { this.saving = false; this.closed.emit(); },
      error: () => { this.saving = false; }
    });
  }

  cancel(): void {
    this.closed.emit();
  }

  resetDefaults(): void {
    this.model = { openHour: 10, closeHour: 22, minLeadMinutes: 30 };
  }
}
