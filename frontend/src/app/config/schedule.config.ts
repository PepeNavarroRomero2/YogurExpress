export interface Schedule {
  openHour: number;        // 0..23
  closeHour: number;       // 1..24 (debe ser > openHour)
  minLeadMinutes: number;  // 0..240
}

export const DEFAULT_SCHEDULE: Schedule = {
  openHour: 10,
  closeHour: 22,
  minLeadMinutes: 30
};

