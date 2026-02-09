import type { Recipe } from "@/types/recipe";

const BASE_URL = "https://api.edamam.com/api/recipes/v2";
const APP_ID = process.env.NEXT_PUBLIC_EDAMAM_APP_ID || "";
const APP_KEY = process.env.NEXT_PUBLIC_EDAMAM_APP_KEY || "";

export function isEdamamConfigured(): boolean {
  return Boolean(APP_ID && APP_KEY);
}

interface EdamamRecipe {
  uri: string;
  label: string;
  image: string;
  source: string;
  url: string;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  ingredientLines: string[];
  calories: number;
  totalTime: number;
  cuisineType?: string[];
  mealType?: string[];
  dishType?: string[];
  totalNutrients?: Record<string, { label: string; quantity: number; unit: string }>;
}

interface EdamamHit {
  recipe: EdamamRecipe;
}

interface EdamamResponse {
  from: number;
  to: number;
  count: number;
  _links?: { next?: { href: string } };
  hits: EdamamHit[];
}

function parseEdamamId(uri: string): string {
  // URI format: "http://www.edamam.com/ontologies/edamam.owl#recipe_xxxx"
  const hash = uri.split("#")[1] || uri;
  return `edamam_${hash}`;
}

function mapMealType(edamamMealTypes?: string[]): Recipe["mealType"] {
  if (!edamamMealTypes || edamamMealTypes.length === 0) return undefined;
  const type = edamamMealTypes[0].toLowerCase();
  if (type.includes("breakfast")) return "breakfast";
  if (type.includes("lunch")) return "lunch";
  if (type.includes("dinner")) return "dinner";
  return undefined;
}

function parseEdamamRecipe(hit: EdamamHit): Recipe {
  const r = hit.recipe;
  return {
    id: parseEdamamId(r.uri),
    name: r.label,
    category: r.dishType?.[0] || "",
    area: r.cuisineType?.[0] || "",
    instructions: "", // Edamam doesn't provide instructions, just a link
    thumbnail: r.image,
    tags: r.dietLabels || [],
    ingredients: r.ingredientLines.map((line) => ({
      ingredient: line,
      measure: "",
    })),
    source: "edamam",
    mealType: mapMealType(r.mealType),
    sourceUrl: r.url,
    calories: Math.round(r.calories / (r.yield || 1)),
    totalTime: r.totalTime || undefined,
    servings: r.yield || undefined,
    dietLabels: r.dietLabels,
    healthLabels: r.healthLabels,
    cuisineType: r.cuisineType,
  };
}

export interface EdamamSearchParams {
  query?: string;
  mealType?: string;
  cuisineType?: string;
  diet?: string;
  health?: string[];
  from?: number;
  to?: number;
}

export async function searchEdamam(params: EdamamSearchParams): Promise<{
  recipes: Recipe[];
  total: number;
}> {
  if (!isEdamamConfigured()) {
    return { recipes: [], total: 0 };
  }

  const url = new URL(BASE_URL);
  url.searchParams.set("type", "public");
  url.searchParams.set("app_id", APP_ID);
  url.searchParams.set("app_key", APP_KEY);

  if (params.query) {
    url.searchParams.set("q", params.query);
  }
  if (params.mealType) {
    url.searchParams.set("mealType", params.mealType);
  }
  if (params.cuisineType) {
    url.searchParams.set("cuisineType", params.cuisineType);
  }
  if (params.diet) {
    url.searchParams.set("diet", params.diet);
  }
  if (params.health) {
    for (const h of params.health) {
      url.searchParams.append("health", h);
    }
  }

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return { recipes: [], total: 0 };
    const data: EdamamResponse = await res.json();
    return {
      recipes: data.hits.map(parseEdamamRecipe),
      total: data.count,
    };
  } catch {
    return { recipes: [], total: 0 };
  }
}

export async function getRandomEdamamRecipe(
  mealType?: "breakfast" | "lunch" | "dinner"
): Promise<Recipe | null> {
  if (!isEdamamConfigured()) return null;

  // Use common food terms as random seeds
  const randomTerms = [
    "chicken", "pasta", "salad", "soup", "rice", "beef", "fish",
    "curry", "stew", "vegetable", "potato", "shrimp", "tofu",
    "mushroom", "tomato", "cheese", "egg", "bread", "noodle", "bean",
  ];
  const term = randomTerms[Math.floor(Math.random() * randomTerms.length)];

  const params: EdamamSearchParams = { query: term };
  if (mealType) {
    // Capitalize for Edamam API
    params.mealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  }

  const { recipes } = await searchEdamam(params);
  if (recipes.length === 0) return null;

  // Pick a random one from results
  return recipes[Math.floor(Math.random() * recipes.length)];
}
