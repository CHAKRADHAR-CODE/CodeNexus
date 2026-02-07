
import { PlatformType, DailyProblem } from '../types';

/**
 * ProgressSyncService
 * Simulates a server-side background job that scrapes/polls public profiles.
 * No API keys are used; logic relies on public submission lists.
 */

export interface SyncDiscovery {
  problemId: string;
  points: number;
}

export class ProgressSyncService {
  // Simulated "Database" of all problems the system knows about
  // In production, this would be a server-side query to match slugs
  private static MOCK_SOLVED_DATABASE: Record<string, string[]> = {
    'leetcode_user123': ['dp1', 'q1'], // Pre-solved examples
    'gfg_expert': ['q2']
  };

  /**
   * Simulates fetching the public 'Solved Problems' list for a user.
   * LeetCode: Fetched via GraphQL public query (no auth).
   * GFG: Fetched via public profile scraping.
   */
  static async fetchPublicSolvedSlugs(platform: PlatformType, username: string): Promise<string[]> {
    if (!username) return [];
    
    console.debug(`[SyncEngine] Scraping ${platform} profile for user: ${username}...`);
    
    // Simulate network delay for scraping/fetching
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated Logic: We check if this user has solved any of our platform's problems.
    // For this demo, we'll simulate a discovery: 
    // If the username contains 'pro', we'll simulate a 100% solve rate for testability.
    if (username.toLowerCase().includes('pro')) {
       return ['dp1', 'dp2', 'q1', 'q2']; 
    }

    // Default return from our mock "scraped" data
    const key = `${platform === PlatformType.LEETCODE ? 'leetcode' : 'gfg'}_${username}`;
    return this.MOCK_SOLVED_DATABASE[key] || [];
  }

  /**
   * Compares the user's public solved list against our target problems.
   */
  static async checkNewCompletions(
    user: { leetcodeUsername?: string; gfgUsername?: string },
    targetProblems: DailyProblem[],
    alreadySolvedIds: string[]
  ): Promise<SyncDiscovery[]> {
    const discoveries: SyncDiscovery[] = [];
    
    // 1. Check LeetCode
    if (user.leetcodeUsername) {
      const lcSolvedSlugs = await this.fetchPublicSolvedSlugs(PlatformType.LEETCODE, user.leetcodeUsername);
      targetProblems
        .filter(p => p.platform === PlatformType.LEETCODE && !alreadySolvedIds.includes(p.id))
        .forEach(p => {
          if (lcSolvedSlugs.includes(p.id)) {
            discoveries.push({ problemId: p.id, points: p.points });
          }
        });
    }

    // 2. Check GFG
    if (user.gfgUsername) {
      const gfgSolvedTitles = await this.fetchPublicSolvedSlugs(PlatformType.GEEKSFORGEEKS, user.gfgUsername);
      targetProblems
        .filter(p => p.platform === PlatformType.GEEKSFORGEEKS && !alreadySolvedIds.includes(p.id))
        .forEach(p => {
          if (gfgSolvedTitles.includes(p.id)) {
            discoveries.push({ problemId: p.id, points: p.points });
          }
        });
    }

    return discoveries;
  }
}
