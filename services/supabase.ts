
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';
import { User, Topic, DailyChallengeSet, UserProgress, Module, DailyProblem, UserUnitProgress } from '../types';

const supabaseUrl = 'https://xfljvsdzjbvssnphcehc.supabase.co';
const supabaseKey = 'sb_publishable_lPKfuuBmb6GP58-FY3GoHQ_zM4VHDed';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const SupabaseService = {
  // --- USER AUTH & MANAGEMENT ---
  async fetchUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('cn_users')
      .select('*')
      .order('points', { ascending: false });
    
    if (error) return [];

    return data.map(u => ({
      id: u.id,
      email: u.email,
      password: u.password,
      role: u.role,
      name: u.name,
      points: u.points,
      streak: u.streak,
      isBlocked: u.is_blocked
    }));
  },

  async updateUserProfile(user: User) {
    await supabase.from('cn_users').upsert({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      points: user.points || 0,
      streak: user.streak || 0,
      is_blocked: user.isBlocked || false
    });
  },

  // --- CURRICULUM (TOPICS/MODULES/PROBLEMS) ---
  async fetchTopics(): Promise<Topic[]> {
    // Nested select for normalization: Topics -> Modules -> Problems
    const { data, error } = await supabase
      .from('cn_topics')
      .select(`
        *,
        cn_modules (
          *,
          cn_problems (*)
        )
      `)
      .order('id', { ascending: true });
    
    if (error) {
      console.error("Topics Fetch Error:", error);
      return [];
    }

    return data.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon,
      isVisible: t.is_visible,
      interviewQuestions: [],
      modules: (t.cn_modules || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        videoUrl: m.video_url,
        pdfUrl: m.pdf_url,
        isVisible: m.is_visible,
        problems: (m.cn_problems || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          points: p.points,
          platform: p.platform,
          externalLink: p.external_link
        }))
      }))
    }));
  },

  async saveTopic(topic: Topic) {
    // 1. Save Topic
    await supabase.from('cn_topics').upsert({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      icon: topic.icon,
      is_visible: topic.isVisible
    });

    // 2. Save Modules & Problems (Simplified for current app logic)
    for (const mod of topic.modules) {
      await supabase.from('cn_modules').upsert({
        id: mod.id,
        topic_id: topic.id,
        title: mod.title,
        description: mod.description,
        video_url: mod.videoUrl,
        pdf_url: mod.pdfUrl,
        is_visible: mod.isVisible
      });

      for (const prob of mod.problems) {
        await supabase.from('cn_problems').upsert({
          id: prob.id,
          module_id: mod.id,
          title: prob.title,
          description: prob.description,
          difficulty: prob.difficulty,
          points: prob.points,
          platform: prob.platform,
          external_link: prob.externalLink
        });
      }
    }
  },

  async deleteTopic(id: string) {
    await supabase.from('cn_topics').delete().eq('id', id);
  },

  // --- DAILY CHALLENGES ---
  async fetchChallenges(): Promise<DailyChallengeSet[]> {
    const { data, error } = await supabase
      .from('cn_challenges')
      .select(`
        *,
        cn_challenge_problems (
          cn_problems (*)
        )
      `);
    
    if (error) return [];
    
    return data.map(c => ({
      id: c.id,
      date: c.date,
      problems: (c.cn_challenge_problems || []).map((cp: any) => ({
        id: cp.cn_problems.id,
        title: cp.cn_problems.title,
        description: cp.cn_problems.description,
        difficulty: cp.cn_problems.difficulty,
        points: cp.cn_problems.points,
        platform: cp.cn_problems.platform,
        externalLink: cp.cn_problems.external_link
      }))
    }));
  },

  async saveChallenge(challenge: DailyChallengeSet) {
    await supabase.from('cn_challenges').upsert({
      id: challenge.id,
      date: challenge.date
    });

    // Delete existing links
    await supabase.from('cn_challenge_problems').delete().eq('challenge_id', challenge.id);

    // Re-link problems
    for (const prob of challenge.problems) {
      await supabase.from('cn_challenge_problems').insert({
        challenge_id: challenge.id,
        problem_id: prob.id
      });
    }
  },

  // --- STUDENT PROGRESS (FULLY RELATIONAL) ---
  async fetchUserProgress(userId: string): Promise<UserProgress | null> {
    const [solvedData, modData, userData] = await Promise.all([
      supabase.from('cn_user_solved_problems').select('problem_id').eq('user_id', userId),
      supabase.from('cn_user_module_progress').select('*').eq('user_id', userId),
      supabase.from('cn_users').select('points, streak').eq('id', userId).single()
    ]);

    if (!userData.data) return null;

    const unitProgress: Record<string, UserUnitProgress> = {};
    (modData.data || []).forEach(m => {
      unitProgress[m.module_id] = {
        moduleId: m.module_id,
        videoCompleted: m.video_completed,
        pdfCompleted: m.pdf_completed,
        codingCompleted: m.coding_completed,
        unlocked: true, // App logic manages unlocking
        progressPercent: (m.video_completed ? 33 : 0) + (m.pdf_completed ? 33 : 0) + (m.coding_completed ? 34 : 0),
        moduleCompleted: m.video_completed && m.pdf_completed && m.coding_completed
      };
    });

    return {
      userId,
      completedTopicIds: [], // Derived in app
      completedModuleIds: Object.keys(unitProgress).filter(k => unitProgress[k].moduleCompleted),
      unitProgress,
      completedDailyProblemIds: (solvedData.data || []).map(s => s.problem_id),
      attemptedProblemIds: [],
      points: userData.data.points,
      currentStreak: userData.data.streak,
      completedDates: []
    };
  },

  async saveUserProgress(progress: UserProgress) {
    // 1. Update solved problems
    for (const pid of progress.completedDailyProblemIds) {
      await supabase.from('cn_user_solved_problems').upsert({
        user_id: progress.userId,
        problem_id: pid
      });
    }

    // 2. Update module steps
    for (const mid of Object.keys(progress.unitProgress)) {
      const p = progress.unitProgress[mid];
      await supabase.from('cn_user_module_progress').upsert({
        user_id: progress.userId,
        module_id: mid,
        video_completed: p.videoCompleted,
        pdf_completed: p.pdfCompleted,
        coding_completed: p.codingCompleted
      });
    }

    // 3. Sync points
    await supabase.from('cn_users').update({
      points: progress.points,
      streak: progress.currentStreak
    }).eq('id', progress.userId);
  }
};
