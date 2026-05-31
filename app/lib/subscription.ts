import { supabase } from "./supabase";

export async function getActiveSubscription(userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log("ACTIVE SUBSCRIPTION DATA:", data);
  console.log("ACTIVE SUBSCRIPTION ERROR:", error);

  if (error) return null;

  return data;
}
export function hasPremiumAccess(plan: string | null) {
  if (!plan) return false;

  return ["starter", "boost", "premium"].includes(
    plan.toLowerCase()
  );
}