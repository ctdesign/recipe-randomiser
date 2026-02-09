"use client";

import { useState } from "react";
import { addManualRecipe } from "@/lib/firebase";
import type { Recipe } from "@/types/recipe";

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

      // Reset form
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
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Add Recipe</h1>
      <p className="text-gray-500 text-sm mb-4">Manually add your own recipes</p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
          Recipe saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipe Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="e.g. Chicken Tikka Masala"
          />
        </div>

        {/* Meal type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meal Type
          </label>
          <div className="flex gap-2">
            {(["any", "breakfast", "lunch", "dinner"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mealType === type
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category & Area */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="e.g. Chicken"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuisine
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="e.g. Indian"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL (optional)
          </label>
          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="e.g. spicy, quick, healthy"
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingredients
          </label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={ing.measure}
                  onChange={(e) => updateIngredient(i, "measure", e.target.value)}
                  className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Amount"
                />
                <input
                  type="text"
                  value={ing.ingredient}
                  onChange={(e) => updateIngredient(i, "ingredient", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Ingredient"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIngredientRow(i)}
                    className="px-2 text-red-500 hover:text-red-700"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add ingredient
          </button>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions
          </label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Step by step cooking instructions..."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Recipe"}
        </button>
      </form>
    </div>
  );
}
