"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getMaybeRecipes,
  saveMealPlan,
  getMealPlan,
  getUserPreferences,
} from "@/lib/firebase";
import type { Recipe, MaybeRecipe, UserPreferences } from "@/types/recipe";
import { DEFAULT_PREFERENCES, DAY_NAMES } from "@/types/recipe";
import { Copy, FileText, Save, X, Plus, Trash2 } from "lucide-react";

const MEALS = ["breakfast", "lunch", "dinner"] as const;

function getPlanStartDate(weekStartDay: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  let diff = currentDay - weekStartDay;
  if (diff < 0) diff += 7;
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type PlanState = {
  [dayKey: string]: {
    [meal: string]: Recipe | null;
  };
};

export default function PlannerPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [plan, setPlan] = useState<PlanState>({});
  const [maybeRecipes, setMaybeRecipes] = useState<MaybeRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<{ dayKey: string; meal: string } | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const days = useMemo(() => {
    const start = getPlanStartDate(prefs.weekStartDay);
    const totalDays = prefs.planWeeks * 7;
    const result: { key: string; label: string; date: Date; weekNum: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dayName = DAY_NAMES[date.getDay()];
      const key = date.toISOString().split("T")[0];
      result.push({
        key,
        label: `${dayName} ${formatDateShort(date)}`,
        date,
        weekNum: Math.floor(i / 7) + 1,
      });
    }
    return result;
  }, [prefs.weekStartDay, prefs.planWeeks]);

  const planId = useMemo(() => {
    if (days.length === 0) return "";
    return `plan_${days[0].key}_${days[days.length - 1].key}`;
  }, [days]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [maybes, userPrefs] = await Promise.all([
          getMaybeRecipes(),
          getUserPreferences(),
        ]);
        setMaybeRecipes(maybes);
        setPrefs(userPrefs);
      } catch {
        // Firebase not configured
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!planId || loading) return;
    const loadPlan = async () => {
      try {
        const saved = await getMealPlan(planId);
        if (saved && saved.meals) {
          setPlan(saved.meals as PlanState);
        }
      } catch {
        // ignore
      }
    };
    loadPlan();
  }, [planId, loading]);

  const assignRecipe = (dayKey: string, meal: string, recipe: Recipe) => {
    setPlan((prev) => ({
      ...prev,
      [dayKey]: { ...(prev[dayKey] || {}), [meal]: recipe },
    }));
    setAssigning(null);
  };

  const clearSlot = (dayKey: string, meal: string) => {
    setPlan((prev) => ({
      ...prev,
      [dayKey]: { ...(prev[dayKey] || {}), [meal]: null },
    }));
  };

  const copyDay = (fromKey: string, toKey: string) => {
    setPlan((prev) => ({
      ...prev,
      [toKey]: { ...(prev[fromKey] || { breakfast: null, lunch: null, dinner: null }) },
    }));
    setCopying(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMealPlan(planId, { planId, meals: plan });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch {
      alert("Failed to save. Check Firebase configuration.");
    } finally {
      setSaving(false);
    }
  };

  const plainText = useMemo(() => {
    const lines: string[] = [];
    let currentWeek = 0;
    for (const day of days) {
      if (day.weekNum !== currentWeek) {
        currentWeek = day.weekNum;
        if (lines.length > 0) lines.push("");
        lines.push(`--- Week ${currentWeek} ---`);
      }
      const dayMeals = plan[day.key];
      const b = dayMeals?.breakfast;
      const l = dayMeals?.lunch;
      const d = dayMeals?.dinner;
      lines.push(day.label);
      lines.push(`  Breakfast: ${b ? b.name : "-"}`);
      lines.push(`  Lunch:     ${l ? l.name : "-"}`);
      lines.push(`  Dinner:    ${d ? d.name : "-"}`);
    }
    return lines.join("\n");
  }, [plan, days]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(plainText);
  };

  if (loading) {
    return <div className="p-4 text-center py-16 text-gray-400 text-sm">Loading...</div>;
  }

  const weeks: { weekNum: number; days: typeof days }[] = [];
  for (const day of days) {
    const last = weeks[weeks.length - 1];
    if (!last || last.weekNum !== day.weekNum) {
      weeks.push({ weekNum: day.weekNum, days: [day] });
    } else {
      last.days.push(day);
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Meal Plan</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {prefs.planWeeks} week{prefs.planWeeks !== 1 ? "s" : ""} starting {DAY_NAMES[prefs.weekStartDay]}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowExport(!showExport)}
            className="p-2.5 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
            title="Export as text"
          >
            <FileText size={16} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : savedFeedback ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Plain text export */}
      {showExport && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plain Text Export</span>
            <div className="flex gap-1.5">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <Copy size={12} /> Copy
              </button>
              <button onClick={() => setShowExport(false)} className="text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            </div>
          </div>
          <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {plainText}
          </pre>
        </div>
      )}

      {/* Recipe selector bottom sheet */}
      {assigning && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setAssigning(null)}>
          <div
            className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-gray-900">Pick a recipe</h3>
              <button onClick={() => setAssigning(null)} className="p-1 text-gray-300 hover:text-gray-500">
                <X size={18} />
              </button>
            </div>
            {maybeRecipes.length === 0 ? (
              <p className="text-gray-400 text-xs py-8 text-center">
                No recipes in your Maybe list yet
              </p>
            ) : (
              <div className="space-y-1">
                {maybeRecipes.map((item) => (
                  <button
                    key={item.recipe.id}
                    onClick={() => assignRecipe(assigning.dayKey, assigning.meal, item.recipe)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors"
                  >
                    <img
                      src={item.recipe.thumbnail}
                      alt={item.recipe.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{item.recipe.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.recipe.category}{item.recipe.area ? ` · ${item.recipe.area}` : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy day selector */}
      {copying && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setCopying(null)}>
          <div
            className="bg-white rounded-t-2xl w-full max-h-[70vh] overflow-y-auto p-4 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-gray-900">Copy to which day?</h3>
              <button onClick={() => setCopying(null)} className="p-1 text-gray-300 hover:text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-1">
              {days
                .filter((d) => d.key !== copying)
                .map((d) => (
                  <button
                    key={d.key}
                    onClick={() => copyDay(copying, d.key)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                  >
                    {d.label}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Plan grid */}
      <div className="space-y-4">
        {weeks.map((week) => (
          <div key={week.weekNum}>
            {prefs.planWeeks > 1 && (
              <div className="text-[10px] font-medium text-gray-300 uppercase tracking-widest mb-2">
                Week {week.weekNum}
              </div>
            )}
            <div className="space-y-2">
              {week.days.map((day) => (
                <div key={day.key} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
                    <span className="font-medium text-xs text-gray-700">{day.label}</span>
                    <button
                      onClick={() => setCopying(day.key)}
                      className="p-1 text-gray-300 hover:text-gray-500"
                      title="Copy this day"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {MEALS.map((meal) => {
                      const recipe = plan[day.key]?.[meal];
                      return (
                        <div key={meal} className="flex items-center gap-3 px-3 py-2 min-h-[44px]">
                          <span className="text-[10px] text-gray-300 w-14 capitalize">{meal}</span>
                          {recipe ? (
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <img
                                src={recipe.thumbnail}
                                alt={recipe.name}
                                className="w-7 h-7 rounded object-cover flex-shrink-0"
                              />
                              <span className="text-xs text-gray-700 flex-1 truncate">{recipe.name}</span>
                              <button
                                onClick={() => clearSlot(day.key, meal)}
                                className="p-1 text-gray-200 hover:text-red-400 flex-shrink-0"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigning({ dayKey: day.key, meal })}
                              className="flex-1 flex items-center gap-1 text-left text-xs text-gray-200 hover:text-gray-500 transition-colors"
                            >
                              <Plus size={12} /> Add
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
        ))}
      </div>
    </div>
  );
}
