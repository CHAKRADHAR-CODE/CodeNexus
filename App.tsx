import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole, Topic, DailyChallengeSet, UserProgress } from './types';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TopicPage from './pages/TopicPage';
import RankingPage from './pages/RankingPage';
import { ApiService } from './services/api';
import { Check, Sparkles, CloudOff } from 'lucide-react';
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
  const [offlineMode, setOfflineMode] = useState(false);

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
    completedDates: [],
    earnedBadgeIds: []
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cm_theme') === 'dark');
  const [xpNotification, setXpNotification] = useState<{points: number, id: number, label?: string} | null>(null);

  const initApp = useCallback(async (isInitial = false) => {
    try {
      // Attempt background fetch from hybrid API
      // This will automatically use LocalStorage if Fetch fails
      const cloudUsers = await ApiService.fetchUsers();
      const cloudTracks = await ApiService.fetchTracks();
      const cloudChallenges = await ApiService.fetchChallenges();

      setUsers(cloudUsers);
      setTopics(cloudTracks);
      setChallenges(cloudChallenges);

      if (user && user.role === UserRole.STUDENT) {
        const cloudProgress = await ApiService.fetchProgress(user.id);
        const currentUserProfile = cloudUsers.find(u => u.id === user.id);
        
        if (cloudProgress) {
          setProgress({
            ...cloudProgress,
            points: currentUserProfile?.points || 0,
            currentStreak: currentUserProfile?.streak || 0
          });
        }
      }

      // Check if we are successfully talking to a real server or mocking
      // In a real production app, we could check a status endpoint
      setOfflineMode(false);
    } catch (err) {
      console.debug("Hybrid Initialization Note:", err);
      setOfflineMode(true);
    } finally {
      if (isInitial) {
        setTimeout(() => {
          setIsLoading(false);
          setTimeout(() => setShowSplash(false), 400);
        }, 800);
      }
    }
  }, [user?.id, user?.role]);

  useEffect(() => { initApp(true); }, [initApp]);

  useEffect(() => {
    if (user && user.role === UserRole.STUDENT && !isLoading) {
      ApiService.saveProgress(progress).catch(() => {});
    }
  }, [progress, user, isLoading]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('cm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const showXpToast = (points: number, label?: string) => {
    setXpNotification({ points, id: Date.now(), label });
    setTimeout(() => setXpNotification(null), 3500);
  };

  const handleUpdateUnitProgress = (moduleId: string, blockId: string) => {
    setProgress(prev => {
      const currentBlockIds = prev.unitProgress[moduleId]?.completedBlockIds || [];
      if (currentBlockIds.includes(blockId)) return prev;
      showXpToast(25);
      return {
        ...prev,
        unitProgress: {
          ...prev.unitProgress,
          [moduleId]: { moduleId, completedBlockIds: [...currentBlockIds, blockId], moduleCompleted: false, unlocked: true }
        },
        points: prev.points + 25
      };
    });
  };

  const handleMarkAsSolved = (problemId: string, points: number) => {
    const today = new Date().toISOString().split('T')[0];
    setProgress(prev => {
      if (prev.completedDailyProblemIds.includes(problemId)) return prev;
      showXpToast(points);
      let newPoints = prev.points + points;
      let newStreak = prev.currentStreak;
      let newCompletedDates = [...prev.completedDates];

      const todaysChallengeSet = challenges.find(c => c.date === today);
      if (todaysChallengeSet) {
        const alreadySolvedIds = [...prev.completedDailyProblemIds, problemId];
        const isComplete = todaysChallengeSet.problems.every(p => alreadySolvedIds.includes(p.id));
        if (isComplete && !prev.completedDates.includes(today)) {
          newStreak += 1;
          newPoints += DAILY_COMPLETION_BONUS_XP;
          newCompletedDates.push(today);
          showXpToast(DAILY_COMPLETION_BONUS_XP, "Daily Goal Met!");
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
  const handleLogin = (u: User) => { 
    setUser(u); 
    localStorage.setItem('cm_user', JSON.stringify(u));
    initApp();
  };

  if (showSplash) return <UltraMinimalLoader />;

  return (
    <HashRouter>
      {/* Dynamic Notifications */}
      <div className="fixed top-20 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {offlineMode && (
          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-xl flex items-center gap-3 text-[11px] font-bold animate-premium-entry shadow-2xl border border-white/10">
            <CloudOff size={14} /> Local Session Active
          </div>
        )}
        {xpNotification && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-premium-entry border-l-4 border-l-emerald-500">
            <div className={`w-8 h-8 rounded-full ${xpNotification.label ? 'bg-amber-500' : 'bg-emerald-500'} flex items-center justify-center text-white`}>
               {xpNotification.label ? <Sparkles size={16} /> : <Check size={16} strokeWidth={3} />}
            </div>
            <div>
              {xpNotification.label && <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">{xpNotification.label}</p>}
              <span className="text-[14px] font-black">{xpNotification.points > 0 ? `+${xpNotification.points} XP Earned` : "Achievement Unlocked!"}</span>
            </div>
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