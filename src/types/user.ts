export interface User {
  id: string;
  name: string;
  avatar_url?: string;
  username?: string;
  username_last_changed?: string;
  email?: string;
  weight_unit: 'kg' | 'lb';
  one_rm_formula: 'epley' | 'brzycki';
  rest_timer_default: number;
  theme: 'dark' | 'light';
  accent_color: string;
  language: 'pl' | 'en';
  height_cm?: number;
  birth_date?: string;
  gender?: 'male' | 'female';
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  calorie_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fat_goal?: number;
  water_goal_ml?: number;
  weight_goal_kg?: number;
  weight_plan_start_date?: string;
  weight_plan_weeks?: number;
  weight_plan_calorie_adjustment?: number;
  training_goal?: 'strength' | 'hypertrophy' | 'endurance' | 'general';
  training_days?: number[];
  featured_badges?: string[];
  rest_timer_sound: 'beep' | 'bell' | 'chime' | 'buzz' | 'none';
  onboarding_completed: boolean;
  created_at: string;
}

export const defaultUser: User = {
  id: 'local-user',
  name: 'Użytkownik',
  username: 'użytkownik123',
  weight_unit: 'kg',
  one_rm_formula: 'epley',
  rest_timer_default: 90,
  theme: 'dark',
  accent_color: '#22C55E',
  language: 'pl',
  calorie_goal: 2200,
  protein_goal: 160,
  carbs_goal: 220,
  fat_goal: 73,
  water_goal_ml: 2500,
  rest_timer_sound: 'beep',
  onboarding_completed: false,
  created_at: new Date().toISOString(),
};
