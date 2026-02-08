
import React, { useMemo } from 'react';
import { User, UserRole } from '../types';
import { LogOut, Sun, Moon, LayoutDashboard, Code2, UserCircle2, Trophy, Settings, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  isDark: boolean;
  setDark: (dark: boolean) => void;
  points?: number;
}

export const getLevelData = (points: number = 0) => {
  const level = Math.floor(points / 500) + 1;
  const currentLevelXp = points % 500;
  const nextLevelThreshold = 500;
  const progressPercent = (currentLevelXp / nextLevelThreshold) * 100;

  let badge = "Rookie Dev";
  let color = "text-zinc-500";
  let bg = "bg-zinc-100 dark:bg-zinc-800";

  if (level >= 20) {
    badge = "System Architect";
    color = "text-indigo-600 dark:text-indigo-400";
    bg = "bg-indigo-50 dark:bg-indigo-500/10";
  } else if (level >= 10) {
    badge = "Algorithm Knight";
    color = "text-orange-600 dark:text-orange-400";
    bg = "bg-orange-50 dark:bg-orange-500/10";
  } else if (level >= 5) {
    badge = "Code Explorer";
    color = "text-blue-600 dark:text-blue-400";
    bg = "bg-blue-50 dark:bg-blue-500/10";
  }

  return { level, currentLevelXp, nextLevelThreshold, progressPercent, badge, color, bg };
};

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, isDark, setDark, points = 0 }) => {
  const location = useLocation();
  const isAdmin = user.role === UserRole.ADMIN;
  
  const levelData = useMemo(() => getLevelData(points), [points]);

  const navItems = [
    { label: isAdmin ? 'Dashboard' : 'Tracks', icon: <LayoutDashboard size={14} />, path: '/' },
    ...(!isAdmin ? [{ label: 'Rankings', icon: <Trophy size={14} />, path: '/ranking' }] : []),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-app text-zinc-900 dark:text-zinc-100">
      {/* Refined Minimal Header */}
      <header className="sticky top-0 z-50 h-14 border-b border-border glass flex items-center justify-center">
        <div className="w-full max-w-7xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 bg-zinc-900 dark:bg-white rounded-md flex items-center justify-center text-white dark:text-black">
                <Code2 size={14} strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-bold tracking-tight">CodeNexus</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors ${
                    location.pathname === item.path 
                    ? 'bg-zinc-900/5 dark:bg-white/10 text-zinc-900 dark:text-white' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {!isAdmin && (
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xs px-6">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between px-0.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${levelData.color}`}>LVL {levelData.level} • {levelData.badge}</span>
                  <span className="text-[9px] font-medium text-zinc-400">{levelData.currentLevelXp} / {levelData.nextLevelThreshold} XP</span>
                </div>
                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-900 dark:bg-white transition-all duration-500 ease-out"
                    style={{ width: `${levelData.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!isDark)}
              className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            <div className="h-4 w-px bg-border mx-1"></div>

            <div className="relative group">
              <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 border border-border">
                  <UserCircle2 size={14} />
                </div>
                <p className="text-[12px] font-semibold hidden sm:block">{user.name.split(' ')[0]}</p>
                <ChevronDown size={12} className="text-zinc-400" />
              </button>
              
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                <div className="px-3 py-1.5 border-b border-border/50">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{user.role}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors flex items-center gap-2"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="py-6 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-zinc-400 text-[11px] font-medium flex justify-between">
          <p>© 2025 CodeNexus</p>
          <a 
            href="https://chakradhar-portfolio-beta.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors uppercase tracking-widest"
          >
            BY CHAKRADHAR
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
