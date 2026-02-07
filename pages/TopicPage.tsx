
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Topic, User, UserProgress, Module, DailyProblem, UserUnitProgress } from '../types';
import Layout from '../components/Layout';
import { 
  Play, 
  FileText, 
  Code, 
  ChevronLeft, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight, 
  Zap, 
  ExternalLink, 
  BookOpen, 
  Menu, 
  Circle, 
  Lock,
  ArrowRight,
  Sun,
  Moon,
  CircleDot
} from 'lucide-react';

interface TopicPageProps {
  topics: Topic[];
  isDark: boolean;
  onLogout: () => void;
  user: User;
  setDark: (dark: boolean) => void;
  progress: UserProgress;
  onMarkAsSolved: (id: string, points: number) => void;
  onMarkAsAttempted: (id: string) => void;
  onUpdateUnitProgress: (moduleId: string, type: 'video' | 'pdf' | 'coding') => void;
  isSyncing?: boolean;
}

type ContentType = 'VIDEO' | 'PDF' | 'PROBLEM';

const TopicPage: React.FC<TopicPageProps> = ({ 
  topics, isDark, onLogout, user, setDark, progress, onMarkAsAttempted, onUpdateUnitProgress, isSyncing 
}) => {
  const { id } = useParams();
  const topic = topics.find(t => t.id === id);
  
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [contentType, setContentType] = useState<ContentType>('VIDEO');
  const [selectedProblem, setSelectedProblem] = useState<DailyProblem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [xpAnimate, setXpAnimate] = useState(false);

  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (topic && topic.modules.length > 0 && !selectedModule) {
      const firstAvailable = topic.modules.find(m => {
        const p = progress.unitProgress[m.id];
        return p?.unlocked || topic.modules[0].id === m.id;
      });
      setSelectedModule(firstAvailable || topic.modules[0]);
    }
  }, [topic]);

  if (!topic) return <div className="p-10 font-bold text-red-500">Path not found.</div>;

  const scrollToTop = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToNextItem = () => {
    if (!selectedModule) return;
    
    // 1. Check if there are more sub-units in current module
    if (contentType === 'VIDEO' && selectedModule.pdfUrl) {
      setContentType('PDF');
      scrollToTop();
      return;
    }
    if ((contentType === 'VIDEO' || contentType === 'PDF') && selectedModule.problems.length > 0) {
      setContentType('PROBLEM');
      setSelectedProblem(selectedModule.problems[0]);
      scrollToTop();
      return;
    }

    // 2. Otherwise, move to next module if available and unlocked
    const currentIdx = topic.modules.findIndex(m => m.id === selectedModule.id);
    if (currentIdx !== -1 && currentIdx + 1 < topic.modules.length) {
      const nextMod = topic.modules[currentIdx + 1];
      const nextProg = progress.unitProgress[nextMod.id];
      if (nextProg?.unlocked) {
        handleSelectModule(nextMod);
      }
    }
  };

  const handleSelectModule = (mod: Module) => {
    const modProg = progress.unitProgress[mod.id];
    const isFirst = topic.modules[0].id === mod.id;
    if (!modProg?.unlocked && !isFirst) return;

    setIsNavigating(true);
    setTimeout(() => {
      setSelectedModule(mod);
      if (mod.videoUrl) setContentType('VIDEO');
      else if (mod.pdfUrl) setContentType('PDF');
      else if (mod.problems.length > 0) {
        setContentType('PROBLEM');
        setSelectedProblem(mod.problems[0]);
      }
      setIsNavigating(false);
      scrollToTop();
    }, 150);
  };

  const handleActionClick = (type: 'video' | 'pdf' | 'coding') => {
    if (!selectedModule) return;
    const current = progress.unitProgress[selectedModule.id];
    const isCompleted = current && current[`${type}Completed` as keyof UserUnitProgress];

    if (!isCompleted) {
      onUpdateUnitProgress(selectedModule.id, type);
      setXpAnimate(true);
      setTimeout(() => setXpAnimate(false), 1000);
    }
    
    // Always navigate to next item to keep flow moving
    navigateToNextItem();
  };

  const isModuleLocked = (modId: string) => {
    if (modId === topic.modules[0].id) return false;
    return !progress.unitProgress[modId]?.unlocked;
  };

  return (
    <div className={`h-screen flex flex-col bg-app transition-colors duration-200 ${isDark ? 'dark' : ''}`}>
      {/* PROFESSIONAL HEADER */}
      <header className="h-14 shrink-0 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-slate-500">
            <Menu size={18} />
          </button>
          <div className="h-4 w-px bg-border"></div>
          <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <ChevronLeft size={16} className="text-slate-400" />
            <span className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">{topic.title}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-lg border border-border transition-all ${xpAnimate ? 'scale-110 border-amber-500 bg-amber-500/10' : ''}`}>
              <Zap size={14} className={`text-amber-500 fill-amber-500 ${xpAnimate ? 'animate-bounce' : ''}`} />
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{progress.points} XP</span>
           </div>
           <button onClick={() => setDark(!isDark)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
             {isDark ? <Sun size={16} /> : <Moon size={16} />}
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - 260px Fixed */}
        <aside className={`shrink-0 border-r border-border bg-white dark:bg-zinc-950 transition-all duration-300 overflow-y-auto ${isSidebarOpen ? 'w-[260px]' : 'w-0 opacity-0 pointer-events-none'}`}>
          <div className="p-4 space-y-6">
            <div className="px-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Course Units</h3>
              <p className="text-[11px] font-medium text-slate-500">{progress.completedModuleIds.length} / {topic.modules.length} modules finished</p>
            </div>

            <nav className="space-y-1">
              {topic.modules.map((mod, idx) => {
                const isActive = selectedModule?.id === mod.id;
                const locked = isModuleLocked(mod.id);
                const prog = progress.unitProgress[mod.id];
                const completed = prog?.moduleCompleted;
                const inProgress = prog && prog.progressPercent > 0 && !completed;
                
                return (
                  <div key={mod.id} className="group">
                    <button
                      onClick={() => handleSelectModule(mod)}
                      disabled={locked}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 relative ${
                        isActive 
                        ? 'bg-slate-50 dark:bg-white/5 border border-border shadow-sm' 
                        : locked ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="shrink-0 transition-transform group-active:scale-95">
                        {completed ? (
                          <div className="text-emerald-500 animate-fade scale-110"><CheckCircle2 size={16} strokeWidth={3} /></div>
                        ) : inProgress ? (
                          <div className="text-amber-500"><CircleDot size={16} strokeWidth={3} /></div>
                        ) : locked ? (
                          <Lock size={16} className="text-slate-300" />
                        ) : (
                          <Circle size={16} className="text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <span className={`text-[12px] font-semibold block truncate ${isActive ? 'text-brand-accent' : 'text-slate-600 dark:text-slate-400'}`}>
                          {idx + 1}. {mod.title}
                        </span>
                        {inProgress && (
                           <div className="w-full h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className="h-full bg-amber-500 transition-all duration-500" 
                                style={{ width: `${prog.progressPercent}%` }} 
                              />
                           </div>
                        )}
                      </div>
                    </button>
                    
                    {isActive && (
                      <div className="ml-7 mr-2 my-2 space-y-1 border-l border-border pl-4">
                        {mod.videoUrl && (
                          <button 
                            onClick={() => setContentType('VIDEO')}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${contentType === 'VIDEO' ? 'text-brand-accent bg-brand-accent/5' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                          >
                            <div className="flex items-center gap-2">
                              <Play size={10} fill={prog?.videoCompleted ? 'currentColor' : 'none'} className={prog?.videoCompleted ? 'text-emerald-500' : ''} /> Video
                            </div>
                            {prog?.videoCompleted && <CheckCircle2 size={10} className="text-emerald-500" />}
                          </button>
                        )}
                        {mod.pdfUrl && (
                          <button 
                            onClick={() => setContentType('PDF')}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${contentType === 'PDF' ? 'text-brand-accent bg-brand-accent/5' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={10} className={prog?.pdfCompleted ? 'text-emerald-500' : ''} /> Notes
                            </div>
                            {prog?.pdfCompleted && <CheckCircle2 size={10} className="text-emerald-500" />}
                          </button>
                        )}
                        {mod.problems.map(p => {
                          const solved = progress.completedDailyProblemIds.includes(p.id);
                          return (
                            <button 
                              key={p.id}
                              onClick={() => { setContentType('PROBLEM'); setSelectedProblem(p); }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${contentType === 'PROBLEM' && selectedProblem?.id === p.id ? 'text-brand-accent bg-brand-accent/5' : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              <div className="flex items-center gap-2">
                                <Code size={10} className={solved ? 'text-emerald-500' : ''} /> Challenge
                              </div>
                              {solved && <CheckCircle2 size={10} className="text-emerald-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* CONTENT STAGE - Centered 800px */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto bg-app p-8 md:p-12 scroll-smooth">
          <div className={`max-w-[800px] mx-auto transition-all duration-300 ${isNavigating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
              
              {contentType === 'VIDEO' && selectedModule?.videoUrl && (
                <div className="space-y-8">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border group relative">
                    <iframe
                      src={`${selectedModule.videoUrl}?modestbranding=1&rel=0&showinfo=0`}
                      className="w-full h-full"
                      allowFullScreen
                      title="Module Video"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">{selectedModule.title}</h2>
                      <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        Watch the lecture to understand the core concepts. Click completed to move to technical notes.
                      </p>
                    </div>
                    <button 
                      onClick={() => handleActionClick('video')}
                      className="shrink-0 px-6 py-3 bg-brand-500 dark:bg-white text-white dark:text-black rounded-lg text-[13px] font-bold flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all"
                    >
                       {progress.unitProgress[selectedModule.id]?.videoCompleted ? 'Completed' : 'Done Watching'} <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {contentType === 'PDF' && selectedModule?.pdfUrl && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText size={18} className="text-brand-accent" /> Technical Briefing
                     </h3>
                     <button 
                        onClick={() => handleActionClick('pdf')}
                        className="px-5 py-2.5 bg-brand-accent/5 hover:bg-brand-accent/10 text-brand-accent rounded-lg text-[12px] font-bold flex items-center gap-2 transition-all"
                     >
                        Mark as Read <ArrowRight size={14} />
                     </button>
                  </div>
                  <div className="h-[700px] bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-border shadow-sm">
                    <iframe src={`${selectedModule.pdfUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Viewer" />
                  </div>
                </div>
              )}

              {contentType === 'PROBLEM' && selectedProblem && (
                <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-lg overflow-hidden">
                  <div className="p-10 space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            selectedProblem.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            selectedProblem.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {selectedProblem.difficulty}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-white/5 rounded-md border border-border">
                            <Zap size={12} className="text-amber-500" /> {selectedProblem.points} XP
                          </span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{selectedProblem.title}</h2>
                      </div>
                      
                      <button 
                        onClick={() => {
                          onMarkAsAttempted(selectedProblem.id);
                          window.open(selectedProblem.externalLink, '_blank');
                        }}
                        className="px-8 py-4 bg-brand-500 dark:bg-white text-white dark:text-black rounded-xl text-[14px] font-bold flex items-center gap-2 shadow-xl hover:opacity-90 transition-all active:scale-95"
                      >
                        Solve on {selectedProblem.platform} <ExternalLink size={16} />
                      </button>
                    </div>

                    <div className="space-y-8">
                       <p className="text-[16px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line">
                         {selectedProblem.description}
                       </p>
                       
                       <div className="bg-slate-50 dark:bg-white/5 p-8 rounded-xl border border-border">
                          <div className="text-[11px] font-bold uppercase tracking-widest text-brand-accent mb-4 flex items-center gap-2">
                            <BookOpen size={16} /> Strategy Guide
                          </div>
                          <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                            Open the challenge on {selectedProblem.platform} and implement your solution. Our sync engine verifies submissions every few minutes. Once passed, this module marks as complete automatically.
                          </p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="px-10 py-5 bg-slate-50/50 dark:bg-white/5 border-t border-border flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sync Engine Active</span>
                     </div>
                     {progress.completedDailyProblemIds.includes(selectedProblem.id) ? (
                       <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-2 animate-fade">
                         <CheckCircle2 size={16} /> VERIFIED
                       </span>
                     ) : progress.attemptedProblemIds.includes(selectedProblem.id) ? (
                        <span className="text-[12px] font-bold text-amber-600 flex items-center gap-2 animate-pulse">
                         <CircleDot size={16} /> SYNCING...
                       </span>
                     ) : null}
                  </div>
                </div>
              )}

            {/* NAVIGATION FOOTER */}
            <div className="mt-20 pt-10 border-t border-border flex justify-between items-center">
               <button 
                 disabled={topic.modules[0].id === selectedModule?.id}
                 onClick={() => {
                   const idx = topic.modules.findIndex(m => m.id === selectedModule?.id);
                   if (idx > 0) handleSelectModule(topic.modules[idx-1]);
                 }}
                 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-10"
               >
                 <ChevronLeft size={18} /> Previous
               </button>
               
               <button 
                 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-brand-accent hover:text-brand-accent/80 transition-colors disabled:opacity-10"
                 onClick={navigateToNextItem}
                 disabled={!selectedModule || (isModuleLocked(topic.modules[topic.modules.findIndex(m => m.id === selectedModule.id) + 1]?.id) && (contentType === 'PROBLEM' || (contentType === 'PDF' && !selectedModule.problems.length)))}
               >
                 Next Item <ChevronRight size={18} />
               </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TopicPage;
