export interface Recipe {
  id: string;
  name: string;
  category: string;
  area: string;
  instructions: string;
  thumbnail: string;
  tags: string[];
  ingredients: { ingredient: string; measure: string }[];
  source: "mealdb" | "spoonacular" | "manual";
  mealType?: "breakfast" | "lunch" | "dinner" | "any";
  youtubeUrl?: string;
  sourceUrl?: string;
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

// Spoonacular filter options
export const SPOONACULAR_DIETS = [
  "gluten free",
  "ketogenic",
  "vegetarian",
  "lacto-vegetarian",
  "ovo-vegetarian",
  "vegan",
  "pescetarian",
  "paleo",
  "primal",
  "whole30",
] as const;

export const SPOONACULAR_INTOLERANCES = [
  "dairy",
  "egg",
  "gluten",
  "grain",
  "peanut",
  "seafood",
  "sesame",
  "shellfish",
  "soy",
  "sulfite",
  "tree nut",
  "wheat",
] as const;

export const SPOONACULAR_CUISINES = [
  "African",
  "American",
  "British",
  "Cajun",
  "Caribbean",
  "Chinese",
  "Eastern European",
  "European",
  "French",
  "German",
  "Greek",
  "Indian",
  "Irish",
  "Italian",
  "Japanese",
  "Jewish",
  "Korean",
  "Latin American",
  "Mediterranean",
  "Mexican",
  "Middle Eastern",
  "Nordic",
  "Southern",
  "Spanish",
  "Thai",
  "Vietnamese",
] as const;

export const SPOONACULAR_MEAL_TYPES = [
  "main course",
  "side dish",
  "dessert",
  "appetizer",
  "salad",
  "bread",
  "breakfast",
  "soup",
  "beverage",
  "sauce",
  "marinade",
  "fingerfood",
  "snack",
  "drink",
] as const;
