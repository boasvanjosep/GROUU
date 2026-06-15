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

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: 'FnB' | 'Mobility' | 'Study' | 'Personal' | 'Fun';
  paymentMethod: 'BRI' | 'Gopay' | 'Cash';
  createdAt: string;
  notes?: string;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  notes?: string;
  createdAt: string;
}
