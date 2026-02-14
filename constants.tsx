
import React from 'react';
import { Topic, User, DailyChallengeSet, Badge } from './types';
import { 
  Code2, 
  Database, 
  Binary, 
  Terminal, 
  Globe,
  Award,
  Zap,
  Shield,
  Trophy,
  Sparkles,
  Flame,
  Target
} from 'lucide-react';

export const BADGES: Badge[] = [
  { id: 'first-solve', name: 'Initiate', description: 'Solved your first engineering challenge.', iconName: 'Zap', color: 'text-yellow-500' },
  { id: 'streak-3', name: 'Consistent', description: 'Maintained a 3-day coding streak.', iconName: 'Flame', color: 'text-orange-500' },
  { id: 'xp-1000', name: 'Power User', description: 'Earned over 1000 XP.', iconName: 'Trophy', color: 'text-blue-500' },
  { id: 'track-complete', name: 'Architect', description: 'Finished an entire learning track.', iconName: 'Shield', color: 'text-emerald-500' },
  { id: 'daily-master', name: 'Elite Solver', description: 'Completed 10 daily missions.', iconName: 'Target', color: 'text-rose-500' }
];

/**
 * DATABASE SOURCE OF TRUTH
 * All initial mock data has been removed. 
 * The app will now fetch all content from Supabase.
 */
export const INITIAL_TOPICS: Topic[] = [];
export const INITIAL_CHALLENGES: DailyChallengeSet[] = [];
export const MOCK_USERS: User[] = [];

export const getTopicIcon = (name: string) => {
  switch (name) {
    case 'Code2': return <Code2 size={20} />;
    case 'Database': return <Database size={20} />;
    case 'Binary': return <Binary size={20} />;
    case 'Globe': return <Globe size={20} />;
    default: return <Terminal size={20} />;
  }
};

export const getBadgeIcon = (name: string, size = 16) => {
  switch (name) {
    case 'Zap': return <Zap size={size} />;
    case 'Flame': return <Flame size={size} />;
    case 'Trophy': return <Trophy size={size} />;
    case 'Shield': return <Shield size={size} />;
    case 'Target': return <Target size={size} />;
    case 'Sparkles': return <Sparkles size={size} />;
    default: return <Award size={size} />;
  }
};
