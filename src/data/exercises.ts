import type { Exercise } from '../types/workout';
import rawData from './exercises.json';

const filterToMuscle: Record<string, string> = {
    'klatka piersiowa': 'chest',
    'plecy': 'back',
    'barki': 'shoulders',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'nogi': 'quadriceps',
    'dwuglowe uda': 'hamstrings',
    'posladki': 'glutes',
    'lydki': 'calves',
    'brzuch': 'abs',
    'core': 'abs',
    'przedramiona': 'forearms',
    'cardio': 'cardio',
    'mobilnosc': 'other',
    'rehab': 'other',
    'rozciaganie': 'other',
    'pelne cialo': 'full_body',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exerciseDatabase: Exercise[] = (rawData as any[]).map((e) => ({
    id: `json-${e.id}`,
    name: e.name,
    name_en: e.englishName || e.name,
    equipment: e.equipment || 'brak',
    difficulty: e.difficulty || 'sredniozaawansowany',
    bodyParts: e.bodyParts || [],
    filters: e.filters || [],
    subFilters: e.subFilters || [],
    description: e.description || '',
    instructions: Array.isArray(e.instructions) ? e.instructions : [e.instructions].filter(Boolean),
    is_custom: false,
    is_bodyweight: !e.equipment || e.equipment === 'brak',
    primary_muscle: filterToMuscle[e.filters?.[0]] || 'other',
    secondary_muscles: (e.filters?.slice(1) || []).map((f: string) => filterToMuscle[f] || f),
}));

export const muscleGroupNames: Record<string, { pl: string; en: string }> = {
    // English keys (used internally after mapping)
    chest: { pl: 'Klatka piersiowa', en: 'Chest' },
    back: { pl: 'Plecy', en: 'Back' },
    shoulders: { pl: 'Barki', en: 'Shoulders' },
    biceps: { pl: 'Biceps', en: 'Biceps' },
    triceps: { pl: 'Triceps', en: 'Triceps' },
    forearms: { pl: 'Przedramiona', en: 'Forearms' },
    quadriceps: { pl: 'Nogi', en: 'Legs' },
    hamstrings: { pl: 'Dwugłowe uda', en: 'Hamstrings' },
    glutes: { pl: 'Pośladki', en: 'Glutes' },
    calves: { pl: 'Łydki', en: 'Calves' },
    abs: { pl: 'Brzuch / Core', en: 'Abs / Core' },
    traps: { pl: 'Trapez', en: 'Traps' },
    lats: { pl: 'Najszersze', en: 'Lats' },
    cardio: { pl: 'Cardio', en: 'Cardio' },
    full_body: { pl: 'Pełne ciało', en: 'Full Body' },
    other: { pl: 'Inne', en: 'Other' },
    // Polish filter keys (for display in bodyParts lists)
    'klatka piersiowa': { pl: 'Klatka piersiowa', en: 'Chest' },
    'plecy': { pl: 'Plecy', en: 'Back' },
    'barki': { pl: 'Barki', en: 'Shoulders' },
    'nogi': { pl: 'Nogi', en: 'Legs' },
    'dwuglowe uda': { pl: 'Dwugłowe uda', en: 'Hamstrings' },
    'posladki': { pl: 'Pośladki', en: 'Glutes' },
    'lydki': { pl: 'Łydki', en: 'Calves' },
    'brzuch': { pl: 'Brzuch', en: 'Abs' },
    'core': { pl: 'Core', en: 'Core' },
    'przedramiona': { pl: 'Przedramiona', en: 'Forearms' },
    'pelne cialo': { pl: 'Pełne ciało', en: 'Full Body' },
};

export const equipmentNames: Record<string, { pl: string; en: string }> = {
    barbell: { pl: 'Sztanga', en: 'Barbell' },
    dumbbell: { pl: 'Hantle', en: 'Dumbbell' },
    kettlebell: { pl: 'Kettlebell', en: 'Kettlebell' },
    machine: { pl: 'Maszyna', en: 'Machine' },
    cable: { pl: 'Wyciąg', en: 'Cable' },
    bodyweight: { pl: 'Ciężar ciała', en: 'Bodyweight' },
    bands: { pl: 'Gumy', en: 'Bands' },
    ez_bar: { pl: 'Gryf łamany', en: 'EZ Bar' },
    smith_machine: { pl: 'Suwnicy Smitha', en: 'Smith Machine' },
    other: { pl: 'Inne', en: 'Other' },
};

// Unique filter categories from the database
export const exerciseFilters: { key: string; pl: string }[] = [
    { key: 'klatka piersiowa', pl: 'Klatka' },
    { key: 'plecy', pl: 'Plecy' },
    { key: 'barki', pl: 'Barki' },
    { key: 'biceps', pl: 'Biceps' },
    { key: 'triceps', pl: 'Triceps' },
    { key: 'nogi', pl: 'Nogi' },
    { key: 'dwuglowe uda', pl: 'Dwugłowe' },
    { key: 'posladki', pl: 'Pośladki' },
    { key: 'lydki', pl: 'Łydki' },
    { key: 'brzuch', pl: 'Brzuch' },
    { key: 'core', pl: 'Core' },
    { key: 'przedramiona', pl: 'Przedramiona' },
    { key: 'cardio', pl: 'Cardio' },
    { key: 'pelne cialo', pl: 'Pełne ciało' },
    { key: 'mobilnosc', pl: 'Mobilność' },
    { key: 'rehab', pl: 'Rehab' },
    { key: 'rozciaganie', pl: 'Rozciąganie' },
];
