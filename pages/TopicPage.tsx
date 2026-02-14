
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Topic, User, UserProgress, Module, ContentBlock, DailyProblem } from '../types';
import Layout from '../components/Layout';
import { ApiService } from '../services/api';
import { getTopicInsight } from '../services/geminiService';
import { 
  Play, FileText, Code, ChevronLeft, CheckCircle2, Menu, 
  Check, Circle, Shield, X, AlertCircle, Info, Loader2, Sparkles, BrainCircuit
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
}> = ({ isDark, onLogout, user, setDark, progress, onMarkAsSolved, onUpdateUnitProgress }) => {
  const { id } = useParams();
  const [topic, setFullTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // AI Insight State
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      const detailedTopic = await ApiService.fetchTopicById(id);
      setFullTopic(detailedTopic);
      setLoading(false);
    };
    loadDetail();
  }, [id]);

  useEffect(() => {
    if (topic && topic.modules && topic.modules.length > 0 && !selectedModule) {
      const firstVisible = topic.modules.find(m => m.isVisible) || topic.modules[0];
      setSelectedModule(firstVisible);
      const firstBlock = firstVisible.contentBlocks.find(b => b.isVisible) || firstVisible.contentBlocks[0];
      if (firstBlock) setSelectedBlockId(firstBlock.id);
      else if (firstVisible.problems.length > 0) setSelectedBlockId('coding-problems');
    }
  }, [topic, selectedModule]);

  const handleGenerateInsight = async () => {
    if (!selectedModule || !topic) return;
    setIsGeneratingInsight(true);
    const insight = await getTopicInsight(topic.title, selectedModule.title, selectedModule.description || "Core engineering principles.");
    setAiInsight(insight);
    setIsGeneratingInsight(false);
  };

  const selectedBlock = useMemo(() => {
    if (!selectedModule || !selectedBlockId) return null;
    if (selectedBlockId === 'coding-problems') return { id: 'coding-problems', type: 'PROBLEMS_VIEW', title: 'Coding Challenges' } as any;
    return selectedModule.contentBlocks.find(b => b.id === selectedBlockId);
  }, [selectedModule, selectedBlockId]);

  const getEmbedUrl = (url: string = '') => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}?rel=0&modestbranding=1` : url;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-app">
      <Loader2 className="animate-spin text-zinc-400" size={32} />
    </div>
  );

  if (!topic) return <Navigate to="/" />;

  return (
    <div className={`h-screen flex flex-col bg-app ${isDark ? 'dark' : ''}`}>
      {/* AI Insight Overlay */}
      {aiInsight && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[32px] p-10 shadow-2xl animate-premium-entry border border-border">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4 text-emerald-500">
                <BrainCircuit size={28} />
                <h3 className="text-xl font-black tracking-tight">Neural Insight</h3>
              </div>
              <button onClick={() => setAiInsight(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full"><X size={20} /></button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium whitespace-pre-wrap">
                {aiInsight}
              </p>
            </div>
            <div className="mt-10 pt-6 border-t border-border text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Powered by Gemini Engineering Core</p>
            </div>
          </div>
        </div>
      )}

      <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all">
            <Menu size={18} />
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-[13px] hover:opacity-70 transition-all">
            <ChevronLeft size={16} /> {topic.title}
          </Link>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={handleGenerateInsight}
             disabled={isGeneratingInsight}
             className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
           >
             {isGeneratingInsight ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
             AI Analysis
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-0 opacity-0'} shrink-0 border-r border-border bg-surface transition-all duration-300 overflow-y-auto`}>
          <div className="p-6 space-y-8">
            <nav className="space-y-4">
              {topic.modules.filter(m => m.isVisible).map((mod, idx) => {
                const isActive = selectedModule?.id === mod.id;
                return (
                  <div key={mod.id}>
                    <button
                      onClick={() => { setSelectedModule(mod); if(mod.contentBlocks[0]) setSelectedBlockId(mod.contentBlocks[0].id); else if(mod.problems.length > 0) setSelectedBlockId('coding-problems'); }}
                      className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all ${
                        isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg' : 'hover:bg-zinc-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="text-[13px] font-bold truncate">{idx + 1}. {mod.title}</span>
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-app p-8 lg:p-12">
          <div className="max-w-[1000px] mx-auto animate-content">
            {selectedBlock?.type === 'VIDEO' && (
              <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-border">
                <iframe src={getEmbedUrl(selectedBlock.url)} className="w-full h-full" allowFullScreen />
              </div>
            )}
            {selectedBlockId === 'coding-problems' && selectedModule && (
              <div className="space-y-10">
                <h2 className="text-2xl font-black tracking-tight">{selectedModule.title} Mission</h2>
                <div className="space-y-3">
                  {selectedModule.problems.map(p => (
                    <div key={p.id} onClick={() => window.open(p.externalLink, '_blank')} className="bg-white dark:bg-zinc-900 border border-border p-5 rounded-2xl cursor-pointer flex items-center justify-between hover:border-zinc-400 transition-all">
                      <span className="text-[15px] font-bold">{p.title}</span>
                      <span className="text-[11px] font-black text-zinc-400">{p.points} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TopicPage;
