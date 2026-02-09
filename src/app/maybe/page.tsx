"use client";

import { useState, useEffect } from "react";
import RecipeCard from "@/components/RecipeCard";
import { getMaybeRecipes, removeMaybeRecipe } from "@/lib/firebase";
import type { MaybeRecipe } from "@/types/recipe";

export default function MaybeListPage() {
  const [recipes, setRecipes] = useState<MaybeRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await getMaybeRecipes();
      setRecipes(data);
    } catch {
      // Firebase not configured yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const handleRemove = async (recipeId: string) => {
    await removeMaybeRecipe(recipeId);
    setRecipes((prev) => prev.filter((r) => r.recipe.id !== recipeId));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Maybe List</h1>
      <p className="text-gray-500 text-sm mb-4">
        Recipes you&apos;re considering for your meal plan
      </p>

      {loading && (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      )}

      {!loading && recipes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No recipes saved yet</p>
          <p className="text-sm mt-1">
            Hit &quot;Maybe&quot; on suggestions to add them here
          </p>
        </div>
      )}

      <div className="space-y-4">
        {recipes.map((item) => (
          <RecipeCard
            key={item.recipe.id}
            recipe={item.recipe}
            showActions={false}
            onRemove={() => handleRemove(item.recipe.id)}
          />
        ))}
      </div>
    </div>
  );
}
