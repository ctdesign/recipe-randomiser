"use client";

import { useState, useEffect } from "react";
import RecipeCard from "@/components/RecipeCard";
import {
  searchMeals,
  getMealsByCategory,
  getMealsByArea,
  getMealById,
  getAllCategories,
  getAllAreas,
} from "@/lib/mealdb";
import { searchEdamam, isEdamamConfigured } from "@/lib/edamam";
import { addMaybeRecipe, blockRecipe, addToHistory } from "@/lib/firebase";
import type { Recipe, RecipeAction } from "@/types/recipe";
import {
  EDAMAM_DIET_LABELS,
  EDAMAM_HEALTH_LABELS,
  EDAMAM_CUISINE_TYPES,
  EDAMAM_MEAL_TYPES,
} from "@/types/recipe";
import { Search, Filter, X, Loader2 } from "lucide-react";

type SearchSource = "all" | "mealdb" | "edamam";

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchSource, setSearchSource] = useState<SearchSource>("all");

  // MealDB filters
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");

  // Edamam filters
  const [selectedDiet, setSelectedDiet] = useState<string>("");
  const [selectedHealth, setSelectedHealth] = useState<string[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<string>("");

  const [showFilters, setShowFilters] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const edamamAvailable = isEdamamConfigured();

  useEffect(() => {
    const loadFilters = async () => {
      const [cats, ars] = await Promise.all([getAllCategories(), getAllAreas()]);
      setCategories(cats);
      setAreas(ars);
    };
    loadFilters();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedCategory && !selectedArea && !selectedDiet && !selectedHealth.length && !selectedCuisine && !selectedMealType) return;
    setLoading(true);
    setResults([]);
    setTotalResults(0);

    try {
      let allResults: Recipe[] = [];
      let total = 0;

      // MealDB search
      if (searchSource !== "edamam") {
        let mealdbResults: Recipe[] = [];

        if (searchQuery.trim()) {
          mealdbResults = await searchMeals(searchQuery.trim());
        } else if (selectedCategory) {
          mealdbResults = await getMealsByCategory(selectedCategory);
        } else if (selectedArea) {
          mealdbResults = await getMealsByArea(selectedArea);
        }

        if (searchQuery.trim() && selectedCategory) {
          mealdbResults = mealdbResults.filter((m) => m.category === selectedCategory);
        }
        if (searchQuery.trim() && selectedArea) {
          mealdbResults = mealdbResults.filter((m) => m.area === selectedArea);
        }

        allResults = [...mealdbResults];
        total += mealdbResults.length;
      }

      // Edamam search
      if (searchSource !== "mealdb" && edamamAvailable) {
        const hasEdamamFilters = selectedDiet || selectedHealth.length > 0 || selectedCuisine || selectedMealType;
        if (searchQuery.trim() || hasEdamamFilters) {
          const edamamResult = await searchEdamam({
            query: searchQuery.trim() || undefined,
            diet: selectedDiet || undefined,
            health: selectedHealth.length > 0 ? selectedHealth : undefined,
            cuisineType: selectedCuisine || undefined,
            mealType: selectedMealType || undefined,
          });
          allResults = [...allResults, ...edamamResult.recipes];
          total += edamamResult.total;
        }
      }

      setResults(allResults);
      setTotalResults(total);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDetail = async (recipe: Recipe) => {
    // Edamam recipes always have ingredients, just toggle
    if (recipe.source === "edamam" || recipe.instructions) {
      setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id);
      return;
    }
    setLoadingDetail(recipe.id);
    const full = await getMealById(recipe.id);
    if (full) {
      setResults((prev) => prev.map((r) => (r.id === recipe.id ? full : r)));
      setExpandedRecipe(recipe.id);
    }
    setLoadingDetail(null);
  };

  const handleAction = async (recipe: Recipe, action: RecipeAction) => {
    try {
      await addToHistory(recipe.id, action);
      if (action === "maybe") {
        let fullRecipe = recipe;
        if (recipe.source === "mealdb" && !recipe.instructions) {
          const full = await getMealById(recipe.id);
          if (full) fullRecipe = full;
        }
        await addMaybeRecipe(fullRecipe);
        setActionFeedback(`"${recipe.name}" added to Maybe list`);
      } else if (action === "never") {
        await blockRecipe(recipe.id, recipe.name);
        setResults((prev) => prev.filter((r) => r.id !== recipe.id));
        setActionFeedback(`"${recipe.name}" hidden`);
      }
      setTimeout(() => setActionFeedback(null), 2000);
    } catch {
      // ignore
    }
  };

  const toggleHealthLabel = (label: string) => {
    setSelectedHealth((prev) =>
      prev.includes(label) ? prev.filter((h) => h !== label) : [...prev, label]
    );
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedArea("");
    setSelectedDiet("");
    setSelectedHealth([]);
    setSelectedCuisine("");
    setSelectedMealType("");
    setSearchQuery("");
    setResults([]);
    setTotalResults(0);
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedArea ? 1 : 0) +
    (selectedDiet ? 1 : 0) +
    selectedHealth.length +
    (selectedCuisine ? 1 : 0) +
    (selectedMealType ? 1 : 0);

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Browse</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Search {edamamAvailable ? "2M+" : ""} recipes with filters
        </p>
      </div>

      {/* Source tabs */}
      {edamamAvailable && (
        <div className="flex gap-1.5 mb-3">
          {([
            { value: "all", label: "All Sources" },
            { value: "mealdb", label: "MealDB" },
            { value: "edamam", label: "Edamam" },
          ] as { value: SearchSource; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSearchSource(value)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-medium transition-colors ${
                searchSource === value
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search recipes or ingredients..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            activeFilterCount > 0
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-100 text-gray-500"
          }`}
        >
          <Filter size={14} />
          {activeFilterCount > 0 && (
            <span className="bg-white text-gray-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filters</span>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>

          {/* MealDB filters */}
          {searchSource !== "edamam" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Category (MealDB)</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Cuisine (MealDB)</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                >
                  <option value="">All cuisines</option>
                  {areas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Edamam filters */}
          {edamamAvailable && searchSource !== "mealdb" && (
            <>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Meal Type (Edamam)</label>
                <select
                  value={selectedMealType}
                  onChange={(e) => setSelectedMealType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                >
                  <option value="">Any meal</option>
                  {EDAMAM_MEAL_TYPES.map((mt) => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Cuisine (Edamam)</label>
                <select
                  value={selectedCuisine}
                  onChange={(e) => setSelectedCuisine(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                >
                  <option value="">All cuisines</option>
                  {EDAMAM_CUISINE_TYPES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Diet</label>
                <select
                  value={selectedDiet}
                  onChange={(e) => setSelectedDiet(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm"
                >
                  <option value="">Any diet</option>
                  {EDAMAM_DIET_LABELS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  Health / Allergy ({selectedHealth.length} selected)
                </label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {EDAMAM_HEALTH_LABELS.map((label) => (
                    <button
                      key={label}
                      onClick={() => toggleHealthLabel(label)}
                      className={`px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                        selectedHealth.includes(label)
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Feedback */}
      {actionFeedback && (
        <div className="bg-gray-50 border border-gray-100 text-gray-600 px-4 py-2.5 rounded-lg mb-4 text-xs text-center">
          {actionFeedback}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-300">
          <Loader2 size={24} className="animate-spin" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">
            {results.length} recipes shown{totalResults > results.length ? ` of ${totalResults.toLocaleString()} total` : ""}
          </p>
          {results.map((recipe) => (
            <div key={recipe.id}>
              <div
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleLoadDetail(recipe)}
              >
                <img
                  src={recipe.thumbnail}
                  alt={recipe.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{recipe.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {recipe.category || recipe.area || "Tap to view details"}
                    {recipe.source === "edamam" && recipe.calories ? ` · ${recipe.calories} cal` : ""}
                  </p>
                </div>
                {loadingDetail === recipe.id ? (
                  <Loader2 size={16} className="animate-spin text-gray-300" />
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(recipe, "maybe"); }}
                      className="px-2.5 py-1.5 bg-gray-900 text-white rounded-md text-[10px] font-medium hover:bg-gray-800"
                    >
                      Maybe
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(recipe, "never"); }}
                      className="p-1.5 bg-gray-50 text-gray-300 rounded-md hover:text-red-400 hover:bg-red-50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {expandedRecipe === recipe.id && (recipe.instructions || recipe.source === "edamam") && (
                <div className="mt-1">
                  <RecipeCard recipe={recipe} showActions={false} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && activeFilterCount === 0 && !searchQuery && (
        <div className="text-center py-20 text-gray-300">
          <Search size={40} className="mx-auto mb-3" />
          <p className="text-sm">Search by name, ingredient, or use filters</p>
          {edamamAvailable && (
            <p className="text-xs mt-1">Try dietary filters like gluten-free or vegan</p>
          )}
        </div>
      )}

      {!loading && results.length === 0 && (searchQuery || activeFilterCount > 0) && (
        <div className="text-center py-20 text-gray-300">
          <p className="text-sm">No recipes found. Try different search terms.</p>
        </div>
      )}
    </div>
  );
}
