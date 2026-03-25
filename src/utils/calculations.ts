// ===== 1RM Estimation =====
export function estimate1RM(weight: number, reps: number, formula: 'epley' | 'brzycki' = 'epley'): number {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (formula === 'epley') return Math.round(weight * (1 + reps / 30) * 10) / 10;
    // Brzycki
    return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
}

// ===== BMR (Mifflin-St Jeor) =====
export function calculateBMR(weightKg: number, heightCm: number, age: number, gender: 'male' | 'female'): number {
    if (gender === 'male') return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
}

// ===== TDEE =====
const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: keyof typeof activityMultipliers): number {
    return Math.round(bmr * activityMultipliers[activityLevel]);
}

// ===== Volume =====
export function calculateVolume(sets: { weight_kg?: number; reps?: number; is_completed?: boolean }[]): number {
    return sets.reduce((total, s) => {
        if (s.weight_kg && s.reps) return total + s.weight_kg * s.reps;
        return total;
    }, 0);
}

// ===== Warmup Generator =====
export function generateWarmup(workingWeight: number): { weight: number; reps: number }[] {
    if (workingWeight <= 20) return [];
    const warmups: { weight: number; reps: number }[] = [];
    const barWeight = 20;
    warmups.push({ weight: barWeight, reps: 15 });
    if (workingWeight > 40) warmups.push({ weight: Math.round(workingWeight * 0.5 / 2.5) * 2.5, reps: 10 });
    if (workingWeight > 60) warmups.push({ weight: Math.round(workingWeight * 0.75 / 2.5) * 2.5, reps: 5 });
    if (workingWeight > 80) warmups.push({ weight: Math.round(workingWeight * 0.875 / 2.5) * 2.5, reps: 3 });
    return warmups;
}

// ===== Auto-Progression =====
export function suggestProgression(lastWeights: number[], lastReps: number[], targetRepsMax: number): { suggestedWeight: number; reason: string } | null {
    if (lastWeights.length < 2 || lastReps.length < 2) return null;
    const allReachedTarget = lastReps.every(r => r >= targetRepsMax);
    if (allReachedTarget) {
        const currentWeight = lastWeights[0];
        const increment = currentWeight >= 100 ? 5 : 2.5;
        return {
            suggestedWeight: currentWeight + increment,
            reason: `Wszystkie serie na ${targetRepsMax} reps — czas na +${increment}kg!`
        };
    }
    return null;
}

// ===== Time formatting =====
export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatDateShort(date: string): string {
    return new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
}

export function timeAgo(date: string): string {
    const now = Date.now();
    const d = new Date(date).getTime();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`;
    const days = Math.floor(diff / 86400);
    if (days === 1) return 'wczoraj';
    if (days < 7) return `${days} dni temu`;
    return formatDateShort(date);
}
