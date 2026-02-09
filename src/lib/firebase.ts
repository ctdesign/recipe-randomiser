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
  Timestamp,
} from "firebase/firestore";
import type { Recipe, RecipePreference, MaybeRecipe } from "@/types/recipe";

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

export async function getBlockedRecipeIds(): Promise<Set<string>> {
  const snapshot = await getDocs(collection(db, "blockedRecipes"));
  return new Set(snapshot.docs.map((d) => d.id));
}

export async function blockRecipe(recipeId: string): Promise<void> {
  await setDoc(doc(db, "blockedRecipes", recipeId), {
    blockedAt: Timestamp.now(),
  });
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

// --- Weekly plan ---

export async function getWeeklyPlan(weekStart: string) {
  const docRef = doc(db, "weeklyPlans", weekStart);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveWeeklyPlan(weekStart: string, plan: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db, "weeklyPlans", weekStart), { weekStart, meals: plan });
}
