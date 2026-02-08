
import React, { useState, useMemo } from 'react';
import { User, Topic, DailyChallengeSet, DailyProblem, PlatformType, UserRole, Module, ContentBlock } from '../types';
import Layout from '../components/Layout';
import { SupabaseService } from '../services/supabase';
// Added Play, FileText, and Code to imports to fix missing name errors
import { 
  Plus, Trash2, Search, Check, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, AlertTriangle, Loader2, CalendarDays, 
  ExternalLink, Zap, ShieldCheck, X, Save, SaveAll, Trash,
  Eye, EyeOff, Play, FileText, Code
} from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const selectedTopic = useMemo(() => topics.find(t => t.id === selectedTopicId), [topics, selectedTopicId]);
  const currentChallenge = useMemo(() => challenges.find(c => c.date === selectedDate), [challenges, selectedDate]);
  
  const [localProblems, setLocalProblems] = useState<DailyProblem[]>([]);
  
  React.useEffect(() => {
    setLocalProblems(currentChallenge?.problems || []);
  }, [currentChallenge, selectedDate]);

  const handleUpdateTopic = async (updated: Topic) => {
    const newTopics = topics.map(t => t.id === updated.id ? updated : t);
    setTopics(newTopics);
    await SupabaseService.saveTopic(updated);
  };

  const moveTopic = (id: string, dir: 'up' | 'down') => {
    const idx = topics.findIndex(t => t.id === id);
    if (idx === -1) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === topics.length - 1) return;
    
    const newTopics = [...topics];
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    [newTopics[idx], newTopics[targetIdx]] = [newTopics[targetIdx], newTopics[idx]];
    setTopics(newTopics);
    notify('Tracks reordered');
  };

  const moveBlock = (modIdx: number, blockIdx: number, dir: 'up' | 'down') => {
    if (!selectedTopic) return;
    const mods = [...selectedTopic.modules];
    const mod = mods[modIdx];
    const blocks = [...mod.contentBlocks];
    if (dir === 'up' && blockIdx === 0) return;
    if (dir === 'down' && blockIdx === blocks.length - 1) return;

    const targetIdx = dir === 'up' ? blockIdx - 1 : blockIdx + 1;
    [blocks[blockIdx], blocks[targetIdx]] = [blocks[targetIdx], blocks[blockIdx]];
    
    mods[modIdx] = { ...mod, contentBlocks: blocks };
    handleUpdateTopic({ ...selectedTopic, modules: mods });
  };

  const saveDailyChallenge = async () => {
    setIsSaving(true);
    try {
      const challengeToSave: DailyChallengeSet = {
        id: currentChallenge?.id || `ch-${Date.now()}`,
        date: selectedDate,
        problems: localProblems
      };
      await SupabaseService.saveChallenge(challengeToSave);
      const newChallenges = [...challenges];
      const idx = newChallenges.findIndex(c => c.date === selectedDate);
      if (idx > -1) newChallenges[idx] = challengeToSave;
      else newChallenges.push(challengeToSave);
      setChallenges(newChallenges);
      notify('Daily Challenge Saved');
    } catch (err) {
      notify('Error saving challenge', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBlockUser = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (!target) return;
    const updated = { ...target, isBlocked: !target.isBlocked };
    setUsers(users.map(u => u.id === id ? updated : u));
    await SupabaseService.updateUserProfile(updated);
    notify('User status updated');
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark}>
      <div className="max-w-6xl mx-auto pb-32 animate-content">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
            <nav className="flex gap-1 p-1 bg-zinc-100 dark:bg-white/5 rounded-xl border border-border">
              {['PATHS', 'DAILY', 'USERS'].map(id => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as AdminTab)}
                  className={`px-5 py-1.5 rounded-lg text-[12px] font-bold transition-all ${activeTab === id ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-black'}`}
                >
                  {id}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {feedback && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 bg-black text-white rounded-full shadow-2xl flex items-center gap-3 animate-fade">
            <Check size={16} className="text-emerald-400" /> <span className="text-[13px] font-bold">{feedback.msg}</span>
          </div>
        )}

        {activeTab === 'PATHS' && (
          <div className="flex flex-col lg:flex-row gap-12">
            <aside className="w-full lg:w-72 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Engineering Tracks</h3>
                <button 
                  onClick={() => {
                    const newPath: Topic = { id: `p-${Date.now()}`, title: 'New Track', description: '', icon: 'Binary', isVisible: false, modules: [], interviewQuestions: [] };
                    setTopics([...topics, newPath]);
                    setSelectedTopicId(newPath.id);
                  }}
                  className="p-1.5 bg-black text-white rounded-lg hover:opacity-80 transition-all"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {topics.map((t, idx) => (
                  <div 
                    key={t.id} 
                    className={`group relative flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${selectedTopicId === t.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white dark:bg-zinc-900 border-border'}`}
                  >
                    <button
                      onClick={() => setSelectedTopicId(t.id)}
                      className="flex-1 text-left text-[13px] font-bold truncate pr-8"
                    >
                      {t.title || 'Untitled'}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col">
                        <button onClick={() => moveTopic(t.id, 'up')} className="p-0.5 hover:text-white/70 text-zinc-400"><ChevronUp size={12} /></button>
                        <button onClick={() => moveTopic(t.id, 'down')} className="p-0.5 hover:text-white/70 text-zinc-400"><ChevronDown size={12} /></button>
                      </div>
                      <button 
                        onClick={() => handleUpdateTopic({...t, isVisible: !t.isVisible})}
                        className={`p-1 rounded ${t.isVisible ? 'text-blue-500' : 'text-zinc-400'}`}
                      >
                        {t.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex-1 space-y-12">
              {selectedTopic ? (
                <div className="space-y-8 animate-content">
                  <div className="space-y-4">
                    <input 
                      value={selectedTopic.title}
                      onChange={e => handleUpdateTopic({...selectedTopic, title: e.target.value})}
                      className="text-4xl font-black bg-transparent outline-none w-full border-none p-0 tracking-tight"
                      placeholder="Track Title"
                    />
                    <textarea 
                      value={selectedTopic.description}
                      onChange={e => handleUpdateTopic({...selectedTopic, description: e.target.value})}
                      className="w-full bg-transparent border-none outline-none text-zinc-500 text-[15px] resize-none h-12"
                      placeholder="Brief description..."
                    />
                  </div>

                  <div className="space-y-6">
                    {selectedTopic.modules.map((mod, mIdx) => (
                      <div key={mod.id} className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                          <input 
                             value={mod.title}
                             onChange={e => {
                               const mods = [...selectedTopic.modules];
                               mods[mIdx] = {...mod, title: e.target.value};
                               handleUpdateTopic({...selectedTopic, modules: mods});
                             }}
                             className="bg-transparent font-black text-xl outline-none"
                             placeholder="Module Name"
                          />
                          <div className="flex items-center gap-4">
                             <button 
                               onClick={() => {
                                 const mods = selectedTopic.modules.filter(m => m.id !== mod.id);
                                 handleUpdateTopic({...selectedTopic, modules: mods});
                               }}
                               className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="flex justify-between items-center px-2">
                             <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Content Timeline</h4>
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => {
                                   const mods = [...selectedTopic.modules];
                                   mods[mIdx].contentBlocks.push({ id: `v-${Date.now()}`, type: 'VIDEO', title: 'Video Lecture', isVisible: true, url: '' });
                                   handleUpdateTopic({...selectedTopic, modules: mods});
                                 }}
                                 className="px-3 py-1 bg-zinc-50 dark:bg-white/5 border border-border rounded-lg text-[10px] font-bold hover:bg-zinc-100 transition-all"
                               >+ Video</button>
                               <button 
                                 onClick={() => {
                                   const mods = [...selectedTopic.modules];
                                   mods[mIdx].contentBlocks.push({ id: `p-${Date.now()}`, type: 'PDF', title: 'Technical Notes', isVisible: true, url: '' });
                                   handleUpdateTopic({...selectedTopic, modules: mods});
                                 }}
                                 className="px-3 py-1 bg-zinc-50 dark:bg-white/5 border border-border rounded-lg text-[10px] font-bold hover:bg-zinc-100 transition-all"
                               >+ PDF</button>
                               <button 
                                 onClick={() => {
                                   const mods = [...selectedTopic.modules];
                                   mods[mIdx].contentBlocks.push({ 
                                     id: `c-${Date.now()}`, 
                                     type: 'PROBLEM', 
                                     title: 'New Problem', 
                                     isVisible: true, 
                                     problem: { id: `p-${Date.now()}`, title: 'Problem Title', description: '', difficulty: 'EASY', points: 10, platform: PlatformType.LEETCODE, externalLink: '' } 
                                   });
                                   handleUpdateTopic({...selectedTopic, modules: mods});
                                 }}
                                 className="px-3 py-1 bg-zinc-50 dark:bg-white/5 border border-border rounded-lg text-[10px] font-bold hover:bg-zinc-100 transition-all"
                               >+ Problem</button>
                             </div>
                           </div>

                           <div className="space-y-2">
                              {mod.contentBlocks.map((block, bIdx) => (
                                <div key={block.id} className="group relative bg-zinc-50 dark:bg-white/5 border border-border p-4 rounded-2xl flex items-center gap-4 transition-all hover:border-zinc-300">
                                   <div className="flex flex-col">
                                     <button onClick={() => moveBlock(mIdx, bIdx, 'up')} className="text-zinc-300 hover:text-zinc-900"><ChevronUp size={14} /></button>
                                     <button onClick={() => moveBlock(mIdx, bIdx, 'down')} className="text-zinc-300 hover:text-zinc-900"><ChevronDown size={14} /></button>
                                   </div>

                                   <div className="flex-1 space-y-3">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${block.type === 'VIDEO' ? 'bg-blue-50 text-blue-500' : block.type === 'PDF' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                           {block.type === 'VIDEO' ? <Play size={14} /> : block.type === 'PDF' ? <FileText size={14} /> : <Code size={14} />}
                                        </div>
                                        <input 
                                          value={block.title}
                                          onChange={e => {
                                            const mods = [...selectedTopic.modules];
                                            mods[mIdx].contentBlocks[bIdx].title = e.target.value;
                                            if (block.problem) mods[mIdx].contentBlocks[bIdx].problem!.title = e.target.value;
                                            handleUpdateTopic({...selectedTopic, modules: mods});
                                          }}
                                          className="flex-1 bg-transparent font-bold text-[13px] outline-none"
                                          placeholder="Enter content title..."
                                        />
                                      </div>

                                      {block.type !== 'PROBLEM' ? (
                                        <input 
                                          value={block.url || ''}
                                          onChange={e => {
                                            const mods = [...selectedTopic.modules];
                                            mods[mIdx].contentBlocks[bIdx].url = e.target.value;
                                            handleUpdateTopic({...selectedTopic, modules: mods});
                                          }}
                                          className="w-full bg-white dark:bg-zinc-900 border border-border px-3 py-1.5 rounded-lg text-[11px] outline-none"
                                          placeholder="Source URL..."
                                        />
                                      ) : block.problem && (
                                        <div className="flex gap-2">
                                           <select 
                                              value={block.problem.difficulty}
                                              onChange={e => {
                                                const mods = [...selectedTopic.modules];
                                                mods[mIdx].contentBlocks[bIdx].problem!.difficulty = e.target.value as any;
                                                handleUpdateTopic({...selectedTopic, modules: mods});
                                              }}
                                              className="bg-white dark:bg-zinc-900 border border-border px-2 py-1 rounded text-[10px] font-bold"
                                           >
                                              <option value="EASY">Easy</option>
                                              <option value="MEDIUM">Medium</option>
                                              <option value="HARD">Hard</option>
                                           </select>
                                           <input 
                                              value={block.problem.externalLink}
                                              onChange={e => {
                                                const mods = [...selectedTopic.modules];
                                                mods[mIdx].contentBlocks[bIdx].problem!.externalLink = e.target.value;
                                                handleUpdateTopic({...selectedTopic, modules: mods});
                                              }}
                                              className="flex-1 bg-white dark:bg-zinc-900 border border-border px-3 py-1.5 rounded-lg text-[11px] outline-none"
                                              placeholder="LeetCode / GFG Link..."
                                           />
                                        </div>
                                      )}
                                   </div>

                                   <button 
                                     onClick={() => {
                                       const mods = [...selectedTopic.modules];
                                       mods[mIdx].contentBlocks = mods[mIdx].contentBlocks.filter((_, i) => i !== bIdx);
                                       handleUpdateTopic({...selectedTopic, modules: mods});
                                     }}
                                     className="p-2 text-zinc-300 hover:text-red-500"
                                   >
                                     <X size={14} />
                                   </button>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        handleUpdateTopic({...selectedTopic, modules: [...selectedTopic.modules, {id: `mod-${Date.now()}`, title: 'New Unit', description: '', contentBlocks: [], isVisible: true}]});
                      }}
                      className="w-full py-10 border-2 border-dashed border-border rounded-3xl text-[12px] font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
                    >
                      + Register Learning Unit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[3rem] opacity-30">
                   <ShieldCheck size={48} className="mb-4" />
                   <p className="text-[14px] font-black uppercase tracking-widest">Select Node to Modulate</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other tabs (DAILY, USERS) remain identical in style but logic stays compact */}
        {activeTab === 'DAILY' && (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black tracking-tighter">{monthNames[currentMonth]} {currentYear}</h2>
                <div className="flex gap-2">
                   <button onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)} className="p-2.5 bg-zinc-100 dark:bg-white/5 rounded-xl"><ChevronLeft size={16} /></button>
                   <button onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)} className="p-2.5 bg-zinc-100 dark:bg-white/5 rounded-xl"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-black text-zinc-400 py-2">{d}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const has = challenges.some(c => c.date === ds);
                  const isSelected = selectedDate === ds;
                  return (
                    <button 
                      key={day} 
                      onClick={() => setSelectedDate(ds)} 
                      className={`h-20 rounded-2xl border p-3 flex flex-col justify-between transition-all group ${isSelected ? 'bg-black text-white border-black' : 'bg-white dark:bg-zinc-900 border-border hover:border-zinc-400'}`}
                    >
                      <span className="text-[13px] font-black">{day}</span>
                      {has && <div className={`w-1.5 h-1.5 rounded-full mx-auto ${isSelected ? 'bg-white' : 'bg-zinc-900 dark:bg-white'}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-[400px] space-y-6 relative">
               <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-2 mb-8">
                    <CalendarDays size={18} className="text-zinc-400" />
                    <h3 className="text-[15px] font-bold tracking-tight">Sync Date: {selectedDate}</h3>
                  </div>

                  <div className="space-y-6">
                    {localProblems.map((p, idx) => (
                      <div key={p.id} className="space-y-4 pb-6 border-b border-border last:border-0 last:pb-0">
                         <div className="flex gap-4">
                           <input 
                              value={p.title} 
                              onChange={e => {
                                const newP = [...localProblems];
                                newP[idx] = {...p, title: e.target.value};
                                setLocalProblems(newP);
                              }}
                              className="flex-1 bg-transparent font-bold text-[14px] outline-none" 
                              placeholder="Problem Title" 
                           />
                           <button onClick={() => setLocalProblems(localProblems.filter(item => item.id !== p.id))} className="text-zinc-300 hover:text-red-500 transition-colors"><Trash size={14} /></button>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <select 
                               value={p.difficulty}
                               onChange={e => {
                                 const newP = [...localProblems];
                                 newP[idx] = {...p, difficulty: e.target.value as any};
                                 setLocalProblems(newP);
                               }}
                               className="bg-zinc-50 dark:bg-white/5 border border-border px-3 py-1.5 rounded-lg text-[12px] font-bold outline-none"
                            >
                               <option value="EASY">Easy</option>
                               <option value="MEDIUM">Medium</option>
                               <option value="HARD">Hard</option>
                            </select>
                            <input 
                                 type="number" 
                                 value={p.points} 
                                 onChange={e => {
                                   const newP = [...localProblems];
                                   newP[idx] = {...p, points: parseInt(e.target.value) || 0};
                                   setLocalProblems(newP);
                                 }}
                                 className="bg-zinc-50 dark:bg-white/5 border border-border px-3 py-1.5 rounded-lg text-[12px] font-bold outline-none w-20" 
                               />
                         </div>
                         <input 
                            value={p.externalLink} 
                            onChange={e => {
                              const newP = [...localProblems];
                              newP[idx] = {...p, externalLink: e.target.value};
                              setLocalProblems(newP);
                            }}
                            className="w-full bg-zinc-50 dark:bg-white/5 border border-border px-3 py-1.5 rounded-lg text-[11px] outline-none truncate" 
                            placeholder="LeetCode/GFG URL" 
                         />
                      </div>
                    ))}
                    
                    <button 
                       onClick={() => setLocalProblems([...localProblems, {id: `dp-${Date.now()}`, title: 'New Problem', description: '', difficulty: 'EASY', points: 20, platform: PlatformType.LEETCODE, externalLink: ''}])}
                       className="w-full py-4 bg-zinc-50 dark:bg-white/5 border-2 border-dashed border-border rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-all"
                    >
                       + Add Mission Slot
                    </button>
                  </div>
               </div>

               <div className="sticky bottom-0 pt-6 flex gap-4">
                  <button 
                    onClick={saveDailyChallenge}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-black text-white rounded-2xl text-[13px] font-bold shadow-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Mission Set</>}
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="bg-white dark:bg-zinc-900 border border-border rounded-3xl overflow-hidden shadow-sm">
             <div className="p-8 border-b border-border flex justify-between items-center bg-zinc-50/50 dark:bg-white/5">
                <div className="relative w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                   <input placeholder="Search directory..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-border pl-12 pr-4 py-3 rounded-2xl text-[13px] font-medium outline-none focus:border-zinc-400 transition-all" />
                </div>
             </div>
             <table className="w-full text-left">
                <thead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-border">
                  <tr>
                    <th className="px-8 py-6">Member</th>
                    <th className="px-8 py-6">Secret Key</th>
                    <th className="px-8 py-6 text-center">Cloud XP</th>
                    <th className="px-8 py-6 text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                     <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 text-[14px]">{u.name[0]}</div>
                              <div><p className="text-[14px] font-bold">{u.name}</p><p className="text-[11px] text-zinc-400 font-medium">{u.email}</p></div>
                           </div>
                        </td>
                        <td className="px-8 py-6 font-mono text-[11px] text-zinc-400">{u.password}</td>
                        <td className="px-8 py-6 text-center font-black text-[15px]">{u.points}</td>
                        <td className="px-8 py-6 text-right">
                           <button onClick={() => toggleBlockUser(u.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${u.isBlocked ? 'bg-red-50 text-red-500 border-red-200 shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
                              {u.isBlocked ? 'Blocked' : 'Active'}
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
