/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const config = {
    success: {
      bg: 'bg-[#1C1C1E]/95 border-emerald-500/30',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
    },
    error: {
      bg: 'bg-[#1C1C1E]/95 border-rose-500/30',
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
    },
    info: {
      bg: 'bg-[#1C1C1E]/95 border-[#4FD1C5]/30',
      icon: <Info className="w-5 h-5 text-[#4FD1C5]" />,
      glow: 'shadow-[0_0_15px_rgba(79,209,197,0.15)]',
    },
  }[type];

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm md:max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`p-4 rounded-xl border ${config.bg} ${config.glow} flex items-center justify-between gap-3 text-sm text-white backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          {config.icon}
          <span className="font-sans font-medium tracking-tight leading-snug">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#0A0A0B] rounded text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
