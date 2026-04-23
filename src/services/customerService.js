import { supabase } from "./supabaseClient";

export const handleCustomer = async (phone) => {
  // 1. FORCE FRESH FETCH (Read latest data directly from the DB)
  // Ensures no cached state gets in the way of reading true cooldown status.
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("phone_number", phone)
    // WHY .maybeSingle() IS IMPORTANT:
    // .single() throws a 406 error when no row exists.
    // .maybeSingle() safely returns data = null instead, allowing us to seamlessly 
    // treat them as a new user inside our CRM flow without breaking the app.
    .maybeSingle();

  // 2. ERROR HANDLING
  // Only treat as error if an actual fetch failure occurred.
  if (error) {
    console.error("Fetch error:", error);
    return { success: false };
  }

  // STEP 2: If user exists → UPDATE LAST VISIT ONLY
  if (data) {
    const now = Date.now();
    const lastPlayed = data.last_visit_date ? new Date(data.last_visit_date).getTime() : 0;
    
    const diffSeconds = (now - lastPlayed) / 1000;
    
    // BACKEND BLOCK
    // Prevents spamming the API directly or bypassing the frontend state block
    if (diffSeconds < 60) {
      return {
        success: false,
        reason: "instant_block"
      };
    }

    // 3. FIX UPDATE QUERY (CRITICAL)
    // Update strictly by primary key ID, to guarantee we target the exact row we read.
    // This entirely removes the risk of interacting with an orphaned duplicate row.
    console.log("Updating row id:", data.id);

    // ALWAYS store directly in UTC standardized ISO format
    const updatedTime = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        last_visit_date: updatedTime,
      })
      .eq("id", data.id);

    if (updateError) {
      console.error("Update failed:", updateError);
      return { success: false };
    }

    console.log("Using updated timestamp:", updatedTime);

    return { 
      success: true, 
      type: "existing",
      last_visit_date: updatedTime
    };
  }

  // STEP 3: If user does NOT exist → INSERT
  const insertTime = new Date().toISOString();
  const { error: insertError } = await supabase
    .from("customers")
    .insert([
      {
        phone_number: phone,
        last_visit_date: insertTime,
      },
    ]);

  if (insertError) {
    console.error("Insert failed:", insertError);
    return { success: false };
  }

  console.log("Using updated timestamp:", insertTime);

  return { 
    success: true, 
    type: "new",
    last_visit_date: insertTime
  };
};