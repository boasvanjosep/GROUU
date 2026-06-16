/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note, Expense, Activity } from '../types';
import { getAppConfig } from '../config';
import { isAllowedGasUrl } from '../utils/gasUrl';

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  zip: 'application/zip',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};

const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_MAP[ext] || 'application/octet-stream';
};

const requestGas = async <T = unknown>(payload: Record<string, unknown>): Promise<T> => {
  const { gasUrl, grouuToken } = getAppConfig();
  if (!isAllowedGasUrl(gasUrl)) {
    throw new Error('GROUU backend is not configured.');
  }

  const response = await fetch('/api/gas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gasUrl, payload, grouuToken }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.error || `GAS proxy request failed (${response.status})`);
  }

  return result.data as T;
};

// Key names for localStorage fallback cache
export const STORAGE_KEYS = {
  get NOTES() {
    return getScopedStorageKey('notes');
  },
  get EXPENSES() {
    return getScopedStorageKey('expenses');
  },
  get SCHEDULE() {
    return getScopedStorageKey('schedule');
  }
};

const DELETED_KEYS = {
  get NOTES() {
    return getScopedStorageKey('deleted_notes');
  },
  get EXPENSES() {
    return getScopedStorageKey('deleted_expenses');
  },
  get SCHEDULE() {
    return getScopedStorageKey('deleted_schedule');
  }
};

const getScopedStorageKey = (name: string): string => {
  const { workspaceId } = getAppConfig();
  return `grouu:${workspaceId}:${name}`;
};

// Initial data so the user has beautiful placeholder data matching the artboards
export const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    title: 'Q3 Financial Strategy Draft',
    content: 'The distinction between active management and passive holding is often blurred by emotional bias. Reviewing the Q3 allocations, it\'s clear that the tech sector overlay requires rebalancing before the EOY tax window closes.',
    url: 'https://docs.google.com/spreadsheets/d/1_placeholder/edit',
    createdAt: '2026-06-02T10:30:00Z',
    category: 'Finance'
  },
  {
    id: 'n2',
    title: 'Architecture Readlist',
    content: 'Reviewing modern systems integration. Focus points:\n- Event-driven scaling patterns\n- Zero-trust network basics\n- PostgreSQL index optimization',
    createdAt: '2026-06-01T08:15:00Z',
    category: 'Tech'
  },
  {
    id: 'n3',
    title: 'Aesthetic Philosophy Note',
    content: '"Clarity is not the absence of complexity, but the mastering of it."',
    createdAt: '2026-05-28T14:20:00Z',
    category: 'Inspiration'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    amount: 120000,
    description: 'Special Dinner with client',
    category: 'FnB',
    paymentMethod: 'BRI',
    createdAt: '2026-06-03T20:00:00Z',
    notes: 'Premium dining at city center'
  },
  {
    id: 'e2',
    amount: 45000,
    description: 'Ride sharing to office',
    category: 'Mobility',
    paymentMethod: 'Gopay',
    createdAt: '2026-06-04T07:45:00Z'
  },
  {
    id: 'e3',
    amount: 85000,
    description: 'Web development reference book',
    category: 'Study',
    paymentMethod: 'Cash',
    createdAt: '2026-06-04T12:00:00Z'
  }
];

export const INITIAL_SCHEDULE: Activity[] = [
  {
    id: 's1',
    title: 'Strategic Architecture Review',
    date: '2026-06-05',
    time: '10:00 AM',
    location: 'Meeting Room 4B / Zoom Direct Link',
    notes: 'Evaluate current cloud ingress gateways and performance markers.',
    createdAt: '2026-06-04T13:00:00Z'
  },
  {
    id: 's2',
    title: 'Developer Sync & Retro',
    date: '2026-06-06',
    time: '02:00 PM',
    location: 'Discord Server / Lobby Room',
    notes: 'Sprint 14 checkup.',
    createdAt: '2026-06-04T14:00:00Z'
  }
];

// Helper to initialize custom state if not present
const getFallbackData = <T>(key: string, initial: T[]): T[] => {
  const cached = localStorage.getItem(key);
  if (!cached) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(cached);
};

// Merge data arrays by ID: local items are preserved, GAS items not in local are added
function mergeDataById<T extends { id: string }>(gasData: T[], localData: T[], deletedIds: string[] = []): T[] {
  const localIds = new Set(localData.map(item => item.id));
  const deleted = new Set(deletedIds);
  const merged = [...localData];
  for (const item of gasData) {
    if (!localIds.has(item.id) && !deleted.has(item.id)) {
      merged.push(item);
    }
  }
  return merged;
}

