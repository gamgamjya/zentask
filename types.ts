
export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string | null;
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  projectId: string | null;
  labelId: string | null;
  createdAt: string; // ISO string
  completed: boolean;
  userId: string;
  seriesId?: string;
  repeat?: 'none' | 'daily' | 'weekdays' | 'monthly' | 'yearly';
  repeatUntil?: string | null;
}

export interface User {
  id: string;
  name: string;
  picture: string;
  email?: string;
  isAdmin?: boolean;
}

export interface DailyReport {
  userId: string;
  userName: string;
  userPicture: string;
  date: string; // YYYY-MM-DD
  tasks: Task[];
}

export interface MonthlyWorkReport {
  id: string; // userId_YYYY-MM
  userId: string;
  year: number;
  month: number; // 0-11
  content: string; // Can contain basic HTML for formatting
  status: 'draft' | 'submitted';
  submittedAt?: string; // ISO string
}

export type View = 'dashboard' | 'tasks' | 'projects' | 'labels' | 'calendar' | 'export';