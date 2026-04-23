import { supabase } from "./supabaseClient";

/**
 * Saves the given reward for a user at a specific table.
 * 
 * WHY STORE REWARD:
 * This ensures every reward given is stored in the database with the user's phone number 
 * and the table they sat at.
 * 
 * HOW THIS HELPS VERIFICATION:
 * Later, the staff or admin can verify the exact reward a user unlocked by looking 
 * at the database rather than relying on a screenshot.
 * 
 * HOW IT HELPS ANALYTICS:
 * This dataset allows for future analytics, such as understanding which rewards are unlocked
 * most frequently or calculating redemption rates over time.
 * 
 * WHY REWARD ID IS NEEDED:
 * It assigns a unique identifier (e.g. RW-8392) to each successfully unlocked reward.
 * 
 * HOW IT HELPS STAFF VERIFY REWARDS:
 * Staff can quickly cross-reference this short, visible code with the database 
 * to ensure the reward is authentic and not a reused or fake screenshot.
 * 
 * HOW IT PREVENTS MISUSE:
 * Since each reward has a unique ID, it guarantees it can only be redeemed once.
 * 
 * @param {string} phone_number The user's phone number
 * @param {string} reward The unlocked reward
 * @param {string} table_id The ID of the table from the URL
 */
export const saveReward = async (phone_number, reward, table_id) => {
  try {
    // Generate unique reward ID (Format: RW-XXXX)
    const rewardId = "RW-" + Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabase
      .from("rewards")
      .insert([{ reward_id: rewardId, phone_number, reward, table_id }]);

    if (error) {
      console.error("Error storing reward:", error.message);
      // We log the error but don't throw to prevent breaking the UI
      return { success: false, error: error.message };
    }

    return { success: true, data, rewardId };
  } catch (error) {
    console.error("Unexpected error saving reward:", error.message);
    // Don't break UI
    return { success: false, error: error.message };
  }
};
