
import React, { useState, useMemo } from 'react';
import { User, UserRole, RankTier } from '../types';
import Layout from '../components/Layout';
import { 
  Trophy, 
  Flame, 
  Medal, 
  Crown, 
  Search,
  Activity,
  Zap,
  Globe,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface RankingPageProps {
  user: User;
  users: User[];
  onLogout: () => void;
  isDark: boolean;
  setDark: (dark: boolean) => void;
}

const getTier = (points: number = 0): { name: RankTier, color: string, bg: string } => {
  if (points >= 5000) return { name: RankTier.ELITE, color: 'text-purple-500', bg: 'bg-purple-500/10' };
  if (points >= 3500) return { name: RankTier.DIAMOND, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
  if (points >= 2500) return { name: RankTier.PLATINUM, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
  if (points >= 1500) return { name: RankTier.GOLD, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  if (points >= 500) return { name: RankTier.SILVER, color: 'text-slate-400', bg: 'bg-slate-400/10' };
  return { name: RankTier.BRONZE, color: 'text-orange-600', bg: 'bg-orange-500/10' };
};

const RankingPage: React.FC<RankingPageProps> = ({ user, users, onLogout, isDark, setDark }) => {
  const [search, setSearch] = useState('');
  
  const leaderboard = useMemo(() => {
    return users
      .filter(u => u.role === UserRole.STUDENT)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  const currentUserRank = leaderboard.findIndex(u => u.id === user.id) + 1;

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return <Crown size={18} className="text-amber-400" />;
      case 2: return <Medal size={18} className="text-slate-300" />;
      case 3: return <Medal size={18} className="text-orange-400" />;
      default: return <span className="text-[10px] font-bold text-slate-400 w-5 text-center">{rank}</span>;
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark}>
      <div className="max-w-7xl mx-auto space-y-12 animate-fade pb-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Global Ranking</h1>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 max-w-lg font-medium">Monitoring {users.length} verified candidates across all synced platforms.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 bg-white dark:bg-zinc-900 border border-border pl-12 pr-4 py-3 rounded-[12px] text-sm focus:border-brand-accent outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[14px] overflow-hidden shadow-sm">
              <div className="px-8 py-4 border-b border-border bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Candidate Registry</span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Sync
                </span>
              </div>
              
              <div className="divide-y divide-border">
                {leaderboard.map((u, idx) => {
                  const rank = idx + 1;
                  const tier = getTier(u.points);
                  const isSelf = u.id === user.id;

                  return (
                    <div 
                      key={u.id}
                      className={`px-8 py-4 flex items-center gap-6 group transition-colors ${
                        isSelf ? 'bg-brand-500/[0.03] dark:bg-white/5' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 flex justify-center shrink-0">
                        {getRankBadge(rank)}
                      </div>
                      
                      <div className="flex-1 flex items-center gap-4">
                        <div className="w-9 h-9 rounded-[8px] bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 font-bold text-[12px] border border-border">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {u.name}
                            {isSelf && <span className="text-[8px] font-black bg-brand-500 dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded uppercase">Self</span>}
                          </div>
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${tier.color}`}>
                            {tier.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-10 shrink-0">
                        <div className="text-right w-20">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Points</div>
                          <div className="text-[13px] font-bold text-slate-900 dark:text-white">{u.points?.toLocaleString()}</div>
                        </div>
                        <div className="text-right w-12">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Streak</div>
                          <div className="text-[13px] font-bold text-orange-500 flex items-center justify-end gap-1">
                             {u.streak} <Flame size={12} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 dark:bg-zinc-900 rounded-[14px] p-8 text-white relative overflow-hidden shadow-xl">
               <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/30 to-transparent opacity-40" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-60">My Performance</h3>
                    <ShieldCheck size={20} className="text-brand-accent" />
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-[12px] font-medium opacity-60">Global Position</div>
                      <div className="text-3xl font-black tracking-tighter">#{currentUserRank}</div>
                    </div>
                    
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (user.points! % 500) / 5)}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-40">Top {Math.ceil((currentUserRank / leaderboard.length) * 100)}% of candidates</p>
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[14px] p-6 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <Activity size={16} className="text-brand-accent" />
                 <h3 className="text-[13px] font-bold tracking-tight text-slate-900 dark:text-white">Active Logs</h3>
               </div>
               
               <div className="space-y-5">
                 {[1,2,3].map((i) => (
                   <div key={i} className="flex gap-3">
                     <div className="w-8 h-8 rounded-[8px] bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 text-amber-500">
                       <Sparkles size={14} />
                     </div>
                     <div className="flex-1 space-y-0.5">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Sarah solved Two Sum</p>
                        <div className="flex items-center justify-between text-[9px] font-medium text-slate-400">
                           <span className="flex items-center gap-1"><Globe size={10} /> LeetCode</span>
                           <span>2m ago</span>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RankingPage;
