const CONFIG_GLOBAL = "__40K_TACTICS_SUPABASE_CONFIG__";

function serviceRoleFromJwt(key) {
  const parts = String(key).split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = parts[1].replaceAll("-", "+").replaceAll("_", "/");
    const decoded = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, "="));
    return JSON.parse(decoded)?.role === "service_role";
  } catch {
    return false;
  }
}

export function getPublicSupabaseConfig(source = globalThis) {
  const config = source?.[CONFIG_GLOBAL];
  if (!config || typeof config !== "object") return null;
  const url = String(config.url ?? "").trim();
  const publishableKey = String(config.publishableKey ?? config.anonKey ?? "").trim();
  if (!url || !publishableKey) return null;
  return Object.freeze({ url, publishableKey });
}

/**
 * Build a browser-safe Supabase client from public configuration.
 * Pass the SDK's createClient function or let the browser load the v2 SDK from esm.sh.
 * Never pass a service-role key: browser code is public by definition.
 */
export async function createSupabaseClientFromPublicConfig({
  config = getPublicSupabaseConfig(),
  createClient = null,
  loadClientLibrary = () => import("https://esm.sh/@supabase/supabase-js@2")
} = {}) {
  if (!config || typeof config !== "object") {
    throw new Error("Supabase is not configured. Set window.__40K_TACTICS_SUPABASE_CONFIG__ with the project URL and publishable key.");
  }
  const url = String(config.url ?? "").trim();
  const publishableKey = String(config.publishableKey ?? config.anonKey ?? "").trim();
  if (!url || !publishableKey) {
    throw new TypeError("A Supabase project URL and publishable/anon key are required.");
  }
  let parsedUrl;
  try { parsedUrl = new URL(url); } catch {
    throw new TypeError("The Supabase project URL must be a valid HTTPS URL.");
  }
  if (parsedUrl.protocol !== "https:") {
    throw new TypeError("The Supabase project URL must use HTTPS.");
  }
  if (/service[_-]?role/i.test(publishableKey) || serviceRoleFromJwt(publishableKey)) {
    throw new Error("A service-role key is forbidden in browser code. Use the project's publishable/anon key.");
  }
  let sdkCreateClient = createClient;
  if (typeof sdkCreateClient !== "function") {
    const sdk = await loadClientLibrary();
    sdkCreateClient = sdk?.createClient;
  }
  if (typeof sdkCreateClient !== "function") {
    throw new TypeError("The Supabase JavaScript SDK did not provide createClient.");
  }
  return sdkCreateClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}
