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
import { addMaybeRecipe, blockRecipe, addToHistory } from "@/lib/firebase";
import type { Recipe, RecipeAction } from "@/types/recipe";
import { Search, Filter, X, Loader2 } from "lucide-react";

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      const [cats, ars] = await Promise.all([getAllCategories(), getAllAreas()]);
      setCategories(cats);
      setAreas(ars);
    };
    loadFilters();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedCategory && !selectedArea) return;
    setLoading(true);
    setResults([]);

    try {
      let meals: Recipe[] = [];

      if (searchQuery.trim()) {
        meals = await searchMeals(searchQuery.trim());
      } else if (selectedCategory) {
        meals = await getMealsByCategory(selectedCategory);
      } else if (selectedArea) {
        meals = await getMealsByArea(selectedArea);
      }

      // Apply secondary filters on search results
      if (searchQuery.trim() && selectedCategory) {
        meals = meals.filter((m) => m.category === selectedCategory);
      }
      if (searchQuery.trim() && selectedArea) {
        meals = meals.filter((m) => m.area === selectedArea);
      }

      setResults(meals);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDetail = async (recipe: Recipe) => {
    if (recipe.instructions) {
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
        // Ensure we have full details
        let fullRecipe = recipe;
        if (!recipe.instructions) {
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

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedArea("");
    setSearchQuery("");
    setResults([]);
  };

  const hasActiveFilters = !!selectedCategory || !!selectedArea;

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Browse</h1>
        <p className="text-gray-400 text-xs mt-0.5">
          Search and explore the recipe database
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search recipes..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
            hasActiveFilters
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-100 text-gray-500"
          }`}
        >
          <Filter size={14} />
          {hasActiveFilters && (
            <span className="bg-white text-gray-900 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {(selectedCategory ? 1 : 0) + (selectedArea ? 1 : 0)}
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
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filters</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Category</label>
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
            <label className="block text-xs text-gray-500 mb-1.5">Cuisine</label>
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
          <p className="text-xs text-gray-400">{results.length} recipes found</p>
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
              {expandedRecipe === recipe.id && recipe.instructions && (
                <div className="mt-1">
                  <RecipeCard recipe={recipe} showActions={false} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !searchQuery && !selectedCategory && !selectedArea && (
        <div className="text-center py-20 text-gray-300">
          <Search size={40} className="mx-auto mb-3" />
          <p className="text-sm">Search by name, or filter by category and cuisine</p>
        </div>
      )}

      {!loading && results.length === 0 && (searchQuery || selectedCategory || selectedArea) && (
        <div className="text-center py-20 text-gray-300">
          <p className="text-sm">No recipes found. Try different search terms.</p>
        </div>
      )}
    </div>
  );
}
