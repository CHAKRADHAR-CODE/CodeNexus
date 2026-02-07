
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, Topic, DailyChallengeSet, UserProgress, UserUnitProgress } from './types';
import { INITIAL_TOPICS, INITIAL_CHALLENGES } from './constants';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TopicPage from './pages/TopicPage';
import RankingPage from './pages/RankingPage';
import { ProgressSyncService } from './services/syncEngine';
import { SupabaseService } from './services/supabase';
import { Zap, Check, Award, Cloud, AlertCircle } from 'lucide-react';

const FAST_SYNC_INTERVAL = 15000;
const NORMAL_SYNC_INTERVAL = 300000;
const DAILY_COMPLETION_BONUS_XP = 100;

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cm_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAdmin = user?.role === UserRole.ADMIN;
  
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
    lastChallengeDate: '',
    completedDates: []
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cm_theme') === 'dark');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [currentDateStr, setCurrentDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [xpNotification, setXpNotification] = useState<{points: number, id: number} | null>(null);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const syncTimeoutRef = useRef<number | null>(null);

  // --- INITIAL DATA LOAD FROM SUPABASE ---
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        const [cloudUsers, cloudTopics, cloudChallenges] = await Promise.all([
          SupabaseService.fetchUsers(),
          SupabaseService.fetchTopics(),
          SupabaseService.fetchChallenges()
        ]);

        setUsers(cloudUsers);
        setTopics(cloudTopics.length > 0 ? cloudTopics : INITIAL_TOPICS);
        setChallenges(cloudChallenges.length > 0 ? cloudChallenges : INITIAL_CHALLENGES);

        // Load progress if logged in student
        if (user && user.role === UserRole.STUDENT) {
          const cloudProgress = await SupabaseService.fetchUserProgress(user.id);
          if (cloudProgress) {
            setProgress(cloudProgress);
          }
        }
      } catch (err) {
        console.error("Critical Cloud Load Failure:", err);
        setSyncStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('cm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // --- PERSIST PROGRESS TO SUPABASE ON CHANGE ---
  useEffect(() => {
    if (user && user.role === UserRole.STUDENT && !isLoading) {
      SupabaseService.saveUserProgress(progress);
      // Sync points back to main profile
      SupabaseService.updateUserProfile({
        ...user,
        points: progress.points,
        streak: progress.currentStreak
      });
    }
  }, [progress, user, isLoading]);

  const showXpToast = (points: number) => {
    setXpNotification({ points, id: Date.now() });
    setTimeout(() => setXpNotification(null), 2000);
  };

  const handleMarkAsSolved = (problemId: string, points: number) => {
    setProgress(prev => {
      if (prev.completedDailyProblemIds.includes(problemId)) return prev;
      const today = new Date().toISOString().split('T')[0];
      const updatedSolvedIds = [...prev.completedDailyProblemIds, problemId];
      
      let newPoints = prev.points + points;
      let newStreak = prev.currentStreak;
      let newLastChallengeDate = prev.lastChallengeDate;
      let newCompletedDates = [...prev.completedDates];

      showXpToast(points);

      const todaysChallengeSet = challenges.find(c => c.date === today);
      if (todaysChallengeSet && todaysChallengeSet.problems.length > 0) {
        const allDailySolved = todaysChallengeSet.problems.every(p => 
          p.id === problemId || prev.completedDailyProblemIds.includes(p.id)
        );

        if (allDailySolved && prev.lastChallengeDate !== today) {
          newStreak = prev.currentStreak + 1;
          newPoints += DAILY_COMPLETION_BONUS_XP;
          newLastChallengeDate = today;
          if (!newCompletedDates.includes(today)) newCompletedDates.push(today);
          showXpToast(DAILY_COMPLETION_BONUS_XP);
        }
      }

      return {
        ...prev,
        completedDailyProblemIds: updatedSolvedIds,
        points: newPoints,
        currentStreak: newStreak,
        lastChallengeDate: newLastChallengeDate,
        completedDates: newCompletedDates
      };
    });
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('cm_user'); };
  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('cm_user', JSON.stringify(u)); };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-app space-y-4">
        <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent dark:border-white rounded-full animate-spin" />
        <p className="text-[12px] font-bold uppercase tracking-widest text-zinc-400">Syncing with CodeNexus Cloud...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="fixed bottom-4 left-4 z-[200]">
        <div className={`px-4 py-2 rounded-full border bg-white dark:bg-zinc-900 shadow-lg flex items-center gap-2 transition-all ${syncStatus === 'error' ? 'border-red-500' : 'border-border'}`}>
          {syncStatus === 'syncing' ? <Cloud className="animate-pulse text-zinc-400" size={14} /> : <Cloud className="text-emerald-500" size={14} />}
          <span className="text-[10px] font-black uppercase tracking-tighter">
            {syncStatus === 'error' ? 'Sync Error' : 'Cloud Link Active'}
          </span>
        </div>
      </div>

      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {xpNotification && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade">
            <Check size={14} className="text-emerald-500" strokeWidth={3} />
            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">+{xpNotification.points} XP Earned</span>
          </div>
        )}
      </div>

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} users={users} />} />
        <Route path="/" element={
          user ? (
            user.role === UserRole.ADMIN ? 
            <AdminDashboard 
              user={user} users={users} setUsers={setUsers}
              topics={topics} setTopics={(t) => { 
                setTopics(t); 
                t.forEach(topic => SupabaseService.saveTopic(topic));
              }} 
              challenges={challenges} setChallenges={(c) => {
                setChallenges(c);
                c.forEach(ch => SupabaseService.saveChallenge(ch));
              }}
              onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode} 
            /> : 
            <StudentDashboard 
              user={user} users={users} topics={topics} challenges={challenges} progress={progress}
              onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode}
              onMarkAsSolved={handleMarkAsSolved} onMarkAsAttempted={(id) => setLastAttemptTime(Date.now())}
              isSyncing={isSyncing} isFastSyncing={false}
              currentDateStr={currentDateStr}
            />
          ) : <Navigate to="/login" />
        } />
        <Route path="/ranking" element={user ? <RankingPage user={user} users={users} onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode} /> : <Navigate to="/login" />} />
        <Route path="/topic/:id" element={user ? <TopicPage topics={topics} isDark={isDarkMode} onLogout={handleLogout} user={user} setDark={setIsDarkMode} progress={progress} onUpdateUnitProgress={() => {}} onMarkAsSolved={handleMarkAsSolved} onMarkAsAttempted={(id) => setLastAttemptTime(Date.now())} /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
