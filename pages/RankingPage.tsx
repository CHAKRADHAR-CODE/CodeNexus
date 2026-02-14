
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, RankTier } from '../types';
import Layout from '../components/Layout';
import { BADGES, getBadgeIcon } from '../constants';
import { ApiService } from '../services/api';
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
  ChevronRight,
  Award,
  Loader2
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

const RankingPage: React.FC<RankingPageProps> = ({ user, onLogout, isDark, setDark }) => {
  const [search, setSearch] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<Partial<User>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const data = await ApiService.fetchLeaderboard();
      setLeaderboardData(data);
      setLoading(false);
    };
    loadLeaderboard();
  }, []);
  
  const leaderboard = useMemo(() => {
    return leaderboardData
      .filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));
  }, [leaderboardData, search]);

  const currentUserRank = leaderboard.findIndex(u => u.id === user.id) + 1;

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return <Crown size={22} className="text-amber-400 drop-shadow-md" />;
      case 2: return <Medal size={20} className="text-slate-300" />;
      case 3: return <Medal size={20} className="text-orange-400" />;
      default: return <span className="text-[11px] font-black text-zinc-400 w-6 text-center">{rank}</span>;
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} isDark={isDark} setDark={setDark}>
      <div className="max-w-7xl mx-auto space-y-12 animate-fade pb-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Global Ranking</h1>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 max-w-lg font-bold">Vying for supremacy across {leaderboard.length} candidates.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search directory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 bg-white dark:bg-zinc-900 border border-border pl-12 pr-4 py-3 rounded-[16px] text-sm focus:border-zinc-900 outline-none transition-all shadow-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[28px] overflow-hidden shadow-sm min-h-[400px]">
              <div className="px-10 py-5 border-b border-border bg-zinc-50/50 dark:bg-white/5 flex items-center justify-between">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Candidate Registry</span>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/10">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> LIVE NODE
                </span>
              </div>
              
              <div className="divide-y divide-border">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-zinc-400" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Syncing Standings...</p>
                  </div>
                ) : leaderboard.map((u, idx) => {
                  const rank = idx + 1;
                  const tier = getTier(u.points);
                  const isSelf = u.id === user.id;

                  return (
                    <div 
                      key={u.id}
                      className={`px-10 py-5 flex items-center gap-8 group transition-colors ${
                        isSelf ? 'bg-zinc-100/50 dark:bg-white/5' : 'hover:bg-zinc-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 flex justify-center shrink-0">
                        {getRankBadge(rank)}
                      </div>
                      
                      <div className="flex-1 flex items-center gap-5">
                        <div className="w-11 h-11 rounded-[14px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-[14px] border border-border group-hover:bg-zinc-900 group-hover:text-white transition-all">
                          {u.name ? u.name[0] : '?'}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[14px] font-black text-zinc-900 dark:text-white flex items-center gap-2.5">
                            {u.name}
                            {isSelf && <span className="text-[9px] font-black bg-zinc-900 dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-full uppercase">Self</span>}
                          </div>
                          <div className="flex items-center gap-2">
                             <div className={`text-[10px] font-black uppercase tracking-widest ${tier.color}`}>
                                {tier.name}
                             </div>
                             {rank <= 3 && (
                               <div className="flex gap-1">
                                  {BADGES.slice(0, 3).map(b => (
                                    <div key={b.id} className={`${b.color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                                      {getBadgeIcon(b.iconName, 12)}
                                    </div>
                                  ))}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-12 shrink-0">
                        <div className="text-right w-24">
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Efficiency</div>
                          <div className="text-[15px] font-black text-zinc-900 dark:text-white">{u.points?.toLocaleString()} XP</div>
                        </div>
                        <div className="text-right w-16">
                          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Streak</div>
                          <div className="text-[15px] font-black text-orange-500 flex items-center justify-end gap-1.5">
                             {u.streak} <Flame size={14} fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-zinc-900 dark:bg-zinc-800 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl group">
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Personal Node</h3>
                    <ShieldCheck size={24} className="text-zinc-400" />
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="text-[13px] font-bold text-zinc-400 mb-1">Current Standing</div>
                      <div className="text-5xl font-black tracking-tighter">#{currentUserRank || '---'}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Tier Progress</span>
                         <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{Math.min(100, (user.points! % 500) / 5)}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                          style={{ width: `${Math.min(100, (user.points! % 500) / 5)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                      {currentUserRank > 0 ? `Exceeding ${Math.max(0, 100 - Math.ceil((currentUserRank / Math.max(1, leaderboard.length)) * 100))}% of peer nodes` : 'Calculating percentile...'}
                    </p>
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-border rounded-[32px] p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                 <Activity size={18} className="text-zinc-900 dark:text-white" />
                 <h3 className="text-[14px] font-black tracking-tight text-zinc-900 dark:text-white">Neural Feed</h3>
               </div>
               
               <div className="space-y-6">
                 {[1,2,3].map((i) => (
                   <div key={i} className="flex gap-4 group/item">
                     <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-white/5 flex items-center justify-center shrink-0 text-amber-500 border border-border group-hover/item:border-amber-500/30 transition-all">
                       <Award size={16} />
                     </div>
                     <div className="flex-1 space-y-1">
                        <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200">Sarah unlocked 'Initiate'</p>
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                           <span className="flex items-center gap-1.5"><Globe size={11} /> Platform Sync</span>
                           <span>{i * 4}m ago</span>
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
