import { defaultUser } from '../types/user';
import type { User } from '../types/user';
import type { WorkoutSession, WorkoutTemplate, PRRecord, SetType } from '../types/workout';
import type { MealEntry, WeightEntry, WaterEntry, Recipe } from '../types/diet';

export interface BodyMeasurement {
    id: string;
    date: string;
    chest_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    bicep_left_cm?: number;
    bicep_right_cm?: number;
    thigh_left_cm?: number;
    thigh_right_cm?: number;
    calf_left_cm?: number;
    calf_right_cm?: number;
    neck_cm?: number;
    shoulders_cm?: number;
    forearm_cm?: number;
    body_fat_pct?: number;
    created_at: string;
}

export interface BadgeRecord {
    id: string;
    unlocked_at: string;
}

export type PostVisibility = 'public' | 'followers' | 'private';

export interface FeedExerciseSummary {
    exercise_id: string;
    sets: { weight_kg?: number; reps?: number; set_type?: SetType }[];
}

export interface FeedPostData {
    // workout posts
    name?: string;
    duration_seconds?: number;
    total_volume_kg?: number;
    total_sets?: number;
    total_reps?: number;
    exercises_count?: number;
    exercises?: FeedExerciseSummary[];
    // badge posts
    icon?: string;
    // weight posts
    weight_kg?: number;
}

export interface FeedPost {
    id: string;
    type: 'workout' | 'badge' | 'weight';
    timestamp: string;
    data: FeedPostData;
    description?: string;
    photos?: string[];
    visibility?: PostVisibility;
}

const KEYS = {
    USER: 'gymplus_user',
    WORKOUTS: 'gymplus_workouts',
    TEMPLATES: 'gymplus_templates',
    PRS: 'gymplus_prs',
    MEALS: 'gymplus_meals',
    WEIGHT: 'gymplus_weight',
    WATER: 'gymplus_water',
    RECIPES: 'gymplus_recipes',
    BADGES: 'gymplus_badges',
    FEED: 'gymplus_feed',
    BODY: 'gymplus_body',
};

function read<T>(key: string, fallback: T): T {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch { return fallback; }
}

function write<T>(key: string, data: T): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn('localStorage write failed for', key, e);
        throw e;
    }
    window.dispatchEvent(new Event('gymplus_store_changed'));
}

export function getAllData() {
    return {
        user: read(KEYS.USER, defaultUser),
        workouts: read(KEYS.WORKOUTS, []),
        templates: read(KEYS.TEMPLATES, []),
        prs: read(KEYS.PRS, []),
        meals: read(KEYS.MEALS, []),
        weight: read(KEYS.WEIGHT, []),
        water: read(KEYS.WATER, []),
        recipes: read(KEYS.RECIPES, []),
        badges: read(KEYS.BADGES, []),
        feed: read(KEYS.FEED, []),
        body: read(KEYS.BODY, [])
    };
}

export function loadAllData(data: Partial<ReturnType<typeof getAllData>>): void {
    if (data.user) localStorage.setItem(KEYS.USER, JSON.stringify(data.user));
    if (data.workouts) localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(data.workouts));
    if (data.templates) localStorage.setItem(KEYS.TEMPLATES, JSON.stringify(data.templates));
    if (data.prs) localStorage.setItem(KEYS.PRS, JSON.stringify(data.prs));
    if (data.meals) localStorage.setItem(KEYS.MEALS, JSON.stringify(data.meals));
    if (data.weight) localStorage.setItem(KEYS.WEIGHT, JSON.stringify(data.weight));
    if (data.water) localStorage.setItem(KEYS.WATER, JSON.stringify(data.water));
    if (data.recipes) localStorage.setItem(KEYS.RECIPES, JSON.stringify(data.recipes));
    if (data.badges) localStorage.setItem(KEYS.BADGES, JSON.stringify(data.badges));
    if (data.feed) localStorage.setItem(KEYS.FEED, JSON.stringify(data.feed));
    if (data.body) localStorage.setItem(KEYS.BODY, JSON.stringify(data.body));
    window.dispatchEvent(new Event('gymplus_store_changed'));
}

export function clearAllData(silent = false): void {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    if (!silent) window.dispatchEvent(new Event('gymplus_store_changed'));
}

