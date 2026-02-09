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
import { Shuffle } from "lucide-react";

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

      const recentIds = new Set(
        history
          .filter(
            (h) =>
              h.action === "not_now" &&
              Date.now() - h.timestamp < 7 * 24 * 60 * 60 * 1000
          )
          .map((h) => h.recipeId)
      );

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
          // continue
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
          setActionFeedback("Added to your Maybe list");
        } else if (action === "never") {
          await blockRecipe(recipe.id, recipe.name);
          setActionFeedback("Hidden from future suggestions");
        } else {
          setActionFeedback("Skipped for now");
        }

        setTimeout(() => {
          setActionFeedback(null);
          fetchSuggestion();
        }, 1000);
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Suggest</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Random recipe ideas for your meal plan
        </p>
      </div>

      {/* Meal type selector */}
      <div className="flex gap-1.5 mb-4">
        {mealTypes.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMealType(value)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              mealType === value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
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
        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-medium text-sm mb-4 hover:bg-gray-800 disabled:opacity-50 transition-colors active:scale-[0.99]"
      >
        <Shuffle size={16} />
        {loading ? "Finding a recipe..." : "Suggest a Recipe"}
      </button>

      {/* Feedback */}
      {actionFeedback && (
        <div className="bg-gray-50 border border-gray-100 text-gray-600 px-4 py-2.5 rounded-lg mb-4 text-xs text-center">
          {actionFeedback}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-4 text-xs">
          {error}
        </div>
      )}

      {/* Recipe card */}
      {recipe && (
        <RecipeCard recipe={recipe} onAction={handleAction} showActions={true} />
      )}

      {/* Empty state */}
      {!recipe && !loading && !error && (
        <div className="text-center py-20 text-gray-300">
          <Shuffle size={40} className="mx-auto mb-3" />
          <p className="text-sm">Choose a meal type and hit suggest</p>
        </div>
      )}
    </div>
  );
}
