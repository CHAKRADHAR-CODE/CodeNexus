
import React from 'react';
import { Topic, UserRole, User, DailyChallengeSet, PlatformType } from './types';
import { 
  Code2, 
  Database, 
  Binary, 
  Terminal, 
  Globe, 
  BrainCircuit, 
  Coffee 
} from 'lucide-react';

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'dsa-01',
    title: 'Data Structures & Algorithms',
    description: 'Master the core concepts of efficient computing.',
    icon: 'Binary',
    isVisible: true,
    modules: [
      {
        id: 'mod-1',
        title: 'Complexity Analysis (Big O)',
        description: 'Understand time and space complexity in depth.',
        videoUrl: 'https://www.youtube.com/embed/v4cd1O4zkGw',
        pdfUrl: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/whitepapers/pdf/aem_6_0_architecture.pdf',
        isVisible: true,
        problems: [
          { 
            id: 'q1', 
            title: 'Two Sum', 
            difficulty: 'EASY', 
            description: 'Find two indices such that their values add up to target.',
            points: 10,
            platform: PlatformType.LEETCODE,
            externalLink: 'https://leetcode.com/problems/two-sum/'
          }
        ]
      },
      {
        id: 'mod-2',
        title: 'Arrays & Hashing',
        description: 'Common patterns and techniques for array manipulation.',
        videoUrl: 'https://www.youtube.com/embed/86N_I1E4k_4',
        isVisible: true,
        problems: [
          {
            id: 'dp1',
            title: 'Contains Duplicate',
            description: 'Check if array contains any duplicates.',
            difficulty: 'EASY',
            points: 10,
            platform: PlatformType.LEETCODE,
            externalLink: 'https://leetcode.com/problems/contains-duplicate/'
          }
        ]
      }
    ],
    interviewQuestions: ['Explain Time Complexity', 'What is a Hash Map?']
  }
];

const today = new Date().toISOString().split('T')[0];

export const INITIAL_CHALLENGES: DailyChallengeSet[] = [
  {
    id: 'challenge-today',
    date: today,
    problems: [
      {
        id: 'dp1',
        title: 'Contains Duplicate',
        description: 'Check if array contains any duplicates.',
        difficulty: 'EASY',
        points: 10,
        platform: PlatformType.LEETCODE,
        externalLink: 'https://leetcode.com/problems/contains-duplicate/'
      }
    ]
  }
];

export const MOCK_USERS: User[] = [
  { id: '1', email: 'admin@gmail.com', role: UserRole.ADMIN, name: 'System Admin' },
  { id: '2', email: 'user@gmail.com', role: UserRole.STUDENT, name: 'Alex Learner', leetcodeUsername: 'user123', points: 2450, streak: 8 }
];

export const getTopicIcon = (name: string) => {
  switch (name) {
    case 'Code2': return <Code2 size={20} />;
    case 'Database': return <Database size={20} />;
    case 'Binary': return <Binary size={20} />;
    case 'Globe': return <Globe size={20} />;
    default: return <Terminal size={20} />;
  }
};
