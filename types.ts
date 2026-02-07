
export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export enum PlatformType {
  LEETCODE = 'LeetCode',
  GEEKSFORGEEKS = 'GeeksforGeeks'
}

export enum RankTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  ELITE = 'ELITE'
}

export interface User {
  id: string;
  email: string;
  password?: string; // Visible for admin verification and dashboard
  role: UserRole;
  name: string;
  leetcodeUsername?: string;
  gfgUsername?: string;
  points?: number;
  streak?: number;
  isBlocked?: boolean;
}

export interface DailyProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  platform: PlatformType;
  externalLink: string;
  topic?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  problems: DailyProblem[];
  isVisible?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  icon: string;
  modules: Module[];
  interviewQuestions: string[];
  isVisible?: boolean;
}

export interface DailyChallengeSet {
  id: string;
  date: string; 
  problems: DailyProblem[];
}

export interface UserUnitProgress {
  moduleId: string;
  videoCompleted: boolean;
  pdfCompleted: boolean;
  codingCompleted: boolean;
  unlocked: boolean;
  progressPercent: number;
  moduleCompleted: boolean;
}

export interface UserProgress {
  userId: string;
  completedTopicIds: string[];
  completedModuleIds: string[]; 
  unitProgress: Record<string, UserUnitProgress>;
  completedDailyProblemIds: string[];
  attemptedProblemIds: string[];
  points: number;
  currentStreak: number;
  lastChallengeDate?: string;
  completedDates: [] | string[]; 
}
