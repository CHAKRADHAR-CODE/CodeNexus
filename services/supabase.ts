
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';
import { User, Topic, DailyChallengeSet, UserProgress, Module, DailyProblem, UserUnitProgress, ContentBlock, PlatformType } from '../types';

// Use environment variables or placeholders to prevent crash during initialization
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key';

// Initialize the client. If placeholders are used, requests will fail gracefully with 404/401 
// instead of crashing the entire application on load.
export const supabase = createClient(supabaseUrl, supabaseKey);

export const SupabaseService = {
  // --- USER AUTH & MANAGEMENT ---
  async fetchUsers(): Promise<User[]> {
    try {
      if (supabaseUrl.includes('placeholder')) return [];
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
        points: u.points || 0,
        streak: u.streak || 0,
        isBlocked: u.is_blocked
      }));
    } catch (e) {
      console.error("Supabase connection error:", e);
      return [];
    }
  },

  async updateUserProfile(user: User) {
    if (supabaseUrl.includes('placeholder')) return;
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

  // --- NORMALIZED CURRICULUM FETCHING ---
  async fetchTopics(): Promise<Topic[]> {
    try {
      if (supabaseUrl.includes('placeholder')) return [];
      // 1. Fetch Tracks (Primary Table)
      const { data: tracks, error: tErr } = await supabase
        .from('tracks')
        .select('*')
        .order('order_index', { ascending: true });
      
      if (tErr || !tracks) return [];

      // 2. Fetch Modules, Videos, PDFs, and Coding Questions in parallel
      const [
        { data: modules },
        { data: videos },
        { data: pdfs },
        { data: questions }
      ] = await Promise.all([
        supabase.from('modules').select('*').order('order_index', { ascending: true }),
        supabase.from('videos').select('*').order('order_index', { ascending: true }),
        supabase.from('pdfs').select('*').order('order_index', { ascending: true }),
        supabase.from('coding_questions').select('*').order('order_index', { ascending: true })
      ]);

      // 3. Assemble the normalized tree structure
      return tracks.map(track => {
        const trackModules = (modules || []).filter(m => m.track_id === track.id);
        
        return {
          id: track.id,
          title: track.title,
          description: track.description,
          icon: track.icon || 'Binary',
          isVisible: true,
          interviewQuestions: [],
          modules: trackModules.map(mod => {
            const modVideos = (videos || []).filter(v => v.module_id === mod.id);
            const modPdfs = (pdfs || []).filter(p => p.module_id === mod.id);
            const modQuestions = (questions || []).filter(q => q.module_id === mod.id);

            const contentBlocks: ContentBlock[] = [
              ...modVideos.map(v => ({
                id: `v-${v.id}`,
                type: 'VIDEO' as const,
                title: v.title || 'Video Lecture',
                url: v.youtube_url,
                isVisible: true
              })),
              ...modPdfs.map(p => ({
                id: `f-${p.id}`,
                type: 'PDF' as const,
                title: p.title || 'Technical Notes',
                url: p.pdf_url,
                isVisible: true
              })),
              ...modQuestions.map(q => ({
                id: q.id,
                type: 'PROBLEM' as const,
                title: q.title,
                isVisible: true,
                problem: {
                  id: q.id,
                  title: q.title,
                  description: q.description || '',
                  difficulty: q.difficulty,
                  points: q.points || 10,
                  platform: q.platform || PlatformType.LEETCODE,
                  externalLink: q.external_link
                }
              }))
            ];

            return {
              id: mod.id,
              title: mod.title,
              description: mod.description || '',
              isVisible: mod.visible,
              contentBlocks
            };
          })
        };
      });
    } catch (e) {
      console.error("Supabase fetch topics error:", e);
      return [];
    }
  },

  async saveTopic(topic: Topic) {
    if (supabaseUrl.includes('placeholder')) return;
    // 1. Save Track
    await supabase.from('tracks').upsert({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      icon: topic.icon,
      order_index: 0
    });

    // 2. Save Modules and their nested content
    for (const mod of topic.modules) {
      await supabase.from('modules').upsert({
        id: mod.id,
        track_id: topic.id,
        title: mod.title,
        description: mod.description,
        visible: mod.isVisible ?? true,
        order_index: 0
      });

      const videoBlocks = mod.contentBlocks.filter(b => b.type === 'VIDEO');
      const pdfBlocks = mod.contentBlocks.filter(b => b.type === 'PDF');
      const problemBlocks = mod.contentBlocks.filter(b => b.type === 'PROBLEM');

      for (const v of videoBlocks) {
        await supabase.from('videos').upsert({
          id: v.id.replace('v-', ''),
          module_id: mod.id,
          youtube_url: v.url,
          title: v.title
        });
      }

      for (const p of pdfBlocks) {
        await supabase.from('pdfs').upsert({
          id: p.id.replace('f-', ''),
          module_id: mod.id,
          pdf_url: p.url,
          title: p.title
        });
      }

      for (const b of problemBlocks) {
        if (b.problem) {
          await supabase.from('coding_questions').upsert({
            id: b.problem.id,
            module_id: mod.id,
            title: b.problem.title,
            difficulty: b.problem.difficulty,
            points: b.problem.points,
            platform: b.problem.platform,
            external_link: b.problem.externalLink,
            description: b.problem.description
          });
        }
      }
    }
  },

  // --- DAILY CHALLENGES ---
  async fetchChallenges(): Promise<DailyChallengeSet[]> {
    try {
      if (supabaseUrl.includes('placeholder')) return [];
      const { data, error } = await supabase
        .from('cn_challenges')
        .select(`*, cn_challenge_problems (cn_problems (*))`);
      
      if (error) return [];
      return data.map(c => ({
        id: c.id,
        date: c.date,
        problems: (c.cn_challenge_problems || [])
          .filter((cp: any) => cp.cn_problems)
          .map((cp: any) => ({
            id: cp.cn_problems.id,
            title: cp.cn_problems.title,
            description: cp.cn_problems.description,
            difficulty: cp.cn_problems.difficulty,
            points: cp.cn_problems.points,
            platform: cp.cn_problems.platform,
            externalLink: cp.cn_problems.external_link
          }))
      }));
    } catch (e) {
      return [];
    }
  },

  async saveChallenge(challenge: DailyChallengeSet) {
    if (supabaseUrl.includes('placeholder')) return;
    await supabase.from('cn_challenges').upsert({ id: challenge.id, date: challenge.date });
    
    for (const prob of challenge.problems) {
      await supabase.from('coding_questions').upsert({
        id: prob.id,
        title: prob.title,
        difficulty: prob.difficulty,
        points: prob.points,
        platform: prob.platform,
        external_link: prob.externalLink
      });
    }

    await supabase.from('cn_challenge_problems').delete().eq('challenge_id', challenge.id);
    for (const prob of challenge.problems) {
      await supabase.from('cn_challenge_problems').insert({ challenge_id: challenge.id, problem_id: prob.id });
    }
  },

  // --- PROGRESS TRACKING ---
  async fetchUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      if (supabaseUrl.includes('placeholder')) return null;
      const [solvedData, progData, userData] = await Promise.all([
        supabase.from('cn_user_solved_problems').select('problem_id').eq('user_id', userId),
        supabase.from('user_progress').select('*').eq('user_id', userId),
        supabase.from('cn_users').select('points, streak').eq('id', userId).single()
      ]);

      if (!userData.data) return null;

      const unitProgress: Record<string, UserUnitProgress> = {};
      (progData.data || []).forEach(p => {
        unitProgress[p.module_id] = {
          moduleId: p.module_id,
          completedBlockIds: [],
          unlocked: true,
          moduleCompleted: p.video_completed && p.pdf_completed && p.question_completed
        };
      });

      return {
        userId,
        completedTopicIds: [],
        completedModuleIds: Object.keys(unitProgress).filter(k => unitProgress[k].moduleCompleted),
        unitProgress,
        completedDailyProblemIds: (solvedData.data || []).map(s => s.problem_id),
        attemptedProblemIds: [],
        points: userData.data.points || 0,
        currentStreak: userData.data.streak || 0,
        completedDates: []
      };
    } catch (e) {
      return null;
    }
  },

  async saveUserProgress(progress: UserProgress) {
    if (supabaseUrl.includes('placeholder')) return;
    for (const pid of progress.completedDailyProblemIds) {
      await supabase.from('cn_user_solved_problems').upsert({ user_id: progress.userId, problem_id: pid });
    }

    for (const mid of Object.keys(progress.unitProgress)) {
      const p = progress.unitProgress[mid];
      await supabase.from('user_progress').upsert({
        user_id: progress.userId,
        module_id: mid,
        video_completed: p.completedBlockIds.some(id => id.startsWith('v-')),
        pdf_completed: p.completedBlockIds.some(id => id.startsWith('f-')),
        question_completed: p.moduleCompleted
      });
    }

    await supabase.from('cn_users')
      .update({ points: progress.points, streak: progress.currentStreak })
      .eq('id', progress.userId);
  }
};
