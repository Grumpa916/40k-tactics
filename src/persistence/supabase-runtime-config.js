/**
 * Public runtime configuration for the dedicated 40K Tactics V2 Supabase project.
 *
 * This publishable key is intended for browser use. Database access must remain
 * protected by authenticated sessions and RLS; never put a service-role key here.
 *
 * Import and call installV2SupabasePublicConfig() from the integrated application
 * entry point when that entry point is ready. The Fight demo index.html is
 * intentionally not changed by this module.
 */
export const V2_SUPABASE_PUBLIC_CONFIG = Object.freeze({
  url: "https://izsanstismvgclowffuq.supabase.co",
  publishableKey: "sb_publishable_a2j57fMQj296YFebxARx_g_mKc_JTVN"
});

export function installV2SupabasePublicConfig(target = globalThis) {
  if (!target || (typeof target !== "object" && typeof target !== "function")) {
    throw new TypeError("A runtime configuration target is required.");
  }
  target.__40K_TACTICS_SUPABASE_CONFIG__ = V2_SUPABASE_PUBLIC_CONFIG;
  return V2_SUPABASE_PUBLIC_CONFIG;
}
