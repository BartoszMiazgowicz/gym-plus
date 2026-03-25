import type { FoodItem } from '../types/diet';

export const foodDatabase: FoodItem[] = [
    // ===== BIAŁKO =====
    { id: 'fd-1', name: 'Kurczak, pierś bez skóry', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, default_serving_g: 150, serving_label: 'pierś', category: 'mięso', is_custom: false },
    { id: 'fd-2', name: 'Kurczak, udko', calories_per_100g: 209, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 11, default_serving_g: 120, serving_label: 'udko', category: 'mięso', is_custom: false },
    { id: 'fd-3', name: 'Indyk, pierś', calories_per_100g: 135, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 1, default_serving_g: 150, category: 'mięso', is_custom: false },
    { id: 'fd-4', name: 'Wołowina, mielona (90/10)', calories_per_100g: 176, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 10, default_serving_g: 150, category: 'mięso', is_custom: false },
    { id: 'fd-5', name: 'Łosoś', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13, default_serving_g: 150, serving_label: 'filet', category: 'ryby', is_custom: false },
    { id: 'fd-6', name: 'Tuńczyk w puszce (w wodzie)', calories_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1, default_serving_g: 100, category: 'ryby', is_custom: false },
    { id: 'fd-7', name: 'Jajko całe', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, default_serving_g: 60, serving_label: 'sztuka', category: 'jaja', is_custom: false },
    { id: 'fd-8', name: 'Białko jajka', calories_per_100g: 52, protein_per_100g: 11, carbs_per_100g: 0.7, fat_per_100g: 0.2, default_serving_g: 33, serving_label: 'białko', category: 'jaja', is_custom: false },

    // ===== NABIAŁ =====
    { id: 'fd-9', name: 'Twaróg półtłusty', calories_per_100g: 124, protein_per_100g: 18, carbs_per_100g: 3, fat_per_100g: 4.5, default_serving_g: 200, category: 'nabiał', is_custom: false },
    { id: 'fd-10', name: 'Jogurt grecki 2%', calories_per_100g: 59, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.7, default_serving_g: 200, category: 'nabiał', is_custom: false },
    { id: 'fd-11', name: 'Mleko 2%', calories_per_100g: 50, protein_per_100g: 3.4, carbs_per_100g: 4.8, fat_per_100g: 2, default_serving_g: 250, serving_label: 'szklanka', category: 'nabiał', is_custom: false },
    { id: 'fd-12', name: 'Ser żółty Gouda', calories_per_100g: 356, protein_per_100g: 25, carbs_per_100g: 2.2, fat_per_100g: 27, default_serving_g: 30, serving_label: 'plaster', category: 'nabiał', is_custom: false },
    { id: 'fd-13', name: 'Serek wiejski', calories_per_100g: 98, protein_per_100g: 12, carbs_per_100g: 3.5, fat_per_100g: 4, default_serving_g: 200, serving_label: 'opakowanie', category: 'nabiał', is_custom: false },
    { id: 'fd-14', name: 'Odżywka białkowa WPC', calories_per_100g: 380, protein_per_100g: 75, carbs_per_100g: 8, fat_per_100g: 5, default_serving_g: 30, serving_label: 'miarka', category: 'suplementy', is_custom: false },

    // ===== WĘGLOWODANY =====
    { id: 'fd-15', name: 'Ryż biały (gotowany)', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, default_serving_g: 200, category: 'zboża', is_custom: false },
    { id: 'fd-16', name: 'Ryż brązowy (gotowany)', calories_per_100g: 112, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, default_serving_g: 200, category: 'zboża', is_custom: false },
    { id: 'fd-17', name: 'Makaron (gotowany)', calories_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1, default_serving_g: 200, category: 'zboża', is_custom: false },
    { id: 'fd-18', name: 'Płatki owsiane', calories_per_100g: 379, protein_per_100g: 13, carbs_per_100g: 66, fat_per_100g: 7, default_serving_g: 60, category: 'zboża', is_custom: false },
    { id: 'fd-19', name: 'Chleb pszenny', calories_per_100g: 265, protein_per_100g: 9, carbs_per_100g: 49, fat_per_100g: 3.2, default_serving_g: 40, serving_label: 'kromka', category: 'pieczywo', is_custom: false },
    { id: 'fd-20', name: 'Chleb pełnoziarnisty', calories_per_100g: 250, protein_per_100g: 12, carbs_per_100g: 41, fat_per_100g: 3.4, default_serving_g: 50, serving_label: 'kromka', category: 'pieczywo', is_custom: false },
    { id: 'fd-21', name: 'Ziemniaki (gotowane)', calories_per_100g: 77, protein_per_100g: 2, carbs_per_100g: 17, fat_per_100g: 0.1, default_serving_g: 200, category: 'warzywa', is_custom: false },
    { id: 'fd-22', name: 'Bataty (gotowane)', calories_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1, default_serving_g: 200, category: 'warzywa', is_custom: false },

    // ===== OWOCE =====
    { id: 'fd-23', name: 'Banan', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, default_serving_g: 120, serving_label: 'sztuka', category: 'owoce', is_custom: false },
    { id: 'fd-24', name: 'Jabłko', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, default_serving_g: 180, serving_label: 'sztuka', category: 'owoce', is_custom: false },
    { id: 'fd-25', name: 'Truskawki', calories_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3, default_serving_g: 150, category: 'owoce', is_custom: false },
    { id: 'fd-26', name: 'Borówki', calories_per_100g: 57, protein_per_100g: 0.7, carbs_per_100g: 14, fat_per_100g: 0.3, default_serving_g: 100, category: 'owoce', is_custom: false },
    { id: 'fd-27', name: 'Pomarańcza', calories_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 12, fat_per_100g: 0.1, default_serving_g: 200, serving_label: 'sztuka', category: 'owoce', is_custom: false },

    // ===== WARZYWA =====
    { id: 'fd-28', name: 'Brokuły', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, fiber_per_100g: 2.6, default_serving_g: 150, category: 'warzywa', is_custom: false },
    { id: 'fd-29', name: 'Szpinak', calories_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4, fiber_per_100g: 2.2, default_serving_g: 100, category: 'warzywa', is_custom: false },
    { id: 'fd-30', name: 'Pomidor', calories_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2, default_serving_g: 150, serving_label: 'sztuka', category: 'warzywa', is_custom: false },
    { id: 'fd-31', name: 'Ogórek', calories_per_100g: 15, protein_per_100g: 0.7, carbs_per_100g: 3.6, fat_per_100g: 0.1, default_serving_g: 200, category: 'warzywa', is_custom: false },
    { id: 'fd-32', name: 'Sałata', calories_per_100g: 15, protein_per_100g: 1.4, carbs_per_100g: 2.9, fat_per_100g: 0.2, default_serving_g: 50, category: 'warzywa', is_custom: false },
    { id: 'fd-33', name: 'Cebula', calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.1, default_serving_g: 80, serving_label: 'sztuka', category: 'warzywa', is_custom: false },

    // ===== TŁUSZCZE =====
    { id: 'fd-34', name: 'Oliwa z oliwek', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, default_serving_g: 10, serving_label: 'łyżka', category: 'tłuszcze', is_custom: false },
    { id: 'fd-35', name: 'Masło orzechowe', calories_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50, default_serving_g: 15, serving_label: 'łyżka', category: 'orzechy', is_custom: false },
    { id: 'fd-36', name: 'Awokado', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15, default_serving_g: 100, serving_label: 'połówka', category: 'owoce', is_custom: false },
    { id: 'fd-37', name: 'Migdały', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50, default_serving_g: 30, serving_label: 'garść', category: 'orzechy', is_custom: false },
    { id: 'fd-38', name: 'Orzechy włoskie', calories_per_100g: 654, protein_per_100g: 15, carbs_per_100g: 14, fat_per_100g: 65, default_serving_g: 25, serving_label: 'garść', category: 'orzechy', is_custom: false },

    // ===== NAPOJE =====
    { id: 'fd-39', name: 'Kawa czarna', calories_per_100g: 2, protein_per_100g: 0.3, carbs_per_100g: 0, fat_per_100g: 0, default_serving_g: 250, serving_label: 'filiżanka', category: 'napoje', is_custom: false },
    { id: 'fd-40', name: 'Kawa z mlekiem', calories_per_100g: 17, protein_per_100g: 0.7, carbs_per_100g: 2, fat_per_100g: 0.5, default_serving_g: 250, serving_label: 'filiżanka', category: 'napoje', is_custom: false },

    // ===== PRZEKĄSKI =====
    { id: 'fd-41', name: 'Baton proteinowy', calories_per_100g: 350, protein_per_100g: 30, carbs_per_100g: 30, fat_per_100g: 12, default_serving_g: 60, serving_label: 'baton', category: 'przekąski', is_custom: false },
    { id: 'fd-42', name: 'Czekolada gorzka 70%', calories_per_100g: 598, protein_per_100g: 7.8, carbs_per_100g: 46, fat_per_100g: 43, default_serving_g: 25, serving_label: 'rządek', category: 'przekąski', is_custom: false },
    { id: 'fd-43', name: 'Hummus', calories_per_100g: 166, protein_per_100g: 8, carbs_per_100g: 14, fat_per_100g: 10, default_serving_g: 50, category: 'przekąski', is_custom: false },

    // ===== PRODUKTY POPULARNE =====
    { id: 'fd-44', name: 'Miód', calories_per_100g: 304, protein_per_100g: 0.3, carbs_per_100g: 82, fat_per_100g: 0, default_serving_g: 15, serving_label: 'łyżeczka', category: 'słodycze', is_custom: false },
    { id: 'fd-45', name: 'Masło', calories_per_100g: 717, protein_per_100g: 0.9, carbs_per_100g: 0.1, fat_per_100g: 81, default_serving_g: 10, serving_label: 'plaster', category: 'tłuszcze', is_custom: false },
    { id: 'fd-46', name: 'Cukier', calories_per_100g: 387, protein_per_100g: 0, carbs_per_100g: 100, fat_per_100g: 0, default_serving_g: 5, serving_label: 'łyżeczka', category: 'inne', is_custom: false },
    { id: 'fd-47', name: 'Kasza gryczana (gotowana)', calories_per_100g: 92, protein_per_100g: 3.4, carbs_per_100g: 20, fat_per_100g: 0.6, default_serving_g: 200, category: 'zboża', is_custom: false },
    { id: 'fd-48', name: 'Quinoa (gotowana)', calories_per_100g: 120, protein_per_100g: 4.4, carbs_per_100g: 21, fat_per_100g: 1.9, default_serving_g: 200, category: 'zboża', is_custom: false },
    { id: 'fd-49', name: 'Szynka drobiowa', calories_per_100g: 112, protein_per_100g: 18, carbs_per_100g: 2, fat_per_100g: 3.5, default_serving_g: 30, serving_label: 'plaster', category: 'wędliny', is_custom: false },
    { id: 'fd-50', name: 'Jogurt naturalny', calories_per_100g: 61, protein_per_100g: 3.5, carbs_per_100g: 4.7, fat_per_100g: 3.3, default_serving_g: 150, category: 'nabiał', is_custom: false },
];
