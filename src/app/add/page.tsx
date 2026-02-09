"use client";

import { useState } from "react";
import { addManualRecipe } from "@/lib/firebase";
import type { Recipe } from "@/types/recipe";
import { Check, Plus, X } from "lucide-react";

export default function AddRecipePage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "any">("any");
  const [area, setArea] = useState("");
  const [instructions, setInstructions] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [tags, setTags] = useState("");
  const [ingredients, setIngredients] = useState([{ ingredient: "", measure: "" }]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addIngredientRow = () => {
    setIngredients([...ingredients, { ingredient: "", measure: "" }]);
  };

  const removeIngredientRow = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: "ingredient" | "measure", value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const recipe: Recipe = {
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name: name.trim(),
        category: category.trim() || "Uncategorized",
        area: area.trim(),
        instructions: instructions.trim(),
        thumbnail: thumbnail.trim() || "/placeholder-recipe.svg",
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        ingredients: ingredients.filter((i) => i.ingredient.trim()),
        source: "manual",
        mealType: mealType === "any" ? undefined : mealType,
      };

      await addManualRecipe(recipe);
      setSuccess(true);

      setName("");
      setCategory("");
      setMealType("any");
      setArea("");
      setInstructions("");
      setThumbnail("");
      setTags("");
      setIngredients([{ ingredient: "", measure: "" }]);

      setTimeout(() => setSuccess(false), 3000);
    } catch {
      alert("Failed to save recipe. Check Firebase configuration.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add Recipe</h1>
        <p className="text-gray-400 text-xs mt-0.5">Manually add your own recipes</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 text-gray-600 px-4 py-2.5 rounded-lg mb-4 text-xs">
          <Check size={14} /> Recipe saved successfully
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Recipe Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="e.g. Chicken Tikka Masala"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Meal Type
          </label>
          <div className="flex gap-1.5">
            {(["any", "breakfast", "lunch", "dinner"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  mealType === type
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 border border-gray-100"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="e.g. Chicken"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cuisine</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="e.g. Indian"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Image URL</label>
          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="e.g. spicy, quick, healthy"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={ing.measure}
                  onChange={(e) => updateIngredient(i, "measure", e.target.value)}
                  className="w-1/3 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={ing.ingredient}
                  onChange={(e) => updateIngredient(i, "ingredient", e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  placeholder="Ingredient"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(i)}
                    className="p-2 text-gray-300 hover:text-red-400"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            <Plus size={14} /> Add ingredient
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
            className="w-full px-3 py-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Step by step cooking instructions..."
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors active:scale-[0.99]"
        >
          {saving ? "Saving..." : "Save Recipe"}
        </button>
      </form>
    </div>
  );
}
