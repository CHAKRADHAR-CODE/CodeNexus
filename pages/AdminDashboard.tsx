
import React, { useState, useMemo, useEffect } from 'react';
import { User, Topic, DailyChallengeSet, DailyProblem, PlatformType, Module, ContentBlock } from '../types';
import Layout from '../components/Layout';
import { ApiService } from '../services/api';
import { 
  Plus, Trash2, Search, Check, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, Loader2, CalendarDays, 
  Zap, ShieldCheck, X, Sparkles, Send,
  Play, FileText, Code, Eye, EyeOff, GripVertical, AlertTriangle, Settings2
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  users: User[];
  setUsers: (users: User[]) => void;
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
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
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; trackId: string; trackName: string }>({
    isOpen: false,
    trackId: '',
    trackName: ''
  });

  useEffect(() => {
    if (topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  const notify = (msg: string) => {
    setFeedback({ msg, type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveTopic = async (topicToSave: Topic) => {
    setIsSaving(true);
    try {
      await ApiService.saveTrack(topicToSave);
      notify('Curriculum Synchronized');
    } catch (err) {
      notify('Sync Error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    const id = deleteModal.trackId;
    setIsSaving(true);
    setDeleteModal({ ...deleteModal, isOpen: false });
    const originalTopics = [...topics];
    setTopics(prev => {
        const remaining = prev.filter(t => t.id !== id);
        if (selectedTopicId === id) setSelectedTopicId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
    });
    try {
      await ApiService.deleteTrack(id);
      notify('Track Node Destroyed');
    } catch (err) {
      setTopics(originalTopics);
      notify('Sync Error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTopic = useMemo(() => topics.find(t => t.id === selectedTopicId), [topics, selectedTopicId]);

  const updateSelectedTopic = (updates: Partial<Topic>) => {
    if (!selectedTopicId) return;
    setTopics(prev => prev.map(t => t.id === selectedTopicId ? { ...t, ...updates } : t));
  };

  const addModule = () => {
    if (!selectedTopic) return;
    const newModule: Module = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Engineering Unit',
      description: 'Define unit core objectives.',
      isVisible: true,
      contentBlocks: [],
      problems: []
    };
    updateSelectedTopic({ modules: [...selectedTopic.modules, newModule] });
  };

  const addContentBlock = (modId: string) => {
    if (!selectedTopic) return;
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'VIDEO',
      title: 'New Video Lecture',
      url: '',
      isVisible: true
    };
    updateSelectedTopic({
      modules: selectedTopic.modules.map(m => m.id === modId ? { ...m, contentBlocks: [...m.contentBlocks, newBlock] } : m)
    });
  };

  const addProblem = (modId: string) => {
    if (!selectedTopic) return;
    const newProb: DailyProblem = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Algorithm Challenge',
      description: '',
      difficulty: 'MEDIUM',
      points: 50,
      platform: PlatformType.LEETCODE,
      externalLink: ''
    };
    updateSelectedTopic({
      modules: selectedTopic.modules.map(m => m.id === modId ? { ...m, problems: [...m.problems, newProb] } : m)
    });
  };

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark}>
      <div className="max-w-6xl mx-auto pb-32 animate-content px-4">
        
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} />
            <div className="relative bg-white dark:bg-zinc-900 border border-border w-full max-w-md rounded-[32px] p-10 shadow-2xl animate-premium-entry">
              <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-8 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-center mb-2">Destroy Node?</h3>
              <p className="text-[13px] text-zinc-500 text-center font-medium mb-10">Permanently erase <span className="text-zinc-900 dark:text-white font-black">"{deleteModal.trackName}"</span>?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="py-4 rounded-2xl bg-zinc-100 dark:bg-white/5 text-[11px] font-black uppercase tracking-widest">Cancel</button>
                <button onClick={handleConfirmDelete} className="py-4 rounded-2xl bg-rose-500 text-white text-[11px] font-black uppercase tracking-widest">Destroy</button>
              </div>
            </div>
          </div>
        )}

        {feedback && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full shadow-2xl flex items-center gap-3 animate-premium-entry border border-border">
            <Check size={14} strokeWidth={3} className="text-emerald-500" />
            <span className="text-[11px] font-black uppercase tracking-widest">{feedback.msg}</span>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-border">
          <div className="flex items-center gap-6">
            <h1 className="text-[12px] font-black tracking-[0.3em] flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 uppercase">
              <Zap size={16} className="text-amber-500 fill-amber-500" /> Control Center
            </h1>
            <nav className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-border">
              {(['PATHS', 'DAILY', 'USERS'] as AdminTab[]).map(id => (
                <button key={id} onClick={() => setActiveTab(id)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${activeTab === id ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-black'}`}>{id}</button>
              ))}
            </nav>
          </div>
        </header>

        {activeTab === 'PATHS' && (
          <div className="flex flex-col lg:flex-row gap-10">
            <aside className="w-full lg:w-64 space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Available Tracks</h3>
                <button onClick={() => {
                  const newPath: Topic = { id: Math.random().toString(36).substr(2, 9), title: 'New Track', description: '', icon: 'Binary', isVisible: true, modules: [], interviewQuestions: [] };
                  setTopics(prev => [newPath, ...prev]);
                  setSelectedTopicId(newPath.id);
                }} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:scale-110 transition-all"><Plus size={12} strokeWidth={3} /></button>
              </div>
              <div className="space-y-2">
                {topics.map((t) => (
                  <div key={t.id} onClick={() => setSelectedTopicId(t.id)} className={`group relative flex items-center justify-between px-5 py-3.5 rounded-2xl border transition-all cursor-pointer ${selectedTopicId === t.id ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-zinc-900 shadow-xl' : 'bg-white dark:bg-zinc-900 border-border'}`}>
                    <span className="text-[13px] font-bold truncate pr-6">{t.title}</span>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, trackId: t.id, trackName: t.title }); }} className="opacity-0 group-hover:opacity-100 p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all absolute right-1"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </aside>

            <main className="flex-1 space-y-10">
              {selectedTopic ? (
                <div className="space-y-10 animate-content">
                  <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                    <input 
                       value={selectedTopic.title}
                       onChange={e => updateSelectedTopic({ title: e.target.value })}
                       className="text-3xl font-black bg-transparent outline-none w-full border-none p-0 tracking-tighter text-black dark:text-white"
                       placeholder="Track Title"
                    />
                    <button onClick={() => handleSaveTopic(selectedTopic)} disabled={isSaving} className="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} 
                      Save Changes
                    </button>
                  </div>
                  
                  <div className="space-y-10">
                    {selectedTopic.modules.map((mod, mIdx) => (
                      <div key={mod.id} className="bg-white dark:bg-zinc-900 border border-border rounded-[32px] overflow-hidden shadow-sm">
                        <div className="px-8 py-5 bg-zinc-50 dark:bg-white/5 border-b border-border flex items-center justify-between">
                           <div className="flex items-center gap-4 flex-1">
                             <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[11px] font-black">{mIdx + 1}</div>
                             <input value={mod.title} onChange={e => {
                               const ms = [...selectedTopic.modules];
                               ms[mIdx].title = e.target.value;
                               updateSelectedTopic({ modules: ms });
                             }} className="bg-transparent font-black text-[18px] outline-none text-black dark:text-white flex-1" placeholder="Unit Header" />
                           </div>
                           <button onClick={() => {
                             const ms = selectedTopic.modules.filter(m => m.id !== mod.id);
                             updateSelectedTopic({ modules: ms });
                           }} className="p-2.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={16} /></button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Play size={12} /> Content Blocks</h4>
                              <div className="space-y-3">
                                 {mod.contentBlocks.map((block, bIdx) => (
                                   <div key={block.id} className="flex gap-4 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-border group/block">
                                      <select value={block.type} onChange={e => {
                                        const ms = [...selectedTopic.modules];
                                        ms[mIdx].contentBlocks[bIdx].type = e.target.value as any;
                                        updateSelectedTopic({ modules: ms });
                                      }} className="bg-white dark:bg-zinc-900 border border-border rounded-lg px-2 text-[11px] font-bold outline-none">
                                        <option value="VIDEO">VIDEO</option>
                                        <option value="PDF">PDF</option>
                                      </select>
                                      <input value={block.title} onChange={e => {
                                        const ms = [...selectedTopic.modules];
                                        ms[mIdx].contentBlocks[bIdx].title = e.target.value;
                                        updateSelectedTopic({ modules: ms });
                                      }} className="bg-transparent text-[13px] font-bold flex-1 outline-none" placeholder="Block Title" />
                                      <input value={block.url} onChange={e => {
                                        const ms = [...selectedTopic.modules];
                                        ms[mIdx].contentBlocks[bIdx].url = e.target.value;
                                        updateSelectedTopic({ modules: ms });
                                      }} className="bg-transparent text-[11px] font-medium flex-1 outline-none text-zinc-400" placeholder="Resource URL (YouTube/Docs)" />
                                      <button onClick={() => {
                                        const ms = [...selectedTopic.modules];
                                        ms[mIdx].contentBlocks = ms[mIdx].contentBlocks.filter(b => b.id !== block.id);
                                        updateSelectedTopic({ modules: ms });
                                      }} className="p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover/block:opacity-100 transition-all"><X size={14} /></button>
                                   </div>
                                 ))}
                                 <button onClick={() => addContentBlock(mod.id)} className="flex items-center gap-2 text-[10px] font-black text-blue-500 hover:text-blue-600 transition-all uppercase tracking-widest pl-2"><Plus size={14} /> Add Content Block</button>
                              </div>
                           </div>

                           <div className="space-y-4 pt-4 border-t border-border">
                              <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2"><Code size={12} /> Coding Problems</h4>
                              <div className="space-y-3">
                                 {mod.problems.map((prob, pIdx) => (
                                   <div key={prob.id} className="p-6 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-border space-y-4 group/prob">
                                      <div className="flex items-center justify-between">
                                        <input value={prob.title} onChange={e => {
                                          const ms = [...selectedTopic.modules];
                                          ms[mIdx].problems[pIdx].title = e.target.value;
                                          updateSelectedTopic({ modules: ms });
                                        }} className="bg-transparent text-[14px] font-black outline-none flex-1" placeholder="Problem Title" />
                                        <button onClick={() => {
                                          const ms = [...selectedTopic.modules];
                                          ms[mIdx].problems = ms[mIdx].problems.filter(p => p.id !== prob.id);
                                          updateSelectedTopic({ modules: ms });
                                        }} className="p-2 text-zinc-300 hover:text-rose-500 opacity-0 group-hover/prob:opacity-100 transition-all"><Trash2 size={14} /></button>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                         <div className="space-y-1">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Platform</span>
                                            <select value={prob.platform} onChange={e => {
                                              const ms = [...selectedTopic.modules];
                                              ms[mIdx].problems[pIdx].platform = e.target.value as any;
                                              updateSelectedTopic({ modules: ms });
                                            }} className="w-full bg-white dark:bg-zinc-900 border border-border rounded-lg py-2 px-3 text-[11px] font-bold">
                                              <option value="LeetCode">LeetCode</option>
                                              <option value="GeeksforGeeks">GeeksforGeeks</option>
                                            </select>
                                         </div>
                                         <div className="space-y-1">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Difficulty</span>
                                            <select value={prob.difficulty} onChange={e => {
                                              const ms = [...selectedTopic.modules];
                                              ms[mIdx].problems[pIdx].difficulty = e.target.value as any;
                                              updateSelectedTopic({ modules: ms });
                                            }} className="w-full bg-white dark:bg-zinc-900 border border-border rounded-lg py-2 px-3 text-[11px] font-bold">
                                              <option value="EASY">EASY</option>
                                              <option value="MEDIUM">MEDIUM</option>
                                              <option value="HARD">HARD</option>
                                            </select>
                                         </div>
                                         <div className="space-y-1">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">XP Points</span>
                                            <input type="number" value={prob.points} onChange={e => {
                                              const ms = [...selectedTopic.modules];
                                              ms[mIdx].problems[pIdx].points = parseInt(e.target.value) || 0;
                                              updateSelectedTopic({ modules: ms });
                                            }} className="w-full bg-white dark:bg-zinc-900 border border-border rounded-lg py-2 px-3 text-[11px] font-bold outline-none" />
                                         </div>
                                         <div className="space-y-1">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">External URL</span>
                                            <input value={prob.externalLink} onChange={e => {
                                              const ms = [...selectedTopic.modules];
                                              ms[mIdx].problems[pIdx].externalLink = e.target.value;
                                              updateSelectedTopic({ modules: ms });
                                            }} className="w-full bg-white dark:bg-zinc-900 border border-border rounded-lg py-2 px-3 text-[11px] font-bold outline-none" placeholder="Link to problem" />
                                         </div>
                                      </div>
                                   </div>
                                 ))}
                                 <button onClick={() => addProblem(mod.id)} className="flex items-center gap-2 text-[10px] font-black text-emerald-500 hover:text-emerald-600 transition-all uppercase tracking-widest pl-2"><Plus size={14} /> Add Coding Mission</button>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addModule} className="w-full py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] flex items-center justify-center gap-3 text-zinc-400 hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all font-black text-[12px] uppercase tracking-widest"><Plus size={20} /> Deploy New Unit Node</button>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[48px] opacity-20 text-zinc-400">
                  <ShieldCheck size={64} strokeWidth={1} className="mb-6" />
                  <p className="text-[14px] font-black uppercase tracking-[0.3em]">Map Awaiting Selection</p>
                </div>
              )}
            </main>
          </div>
        )}

        {activeTab === 'DAILY' && (
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-[32px] p-10 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center opacity-40">
            <CalendarDays size={48} className="text-zinc-400 mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase tracking-widest">Daily Ops Engine</h3>
            <p className="text-[13px] text-zinc-500 font-medium">Automatic daily challenge rotation is handled by the server node.</p>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[32px] overflow-hidden shadow-sm">
               <div className="px-10 py-5 bg-zinc-50 dark:bg-white/5 border-b border-border flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Student Directory</h3>
                  <span className="text-[11px] font-black text-zinc-900 dark:text-white">{users.filter(u => u.role === 'STUDENT').length} Total Cadets</span>
               </div>
               <div className="divide-y divide-border">
                  {users.filter(u => u.role === 'STUDENT').map(u => (
                    <div key={u.id} className="px-10 py-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[14px] font-black">{u.name[0]}</div>
                          <div>
                            <p className="text-[14px] font-black">{u.name}</p>
                            <p className="text-[11px] text-zinc-400 font-medium">{u.email}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-12">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total XP</p>
                            <p className="text-[14px] font-black">{u.points}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Streak</p>
                            <p className="text-[14px] font-black text-orange-500">{u.streak} 🔥</p>
                          </div>
                          <button onClick={() => ApiService.blockUser(u.id, !u.isBlocked).then(() => notify(u.isBlocked ? 'Access Restored' : 'Access Restricted'))} className={`p-2.5 rounded-xl transition-all ${u.isBlocked ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-rose-500 bg-rose-50 dark:bg-rose-500/10'}`}>
                            {u.isBlocked ? <ShieldCheck size={18} /> : <EyeOff size={18} />}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
