import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, RefreshCw, ExternalLink, Paperclip, Grid, List, AlertCircle, PlusCircle, X, Trash2, Calendar } from 'lucide-react';
import { Task, TaskProgress } from '../types';

interface TasksProps {
  tasks: Task[];
  loading: boolean;
  onRefresh: () => void;
  onAddTask: (data: Omit<Task, 'id' | 'createdAt'>, file?: { fileName: string; fileData: string }) => Promise<boolean>;
  onDeleteTask: (id: string) => Promise<boolean>;
}

export function Tasks({ tasks, loading, onRefresh, onAddTask, onDeleteTask }: TasksProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form State
  const [newTask, setNewTask] = useState<{
    name: string;
    subject: string;
    progress: TaskProgress;
    deadline: string;
    time: string;
    reminderMinutes: number;
    urls: string[];
  }>({
    name: '',
    subject: '',
    progress: 'Not Yet',
    deadline: '',
    time: '',
    reminderMinutes: 10,
    urls: [],
  });
  const [urlInput, setUrlInput] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.resolve(onRefresh());
    setTimeout(() => setIsRefreshing(false), 800);
  }, [onRefresh]);

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

  const AttachmentLink = ({
    url,
    label,
    icon = 'link',
    className = '',
  }: {
    url: string;
    label: string;
    icon?: 'link' | 'file';
    className?: string;
  }) => {
    const resolvedUrl = useMemo(() => createBlobUrl(url), [url]);

    return (
      <a
        href={resolvedUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
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

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => {
      return (
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase())
      );
    });

    result.sort((a, b) => {
      const dateA = new Date(a.deadline).getTime() || 0;
      const dateB = new Date(b.deadline).getTime() || 0;
      if (dateA !== dateB) return dateA - dateB;
      
      const pOrder = { 'Not Yet': 0, 'On Progress': 1, 'Done': 2 };
      return pOrder[a.progress] - pOrder[b.progress];
    });

    return result;
  }, [tasks, search]);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  const getProgressColor = (progress: TaskProgress) => {
    switch (progress) {
      case 'Done': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'On Progress': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'Not Yet': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const isBusy = loading || isRefreshing;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.name.trim() || !newTask.subject.trim() || !newTask.deadline) return;

    setIsSubmitting(true);
    try {
      let fileDataObj;
      if (fileToUpload) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fileToUpload);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        const pureBase64 = base64.split(',')[1];
        fileDataObj = {
          fileName: fileToUpload.name,
          fileData: pureBase64
        };
      }

      const success = await onAddTask({
        name: newTask.name,
        subject: newTask.subject,
        progress: newTask.progress,
        deadline: newTask.deadline,
        time: newTask.time,
        reminderMinutes: newTask.reminderMinutes,
        urls: newTask.urls,
      } as Omit<Task, 'id' | 'createdAt'>, fileDataObj);

      if (success) {
        setShowCreateModal(false);
        setNewTask({ name: '', subject: '', progress: 'Not Yet', deadline: '', time: '', reminderMinutes: 10, urls: [] });
        setUrlInput('');
        setFileToUpload(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24 relative z-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#232326] pb-4">
        <div>
          <h2 className="font-sans text-2xl font-bold text-white tracking-tight">Tasks</h2>
          <p className="font-sans text-xs text-gray-400 mt-0.5">
            Manage your assignments and track deadlines seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="min-h-[44px] px-3 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] rounded-xl font-sans text-xs font-semibold shadow-md shadow-[#B4B0FF]/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Task</span>
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isBusy}
            className="min-h-[44px] px-3 bg-[#1C1C1E] hover:bg-[#232326] text-gray-400 hover:text-white rounded-xl border border-[#232326] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isBusy ? 'animate-spin text-[#4FD1C5]' : ''}`} />
          </button>

          <div className="hidden md:flex bg-[#0A0A0B] rounded-lg border border-[#232326] p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#B4B0FF]/25 text-[#B4B0FF]' : 'text-gray-500 hover:text-white'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[#B4B0FF]/25 text-[#B4B0FF]' : 'text-gray-500 hover:text-white'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex-1">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search task name or subject..."
          className="w-full pl-9 pr-4 min-h-[44px] bg-[#1C1C1E] border border-[#232326] rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#B4B0FF]"
        />
      </div>

      {isBusy ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5 space-y-4 animate-pulse">
              <div className="h-4 w-1/3 bg-white/5 rounded" />
              <div className="h-5 w-3/4 bg-white/10 rounded" />
              <div className="h-8 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#1C1C1E]/30 border border-dashed border-[#232326] rounded-2xl">
          <AlertCircle className="w-12 h-12 text-gray-500 mb-3 opacity-60" />
          <h4 className="font-sans text-white font-semibold text-base mb-1">No Tasks Found</h4>
          <p className="font-sans text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
            {search ? "No tasks matching your search." : "You have no active tasks."}
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 relative z-30 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filteredTasks.map(task => (
            <article
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-[#1C1C1E] rounded-2xl border border-[#232326] p-5 hover:border-[#B4B0FF]/40 transition-all duration-300 flex flex-col justify-between relative h-full min-h-[190px] cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-white/5 via-transparent rounded-t-2xl" />

              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-[#4FD1C5]/10 border border-[#4FD1C5]/20 text-[#4FD1C5] font-sans text-[9px] font-bold uppercase tracking-wider">
                      {task.subject}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-sans text-[9px] font-bold uppercase tracking-wider border ${getProgressColor(task.progress)}`}>
                      {task.progress}
                    </span>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm("Are you sure you want to delete this task?")) {
                        await onDeleteTask(task.id);
                      }
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-red-400 bg-transparent rounded-xl transition-colors z-40 relative -mr-2 -mt-1"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-sans text-sm font-semibold text-white mb-2 line-clamp-2">
                  {task.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Deadline: {formatDate(task.deadline)} 
                    {task.time ? ` at ${task.time}` : (task.deadline && task.deadline.includes('T') && task.deadline.length > 10 ? ` at ${new Date(task.deadline).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}` : '')}
                  </span>
                </div>
              </div>

              {(task.urls?.length || task.url || task.attachmentName || task.driveFileUrl || task.attachmentUrl) && (
                <div className="pt-3 border-t border-[#232326] flex flex-col gap-2 mt-2 relative z-40">
                  {task.urls && task.urls.length > 0 ? task.urls.map((u, idx) => (
                    <AttachmentLink
                      key={`url-${idx}`}
                      url={u}
                      label={u}
                      icon="link"
                      className="inline-flex items-center gap-2 text-xs text-[#4FD1C5] min-h-[44px] px-1 -mx-1 active:opacity-70"
                    />
                  )) : task.url && (
                    <AttachmentLink
                      url={task.url}
                      label={task.url}
                      icon="link"
                      className="inline-flex items-center gap-2 text-xs text-[#4FD1C5] min-h-[44px] px-1 -mx-1 active:opacity-70"
                    />
                  )}
                  {(() => {
                    const fileUrl = task.driveFileUrl || task.attachmentUrl || '';
                    const fileName = task.attachmentName || 'View Attachment';
                    if (!fileUrl) return null;
                    return (
                      <AttachmentLink
                        url={fileUrl}
                        label={fileName}
                        icon="file"
                        className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/70 border border-[#232326] px-3 py-2.5 rounded-xl w-full transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                      />
                    );
                  })()}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedTask(null)}
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
                  <span className="px-2 py-0.5 rounded bg-[#4FD1C5]/10 border border-[#4FD1C5]/20 text-[#4FD1C5] font-sans text-[9px] font-bold uppercase tracking-wider">
                    {selectedTask.subject}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-sans text-[9px] font-bold uppercase tracking-wider border ${getProgressColor(selectedTask.progress)}`}>
                    {selectedTask.progress}
                  </span>
                  <span className="font-mono text-[10px] text-gray-500 tracking-wider font-semibold uppercase">
                    Deadline: {formatDate(selectedTask.deadline)} {selectedTask.time ? ` at ${selectedTask.time}` : (selectedTask.deadline && selectedTask.deadline.includes('T') && selectedTask.deadline.length > 10 ? ` at ${new Date(selectedTask.deadline).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}` : '')}
                  </span>
                </div>
                <h3 className="font-sans text-lg font-bold text-white tracking-tight leading-snug">
                  {selectedTask.name}
                </h3>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this task?")) {
                      const success = await onDeleteTask(selectedTask.id);
                      if (success) setSelectedTask(null);
                    }
                  }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-300 bg-[#0A0A0B] rounded-xl border border-[#232326] hover:border-red-900/50 transition-all cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white bg-[#0A0A0B] rounded-xl border border-[#232326] hover:border-gray-600 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-6 pt-4 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-2 w-full">
                {selectedTask.urls && selectedTask.urls.length > 0 ? selectedTask.urls.map((u, idx) => (
                  <AttachmentLink
                    key={`modal-url-${idx}`}
                    url={u}
                    label={u}
                    icon="link"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2.5 rounded-xl min-h-[44px] active:scale-[0.98]"
                  />
                )) : selectedTask.url && (
                  <AttachmentLink
                    url={selectedTask.url}
                    label={selectedTask.url}
                    icon="link"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4FD1C5] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2.5 rounded-xl min-h-[44px] active:scale-[0.98]"
                  />
                )}
                
                {(selectedTask.attachmentName || selectedTask.driveFileUrl || selectedTask.attachmentUrl) && (() => {
                  const fileUrl = selectedTask.driveFileUrl || selectedTask.attachmentUrl || '';
                  const fileName = selectedTask.attachmentName || 'View Attachment';
                  if (!fileUrl) return null;
                  return (
                    <AttachmentLink
                      url={fileUrl}
                      label={fileName}
                      icon="file"
                      className="inline-flex items-center gap-2 text-xs text-gray-300 hover:text-[#B4B0FF] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2.5 rounded-xl transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
                    />
                  );
                })()}
              </div>

              <button
                onClick={() => setSelectedTask(null)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-sans text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-[0.98] shrink-0"
              >
                Close Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0A0A0B]/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1C1C1E] border border-[#232326] rounded-2xl shadow-2xl relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#B4B0FF] to-[#4FD1C5] rounded-t-2xl" />
            
            <div className="flex justify-between items-center p-5 border-b border-[#232326]">
              <h3 className="font-sans text-lg font-bold text-white">Create New Task</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white bg-[#0A0A0B] rounded-xl border border-[#232326] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-sans">Task Name</label>
                <input
                  type="text"
                  required
                  value={newTask.name}
                  onChange={e => setNewTask({...newTask, name: e.target.value})}
                  className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF]"
                  placeholder="e.g. Complete User Authentication"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-sans">Subject / Category</label>
                <input
                  type="text"
                  required
                  value={newTask.subject}
                  onChange={e => setNewTask({...newTask, subject: e.target.value})}
                  className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF]"
                  placeholder="e.g. Frontend, Math, Project A"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-sans">Progress</label>
                <select
                  value={newTask.progress}
                  onChange={e => setNewTask({...newTask, progress: e.target.value as TaskProgress})}
                  className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF] appearance-none"
                >
                  <option value="Not Yet">Not Yet</option>
                  <option value="On Progress">On Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-gray-400 font-sans">Deadline</label>
                  <input
                    type="date"
                    required
                    value={newTask.deadline}
                    onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                    className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF] [color-scheme:dark]"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-gray-400 font-sans">Time (Optional)</label>
                  <input
                    type="time"
                    value={newTask.time}
                    onChange={e => setNewTask({...newTask, time: e.target.value})}
                    className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF] [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-sans">Notify Reminder (Calendar)</label>
                <select
                  value={newTask.reminderMinutes}
                  onChange={e => setNewTask({...newTask, reminderMinutes: Number(e.target.value)})}
                  className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF] appearance-none"
                >
                  <option value={0}>At time of event</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                  <option value={-1}>No reminder</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-sans">Reference URLs (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="flex-1 min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#B4B0FF]"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (urlInput) {
                        setNewTask({...newTask, urls: [...newTask.urls, urlInput]});
                        setUrlInput('');
                      }
                    }}
                    className="min-h-[44px] px-4 bg-[#232326] text-white rounded-xl hover:bg-[#2a2a2e] text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                {newTask.urls.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2">
                    {newTask.urls.map((u, i) => (
                      <div key={i} className="flex justify-between items-center text-xs text-[#4FD1C5] bg-[#0A0A0B]/50 border border-[#232326] px-3 py-2 rounded-xl min-h-[36px]">
                        <span className="truncate pr-2">{u}</span>
                        <button type="button" onClick={() => setNewTask({...newTask, urls: newTask.urls.filter((_, idx) => idx !== i)})} className="text-red-400 hover:text-red-300 p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-sans">Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={e => setFileToUpload(e.target.files?.[0] || null)}
                  className="w-full min-h-[44px] bg-[#0A0A0B] border border-[#232326] rounded-xl px-3 py-2 text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#1C1C1E] file:text-white hover:file:bg-[#232326] focus:outline-none focus:border-[#B4B0FF]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] bg-[#B4B0FF] hover:bg-[#B4B0FF]/90 text-[#0A0A0B] font-bold text-sm rounded-xl transition-all mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
