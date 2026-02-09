"use client";

import { useState, useEffect } from "react";
import RecipeCard from "@/components/RecipeCard";
import { getMaybeRecipes, removeMaybeRecipe } from "@/lib/firebase";
import type { MaybeRecipe } from "@/types/recipe";
import { Bookmark } from "lucide-react";

export default function MaybeListPage() {
  const [recipes, setRecipes] = useState<MaybeRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        const data = await getMaybeRecipes();
        setRecipes(data);
      } catch {
        // Firebase not configured yet
      } finally {
        setLoading(false);
      }
    };
    loadRecipes();
  }, []);

  const handleRemove = async (recipeId: string) => {
    await removeMaybeRecipe(recipeId);
    setRecipes((prev) => prev.filter((r) => r.recipe.id !== recipeId));
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Maybe List</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} saved for review
        </p>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
      )}

      {!loading && recipes.length === 0 && (
        <div className="text-center py-20 text-gray-300">
          <Bookmark size={40} className="mx-auto mb-3" />
          <p className="text-sm">No recipes saved yet</p>
          <p className="text-xs mt-1 text-gray-300">
            Tap &quot;Maybe&quot; on suggestions to add them here
          </p>
        </div>
      )}

      <div className="space-y-3">
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
