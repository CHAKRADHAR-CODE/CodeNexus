
import React from 'react';
import { Topic, UserRole, User, DailyChallengeSet, PlatformType } from './types';
import { 
  Code2, 
  Database, 
  Binary, 
  Terminal, 
  Globe, 
  Cpu, 
  Layers,
  Layout as LayoutIcon,
  Server
} from 'lucide-react';

export const INITIAL_TOPICS: Topic[] = [
  {
    id: 'dsa-01',
    title: 'Data Structures & Algorithms',
    description: 'Master the core concepts of efficient computing and problem solving.',
    icon: 'Binary',
    modules: [
      {
        id: 'mod-1',
        title: 'Complexity Analysis (Big O)',
        description: 'Understand time and space complexity in depth.',
        videoUrl: 'https://www.youtube.com/embed/v4cd1O4zkGw',
        pdfUrl: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/whitepapers/pdf/aem_6_0_architecture.pdf',
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
  },
  {
    id: 'web-01',
    title: 'Modern Web Development',
    description: 'Build responsive, high-performance applications with React and Node.',
    icon: 'Globe',
    modules: [
      {
        id: 'web-mod-1',
        title: 'Advanced React Patterns',
        description: 'Hooks, HOCs, and Performance Optimization.',
        videoUrl: 'https://www.youtube.com/embed/bMknfKXIFA8',
        problems: [
          {
            id: 'web-p1',
            title: 'Build a Custom Hook',
            description: 'Create a useLocalStorage hook that syncs state with browser storage.',
            difficulty: 'MEDIUM',
            points: 25,
            platform: PlatformType.GEEKSFORGEEKS,
            externalLink: 'https://www.geeksforgeeks.org/reactjs-custom-hooks/'
          }
        ]
      }
    ],
    interviewQuestions: ['Explain the Virtual DOM', 'What are React Portals?']
  },
  {
    id: 'sys-01',
    title: 'System Design & Architecture',
    description: 'Learn to design scalable distributed systems at scale.',
    icon: 'Server',
    modules: [
      {
        id: 'sys-mod-1',
        title: 'Load Balancing & Caching',
        description: 'Techniques for scaling horizontal applications.',
        videoUrl: 'https://www.youtube.com/embed/i53Gi_KlyHg',
        problems: [
          {
            id: 'sys-p1',
            title: 'LRU Cache Design',
            description: 'Implement a Least Recently Used cache with constant time complexity.',
            difficulty: 'HARD',
            points: 50,
            platform: PlatformType.LEETCODE,
            externalLink: 'https://leetcode.com/problems/lru-cache/'
          }
        ]
      }
    ],
    interviewQuestions: ['What is CAP Theorem?', 'Explain Consistent Hashing']
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
    case 'Server': return <Server size={20} />;
    case 'Cpu': return <Cpu size={20} />;
    case 'Layers': return <Layers size={20} />;
    default: return <Terminal size={20} />;
  }
};
