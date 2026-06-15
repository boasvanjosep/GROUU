/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, FolderArchive, PlusSquare } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'dashboard' | 'archive' | 'quick-entry';
  setActiveTab: (tab: 'dashboard' | 'archive' | 'quick-entry') => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden bg-[#141416]/95 backdrop-blur-xl border-t border-[#232326] py-1.5 pb-safe">
      <div className="flex justify-around items-center px-4 w-full">
        {/* Dashboard Menu Button */}
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-label="Dashboard"
          className={`flex flex-col items-center justify-center py-2 flex-1 transition-all duration-300 ${
            activeTab === 'dashboard'
              ? 'text-[#B4B0FF] scale-105 filter drop-shadow-[0_0_8px_rgba(180,176,255,0.4)]'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="font-sans text-[10px] tracking-tight">Dashboard</span>
        </button>

        {/* Quick Entry Button (Central, visually outstanding) */}
        <button
          onClick={() => setActiveTab('quick-entry')}
          aria-label="Quick Entry"
          className={`flex flex-col items-center justify-center py-2 flex-1 transition-all duration-300 ${
            activeTab === 'quick-entry'
              ? 'text-[#4FD1C5] scale-110 filter drop-shadow-[0_0_8px_rgba(79,209,197,0.4)]'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'quick-entry' ? 'bg-[#4FD1C5]/10' : ''}`}>
            <PlusSquare className="w-5 h-5" />
          </div>
          <span className="font-sans text-[10px] tracking-tight">Quick Entry</span>
        </button>

        {/* Notes Archive button */}
        <button
          onClick={() => setActiveTab('archive')}
          aria-label="Archive"
          className={`flex flex-col items-center justify-center py-2 flex-1 transition-all duration-300 ${
            activeTab === 'archive'
              ? 'text-[#B4B0FF] scale-105 filter drop-shadow-[0_0_8px_rgba(180,176,255,0.4)]'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <FolderArchive className="w-5 h-5 mb-0.5" />
          <span className="font-sans text-[10px] tracking-tight">Vault Arc</span>
        </button>
      </div>
    </nav>
  );
}
