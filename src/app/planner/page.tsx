"use client";

import { useState, useEffect } from "react";
import { getMaybeRecipes, removeMaybeRecipe, saveWeeklyPlan, getWeeklyPlan } from "@/lib/firebase";
import type { Recipe, MaybeRecipe } from "@/types/recipe";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ["breakfast", "lunch", "dinner"] as const;

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

type PlanState = {
  [day: string]: {
    [meal: string]: Recipe | null;
  };
};

export default function PlannerPage() {
  const [plan, setPlan] = useState<PlanState>(() => {
    const initial: PlanState = {};
    DAYS.forEach((day) => {
      initial[day] = { breakfast: null, lunch: null, dinner: null };
    });
    return initial;
  });
  const [maybeRecipes, setMaybeRecipes] = useState<MaybeRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<{ day: string; meal: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const weekStart = getWeekStart();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [maybes, savedPlan] = await Promise.all([
          getMaybeRecipes(),
          getWeeklyPlan(weekStart),
        ]);
        setMaybeRecipes(maybes);
        if (savedPlan && savedPlan.meals) {
          setPlan(savedPlan.meals as PlanState);
        }
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [weekStart]);

  const assignRecipe = (day: string, meal: string, recipe: Recipe) => {
    setPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: recipe },
    }));
    setAssigning(null);
  };

  const clearSlot = (day: string, meal: string) => {
    setPlan((prev) => ({
      ...prev,
      [day]: { ...prev[day], [meal]: null },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveWeeklyPlan(weekStart, plan);
      alert("Meal plan saved!");
    } catch {
      alert("Failed to save. Check Firebase configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center py-16 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meal Plan</h1>
          <p className="text-gray-500 text-sm">Week of {weekStart}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Plan"}
        </button>
      </div>

      {/* Recipe selector modal */}
      {assigning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">
                Pick for {assigning.day} {assigning.meal}
              </h3>
              <button
                onClick={() => setAssigning(null)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                Close
              </button>
            </div>
            {maybeRecipes.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                No recipes in your Maybe list. Go suggest some first!
              </p>
            ) : (
              <div className="space-y-2">
                {maybeRecipes.map((item) => (
                  <button
                    key={item.recipe.id}
                    onClick={() => assignRecipe(assigning.day, assigning.meal, item.recipe)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <img
                      src={item.recipe.thumbnail}
                      alt={item.recipe.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {item.recipe.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.recipe.category} {item.recipe.area ? `· ${item.recipe.area}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly plan grid */}
      <div className="space-y-3">
        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 font-semibold text-sm text-gray-700 border-b border-gray-100">
              {day}
            </div>
            <div className="divide-y divide-gray-50">
              {MEALS.map((meal) => {
                const recipe = plan[day]?.[meal];
                return (
                  <div key={meal} className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xs text-gray-400 w-16 capitalize">{meal}</span>
                    {recipe ? (
                      <div className="flex-1 flex items-center gap-2">
                        <img
                          src={recipe.thumbnail}
                          alt={recipe.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <span className="text-sm text-gray-800 flex-1 truncate">
                          {recipe.name}
                        </span>
                        <button
                          onClick={() => clearSlot(day, meal)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssigning({ day, meal })}
                        className="flex-1 text-left text-sm text-gray-300 hover:text-blue-500"
                      >
                        + Add meal
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
