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

export interface WeeklyPlan {
  weekStart: string; // ISO date string for Monday
  meals: {
    [day: string]: {
      breakfast?: Recipe | null;
      lunch?: Recipe | null;
      dinner?: Recipe | null;
    };
  };
}