export function uuid(): string {
    return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

export function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

// ===== USER =====
export function getUser(): User {
    return read(KEYS.USER, defaultUser);
}
export function saveUser(user: User): void {
    write(KEYS.USER, user);
}

// ===== WORKOUTS =====
export function getWorkouts(): WorkoutSession[] {
    return read<WorkoutSession[]>(KEYS.WORKOUTS, []);
}
export function saveWorkout(w: WorkoutSession): void {
    const all = getWorkouts();
    const idx = all.findIndex(x => x.id === w.id);
    if (idx >= 0) all[idx] = w; else all.push(w);
    write(KEYS.WORKOUTS, all);
}
export function getCompletedWorkouts(): WorkoutSession[] {
    return getWorkouts().filter(w => w.status === 'completed').sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}
export function deleteWorkout(id: string): void {
    write(KEYS.WORKOUTS, getWorkouts().filter(w => w.id !== id));
}
export function getActiveWorkout(): WorkoutSession | undefined {
    return getWorkouts().find(w => w.status === 'active');
}

// ===== TEMPLATES =====
export function getTemplates(): WorkoutTemplate[] {
    return read<WorkoutTemplate[]>(KEYS.TEMPLATES, []);
}
export function saveTemplate(t: WorkoutTemplate): void {
    const all = getTemplates();
    const idx = all.findIndex(x => x.id === t.id);
    if (idx >= 0) all[idx] = t; else all.push(t);
    write(KEYS.TEMPLATES, all);
}
export function deleteTemplate(id: string): void {
    write(KEYS.TEMPLATES, getTemplates().filter(t => t.id !== id));
}

// ===== PRS =====
export function getPRs(): PRRecord[] {
    return read<PRRecord[]>(KEYS.PRS, []);
}
export function savePR(pr: PRRecord): void {
    const all = getPRs();
    all.push(pr);
    write(KEYS.PRS, all);
}
export function getBestPR(exerciseId: string, type: PRRecord['pr_type']): PRRecord | undefined {
    return getPRs().filter(p => p.exercise_id === exerciseId && p.pr_type === type).sort((a, b) => b.value - a.value)[0];
}

// ===== MEALS =====
export function getMeals(date?: string): MealEntry[] {
    const d = date || todayStr();
    return read<MealEntry[]>(KEYS.MEALS, []).filter(m => m.date === d);
}
export function getAllMeals(): MealEntry[] {
    return read<MealEntry[]>(KEYS.MEALS, []);
}
export function saveMeal(m: MealEntry): void {
    const all = read<MealEntry[]>(KEYS.MEALS, []);
    all.push(m);
    write(KEYS.MEALS, all);
}
export function deleteMeal(id: string): void {
    write(KEYS.MEALS, read<MealEntry[]>(KEYS.MEALS, []).filter(m => m.id !== id));
}

// ===== WEIGHT =====
export function getWeightEntries(): WeightEntry[] {
    return read<WeightEntry[]>(KEYS.WEIGHT, []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export function saveWeight(entry: WeightEntry): void {
    const all = read<WeightEntry[]>(KEYS.WEIGHT, []);
    const idx = all.findIndex(w => w.date === entry.date);
    if (idx >= 0) all[idx] = entry; else all.push(entry);
    write(KEYS.WEIGHT, all);
}

// ===== WATER =====
export function getWaterToday(): number {
    const d = todayStr();
    return read<WaterEntry[]>(KEYS.WATER, []).filter(w => w.date === d).reduce((sum, w) => sum + w.amount_ml, 0);
}
export function getAllWater(): WaterEntry[] {
    return read<WaterEntry[]>(KEYS.WATER, []);
}
export function addWater(ml: number): void {
    const all = read<WaterEntry[]>(KEYS.WATER, []);
    all.push({ id: uuid(), date: todayStr(), amount_ml: ml, created_at: new Date().toISOString() });
    write(KEYS.WATER, all);
}

// ===== RECIPES =====
export function getRecipes(): Recipe[] {
    return read<Recipe[]>(KEYS.RECIPES, []);
}
export function saveRecipe(r: Recipe): void {
    const all = getRecipes();
    const idx = all.findIndex(x => x.id === r.id);
    if (idx >= 0) all[idx] = r; else all.push(r);
    write(KEYS.RECIPES, all);
}

// ===== BADGES =====
export function getBadges(): BadgeRecord[] {
    return read<BadgeRecord[]>(KEYS.BADGES, []);
}
export function saveBadges(badges: BadgeRecord[]): void {
    write(KEYS.BADGES, badges);
}

// ===== FEED =====
export function getFeed(): FeedPost[] {
    return read<FeedPost[]>(KEYS.FEED, []);
}
export function addFeedPost(post: FeedPost): void {
    const all = getFeed();
    if (all.some(p => p.id === post.id)) return;
    all.unshift(post);
    write(KEYS.FEED, all);
}
export function removeFeedPost(id: string): void {
    write(KEYS.FEED, getFeed().filter(p => p.id !== id));
}

// ===== BODY MEASUREMENTS =====
export function getBodyMeasurements(): BodyMeasurement[] {
    return read<BodyMeasurement[]>(KEYS.BODY, []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
export function saveBodyMeasurement(m: BodyMeasurement): void {
    const all = read<BodyMeasurement[]>(KEYS.BODY, []);
    const idx = all.findIndex(x => x.id === m.id);
    if (idx >= 0) all[idx] = m; else all.push(m);
    write(KEYS.BODY, all);
}
export function deleteBodyMeasurement(id: string): void {
    write(KEYS.BODY, read<BodyMeasurement[]>(KEYS.BODY, []).filter(m => m.id !== id));
}
