
import React, { useState, useMemo } from 'react';
import { User, Topic, DailyChallengeSet, Module, DailyProblem, PlatformType, UserRole } from '../types';
import Layout from '../components/Layout';
import { SupabaseService } from '../services/supabase';
import { 
  Plus, 
  Trash2, 
  Settings2,
  Users,
  Layers,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  AlertTriangle,
  Loader2,
  CalendarDays,
  ExternalLink,
  Zap,
  Eye,
  EyeOff,
  ShieldCheck,
  // Fix: Added missing X icon import from lucide-react
  X
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

const VisibilityToggle: React.FC<{ 
  isVisible: boolean; 
  onChange: (val: boolean) => void;
}> = ({ isVisible, onChange }) => (
  <div className="flex items-center gap-2">
    <button
      onClick={() => onChange(!isVisible)}
      className={`relative inline-flex h-4 w-8 items-center rounded-full transition-all focus:outline-none ${
        isVisible ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-all ${
          isVisible ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const ReorderControls: React.FC<{
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ onMoveUp, onMoveDown, isFirst, isLast }) => (
  <div className="flex items-center gap-0.5 border border-border/50 rounded-md bg-white/50 dark:bg-black/20 p-0.5">
    <button
      onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
      disabled={isFirst}
      className={`p-1 rounded transition-colors ${isFirst ? 'text-zinc-200 dark:text-zinc-800 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
    >
      <ChevronUp size={14} />
    </button>
    <button
      onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
      disabled={isLast}
      className={`p-1 rounded transition-colors ${isLast ? 'text-zinc-200 dark:text-zinc-800 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
    >
      <ChevronDown size={14} />
    </button>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, users, setUsers, topics, setTopics, challenges, setChallenges, onLogout, isDark, setDark 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('PATHS');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(topics[0]?.id || null);
  const [searchUser, setSearchUser] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Calendar State
  const todayStr = new Date().toISOString().split('T')[0];
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [pathToDelete, setPathToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const selectedTopic = useMemo(() => topics.find(t => t.id === selectedTopicId), [topics, selectedTopicId]);

  const moveArrayItem = <T,>(list: T[], index: number, direction: 'up' | 'down'): T[] => {
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return newList;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    return newList;
  };

  // --- PERSISTENCE HELPERS ---
  const handleUpdateTopic = (updated: Topic) => {
    setTopics(topics.map(t => t.id === updated.id ? updated : t));
    SupabaseService.saveTopic(updated);
  };

  const handleUpdateChallenge = (date: string, problems: DailyProblem[]) => {
    const existingIdx = challenges.findIndex(c => c.date === date);
    let newChallenges = [...challenges];
    let target: DailyChallengeSet;
    if (existingIdx > -1) {
      target = { ...newChallenges[existingIdx], problems };
      newChallenges[existingIdx] = target;
    } else {
      target = { id: `ch-${Date.now()}`, date, problems };
      newChallenges.push(target);
    }
    setChallenges(newChallenges);
    SupabaseService.saveChallenge(target);
  };

  // --- PATHS ---
  const addPath = () => {
    const newPath: Topic = { 
      id: `path-${Date.now()}`, 
      title: 'New Cloud Track', 
      description: 'Master a new engineering domain.', 
      icon: 'Binary', 
      isVisible: false,
      modules: [], 
      interviewQuestions: [] 
    };
    setTopics([...topics, newPath]);
    setSelectedTopicId(newPath.id);
    SupabaseService.saveTopic(newPath);
    notify('Cloud Track Created');
  };

  const confirmDeletePath = async () => {
    if (!pathToDelete) return;
    setIsDeleting(true);
    await SupabaseService.deleteTopic(pathToDelete);
    const remaining = topics.filter(t => t.id !== pathToDelete);
    setTopics(remaining);
    if (selectedTopicId === pathToDelete) setSelectedTopicId(remaining[0]?.id || null);
    setPathToDelete(null);
    setIsDeleting(false);
    notify('Track Removed from Cloud');
  };

  const toggleBlockUser = async (id: string) => {
    if (id === user.id) return;
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    const updatedUser = { ...targetUser, isBlocked: !targetUser.isBlocked };
    setUsers(users.map(u => u.id === id ? updatedUser : u));
    await SupabaseService.updateUserProfile(updatedUser);
    notify('User access updated');
  };

  const currentChallenge = challenges.find(c => c.date === selectedDate);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark}>
      <div className="max-w-7xl mx-auto pb-20 animate-fade">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-4 border-b border-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg">
                <ShieldCheck size={16} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Cloud Admin</h1>
            </div>
            <nav className="flex gap-1">
              {['PATHS', 'DAILY', 'USERS'].map(id => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as AdminTab)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${activeTab === id ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  {id}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {feedback && (
          <div className="fixed bottom-8 right-8 z-[100] px-6 py-3 bg-zinc-900 text-white rounded-xl shadow-2xl flex items-center gap-3 animate-fade">
            <Check size={16} /> <span className="text-[13px] font-bold">{feedback.msg}</span>
          </div>
        )}

        {activeTab === 'PATHS' && (
          <div className="flex flex-col lg:flex-row gap-10">
            <aside className="w-full lg:w-72 space-y-4">
              <div className="flex justify-between px-2">
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Cloud Tracks</h3>
                <button onClick={addPath} className="p-1 text-zinc-400 hover:text-zinc-900"><Plus size={16} /></button>
              </div>
              <div className="space-y-1">
                {topics.map((t) => (
                  <div key={t.id} className="group flex items-center gap-2 pr-2">
                    <button
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-[13px] font-medium truncate ${selectedTopicId === t.id ? 'bg-zinc-100 dark:bg-zinc-800' : 'text-zinc-500'}`}
                    >
                      {t.title}
                    </button>
                    <button onClick={() => setPathToDelete(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex-1 space-y-10">
              {selectedTopic ? (
                <div className="space-y-8 animate-fade">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <VisibilityToggle isVisible={selectedTopic.isVisible || false} onChange={val => handleUpdateTopic({ ...selectedTopic, isVisible: val })} />
                      <span className="text-[13px] font-bold">Track is {selectedTopic.isVisible ? 'Public' : 'Hidden'}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input 
                      value={selectedTopic.title} 
                      onChange={e => handleUpdateTopic({ ...selectedTopic, title: e.target.value })}
                      className="text-3xl font-black bg-transparent border-none outline-none w-full tracking-tight"
                    />
                    <textarea 
                      value={selectedTopic.description}
                      onChange={e => handleUpdateTopic({ ...selectedTopic, description: e.target.value })}
                      className="w-full bg-transparent border-none outline-none text-[14px] text-zinc-500 resize-none"
                    />
                  </div>

                  <div className="space-y-6">
                    <button 
                      onClick={() => {
                        const newMod: Module = { id: `mod-${Date.now()}`, title: 'New Unit', description: '', problems: [] };
                        handleUpdateTopic({ ...selectedTopic, modules: [...selectedTopic.modules, newMod] });
                      }}
                      className="w-full py-4 border-2 border-dashed border-border rounded-xl text-[12px] font-black uppercase tracking-widest text-zinc-400 hover:border-zinc-400 hover:text-zinc-900 transition-all"
                    >
                      + Add Learning Unit
                    </button>

                    {selectedTopic.modules.map((mod, modIdx) => (
                      <div key={mod.id} className="bg-white dark:bg-zinc-950 border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-border flex items-center justify-between">
                          <input 
                            value={mod.title} 
                            onChange={e => {
                              const updatedModules = [...selectedTopic.modules];
                              updatedModules[modIdx] = { ...mod, title: e.target.value };
                              handleUpdateTopic({ ...selectedTopic, modules: updatedModules });
                            }}
                            className="bg-transparent font-bold text-[14px] flex-1 outline-none"
                          />
                          <button onClick={() => handleUpdateTopic({ ...selectedTopic, modules: selectedTopic.modules.filter(m => m.id !== mod.id) })} className="text-zinc-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Video URL" value={mod.videoUrl || ''} onChange={e => {
                               const mods = [...selectedTopic.modules];
                               mods[modIdx] = { ...mod, videoUrl: e.target.value };
                               handleUpdateTopic({ ...selectedTopic, modules: mods });
                            }} className="bg-zinc-50 dark:bg-zinc-900 border border-border p-2 rounded text-[12px] outline-none" />
                            <input placeholder="PDF URL" value={mod.pdfUrl || ''} onChange={e => {
                               const mods = [...selectedTopic.modules];
                               mods[modIdx] = { ...mod, pdfUrl: e.target.value };
                               handleUpdateTopic({ ...selectedTopic, modules: mods });
                            }} className="bg-zinc-50 dark:bg-zinc-900 border border-border p-2 rounded text-[12px] outline-none" />
                          </div>
                          
                          <div className="space-y-2">
                             {mod.problems.map((p, pIdx) => (
                               <div key={p.id} className="flex gap-2 items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-border">
                                  <input value={p.title} onChange={e => {
                                    const mods = [...selectedTopic.modules];
                                    const probs = [...mod.problems];
                                    probs[pIdx] = { ...p, title: e.target.value };
                                    mods[modIdx] = { ...mod, problems: probs };
                                    handleUpdateTopic({ ...selectedTopic, modules: mods });
                                  }} className="bg-transparent font-bold text-[12px] flex-1 outline-none" />
                                  <input value={p.externalLink} onChange={e => {
                                    const mods = [...selectedTopic.modules];
                                    const probs = [...mod.problems];
                                    probs[pIdx] = { ...p, externalLink: e.target.value };
                                    mods[modIdx] = { ...mod, problems: probs };
                                    handleUpdateTopic({ ...selectedTopic, modules: mods });
                                  }} className="bg-transparent text-[11px] text-zinc-500 flex-1 outline-none truncate" />
                                  <button onClick={() => {
                                    const mods = [...selectedTopic.modules];
                                    mods[modIdx] = { ...mod, problems: mod.problems.filter(item => item.id !== p.id) };
                                    handleUpdateTopic({ ...selectedTopic, modules: mods });
                                  }}><X size={14} className="text-zinc-300" /></button>
                               </div>
                             ))}
                             <button 
                               onClick={() => {
                                 const mods = [...selectedTopic.modules];
                                 const newP: DailyProblem = { id: `p-${Date.now()}`, title: 'Problem', description: '', difficulty: 'EASY', points: 10, platform: PlatformType.LEETCODE, externalLink: '' };
                                 mods[modIdx] = { ...mod, problems: [...mod.problems, newP] };
                                 handleUpdateTopic({ ...selectedTopic, modules: mods });
                               }}
                               className="text-[11px] font-bold text-zinc-400 hover:text-zinc-900"
                             >+ Add Problem</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-40 text-center text-zinc-300 font-bold uppercase tracking-widest border-2 border-dashed border-border rounded-xl">
                  Select a cloud track to begin editing
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'DAILY' && (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-black tracking-tight">{monthNames[currentMonth]} {currentYear}</h2>
                <div className="flex gap-2">
                   <button onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"><ChevronLeft size={16} /></button>
                   <button onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg"><ChevronRight size={16} /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-center text-[10px] font-black text-zinc-400 py-2">{d}</div>)}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const ds = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const has = challenges.some(c => c.date === ds);
                  return (
                    <button key={day} onClick={() => setSelectedDate(ds)} className={`h-16 rounded-lg border p-2 flex flex-col justify-between transition-all ${selectedDate === ds ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-zinc-900' : 'bg-white dark:bg-zinc-950 border-border hover:border-zinc-300'}`}>
                      <span className="text-[11px] font-bold">{day}</span>
                      {has && <div className={`w-1.5 h-1.5 rounded-full mx-auto ${selectedDate === ds ? 'bg-white dark:bg-black' : 'bg-emerald-500'}`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-96 bg-zinc-50 dark:bg-zinc-900/50 border border-border rounded-2xl p-6">
               <h3 className="text-[13px] font-black tracking-tight mb-6">Schedule for {selectedDate}</h3>
               <div className="space-y-4">
                  {(currentChallenge?.problems || []).map((p, idx) => (
                    <div key={p.id} className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-border space-y-3">
                       <input value={p.title} onChange={e => {
                         const probs = [...(currentChallenge?.problems || [])];
                         probs[idx] = { ...p, title: e.target.value };
                         handleUpdateChallenge(selectedDate, probs);
                       }} className="w-full bg-transparent font-bold text-[13px] outline-none" />
                       <input value={p.externalLink} onChange={e => {
                         const probs = [...(currentChallenge?.problems || [])];
                         probs[idx] = { ...p, externalLink: e.target.value };
                         handleUpdateChallenge(selectedDate, probs);
                       }} className="w-full bg-transparent text-[11px] text-zinc-500 outline-none truncate" />
                       <div className="flex justify-between items-center pt-2 border-t border-border">
                          <button onClick={() => handleUpdateChallenge(selectedDate, (currentChallenge?.problems || []).filter(item => item.id !== p.id))} className="text-zinc-300 hover:text-red-500"><Trash2 size={13} /></button>
                          <div className="flex items-center gap-2">
                             <Zap size={10} className="text-amber-500" />
                             <input type="number" value={p.points} onChange={e => {
                                const probs = [...(currentChallenge?.problems || [])];
                                probs[idx] = { ...p, points: parseInt(e.target.value) || 0 };
                                handleUpdateChallenge(selectedDate, probs);
                             }} className="w-10 bg-transparent text-[11px] font-black text-center outline-none" />
                          </div>
                       </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const probs = [...(currentChallenge?.problems || [])];
                      probs.push({ id: `dp-${Date.now()}`, title: 'New Challenge', description: '', difficulty: 'EASY', points: 10, platform: PlatformType.LEETCODE, externalLink: '' });
                      handleUpdateChallenge(selectedDate, probs);
                    }}
                    className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >+ New Challenge Slot</button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl overflow-hidden shadow-sm">
             <div className="p-6 border-b border-border flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-sm">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                   <input placeholder="Search students..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-border pl-10 pr-4 py-2 rounded-lg text-[13px] outline-none" />
                </div>
             </div>
             <table className="w-full text-left">
                <thead className="bg-zinc-50/50 dark:bg-white/5 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Student Profile</th>
                    <th className="px-6 py-4">Password (Supabase Sync)</th>
                    <th className="px-6 py-4 text-center">Cloud XP</th>
                    <th className="px-6 py-4 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                   {users.filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                     <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-zinc-400 text-[10px]">{u.name[0]}</div>
                           <div><p className="text-[13px] font-bold">{u.name}</p><p className="text-[11px] text-zinc-500">{u.email}</p></div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-zinc-400">{u.password}</td>
                        <td className="px-6 py-4 text-center font-bold text-[13px]">{u.points}</td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => toggleBlockUser(u.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${u.isBlocked ? 'bg-red-50 text-red-500 border-red-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                              {u.isBlocked ? 'Blocked' : 'Active'}
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {pathToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => !isDeleting && setPathToDelete(null)} />
             <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 text-center space-y-6">
                <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto"><AlertTriangle size={24} /></div>
                <div><h3 className="text-lg font-bold">Remove Cloud Track?</h3><p className="text-[13px] text-zinc-500 mt-1">This will permanently delete this curriculum from Supabase.</p></div>
                <div className="flex gap-2">
                   <button disabled={isDeleting} onClick={() => setPathToDelete(null)} className="flex-1 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[13px] font-bold">Cancel</button>
                   <button disabled={isDeleting} onClick={confirmDeletePath} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2">
                     {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete From Cloud'}
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;