// Check if Apps Script Web App URL is actually set (not a placeholder)
const isGasActive = (url: string): boolean => {
  return isAllowedGasUrl(url);
};

export interface DashboardStats {
  totalExpense: number;
  totalLedgerItems: number;
  totalNotes: number;
  totalSchedules: number;
  totalDriveFiles: number;
}

export const apiService = {
  getDashboardStats: async (): Promise<DashboardStats | null> => {
    const config = getAppConfig();
    if (!isGasActive(config.gasUrl)) return null;
    try {
      return await requestGas<DashboardStats>({ action: 'getDashboardStats' });
    } catch (err) {
      console.warn("GAS getDashboardStats failed:", err);
    }
    return null;
  },

  // --- NOTES ARCHIVE ---
  listNotes: async (): Promise<Note[]> => {
    const config = getAppConfig();
    const deletedNoteIds: string[] = JSON.parse(localStorage.getItem(DELETED_KEYS.NOTES) || '[]');

    if (isGasActive(config.gasUrl)) {
      try {
        const result = await requestGas<{ data?: unknown[] }>({ action: 'listNotes' });
        if (result && Array.isArray(result.data)) {
          // GAS is the source of truth — map all fields including Drive file metadata
          const gasData = (result.data as any[]).map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            url: row.url,
            urls: row.urls || [],
            createdAt: row.createdAt,
            category: row.category,
            attachmentName: row.attachmentName,
            attachmentUrl: row.attachmentUrl,
            driveFileUrl: row.driveFileUrl || row.attachmentUrl,
            driveFileIds: row.driveFileIds,
          })) as Note[];

          // Filter out locally-deleted items, then replace local cache entirely with GAS data
          const authoritative = gasData.filter(n => !deletedNoteIds.includes(n.id));
          localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(authoritative));
          return authoritative;
        }
      } catch (err) {
        console.warn("Google Apps Script sync failed, returning local cached content:", err);
      }
    }

    // GAS unreachable — fall back to local cache, still filter out deleted IDs
    const local = getFallbackData<Note>(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    const filtered = local.filter(n => !deletedNoteIds.includes(n.id));
    if (filtered.length !== local.length) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(filtered));
    }
    return filtered;
  },

  createNote: async (
    noteData: Omit<Note, 'id' | 'createdAt'>,
    files?: { fileName: string; fileData: string }[],
    urls?: string[]
  ): Promise<Note> => {
    const config = getAppConfig();
    const newNote: Note = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...noteData,
    };

    if (urls && urls.length > 0) {
      newNote.urls = urls;
    }

    if (files && files.length > 0) {
      newNote.attachments = files.map(f => ({
        name: f.fileName,
        url: `data:${getMimeType(f.fileName)};base64,${f.fileData}`
      }));
    }

    // Always record locally so mock displays work instantly
    const currentNotes = getFallbackData<Note>(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    const updatedNotes = [newNote, ...currentNotes];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));

    if (isGasActive(config.gasUrl)) {
      try {
        const payload = {
          action: 'createNote',
          id: newNote.id,
          title: newNote.title,
          category: newNote.category || 'General',
          content: newNote.content,
          urls: urls || [],
          files: files || []
        };

        await requestGas(payload);
      } catch (err) {
        console.warn("GAS submission erred, stored locally instead:", err);
      }
    }

    return newNote;
  },

  deleteNote: async (id: string): Promise<boolean> => {
    const config = getAppConfig();

    // Dapatkan data note sebelum dihapus untuk dikirim ke GAS
    const currentNotes = getFallbackData<Note>(STORAGE_KEYS.NOTES, INITIAL_NOTES);
    const noteToDelete = currentNotes.find(n => n.id === id);

    // Update local state first
    const updatedNotes = currentNotes.filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(updatedNotes));

    // Track deleted ID so it doesn't reappear from GAS
    const deletedIds: string[] = JSON.parse(localStorage.getItem(DELETED_KEYS.NOTES) || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_KEYS.NOTES, JSON.stringify(deletedIds));
    }

    if (isGasActive(config.gasUrl)) {
      try {
        const payload: Record<string, unknown> = {
          action: 'deleteNote',
          id: id,
        };

        // Kirim driveFileIds agar GAS dapat menghapus berkas Drive secara akurat
        // berdasarkan ID (menghindari kolisi nama file antar note).
        if (noteToDelete?.driveFileIds) {
          payload.driveFileIds = noteToDelete.driveFileIds;
        }

        await requestGas(payload);
      } catch (err) {
        console.warn("GAS deletion erred, updated local cache only:", err);
      }
    }

    return true;
  },

  // --- EXPENSE LEDGER ---
  listExpenses: async (): Promise<Expense[]> => {
    const config = getAppConfig();
    const local = getFallbackData<Expense>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const deletedExpenseIds: string[] = JSON.parse(localStorage.getItem(DELETED_KEYS.EXPENSES) || '[]');

    if (isGasActive(config.gasUrl)) {
      try {
        const result = await requestGas<{ data?: unknown[] }>({ action: 'listExpenses' });
        if (result && Array.isArray(result.data)) {
          const gasData = result.data as Expense[];
          const merged = mergeDataById(gasData, local, deletedExpenseIds);
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn("GAS sync listExpenses failed, returning cached:", err);
      }
    }

    const filtered = local.filter(e => !deletedExpenseIds.includes(e.id));
    if (filtered.length !== local.length) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filtered));
    }
    return filtered;
  },

  createExpense: async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
    const config = getAppConfig();
    const newExpense: Expense = {
      id: 'e_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...expenseData
    };

    // Keep state
    const currentList = getFallbackData<Expense>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const updated = [newExpense, ...currentList];
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));

    if (isGasActive(config.gasUrl)) {
      try {
        const payload = {
          action: 'createExpense',
          id: newExpense.id,
          amount: newExpense.amount,
          description: newExpense.description,
          category: newExpense.category,
          paymentMethod: newExpense.paymentMethod,
          notes: newExpense.notes || ''
        };

        await requestGas(payload);
      } catch (err) {
        console.warn("GAS direct upload erred, captured on local ledger:", err);
      }
    }

    return newExpense;
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    const config = getAppConfig();

    const currentExpenses = getFallbackData<Expense>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    const updatedExpenses = currentExpenses.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedExpenses));

    const deletedIds: string[] = JSON.parse(localStorage.getItem(DELETED_KEYS.EXPENSES) || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_KEYS.EXPENSES, JSON.stringify(deletedIds));
    }

    if (isGasActive(config.gasUrl)) {
      try {
        await requestGas({ action: 'deleteExpense', id });
      } catch (err) {
        console.warn("GAS deleteExpense failed, updated local cache only:", err);
      }
    }

    return true;
  },

  // --- SCHEDULE / ACTIVITIES ---
  listSchedules: async (): Promise<Activity[]> => {
    const config = getAppConfig();
    const local = getFallbackData<Activity>(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
    const deletedScheduleIds: string[] = JSON.parse(localStorage.getItem(DELETED_KEYS.SCHEDULE) || '[]');

    if (isGasActive(config.gasUrl)) {
      try {
        const result = await requestGas<{ data?: unknown[] }>({ action: 'listSchedules' });
        if (result && Array.isArray(result.data)) {
          const gasData = result.data as Activity[];
          const merged = mergeDataById(gasData, local, deletedScheduleIds);
          localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn("GAS sync listSchedules failed, returning cached:", err);
      }
    }

    const filtered = local.filter(s => !deletedScheduleIds.includes(s.id));
    if (filtered.length !== local.length) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(filtered));
    }
    return filtered;
  },

  createSchedule: async (activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<Activity> => {
    const config = getAppConfig();
    const newActivity: Activity = {
      id: 's_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...activityData
    };

    const currentList = getFallbackData<Activity>(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
    const updated = [...currentList, newActivity];
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(updated));

    if (isGasActive(config.gasUrl)) {
      try {
        const payload: Record<string, unknown> = {
          action: 'createSchedule',
          title: newActivity.title,
          date: newActivity.date,
          time: newActivity.time,
          endTime: newActivity.endTime || '',
          isAllDay: newActivity.isAllDay,
          reminderMinutes: newActivity.reminderMinutes,
          location: newActivity.location,
          notes: newActivity.notes || ''
        };

        await requestGas(payload);
      } catch (err) {
        console.warn("GAS direct scheduling erred, logged to local planner:", err);
      }
    }

    return newActivity;
  }
};