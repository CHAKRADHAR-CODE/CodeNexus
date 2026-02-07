
import React, { useState, useMemo } from 'react';
import { User, UserRole, Topic, DailyChallengeSet, UserProgress, DailyProblem, RankTier } from '../types';
import Layout, { getLevelData } from '../components/Layout';
import { getTopicIcon } from '../constants';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Flame, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Target,
  Circle,
  RefreshCw,
  TrendingUp
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
  isSyncing?: boolean;
  isFastSyncing?: boolean;
  currentDateStr: string;
}

const getTierInfo = (points: number = 0) => {
  if (points >= 5000) return { name: RankTier.ELITE, color: 'text-indigo-600 dark:text-indigo-400' };
  if (points >= 3500) return { name: RankTier.DIAMOND, color: 'text-cyan-600 dark:text-cyan-400' };
  if (points >= 2500) return { name: RankTier.PLATINUM, color: 'text-zinc-600 dark:text-zinc-400' };
  if (points >= 1500) return { name: RankTier.GOLD, color: 'text-orange-600 dark:text-orange-400' };
  return { name: RankTier.BRONZE, color: 'text-zinc-500' };
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ 
  user, users, topics, challenges, progress, onLogout, isDark, setDark, onMarkAsSolved, onMarkAsAttempted, isSyncing, isFastSyncing, currentDateStr
}) => {
  const [search, setSearch] = useState('');
  const todaysChallenge = challenges.find(c => c.date === currentDateStr);
  const levelData = useMemo(() => getLevelData(progress.points), [progress.points]);

  const isDayCompleted = useMemo(() => {
    return progress.lastChallengeDate === currentDateStr;
  }, [progress.lastChallengeDate, currentDateStr]);

  const streakDots = useMemo(() => {
    const dots = [];
    const today = new Date(currentDateStr);
    for (let i = 4; i >= 0; i--) {
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

  // Filter topics based on search AND visibility
  const filteredTopics = topics.filter(t => 
    t.isVisible && t.title.toLowerCase().includes(search.toLowerCase())
  );

  const topPerformers = users
    .filter(u => u.role === UserRole.STUDENT)
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 5);

  const userRank = users
    .filter(u => u.role === UserRole.STUDENT)
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .findIndex(u => u.id === user.id) + 1;

  const tier = getTierInfo(progress.points);

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark} points={progress.points}>
      <div className="space-y-8 animate-fade max-w-7xl mx-auto px-2">
        
        {/* Simplified Clean Banner */}
        <section className="bg-white dark:bg-zinc-900 border border-border p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${levelData.bg} ${levelData.color}`}>
                LEVEL {levelData.level} • {levelData.badge}
              </span>
              {isSyncing && (
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  <RefreshCw size={10} className="animate-spin" /> Syncing
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {user.name.split(' ')[0]}</h1>
            <p className="text-[13px] text-zinc-500 font-medium">Ranked #{userRank} globally</p>
          </div>

          <div className="flex gap-10">
            <div className="text-right">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Points</p>
              <div className="text-xl font-bold flex items-center gap-2">
                <Trophy className="text-zinc-400" size={16} /> {progress.points.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Streak</p>
              <div className="text-xl font-bold flex items-center gap-2">
                <Flame className="text-orange-500" size={16} fill="currentColor" /> {progress.currentStreak}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} /> Learning Tracks
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                <input
                  type="text"
                  placeholder="Find tracks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white dark:bg-zinc-950 border border-border pl-8 pr-3 py-1.5 rounded-md text-[12px] w-48 focus:border-zinc-400 transition-colors outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTopics.map((topic) => (
                <Link
                  key={topic.id}
                  to={`/topic/${topic.id}`}
                  className="premium-card p-5 group"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="w-8 h-8 bg-zinc-50 dark:bg-white/5 rounded flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {getTopicIcon(topic.icon)}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold tracking-tight">{topic.title}</h3>
                      <p className="text-zinc-500 text-[11px] mt-0.5">{topic.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{topic.modules.filter(m => m.isVisible).length} Units</span>
                    <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </Link>
              ))}
              {filteredTopics.length === 0 && (
                 <div className="col-span-full py-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-zinc-400">
                    <Target size={32} className="opacity-20 mb-3" />
                    <p className="text-[13px] font-bold uppercase tracking-widest opacity-40">No tracks available yet</p>
                 </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[300px] shrink-0 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border p-5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-zinc-400" size={14} />
                <h3 className="text-[13px] font-bold tracking-tight">Daily Challenge</h3>
                <span className="ml-auto text-[10px] font-medium text-zinc-400">{currentDateStr}</span>
              </div>

              <div className="flex items-center justify-between mb-5 px-0.5">
                <div className="flex gap-2">
                  {streakDots.map((dot) => (
                    <div 
                      key={dot.date} 
                      className={`w-2 h-2 rounded-full ${
                        dot.completed 
                        ? 'bg-emerald-500' 
                        : dot.isToday ? 'border border-zinc-300' : 'bg-zinc-100 dark:bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-zinc-50 dark:bg-white/5 rounded border border-border">
                   <Flame size={10} className="text-orange-500" fill="currentColor" />
                   <span className="text-[10px] font-bold">{progress.currentStreak}</span>
                </div>
              </div>

              {isDayCompleted && (
                 <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-md flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Goal Achieved</span>
                 </div>
              )}
              
              <div className="space-y-1">
                {todaysChallenge?.problems.map((p) => {
                  const isSolved = progress.completedDailyProblemIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      onClick={() => { onMarkAsAttempted(p.id); window.open(p.externalLink, '_blank'); }}
                      className="group flex items-center justify-between p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isSolved ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-zinc-300" />}
                        <span className={`text-[12px] font-medium ${isSolved ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>{p.title}</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400">{p.points} XP</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-border p-5 rounded-lg shadow-sm">
              <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <TrendingUp size={14} /> Standings
              </h3>
              
              <div className="space-y-3">
                {topPerformers.map((u, idx) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-300 w-3">{idx + 1}</span>
                      <span className={`text-[12px] font-semibold ${u.id === user.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                        {u.name.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-zinc-400">{u.points}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/ranking" className="mt-5 block text-center py-2 border border-border text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
