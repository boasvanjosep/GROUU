/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExternalLink, CreditCard, Calendar, FileText, Settings, Sparkles, Receipt, Database, FolderArchive, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { getAppConfig, isSafeExternalUrl } from '../config';

interface DashboardProps {
  onNavigate: (tab: 'dashboard' | 'archive' | 'quick-entry', subtab?: 'expense' | 'activity' | 'note') => void;
  totals: {
    expensesCount: number;
    expensesAmount: number;
    schedulesCount: number;
    notesCount: number;
    driveFilesCount: number;
  };
  syncing?: boolean;
  lastSync?: Date | null;
}

export function Dashboard({ onNavigate, totals, syncing, lastSync }: DashboardProps) {
  const config = getAppConfig();

  const openExternal = (url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  const hasSheetsUrl = isSafeExternalUrl(config.sheetsUrl, ['docs.google.com']);
  const hasCalendarUrl = isSafeExternalUrl(config.calendarUrl, ['calendar.google.com']);

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totals.expensesAmount || 0);

  const syncLabel = lastSync
    ? `Live \u00b7 ${lastSync.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
    : 'Connecting\u2026';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Dynamic Header Section */}
      <div className="text-center md:text-left mt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B4B0FF]/10 border border-[#B4B0FF]/20 rounded-full text-xs text-[#B4B0FF] mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-sans font-medium">Personal Finance & Productivity Space</span>
        </div>
        <h1 className="font-sans text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight">
          Good morning. 
        </h1>
        <p className="font-sans text-sm text-gray-400 mt-1 max-w-xl">
          What would you like to focus on today?
        </p>
      </div>

      {/* Mini Stats Banner — Live from GAS */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            syncing
              ? 'bg-[#4FD1C5]/10 text-[#4FD1C5] border border-[#4FD1C5]/20'
              : lastSync
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
          }`}>
            {syncing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : lastSync ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span>{syncing ? 'Syncing\u2026' : syncLabel}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5">
          <div className="p-2 border-r border-[#232326]">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Total Pengeluaran</span>
            <span className="text-sm font-semibold text-[#4FD1C5]">{formattedAmount}</span>
          </div>
          <div className="p-2 border-r border-[#232326] pl-4">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Transaksi Ledger</span>
            <span className="text-sm font-semibold text-white">{totals.expensesCount} item</span>
          </div>
          <div className="p-2 border-r border-[#232326] pl-4">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Jadwal Aktif</span>
            <span className="text-sm font-semibold text-white">{totals.schedulesCount} agenda</span>
          </div>
          <div className="p-2 pl-4">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Catatan Vault</span>
            <span className="text-sm font-semibold text-white">{totals.notesCount} draf</span>
            <span className="block text-[10px] font-medium text-gray-500 mt-0.5">{totals.driveFilesCount} file Drive</span>
          </div>
        </div>
      </div>

      {/* 6 Elegant Bento Grid Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: DIRECT ACCESS TO SHEET */}
        <div
          onClick={() => hasSheetsUrl && openExternal(config.sheetsUrl)}
          className={`bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden h-[180px] ${
            hasSheetsUrl
              ? 'hover:bg-[#1C1C1E]/90 hover:border-[#B4B0FF]/50 hover:-translate-y-1 cursor-pointer'
              : 'opacity-70 cursor-not-allowed'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#B4B0FF]/5 rounded-full blur-2xl group-hover:bg-[#B4B0FF]/10 transition-all" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#B4B0FF]/30 to-transparent" />
          
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#B4B0FF]/10 rounded-xl border border-[#B4B0FF]/20 flex items-center justify-center text-[#B4B0FF] group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-gray-400 group-hover:text-[#B4B0FF] transition-colors p-1.5 rounded-lg bg-[#0A0A0B]/50">
              <ExternalLink className="w-4 h-4" />
            </span>
          </div>

          <div>
            <h3 className="font-sans text-base font-bold text-white flex items-center gap-1.5">
              Open Expense Sheets
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1 group-hover:text-gray-200 transition-colors">
              {hasSheetsUrl ? 'Access Google Sheets ledger directly to view custom charts' : 'Add a Google Sheets URL in setup to enable this shortcut'}
            </p>
          </div>
        </div>

        {/* Card 2: DIRECT ACCESS TO CALENDAR */}
        <div
          onClick={() => hasCalendarUrl && openExternal(config.calendarUrl)}
          className={`bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group relative overflow-hidden h-[180px] ${
            hasCalendarUrl
              ? 'hover:bg-[#1C1C1E]/90 hover:border-[#4FD1C5]/50 hover:-translate-y-1 cursor-pointer'
              : 'opacity-70 cursor-not-allowed'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4FD1C5]/5 rounded-full blur-2xl group-hover:bg-[#4FD1C5]/10 transition-all" />
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#4FD1C5]/30 to-transparent" />

          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#4FD1C5]/10 rounded-xl border border-[#4FD1C5]/20 flex items-center justify-center text-[#4FD1C5] group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-gray-400 group-hover:text-[#4FD1C5] transition-colors p-1.5 rounded-lg bg-[#0A0A0B]/50">
              <ExternalLink className="w-4 h-4" />
            </span>
          </div>

          <div>
            <h3 className="font-sans text-base font-bold text-white">
              Open Google Calendar
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1 group-hover:text-gray-200 transition-colors">
              {hasCalendarUrl ? 'Launch Google Web Calendar in new tab to plan your agendas' : 'Add a Google Calendar URL in setup to enable this shortcut'}
            </p>
          </div>
        </div>

        {/* Card 3: QUICK ENTRY - RECORD EXPENSE */}
        <div
          onClick={() => onNavigate('quick-entry', 'expense')}
          className="bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col justify-between hover:bg-[#1C1C1E]/90 hover:border-[#B4B0FF]/40 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative h-[180px]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#B4B0FF]/10 rounded-xl border border-[#B4B0FF]/20 flex items-center justify-center text-[#B4B0FF] group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h3 className="font-sans text-base font-bold text-white group-hover:text-[#B4B0FF] transition-colors">
              Record Expense
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1">
              Log nominal, category, description & payment option locally
            </p>
          </div>
        </div>

        {/* Card 4: QUICK ENTRY - NEW ACTIVITY */}
        <div
          onClick={() => onNavigate('quick-entry', 'activity')}
          className="bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col justify-between hover:bg-[#1C1C1E]/90 hover:border-[#4FD1C5]/40 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative h-[180px]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#4FD1C5]/10 rounded-xl border border-[#4FD1C5]/20 flex items-center justify-center text-[#4FD1C5] group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h3 className="font-sans text-base font-bold text-white group-hover:text-[#4FD1C5] transition-colors">
              New Activity
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1">
              Log calendar tasks specifying times, links & notes seamlessly
            </p>
          </div>
        </div>

        {/* Card 5: QUICK ENTRY - NEW NOTE */}
        <div
          onClick={() => onNavigate('quick-entry', 'note')}
          className="bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col justify-between hover:bg-[#1C1C1E]/90 hover:border-[#B4B0FF]/40 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative h-[180px]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-[#B4B0FF]/10 rounded-xl border border-[#B4B0FF]/25 flex items-center justify-center text-[#B4B0FF] group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h3 className="font-sans text-base font-bold text-white group-hover:text-[#B4B0FF] transition-colors">
              Create Note
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1">
              Drop ideas, URL links, upload files, and secure draft titles
            </p>
          </div>
        </div>

        {/* Card 6: VIEW NOTES ARCHIVE / VAULT */}
        <div
          onClick={() => onNavigate('archive')}
          className="bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col justify-between hover:bg-[#1C1C1E]/90 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 group cursor-pointer relative h-[180px]"
        >
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
              <FolderArchive className="w-5 h-5" />
            </div>
          </div>

          <div>
            <h3 className="font-sans text-base font-bold text-white group-hover:text-white transition-colors">
              Vault / Archive
            </h3>
            <p className="font-sans text-xs text-gray-400 mt-1">
              Retrieve all captured drafts, tags, links, and documents
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
