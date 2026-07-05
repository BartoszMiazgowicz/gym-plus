import { describe, it, expect } from 'vitest';
import { estimate1RM, calculateBMR, calculateTDEE, calculateVolume, formatDuration } from './calculations';

describe('estimate1RM', () => {
    it('returns 0 for invalid input', () => {
        expect(estimate1RM(0, 5)).toBe(0);
        expect(estimate1RM(100, 0)).toBe(0);
    });

    it('returns the weight itself for a single rep', () => {
        expect(estimate1RM(100, 1)).toBe(100);
    });

    it('estimates 1RM using the Epley formula', () => {
        expect(estimate1RM(100, 10, 'epley')).toBeCloseTo(133.3, 1);
    });

    it('estimates 1RM using the Brzycki formula', () => {
        expect(estimate1RM(100, 10, 'brzycki')).toBeCloseTo(133.3, 1);
    });
});

describe('calculateBMR', () => {
    it('uses the male Mifflin-St Jeor offset', () => {
        expect(calculateBMR(80, 180, 30, 'male')).toBe(1780);
    });

    it('uses the female Mifflin-St Jeor offset', () => {
        expect(calculateBMR(60, 165, 25, 'female')).toBe(1345);
    });
});

describe('calculateTDEE', () => {
    it('applies the correct activity multiplier', () => {
        expect(calculateTDEE(1500, 'sedentary')).toBe(1800);
        expect(calculateTDEE(1500, 'very_active')).toBe(2850);
    });
});

describe('calculateVolume', () => {
    it('sums weight x reps across sets', () => {
        const sets = [
            { weight_kg: 100, reps: 5, is_completed: true },
            { weight_kg: 50, reps: 10, is_completed: true },
        ];
        expect(calculateVolume(sets)).toBe(1000);
    });

    it('ignores sets missing weight or reps', () => {
        const sets = [{ weight_kg: 100, reps: undefined }, { weight_kg: undefined, reps: 10 }];
        expect(calculateVolume(sets)).toBe(0);
    });
});

describe('formatDuration', () => {
    it('formats seconds under an hour as mm:ss', () => {
        expect(formatDuration(90)).toBe('01:30');
    });

    it('formats an hour or more as h:mm:ss', () => {
        expect(formatDuration(3665)).toBe('1:01:05');
    });
});
