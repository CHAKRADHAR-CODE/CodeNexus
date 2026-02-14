
import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { User, Topic, DailyChallengeSet, UserProgress, UserRole, DailyProblem, PlatformType } from '../types';

const SUPABASE_URL = 'https://ydnpophnhffdcsraxldv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_b5e5_GW4GkGzfOtz8Od5ug_zQwMZWwn';

let instance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!instance) {
    instance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
      global: { headers: { 'x-application-name': 'codenexus' } }
    });
  }
  return instance;
};

export const supabase = getSupabase();

export const SupabaseService = {
  subscribeToChanges(callbacks: {
    onUserChange?: (payload: any) => void;
    onTopicChange?: (payload: any) => void;
    onChallengeChange?: (payload: any) => void;
  }): RealtimeChannel {
    return supabase
      .channel('codenexus-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, p => callbacks.onUserChange?.(p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracks' }, p => callbacks.onTopicChange?.(p))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_challenges' }, p => callbacks.onChallengeChange?.(p))
      .subscribe();
  },

  // Fix: Implemented subscribeToTopic to handle detailed real-time synchronization for a specific track and its sub-components.
  subscribeToTopic(topicId: string, callback: (topic: Topic) => void): RealtimeChannel {
    return supabase
      .channel(`topic-realtime-sync-${topicId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tracks', 
        filter: `id=eq.${topicId}` 
      }, async () => {
        const updated = await SupabaseService.fetchTopicById(topicId);
        if (updated) callback(updated);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'modules'
      }, async () => {
        const updated = await SupabaseService.fetchTopicById(topicId);
        if (updated) callback(updated);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'content_blocks'
      }, async () => {
        const updated = await SupabaseService.fetchTopicById(topicId);
        if (updated) callback(updated);
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'coding_questions'
      }, async () => {
        const updated = await SupabaseService.fetchTopicById(topicId);
        if (updated) callback(updated);
      })
      .subscribe();
  },

  async fetchLeaderboard(): Promise<Partial<User>[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, points, streak, role')
      .eq('role', 'STUDENT')
      .order('points', { ascending: false });
    return error ? [] : data;
  },

  async fetchUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    return data.map(d => ({
      id: d.id, email: d.email, name: d.name, role: d.role as UserRole,
      password: d.password, points: d.points || 0, streak: d.streak || 0,
      isBlocked: d.is_blocked || false
    }));
  },

  async updateUserProfile(user: User) {
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      password: user.password,
      points: user.points,
      streak: user.streak,
      is_blocked: user.isBlocked
    });
    if (error) console.error("Sync Error:", error.message);
  },

  async fetchTopicsSummary(): Promise<Topic[]> {
    const { data, error } = await supabase.from('tracks').select('*').order('order_index');
    return error ? [] : data.map(d => ({ ...d, isVisible: d.is_visible, modules: [] }));
  },

  async fetchTopicById(id: string): Promise<Topic | null> {
    const { data, error } = await supabase
      .from('tracks')
      .select(`*, modules (*, content_blocks (*), coding_questions (*))`)
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id, title: data.title, description: data.description, icon: data.icon, isVisible: data.is_visible,
      modules: (data.modules || []).map((m: any) => ({
        id: m.id, title: m.title, description: m.description, isVisible: m.is_visible,
        contentBlocks: (m.content_blocks || []).map((b: any) => ({ ...b, isVisible: b.is_visible })),
        problems: (m.coding_questions || []).map((q: any) => ({
          ...q, externalLink: q.external_link, platform: q.platform as PlatformType
        }))
      })).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    } as any;
  },

  async saveTopic(topic: Topic) {
    const { error } = await supabase.rpc('upsert_full_track', { p_track: topic });
    if (error) throw error;
  },

  async deleteTopic(id: string) {
    await supabase.from('tracks').delete().eq('id', id);
  },

  async fetchChallenges(): Promise<DailyChallengeSet[]> {
    const { data, error } = await supabase.from('daily_challenges').select('*, coding_questions (*)');
    return error ? [] : data.map(d => ({
      id: d.id, date: d.date,
      problems: (d.coding_questions || []).map((q: any) => ({ ...q, externalLink: q.external_link }))
    }));
  },

  async saveChallenge(challenge: DailyChallengeSet) {
    const { data, error } = await supabase.from('daily_challenges').upsert({ id: challenge.id, date: challenge.date }).select().single();
    if (error) throw error;
    await supabase.from('daily_challenge_questions').delete().eq('challenge_id', data.id);
    if (challenge.problems.length > 0) {
      await supabase.from('daily_challenge_questions').insert(challenge.problems.map(p => ({ challenge_id: data.id, question_id: p.id })));
    }
  },

  async fetchUserProgress(userId: string): Promise<UserProgress | null> {
    const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId).single();
    if (error || !data) return null;
    return {
      userId: data.user_id, completedTopicIds: [], completedModuleIds: data.completed_module_ids || [],
      unitProgress: {}, completedDailyProblemIds: data.completed_question_ids || [],
      attemptedProblemIds: [], points: 0, currentStreak: 0, completedDates: data.completed_dates || [],
      earnedBadgeIds: data.earned_badge_ids || []
    };
  },

  async saveUserProgress(progress: UserProgress) {
    await supabase.from('user_progress').upsert({
      user_id: progress.userId,
      completed_question_ids: progress.completedDailyProblemIds,
      completed_module_ids: progress.completedModuleIds,
      completed_dates: progress.completedDates,
      earned_badge_ids: progress.earnedBadgeIds
    });
    await supabase.from('profiles').update({ points: progress.points, streak: progress.currentStreak }).eq('id', progress.userId);
  }
};
