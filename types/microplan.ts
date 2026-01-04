export interface DayPlan {
  date: Date;
  dayNumber: number;
  status: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  carriedForward: boolean;
}
