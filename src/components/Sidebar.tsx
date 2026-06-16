/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, FolderArchive, PlusCircle, Settings, X, Check, LogOut } from 'lucide-react';
import { getAppConfig, updateAppConfig, resetAppConfig, logoutAppConfig } from '../config';
import { isAllowedGasUrl } from '../utils/gasUrl';

interface SidebarProps {
  activeTab: 'dashboard' | 'archive' | 'quick-entry' | 'tasks';
  setActiveTab: (tab: 'dashboard' | 'archive' | 'quick-entry' | 'tasks') => void;
  onRefresh?: () => void;
  onConfigChange?: () => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, onRefresh, onConfigChange, showSettings, setShowSettings }: SidebarProps) {
  const [config, setConfig] = useState(getAppConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isConnected = isAllowedGasUrl(config.gasUrl);
  const displayName = config.userName.trim() || 'Guest User';
  const displayRole = config.userRole.trim() || (isConnected ? 'Connected Workspace' : 'Signed out');
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'GU';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppConfig(config.gasUrl, config.sheetsUrl, config.calendarUrl, config.userName, config.userRole, config.grouuToken);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setShowSettings(false);
      if (onConfigChange) onConfigChange();
      if (onRefresh) onRefresh();
    }, 1200);
  };

  const handleReset = () => {
    resetAppConfig();
    const resetVals = getAppConfig();
    setConfig(resetVals);
    setSaveSuccess(true);
    if (onConfigChange) onConfigChange();
    if (onRefresh) onRefresh();
    setTimeout(() => setSaveSuccess(false), 1200);
  };

  const handleLogout = () => {
    logoutAppConfig();
    const loggedOut = getAppConfig();
    setConfig(loggedOut);
    setShowSettings(false);
    if (onConfigChange) onConfigChange();
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <aside className="hidden md:flex flex-col h-screen w-64 border-r border-[#232326] bg-[#141416] p-8 space-y-6 sticky top-0 shrink-0 z-20">
        {/* Brand Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-[#B4B0FF]/10 border border-[#B4B0FF]/30 flex items-center justify-center text-[#B4B0FF]">
              <span className="font-mono text-xs font-bold">G</span>
            </div>
            <div>
              <h1 className="font-sans text-xl font-bold tracking-tighter text-[#B4B0FF]">
                GROUU
              </h1>
              <p className="font-sans text-[11px] text-gray-500 tracking-wider uppercase font-semibold">
                Finance & Productivity
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 flex flex-col space-y-2">
          {/* Dashboard Item */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${activeTab === 'dashboard'
                ? 'text-[#B4B0FF] bg-[#1C1C1E] border border-[#232326] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]/50'
              }`}
          >
            {activeTab === 'dashboard' && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#B4B0FF] rounded-r-full" />
            )}
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#B4B0FF]' : 'text-gray-500'}`} />
            <span className="font-sans text-sm font-medium">Dashboard</span>
          </button>

          {/* Tasks Item */}
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${activeTab === 'tasks'
                ? 'text-[#B4B0FF] bg-[#1C1C1E] border border-[#232326] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]/50'
              }`}
          >
            {activeTab === 'tasks' && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#B4B0FF] rounded-r-full" />
            )}
            <svg className={`w-5 h-5 ${activeTab === 'tasks' ? 'text-[#B4B0FF]' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"/></svg>
            <span className="font-sans text-sm font-medium">Tasks</span>
          </button>

          {/* Archive / Vault Item */}
          <button
            onClick={() => setActiveTab('archive')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${activeTab === 'archive'
                ? 'text-[#B4B0FF] bg-[#1C1C1E] border border-[#232326] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]/50'
              }`}
          >
            {activeTab === 'archive' && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#B4B0FF] rounded-r-full" />
            )}
            <FolderArchive className={`w-5 h-5 ${activeTab === 'archive' ? 'text-[#B4B0FF]' : 'text-gray-500'}`} />
            <span className="font-sans text-sm font-medium">Notes Archive</span>
          </button>

          {/* Quick Entry Item */}
          <button
            onClick={() => setActiveTab('quick-entry')}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative ${activeTab === 'quick-entry'
                ? 'text-[#B4B0FF] bg-[#1C1C1E] border border-[#232326] font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1C1C1E]/50'
              }`}
          >
            {activeTab === 'quick-entry' && (
              <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#B4B0FF] rounded-r-full" />
            )}
            <PlusCircle className={`w-5 h-5 ${activeTab === 'quick-entry' ? 'text-[#B4B0FF]' : 'text-gray-500'}`} />
            <span className="font-sans text-sm font-medium">Quick Entry</span>
          </button>

          {/* Quick Config Setting Indicator */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl cursor-pointer text-gray-400 hover:text-white hover:bg-[#1C1C1E]/30 transition-all text-left mt-8 border border-dashed border-[#232326]"
          >
            <Settings className="w-5 h-5 text-gray-500" />
            <div className="flex-1 truncate">
              <span className="block font-sans text-xs">API Gateway</span>
              <span className="block font-sans text-[10px] text-gray-500 truncate">
                {isConnected ? 'Connected' : 'Signed out'}
              </span>
            </div>
          </button>
        </nav>

        {/* User profile footer */}
        <div className="pt-4 border-t border-[#232326] flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-full bg-[#232326] hover:bg-[#B4B0FF]/15 border border-transparent hover:border-[#B4B0FF]/30 flex items-center justify-center text-xs font-bold text-white uppercase font-sans transition-all"
            title="Edit user profile"
          >
            {initials}
          </button>
          <div className="flex-1 leading-tight min-w-0">
            <p className="font-sans text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="font-sans text-[10px] text-gray-500 truncate">{displayRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
            title="Sign out and clear API gateway"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Configuration modal / drawer */}
      {showSettings && (
        <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-[#1C1C1E] border border-[#232326] rounded-2xl p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#B4B0FF] to-[#4FD1C5]" />

            <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
              <div>
                <h3 className="font-sans text-lg font-bold text-white">GROUU Google Setup</h3>
                <p className="font-sans text-xs text-gray-400">Link with your Google Apps Script, Sheets & Calendar API</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 px-2 text-gray-400 hover:text-white bg-[#0A0A0B] rounded-lg border border-[#232326]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="font-sans text-xs text-gray-400">User Display Name</label>
                  <input
                    type="text"
                    value={config.userName}
                    onChange={(e) => setConfig({ ...config, userName: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-[#0A0A0B] border border-[#232326] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B4B0FF]"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="font-sans text-xs text-gray-400">User Label</label>
                  <input
                    type="text"
                    value={config.userRole}
                    onChange={(e) => setConfig({ ...config, userRole: e.target.value })}
                    placeholder="Local Workspace"
                    className="w-full bg-[#0A0A0B] border border-[#232326] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B4B0FF]"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs text-gray-400">Google Apps Script API Gateway URL</label>
                <input
                  type="text"
                  value={config.gasUrl}
                  onChange={(e) => setConfig({ ...config, gasUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-[#0A0A0B] border border-[#232326] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#B4B0FF]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs text-gray-400">GROUU Access Token (grouuToken)</label>
                <input
                  type="password"
                  value={config.grouuToken}
                  onChange={(e) => setConfig({ ...config, grouuToken: e.target.value })}
                  placeholder="Token rahasia dari Script Properties (GROUU_TOKEN)"
                  className="w-full bg-[#0A0A0B] border border-[#232326] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#B4B0FF]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs text-gray-400">Google Sheets Expense URL (Direct Link)</label>
                <input
                  type="text"
                  value={config.sheetsUrl}
                  onChange={(e) => setConfig({ ...config, sheetsUrl: e.target.value })}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full bg-[#0A0A0B] border border-[#232326] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#B4B0FF]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs text-gray-400">Google Calendar URL (Web Interface)</label>
                <input
                  type="text"
                  value={config.calendarUrl}
                  onChange={(e) => setConfig({ ...config, calendarUrl: e.target.value })}
                  placeholder="https://calendar.google.com"
                  className="w-full bg-[#0A0A0B] border border-[#232326] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#B4B0FF]"
                />
              </div>

              <div className="bg-[#0A0A0B]/50 border border-[#232326] p-3 rounded-lg">
                <p className="font-sans text-[11px] text-gray-400 leading-relaxed">
                  <span className="font-semibold text-gray-300">Privacy note:</span> GROUU starts in a safe local workspace. Add your own Apps Script, Sheets, and Calendar URLs to sync with your Google assets. Reset clears those URLs and returns to local-only mode.
                </p>
              </div>

              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#232326] shrink-0">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-2 bg-[#0A0A0B] hover:bg-white/10 text-gray-400 font-sans text-xs rounded-lg border border-[#232326] transition-all"
                  >
                    Reset to Safe Empty
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-2 bg-[#0A0A0B] hover:bg-red-500/10 text-red-400 font-sans text-xs rounded-lg border border-red-500/20 transition-all"
                  >
                    Sign Out
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 bg-[#0A0A0B] hover:bg-white/10 text-gray-400 font-sans text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-sans text-xs font-semibold rounded-lg flex items-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Saved
                      </>
                    ) : (
                      'Save Config'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}