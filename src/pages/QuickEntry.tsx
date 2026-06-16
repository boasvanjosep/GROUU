/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Calendar, FileText, Check, UploadCloud, Link as LinkIcon, AlertCircle, ShoppingBag, Landmark, Wallet, Plus } from 'lucide-react';
import { Expense, Activity, Note } from '../types';

interface QuickEntryProps {
  initialSubtab?: 'expense' | 'activity' | 'note';
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<boolean>;
  onAddActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<boolean>;
  onAddNote: (
    note: Omit<Note, 'id' | 'createdAt'>,
    files?: { fileName: string; fileData: string }[],
    urls?: string[]
  ) => Promise<boolean>;
}

// Konfigurasi Pilihan Dropdown Bertingkat
const BANK_OPTIONS = ['BRI', 'BCA', 'Mandiri', 'BNI', 'Pilih Lain (Isi Sendiri)'];
const WALLET_OPTIONS = ['GoPay', 'OVO', 'Dana', 'ShopeePay', 'Pilih Lain (Isi Sendiri)'];

export function QuickEntry({ initialSubtab = 'expense', onAddExpense, onAddActivity, onAddNote }: QuickEntryProps) {
  const [activeForm, setActiveForm] = useState<'expense' | 'activity' | 'note'>(initialSubtab);

  // Sync state if dashboard shortcut changes current subtab
  useEffect(() => {
    setActiveForm(initialSubtab);
  }, [initialSubtab]);

  // Loading indicator for submission locks
  const [loading, setLoading] = useState(false);

  // --- EXPENSE FORM STATE ---
  const [expenseAmountStr, setExpenseAmountStr] = useState('Rp 0');
  const [expenseRawAmount, setExpenseRawAmount] = useState(0);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'FnB' | 'Mobility' | 'Study' | 'Personal' | 'Fun'>('FnB');
  const [expenseNotes, setExpenseNotes] = useState('');

  // State Baru untuk Dropdown Bertingkat Opsi A
  const [payGroup, setPayGroup] = useState<'Cash' | 'Bank' | 'E-Wallet' | 'Lainnya'>('Cash');
  const [payDetail, setPayDetail] = useState<string>('');
  const [customPay, setCustomPay] = useState<string>('');

  // Auto-reset detail option if group changes
  useEffect(() => {
    if (payGroup === 'Bank') setPayDetail(BANK_OPTIONS[0]);
    else if (payGroup === 'E-Wallet') setPayDetail(WALLET_OPTIONS[0]);
    else setPayDetail('');
    setCustomPay('');
  }, [payGroup]);

  // Auto currency formatter as user types
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    if (!rawVal || rawVal === '0') {
      setExpenseAmountStr('Rp 0');
      setExpenseRawAmount(0);
      return;
    }
    const parsed = parseInt(rawVal, 10);
    setExpenseRawAmount(parsed);
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
    }).format(parsed);
    setExpenseAmountStr(`Rp ${formatted}`);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseRawAmount <= 0) {
      alert("Masukkan nominal pengeluaran yang valid!");
      return;
    }
    if (!expenseDesc.trim()) {
      alert("Masukkan deskripsi atau nama pengeluaran!");
      return;
    }

    // Konstruksi String Gabungan Dinamis (Opsi A)
    let finalPaymentMethod = payGroup as string;
    if (payGroup === 'Bank' || payGroup === 'E-Wallet') {
      if (payDetail === 'Pilih Lain (Isi Sendiri)') {
        if (!customPay.trim()) {
          alert("Silakan ketik nama Bank/E-Wallet khusus Anda!");
          return;
        }
        finalPaymentMethod = `${payGroup} - ${customPay.trim()}`;
      } else {
        finalPaymentMethod = `${payGroup} - ${payDetail}`;
      }
    } else if (payGroup === 'Lainnya') {
      if (!customPay.trim()) {
        alert("Silakan ketik metode pembayaran alternatif Anda!");
        return;
      }
      finalPaymentMethod = customPay.trim();
    }

    setLoading(true);
    const success = await onAddExpense({
      amount: expenseRawAmount,
      description: expenseDesc,
      category: expenseCategory,
      paymentMethod: finalPaymentMethod, // Mengirimkan string gabungan ke API & GAS
      notes: expenseNotes,
    });

    if (success) {
      // Reset form on success
      setExpenseAmountStr('Rp 0');
      setExpenseRawAmount(0);
      setExpenseDesc('');
      setExpenseNotes('');
      setPayGroup('Cash');
    }
    setLoading(false);
  };

  // --- ACTIVITY FORM STATE ---
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDate, setActivityDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [activityTime, setActivityTime] = useState('');
  const [activityEndTime, setActivityEndTime] = useState('');
  const [activityIsAllDay, setActivityIsAllDay] = useState(false);
  const [activityReminderMinutes, setActivityReminderMinutes] = useState<number>(10);
  const [activityLocation, setActivityLocation] = useState('');
  const [activityNotes, setActivityNotes] = useState('');

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim()) {
      alert("Masukkan nama kegiatan/aktivitas!");
      return;
    }
    if (!activityDate || (!activityIsAllDay && !activityTime)) {
      alert("Silakan tentukan tanggal dan waktu kegiatan!");
      return;
    }

    setLoading(true);
    const success = await onAddActivity({
      title: activityTitle,
      date: activityDate,
      time: activityTime,
      endTime: activityEndTime || undefined,
      isAllDay: activityIsAllDay,
      reminderMinutes: activityReminderMinutes,
      location: activityLocation,
      notes: activityNotes,
    });

    if (success) {
      setActivityTitle('');
      setActivityDate(new Date().toISOString().split('T')[0]);
      setActivityTime('');
      setActivityEndTime('');
      setActivityIsAllDay(false);
      setActivityReminderMinutes(10);
      setActivityLocation('');
      setActivityNotes('');
    }
    setLoading(false);
  };

  // --- NOTE FORM STATE ---
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteUrls, setNoteUrls] = useState<string[]>(['']);
  const [noteCategory, setNoteCategory] = useState('Research');
  const [attachedFiles, setAttachedFiles] = useState<{ fileName: string; fileData: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newFiles: { fileName: string; fileData: string }[] = [];
    let processedCount = 0;

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64Str = event.target.result.toString().split(',')[1];
          newFiles.push({
            fileName: file.name,
            fileData: base64Str
          });
        }
        processedCount++;
        if (processedCount === fileArray.length) {
          setAttachedFiles((prev) => [...prev, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleAddUrlField = () => {
    setNoteUrls([...noteUrls, '']);
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...noteUrls];
    newUrls[index] = value;
    setNoteUrls(newUrls);
  };

  const handleRemoveUrl = (index: number) => {
    const newUrls = noteUrls.filter((_, i) => i !== index);
    setNoteUrls(newUrls);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      alert("Masukkan judul catatan!");
      return;
    }
    if (!noteContent.trim()) {
      alert("Ketik isi atau detail catatan Anda terlebih dahulu!");
      return;
    }

    setLoading(true);
    const validUrls = noteUrls.filter(u => u.trim() !== '');

    const success = await onAddNote(
      {
        title: noteTitle,
        content: noteContent,
        category: noteCategory,
      },
      attachedFiles,
      validUrls
    );

    if (success) {
      setNoteTitle('');
      setNoteContent('');
      setNoteUrls(['']);
      setNoteCategory('Research');
      setAttachedFiles([]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-2 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Dynamic Selector Header */}
      <div className="flex flex-col space-y-2 border-b border-[#232326] pb-4">
        <div>
          <h2 className="font-sans text-xl sm:text-2xl font-bold text-white tracking-tight">Quick Entry Workspace</h2>
          <p className="font-sans text-xs text-gray-400 mt-0.5">
            Log financial ledger, planning activities, and design blueprints in one screen.
          </p>
        </div>

        {/* Workspace Tab Bar Selector */}
        <div className="grid grid-cols-3 bg-[#0A0A0B] p-1 rounded-xl border border-[#232326]">
          <button
            onClick={() => setActiveForm('expense')}
            className={`py-2 px-1 sm:py-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold font-sans flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${activeForm === 'expense'
                ? 'bg-[#B4B0FF] text-[#0A0A0B]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Expense</span>
          </button>

          <button
            onClick={() => setActiveForm('activity')}
            className={`py-2 px-1 sm:py-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold font-sans flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${activeForm === 'activity'
                ? 'bg-[#4FD1C5] text-[#0A0A0B]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>

          <button
            onClick={() => setActiveForm('note')}
            className={`py-2 px-1 sm:py-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold font-sans flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${activeForm === 'note'
                ? 'bg-[#B4B0FF] text-[#0A0A0B]'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Note</span>
          </button>
        </div>
      </div>

      {/* ----------------- FORM 1: EXPENSE LEDGER ----------------- */}
      {activeForm === 'expense' && (
        <form onSubmit={handleSaveExpense} className="space-y-5 animate-in fade-in duration-200">
          {/* Gradated Large Amount Card */}
          <div className="relative overflow-hidden bg-gradient-to-tr from-[#1C1C1E] to-[#141416] border border-[#232326] rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-lg">
            <div className="absolute inset-0 bg-radial-gradient from-[#B4B0FF]/10 to-transparent pointer-events-none opacity-40" />

            <label className="font-sans text-xs font-semibold tracking-widest text-[#B4B0FF] uppercase mb-3">
              Nominal Transaksi
            </label>

            <div className="relative flex items-center gap-1 w-full justify-center">
              <input
                type="text"
                value={expenseAmountStr}
                onChange={handleAmountChange}
                placeholder="Rp 0"
                className="bg-transparent border-none text-center font-sans text-3xl md:text-5xl font-bold text-white w-full max-w-[320px] p-0 focus:ring-0 appearance-none outline-none tracking-tight leading-none placeholder-gray-600"
              />
            </div>

            <p className="font-sans text-[11px] text-gray-500 mt-3">
              Type any number sequence directly to format Rp separators automatically
            </p>
          </div>

          {/* Form details */}
          <div className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-4 sm:p-6 space-y-4">
            {/* Description Details */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Deskripsi / Penerima</label>
              <input
                type="text"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                placeholder="misal: Makan Siang, Biaya KRL, Pembelian Buku"
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
              />
            </div>

            {/* Category Chips Custom Selector */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Kategori Pengeluaran</label>
              <div className="flex flex-wrap gap-2 pt-1 select-none">
                {([
                  { id: 'FnB', label: '🍲 Food & Drink' },
                  { id: 'Mobility', label: '🚗 Mobility' },
                  { id: 'Study', label: '📚 Study & Books' },
                  { id: 'Personal', label: '👤 Personal Care' },
                  { id: 'Fun', label: '🕹️ Fun & Hobbies' },
                ] as const).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setExpenseCategory(cat.id)}
                    className={`px-3 py-2 rounded-full font-sans text-[11px] tracking-wide uppercase transition-all cursor-pointer ${expenseCategory === cat.id
                        ? 'bg-[#B4B0FF]/20 text-[#B4B0FF] border border-[#B4B0FF]/50 font-bold shadow-[0_0_10px_rgba(180,176,255,0.15)]'
                        : 'bg-[#0A0A0B] text-gray-400 border border-[#232326] hover:border-gray-600'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Bertingkat - LEVEL 1: GRUP UTAMA */}
            <div className="flex flex-col space-y-2 pt-2">
              <label className="font-sans text-xs font-medium text-gray-400">Metode Pembayaran (Grup)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Cash */}
                <div
                  onClick={() => setPayGroup('Cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${payGroup === 'Cash'
                      ? 'border-[#4FD1C5] bg-[#4FD1C5]/5 text-[#4FD1C5] font-bold'
                      : 'border-[#232326] bg-[#0A0A0B] text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                >
                  <CreditCard className="w-4 h-4 mb-1" />
                  <span className="font-sans text-[11px] uppercase tracking-wide">CASH</span>
                </div>

                {/* Bank */}
                <div
                  onClick={() => setPayGroup('Bank')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${payGroup === 'Bank'
                      ? 'border-[#4FD1C5] bg-[#4FD1C5]/5 text-[#4FD1C5] font-bold'
                      : 'border-[#232326] bg-[#0A0A0B] text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                >
                  <Landmark className="w-4 h-4 mb-1" />
                  <span className="font-sans text-[11px] uppercase tracking-wide">BANK</span>
                </div>

                {/* E-Wallet */}
                <div
                  onClick={() => setPayGroup('E-Wallet')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${payGroup === 'E-Wallet'
                      ? 'border-[#4FD1C5] bg-[#4FD1C5]/5 text-[#4FD1C5] font-bold'
                      : 'border-[#232326] bg-[#0A0A0B] text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                >
                  <Wallet className="w-4 h-4 mb-1" />
                  <span className="font-sans text-[11px] uppercase tracking-wide">E-WALLET</span>
                </div>

                {/* Lainnya */}
                <div
                  onClick={() => setPayGroup('Lainnya')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${payGroup === 'Lainnya'
                      ? 'border-[#4FD1C5] bg-[#4FD1C5]/5 text-[#4FD1C5] font-bold'
                      : 'border-[#232326] bg-[#0A0A0B] text-gray-400 hover:text-white hover:border-gray-600'
                    }`}
                >
                  <Plus className="w-4 h-4 mb-1" />
                  <span className="font-sans text-[11px] uppercase tracking-wide">LAINNYA</span>
                </div>
              </div>
            </div>

            {/* Dropdown Bertingkat - LEVEL 2: DETAIL OPSI */}
            {(payGroup === 'Bank' || payGroup === 'E-Wallet') && (
              <div className="flex flex-col space-y-1 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="font-sans text-xs font-medium text-gray-400">
                  Pilih Detail {payGroup}
                </label>
                <select
                  value={payDetail}
                  onChange={(e) => setPayDetail(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#4FD1C5] cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat' }}
                >
                  {(payGroup === 'Bank' ? BANK_OPTIONS : WALLET_OPTIONS).map((opt) => (
                    <option key={opt} value={opt} className="bg-[#1C1C1E] text-white text-xs">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* INPUT CUSTOM MANUAL (Jika milih Isi Sendiri / Milih Grup Lainnya) */}
            {(payGroup === 'Lainnya' || payDetail === 'Pilih Lain (Isi Sendiri)') && (
              <div className="flex flex-col space-y-1 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="font-sans text-xs font-medium text-[#4FD1C5]">
                  Nama Metode Kustom (Ketik Sendiri)
                </label>
                <input
                  type="text"
                  value={customPay}
                  onChange={(e) => setCustomPay(e.target.value)}
                  placeholder={payGroup === 'Lainnya' ? "misal: Kasbon, Koin Crypto, Barter" : "misal: Bank Jago, SeaBank, Bank Jatim"}
                  className="w-full bg-[#0A0A0B] border border-[#4FD1C5]/40 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#4FD1C5]"
                />
              </div>
            )}

            {/* Optional extra notes */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400 flex justify-between">
                <span>Catatan Tambahan</span>
                <span className="text-[10px] text-gray-500">Optional</span>
              </label>
              <textarea
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                placeholder="Rincian tambahan atau catatan khusus transaksi..."
                rows={2}
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF] resize-none"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B4B0FF] text-[#0A0A0B] py-4 rounded-xl font-sans text-sm font-bold flex justify-center items-center gap-2 hover:bg-[#B4B0FF]/90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#B4B0FF]/10"
          >
            {loading ? 'Processing...' : 'Save Expense Ledger'}
          </button>
        </form>
      )}

      {/* ----------------- FORM 2: NEW ACTIVITY ----------------- */}
      {activeForm === 'activity' && (
        <form onSubmit={handleSaveActivity} className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-4 sm:p-6 space-y-4">
            {/* Title / Activity name */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Nama Kegiatan / Event Title</label>
              <input
                type="text"
                value={activityTitle}
                onChange={(e) => setActivityTitle(e.target.value)}
                placeholder="Sebutkan agenda seperti Q4 Strategy Sync, Daily Retro..."
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#4FD1C5]"
              />
            </div>

            {/* Date & Time Row */}
            <div className={`grid grid-cols-1 ${activityIsAllDay ? 'sm:grid-cols-1' : 'sm:grid-cols-3'} gap-4`}>
              {/* Date */}
              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Tanggal Jadwal</label>
                <input
                  type="date"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#4FD1C5]"
                />
              </div>

              {/* Time Start */}
              {!activityIsAllDay && (
                <div className="flex flex-col space-y-1 animate-in fade-in duration-200">
                  <label className="font-sans text-xs font-medium text-gray-400">Jam Mulai</label>
                  <input
                    type="time"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#4FD1C5]"
                  />
                </div>
              )}

              {/* Time End */}
              {!activityIsAllDay && (
                <div className="flex flex-col space-y-1 animate-in fade-in duration-200">
                  <label className="font-sans text-xs font-medium text-gray-400">Jam Selesai</label>
                  <input
                    type="time"
                    value={activityEndTime}
                    onChange={(e) => setActivityEndTime(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#4FD1C5]"
                  />
                </div>
              )}
            </div>

            {/* Options Row: All Day & Reminder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* All Day Toggle */}
              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Tipe Acara</label>
                <div 
                  className="flex items-center h-[42px] space-x-3 bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 w-full cursor-pointer hover:border-[#4FD1C5]/50 transition-colors"
                  onClick={() => setActivityIsAllDay(!activityIsAllDay)}
                >
                  <label htmlFor="allDayToggle" className="relative inline-flex items-center cursor-pointer pointer-events-none">
                    <input 
                      type="checkbox" 
                      id="allDayToggle" 
                      className="sr-only peer"
                      checked={activityIsAllDay}
                      readOnly
                    />
                    <div className="w-9 h-5 bg-[#232326] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-400 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4FD1C5] peer-checked:after:bg-[#0A0A0B] peer-checked:after:border-[#0A0A0B]"></div>
                  </label>
                  <span className="font-sans text-xs font-medium text-white select-none">
                    Seharian (All Day)
                  </span>
                </div>
              </div>

              {/* Reminder Dropdown */}
              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Pengingat Notifikasi</label>
                <select
                  value={activityReminderMinutes}
                  onChange={(e) => setActivityReminderMinutes(Number(e.target.value))}
                  className="w-full h-[42px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 text-xs text-white focus:outline-none focus:border-[#4FD1C5] cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundSize: '1rem', backgroundRepeat: 'no-repeat' }}
                >
                  <option value={0} className="bg-[#1C1C1E]">Tepat saat acara mulai</option>
                  <option value={5} className="bg-[#1C1C1E]">5 menit sebelum</option>
                  <option value={10} className="bg-[#1C1C1E]">10 menit sebelum (Default)</option>
                  <option value={15} className="bg-[#1C1C1E]">15 menit sebelum</option>
                  <option value={30} className="bg-[#1C1C1E]">30 menit sebelum</option>
                  <option value={60} className="bg-[#1C1C1E]">1 jam sebelum</option>
                  <option value={1440} className="bg-[#1C1C1E]">1 hari sebelum</option>
                </select>
              </div>
            </div>

            {/* Link or Location url */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Lokasi / Tautan Link</label>
              <input
                type="text"
                value={activityLocation}
                onChange={(e) => setActivityLocation(e.target.value)}
                placeholder="Zoom Direct Link, Meeting Room 4B atau Workspace URL"
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#4FD1C5]"
              />
            </div>

            {/* Extra details draft */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Detail Agenda (Materi Briefing)</label>
              <textarea
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Tulis poin-poin agenda yang akan dibahas atau rincian tambahan..."
                rows={4}
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#4FD1C5] resize-none"
              />
            </div>
          </div>

          {/* Activity Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4FD1C5] hover:bg-[#4FD1C5]/95 text-[#0A0A0B] py-4 rounded-xl font-sans text-sm font-bold flex justify-center items-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#4FD1C5]/10"
          >
            {loading ? 'Creating Agenda...' : 'Save Activity Agenda'}
          </button>
        </form>
      )}

      {/* ----------------- FORM 3: RECORD NOTE ----------------- */}
      {activeForm === 'note' && (
        <form onSubmit={handleSaveNote} className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-4 sm:p-6 space-y-4">
            {/* Note Title */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Judul Catatan</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="misal: Q3 Financial Strategy Draft, Ideation UI Refactor"
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
              />
            </div>

            {/* Note category tag */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Kategori Catatan</label>
              <input
                type="text"
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                placeholder="misal: Tech, Finance, Readlist, Personal"
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
              />
            </div>

            {/* Content Textarea */}
            <div className="flex flex-col space-y-1">
              <label className="font-sans text-xs font-medium text-gray-400">Isi Catatan / Note Content</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Ketik draf pikiran penting, riset, atau memo di sini..."
                rows={6}
                className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF] resize-none"
              />
            </div>

            {/* Reference Links */}
            <div className="flex flex-col space-y-2">
              <label className="font-sans text-xs font-medium text-gray-400 flex justify-between items-center">
                <span>Tautan Referensi (URL Link)</span>
                <button
                  type="button"
                  onClick={handleAddUrlField}
                  className="text-[#B4B0FF] hover:text-white text-xs font-bold cursor-pointer"
                >
                  + Tambah Tautan
                </button>
              </label>
              {noteUrls.map((url, index) => (
                <div key={index} className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder="https://docs.google.com/..."
                      className="w-full pl-9 bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
                    />
                  </div>
                  {noteUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUrl(index)}
                      className="text-red-400 hover:text-red-300 p-2 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Drop Files / Media Selector Zone */}
            <div className="flex flex-col space-y-1 pt-2">
              <label className="font-sans text-xs font-medium text-gray-400">Lampiran Drive / File Pendukung</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#232326] hover:border-[#B4B0FF]/60 hover:bg-[#0A0A0B]/50 cursor-pointer rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-[#0A0A0B]/10 group select-none"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                />
                <UploadCloud className="w-8 h-8 text-gray-500 group-hover:text-[#B4B0FF] mb-2 transition-transform duration-300 group-hover:translate-y-[-2px]" />
                <span className="font-sans text-xs font-semibold text-gray-300 group-hover:text-[#B4B0FF] transition-colors mb-1">
                  {attachedFiles.length > 0 ? `${attachedFiles.length} File(s) Attached` : 'Drop files here, or browse'}
                </span>
                <span className="font-mono text-[10px] text-gray-500 truncate max-w-[220px] sm:max-w-md">
                  {attachedFiles.length > 0 ? attachedFiles.map(f => f.fileName).join(', ') : 'Binary payload will base64-upload to Drive'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Note Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B4B0FF] text-[#0A0A0B] py-4 rounded-xl font-sans text-sm font-bold flex justify-center items-center gap-2 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#B4B0FF]/15"
          >
            {loading ? 'Saving Draft in Cloud...' : 'Commit Note Entry'}
          </button>
        </form>
      )}
    </div>
  );
}