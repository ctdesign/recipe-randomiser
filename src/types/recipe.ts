export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  tags: string[];
  ingredients: { ingredient: string; measure: string }[];
  source: "mealdb" | "edamam" | "manual";
  mealType?: "breakfast" | "lunch" | "dinner" | "any";
  youtubeUrl?: string;
  sourceUrl?: string;
  // Edamam-specific fields
  calories?: number;
  totalTime?: number;
  servings?: number;
  dietLabels?: string[];
  healthLabels?: string[];
  cuisineType?: string[];
}

export type RecipeAction = "maybe" | "not_now" | "never";

export interface RecipePreference {
  recipeId: string;
  action: RecipeAction;
  timestamp: number;
}

export interface MaybeRecipe {
  recipe: Recipe;
  addedAt: number;
}

export interface BlockedRecipe {
  id: string;
  name: string;
  blockedAt: number;
}

export interface UserPreferences {
  planWeeks: number; // 1–52
  weekStartDay: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  planWeeks: 2,
  weekStartDay: 1, // Monday
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Edamam filter options
export const EDAMAM_DIET_LABELS = [
  "balanced",
  "high-fiber",
  "high-protein",
  "low-carb",
  "low-fat",
  "low-sodium",
] as const;

export const EDAMAM_HEALTH_LABELS = [
  "alcohol-free",
  "celery-free",
  "crustacean-free",
  "dairy-free",
  "egg-free",
  "fish-free",
  "gluten-free",
  "keto-friendly",
  "kidney-friendly",
  "kosher",
  "low-sugar",
  "lupine-free",
  "mollusk-free",
  "mustard-free",
  "no-oil-added",
  "paleo",
  "peanut-free",
  "pescatarian",
  "pork-free",
  "red-meat-free",
  "sesame-free",
  "shellfish-free",
  "soy-free",
  "sugar-conscious",
  "tree-nut-free",
  "vegan",
  "vegetarian",
  "wheat-free",
] as const;

export const EDAMAM_CUISINE_TYPES = [
  "American",
  "Asian",
  "British",
  "Caribbean",
  "Central Europe",
  "Chinese",
  "Eastern Europe",
  "French",
  "Indian",
  "Italian",
  "Japanese",
  "Kosher",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Nordic",
  "South American",
  "South East Asian",
] as const;

export const EDAMAM_MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
] as const;
