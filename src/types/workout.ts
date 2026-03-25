export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms' | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves' | 'abs' | 'traps' | 'lats' | 'cardio' | 'full_body' | 'other';

export type Equipment = 'barbell' | 'dumbbell' | 'kettlebell' | 'machine' | 'cable' | 'bodyweight' | 'bands' | 'ez_bar' | 'smith_machine' | 'other';

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure' | 'amrap';

export interface Exercise {
    id: string;
    name: string;
    name_en: string;
    primary_muscle: string;
    secondary_muscles: string[];
    equipment: string;
    difficulty: string;
    instructions: string[];
    description?: string;
    bodyParts?: { name: string; percentage: number }[];
    filters?: string[];
    subFilters?: string[];
    is_custom: boolean;
    is_bodyweight: boolean;
}

export interface SetEntry {
    id: string;
    workout_exercise_id: string;
    set_number: number;
    weight_kg?: number;
    reps?: number;
    rpe?: number;
    rir?: number;
    tempo?: string;
    rest_seconds?: number;
    set_type: SetType;
    is_completed: boolean;
    completed_at?: string;
    notes?: string;
}

export interface WorkoutExercise {
    id: string;
    session_id: string;
    exercise_id: string;
    order: number;
    superset_group?: number;
    notes?: string;
    sets: SetEntry[];
}

export interface WorkoutSession {
    id: string;
    user_id: string;
    template_id?: string;
    name: string;
    started_at: string;
    finished_at?: string;
    duration_seconds?: number;
    total_volume_kg: number;
    total_sets: number;
    total_reps: number;
    exercises: WorkoutExercise[];
    notes?: string;
    status: 'active' | 'completed' | 'discarded';
    created_at: string;
}

export interface WorkoutTemplate {
    id: string;
    name: string;
    description?: string;
    estimated_duration_min?: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    primary_muscles: string[];
    exercises: TemplateExercise[];
    is_builtin: boolean;
    use_count: number;
    created_at: string;
}

export type TemplateTrackType = 'weight_reps' | 'bodyweight_reps' | 'time';

export interface TemplateSet {
    id: string;
    weight_kg?: number;
    reps?: number;
    duration_seconds?: number;
}

export interface TemplateExercise {
    id: string;
    exercise_id: string;
    order: number;
    superset_group?: number;
    target_sets: number;
    target_reps_min: number;
    target_reps_max: number;
    rest_seconds?: number;
    notes?: string;
    track_type?: TemplateTrackType;
    sets?: TemplateSet[];
}

export interface PRRecord {
    id: string;
    exercise_id: string;
    pr_type: 'max_weight' | 'max_reps' | 'estimated_1rm';
    value: number;
    weight_kg?: number;
    reps?: number;
    achieved_at: string;
    previous_value?: number;
}
