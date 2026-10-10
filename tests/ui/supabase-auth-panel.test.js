import test from "node:test";
import assert from "node:assert/strict";
import { createSupabaseAuthPanel } from "../../src/ui/supabase-auth-panel.js";

function makeContainer() {
  const listeners = new Map();
  let html = "";
  return {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
    },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    contains() { return true; },
    replaceChildren() { html = ""; },
    set innerHTML(value) { html = value; },
    get innerHTML() { return html; },
    emit(type, event) { for (const listener of listeners.get(type) ?? []) listener(event); }
  };
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

test("auth panel reports an existing signed-in owner and offers sign out", async () => {
  const container = makeContainer();
  const updates = [];
  const client = { auth: {
    async getUser() { return { data: { user: { id: "owner-1", email: "owner@example.com" } }, error: null }; },
    async signInWithPassword() { throw new Error("unused"); },
    async signOut() { return { error: null }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }
  }};
  const panel = createSupabaseAuthPanel(container, { client, onAuthChange: (user) => updates.push(user?.id ?? null) });
  await settle();
  assert.match(container.innerHTML, /Cloud account connected/);
  assert.match(container.innerHTML, /owner@example.com/);
  assert.match(container.innerHTML, /data-supabase-sign-out/);
  assert.ok(updates.includes("owner-1"));
  panel.destroy();
});

test("sign-in calls Supabase with owner credentials and notifies the persistence layer", async () => {
  const container = makeContainer();
  let credentials = null;
  let authChange;
  const updates = [];
  const client = { auth: {
    async getUser() { return { data: { user: null }, error: null }; },
    async signInWithPassword(value) {
      credentials = value;
      return { data: { user: { id: "owner-1", email: value.email } }, error: null };
    },
    async signOut() { return { error: null }; },
    onAuthStateChange(callback) { authChange = callback; return { data: { subscription: { unsubscribe() {} } } }; }
  }};
  const panel = createSupabaseAuthPanel(container, { client, onAuthChange: (user) => updates.push(user?.id ?? null) });
  await settle();
  container.emit("submit", {
    target: {
      closest(selector) { return selector === "[data-supabase-sign-in]" ? this : null; },
      querySelector(selector) {
        if (selector === '[name="email"]') return { value: " owner@example.com " };
        if (selector === '[name="password"]') return { value: "correct-horse-battery-staple" };
        return null;
      }
    },
    preventDefault() {}
  });
  await settle();
  assert.deepEqual(credentials, { email: "owner@example.com", password: "correct-horse-battery-staple" });
  assert.ok(updates.includes("owner-1"));
  assert.match(container.innerHTML, /Cloud account connected/);
  authChange?.("SIGNED_OUT", null);
  assert.match(container.innerHTML, /Owner email/);
  panel.destroy();
});

test("failed sign-in leaves cloud access unavailable and displays the error", async () => {
  const container = makeContainer();
  const client = { auth: {
    async getUser() { return { data: { user: null }, error: null }; },
    async signInWithPassword() { return { data: {}, error: new Error("Invalid login credentials") }; },
    async signOut() { return { error: null }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; }
  }};
  const panel = createSupabaseAuthPanel(container, { client });
  await settle();
  container.emit("submit", {
    target: {
      closest(selector) { return selector === "[data-supabase-sign-in]" ? this : null; },
      querySelector(selector) {
        return selector === '[name="email"]' ? { value: "owner@example.com" } :
          selector === '[name="password"]' ? { value: "wrong" } : null;
      }
    },
    preventDefault() {}
  });
  await settle();
  assert.match(container.innerHTML, /Invalid login credentials/);
  assert.match(container.innerHTML, /Owner email/);
  panel.destroy();
});
