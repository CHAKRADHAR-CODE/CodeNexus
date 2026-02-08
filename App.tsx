import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, Topic, DailyChallengeSet, UserProgress } from './types';
import { INITIAL_TOPICS, INITIAL_CHALLENGES } from './constants';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TopicPage from './pages/TopicPage';
import RankingPage from './pages/RankingPage';
import { SupabaseService, supabase } from './services/supabase';
import { Check } from 'lucide-react';
import UltraMinimalLoader from './components/UltraMinimalLoader';

const DAILY_COMPLETION_BONUS_XP = 100;

const RouteTransitions: React.FC<{children: React.ReactNode}> = ({children}) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition-fade h-full w-full">
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [challenges, setChallenges] = useState<DailyChallengeSet[]>([]);
  const [progress, setProgress] = useState<UserProgress>({
    userId: user?.id || 'guest',
    completedTopicIds: [],
    completedModuleIds: [],
    unitProgress: {},
    completedDailyProblemIds: [],
    attemptedProblemIds: [],
    points: 0,
    currentStreak: 0,
    completedDates: []
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cm_theme') === 'dark');
  const [xpNotification, setXpNotification] = useState<{points: number, id: number} | null>(null);

  const initApp = useCallback(async (isInitial = false) => {
    try {
      const [cloudUsers, cloudTopics, cloudChallenges] = await Promise.all([
        SupabaseService.fetchUsers(),
        SupabaseService.fetchTopics(),
        SupabaseService.fetchChallenges()
      ]);

      setUsers(cloudUsers);
      setTopics(cloudTopics.length > 0 ? cloudTopics : INITIAL_TOPICS);
      setChallenges(cloudChallenges.length > 0 ? cloudChallenges : INITIAL_CHALLENGES);

      if (user && user.role === UserRole.STUDENT) {
        const cloudProgress = await SupabaseService.fetchUserProgress(user.id);
        if (cloudProgress) setProgress(cloudProgress);
      }
    } catch (err) {
      console.error("Cloud Error:", err);
    } finally {
      if (isInitial) {
        // EXACT 1 SECOND PREMIUM TRANSITION
        setTimeout(() => {
          setIsLoading(false);
          setTimeout(() => setShowSplash(false), 400); // Sharp, clean exit
        }, 800);
      }
    }
  }, [user?.id, user?.role]);

  // Initial Load
  useEffect(() => {
    initApp(true);
  }, [initApp]);

  // --- REALTIME SYNC ENGINE ---
  useEffect(() => {
    const tables = ['tracks', 'modules', 'videos', 'pdfs', 'coding_questions', 'cn_challenges', 'cn_users'];
    
    const channel = supabase.channel('curriculum-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.debug('[Realtime] Syncing change from table:', payload.table);
        initApp(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initApp]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('cm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (user && user.role === UserRole.STUDENT && !isLoading) {
      SupabaseService.saveUserProgress(progress);
    }
  }, [progress, user, isLoading]);

  const showXpToast = (points: number) => {
    setXpNotification({ points, id: Date.now() });
    setTimeout(() => setXpNotification(null), 2500);
  };

  const handleUpdateUnitProgress = (moduleId: string, blockId: string) => {
    setProgress(prev => {
      const currentModProgress = prev.unitProgress[moduleId] || { moduleId, completedBlockIds: [], moduleCompleted: false, unlocked: true };
      if (currentModProgress.completedBlockIds.includes(blockId)) return prev;

      const newBlockIds = [...currentModProgress.completedBlockIds, blockId];
      const mod = topics.flatMap(t => t.modules).find(m => m.id === moduleId);
      const isNowComplete = mod ? mod.contentBlocks.filter(b => b.isVisible).every(b => newBlockIds.includes(b.id)) : false;

      const newUnitProgress = {
        ...prev.unitProgress,
        [moduleId]: { ...currentModProgress, completedBlockIds: newBlockIds, moduleCompleted: isNowComplete }
      };

      const newCompletedModules = isNowComplete ? [...prev.completedModuleIds, moduleId] : prev.completedModuleIds;
      showXpToast(25);

      return {
        ...prev,
        unitProgress: newUnitProgress,
        completedModuleIds: newCompletedModules,
        points: prev.points + 25
      };
    });
  };

  const handleMarkAsSolved = (problemId: string, points: number) => {
    const today = new Date().toISOString().split('T')[0];
    setProgress(prev => {
      if (prev.completedDailyProblemIds.includes(problemId)) return prev;
      
      let newPoints = prev.points + points;
      let newStreak = prev.currentStreak;
      let newCompletedDates = [...prev.completedDates];

      showXpToast(points);

      const todaysChallengeSet = challenges.find(c => c.date === today);
      if (todaysChallengeSet) {
        const alreadySolved = prev.completedDailyProblemIds.filter(id => 
          todaysChallengeSet.problems.some(p => p.id === id)
        );
        const isLastOne = (alreadySolved.length + 1) === todaysChallengeSet.problems.length;

        if (isLastOne && !prev.completedDates.includes(today)) {
          newStreak += 1;
          newPoints += DAILY_COMPLETION_BONUS_XP;
          newCompletedDates.push(today);
          showXpToast(DAILY_COMPLETION_BONUS_XP);
        }
      }

      return {
        ...prev,
        completedDailyProblemIds: [...prev.completedDailyProblemIds, problemId],
        points: newPoints,
        currentStreak: newStreak,
        completedDates: newCompletedDates
      };
    });
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('cm_user'); };
  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('cm_user', JSON.stringify(u)); };

  if (showSplash) {
    return <UltraMinimalLoader />;
  }

  return (
    <HashRouter>
      <div className="fixed top-20 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {xpNotification && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-fade">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
               <Check size={12} className="text-emerald-500" strokeWidth={3} />
            </div>
            <span className="text-[13px] font-bold">+{xpNotification.points} XP Earned</span>
          </div>
        )}
      </div>

      <RouteTransitions>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} users={users} />} />
          <Route path="/" element={
            user ? (
              user.role === UserRole.ADMIN ? 
              <AdminDashboard 
                user={user} users={users} setUsers={setUsers}
                topics={topics} setTopics={setTopics}
                challenges={challenges} setChallenges={setChallenges}
                onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode} 
              /> : 
              <StudentDashboard 
                user={user} users={users} topics={topics} challenges={challenges} progress={progress}
                onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode}
                onMarkAsSolved={handleMarkAsSolved} onMarkAsAttempted={() => {}}
                currentDateStr={new Date().toISOString().split('T')[0]}
              />
            ) : <Navigate to="/login" />
          } />
          <Route path="/ranking" element={user ? <RankingPage user={user} users={users} onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode} /> : <Navigate to="/login" />} />
          <Route path="/topic/:id" element={user ? <TopicPage topics={topics} isDark={isDarkMode} onLogout={handleLogout} user={user} setDark={setIsDarkMode} progress={progress} onUpdateUnitProgress={handleUpdateUnitProgress} onMarkAsSolved={handleMarkAsSolved} /> : <Navigate to="/login" />} />
        </Routes>
      </RouteTransitions>
    </HashRouter>
  );
};

export default App;