import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Topic, User, UserProgress, Module, ContentBlock, PlatformType } from '../types';
import Layout from '../components/Layout';
import { 
  Play, FileText, Code, ChevronLeft, CheckCircle2, Menu, 
  ExternalLink, Lock, Check, Circle, Activity, Shield, PieChart,
  ChevronRight, CircleDot, ArrowUpRight
} from 'lucide-react';

const TopicPage: React.FC<{ 
  topics: Topic[]; 
  isDark: boolean; 
  onLogout: () => void; 
  user: User; 
  setDark: (dark: boolean) => void; 
  progress: UserProgress; 
  onMarkAsSolved: (id: string, points: number) => void;
  onUpdateUnitProgress: (moduleId: string, blockId: string) => void;
}> = ({ topics, isDark, onLogout, user, setDark, progress, onMarkAsSolved, onUpdateUnitProgress }) => {
  const { id } = useParams();
  const topic = useMemo(() => topics.find(t => t.id === id), [topics, id]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ContentBlock | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Local state for persistence check
  const [localSolvedIds, setLocalSolvedIds] = useState<string[]>([]);

  useEffect(() => {
    // Sync localSolvedIds from localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('codex_completed_'));
    const solved = keys.map(k => k.replace('codex_completed_', ''));
    setLocalSolvedIds(solved);
  }, [progress.completedDailyProblemIds]);

  useEffect(() => {
    if (topic && topic.modules.length > 0 && !selectedModule) {
      const firstVisible = topic.modules.find(m => m.isVisible) || topic.modules[0];
      setSelectedModule(firstVisible);
      const firstBlock = firstVisible.contentBlocks.find(b => b.isVisible) || firstVisible.contentBlocks[0];
      if (firstBlock) setSelectedBlock(firstBlock);
    }
  }, [topic, selectedModule]);

  const getEmbedUrl = (url: string = '') => {
    if (!url) return '';
    const videoIdMatch = url.match(/(?:v=|\/embed\/|youtu\.be\/)([^&?]+)/);
    if (videoIdMatch && videoIdMatch[1]) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}?rel=0&modestbranding=1`;
    }
    return url;
  };

  const isModuleLocked = (mod: Module) => {
    const idx = topic?.modules.indexOf(mod) || 0;
    if (idx === 0) return false;
    const prev = topic?.modules[idx - 1];
    return !progress.unitProgress[prev?.id || '']?.moduleCompleted;
  };

  const isBlockDone = (modId: string, blockId: string) => {
    // Check global progress OR local persistence
    const isCompletedLocally = blockId.startsWith('p-') ? localSolvedIds.includes(blockId) : false;
    const blockIdFromProblem = selectedModule?.contentBlocks.find(b => b.id === blockId)?.problem?.id;
    const problemSolved = blockIdFromProblem ? progress.completedDailyProblemIds.includes(blockIdFromProblem) || localSolvedIds.includes(blockIdFromProblem) : false;

    return progress.unitProgress[modId]?.completedBlockIds.includes(blockId) || problemSolved || isCompletedLocally;
  };

  const handleBlockCompletion = (block: ContentBlock) => {
    if (selectedModule && !isBlockDone(selectedModule.id, block.id)) {
      onUpdateUnitProgress(selectedModule.id, block.id);
      if (block.type === 'PROBLEM' && block.problem) {
        localStorage.setItem(`codex_completed_${block.problem.id}`, "true");
        onMarkAsSolved(block.problem.id, block.problem.points);
        setLocalSolvedIds(prev => [...prev, block.problem!.id]);
      }
    }
  };

  if (!topic) return <Navigate to="/" />;

  const moduleProblems = selectedModule?.contentBlocks.filter(b => b.type === 'PROBLEM') || [];

  return (
    <div className={`h-screen flex flex-col bg-app ${isDark ? 'dark' : ''}`}>
      <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all">
            <Menu size={18} />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-[13px] hover:opacity-70 transition-all">
            <ChevronLeft size={16} /> {topic.title}
          </Link>
        </div>
        <div className="flex items-center gap-3 px-3 py-1 bg-zinc-50 dark:bg-white/5 rounded-full border border-border">
          <span className="text-[11px] font-black tracking-tight">{progress.points?.toLocaleString()} XP</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-0 opacity-0'} shrink-0 border-r border-border bg-surface transition-all duration-300 overflow-y-auto`}>
          <div className="p-6 space-y-8">
            <div className="space-y-1">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Registry</h3>
              <p className="text-[11px] font-bold text-zinc-500">{progress.completedModuleIds.length} / {topic.modules.length} Completed</p>
            </div>

            <nav className="space-y-4">
              {topic.modules.filter(m => m.isVisible).map((mod, idx) => {
                const isActive = selectedModule?.id === mod.id;
                const locked = isModuleLocked(mod);
                const done = progress.unitProgress[mod.id]?.moduleCompleted;

                return (
                  <div key={mod.id} className="space-y-2">
                    <button
                      onClick={() => { setSelectedModule(mod); const first = mod.contentBlocks[0]; if(first) setSelectedBlock(first); }}
                      disabled={locked}
                      className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all ${
                        isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' : locked ? 'opacity-30' : 'hover:bg-zinc-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="shrink-0">
                         {done ? <CheckCircle2 size={16} className="text-emerald-500" /> : locked ? <Lock size={16} /> : <div className="w-4 h-4 rounded-full border border-zinc-200 dark:border-zinc-700" />}
                      </div>
                      <span className="text-[13px] font-bold truncate">{idx + 1}. {mod.title}</span>
                    </button>
                    
                    {isActive && (
                      <div className="ml-8 space-y-1.5 animate-content">
                        {mod.contentBlocks.filter(b => b.isVisible).map(block => (
                          <button 
                            key={block.id} 
                            onClick={() => setSelectedBlock(block)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${selectedBlock?.id === block.id ? 'bg-zinc-100 dark:bg-white/10 text-black dark:text-white' : 'text-zinc-400 hover:text-zinc-900'}`}
                          >
                            {isBlockDone(mod.id, block.id) ? <Check size={12} className="text-emerald-500" /> : (
                              block.type === 'VIDEO' ? <Play size={12} /> :
                              block.type === 'PDF' ? <FileText size={12} /> : <Code size={12} />
                            )}
                            <span className="truncate">{block.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-app p-8 lg:p-12">
          <div className="max-w-[1000px] mx-auto animate-content">
            {selectedBlock?.type === 'VIDEO' && (
              <div className="space-y-8">
                <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-border">
                  <iframe 
                    src={getEmbedUrl(selectedBlock.url)} 
                    className="w-full h-full" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                </div>
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{selectedBlock.title}</h2>
                    <p className="text-zinc-500 text-[14px] font-bold uppercase tracking-widest mt-1">Video Session</p>
                  </div>
                  {!isBlockDone(selectedModule?.id || '', selectedBlock.id) && (
                    <button 
                      onClick={() => handleBlockCompletion(selectedBlock)}
                      className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[13px] flex items-center gap-2 shadow-xl transition-all active:scale-95"
                    >
                      Verify Attendance <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedBlock?.type === 'PDF' && (
              <div className="space-y-8 no-select" onContextMenu={e => e.preventDefault()}>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-border flex justify-between items-center shadow-sm">
                   <h3 className="text-[15px] font-bold flex items-center gap-3"><FileText size={20} /> {selectedBlock.title}</h3>
                   <div className="flex items-center gap-5">
                      {!isBlockDone(selectedModule?.id || '', selectedBlock.id) && (
                        <button 
                          onClick={() => handleBlockCompletion(selectedBlock)}
                          className="px-6 py-2.5 bg-zinc-100 dark:bg-white/10 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                        >
                          Confirm Reading
                        </button>
                      )}
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest border border-border px-3 py-1 rounded-full">Resources</span>
                   </div>
                </div>
                <div className="h-[700px] bg-white rounded-3xl overflow-hidden border border-border shadow-2xl">
                  <iframe 
                    src={`${selectedBlock.url}#toolbar=0&navpanes=0&scrollbar=0`} 
                    className="w-full h-full pointer-events-none select-none" 
                  />
                </div>
              </div>
            )}

            {selectedBlock?.type === 'PROBLEM' && (
              <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border pb-6 gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight uppercase tracking-wide">{selectedModule?.title}</h2>
                    <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">Engineering Problem Set</p>
                  </div>
                  <div className="flex items-center gap-4 px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-xl">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">LeetCode Sync Active</span>
                  </div>
                </div>

                {/* Vertical Stacked List Style (LeetCode/GFG style) */}
                <div className="space-y-2">
                  {moduleProblems.map((block) => {
                    if (!block.problem) return null;
                    // Check logic for status icon: circle or green tick
                    const isSolved = isBlockDone(selectedModule?.id || '', block.id);
                    
                    const diffColors = {
                      EASY: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5',
                      MEDIUM: 'text-amber-500 border-amber-500/20 bg-amber-500/5',
                      HARD: 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                    }[block.problem.difficulty];

                    return (
                      <div 
                        key={block.id}
                        onClick={() => {
                          handleBlockCompletion(block);
                          window.open(block.problem?.externalLink, '_blank');
                        }}
                        className="group bg-white dark:bg-zinc-900 border border-border p-4 rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          {/* Left side: Status Icon, Title, Difficulty */}
                          <div className="shrink-0 flex items-center justify-center w-6 h-6">
                            {isSolved ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <Check size={12} strokeWidth={4} />
                              </div>
                            ) : (
                              <Circle size={20} className="text-zinc-200 dark:text-zinc-800" />
                            )}
                          </div>
                          
                          <h4 className="text-[14px] font-bold text-zinc-900 dark:text-white transition-colors group-hover:text-black dark:group-hover:text-white">
                            {block.problem.title}
                          </h4>
                          
                          <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${diffColors}`}>
                            {block.problem.difficulty}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="hidden sm:flex items-center gap-2">
                             <Code size={14} className="text-zinc-300" />
                             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{block.problem.platform}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {moduleProblems.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl opacity-30">
                     <Shield size={48} className="mb-4" />
                     <p className="text-[13px] font-black uppercase tracking-widest">No Problems Registered in Unit</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TopicPage;