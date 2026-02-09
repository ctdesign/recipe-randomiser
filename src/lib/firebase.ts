import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import type {
  Recipe,
  RecipePreference,
  MaybeRecipe,
  BlockedRecipe,
  UserPreferences,
} from "@/types/recipe";
import { DEFAULT_PREFERENCES } from "@/types/recipe";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// --- Blocked recipes (Don't Show Again) ---

export async function getBlockedRecipes(): Promise<BlockedRecipe[]> {
  const snapshot = await getDocs(collection(db, "blockedRecipes"));
  return snapshot.docs.map((d) => d.data() as BlockedRecipe);
}

export async function getBlockedRecipeIds(): Promise<Set<string>> {
  const blocked = await getBlockedRecipes();
  return new Set(blocked.map((b) => b.id));
}

export async function blockRecipe(recipeId: string, recipeName: string): Promise<void> {
  await setDoc(doc(db, "blockedRecipes", recipeId), {
    id: recipeId,
    name: recipeName,
    blockedAt: Date.now(),
  } satisfies BlockedRecipe);
}

export async function unblockRecipe(recipeId: string): Promise<void> {
  await deleteDoc(doc(db, "blockedRecipes", recipeId));
}

// --- Maybe list ---

export async function getMaybeRecipes(): Promise<MaybeRecipe[]> {
  const snapshot = await getDocs(
    query(collection(db, "maybeRecipes"), orderBy("addedAt", "desc"))
  );
  return snapshot.docs.map((d) => d.data() as MaybeRecipe);
}

export async function addMaybeRecipe(recipe: Recipe): Promise<void> {
  await setDoc(doc(db, "maybeRecipes", recipe.id), {
    recipe,
    addedAt: Date.now(),
  } satisfies MaybeRecipe);
}

export async function removeMaybeRecipe(recipeId: string): Promise<void> {
  await deleteDoc(doc(db, "maybeRecipes", recipeId));
}

// --- Recent history ---

export async function getRecentHistory(): Promise<RecipePreference[]> {
  const snapshot = await getDocs(
    query(collection(db, "recentHistory"), orderBy("timestamp", "desc"))
  );
  return snapshot.docs.map((d) => d.data() as RecipePreference);
}

export async function addToHistory(
  recipeId: string,
  action: RecipePreference["action"]
): Promise<void> {
  await setDoc(doc(db, "recentHistory", recipeId), {
    recipeId,
    action,
    timestamp: Date.now(),
  } satisfies RecipePreference);
}

// --- Manual recipes ---

export async function getManualRecipes(): Promise<Recipe[]> {
  const snapshot = await getDocs(collection(db, "manualRecipes"));
  return snapshot.docs.map((d) => d.data() as Recipe);
}

export async function addManualRecipe(recipe: Recipe): Promise<void> {
  await setDoc(doc(db, "manualRecipes", recipe.id), recipe);
}

export async function deleteManualRecipe(recipeId: string): Promise<void> {
  await deleteDoc(doc(db, "manualRecipes", recipeId));
}

// --- Meal plan ---

export async function getMealPlan(planId: string) {
  const docRef = doc(db, "mealPlans", planId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveMealPlan(planId: string, plan: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db, "mealPlans", planId), plan);
}

// --- User preferences ---

export async function getUserPreferences(): Promise<UserPreferences> {
  const docRef = doc(db, "settings", "preferences");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { ...DEFAULT_PREFERENCES, ...snapshot.data() } as UserPreferences;
  }
  return DEFAULT_PREFERENCES;
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  await setDoc(doc(db, "settings", "preferences"), prefs);
}
