import type { Recipe } from "@/types/recipe";

const BASE_URL = "https://api.spoonacular.com/recipes";
const API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY || "";

export function isSpoonacularConfigured(): boolean {
  return Boolean(API_KEY);
}

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType?: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl?: string;
  summary?: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  instructions?: string;
  extendedIngredients?: {
    original: string;
    name: string;
    amount: number;
    unit: string;
  }[];
  nutrition?: {
    nutrients: { name: string; amount: number; unit: string }[];
  };
}

interface SpoonacularSearchResult {
  results: {
    id: number;
    title: string;
    image: string;
    imageType: string;
  }[];
  offset: number;
  number: number;
  totalResults: number;
}

function mapMealType(dishTypes?: string[]): Recipe["mealType"] {
  if (!dishTypes || dishTypes.length === 0) return undefined;
  const types = dishTypes.map((t) => t.toLowerCase());
  if (types.some((t) => t.includes("breakfast") || t.includes("morning meal")))
    return "breakfast";
  if (types.some((t) => t.includes("lunch"))) return "lunch";
  if (
    types.some(
      (t) =>
        t.includes("dinner") ||
        t.includes("main course") ||
        t.includes("main dish")
    )
  )
    return "dinner";
  return undefined;
}

function parseSpoonacularRecipe(r: SpoonacularRecipe): Recipe {
  const calories = r.nutrition?.nutrients?.find(
    (n) => n.name.toLowerCase() === "calories"
  );

  return {
    id: `spoonacular_${r.id}`,
    name: r.title,
    category: r.dishTypes?.[0] || "",
    area: r.cuisines?.[0] || "",
    instructions: r.instructions || "",
    thumbnail: r.image || "",
    tags: r.diets || [],
    ingredients: (r.extendedIngredients || []).map((ing) => ({
      ingredient: ing.name,
      measure: `${ing.amount} ${ing.unit}`.trim(),
    })),
    source: "spoonacular",
    mealType: mapMealType(r.dishTypes),
    sourceUrl: r.sourceUrl,
    calories: calories ? Math.round(calories.amount) : undefined,
    totalTime: r.readyInMinutes || undefined,
    servings: r.servings || undefined,
    dietLabels: r.diets,
    cuisineType: r.cuisines,
  };
}

export interface SpoonacularSearchParams {
  query?: string;
  cuisine?: string;
  diet?: string;
  intolerances?: string;
  type?: string; // meal type like "main course", "breakfast", etc.
  offset?: number;
  number?: number;
}

export async function searchSpoonacular(params: SpoonacularSearchParams): Promise<{
  recipes: Recipe[];
  total: number;
}> {
  if (!isSpoonacularConfigured()) {
    return { recipes: [], total: 0 };
  }

  const url = new URL(`${BASE_URL}/complexSearch`);
  url.searchParams.set("apiKey", API_KEY);
  url.searchParams.set("addRecipeInformation", "true");
  url.searchParams.set("addRecipeNutrition", "true");
  url.searchParams.set("fillIngredients", "true");
  url.searchParams.set("number", String(params.number || 20));

  if (params.query) url.searchParams.set("query", params.query);
  if (params.cuisine) url.searchParams.set("cuisine", params.cuisine);
  if (params.diet) url.searchParams.set("diet", params.diet);
  if (params.intolerances)
    url.searchParams.set("intolerances", params.intolerances);
  if (params.type) url.searchParams.set("type", params.type);
  if (params.offset) url.searchParams.set("offset", String(params.offset));

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return { recipes: [], total: 0 };
    const data: SpoonacularSearchResult & { results: SpoonacularRecipe[] } =
      await res.json();
    return {
      recipes: data.results.map(parseSpoonacularRecipe),
      total: data.totalResults,
    };
  } catch {
    return { recipes: [], total: 0 };
  }
}

export async function getRandomSpoonacularRecipe(
  mealType?: "breakfast" | "lunch" | "dinner"
): Promise<Recipe | null> {
  if (!isSpoonacularConfigured()) return null;

  const url = new URL(`${BASE_URL}/random`);
  url.searchParams.set("apiKey", API_KEY);
  url.searchParams.set("number", "1");
  url.searchParams.set("addRecipeInformation", "true");
  url.searchParams.set("addRecipeNutrition", "true");

  if (mealType) {
    const tagMap: Record<string, string> = {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner,main course",
    };
    url.searchParams.set("tags", tagMap[mealType]);
  }

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data: { recipes: SpoonacularRecipe[] } = await res.json();
    if (!data.recipes || data.recipes.length === 0) return null;
    return parseSpoonacularRecipe(data.recipes[0]);
  } catch {
    return null;
  }
}
