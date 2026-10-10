import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseClientFromPublicConfig, getPublicSupabaseConfig } from "../../src/persistence/supabase-client.js";

test("reads only the public Supabase URL and publishable key from runtime config", () => {
  const config = getPublicSupabaseConfig({
    __40K_TACTICS_SUPABASE_CONFIG__: { url: "https://project.supabase.co", publishableKey: "sb_publishable_example" }
  });
  assert.deepEqual(config, { url: "https://project.supabase.co", publishableKey: "sb_publishable_example" });
  assert.equal(getPublicSupabaseConfig({}), null);
});

test("creates a client with persistent browser auth options", async () => {
  let args;
  const client = { auth: {} };
  const result = await createSupabaseClientFromPublicConfig({
    config: { url: "https://project.supabase.co", publishableKey: "sb_publishable_example" },
    createClient(...values) { args = values; return client; }
  });
  assert.equal(result, client);
  assert.equal(args[0], "https://project.supabase.co");
  assert.equal(args[1], "sb_publishable_example");
  assert.deepEqual(args[2], { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
});

test("rejects missing configuration, insecure URLs, and service-role keys", async () => {
  await assert.rejects(() => createSupabaseClientFromPublicConfig({ config: null }), /not configured/);
  await assert.rejects(() => createSupabaseClientFromPublicConfig({
    config: { url: "http://project.supabase.co", publishableKey: "sb_publishable_example" },
    createClient() {}
  }), /HTTPS/);
  await assert.rejects(() => createSupabaseClientFromPublicConfig({
    config: { url: "https://project.supabase.co", publishableKey: "service_role_secret" },
    createClient() {}
  }), /service-role key is forbidden/);
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  const key = "eyJhbGciOiJub25lIn0." + payload + ".signature";
  await assert.rejects(() => createSupabaseClientFromPublicConfig({
    config: { url: "https://project.supabase.co", publishableKey: key },
    createClient() {}
  }), /service-role key is forbidden/);
});

test("can load the SDK through an injected loader", async () => {
  let loaded = false;
  const result = await createSupabaseClientFromPublicConfig({
    config: { url: "https://project.supabase.co", anonKey: "public-anon-key" },
    async loadClientLibrary() {
      loaded = true;
      return { createClient: () => "mock-client" };
    }
  });
  assert.equal(loaded, true);
  assert.equal(result, "mock-client");
});
