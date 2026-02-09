"use client";

import { useState, useEffect } from "react";
import { getBlockedRecipeIds, unblockRecipe, getRecentHistory } from "@/lib/firebase";

export default function SettingsPage() {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [blocked, history] = await Promise.all([
          getBlockedRecipeIds(),
          getRecentHistory(),
        ]);
        setBlockedIds(Array.from(blocked));
        setHistoryCount(history.length);
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
    setBlockedIds((prev) => prev.filter((i) => i !== id));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Settings</h1>
      <p className="text-gray-500 text-sm mb-6">Manage your preferences</p>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{historyCount}</div>
                <div className="text-xs text-gray-500">Recipes seen</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{blockedIds.length}</div>
                <div className="text-xs text-gray-500">Blocked recipes</div>
              </div>
            </div>
          </div>

          {/* Blocked recipes */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800 mb-3">
              Blocked Recipes ({blockedIds.length})
            </h2>
            {blockedIds.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No blocked recipes. Recipes you mark as &quot;Don&apos;t Show&quot; will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {blockedIds.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-600 truncate flex-1">{id}</span>
                    <button
                      onClick={() => handleUnblock(id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full ml-2"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Firebase setup info */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <h2 className="font-semibold text-blue-800 mb-2">Firebase Setup</h2>
            <p className="text-sm text-blue-700 mb-2">
              This app requires a Firebase project. Create a{" "}
              <code className="bg-blue-100 px-1 rounded">.env.local</code> file with:
            </p>
            <pre className="bg-blue-100 rounded-lg p-3 text-xs text-blue-800 overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
