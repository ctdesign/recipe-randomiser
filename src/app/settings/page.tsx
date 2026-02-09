"use client";

import { useState, useEffect } from "react";
import {
  getBlockedRecipes,
  unblockRecipe,
  getRecentHistory,
  getUserPreferences,
  saveUserPreferences,
} from "@/lib/firebase";
import type { BlockedRecipe, UserPreferences } from "@/types/recipe";
import { DEFAULT_PREFERENCES, DAY_NAMES } from "@/types/recipe";
import { Unlock, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [blockedRecipes, setBlockedRecipes] = useState<BlockedRecipe[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [blocked, history, userPrefs] = await Promise.all([
          getBlockedRecipes(),
          getRecentHistory(),
          getUserPreferences(),
        ]);
        setBlockedRecipes(blocked);
        setHistoryCount(history.length);
        setPrefs(userPrefs);
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUnblock = async (id: string) => {
    await unblockRecipe(id);
    setBlockedRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await saveUserPreferences(prefs);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      alert("Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-400 text-xs mt-0.5">Manage your preferences</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* Meal plan preferences */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-medium text-sm text-gray-900 mb-4">Meal Plan</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Plan duration (weeks)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={52}
                    value={prefs.planWeeks}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, planWeeks: Number(e.target.value) }))
                    }
                    className="flex-1 accent-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">
                    {prefs.planWeeks}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Week starts on</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES.map((day, i) => (
                    <button
                      key={day}
                      onClick={() => setPrefs((p) => ({ ...p, weekStartDay: i }))}
                      className={`py-2 rounded-lg text-[10px] font-medium transition-colors ${
                        prefs.weekStartDay === i
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSavePrefs}
                disabled={savingPrefs}
                className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white py-2.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {prefsSaved ? (
                  <><Check size={14} /> Saved</>
                ) : (
                  <><Save size={14} /> {savingPrefs ? "Saving..." : "Save Preferences"}</>
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-medium text-sm text-gray-900 mb-3">Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-semibold text-gray-900">{historyCount}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Recipes seen</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-xl font-semibold text-gray-900">{blockedRecipes.length}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Blocked</div>
              </div>
            </div>
          </div>

          {/* Blocked recipes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-medium text-sm text-gray-900 mb-3">
              Blocked Recipes
            </h2>
            {blockedRecipes.length === 0 ? (
              <p className="text-gray-300 text-xs">
                No blocked recipes. Recipes you hide will appear here.
              </p>
            ) : (
              <div className="space-y-1">
                {blockedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="flex items-center justify-between py-2 px-1"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {recipe.name || recipe.id}
                    </span>
                    <button
                      onClick={() => handleUnblock(recipe.id)}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 ml-2 px-2 py-1 rounded-full bg-gray-50 hover:bg-gray-100"
                    >
                      <Unlock size={10} /> Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
