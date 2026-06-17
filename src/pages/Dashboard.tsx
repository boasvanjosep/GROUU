/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { ExternalLink, CreditCard, Calendar as CalendarIcon, FileText, Settings, Sparkles, Receipt, Database, FolderArchive, RefreshCw, Wifi, WifiOff, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { getAppConfig, isSafeExternalUrl } from '../config';
import { Activity } from '../types';

interface DashboardProps {
  onNavigate: (tab: 'dashboard' | 'archive' | 'quick-entry', subtab?: 'expense' | 'activity' | 'note') => void;
  totals: {
    expensesCount: number;
    expensesAmount: number;
    schedulesCount: number;
    notesCount: number;
    driveFilesCount: number;
    activeTasksCount?: number;
    monthlyExpenseAmount?: number;
  };
  syncing?: boolean;
  lastSync?: Date | null;
  schedules?: Activity[];
}

export function Dashboard({ onNavigate, totals, syncing, lastSync, schedules }: DashboardProps) {
  const config = getAppConfig();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return 'Good morning.';
    if (hour >= 12 && hour < 17) return 'Good afternoon.';
    return 'Good evening.';
  };

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

  const formattedMonthlyAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totals.monthlyExpenseAmount || 0);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonthCount = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonthCount; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const selectedDateStr = selectedDate ? selectedDate.toLocaleDateString('sv-SE') : '';
  const eventsOnSelectedDate = (schedules || []).filter(s => s.date === selectedDateStr);

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
          {getGreeting()}
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
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5">
          <div className="p-2 border-r border-[#232326]">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Total Pengeluaran</span>
            <span className="text-sm font-semibold text-[#4FD1C5]">{formattedAmount}</span>
          </div>
          <div className="p-2 border-[#232326] pl-4 lg:border-r">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Bulan Ini</span>
            <span className="text-sm font-semibold text-[#4FD1C5]">{formattedMonthlyAmount}</span>
          </div>
          <div className="p-2 border-r border-[#232326] lg:pl-4">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Task Aktif</span>
            <span className="text-sm font-semibold text-white">{totals.activeTasksCount || 0} task</span>
          </div>
          <div className="p-2 border-[#232326] pl-4 lg:border-r">
            <span className="block font-sans text-[11px] text-gray-500 uppercase tracking-widest font-semibold">Transaksi Ledger</span>
            <span className="text-sm font-semibold text-white">{totals.expensesCount} item</span>
          </div>
          <div className="p-2 border-r border-[#232326] lg:pl-4">
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

      {/* Real-time Calendar Section */}
      <div className="bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 flex flex-col md:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 max-w-[320px] mx-auto md:mx-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-sans font-bold capitalize">
              {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-1 text-gray-400 hover:text-white bg-[#0A0A0B] rounded-lg border border-[#232326] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={handleNextMonth} className="p-1 text-gray-400 hover:text-white bg-[#0A0A0B] rounded-lg border border-[#232326] transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-[10px] font-semibold text-gray-500 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysInMonth.map((date, i) => {
              if (!date) return <div key={i} className="p-2" />;
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              const hasEvents = (schedules || []).some(s => s.date === date.toLocaleDateString('sv-SE'));
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`p-2 rounded-lg text-sm cursor-pointer transition-colors relative ${
                    isSelected ? 'bg-[#B4B0FF] text-[#0A0A0B] font-bold' :
                    isToday ? 'bg-[#232326] text-white' : 'text-gray-400 hover:bg-[#232326] hover:text-white'
                  }`}
                >
                  {date.getDate()}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#4FD1C5] rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Event Details */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-[#232326] pt-5 md:pt-0 md:pl-6">
          <h4 className="text-white font-sans font-semibold mb-3">
            {selectedDate ? selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Pilih Tanggal'}
          </h4>
          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
            {eventsOnSelectedDate.length === 0 ? (
              <div className="bg-[#0A0A0B]/50 p-4 rounded-xl border border-dashed border-[#232326] text-center">
                <p className="text-gray-500 text-xs">Tidak ada jadwal pada tanggal ini.</p>
              </div>
            ) : (
              eventsOnSelectedDate.map(event => (
                <div key={event.id} className="bg-[#0A0A0B] p-3.5 rounded-xl border border-[#232326] hover:border-[#4FD1C5]/30 transition-colors">
                  <div className="flex justify-between items-start mb-1.5 gap-2">
                    <span className="text-white font-semibold text-sm leading-tight">{event.title}</span>
                    <span className="text-[10px] font-bold text-[#4FD1C5] whitespace-nowrap bg-[#4FD1C5]/10 px-2 py-0.5 rounded-md border border-[#4FD1C5]/20">
                      {event.isAllDay ? 'All Day' : event.time}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {event.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{event.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <CalendarIcon className="w-5 h-5" />
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
      </div>
    </div>
  );
}
