import { installV2SupabasePublicConfig } from "../persistence/supabase-runtime-config.js";
import { createSupabaseClientFromPublicConfig } from "../persistence/supabase-client.js";
import { createSupabaseBattleStore } from "../persistence/supabase-battle-store.js";
import { createSupabaseAuthPanel } from "./supabase-auth-panel.js";
import { createGameState } from "../state/game-state.js";

async function initializeCloudSmokeTest() {
  const status = document.getElementById("test-status");
  const runButton = document.getElementById("run-test");
  const deleteButton = document.getElementById("delete-test");
  const nameInput = document.getElementById("test-name");
  let store = null;
  let signedIn = false;
  let testRecordId = null;
  const report = (message) => { if (status) status.textContent = message; };

  try {
    installV2SupabasePublicConfig(window);
    const client = await createSupabaseClientFromPublicConfig();
    store = createSupabaseBattleStore(client);
    createSupabaseAuthPanel(document.getElementById("auth-panel"), {
      client,
      onAuthChange(user) {
        signedIn = Boolean(user);
        runButton.disabled = !signedIn;
        deleteButton.disabled = !signedIn || !testRecordId;
        report(signedIn ? "Owner signed in. Ready to test save, load, update, and delete."
          : "Sign in with the owner account to run the cloud test.");
      }
    });
  } catch (error) {
    report("Could not initialize Supabase: " + (error?.message ?? String(error)));
    return;
  }

  runButton.addEventListener("click", async () => {
    if (!store || !signedIn) return;
    runButton.disabled = true;
    deleteButton.disabled = true;
    testRecordId = null;
    let createdId = null;
    try {
      const name = String(nameInput.value ?? "").trim() || "V2 cloud smoke test";
      const initialState = createGameState({
        phase: "setup", turn: 0,
        players: [{ id: "smoke-owner", name: "Smoke Test Owner" }],
        history: [{ type: "cloud-smoke-test", payload: { marker: "saved-v1" } }]
      });
      const saved = await store.save({ name, state: initialState });
      createdId = saved.id;
      testRecordId = saved.id;
      const loaded = await store.load(saved.id);
      if (loaded.game_state.history?.[0]?.payload?.marker !== "saved-v1") {
        throw new Error("The saved snapshot did not round-trip as expected.");
      }
      const updatedState = { ...loaded.game_state,
        history: [{ type: "cloud-smoke-test", payload: { marker: "saved-v2" } }] };
      await store.save({ id: saved.id, name: name + " (updated)", state: updatedState });
      const updated = await store.load(saved.id);
      if (updated.game_state.history?.[0]?.payload?.marker !== "saved-v2" ||
          updated.name !== name + " (updated)") {
        throw new Error("The updated snapshot did not round-trip as expected.");
      }
      const listed = await store.list();
      if (!listed.some((item) => item.id === saved.id)) {
        throw new Error("The saved record was not present in the owner's save list.");
      }
      report("PASS: save, load, update, and list succeeded. Tap Delete test save to remove the disposable record.");
    } catch (error) {
      if (createdId && signedIn) {
        try { await store.remove(createdId); } catch { /* Preserve the original test failure. */ }
      }
      testRecordId = null;
      report("FAIL: " + (error?.message ?? String(error)));
    } finally {
      runButton.disabled = !signedIn;
      deleteButton.disabled = !signedIn || !testRecordId;
    }
  });

  deleteButton.addEventListener("click", async () => {
    if (!store || !signedIn || !testRecordId) return;
    deleteButton.disabled = true;
    try {
      await store.remove(testRecordId);
      testRecordId = null;
      report("PASS: disposable test record deleted.");
    } catch (error) {
      report("Delete failed: " + (error?.message ?? String(error)));
    } finally {
      deleteButton.disabled = !signedIn || !testRecordId;
    }
  });
}

// Keep browser-only behavior inert when Node's test discovery imports this file.
if (typeof document !== "undefined" && typeof window !== "undefined") {
  void initializeCloudSmokeTest();
}
