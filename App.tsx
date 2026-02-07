
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, Topic, DailyChallengeSet, UserProgress, UserUnitProgress } from './types';
import { INITIAL_TOPICS, INITIAL_CHALLENGES, MOCK_USERS } from './constants';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TopicPage from './pages/TopicPage';
import RankingPage from './pages/RankingPage';
import { ProgressSyncService } from './services/syncEngine';
import { Zap, Check, Award } from 'lucide-react';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('cm_all_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cm_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const current = users.find(u => u.id === parsed.id);
    return current || parsed;
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [challenges, setChallenges] = useState<DailyChallengeSet[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);

  // Fetch from Cloud
  useEffect(() => {
    const loadCloudData = async () => {
      try {
        const [topicRes, challengeRes] = await Promise.all([
          fetch("http://localhost:5000/curriculum"),
          fetch("http://localhost:5000/challenges")
        ]);
        const cloudTopics = await topicRes.json();
        const cloudChallenges = await challengeRes.json();
        
        if (cloudTopics.length > 0) setTopics(cloudTopics);
        else setTopics(INITIAL_TOPICS); // Fallback

        if (cloudChallenges.length > 0) setChallenges(cloudChallenges);
        else setChallenges(INITIAL_CHALLENGES); // Fallback
      } catch (err) {
        console.warn("Cloud connection offline. Using local data.");
        setTopics(INITIAL_TOPICS);
        setChallenges(INITIAL_CHALLENGES);
      } finally {
        setIsLoadingCloud(false);
      }
    };
    loadCloudData();
  }, []);

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('cm_progress');
    if (saved) return JSON.parse(saved);
    return {
      userId: user?.id || 'guest',
      completedTopicIds: [],
      completedModuleIds: [],
      unitProgress: {},
      completedDailyProblemIds: [],
      attemptedProblemIds: [],
      points: user?.points || 0,
      currentStreak: user?.streak || 0,
      lastChallengeDate: '',
      completedDates: []
    };
  });

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('cm_theme') === 'dark');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0);
  const [currentDateStr, setCurrentDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [xpNotification, setXpNotification] = useState<{points: number, id: number} | null>(null);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('cm_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('cm_progress', JSON.stringify(progress));
    if (user && user.role === UserRole.STUDENT) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, points: progress.points, streak: progress.currentStreak } : u));
    }
  }, [progress]);

  const handleMarkAsSolved = (problemId: string, points: number) => {
    setProgress(prev => {
      if (prev.completedDailyProblemIds.includes(problemId)) return prev;
      setXpNotification({ points, id: Date.now() });
      setTimeout(() => setXpNotification(null), 2000);
      return { ...prev, completedDailyProblemIds: [...prev.completedDailyProblemIds, problemId], points: prev.points + points };
    });
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('cm_user'); };
  const handleLogin = (u: User) => { setUser(u); localStorage.setItem('cm_user', JSON.stringify(u)); };

  if (isLoadingCloud) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950 text-white font-bold tracking-widest uppercase animate-pulse">
        Initializing Cloud Database...
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {xpNotification && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-fade">
            <Check size={14} className="text-emerald-500" strokeWidth={3} />
            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">+{xpNotification.points} XP Earned</span>
          </div>
        )}
      </div>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
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
              onMarkAsSolved={handleMarkAsSolved} onMarkAsAttempted={(id) => setLastAttemptTime(Date.now())}
              isSyncing={isSyncing} currentDateStr={currentDateStr}
            />
          ) : <Navigate to="/login" />
        } />
        <Route path="/ranking" element={user ? <RankingPage user={user} users={users} onLogout={handleLogout} isDark={isDarkMode} setDark={setIsDarkMode} /> : <Navigate to="/login" />} />
        <Route path="/topic/:id" element={user ? <TopicPage topics={topics} isDark={isDarkMode} onLogout={handleLogout} user={user} setDark={setIsDarkMode} progress={progress} onUpdateUnitProgress={()=>{}} onMarkAsSolved={handleMarkAsSolved} onMarkAsAttempted={()=>{}} /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
