"use client";

import { useState, useCallback } from "react";
import RecipeCard from "@/components/RecipeCard";
import { getRandomMealForType, getRandomMeal } from "@/lib/mealdb";
import {
  blockRecipe,
  addMaybeRecipe,
  addToHistory,
  getBlockedRecipeIds,
  getRecentHistory,
  getManualRecipes,
} from "@/lib/firebase";
import type { Recipe, RecipeAction } from "@/types/recipe";

type MealType = "breakfast" | "lunch" | "dinner" | "any";

export default function SuggestPage() {
  const [mealType, setMealType] = useState<MealType>("any");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchSuggestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRecipe(null);
    setActionFeedback(null);

    try {
      const [blocked, history] = await Promise.all([
        getBlockedRecipeIds(),
        getRecentHistory(),
      ]);

      // Recent "not now" recipes from the last 7 days
      const recentIds = new Set(
        history
          .filter(
            (h) =>
              h.action === "not_now" &&
              Date.now() - h.timestamp < 7 * 24 * 60 * 60 * 1000
          )
          .map((h) => h.recipeId)
      );

      // Try to get a non-blocked, non-recent recipe
      let attempts = 0;
      let candidate: Recipe | null = null;

      while (attempts < 15) {
        if (mealType === "any") {
          candidate = await getRandomMeal();
        } else {
          candidate = await getRandomMealForType(mealType);
        }

        if (candidate && !blocked.has(candidate.id) && !recentIds.has(candidate.id)) {
          break;
        }
        candidate = null;
        attempts++;
      }

      // Also try manual recipes if available
      if (!candidate) {
        try {
          const manualRecipes = await getManualRecipes();
          const eligible = manualRecipes.filter(
            (r) =>
              !blocked.has(r.id) &&
              !recentIds.has(r.id) &&
              (mealType === "any" || r.mealType === mealType)
          );
          if (eligible.length > 0) {
            candidate = eligible[Math.floor(Math.random() * eligible.length)];
          }
        } catch {
          // Manual recipes not available, continue
        }
      }

      if (candidate) {
        setRecipe(candidate);
      } else {
        setError("Could not find a new recipe. Try a different meal type or check your blocked list.");
      }
    } catch {
      setError("Failed to fetch recipes. Check your internet connection and Firebase config.");
    } finally {
      setLoading(false);
    }
  }, [mealType]);

  const handleAction = useCallback(
    async (action: RecipeAction) => {
      if (!recipe) return;

      try {
        await addToHistory(recipe.id, action);

        if (action === "maybe") {
          await addMaybeRecipe(recipe);
          setActionFeedback("Added to your Maybe list!");
        } else if (action === "never") {
          await blockRecipe(recipe.id);
          setActionFeedback("Recipe blocked. You won't see it again.");
        } else {
          setActionFeedback("Skipped for now.");
        }

        // Auto-fetch next suggestion after a brief delay
        setTimeout(() => {
          setActionFeedback(null);
          fetchSuggestion();
        }, 1200);
      } catch {
        setError("Failed to save your choice. Check Firebase configuration.");
      }
    },
    [recipe, fetchSuggestion]
  );

  const mealTypes: { value: MealType; label: string }[] = [
    { value: "any", label: "Any" },
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Recipe Randomiser</h1>
      <p className="text-gray-500 text-sm mb-4">
        Get random recipe suggestions for your meal plan
      </p>

      {/* Meal type selector */}
      <div className="flex gap-2 mb-4">
        {mealTypes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMealType(value)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mealType === value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Suggest button */}
      <button
        onClick={fetchSuggestion}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold text-lg mb-4 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
      >
        {loading ? "Finding a recipe..." : "Suggest a Recipe"}
      </button>

      {/* Feedback toast */}
      {actionFeedback && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm text-center animate-pulse">
          {actionFeedback}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Recipe card */}
      {recipe && (
        <RecipeCard recipe={recipe} onAction={handleAction} showActions={true} />
      )}

      {/* Empty state */}
      {!recipe && !loading && !error && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Choose a meal type and hit suggest!</p>
          <p className="text-sm mt-1">
            We&apos;ll find a random recipe for you
          </p>
        </div>
      )}
    </div>
  );
}
