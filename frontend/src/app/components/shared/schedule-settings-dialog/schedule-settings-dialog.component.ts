import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScheduleService } from '../../../services/schedule.service';
import { DEFAULT_SCHEDULE, type Schedule } from '../../../config/schedule.config';

@Component({
  selector: 'app-schedule-settings-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-settings-dialog.component.html',
  styleUrls: ['./schedule-settings-dialog.component.scss']
})
export class ScheduleSettingsDialogComponent {
  @Output() closed = new EventEmitter<void>();

  model: Schedule = { ...DEFAULT_SCHEDULE };

  constructor(private scheduleService: ScheduleService) {
    this.model = { ...this.scheduleService.value };
  }

  get valid(): boolean {
    return (
      Number.isFinite(this.model.openHour) &&
      Number.isFinite(this.model.closeHour) &&
      Number.isFinite(this.model.minLeadMinutes) &&
      this.model.openHour >= 0 &&
      this.model.openHour <= 23 &&
      this.model.closeHour >= 1 &&
      this.model.closeHour <= 24 &&
      this.model.openHour < this.model.closeHour &&
      this.model.minLeadMinutes >= 0 &&
      this.model.minLeadMinutes <= 240
    );
  }

  save(): void {
    if (!this.valid) return;
    this.scheduleService.set(this.model);
    this.closed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }

  resetDefaults(): void {
    this.model = { ...DEFAULT_SCHEDULE };
  }
}
