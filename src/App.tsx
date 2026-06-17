/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { Dashboard } from './pages/Dashboard';
import { Archive } from './pages/Archive';
import { QuickEntry } from './pages/QuickEntry';
import { Tasks } from './pages/Tasks';
import { Note, Expense, Activity, Task } from './types';
import { apiService, STORAGE_KEYS, INITIAL_NOTES, INITIAL_EXPENSES, INITIAL_SCHEDULE, INITIAL_TASKS, DashboardStats } from './services/api';
import { getAppConfig } from './config';
import { Terminal, Database, Sparkles, Sliders } from 'lucide-react';

export default function App() {
  // Navigation Routing States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'archive' | 'quick-entry' | 'tasks'>('dashboard');
  const [activeSubtab, setActiveSubtab] = useState<'expense' | 'activity' | 'note'>('expense');
  const [showSettings, setShowSettings] = useState(false);

  // Cohesive Local Database states synced with localStorage & Google services
  const [notes, setNotes] = useState<Note[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [schedules, setSchedules] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Loading & Toaster feedback overlays state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Real-time GAS dashboard stats (polled from sheet)
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);
  const [statsSyncing, setStatsSyncing] = useState(false);
  const [lastStatsSync, setLastStatsSync] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLiveStats = useCallback(async () => {
    setStatsSyncing(true);
    const stats = await apiService.getDashboardStats();
    if (stats) {
      setLiveStats(stats);
      setLastStatsSync(new Date());
    } else {
      setLiveStats(null);
      setLastStatsSync(null);
    }
    setStatsSyncing(false);
  }, []);

  // Helper notice toaster
  const triggerToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // Synchronize data payloads representing real entries
  const reloadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Load from cache immediately for instant display
      const cachedNotes: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || 'null') || INITIAL_NOTES;
      setNotes(cachedNotes);
      const cachedExpenses: Expense[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || 'null') || INITIAL_EXPENSES;
      setExpenses(cachedExpenses);
      const cachedSchedules: Activity[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULE) || 'null') || INITIAL_SCHEDULE;
      setSchedules(cachedSchedules);
      const cachedTasks: Task[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || 'null') || INITIAL_TASKS;
      setTasks(cachedTasks);

      // Only fetch from GAS on explicit refresh (silent=false) to avoid overwriting
      // local state with stale GAS data. List functions now merge localStorage data
      // with GAS responses and track deleted IDs for consistency.
      if (!silent) {
        const [dbNotes, dbExpenses, dbSchedules, dbTasks] = await Promise.all([
          apiService.listNotes(),
          apiService.listExpenses(),
          apiService.listSchedules(),
          apiService.listTasks()
        ]);
        setNotes(dbNotes);
        setExpenses(dbExpenses);
        setSchedules(dbSchedules);
        setTasks(dbTasks);
        triggerToast('Data synced successfully', 'success');
      }
    } catch (err) {
      if (!silent) {
        triggerToast('Sync failed. Loaded offline mode.', 'info');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Run initial state loading
  useEffect(() => {
    reloadData(true);
  }, []);

  // Auto-refresh: hit GAS when switching to data tabs
  useEffect(() => {
    if (activeTab === 'archive') {
      // Always fetch notes fresh from GAS when opening Archive
      setLoading(true);
      apiService.listNotes()
        .then(dbNotes => {
          setNotes(dbNotes);
        })
        .catch(() => {
          // silently fall back to cached state
        })
        .finally(() => setLoading(false));
    } else if (activeTab === 'tasks') {
      setLoading(true);
      apiService.listTasks()
        .then(dbTasks => {
          setTasks(dbTasks);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (activeTab === 'dashboard') {
      reloadData(true);
    }
  }, [activeTab]);

  // Real-time polling: fetch dashboard stats from GAS every 30s
  useEffect(() => {
    fetchLiveStats();
    pollRef.current = setInterval(fetchLiveStats, 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchLiveStats]);

  // --- CONTROLLER SUBMIT ACTIONS ---
  
  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const saved = await apiService.createExpense(expenseData);
      setExpenses((prev) => [saved, ...prev]);

      const rupiahFormatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(expenseData.amount);

      triggerToast(`Expense saved! ${rupiahFormatted} for "${expenseData.description}"`, 'success');
      return true;
    } catch (err) {
      triggerToast('Error recording expense', 'error');
      return false;
    }
  };

  const handleAddActivity = async (activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const saved = await apiService.createSchedule(activityData);
      setSchedules((prev) => [...prev, saved]);
      triggerToast(`Activity scheduled: "${activityData.title}"`, 'success');
      return true;
    } catch (err) {
      triggerToast('Error creating calendar schedule', 'error');
      return false;
    }
  };

  const handleAddNote = async (
    noteData: Omit<Note, 'id' | 'createdAt'>,
    files?: { fileName: string; fileData: string }[],
    urls?: string[]
  ): Promise<boolean> => {
    try {
      const saved = await apiService.createNote(noteData, files, urls);
      setNotes((prev) => [saved, ...prev]);
      triggerToast(`Note "${noteData.title}" secured in your Vault Archive`, 'success');
      return true;
    } catch (err) {
      triggerToast('Error saving note', 'error');
      return false;
    }
  };

  const handleDeleteNote = async (id: string): Promise<boolean> => {
    try {
      const success = await apiService.deleteNote(id);
      if (success) {
        setNotes((prev) => prev.filter(n => n.id !== id));
        triggerToast('Note successfully deleted from Vault', 'success');
        return true;
      }
      return false;
    } catch (err) {
      triggerToast('Error deleting note', 'error');
      return false;
    }
  };

  // Dedicated notes-only refresh — always fetches from GAS, used by Archive Refresh button
  const handleRefreshNotes = useCallback(async () => {
    setLoading(true);
    try {
      const dbNotes = await apiService.listNotes();
      setNotes(dbNotes);
      triggerToast('Notes synced from cloud', 'success');
    } catch {
      triggerToast('Could not reach cloud. Showing cached data.', 'info');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshTasks = useCallback(async () => {
    setLoading(true);
    try {
      const dbTasks = await apiService.listTasks();
      setTasks(dbTasks);
      triggerToast('Tasks synced from cloud', 'success');
    } catch {
      triggerToast('Could not reach cloud. Showing cached data.', 'info');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddTask = async (
    taskData: Omit<Task, 'id' | 'createdAt'>,
    file?: { fileName: string; fileData: string }
  ): Promise<boolean> => {
    try {
      const saved = await apiService.createTask(taskData, file);
      setTasks((prev) => [saved, ...prev]);
      triggerToast(`Task "${taskData.name}" created successfully`, 'success');
      return true;
    } catch (err) {
      triggerToast('Error creating task', 'error');
      return false;
    }
  };

  const handleDeleteTask = async (id: string): Promise<boolean> => {
    try {
      const success = await apiService.deleteTask(id);
      if (success) {
        setTasks((prev) => prev.filter(t => t.id !== id));
        triggerToast('Task deleted successfully', 'success');
        return true;
      }
      return false;
    } catch (err) {
      triggerToast('Error deleting task', 'error');
      return false;
    }
  };

  const activeTasksCount = tasks.filter(t => t.progress !== 'Done').length;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenseAmount = expenses
    .filter(e => {
      if (!e.createdAt) return false;
      const d = new Date(e.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const totals = liveStats
    ? {
        expensesCount: liveStats.totalLedgerItems,
        expensesAmount: liveStats.totalExpense,
        schedulesCount: liveStats.totalSchedules,
        notesCount: liveStats.totalNotes,
        driveFilesCount: liveStats.totalDriveFiles,
        activeTasksCount,
        monthlyExpenseAmount,
      }
    : {
        expensesCount: 0,
        expensesAmount: 0,
        schedulesCount: 0,
        notesCount: 0,
        driveFilesCount: 0,
        activeTasksCount,
        monthlyExpenseAmount,
      };

  const handleDashboardShortcutNavigate = (
    tab: 'dashboard' | 'archive' | 'quick-entry' | 'tasks',
    subtab?: 'expense' | 'activity' | 'note'
  ) => {
    setActiveTab(tab);
    if (subtab) {
      setActiveSubtab(subtab);
    }
  };

  const handleConfigChange = () => {
    setLiveStats(null);
    setLastStatsSync(null);
    fetchLiveStats();
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans flex flex-col md:flex-row antialiased select-none selection:bg-[#B4B0FF]/30 selection:text-[#B4B0FF]">
      {/* Background ambient light vectors */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#B4B0FF]/5 rounded-full blur-[110px] pointer-events-none mix-blend-screen z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#4FD1C5]/5 rounded-full blur-[110px] pointer-events-none mix-blend-screen z-0" />

      {/* Desktop Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => reloadData(false)}
        onConfigChange={handleConfigChange}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 w-full z-30 bg-[#141416]/85 backdrop-blur-xl border-b border-[#232326] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => setActiveTab('dashboard')}>
          <div className="w-7 h-7 rounded-md bg-[#B4B0FF]/10 border border-[#B4B0FF]/30 flex items-center justify-center text-[#B4B0FF]">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-sans text-base font-bold tracking-tighter text-[#B4B0FF]">
            GROUU
          </span>
        </div>
        
        {/* Dynamic status pill */}
        <div 
          onClick={() => setShowSettings(true)}
          className={`cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border ${
          statsSyncing
            ? 'bg-[#4FD1C5]/10 text-[#4FD1C5] border-[#4FD1C5]/20'
            : liveStats
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-[#1C1C1E] text-gray-400 border-[#232326]'
        }`}>
          {statsSyncing ? (
            <Sliders className="w-3 h-3 animate-spin" />
          ) : liveStats ? (
            <Database className="w-3 h-3" />
          ) : (
            <Database className="w-3 h-3 text-gray-500" />
          )}
          <span>{statsSyncing ? 'Syncing\u2026' : liveStats ? 'Live Synced' : 'Local Vault'}</span>
        </div>
      </header>

      {/* Main Content Area Canvas Container */}
      <main
        className="flex-1 min-w-0 max-w-7xl mx-auto w-full px-4 md:px-10 py-6 overflow-y-auto relative z-10"
        style={{ paddingBottom: 'max(7rem, calc(5rem + env(safe-area-inset-bottom, 0px)))' }}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={handleDashboardShortcutNavigate}
            totals={totals}
            syncing={statsSyncing}
            lastSync={lastStatsSync}
            schedules={schedules}
          />
        )}

        {activeTab === 'archive' && (
          <Archive
            notes={notes}
            loading={loading}
            onRefresh={handleRefreshNotes}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {activeTab === 'tasks' && (
          <Tasks
            tasks={tasks}
            loading={loading}
            onRefresh={handleRefreshTasks}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'quick-entry' && (
          <QuickEntry
            initialSubtab={activeSubtab}
            onAddExpense={handleAddExpense}
            onAddActivity={handleAddActivity}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation controls */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Elegant Global Toaster Overlay notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
