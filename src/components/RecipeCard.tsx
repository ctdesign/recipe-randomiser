"use client";

import type { Recipe, RecipeAction } from "@/types/recipe";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Youtube, X, Trash2 } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  onAction?: (action: RecipeAction) => void;
  showActions?: boolean;
  compact?: boolean;
  onRemove?: () => void;
}

export default function RecipeCard({
  recipe,
  onAction,
  showActions = true,
  compact = false,
  onRemove,
}: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      {/* Image */}
      <div className="relative">
        <img
          src={recipe.thumbnail}
          alt={recipe.name}
          className={`w-full object-cover ${compact ? "h-40" : "h-52"}`}
        />
        <div className="absolute top-3 right-3 flex gap-1.5">
          {recipe.source === "manual" && (
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full">
              Manual
            </span>
          )}
          {recipe.mealType && recipe.mealType !== "any" && (
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-medium px-2 py-1 rounded-full capitalize">
              {recipe.mealType}
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
          <h3 className="text-white font-semibold text-lg leading-tight">{recipe.name}</h3>
          <p className="text-white/70 text-xs mt-0.5">
            {recipe.category}{recipe.area ? ` · ${recipe.area}` : ""}
          </p>
        </div>
      </div>

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-50 text-gray-500 text-[10px] px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Expandable details */}
      {!compact && recipe.ingredients.length > 0 && (
        <div className="px-4 pt-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
          >
            {showDetails ? (
              <>Hide details <ChevronUp size={14} /></>
            ) : (
              <>Show ingredients & instructions <ChevronDown size={14} /></>
            )}
          </button>

          {showDetails && (
            <div className="mt-3 space-y-4 pb-1">
              <div>
                <h4 className="font-medium text-xs text-gray-400 uppercase tracking-wide mb-2">
                  Ingredients
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-gray-400 min-w-[80px] text-right">{ing.measure}</span>
                      <span>{ing.ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-xs text-gray-400 uppercase tracking-wide mb-2">
                  Instructions
                </h4>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {recipe.instructions}
                </p>
              </div>
              <div className="flex gap-3">
                {recipe.youtubeUrl && (
                  <a
                    href={recipe.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <Youtube size={14} /> YouTube
                  </a>
                )}
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink size={14} /> Source
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestion action buttons */}
      {showActions && onAction && (
        <div className="p-4 flex gap-2">
          <button
            onClick={() => onAction("maybe")}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium text-sm transition-colors active:scale-[0.98]"
          >
            Maybe
          </button>
          <button
            onClick={() => onAction("not_now")}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 px-4 rounded-lg font-medium text-sm transition-colors active:scale-[0.98]"
          >
            Not Now
          </button>
          <button
            onClick={() => onAction("never")}
            className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 py-3 px-4 rounded-lg font-medium text-sm transition-colors active:scale-[0.98]"
          >
            <X size={16} /> Hide
          </button>
        </div>
      )}

      {/* Maybe list actions */}
      {onRemove && (
        <div className="px-4 pb-4">
          <button
            onClick={onRemove}
            className="flex items-center justify-center gap-1.5 w-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 py-2.5 rounded-lg text-xs font-medium transition-colors"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}
