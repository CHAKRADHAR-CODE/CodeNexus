
import React, { useState, useMemo } from 'react';
import { User, UserRole, Topic, DailyChallengeSet, UserProgress, RankTier } from '../types';
import Layout, { getLevelData } from '../components/Layout';
import { getTopicIcon } from '../constants';
import { Link } from 'react-router-dom';
import { 
  Flame, Trophy, Sparkles, ArrowRight, CheckCircle2, 
  Target, Circle, Search, Star
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  users: User[];
  topics: Topic[];
  challenges: DailyChallengeSet[];
  progress: UserProgress;
  onLogout: () => void;
  isDark: boolean;
  setDark: (dark: boolean) => void;
  onMarkAsSolved: (problemId: string, points: number) => void;
  onMarkAsAttempted: (problemId: string) => void;
  currentDateStr: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user, users, topics, challenges, progress, onLogout, isDark, setDark, onMarkAsSolved, onMarkAsAttempted, currentDateStr
}) => {
  const [search, setSearch] = useState('');
  const todaysChallenge = challenges.find(c => c.date === currentDateStr);
  const levelData = useMemo(() => getLevelData(progress.points), [progress.points]);

  const streakDots = useMemo(() => {
    const dots = [];
    const today = new Date(currentDateStr);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      dots.push({
        date: ds,
        completed: progress.completedDates.includes(ds),
        isToday: ds === currentDateStr
      });
    }
    return dots;
  }, [currentDateStr, progress.completedDates]);

  const filteredTopics = topics.filter(t => t.isVisible && t.title.toLowerCase().includes(search.toLowerCase()));
  const topPerformers = users.filter(u => u.role === UserRole.STUDENT).sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);
  const userRank = users.filter(u => u.role === UserRole.STUDENT).sort((a, b) => (b.points || 0) - (a.points || 0)).findIndex(u => u.id === user.id) + 1;

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark} points={progress.points}>
      <div className="max-w-7xl mx-auto space-y-10 animate-content px-4">
        
        {/* Premium Welcome Banner - Light/Dark Synced */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[32px] flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 dark:bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />
           
           <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                 <div className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-[9px] font-black tracking-widest uppercase shadow-sm">
                    LEVEL {levelData.level}
                 </div>
                 <span className="text-[12px] font-bold text-zinc-400">#{userRank} GLOBAL RANK</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white">Hello, {user.name.split(' ')[0]}</h1>
              <p className="text-zinc-400 font-semibold text-[14px]">{levelData.badge}</p>
           </div>

           <div className="relative z-10 flex gap-10">
              <div className="text-center">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">SYNC POINTS</p>
                 <div className="text-2xl font-black text-zinc-900 dark:text-white">{progress.points.toLocaleString()}</div>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">TOTAL STREAK</p>
                 <div className="text-2xl font-black flex items-center gap-2.5 justify-center text-zinc-900 dark:text-white">
                   <Flame className="text-orange-500 fill-orange-500" size={20} /> {progress.currentStreak}
                 </div>
              </div>
           </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Grid */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                <Target size={14} className="text-zinc-400" /> ENGINEERING TRACKS
              </h2>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input
                  type="text"
                  placeholder="Filter curriculum..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 pl-10 pr-4 py-2 rounded-2xl text-[12px] w-48 focus:border-zinc-400 dark:focus:border-zinc-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredTopics.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/topic/${topic.id}`}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 rounded-[28px] group transition-all hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-5">
                    <div className="w-10 h-10 bg-zinc-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all">
                      {getTopicIcon(topic.icon)}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold tracking-tight mb-1.5 text-zinc-900 dark:text-white">{topic.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[12px] font-medium leading-relaxed">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{topic.modules.filter(m => m.isVisible).length} EXPERT UNITS</span>
                    <ArrowRight size={16} className="text-zinc-300 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[340px] space-y-8">
            {/* Today's Mission Card - Fixed UI (No more hardcoded black) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 rounded-[28px] shadow-sm space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity dark:text-white text-black"><Sparkles size={100} /></div>
              
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Star size={15} className="text-amber-400 fill-amber-400" />
                  <h3 className="text-[14px] font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Today's Mission</h3>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">DAY GOAL</span>
              </div>

              <div className="relative z-10 flex justify-center gap-2.5">
                {streakDots.map((dot, idx) => (
                  <div 
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      dot.completed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 
                      dot.isToday ? 'border border-zinc-300 dark:border-zinc-700 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  />
                ))}
              </div>

              <div className="relative z-10 space-y-2.5">
                {todaysChallenge?.problems.map((p) => {
                  const isSolved = progress.completedDailyProblemIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => window.open(p.externalLink, '_blank')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSolved ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20' : 'bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        {isSolved ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} className="text-zinc-300 dark:text-zinc-700" />}
                        <div>
                          <p className={`text-[12px] font-bold ${isSolved ? 'text-emerald-600 dark:text-emerald-400 line-through' : 'text-zinc-900 dark:text-zinc-200'}`}>{p.title}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            p.difficulty === 'EASY' ? 'text-emerald-500' : p.difficulty === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500'
                          }`}>{p.difficulty}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600">{p.points} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Standings Sidebar */}
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                 STANDINGS
              </h3>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-5 shadow-sm space-y-3">
                {topPerformers.map((u, idx) => (
                  <div key={u.id} className="flex items-center justify-between group py-1">
                    <div className="flex items-center gap-3.5">
                      <span className="text-[11px] font-black text-zinc-300 dark:text-zinc-700 w-4">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-white/5 flex items-center justify-center font-bold text-[11px] text-zinc-400 border border-zinc-100 dark:border-zinc-800">{u.name[0]}</div>
                      <span className={`text-[12px] font-bold ${u.id === user.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {u.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-zinc-400">{u.points}</span>
                  </div>
                ))}
                <Link to="/ranking" className="block text-center pt-4 border-t border-zinc-100 dark:border-zinc-800/50 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                   FULL LEADERBOARD
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
