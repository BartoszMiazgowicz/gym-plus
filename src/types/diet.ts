export interface FoodItem {
    id: string;
    name: string;
    name_en?: string;
    brand?: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    fiber_per_100g?: number;
    default_serving_g: number;
    serving_label?: string;
    category?: string;
    is_custom: boolean;
    barcode?: string;
}

export interface MealEntry {
    id: string;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    food_id: string;
    food_name: string;
    amount_g: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at: string;
}

export interface Recipe {
    id: string;
    name: string;
    servings: number;
    ingredients: RecipeIngredient[];
    instructions?: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    created_at: string;
}

export interface RecipeIngredient {
    food_id: string;
    food_name: string;
    amount_g: number;
}

export interface WeightEntry {
    id: string;
    date: string;
    weight_kg: number;
    created_at: string;
}

export interface WaterEntry {
    id: string;
    date: string;
    amount_ml: number;
    created_at: string;
}

export interface DailyNutrition {
    date: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    meals: MealEntry[];
    water_ml: number;
}
