/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { Search, RotateCw, ExternalLink, Paperclip, Grid, List, Tag, AlertCircle, PlusCircle, X, Trash2 } from 'lucide-react';
import { Note } from '../types';

interface ArchiveProps {
  notes: Note[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateToCreate: () => void;
  onDeleteNote?: (id: string) => Promise<boolean>;
}

export function Archive({ notes, loading, onRefresh, onNavigateToCreate, onDeleteNote }: ArchiveProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Helper: open attachment URL safely (data: URIs are blocked by browsers in new tabs)
  const openAttachment = useCallback((url: string) => {
    if (url.startsWith('data:')) {
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        })
        .catch(() => {
          window.open(url, '_blank');
        });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Compute unique tag categories listed in notes
  const tags = useMemo(() => {
    const list = new Set<string>();
    notes.forEach(n => {
      if (n.category) list.add(n.category);
    });
    return Array.from(list);
  }, [notes]);

  // Clean filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch =
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchTag = !selectedTag || n.category === selectedTag;
      return matchSearch && matchTag;
    });
  }, [notes, search, selectedTag]);

  // Helper date formatter
  const formatDate = (isoStr: string) => {
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Title Header with action elements */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232326] pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-white tracking-tight">Archive Vault</h2>
          <p className="font-sans text-xs text-gray-400 mt-0.5">
            A quiet, beautiful space for saved thoughts, references, and attachments.
          </p>
        </div>

        {/* Header tools */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-[#1C1C1E] hover:bg-[#1C1C1E]/80 text-gray-400 hover:text-white rounded-xl border border-[#232326] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Refresh notes repository"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-sans text-xs font-semibold hidden md:inline">Refresh Data</span>
          </button>

          {/* Grid Toggle */}
          <div className="hidden md:flex bg-[#0A0A0B] rounded-lg border border-[#232326] p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-[#B4B0FF]/25 text-[#B4B0FF]' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-[#B4B0FF]/25 text-[#B4B0FF]' : 'text-gray-500 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes content or titles..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1E] border border-[#232326] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
          />
        </div>

        {/* Categories Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full font-sans text-[11px] tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
              !selectedTag
                ? 'bg-[#B4B0FF] text-[#0A0A0B] font-bold border border-[#B4B0FF]/50'
                : 'bg-[#1C1C1E] text-gray-400 border border-[#232326] hover:border-gray-600'
            }`}
          >
            All drafts
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full font-sans text-[11px] tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#B4B0FF] text-[#0A0A0B] font-bold border border-[#B4B0FF]/50'
                  : 'bg-[#1C1C1E] text-gray-400 border border-[#232326] hover:border-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton Mode */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-3 w-16 bg-white/5 rounded" />
                <div className="h-5 w-12 bg-white/5 rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-white/10 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 rounded" />
                <div className="h-3 w-5/6 bg-white/5 rounded" />
              </div>
              <div className="h-8 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#1C1C1E]/30 border border-dashed border-[#232326] rounded-2xl">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-3 opacity-60" />
          <h4 className="font-sans text-white font-semibold text-base mb-1">No Notes Found</h4>
          <p className="font-sans text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
            {search || selectedTag
              ? "We couldn't locate notes matching your filter keywords. Try clear search strings or select 'All drafts'."
              : "Your physical vault archive is empty. Keep track of inspiration, bookmarks, and papers instantly."}
          </p>
          <button
            onClick={onNavigateToCreate}
            className="px-4 py-2 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-sans text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#B4B0FF]/15 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create Note Draft
          </button>
        </div>
      ) : (
        /* Notes Listing Multi-columns Layout */
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredNotes.map(note => (
            <article
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5 hover:border-[#B4B0FF]/40 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden h-full min-h-[190px] cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/5 via-transparent" />
              
              <div>
                {/* Meta details Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    <span className="font-mono text-[10px] text-gray-500 tracking-wider font-semibold uppercase">
                      {formatDate(note.createdAt)}
                    </span>
                    {note.category && (
                      <span className="px-2 py-0.5 rounded bg-[#B4B0FF]/10 border border-[#B4B0FF]/20 text-[#B4B0FF] font-sans text-[9px] font-bold uppercase tracking-wider">
                        {note.category}
                      </span>
                    )}
                  </div>
                  {onDeleteNote && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this note?")) {
                          await onDeleteNote(note.id);
                        }
                      }}
                      className="p-1 text-gray-500 hover:text-red-400 bg-transparent rounded transition-colors z-10 relative"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-sans text-sm font-semibold text-white group-hover:text-[#B4B0FF] transition-colors mb-2 line-clamp-1">
                  {note.title || "Untitled Note"}
                </h3>

                {/* Content text */}
                <p className="font-sans text-xs text-gray-400 leading-relaxed mb-4 line-clamp-4 whitespace-pre-line">
                  {note.content}
                </p>
              </div>

              {/* Extra Attachments / Embedded Links footer */}
              {(note.url || note.attachmentName || (note.urls && note.urls.length > 0) || (note.attachments && note.attachments.length > 0)) && (
                <div className="pt-3 border-t border-[#232326] flex flex-col gap-1.5 mt-2">
                  {/* Note URL */}
                  {note.url && (
                    <a
                      href={note.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] hover:text-[#4FD1C5]/85 transition-colors w-fit"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-sans text-[11px] truncate max-w-[170px] md:max-w-[210px]">{note.url}</span>
                    </a>
                  )}
                  {note.urls?.map((u, i) => (
                    <a
                      key={`url-${i}`}
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] hover:text-[#4FD1C5]/85 transition-colors w-fit"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-sans text-[11px] truncate max-w-[170px] md:max-w-[210px]">{u}</span>
                    </a>
                  ))}

                  {/* Attachment metadata */}
                  {note.attachmentName && (
                    <a
                      href={note.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (note.attachmentUrl?.startsWith('data:')) {
                          e.preventDefault();
                          openAttachment(note.attachmentUrl!);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-2.5 py-1 rounded-lg w-fit transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-gray-500" />
                      <span className="font-mono text-[10px] tracking-wide truncate max-w-[150px] md:max-w-[190px]">
                        {note.attachmentName}
                      </span>
                    </a>
                  )}
                  {note.attachments?.map((att, i) => (
                    <a
                      key={`att-${i}`}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (att.url.startsWith('data:')) {
                          e.preventDefault();
                          openAttachment(att.url);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-2.5 py-1 rounded-lg w-fit transition-colors cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3 text-gray-500" />
                      <span className="font-mono text-[10px] tracking-wide truncate max-w-[150px] md:max-w-[190px]">
                        {att.name}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#1C1C1E] border border-[#232326] rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#B4B0FF] to-[#4FD1C5]" />
            
            {/* Header */}
            <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-[#232326]">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] text-gray-500 tracking-wider font-semibold uppercase">
                    {formatDate(selectedNote.createdAt)}
                  </span>
                  {selectedNote.category && (
                    <span className="px-2 py-0.5 rounded bg-[#B4B0FF]/10 border border-[#B4B0FF]/20 text-[#B4B0FF] font-sans text-[9px] font-bold uppercase tracking-wider">
                      {selectedNote.category}
                    </span>
                  )}
                </div>
                <h3 className="font-sans text-lg font-bold text-white tracking-tight leading-snug">
                  {selectedNote.title || "Untitled Note"}
                </h3>
              </div>
              <div className="flex gap-2 items-center">
                {onDeleteNote && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this note?")) {
                        const success = await onDeleteNote(selectedNote.id);
                        if (success) setSelectedNote(null);
                      }
                    }}
                    className="p-1 px-2 text-red-400 hover:text-red-300 bg-[#0A0A0B] rounded-lg border border-[#232326] hover:border-red-900/50 transition-all cursor-pointer flex items-center justify-center"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedNote(null)}
                  className="p-1 px-2 text-gray-400 hover:text-white bg-[#0A0A0B] rounded-lg border border-[#232326] hover:border-gray-600 transition-all cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-800">
              <p className="font-sans text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                {selectedNote.content}
              </p>
            </div>

            {/* Footer with links / attachments */}
            <div className="pt-4 border-t border-[#232326] flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div className="flex flex-wrap gap-2">
                {selectedNote.url && (
                  <a
                    href={selectedNote.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] hover:text-[#4FD1C5]/85 transition-colors bg-[#0A0A0B]/50 border border-[#232326] px-3 py-1.5 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="font-sans text-[11px] truncate max-w-[180px]">{selectedNote.url}</span>
                  </a>
                )}
                {selectedNote.urls?.map((u, i) => (
                  <a
                    key={`modal-url-${i}`}
                    href={u}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] hover:text-[#4FD1C5]/85 transition-colors bg-[#0A0A0B]/50 border border-[#232326] px-3 py-1.5 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="font-sans text-[11px] truncate max-w-[180px]">{u}</span>
                  </a>
                ))}

                {selectedNote.attachmentName && (
                  <a
                    href={selectedNote.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (selectedNote.attachmentUrl?.startsWith('data:')) {
                        e.preventDefault();
                        openAttachment(selectedNote.attachmentUrl!);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-mono text-[10px] tracking-wide truncate max-w-[180px]">
                      {selectedNote.attachmentName}
                    </span>
                  </a>
                )}
                {selectedNote.attachments?.map((att, i) => (
                  <a
                    key={`modal-att-${i}`}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (att.url.startsWith('data:')) {
                        e.preventDefault();
                        openAttachment(att.url);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-mono text-[10px] tracking-wide truncate max-w-[180px]">
                      {att.name}
                    </span>
                  </a>
                ))}
              </div>

              <button
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                Close Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
