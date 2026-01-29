
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  CANCELLED = 'CANCELLED',
  NOT_SET = 'NOT_SET'
}

export interface TimetableEntry {
  id: string;
  day: number; // 1 (Mon) - 5 (Fri)
  subject: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  subjectId: string;
  status: AttendanceStatus;
}

export interface UserSettings {
  targetPercentage: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
