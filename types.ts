
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
  password?: string;
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

export type BlockType = 'VIDEO' | 'PDF';

export interface ContentBlock {
  id: string;
  type: BlockType;
  title: string;
  url?: string;
  isVisible: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  contentBlocks: ContentBlock[];
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
  completedBlockIds: string[];
  unlocked: boolean;
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
  completedDates: string[]; 
  earnedBadgeIds: string[]; // Track earned achievements
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
}
