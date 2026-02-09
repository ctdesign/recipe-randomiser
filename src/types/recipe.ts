export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  tags: string[];
  ingredients: { ingredient: string; measure: string }[];
  source: "mealdb" | "manual";
  mealType?: "breakfast" | "lunch" | "dinner" | "any";
  youtubeUrl?: string;
  sourceUrl?: string;
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
