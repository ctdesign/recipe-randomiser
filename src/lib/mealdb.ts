import type { Recipe } from "@/types/recipe";

const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

// TheMealDB categories mapped to meal types
const BREAKFAST_CATEGORIES = ["Breakfast", "Starter", "Side"];
const DINNER_CATEGORIES = [
  "Beef",
  "Chicken",
  "Lamb",
  "Pork",
  "Seafood",
  "Pasta",
  "Goat",
];
const LUNCH_CATEGORIES = [
  "Miscellaneous",
  "Vegetarian",
  "Vegan",
  "Starter",
  "Side",
  "Pasta",
  "Seafood",
];

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string | null;
  strSource: string | null;
  [key: string]: string | null;
}

function parseMeal(meal: MealDBMeal): Recipe {
  const ingredients: { ingredient: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure?.trim() || "",
      });
    }
  }

  return {
    id: `mealdb_${meal.idMeal}`,
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    thumbnail: meal.strMealThumb,
    tags: meal.strTags ? meal.strTags.split(",").map((t) => t.trim()) : [],
    ingredients,
    source: "mealdb",
    youtubeUrl: meal.strYoutube || undefined,
    sourceUrl: meal.strSource || undefined,
  };
}

export async function getRandomMeal(): Promise<Recipe | null> {
  try {
    const res = await fetch(`${BASE_URL}/random.php`);
    const data = await res.json();
    if (data.meals && data.meals[0]) {
      return parseMeal(data.meals[0]);
    }
    return null;
  } catch {
    return null;
  }
}

export async function searchMeals(query: string): Promise<Recipe[]> {
  try {
    const res = await fetch(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.meals) {
      return data.meals.map(parseMeal);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getMealsByCategory(category: string): Promise<Recipe[]> {
  try {
    // First get the list of meals in the category
    const res = await fetch(`${BASE_URL}/filter.php?c=${encodeURIComponent(category)}`);
    const data = await res.json();
    if (!data.meals) return [];

    // The filter endpoint returns limited data, so we need to fetch full details
    // We'll return basic info and fetch details on demand
    return data.meals.map(
      (meal: { idMeal: string; strMeal: string; strMealThumb: string }) => ({
        id: `mealdb_${meal.idMeal}`,
        name: meal.strMeal,
        category,
        area: "",
        instructions: "",
        thumbnail: meal.strMealThumb,
        tags: [],
        ingredients: [],
        source: "mealdb" as const,
      })
    );
  } catch {
    return [];
  }
}

export async function getMealById(id: string): Promise<Recipe | null> {
  try {
    const mealdbId = id.replace("mealdb_", "");
    const res = await fetch(`${BASE_URL}/lookup.php?i=${mealdbId}`);
    const data = await res.json();
    if (data.meals && data.meals[0]) {
      return parseMeal(data.meals[0]);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getAllCategories(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/list.php?c=list`);
    const data = await res.json();
    if (data.meals) {
      return data.meals.map((m: { strCategory: string }) => m.strCategory);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getAllAreas(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE_URL}/list.php?a=list`);
    const data = await res.json();
    if (data.meals) {
      return data.meals.map((m: { strArea: string }) => m.strArea);
    }
    return [];
  } catch {
    return [];
  }
}

export async function getMealsByArea(area: string): Promise<Recipe[]> {
  try {
    const res = await fetch(`${BASE_URL}/filter.php?a=${encodeURIComponent(area)}`);
    const data = await res.json();
    if (!data.meals) return [];
    return data.meals.map(
      (meal: { idMeal: string; strMeal: string; strMealThumb: string }) => ({
        id: `mealdb_${meal.idMeal}`,
        name: meal.strMeal,
        category: "",
        area,
        instructions: "",
        thumbnail: meal.strMealThumb,
        tags: [],
        ingredients: [],
        source: "mealdb" as const,
      })
    );
  } catch {
    return [];
  }
}

export function getCategoriesForMealType(
  mealType: "breakfast" | "lunch" | "dinner"
): string[] {
  switch (mealType) {
    case "breakfast":
      return BREAKFAST_CATEGORIES;
    case "lunch":
      return LUNCH_CATEGORIES;
    case "dinner":
      return DINNER_CATEGORIES;
  }
}

export async function getRandomMealForType(
  mealType: "breakfast" | "lunch" | "dinner"
): Promise<Recipe | null> {
  const categories = getCategoriesForMealType(mealType);

  // Try up to 10 times to get a meal that fits the category
  for (let i = 0; i < 10; i++) {
    const recipe = await getRandomMeal();
    if (recipe && categories.includes(recipe.category)) {
      recipe.mealType = mealType;
      return recipe;
    }
  }

  // Fallback: pick a random category and get a meal from it
  const randomCategory =
    categories[Math.floor(Math.random() * categories.length)];
  const meals = await getMealsByCategory(randomCategory);
  if (meals.length > 0) {
    const randomMeal = meals[Math.floor(Math.random() * meals.length)];
    const fullMeal = await getMealById(randomMeal.id);
    if (fullMeal) {
      fullMeal.mealType = mealType;
      return fullMeal;
    }
  }

  return null;
}
