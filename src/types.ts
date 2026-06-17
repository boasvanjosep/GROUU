/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  url?: string;
  urls?: string[];
  createdAt: string;
  category?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachments?: { name: string; url: string }[];
  driveFileUrl?: string;
  driveFileIds?: string;
}

export interface ExpenseData {
  amount: number;
  category: string;
  paymentMethod: string;
  description: string;
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  paymentMethod: string;
  description: string;
  notes?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  isAllDay?: boolean;
  reminderMinutes?: number;
  location: string;
  notes?: string;
  createdAt: string;
}

export type TaskProgress = 'Not Yet' | 'On Progress' | 'Done';

export interface Task {
  id: string;
  name: string;
  subject: string;
  progress: TaskProgress;
  deadline: string; // ISO date string or YYYY-MM-DD
  time?: string;
  reminderMinutes?: number;
  url?: string;
  urls?: string[];
  attachmentName?: string;
  attachmentUrl?: string; // local blob url
  driveFileUrl?: string; // google drive url
  driveFileIds?: string;
  createdAt: string;
}
