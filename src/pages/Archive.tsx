/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, RefreshCw, ExternalLink, Paperclip, Grid, List, AlertCircle, PlusCircle, X, Trash2, Link as LinkIcon, UploadCloud } from 'lucide-react';
import { Note } from '../types';

interface ArchiveProps {
  notes: Note[];
  loading: boolean;
  onRefresh: () => void;
  onAddNote?: (
    note: Omit<Note, 'id' | 'createdAt'>,
    files?: { fileName: string; fileData: string }[],
    urls?: string[]
  ) => Promise<boolean>;
  onDeleteNote?: (id: string) => Promise<boolean>;
}

export function Archive({ notes, loading, onRefresh, onAddNote, onDeleteNote }: ArchiveProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form State for Create Note
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteUrls, setNoteUrls] = useState<string[]>(['']);
  const [noteCategory, setNoteCategory] = useState('Research');
  const [attachedFiles, setAttachedFiles] = useState<{ fileName: string; fileData: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setAttachedFiles(prev => [...prev, {
          fileName: file.name,
          fileData: base64String
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };
  const handleAddUrlField = () => setNoteUrls([...noteUrls, '']);
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...noteUrls];
    newUrls[index] = value;
    setNoteUrls(newUrls);
  };
  const handleRemoveUrl = (index: number) => setNoteUrls(noteUrls.filter((_, i) => i !== index));

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || !onAddNote) return;

    setIsSubmitting(true);
    const validUrls = noteUrls.filter(u => u.trim() !== '');

    const success = await onAddNote(
      { title: noteTitle, content: noteContent, category: noteCategory },
      attachedFiles,
      validUrls
    );

    if (success) {
      setNoteTitle('');
      setNoteContent('');
      setNoteUrls(['']);
      setNoteCategory('Research');
      setAttachedFiles([]);
      setShowCreateModal(false);
    }
    setIsSubmitting(false);
  };

  // Auto-fetch on mount — ensures fresh data every time the Archive tab is opened
  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX SINKRONISASI: Refetch otomatis saat tab/window aktif kembali
  // Ini memastikan data sinkron antar device/browser tanpa perlu tekan Refresh manual
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onRefresh();
      }
    };
    const handleFocus = () => {
      onRefresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onRefresh]);

  // Manual refresh handler with local loading state
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.resolve(onRefresh());
    setTimeout(() => setIsRefreshing(false), 800);
  }, [onRefresh]);

  /**
   * FIX MOBILE FILE LINK:
   * Sebelumnya menggunakan openAttachment() dengan window.location.href atau window.open()
   * yang diblokir Safari iOS di async handler.
   *
   * Solusi: gunakan <a href target="_blank"> native HTML untuk semua link attachment.
   * Fungsi ini hanya digunakan sebagai fallback untuk data: URI (base64 blob lokal).
   */
  const createBlobUrl = useCallback((rawUrl: string): string => {
    if (rawUrl.startsWith('data:')) {
      try {
        const [header, b64] = rawUrl.split(',');
        const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
      } catch {
        return rawUrl;
      }
    }
    return rawUrl;
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

  const isBusy = loading || isRefreshing;

  /**
   * Komponen AttachmentLink — render <a> native HTML.
   * FIX MOBILE: <a href target="_blank"> selalu diizinkan browser mobile,
   * tidak seperti window.open() di async handler yang diblokir Safari iOS.
   * Untuk data: URI (base64 lokal), konversi ke Blob URL dulu via createBlobUrl().
   */
  const AttachmentLink = ({
    url,
    label,
    icon = 'link',
    className = '',
    onClick,
  }: {
    url: string;
    label: string;
    icon?: 'link' | 'file';
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => {
    const resolvedUrl = useMemo(() => createBlobUrl(url), [url]);

    return (
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation(); // cegah card onClick terpanggil
          onClick?.(e);
        }}
        className={className}
      >
        {icon === 'file' ? (
          <>
            <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="font-mono text-[10px] tracking-wide truncate flex-1 text-left">{label}</span>
            <ExternalLink className="w-3 h-3 text-gray-600 shrink-0" />
          </>
        ) : (
          <>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="font-sans text-[11px] truncate max-w-[170px] md:max-w-[210px]">{label}</span>
          </>
        )}
      </a>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-safe-or-8">
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="min-h-[44px] px-4 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md shadow-[#B4B0FF]/15"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create Note</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isBusy}
            className="min-h-[44px] px-3 bg-[#1C1C1E] hover:bg-[#232326] text-gray-400 hover:text-white rounded-xl border border-[#232326] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            title="Sync notes from cloud"
          >
            <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin text-[#4FD1C5]' : ''}`} />
            <span className="font-sans text-xs font-semibold hidden md:inline">
              {isBusy ? 'Syncing…' : 'Refresh'}
            </span>
          </button>

          <div className="hidden md:flex bg-[#0A0A0B] rounded-lg border border-[#232326] p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#B4B0FF]/25 text-[#B4B0FF]' : 'text-gray-500 hover:text-white'
                }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#B4B0FF]/25 text-[#B4B0FF]' : 'text-gray-500 hover:text-white'
                }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes content or titles..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#1C1C1E] border border-[#232326] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none no-scrollbar">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 rounded-full font-sans text-[11px] tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer min-h-[36px] ${!selectedTag
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
              className={`px-3 py-1.5 rounded-full font-sans text-[11px] tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer min-h-[36px] ${selectedTag === tag
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
      {isBusy ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#1C1C1E]/30 border border-dashed border-[#232326] rounded-2xl">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-3 opacity-60" />
          <h4 className="font-sans text-white font-semibold text-base mb-1">No Notes Found</h4>
          <p className="font-sans text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
            {search || selectedTag
              ? "We couldn't locate notes matching your filter keywords. Try clear search strings or select 'All drafts'."
              : "Your physical vault archive is empty. Keep track of inspiration, bookmarks, and papers instantly."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="min-h-[44px] px-4 py-2 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-sans text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#B4B0FF]/15 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Create Note Draft
          </button>
        </div>
      ) : (
        <div className={`grid gap-4 relative z-20 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredNotes.map(note => (
            <article
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5 hover:border-[#B4B0FF]/40 transition-all duration-300 flex flex-col justify-between group relative h-full min-h-[190px] cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/5 via-transparent rounded-t-2xl" />

              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center flex-wrap">
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
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-400 bg-transparent rounded-xl transition-colors z-10 relative -mr-2 -mt-1"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-sans text-sm font-semibold text-white group-hover:text-[#B4B0FF] transition-colors mb-2 line-clamp-1">
                  {note.title || "Untitled Note"}
                </h3>

                <p className="font-sans text-xs text-gray-400 leading-relaxed mb-4 line-clamp-4 whitespace-pre-line">
                  {note.content}
                </p>
              </div>

              {/* Attachments / Links footer */}
              {(note.url || note.attachmentName || note.driveFileUrl || (note.urls && note.urls.length > 0) || (note.attachments && note.attachments.length > 0)) && (
                <div className="pt-3 border-t border-[#232326] flex flex-col gap-2 mt-2 relative z-10">
                  {/* Note URL — FIX: handle comma-separated URLs */}
                  {(() => {
                    const links = new Set<string>();
                    if (note.url) note.url.split(',').forEach(u => links.add(u.trim()));
                    if (note.urls) note.urls.forEach(u => links.add(u.trim()));
                    
                    return Array.from(links).filter(Boolean).map((u, i) => (
                      <AttachmentLink
                        key={`url-${i}`}
                        url={u}
                        label={u}
                        icon="link"
                        className="inline-flex items-center gap-2 text-xs text-[#4FD1C5] min-h-[44px] px-1 -mx-1 active:opacity-70"
                      />
                    ));
                  })()}

                  {/* Drive file attachment — FIX: handle comma-separated drive URLs */}
                  {(() => {
                    const fileUrls: string[] = [];
                    if (note.driveFileUrl) {
                      fileUrls.push(...note.driveFileUrl.split(',').map(s => s.trim()).filter(Boolean));
                    } else if (note.attachmentUrl) {
                      fileUrls.push(...note.attachmentUrl.split(',').map(s => s.trim()).filter(Boolean));
                    }

                    if (fileUrls.length === 0) return null;

                    const fileNames = note.attachmentName
                      ? note.attachmentName.split(',').map(s => s.trim()).filter(Boolean)
                      : [];

                    return fileUrls.map((fUrl, i) => {
                      const fName = fileNames[i] || (fileUrls.length > 1 ? `View Attachment ${i + 1}` : 'View Attachment');
                      return (
                        <AttachmentLink
                          key={`file-${i}`}
                          url={fUrl}
                          label={fName}
                          icon="file"
                          className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/70 border border-[#232326] px-3 py-2.5 rounded-xl w-full transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                        />
                      );
                    });
                  })()}

                  {/* Local attachments */}
                  {note.attachments?.map((att, i) => (
                    <AttachmentLink
                      key={`att-${i}`}
                      url={att.url}
                      label={att.name}
                      icon="file"
                      className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/70 border border-[#232326] px-3 py-2.5 rounded-xl w-full transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div
          className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="w-full sm:max-w-2xl bg-[#1C1C1E] border border-[#232326] sm:rounded-2xl rounded-t-2xl shadow-2xl relative flex flex-col"
            style={{
              maxHeight: 'calc(92dvh - env(safe-area-inset-bottom, 0px))',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#B4B0FF] to-[#4FD1C5] rounded-t-2xl" />

            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            <div className="flex justify-between items-start gap-4 px-6 pb-4 pt-3 border-b border-[#232326]">
              <div className="flex-1 min-w-0">
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
              <div className="flex gap-2 items-center shrink-0">
                {onDeleteNote && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this note?")) {
                        const success = await onDeleteNote(selectedNote.id);
                        if (success) setSelectedNote(null);
                      }
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-300 bg-[#0A0A0B] rounded-xl border border-[#232326] hover:border-red-900/50 transition-all cursor-pointer"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedNote(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white bg-[#0A0A0B] rounded-xl border border-[#232326] hover:border-gray-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
              <p className="font-sans text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                {selectedNote.content}
              </p>
            </div>

            {/* Modal footer: links/attachments */}
            <div className="px-6 pt-4 pb-5 border-t border-[#232326] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const links = new Set<string>();
                  if (selectedNote.url) selectedNote.url.split(',').forEach(u => links.add(u.trim()));
                  if (selectedNote.urls) selectedNote.urls.forEach(u => links.add(u.trim()));
                  
                  return Array.from(links).filter(Boolean).map((u, i) => (
                    <AttachmentLink
                      key={`modal-url-${i}`}
                      url={u}
                      label={u}
                      icon="link"
                      className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2.5 rounded-xl min-h-[44px] active:scale-[0.98]"
                    />
                  ));
                })()}

                {(() => {
                  const fileUrls: string[] = [];
                  if (selectedNote.driveFileUrl) {
                    fileUrls.push(...selectedNote.driveFileUrl.split(',').map(s => s.trim()).filter(Boolean));
                  } else if (selectedNote.attachmentUrl) {
                    fileUrls.push(...selectedNote.attachmentUrl.split(',').map(s => s.trim()).filter(Boolean));
                  }

                  if (fileUrls.length === 0) return null;

                  const fileNames = selectedNote.attachmentName
                    ? selectedNote.attachmentName.split(',').map(s => s.trim()).filter(Boolean)
                    : [];

                  return fileUrls.map((fUrl, i) => {
                    const fName = fileNames[i] || (fileUrls.length > 1 ? `View Attachment ${i + 1}` : 'View Attachment');
                    return (
                      <AttachmentLink
                        key={`modal-file-${i}`}
                        url={fUrl}
                        label={fName}
                        icon="file"
                        className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                      />
                    );
                  });
                })()}

                {selectedNote.attachments?.map((att, i) => (
                  <AttachmentLink
                    key={`modal-att-${i}`}
                    url={att.url}
                    label={att.name}
                    icon="file"
                    className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                  />
                ))}
              </div>

              <button
                onClick={() => setSelectedNote(null)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                Close Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-2xl bg-[#1C1C1E] border border-[#232326] sm:rounded-2xl rounded-t-2xl shadow-2xl relative flex flex-col"
               style={{ maxHeight: 'calc(92dvh - env(safe-area-inset-bottom, 0px))' }}>
            
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#B4B0FF] to-[#4FD1C5] rounded-t-2xl" />
            <div className="flex justify-center pt-3 pb-1 md:hidden"><div className="w-10 h-1 bg-gray-600 rounded-full" /></div>

            <div className="flex justify-between items-center px-6 pb-4 pt-3 border-b border-[#232326]">
              <h3 className="font-sans text-lg font-bold text-white tracking-tight leading-snug">Create New Note</h3>
              <button onClick={() => setShowCreateModal(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white bg-[#0A0A0B] rounded-xl border border-[#232326] transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Judul Catatan</label>
                <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="misal: Q3 Financial Strategy Draft" className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:border-[#B4B0FF] outline-none" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Kategori Catatan</label>
                <input type="text" value={noteCategory} onChange={(e) => setNoteCategory(e.target.value)} placeholder="misal: Tech, Finance" className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:border-[#B4B0FF] outline-none" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Isi Catatan</label>
                <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Ketik draf pikiran penting..." rows={5} className="w-full bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:border-[#B4B0FF] resize-none outline-none" />
              </div>
              
              <div className="flex flex-col space-y-2">
                <label className="font-sans text-xs font-medium text-gray-400 flex justify-between items-center">
                  <span>Tautan Referensi (URL Link)</span>
                  <button type="button" onClick={handleAddUrlField} className="text-[#B4B0FF] hover:text-white text-xs font-bold cursor-pointer">+ Tambah</button>
                </label>
                {noteUrls.map((url, index) => (
                  <div key={index} className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="url" value={url} onChange={(e) => handleUrlChange(index, e.target.value)} placeholder="https://..." className="w-full pl-9 bg-[#0A0A0B] border border-[#232326] rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:border-[#B4B0FF] outline-none" />
                    </div>
                    {noteUrls.length > 1 && (
                      <button type="button" onClick={() => handleRemoveUrl(index)} className="text-red-400 hover:text-red-300 p-2 text-xs font-bold cursor-pointer">✕</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-sans text-xs font-medium text-gray-400">Lampiran File</label>
                <div onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#232326] hover:border-[#B4B0FF]/60 cursor-pointer rounded-xl p-4 flex flex-col items-center text-center transition-all bg-[#0A0A0B]/10">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                  <UploadCloud className="w-6 h-6 text-gray-500 mb-2" />
                  <span className="font-sans text-xs font-semibold text-gray-300">
                    {attachedFiles.length > 0 ? `${attachedFiles.length} File(s) Attached` : 'Click or Drop files here'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#232326]">
              <button
                onClick={handleSaveNote}
                disabled={isSubmitting || !noteTitle.trim() || !noteContent.trim()}
                className="w-full bg-[#B4B0FF] text-[#0A0A0B] py-3 rounded-xl font-sans text-sm font-bold active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}