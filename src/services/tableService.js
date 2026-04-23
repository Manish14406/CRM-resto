import { supabase } from "./supabaseClient";

/**
 * tableService.js
 * 
 * IMPORTANT:
 * - WHY SINGLE SOURCE OF TRUTH IS IMPORTANT:
 *   By removing the cooldown logic from this file, we ensure that the cooldown state 
 *   (last_visit_date) is only managed and evaluated in ONE place (customerService.js).
 * - WHY MULTIPLE COOLDOWN CHECKS BREAK LOGIC:
 *   Previously, tableService checked the OLD last_visit_date (or last_played_at) while 
 *   customerService updated the NEW last_visit_date. Having two separate systems checking 
 *   timers resulted in inconsistency, race conditions, and made the cooldown never work correctly.
 * 
 * This service now strictly handles table session tracking for data purposes.
 */

export const handleTable = async (tableId) => {
  if (!tableId) return { success: true };

  // 1. SELECT TABLE ROW
  const { data, error: fetchError } = await supabase
    .from("table_sessions")
    .select("*")
    .eq("table_id", tableId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching table session:", fetchError);
    return { success: false, reason: "database_error" };
  }

  // 2. CHECK COOLDOWN
  const now = Date.now();
  if (data) {
    const lastPlayed = new Date(data.last_played_at).getTime();
    const diff = (now - lastPlayed) / (1000 * 60);

    if (diff < 30) {
      return { success: false, reason: "table_cooldown" };
    }

    // 3. UPDATE IMMEDIATELY
    const newTime = new Date().toISOString();
    await supabase
      .from("table_sessions")
      .update({ last_played_at: newTime })
      .eq("id", data.id);
  } else {
    // INSERT new row if not exists
    const newTime = new Date().toISOString();
    await supabase
      .from("table_sessions")
      .insert([{ table_id: tableId, last_played_at: newTime }]);
  }

  // 4. RETURN RESULT
  return { success: true };
};

export const resetTableSession = async (tableId) => {
  if (!tableId) return;
  await supabase
    .from("table_sessions")
    .delete()
    .eq("table_id", tableId);
};
