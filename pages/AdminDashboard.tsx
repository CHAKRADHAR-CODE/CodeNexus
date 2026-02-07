
import React, { useState, useMemo, useEffect } from 'react';
import { User, Topic, DailyChallengeSet, Module, DailyProblem, PlatformType, UserRole } from '../types';
import Layout from '../components/Layout';
import { 
  Plus, 
  Trash2, 
  Save, 
  Settings2,
  ExternalLink,
  Users,
  Play,
  FileText,
  Code,
  Download,
  Ban,
  CheckCircle,
  ChevronRight,
  Database,
  Calendar as CalendarIcon,
  Layers,
  Search,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Edit3,
  X,
  PlusCircle,
  Eye,
  FileSpreadsheet,
  Check,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Clock,
  AlertTriangle,
  Loader2,
  DatabaseZap
} from 'lucide-react';
import { saveUser } from "../services/api";
import { socket } from "../services/socket";

interface AdminDashboardProps {
  user: User;
  users: User[];
  setUsers: (users: User[]) => void;
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
  challenges: DailyChallengeSet[];
  setChallenges: (challenges: DailyChallengeSet[]) => void;
  onLogout: () => void;
  isDark: boolean;
  setDark: (dark: boolean) => void;
}

type AdminTab = 'PATHS' | 'DAILY' | 'USERS';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, users, setUsers, topics, setTopics, challenges, setChallenges, onLogout, isDark, setDark 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('PATHS');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topics[0]?.id || null);
  const [searchUser, setSearchUser] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isSavingToMongo, setIsSavingToMongo] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Deletion State
  const [pathToDelete, setPathToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- AUTO SAVE SYSTEM ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveUser({
        name: user.name,
        email: user.email,
        updatedAt: Date.now(),
        // Potentially syncing current state
        topics,
        challenges,
        usersCount: users.length
      });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [topics, challenges, users, user]);

  // --- REAL TIME LISTENER (REFINED: NO PAGE RELOAD) ---
  useEffect(() => {
    socket.on("dataUpdated", (payload) => {
      console.log("Live update received", payload);
      
      // Trigger UI re-render without reload by creating fresh references
      setTopics(prev => [...prev]);
      setChallenges(prev => [...prev]);
      setUsers(prev => [...prev]);
    });
    
    return () => {
      socket.off("dataUpdated");
    };
  }, [setTopics, setChallenges, setUsers]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const selectedTopic = useMemo(() => topics.find(t => t.id === selectedTopicId), [topics, selectedTopicId]);

  const handleSave = async () => {
    setIsSavingToMongo(true);
    try {
      await saveUser({
        name: "AI Studio User",
        email: "demo@test.com"
      });
      notify('Demo data saved to MongoDB Atlas');
    } catch (err) {
      notify('Error saving to MongoDB', 'error');
    } finally {
      setIsSavingToMongo(false);
    }
  };

  // --- CALENDAR LOGIC ---
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const changeMonth = (dir: 'prev' | 'next') => {
    if (dir === 'prev') {
      if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
      else setCurrentMonth(currentMonth - 1);
    } else {
      if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
      else setCurrentMonth(currentMonth + 1);
    }
  };

  const getChallengeForDate = (dateStr: string) => challenges.find(c => c.date === dateStr);

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setEditingDate(dateStr);
  };

  const saveChallenge = (dateStr: string, problems: DailyProblem[]) => {
    const existingIdx = challenges.findIndex(c => c.date === dateStr);
    let newChallenges = [...challenges];
    if (existingIdx > -1) {
      newChallenges[existingIdx] = { ...newChallenges[existingIdx], problems };
    } else {
      newChallenges.push({ id: `ch-${Date.now()}`, date: dateStr, problems });
    }
    setChallenges(newChallenges);
    notify('Challenge updated for ' + dateStr);
  };

  // --- PATH HELPERS ---
  const addPath = () => {
    const newPath: Topic = { id: `path-${Date.now()}`, title: 'New Path', description: 'Describe...', icon: 'Binary', modules: [], interviewQuestions: [] };
    setTopics([...topics, newPath]);
    setSelectedTopicId(newPath.id);
    notify('Path created');
  };

  const updateTopic = (updated: Topic) => setTopics(topics.map(t => t.id === updated.id ? updated : t));

  const confirmDeletePath = async () => {
    if (!pathToDelete) return;
    setIsDeleting(true);
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 600));

    const remainingPaths = topics.filter(t => t.id !== pathToDelete);
    setTopics(remainingPaths);
    
    if (selectedTopicId === pathToDelete) {
      setSelectedTopicId(remainingPaths[0]?.id || null);
    }
    
    setPathToDelete(null);
    setIsDeleting(false);
    notify('Path deleted successfully');
  };

  const movePath = (index: number, direction: 'up' | 'down') => {
    const newTopics = [...topics];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < newTopics.length) {
      [newTopics[index], newTopics[target]] = [newTopics[target], newTopics[index]];
      setTopics(newTopics);
    }
  };

  // --- MODULE HELPERS ---
  const addModule = () => {
    if (!selectedTopic) return;
    const newMod: Module = { id: `mod-${Date.now()}`, title: 'New Module', description: '', problems: [] };
    updateTopic({ ...selectedTopic, modules: [...selectedTopic.modules, newMod] });
  };
  const updateModule = (modId: string, data: Partial<Module>) => {
    if (!selectedTopic) return;
    updateTopic({ ...selectedTopic, modules: selectedTopic.modules.map(m => m.id === modId ? { ...m, ...data } : m) });
  };
  const deleteModule = (modId: string) => {
    if (!selectedTopic) return;
    updateTopic({ ...selectedTopic, modules: selectedTopic.modules.filter(m => m.id !== modId) });
  };
  const moveModule = (index: number, direction: 'up' | 'down') => {
    if (!selectedTopic) return;
    const newModules = [...selectedTopic.modules];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < newModules.length) {
      [newModules[index], newModules[target]] = [newModules[target], newModules[index]];
      updateTopic({ ...selectedTopic, modules: newModules });
    }
  };

  // --- CONTENT HELPERS ---
  const addProblemToModule = (modId: string) => {
    if (!selectedTopic) return;
    const newProblem: DailyProblem = { id: `prob-${Date.now()}`, title: 'New Problem', description: '', difficulty: 'EASY', points: 10, platform: PlatformType.LEETCODE, externalLink: '' };
    updateModule(modId, { problems: [...(selectedTopic.modules.find(m => m.id === modId)?.problems || []), newProblem] });
  };
  const updateProblem = (modId: string, probId: string, data: Partial<DailyProblem>) => {
    if (!selectedTopic) return;
    const mod = selectedTopic.modules.find(m => m.id === modId);
    if (mod) updateModule(modId, { problems: mod.problems.map(p => p.id === probId ? { ...p, ...data } : p) });
  };
  const deleteProblem = (modId: string, probId: string) => {
    if (!selectedTopic) return;
    const mod = selectedTopic.modules.find(m => m.id === modId);
    if (mod) updateModule(modId, { problems: mod.problems.filter(p => p.id !== probId) });
  };

  // --- USER HELPERS ---
  const toggleBlockUser = (id: string) => {
    if (id === user.id) return;
    setUsers(users.map(u => u.id === id ? { ...u, isBlocked: !u.isBlocked } : u));
    notify('User status updated');
  };
  const exportUsers = (format: 'csv' | 'excel') => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'XP', 'Streak', 'Status'];
    const data = users.map(u => [u.id, u.name, u.email, u.role, u.points || 0, u.streak || 0, u.isBlocked ? 'Blocked' : 'Active']);
    const content = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codenexus_users.${format}`;
    a.click();
    notify('Users exported');
  };

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark}>
      <div className="max-w-7xl mx-auto pb-20 animate-fade">
        {/* SUPER PANEL HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg">
              <Settings2 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Super Panel</h1>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Platform Curriculum & User Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleSave}
              disabled={isSavingToMongo}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-md text-[12px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {isSavingToMongo ? <Loader2 size={14} className="animate-spin" /> : <DatabaseZap size={14} />}
              Manual Sync
            </button>

            <div className="flex p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-border">
              {[
                { id: 'PATHS', label: 'Paths', icon: <Layers size={14} /> },
                { id: 'DAILY', label: 'Daily', icon: <CalendarIcon size={14} /> },
                { id: 'USERS', label: 'Users', icon: <Users size={14} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-brand-accent shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FEEDBACK TOAST */}
        {feedback && (
          <div className={`fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade border ${
            feedback.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'
          }`}>
            <Check size={18} />
            <span className="text-[13px] font-bold">{feedback.msg}</span>
          </div>
        )}

        {/* TAB CONTENT: PATHS */}
        {activeTab === 'PATHS' && (
          <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            <aside className="w-full lg:w-64 space-y-4 shrink-0">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pathways List</h3>
                <button onClick={addPath} className="p-1 text-slate-400 hover:text-brand-accent transition-colors" title="Create New Path">
                  <PlusCircle size={18} />
                </button>
              </div>
              <div className="space-y-1">
                {topics.map((t, idx) => (
                  <div key={t.id} className="group relative">
                    <button
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-bold transition-all border ${
                        selectedTopicId === t.id 
                        ? 'bg-brand-accent/5 text-brand-accent border-brand-accent/30 shadow-sm' 
                        : 'bg-white dark:bg-zinc-900 border-border hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <span className="truncate pr-4">{t.title}</span>
                      <ChevronRight size={14} className={`shrink-0 transition-opacity ${selectedTopicId === t.id ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                    
                    {/* Floating Controls: Reorder & Delete */}
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10 scale-90 group-hover:scale-100">
                      <button onClick={(e) => { e.stopPropagation(); movePath(idx, 'up'); }} className="bg-white dark:bg-zinc-800 p-1 rounded-md border border-border shadow-md hover:text-brand-accent"><ArrowUp size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setPathToDelete(t.id); }} className="bg-white dark:bg-zinc-800 p-1 rounded-md border border-border shadow-md hover:text-red-500"><Trash2 size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); movePath(idx, 'down'); }} className="bg-white dark:bg-zinc-800 p-1 rounded-md border border-border shadow-md hover:text-brand-accent"><ArrowDown size={10} /></button>
                    </div>
                  </div>
                ))}

                {topics.length === 0 && (
                  <div className="py-8 text-center px-4">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">No pathways created yet. Start by clicking the plus icon.</p>
                  </div>
                )}
              </div>
            </aside>

            <div className="flex-1 space-y-8">
              {selectedTopic ? (
                <div className="space-y-8 animate-fade">
                  <div className="bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-border shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 max-w-2xl space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Edit3 size={14} />
                          <input 
                            value={selectedTopic.title} 
                            onChange={e => updateTopic({ ...selectedTopic, title: e.target.value })}
                            className="text-2xl font-bold bg-transparent border-none outline-none focus:text-brand-accent w-full"
                          />
                        </div>
                        <textarea 
                          value={selectedTopic.description}
                          onChange={e => updateTopic({ ...selectedTopic, description: e.target.value })}
                          className="w-full bg-transparent border-none outline-none text-[14px] text-slate-500 font-medium resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Modules</h3>
                      <button onClick={addModule} className="flex items-center gap-2 text-[12px] font-bold text-brand-accent bg-brand-accent/5 px-4 py-1.5 rounded-lg border border-brand-accent/10 hover:bg-brand-accent/10 transition-all">
                        <Plus size={16} /> Add Module
                      </button>
                    </div>
                    {selectedTopic.modules.map((mod, mIdx) => (
                      <div key={mod.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-border shadow-sm overflow-hidden group">
                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <input value={mod.title} onChange={e => updateModule(mod.id, { title: e.target.value })} className="bg-transparent border-none outline-none font-bold text-[14px] flex-1" />
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => deleteModule(mod.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input value={mod.videoUrl || ''} onChange={e => updateModule(mod.id, { videoUrl: e.target.value })} placeholder="Video Embed URL" className="bg-slate-50 dark:bg-zinc-950 border border-border px-3 py-2 rounded-lg text-[12px] outline-none" />
                            <input value={mod.pdfUrl || ''} onChange={e => updateModule(mod.id, { pdfUrl: e.target.value })} placeholder="PDF View URL" className="bg-slate-50 dark:bg-zinc-950 border border-border px-3 py-2 rounded-lg text-[12px] outline-none" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between"><label className="text-[10px] font-bold text-slate-400 uppercase">Coding Challenges</label><button onClick={() => addProblemToModule(mod.id)} className="text-[11px] font-bold text-brand-accent hover:underline">+ Link Problem</button></div>
                            {mod.problems.map(p => (
                              <div key={p.id} className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-border">
                                <input value={p.title} onChange={e => updateProblem(mod.id, p.id, { title: e.target.value })} className="bg-transparent border-none outline-none text-[13px] font-bold flex-1" placeholder="Title" />
                                <input value={p.externalLink} onChange={e => updateProblem(mod.id, p.id, { externalLink: e.target.value })} className="bg-transparent border-none outline-none text-[12px] text-slate-500 flex-1" placeholder="Link" />
                                <button onClick={() => deleteProblem(mod.id, p.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedTopic.modules.length === 0 && (
                      <div className="py-12 text-center text-slate-400 border-2 border-dashed border-border rounded-2xl">
                         <Layers size={32} className="mx-auto mb-3 opacity-20" />
                         <p className="text-[12px] font-bold uppercase tracking-widest">No modules added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl text-slate-300 py-40">
                  <Database size={48} className="mb-4 opacity-20" />
                  <p className="text-[14px] font-bold uppercase tracking-widest">Select or Create a Path to Begin Editing</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB CONTENT: DAILY CHALLENGE (CALENDAR) */}
        {activeTab === 'DAILY' && (
          <div className="space-y-8 animate-fade">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-border shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily Challenge Calendar</h2>
                  <p className="text-[13px] text-slate-500 font-medium">Select a date to schedule coding challenges for students.</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-border">
                   <button onClick={() => changeMonth('prev')} className="p-1 hover:text-brand-accent"><ChevronLeft size={20} /></button>
                   <span className="text-[14px] font-bold text-slate-800 dark:text-white min-w-[140px] text-center">{monthNames[currentMonth]} {currentYear}</span>
                   <button onClick={() => changeMonth('next')} className="p-1 hover:text-brand-accent"><ChevronRightIcon size={20} /></button>
                </div>
              </div>

              {/* CALENDAR GRID */}
              <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-xl overflow-hidden">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                  <div key={d} className="bg-slate-50 dark:bg-zinc-800/50 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">{d}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white dark:bg-zinc-900 h-28 md:h-32 opacity-30" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const challenge = getChallengeForDate(dateStr);
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  return (
                    <div 
                      key={day} 
                      onClick={() => handleDayClick(day)}
                      className={`bg-white dark:bg-zinc-900 h-28 md:h-32 p-3 border-t border-l border-transparent hover:border-brand-accent/50 cursor-pointer transition-all relative ${isToday ? 'ring-2 ring-brand-accent ring-inset' : ''}`}
                    >
                      <span className={`text-[12px] font-bold ${isToday ? 'text-brand-accent' : 'text-slate-400'}`}>{day}</span>
                      {challenge && challenge.problems.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {challenge.problems.slice(0, 2).map(p => (
                            <div key={p.id} className="text-[9px] font-bold px-1.5 py-0.5 bg-brand-accent/5 text-brand-accent rounded border border-brand-accent/10 truncate">
                              {p.title}
                            </div>
                          ))}
                          {challenge.problems.length > 2 && (
                            <div className="text-[8px] font-bold text-slate-400 pl-1">+{challenge.problems.length - 2} more</div>
                          )}
                          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-accent shadow-[0_0_8px_rgba(0,112,243,0.5)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: USERS */}
        {activeTab === 'USERS' && (
          <div className="space-y-8 animate-fade">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1 space-y-4">
                <div><h2 className="text-lg font-bold">User Registry</h2><p className="text-[13px] text-slate-500">{users.length} Candidates registered.</p></div>
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Search..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-slate-50 dark:bg-zinc-950 border border-border pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => exportUsers('csv')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-[12px] font-bold border border-emerald-500/20"><FileSpreadsheet size={16} /> Export CSV</button>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-border text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Candidate</th><th className="px-8 py-4 text-center">XP</th><th className="px-8 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-8 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-400">{u.name[0]}</div>
                        <div><p className="text-[13px] font-bold">{u.name}</p><p className="text-[11px] text-slate-500">{u.email}</p></div>
                      </td>
                      <td className="px-8 py-4 text-center font-bold">{u.points}</td>
                      <td className="px-8 py-4 text-right">
                        <button onClick={() => toggleBlockUser(u.id)} className={`px-4 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${u.isBlocked ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SIDE OVERLAY PANEL FOR DATE EDITING */}
        {editingDate && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingDate(null)} />
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col animate-slide-left">
              <div className="px-8 py-6 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Daily Challenge</h3>
                  <p className="text-[12px] font-bold text-brand-accent uppercase tracking-widest">{editingDate}</p>
                </div>
                <button onClick={() => setEditingDate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Scheduled Problems (Max 5)</h4>
                    <button 
                      onClick={() => {
                        const currentSet = getChallengeForDate(editingDate);
                        const problems = currentSet?.problems || [];
                        if (problems.length >= 5) return notify('Max 5 problems per day', 'error');
                        const newP: DailyProblem = { id: `dp-${Date.now()}`, title: 'New Problem', description: '', difficulty: 'EASY', points: 10, platform: PlatformType.LEETCODE, externalLink: '' };
                        saveChallenge(editingDate, [...problems, newP]);
                      }}
                      className="text-[11px] font-bold text-brand-accent hover:underline"
                    >
                      + Add Problem
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(getChallengeForDate(editingDate)?.problems || []).map((p, idx) => (
                      <div key={p.id} className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-border space-y-3 relative group">
                        <button 
                          onClick={() => {
                            const probs = getChallengeForDate(editingDate)!.problems.filter(item => item.id !== p.id);
                            saveChallenge(editingDate, probs);
                          }}
                          className="absolute -top-2 -right-2 p-1 bg-white dark:bg-zinc-800 border border-border rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                        <input 
                          value={p.title} 
                          onChange={e => {
                            const probs = [...getChallengeForDate(editingDate)!.problems];
                            probs[idx] = { ...probs[idx], title: e.target.value };
                            saveChallenge(editingDate, probs);
                          }}
                          placeholder="Problem Title" 
                          className="w-full bg-transparent border-none outline-none font-bold text-[14px]" 
                        />
                        <input 
                          value={p.externalLink} 
                          onChange={e => {
                            const probs = [...getChallengeForDate(editingDate)!.problems];
                            probs[idx] = { ...probs[idx], externalLink: e.target.value };
                            saveChallenge(editingDate, probs);
                          }}
                          placeholder="Platform Link" 
                          className="w-full bg-transparent border-none outline-none text-[12px] text-slate-500 font-medium" 
                        />
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                           <select 
                             value={p.difficulty}
                             onChange={e => {
                               const probs = [...getChallengeForDate(editingDate)!.problems];
                               probs[idx] = { ...probs[idx], difficulty: e.target.value as any };
                               saveChallenge(editingDate, probs);
                             }}
                             className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-400 uppercase"
                           >
                             <option value="EASY">Easy</option>
                             <option value="MEDIUM">Medium</option>
                             <option value="HARD">Hard</option>
                           </select>
                           <div className="flex items-center gap-1">
                             <input 
                               type="number" 
                               value={p.points} 
                               onChange={e => {
                                 const probs = [...getChallengeForDate(editingDate)!.problems];
                                 probs[idx] = { ...probs[idx], points: parseInt(e.target.value) || 0 };
                                 saveChallenge(editingDate, probs);
                               }}
                               className="w-10 bg-transparent border-none outline-none text-[11px] font-bold text-amber-600 text-right" 
                             />
                             <span className="text-[10px] font-bold text-slate-300">XP</span>
                           </div>
                        </div>
                      </div>
                    ))}
                    {(getChallengeForDate(editingDate)?.problems || []).length === 0 && (
                      <div className="py-12 text-center text-slate-400 border-2 border-dashed border-border rounded-xl">
                        <Clock size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-[11px] font-bold uppercase tracking-widest">No challenges scheduled</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border">
                <button 
                  onClick={() => setEditingDate(null)}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 shadow-xl"
                >
                  <Save size={18} /> Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE PATHWAY MODAL */}
        {pathToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade" onClick={() => !isDeleting && setPathToDelete(null)} />
             <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden animate-fade border border-border">
                <div className="p-8 space-y-6 text-center">
                   <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <AlertTriangle size={32} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Delete Pathway?</h3>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">
                        This will remove all modules, videos, PDFs, and problems inside this pathway. This action cannot be undone.
                      </p>
                   </div>
                   
                   <div className="flex gap-3">
                      <button 
                        disabled={isDeleting}
                        onClick={() => setPathToDelete(null)}
                        className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl text-[13px] font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        disabled={isDeleting}
                        onClick={confirmDeletePath}
                        className="flex-1 py-3.5 bg-red-500 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete Path'}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
