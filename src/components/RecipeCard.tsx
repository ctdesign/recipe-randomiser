"use client";

import type { Recipe, RecipeAction } from "@/types/recipe";
import { useState } from "react";

interface RecipeCardProps {
  recipe: Recipe;
  onAction?: (action: RecipeAction) => void;
  showActions?: boolean;
  compact?: boolean;
  onRemove?: () => void;
  onAddToPlan?: () => void;
}

export default function RecipeCard({
  recipe,
  onAction,
  showActions = true,
  compact = false,
  onRemove,
  onAddToPlan,
}: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      {/* Image */}
      <div className="relative">
        <img
          src={recipe.thumbnail}
          alt={recipe.name}
          className={`w-full object-cover ${compact ? "h-40" : "h-56"}`}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {recipe.source === "manual" && (
            <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
              Manual
            </span>
          )}
          {recipe.mealType && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full capitalize">
              {recipe.mealType}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-bold text-lg">{recipe.name}</h3>
          <p className="text-white/80 text-sm">
            {recipe.category} {recipe.area ? `· ${recipe.area}` : ""}
          </p>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients preview */}
      {!compact && recipe.ingredients.length > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showDetails ? "Hide details" : "Show ingredients & instructions"}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">
                  Ingredients
                </h4>
                <ul className="text-sm text-gray-600 space-y-0.5">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.measure} {ing.ingredient}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-1">
                  Instructions
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {recipe.instructions}
                </p>
              </div>
              {recipe.youtubeUrl && (
                <a
                  href={recipe.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-red-600 hover:text-red-800"
                >
                  Watch on YouTube
                </a>
              )}
              {recipe.sourceUrl && (
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-blue-600 hover:text-blue-800 ml-3"
                >
                  View source recipe
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {showActions && onAction && (
        <div className="p-4 flex gap-2">
          <button
            onClick={() => onAction("maybe")}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
          >
            Maybe
          </button>
          <button
            onClick={() => onAction("not_now")}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={() => onAction("never")}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
          >
            Don&apos;t Show
          </button>
        </div>
      )}

      {/* Maybe list / planner actions */}
      {(onRemove || onAddToPlan) && (
        <div className="p-4 flex gap-2">
          {onAddToPlan && (
            <button
              onClick={onAddToPlan}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
            >
              Add to Plan
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
