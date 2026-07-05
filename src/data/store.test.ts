import { describe, it, expect, beforeEach } from 'vitest';
import {
    uuid, todayStr, getUser, saveUser, getAllData, loadAllData, clearAllData,
    getWorkouts, saveWorkout, getCompletedWorkouts, deleteWorkout,
    addFeedPost, getFeed, removeFeedPost,
} from './store';
import { defaultUser } from '../types/user';
import type { WorkoutSession } from '../types/workout';
import type { FeedPost } from './store';

beforeEach(() => {
    localStorage.clear();
});

describe('uuid', () => {
    it('generates unique, non-empty ids', () => {
        const a = uuid();
        const b = uuid();
        expect(a).not.toBe(b);
        expect(a.length).toBeGreaterThan(0);
    });
});

describe('todayStr', () => {
    it('returns an ISO date (YYYY-MM-DD)', () => {
        expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('user', () => {
    it('falls back to defaultUser when nothing is stored', () => {
        expect(getUser()).toEqual(defaultUser);
    });

    it('persists and reloads a saved user', () => {
        const updated = { ...defaultUser, name: 'Jan Testowy', onboarding_completed: true };
        saveUser(updated);
        expect(getUser()).toEqual(updated);
    });
});

describe('workouts', () => {
    const makeWorkout = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
        id: uuid(),
        user_id: 'local-user',
        name: 'Trening testowy',
        started_at: new Date().toISOString(),
        total_volume_kg: 0,
        total_sets: 0,
        total_reps: 0,
        exercises: [],
        status: 'active',
        created_at: new Date().toISOString(),
        ...overrides,
    });

    it('saves a workout and lists it', () => {
        const w = makeWorkout();
        saveWorkout(w);
        expect(getWorkouts().map(x => x.id)).toContain(w.id);
    });

    it('only counts completed workouts as completed', () => {
        saveWorkout(makeWorkout({ status: 'active' }));
        saveWorkout(makeWorkout({ status: 'completed' }));
        expect(getCompletedWorkouts().length).toBe(1);
    });

    it('removes a workout by id', () => {
        const w = makeWorkout();
        saveWorkout(w);
        deleteWorkout(w.id);
        expect(getWorkouts().map(x => x.id)).not.toContain(w.id);
    });
});

describe('feed posts', () => {
    it('adds, lists, and removes a feed post', () => {
        const post: FeedPost = { id: uuid(), type: 'weight', timestamp: new Date().toISOString(), data: { weight_kg: 80 } };
        addFeedPost(post);
        expect(getFeed().map(p => p.id)).toContain(post.id);

        removeFeedPost(post.id);
        expect(getFeed().map(p => p.id)).not.toContain(post.id);
    });
});

describe('getAllData / loadAllData roundtrip', () => {
    it('restores a full snapshot, e.g. after a cloud sync download', () => {
        saveUser({ ...defaultUser, name: 'Ala' });
        const snapshot = getAllData();

        clearAllData(true);
        expect(getUser().name).not.toBe('Ala');

        loadAllData(snapshot);
        expect(getUser().name).toBe('Ala');
    });
});

describe('clearAllData', () => {
    it('wipes every known key back to defaults', () => {
        saveUser({ ...defaultUser, name: 'Ktoś' });
        clearAllData(true);
        expect(getUser()).toEqual(defaultUser);
        expect(getWorkouts()).toEqual([]);
        expect(getFeed()).toEqual([]);
    });
});
